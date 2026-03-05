import os
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Policy, Claim, ClaimStatus

router = APIRouter()


def _mask_name(name: str) -> str:
    parts = name.split()
    masked = []
    for p in parts:
        if len(p) <= 1:
            masked.append(p)
        else:
            masked.append(p[0] + "*" * (len(p) - 1))
    return " ".join(masked)


def _next_claim_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(Claim).filter(Claim.claim_number.like(f"CLM-{year}-%")).count()
    return f"CLM-{year}-{str(count + 1).zfill(5)}"


class PolicyLookupRequest(BaseModel):
    policy_number: Optional[str] = None
    insured_name: Optional[str] = None
    insured_dob: Optional[str] = None
    insured_ssn_last4: Optional[str] = None


class CreateClaimRequest(BaseModel):
    policy_number: str
    insured_name: str
    insured_dob: Optional[str] = None
    policy_issue_date: Optional[str] = None
    face_amount: Optional[float] = None
    beneficiary_name: Optional[str] = None
    beneficiary_email: Optional[str] = None
    beneficiary_phone: Optional[str] = None
    beneficiary_relationship: Optional[str] = None


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
    routing_number: Optional[str] = None


@router.post("/lookup")
def lookup_policy(req: PolicyLookupRequest, db: Session = Depends(get_db)):
    policy = None
    if req.policy_number:
        policy = db.query(Policy).filter(
            Policy.policy_number == req.policy_number.strip().upper()
        ).first()
    elif req.insured_name and req.insured_dob and req.insured_ssn_last4:
        policy = db.query(Policy).filter(
            Policy.insured_name.ilike(f"%{req.insured_name}%"),
            Policy.insured_dob == req.insured_dob,
            Policy.insured_ssn_last4 == req.insured_ssn_last4,
        ).first()

    if not policy:
        raise HTTPException(
            status_code=404,
            detail="No policy found. Please check your information or call 1-800-CLAIMPATH for assistance."
        )

    return {
        "found": True,
        "policy_number": policy.policy_number,
        "insured_name_masked": _mask_name(policy.insured_name),
        "policy_type": policy.policy_type,
        "status": policy.status,
        "issue_date": policy.issue_date,
        "face_amount": policy.face_amount,
    }


@router.post("")
def create_claim(req: CreateClaimRequest, db: Session = Depends(get_db)):
    claim_number = _next_claim_number(db)
    claim = Claim(
        claim_number=claim_number,
        policy_number=req.policy_number,
        insured_name=req.insured_name,
        insured_dob=req.insured_dob,
        policy_issue_date=req.policy_issue_date,
        face_amount=req.face_amount,
        beneficiary_name=req.beneficiary_name,
        beneficiary_email=req.beneficiary_email,
        beneficiary_phone=req.beneficiary_phone,
        beneficiary_relationship=req.beneficiary_relationship,
        status=ClaimStatus.DRAFT,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.put("/{claim_id}")
def update_claim(claim_id: str, req: UpdateClaimRequest, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    update_data = req.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(claim, key, value)

    db.commit()
    db.refresh(claim)
    return claim


@router.post("/{claim_id}/submit")
def submit_claim(claim_id: str, db: Session = Depends(get_db)):
    from app.ai import score_risk

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    policy = db.query(Policy).filter(Policy.policy_number == claim.policy_number).first()
    policy_data = {}
    if policy:
        policy_data = {
            "policy_number": policy.policy_number,
            "issue_date": policy.issue_date,
            "face_amount": policy.face_amount,
            "policy_type": policy.policy_type,
        }

    claim_data = {
        "claim_number": claim.claim_number,
        "policy_number": claim.policy_number,
        "insured_name": claim.insured_name,
        "date_of_death": claim.date_of_death,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
        "policy_issue_date": claim.policy_issue_date or policy_data.get("issue_date"),
        "beneficiary_name": claim.beneficiary_name,
        "beneficiary_relationship": claim.beneficiary_relationship,
    }

    risk = score_risk(claim_data, policy_data)

    claim.status = ClaimStatus.SUBMITTED
    claim.risk_level = risk.get("risk_level")
    claim.risk_flags = risk.get("flags", [])
    claim.contestability_alert = risk.get("contestability_alert", False)
    claim.months_since_issue = risk.get("months_since_issue")
    claim.ai_summary = risk.get("summary")

    db.commit()
    db.refresh(claim)
    return claim


@router.get("/status")
def get_claim_status(claim_number: str, email: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(
        Claim.claim_number == claim_number,
        Claim.beneficiary_email == email,
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found. Check your claim number and email.")
    return claim


@router.post("/{claim_id}/documents")
async def upload_document(
    claim_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    from app.ai import extract_document

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    file_bytes = await file.read()

    # Save to local tmp dir
    tmp_dir = "/tmp/claimpath-docs"
    os.makedirs(tmp_dir, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename or "upload")
    file_path = os.path.join(tmp_dir, f"{claim_id}_{safe_name}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    extraction = extract_document(file_bytes, file.filename or "document")
    claim.death_certificate_url = file_path
    claim.death_certificate_extracted = extraction
    db.commit()

    return {"extracted": extraction, "filename": file.filename}


@router.post("/{claim_id}/verify")
def verify_identity(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.identity_verified = True
    db.commit()
    return {"verified": True, "claim_id": claim_id}
