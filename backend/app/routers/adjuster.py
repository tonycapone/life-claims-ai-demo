from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from app.database import get_db
from app.models import Claim, ClaimStatus, RiskLevel, Adjuster
from app.auth import create_access_token, get_current_adjuster
from app.ai import stream_copilot, draft_communication
import json

router = APIRouter()
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# ── Auth ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    adjuster = db.query(Adjuster).filter_by(username=req.username).first()
    if not adjuster or not pwd_context.verify(req.password, adjuster.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(adjuster.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "adjuster": {"username": adjuster.username, "full_name": adjuster.full_name, "email": adjuster.email},
    }


# ── Claims queue ──────────────────────────────────────────

@router.get("/claims")
def get_claims(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    q = db.query(Claim).filter(Claim.status != ClaimStatus.DRAFT)
    if status:
        q = q.filter(Claim.status == status)
    if risk_level:
        q = q.filter(Claim.risk_level == risk_level)
    if assigned_to:
        q = q.filter(Claim.assigned_adjuster == assigned_to)
    claims = q.order_by(Claim.created_at.desc()).all()

    from datetime import datetime, timezone
    result = []
    for c in claims:
        days_open = 0
        if c.created_at:
            now = datetime.now(timezone.utc)
            created = c.created_at.replace(tzinfo=timezone.utc) if c.created_at.tzinfo is None else c.created_at
            days_open = (now - created).days
        result.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "beneficiary_name": c.beneficiary_name,
            "insured_name": c.insured_name,
            "face_amount": c.face_amount,
            "submitted_at": c.created_at,
            "policy_age_months": c.months_since_issue,
            "status": c.status,
            "risk_level": c.risk_level,
            "contestability_alert": c.contestability_alert,
            "assigned_adjuster": c.assigned_adjuster,
            "days_open": days_open,
        })
    return result


@router.get("/claims/{claim_id}")
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


# ── Actions ───────────────────────────────────────────────

class ActionRequest(BaseModel):
    action: str  # approve|deny|escalate|request_docs|assign
    notes: Optional[str] = None
    document_type: Optional[str] = None
    assignee: Optional[str] = None


STATUS_MAP = {
    "approve": ClaimStatus.APPROVED,
    "deny": ClaimStatus.DENIED,
    "escalate": ClaimStatus.SIU_REVIEW,
    "request_docs": ClaimStatus.PENDING_DOCUMENTS,
    "contestability": ClaimStatus.CONTESTABILITY_REVIEW,
}


@router.post("/claims/{claim_id}/action")
def take_action(
    claim_id: str,
    req: ActionRequest,
    db: Session = Depends(get_db),
    adjuster: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if req.action in STATUS_MAP:
        claim.status = STATUS_MAP[req.action]
    elif req.action == "assign":
        claim.assigned_adjuster = req.assignee or adjuster.username
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

    if req.notes:
        existing = claim.adjuster_notes or ""
        claim.adjuster_notes = f"{existing}\n[{adjuster.username}]: {req.notes}".strip()

    db.commit(); db.refresh(claim)
    return claim


# ── AI Copilot ────────────────────────────────────────────

class ChatRequest(BaseModel):
    claim_id: str
    message: str


@router.post("/chat")
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=req.claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_data = {
        "claim_number": claim.claim_number,
        "insured_name": claim.insured_name,
        "beneficiary_name": claim.beneficiary_name,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
        "policy_number": claim.policy_number,
        "face_amount": claim.face_amount,
        "status": claim.status.value if claim.status else None,
        "risk_level": claim.risk_level.value if claim.risk_level else None,
        "risk_flags": claim.risk_flags,
        "contestability_alert": claim.contestability_alert,
        "months_since_issue": claim.months_since_issue,
        "ai_summary": claim.ai_summary,
        "adjuster_notes": claim.adjuster_notes,
    }

    def event_stream():
        for chunk in stream_copilot(claim_data, req.message):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Draft Communication ───────────────────────────────────

class DraftRequest(BaseModel):
    claim_id: str
    draft_type: str  # acknowledgment|document_request|approval|denial


@router.post("/draft")
def draft(
    req: DraftRequest,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=req.claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_data = {
        "claim_number": claim.claim_number,
        "beneficiary_name": claim.beneficiary_name,
        "insured_name": claim.insured_name,
        "status": claim.status.value if claim.status else None,
    }
    return draft_communication(claim_data, req.draft_type)
