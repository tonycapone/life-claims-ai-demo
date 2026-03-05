from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from passlib.context import CryptContext
from app.database import get_db
from app.models import Claim, ClaimStatus, Adjuster
from app.auth import create_access_token, get_current_adjuster
from app.ai import stream_copilot, draft_communication

router = APIRouter()

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


class LoginRequest(BaseModel):
    username: str
    password: str


class ActionRequest(BaseModel):
    action: str  # approve, deny, escalate, request_docs, assign, note
    notes: Optional[str] = None
    document_type: Optional[str] = None
    assignee: Optional[str] = None
    denial_reason: Optional[str] = None


class ChatRequest(BaseModel):
    claim_id: str
    message: str


class DraftRequest(BaseModel):
    claim_id: str
    draft_type: str


def _claim_to_dict(claim: Claim) -> dict:
    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "policy_number": claim.policy_number,
        "insured_name": claim.insured_name,
        "insured_dob": claim.insured_dob,
        "policy_issue_date": claim.policy_issue_date,
        "face_amount": claim.face_amount,
        "beneficiary_name": claim.beneficiary_name,
        "beneficiary_email": claim.beneficiary_email,
        "beneficiary_phone": claim.beneficiary_phone,
        "beneficiary_relationship": claim.beneficiary_relationship,
        "identity_verified": claim.identity_verified,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
        "death_certificate_extracted": claim.death_certificate_extracted,
        "payout_method": claim.payout_method,
        "status": claim.status.value if claim.status else None,
        "risk_level": claim.risk_level.value if claim.risk_level else None,
        "risk_flags": claim.risk_flags,
        "contestability_alert": claim.contestability_alert,
        "months_since_issue": claim.months_since_issue,
        "ai_summary": claim.ai_summary,
        "assigned_adjuster": claim.assigned_adjuster,
        "adjuster_notes": claim.adjuster_notes,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
    }


def _days_open(claim: Claim) -> int:
    if not claim.created_at:
        return 0
    return (datetime.utcnow() - claim.created_at.replace(tzinfo=None)).days


@router.post("/login")
def adjuster_login(req: LoginRequest, db: Session = Depends(get_db)):
    adjuster = db.query(Adjuster).filter(Adjuster.username == req.username).first()
    if not adjuster:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not pwd_context.verify(req.password, adjuster.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(adjuster.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "adjuster": {
            "username": adjuster.username,
            "full_name": adjuster.full_name,
            "email": adjuster.email,
        },
    }


@router.get("/claims")
def get_claims_queue(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_adjuster: Adjuster = Depends(get_current_adjuster),
):
    q = db.query(Claim).filter(Claim.status != ClaimStatus.DRAFT)
    if status:
        try:
            q = q.filter(Claim.status == ClaimStatus(status))
        except ValueError:
            pass
    if risk_level:
        from app.models import RiskLevel
        try:
            q = q.filter(Claim.risk_level == RiskLevel(risk_level))
        except ValueError:
            pass
    if assigned_to == "me":
        q = q.filter(Claim.assigned_adjuster == current_adjuster.username)
    elif assigned_to == "unassigned":
        q = q.filter(Claim.assigned_adjuster == None)
    claims = q.order_by(desc(Claim.created_at)).all()

    result = []
    for c in claims:
        result.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "beneficiary_name": c.beneficiary_name or "",
            "insured_name": c.insured_name,
            "face_amount": c.face_amount,
            "submitted_at": c.created_at.isoformat() if c.created_at else None,
            "policy_age_months": round(c.months_since_issue or 0),
            "status": c.status.value if c.status else None,
            "risk_level": c.risk_level.value if c.risk_level else None,
            "contestability_alert": c.contestability_alert,
            "assigned_adjuster": c.assigned_adjuster,
            "days_open": _days_open(c),
        })
    return result


@router.get("/claims/{claim_id}")
def get_claim_detail(
    claim_id: str,
    db: Session = Depends(get_db),
    current_adjuster: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return _claim_to_dict(claim)


@router.post("/claims/{claim_id}/action")
def take_action(
    claim_id: str,
    req: ActionRequest,
    db: Session = Depends(get_db),
    current_adjuster: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    action_map = {
        "approve": ClaimStatus.APPROVED,
        "deny": ClaimStatus.DENIED,
        "escalate": ClaimStatus.SIU_REVIEW,
        "contestability": ClaimStatus.CONTESTABILITY_REVIEW,
        "request_docs": ClaimStatus.PENDING_DOCUMENTS,
        "under_review": ClaimStatus.UNDER_REVIEW,
    }

    if req.action in action_map:
        claim.status = action_map[req.action]
    if req.action == "assign" and req.assignee:
        claim.assigned_adjuster = req.assignee
    if req.notes:
        existing = claim.adjuster_notes or ""
        ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        claim.adjuster_notes = f"{existing}\n[{ts} - {current_adjuster.full_name}] {req.notes}".strip()

    db.commit()
    db.refresh(claim)
    return _claim_to_dict(claim)


@router.post("/chat")
def adjuster_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_adjuster: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter(Claim.id == req.claim_id).first()
    claim_data = _claim_to_dict(claim) if claim else {}

    def generate():
        for chunk in stream_copilot(claim_data, req.message):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/draft")
def draft_comm(
    req: DraftRequest,
    db: Session = Depends(get_db),
    current_adjuster: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter(Claim.id == req.claim_id).first()
    claim_data = _claim_to_dict(claim) if claim else {}
    body = draft_communication(claim_data, req.draft_type)

    type_subjects = {
        "acknowledgment": "Your Claim Has Been Received",
        "document_request": "Additional Documents Required",
        "approval": "Your Claim Has Been Approved",
        "denial": "Decision on Your Claim",
        "status_update": "Update on Your Claim",
        "medical_records_request": "Medical Records Request",
    }
    subject = type_subjects.get(req.draft_type, "Regarding Your Claim")

    return {"subject": subject, "body": body, "type": req.draft_type}
