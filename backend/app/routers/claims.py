import os
import uuid
import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Policy, Claim, ClaimStatus
from app.ai import extract_document, score_risk, extract_fnol_fields, stream_fnol_chat, should_request_death_cert, FNOL_REQUIRED_FIELDS, _missing_fields

router = APIRouter()


def generate_claim_number() -> str:
    year = date.today().year
    short = str(uuid.uuid4())[:5].upper()
    return f"CLM-{year}-{short}"


# ── Request/Response models ───────────────────────────────

class PolicyLookupRequest(BaseModel):
    policy_number: Optional[str] = None
    insured_name: Optional[str] = None
    insured_dob: Optional[str] = None
    insured_ssn_last4: Optional[str] = None


class CreateClaimRequest(BaseModel):
    policy_number: str
    beneficiary_name: Optional[str] = None
    beneficiary_email: Optional[str] = None
    beneficiary_phone: Optional[str] = None
    beneficiary_relationship: Optional[str] = None
    date_of_death: Optional[str] = None
    cause_of_death: Optional[str] = None
    manner_of_death: Optional[str] = None
    payout_method: Optional[str] = None


class UpdateClaimRequest(BaseModel):
    beneficiary_name: Optional[str] = None
    beneficiary_email: Optional[str] = None
    beneficiary_phone: Optional[str] = None
    beneficiary_relationship: Optional[str] = None
    beneficiary_ssn_last4: Optional[str] = None
    date_of_death: Optional[str] = None
    cause_of_death: Optional[str] = None
    manner_of_death: Optional[str] = None
    payout_method: Optional[str] = None
    bank_account_last4: Optional[str] = None


class FNOLChatMessage(BaseModel):
    role: str
    content: str


class FNOLChatRequest(BaseModel):
    messages: list[FNOLChatMessage]
    draft: dict = {}


# ── Endpoints ─────────────────────────────────────────────

@router.post("/lookup")
def lookup_policy(req: PolicyLookupRequest, db: Session = Depends(get_db)):
    policy = None
    if req.policy_number:
        policy = db.query(Policy).filter_by(policy_number=req.policy_number.upper()).first()
    elif req.insured_name and req.insured_dob:
        policy = db.query(Policy).filter_by(
            insured_name=req.insured_name,
            insured_dob=req.insured_dob,
        ).first()
        if policy and req.insured_ssn_last4 and policy.insured_ssn_last4 != req.insured_ssn_last4:
            policy = None

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found. Please check your information and try again.")

    if policy.status != "in_force":
        raise HTTPException(status_code=400, detail=f"Policy is {policy.status.value} and cannot accept new claims.")

    # Mask insured name
    parts = policy.insured_name.split()
    masked = " ".join(p[0] + "*" * (len(p) - 1) for p in parts)

    return {
        "found": True,
        "policy_id": policy.id,
        "policy_number": policy.policy_number,
        "insured_name_masked": masked,
        "policy_type": policy.policy_type,
        "status": policy.status,
    }


@router.post("/fnol/chat")
def fnol_chat(req: FNOLChatRequest, db: Session = Depends(get_db)):
    """Conversational FNOL — extract fields + stream response as SSE."""
    draft = dict(req.draft)
    last_user_msg = ""
    for m in reversed(req.messages):
        if m.role == "user":
            last_user_msg = m.content
            break

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message")

    # 1. Extract fields from latest user message
    new_fields = extract_fnol_fields(last_user_msg, draft)

    # 2. Policy lookup if policy_number just extracted
    policy_event = None
    if "policy_number" in new_fields:
        policy = db.query(Policy).filter_by(
            policy_number=new_fields["policy_number"].upper()
        ).first()
        if policy and policy.status == "in_force":
            parts = policy.insured_name.split()
            masked = " ".join(p[0] + "*" * (len(p) - 1) for p in parts)
            policy_event = {
                "found": True,
                "policy_id": policy.id,
                "policy_number": policy.policy_number,
                "insured_name_masked": masked,
                "policy_type": policy.policy_type,
            }
            new_fields["policy_number"] = policy.policy_number  # normalize
        else:
            policy_event = {"found": False}
            new_fields.pop("policy_number", None)

    # 3. Merge new fields into draft
    draft.update(new_fields)

    # 4. Create or update claim in DB
    claim_id = draft.get("claim_id")
    if not claim_id and draft.get("policy_number") and draft.get("beneficiary_name"):
        policy = db.query(Policy).filter_by(
            policy_number=draft["policy_number"].upper()
        ).first()
        if policy:
            claim = Claim(
                claim_number=generate_claim_number(),
                policy_number=draft["policy_number"].upper(),
                insured_name=policy.insured_name,
                insured_dob=policy.insured_dob,
                policy_issue_date=policy.issue_date,
                face_amount=policy.face_amount,
                beneficiary_name=draft.get("beneficiary_name"),
                beneficiary_email=draft.get("beneficiary_email"),
                beneficiary_phone=draft.get("beneficiary_phone"),
                beneficiary_relationship=draft.get("beneficiary_relationship"),
                date_of_death=draft.get("date_of_death"),
                cause_of_death=draft.get("cause_of_death"),
                manner_of_death=draft.get("manner_of_death"),
                payout_method=draft.get("payout_method"),
                status=ClaimStatus.DRAFT,
            )
            db.add(claim)
            db.commit()
            db.refresh(claim)
            draft["claim_id"] = claim.id
            draft["claim_number"] = claim.claim_number
    elif claim_id and new_fields:
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if claim and claim.status == ClaimStatus.DRAFT:
            for field, value in new_fields.items():
                if hasattr(claim, field):
                    setattr(claim, field, value)
            db.commit()

    # 5. Check if all required fields collected
    all_collected = len(_missing_fields(draft)) == 0

    # 6. Check if we should prompt for death certificate upload
    request_death_cert = should_request_death_cert(draft)

    # 7. Build SSE stream
    # Convert messages to simple dicts for AI
    chat_msgs = [{"role": m.role, "content": m.content} for m in req.messages]
    # Limit to last 20 messages
    chat_msgs = chat_msgs[-20:]

    def event_stream():
        # Send extracted fields
        fields_payload = dict(new_fields)
        if draft.get("claim_id"):
            fields_payload["claim_id"] = draft["claim_id"]
        if draft.get("claim_number"):
            fields_payload["claim_number"] = draft["claim_number"]
        if fields_payload:
            yield f"data: {json.dumps({'type': 'fields', 'data': fields_payload})}\n\n"

        # Send policy event
        if policy_event is not None:
            yield f"data: {json.dumps({'type': 'policy', 'data': policy_event})}\n\n"

        # Send show_review action if all fields collected
        if all_collected:
            yield f"data: {json.dumps({'type': 'action', 'action': 'show_review'})}\n\n"

        # Send upload_death_cert action when it's time
        if request_death_cert:
            yield f"data: {json.dumps({'type': 'action', 'action': 'upload_death_cert'})}\n\n"

        # Stream conversational response
        for chunk in stream_fnol_chat(chat_msgs, draft):
            yield f"data: {json.dumps({'type': 'text', 'data': chunk})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("")
