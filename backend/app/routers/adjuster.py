from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.hash import sha256_crypt
from app.database import get_db
from app.models import Adjuster, Claim, ClaimStatus, Policy
from app.auth import create_access_token, get_current_adjuster

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class ActionRequest(BaseModel):
    action: str
    notes: Optional[str] = None
    document_type: Optional[str] = None
    assignee: Optional[str] = None


class ChatRequest(BaseModel):
    claim_id: str
    message: str


class DraftRequest(BaseModel):
    claim_id: str
    draft_type: str


ACTION_STATUS_MAP = {
    "approve": ClaimStatus.APPROVED,
    "deny": ClaimStatus.DENIED,
    "escalate": ClaimStatus.SIU_REVIEW,
    "request_docs": ClaimStatus.PENDING_DOCUMENTS,
    "contestability": ClaimStatus.CONTESTABILITY_REVIEW,
    "review": ClaimStatus.UNDER_REVIEW,
}


@router.post("/login")
def adjuster_login(req: LoginRequest, db: Session = Depends(get_db)):
    adjuster = db.query(Adjuster).filter(Adjuster.username == req.username).first()
    if not adjuster:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not sha256_crypt.verify(req.password, adjuster.hashed_password):
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
    current_adjuster: Adjuster = Depends(get_current_adjuster),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

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
        q = q.filter(Claim.assigned_adjuster.is_(None))

    claims = q.order_by(Claim.created_at.desc()).all()

    # Enrich with policy_age_months and days_open
    result = []
    now = datetime.now(timezone.utc)
    for c in claims:
        # Get policy for face amount if not on claim
        policy = db.query(Policy).filter(Policy.policy_number == c.policy_number).first()
        face_amount = c.face_amount or (policy.face_amount if policy else 0)

        created = c.created_at
        if created.tzinfo is None:
            from datetime import timezone
            created = created.replace(tzinfo=timezone.utc)
        days_open = (now - created).days

        result.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "beneficiary_name": c.beneficiary_name,
            "insured_name": c.insured_name,
            "face_amount": face_amount,
            "submitted_at": c.created_at.isoformat() if c.created_at else None,
            "policy_age_months": c.months_since_issue or 0,
            "status": c.status,
            "risk_level": c.risk_level,
            "contestability_alert": c.contestability_alert or False,
            "assigned_adjuster": c.assigned_adjuster,
            "days_open": days_open,
        })

    return result


@router.get("/claims/{claim_id}")
def get_claim_detail(
    claim_id: str,
    current_adjuster: Adjuster = Depends(get_current_adjuster),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    policy = db.query(Policy).filter(Policy.policy_number == claim.policy_number).first()

    return {
        "id": claim.id,
        "claim_number": claim.claim_number,
        "policy_number": claim.policy_number,
        "insured_name": claim.insured_name,
        "insured_dob": claim.insured_dob,
        "face_amount": claim.face_amount or (policy.face_amount if policy else None),
        "policy_issue_date": claim.policy_issue_date or (policy.issue_date if policy else None),
        "beneficiary_name": claim.beneficiary_name,
        "beneficiary_email": claim.beneficiary_email,
        "beneficiary_phone": claim.beneficiary_phone,
        "beneficiary_relationship": claim.beneficiary_relationship,
        "identity_verified": claim.identity_verified,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
        "death_certificate_url": claim.death_certificate_url,
        "death_certificate_extracted": claim.death_certificate_extracted,
        "payout_method": claim.payout_method,
        "status": claim.status,
        "risk_level": claim.risk_level,
        "risk_flags": claim.risk_flags,
        "contestability_alert": claim.contestability_alert,
        "months_since_issue": claim.months_since_issue,
        "ai_summary": claim.ai_summary,
        "assigned_adjuster": claim.assigned_adjuster,
        "adjuster_notes": claim.adjuster_notes,
        "created_at": claim.created_at.isoformat() if claim.created_at else None,
        "updated_at": claim.updated_at.isoformat() if claim.updated_at else None,
        "policy": {
            "policy_number": policy.policy_number,
            "insured_name": policy.insured_name,
            "insured_dob": policy.insured_dob,
            "face_amount": policy.face_amount,
            "issue_date": policy.issue_date,
            "policy_type": policy.policy_type,
            "status": policy.status,
            "beneficiaries": policy.beneficiaries,
        } if policy else None,
    }


@router.post("/claims/{claim_id}/action")
def claim_action(
    claim_id: str,
    req: ActionRequest,
    current_adjuster: Adjuster = Depends(get_current_adjuster),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    new_status = ACTION_STATUS_MAP.get(req.action)
    if new_status:
        claim.status = new_status

    if req.notes:
        existing = claim.adjuster_notes or ""
        from datetime import datetime
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        claim.adjuster_notes = f"{existing}\n[{timestamp} - {current_adjuster.full_name}] {req.notes}".strip()

    if req.action == "assign" and req.assignee:
        claim.assigned_adjuster = req.assignee
    elif not claim.assigned_adjuster:
        claim.assigned_adjuster = current_adjuster.username

    db.commit()
    db.refresh(claim)
    return claim


@router.post("/chat")
def adjuster_chat(
    req: ChatRequest,
    current_adjuster: Adjuster = Depends(get_current_adjuster),
    db: Session = Depends(get_db),
):
    from app.ai import stream_copilot

    claim = db.query(Claim).filter(Claim.id == req.claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_data = {
        "claim_number": claim.claim_number,
        "insured_name": claim.insured_name,
        "beneficiary_name": claim.beneficiary_name,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "policy_number": claim.policy_number,
        "months_since_issue": claim.months_since_issue,
        "contestability_alert": claim.contestability_alert,
        "risk_level": claim.risk_level,
        "risk_flags": claim.risk_flags,
        "ai_summary": claim.ai_summary,
    }

    def event_generator():
        for chunk in stream_copilot(claim_data, req.message):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/plain")


@router.post("/draft")
def draft_communication(
    req: DraftRequest,
    current_adjuster: Adjuster = Depends(get_current_adjuster),
    db: Session = Depends(get_db),
):
    from app.ai import draft_communication as ai_draft

    claim = db.query(Claim).filter(Claim.id == req.claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_data = {
        "claim_number": claim.claim_number,
        "insured_name": claim.insured_name,
        "beneficiary_name": claim.beneficiary_name,
        "beneficiary_email": claim.beneficiary_email,
        "policy_number": claim.policy_number,
        "months_since_issue": claim.months_since_issue,
        "contestability_alert": claim.contestability_alert,
        "risk_level": claim.risk_level,
        "date_of_death": claim.date_of_death,
    }

    body = ai_draft(claim_data, req.draft_type)
    lines = body.strip().split("\n")
    subject = ""
    letter_body = body
    for i, line in enumerate(lines):
        if line.startswith("Subject:"):
            subject = line.replace("Subject:", "").strip()
            letter_body = "\n".join(lines[i + 1:]).strip()
            break

    return {"subject": subject, "body": letter_body}
