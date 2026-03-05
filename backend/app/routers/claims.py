import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Claim, ClaimStatus, Policy, RiskLevel
from app.ai import extract_document, score_risk

router = APIRouter()


class PolicyLookupRequest(BaseModel):
    policy_number: Optional[str] = None
    insured_name: Optional[str] = None
    insured_dob: Optional[str] = None
    insured_ssn_last4: Optional[str] = None


class ClaimCreateRequest(BaseModel):
    policy_number: str
    insured_name: str
    insured_dob: Optional[str] = None
    beneficiary_name: Optional[str] = None
    beneficiary_email: Optional[str] = None
    beneficiary_phone: Optional[str] = None
    beneficiary_relationship: Optional[str] = None


class ClaimUpdateRequest(BaseModel):
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


def _mask_name(name: str) -> str:
    parts = name.split()
    masked = []
    for part in parts:
        if len(part) <= 1:
            masked.append(part)
        else:
            masked.append(part[0] + "*" * (len(part) - 1))
    return " ".join(masked)


def _generate_claim_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(Claim).count() + 1
    return f"CLM-{year}-{count:05d}"


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
        "bank_account_last4": claim.bank_account_last4,
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


@router.post("/lookup")
def lookup_policy(req: PolicyLookupRequest, db: Session = Depends(get_db)):
    policy = None
    if req.policy_number:
        policy = db.query(Policy).filter(Policy.policy_number == req.policy_number.upper()).first()
    elif req.insured_name and req.insured_dob and req.insured_ssn_last4:
        policy = (
            db.query(Policy)
            .filter(
                Policy.insured_name.ilike(f"%{req.insured_name}%"),
                Policy.insured_dob == req.insured_dob,
                Policy.insured_ssn_last4 == req.insured_ssn_last4,
            )
            .first()
        )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found. Please check your information or call 1-800-CLAIMPATH.")
    return {
        "found": True,
        "policy_number": policy.policy_number,
        "insured_name_masked": _mask_name(policy.insured_name),
        "insured_name": policy.insured_name,
        "insured_dob": policy.insured_dob,
        "policy_type": policy.policy_type.value,
        "status": policy.status.value,
        "face_amount": policy.face_amount,
        "issue_date": policy.issue_date,
    }


@router.post("")
def create_claim(req: ClaimCreateRequest, db: Session = Depends(get_db)):
    # Look up policy to get issue_date and face_amount
    policy = db.query(Policy).filter(Policy.policy_number == req.policy_number.upper()).first()
    claim = Claim(
        claim_number=_generate_claim_number(db),
        policy_number=req.policy_number.upper(),
        insured_name=req.insured_name,
        insured_dob=req.insured_dob,
        policy_issue_date=policy.issue_date if policy else None,
        face_amount=policy.face_amount if policy else None,
        beneficiary_name=req.beneficiary_name,
        beneficiary_email=req.beneficiary_email,
        beneficiary_phone=req.beneficiary_phone,
        beneficiary_relationship=req.beneficiary_relationship,
        status=ClaimStatus.DRAFT,
        contestability_alert=False,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return _claim_to_dict(claim)


@router.put("/{claim_id}")
def update_claim(claim_id: str, req: ClaimUpdateRequest, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    for field, value in req.dict(exclude_none=True).items():
        setattr(claim, field, value)
    db.commit()
    db.refresh(claim)
    return _claim_to_dict(claim)


@router.post("/{claim_id}/submit")
def submit_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.status = ClaimStatus.SUBMITTED

    # Calculate months since issue for risk scoring
    months = 48.0
    if claim.policy_issue_date and claim.date_of_death:
        try:
            from dateutil.relativedelta import relativedelta
            issue = datetime.strptime(claim.policy_issue_date, "%Y-%m-%d")
            death = datetime.strptime(claim.date_of_death, "%Y-%m-%d")
            diff = relativedelta(death, issue)
            months = diff.years * 12 + diff.months
        except Exception:
            pass

    claim.months_since_issue = months
    claim_data = {
        "claim_number": claim.claim_number,
        "policy_number": claim.policy_number,
        "insured_name": claim.insured_name,
        "beneficiary_name": claim.beneficiary_name,
        "cause_of_death": claim.cause_of_death,
        "manner_of_death": claim.manner_of_death,
        "months_since_issue": months,
    }
    policy = db.query(Policy).filter(Policy.policy_number == claim.policy_number).first()
    policy_data = {"issue_date": claim.policy_issue_date, "face_amount": claim.face_amount}

    risk = score_risk(claim_data, policy_data)
    claim.risk_level = RiskLevel(risk["risk_level"])
    claim.risk_flags = risk["flags"]
    claim.contestability_alert = risk["contestability_alert"]
    claim.ai_summary = risk.get("summary", "")
    claim.status = ClaimStatus.SUBMITTED

    db.commit()
    db.refresh(claim)
    return _claim_to_dict(claim)


@router.get("/status")
def get_claim_status(
    claim_number: str = Query(...),
    email: str = Query(...),
    db: Session = Depends(get_db),
):
    claim = (
        db.query(Claim)
        .filter(Claim.claim_number == claim_number, Claim.beneficiary_email == email)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found. Check your claim number and email address.")
    return _claim_to_dict(claim)


@router.post("/{claim_id}/documents")
async def upload_document(claim_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    contents = await file.read()

    # Save locally
    save_dir = "/tmp/claimpath-docs"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, f"{claim_id}_{file.filename}")
    with open(save_path, "wb") as f:
        f.write(contents)

    extracted = extract_document(contents, file.filename)
    claim.death_certificate_url = save_path
    claim.death_certificate_extracted = extracted
    db.commit()

    return {"filename": file.filename, "extracted": extracted}


@router.post("/{claim_id}/verify")
def verify_identity(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.identity_verified = True
    db.commit()
    return {"verified": True, "claim_id": claim_id}