def create_claim(req: CreateClaimRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter_by(policy_number=req.policy_number.upper()).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    claim = Claim(
        claim_number=generate_claim_number(),
        policy_number=req.policy_number.upper(),
        insured_name=policy.insured_name,
        insured_dob=policy.insured_dob,
        policy_issue_date=policy.issue_date,
        face_amount=policy.face_amount,
        beneficiary_name=req.beneficiary_name,
        beneficiary_email=req.beneficiary_email,
        beneficiary_phone=req.beneficiary_phone,
        beneficiary_relationship=req.beneficiary_relationship,
        date_of_death=req.date_of_death,
        cause_of_death=req.cause_of_death,
        manner_of_death=req.manner_of_death,
        payout_method=req.payout_method,
        status=ClaimStatus.DRAFT,
    )
    db.add(claim); db.commit(); db.refresh(claim)
    return claim


@router.put("/{claim_id}")
def update_claim(claim_id: str, req: UpdateClaimRequest, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != ClaimStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only update draft claims")

    for field, value in req.dict(exclude_none=True).items():
        setattr(claim, field, value)
    db.commit(); db.refresh(claim)
    return claim


@router.post("/{claim_id}/submit")
def submit_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    policy = db.query(Policy).filter_by(policy_number=claim.policy_number).first()

    # AI risk scoring
    claim_data = {
        "claim_number": claim.claim_number,
        "beneficiary_name": claim.beneficiary_name,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
    }
    policy_data = {"issue_date": policy.issue_date if policy else None}
    risk = score_risk(claim_data, policy_data)

    claim.status = ClaimStatus.SUBMITTED
    claim.risk_level = risk.get("risk_level")
    claim.contestability_alert = risk.get("contestability_alert", False)
    claim.months_since_issue = risk.get("months_since_issue")
    claim.risk_flags = risk.get("flags", [])
    claim.ai_summary = risk.get("ai_summary", "")
    db.commit(); db.refresh(claim)
    return claim


@router.get("/status")
def claim_status(claim_number: str, email: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter_by(claim_number=claim_number, beneficiary_email=email).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found. Check your claim number and email.")
    return {
        "claim_number": claim.claim_number,
        "status": claim.status,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
        "insured_name": claim.insured_name[:1] + "*** " + claim.insured_name.split()[-1] if claim.insured_name else None,
    }


@router.post("/{claim_id}/documents")
async def upload_document(claim_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    contents = await file.read()

    # Save locally for dev
    save_dir = "/tmp/claimpath-docs"
    os.makedirs(save_dir, exist_ok=True)
    save_path = f"{save_dir}/{claim_id}_{file.filename}"
    with open(save_path, "wb") as f:
        f.write(contents)

    # AI extraction
    extracted = extract_document(contents, file.filename)

    claim.death_certificate_url = save_path
    claim.death_certificate_extracted = extracted

    # Auto-populate claim fields from extracted data
    field_mapping = {
        "date_of_death": "date_of_death",
        "cause_of_death": "cause_of_death",
        "manner_of_death": "manner_of_death",
    }
    auto_populated = {}
    for extract_key, claim_field in field_mapping.items():
        value = extracted.get(extract_key)
        if value and not getattr(claim, claim_field, None):
            setattr(claim, claim_field, value)
            auto_populated[claim_field] = value

    db.commit()

    return {
        "extracted": extracted,
        "filename": file.filename,
        "auto_populated": auto_populated,
    }


@router.post("/{claim_id}/verify")
def verify_identity(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.identity_verified = True
    db.commit()
    return {"verified": True, "message": "Identity successfully verified"}
