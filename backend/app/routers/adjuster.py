from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from app.database import get_db
from app.models import Claim, ClaimStatus, RiskLevel, Adjuster, Policy
from app.auth import create_access_token, get_current_adjuster
from app.ai import stream_copilot, draft_communication, analyze_contestability
from app.regulatory import get_regulatory_deadlines
import json
import os
from datetime import date

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


# ── Regulatory Timeline ───────────────────────────────────

@router.get("/claims/{claim_id}/regulatory")
def get_regulatory(
    claim_id: str,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Derive filing date from created_at
    filing_date = claim.created_at.date() if claim.created_at else date.today()

    return get_regulatory_deadlines(
        filing_date=filing_date,
        state_code=claim.jurisdiction_state,
        claim_status=claim.status.value if claim.status else None,
    )


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
    "review": ClaimStatus.UNDER_REVIEW,
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


# ── Contestability Analysis ───────────────────────────────

@router.post("/claims/{claim_id}/contestability")
def run_contestability(
    claim_id: str,
    db: Session = Depends(get_db),
    _: Adjuster = Depends(get_current_adjuster),
):
    claim = db.query(Claim).filter_by(id=claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Look up the policy to find document URLs
    policy = db.query(Policy).filter_by(policy_number=claim.policy_number).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if not policy.application_url or not policy.medical_records_url:
        raise HTTPException(status_code=400, detail="Required documents not available for this policy")

    # Resolve file paths — documents are in frontend/public/demo/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    project_root = os.path.dirname(base_dir) if base_dir.endswith("backend/app") else os.path.dirname(base_dir)

    # Walk up to find the project root (where frontend/ lives)
    check = base_dir
    for _ in range(5):
        if os.path.isdir(os.path.join(check, "frontend")):
            project_root = check
            break
        check = os.path.dirname(check)

    app_path = os.path.join(project_root, "frontend", "public", policy.application_url.lstrip("/"))
    med_path = os.path.join(project_root, "frontend", "public", policy.medical_records_url.lstrip("/"))

    # For the demo, we extract text descriptions from the known documents
    # In production, this would use OCR/document parsing
    application_text = _read_demo_text(app_path, "application")
    medical_text = _read_demo_text(med_path, "medical_records")

    result = analyze_contestability(application_text, medical_text)

    # Store on the claim
    claim.contestability_analysis = result
    db.commit()
    db.refresh(claim)

    return result


def _read_demo_text(file_path: str, doc_type: str) -> str:
    """For demo purposes, return text representations of the known synthetic documents.

    In production, this would use OCR (Textract) or PDF parsing. For our demo,
    we provide the text content that matches our generated PDFs so the AI can
    do a proper comparison.
    """
    if doc_type == "application":
        return """TIDEWELL LIFE INSURANCE COMPANY
Application for Individual Life Insurance
Application Number: APP-2025-07821

PROPOSED INSURED INFORMATION:
Name: John Michael Smith
Date of Birth: April 15, 1968
SSN Last 4: 4471
Sex: Male
Address: 1847 N. Damen Ave, Chicago, IL 60647
Occupation: Financial Analyst
Employer: Midwest Capital Partners
Annual Income: $125,000

COVERAGE REQUESTED:
Type: Term Life — 20 Year Level
Face Amount: $500,000.00
Primary Beneficiary: Sarah Smith (Spouse) — 100%

HEALTH HISTORY QUESTIONNAIRE:

1. Have you ever been diagnosed with or treated for any form of heart disease, including but not limited to coronary artery disease, arrhythmia, or heart failure?
   Answer: NO

2. Have you been prescribed medication for high blood pressure (hypertension)?
   Answer: NO

3. Have you ever been diagnosed with or treated for diabetes (Type 1 or Type 2)?
   Answer: NO

4. Have you been hospitalized or visited an emergency room in the past 5 years for any reason?
   Answer: NO

5. Have you ever been diagnosed with or treated for cancer or any malignancy?
   Answer: NO

6. Have you used tobacco or nicotine products in the past 5 years?
   Answer: NO

7. Have you ever been diagnosed with or treated for a mental health condition, including anxiety or depression?
   Answer: NO

8. Have you ever been diagnosed with or treated for kidney disease or liver disease?
   Answer: NO

9. Have you had any surgeries in the past 10 years?
   Answer: NO

10. Are you currently taking any prescription medications?
    Answer: NO

11. Have you ever been declined for life insurance or had an application rated or modified?
    Answer: NO

12. Do you participate in any hazardous activities?
    Answer: NO

ADDITIONAL NOTES: No additional information to disclose.

Signed by proposed insured and agent. Application date corresponds to policy issue date (approximately 14 months ago)."""

    elif doc_type == "medical_records":
        return """LAKEVIEW INTERNAL MEDICINE
2847 N. Lincoln Ave, Suite 200, Chicago, IL 60657
Medical Records Summary — Patient: Smith, John Michael (DOB: 04/15/1968, MRN: LIM-2019-04471)

ENCOUNTER: June 15, 2023 — Office Visit — Provider: Sarah Chen, MD
Chief Complaint: Intermittent palpitations and irregular heartbeat over past 3 weeks.
History: 55-year-old male, no significant prior cardiac history, new-onset palpitations.
Vitals: BP 142/88, HR 78 (irregular), SpO2 98%
ECG: Atrial fibrillation with controlled ventricular rate (78 bpm). Echocardiogram ordered.
Assessment:
  1. New-onset atrial fibrillation (I48.91)
  2. Borderline hypertension (R03.0)
Medications Started:
  - Metoprolol succinate 25mg PO BID (rate control)
  - Eliquis (apixaban) 5mg PO BID (stroke prophylaxis, CHA2DS2-VASc = 2)
Plan: Echocardiogram, follow-up 6-8 weeks, Cardiology referral.

ENCOUNTER: September 20, 2023 — Follow-up Visit — Provider: Sarah Chen, MD
Chief Complaint: Follow-up for atrial fibrillation.
Interval: Improved palpitations on metoprolol. Echo (06/22): EF 55%, mild LA enlargement.
Vitals: BP 148/92, HR 72, SpO2 99%
Assessment:
  1. Atrial fibrillation — rate controlled on metoprolol (I48.91)
  2. Hypertension, newly diagnosed (I10)
Medications:
  - Metoprolol 25mg BID — CONTINUE
  - Eliquis 5mg BID — CONTINUE
  - Lisinopril 10mg PO daily — START (hypertension)
Plan: Home BP monitoring, target < 130/80, BMP in 2 weeks.

ENCOUNTER: March 10, 2024 — EMERGENCY DEPARTMENT VISIT — Provider: James Wilson, MD
Chief Complaint: Acute onset chest pain, left-sided, radiating to left arm.
History: 56-year-old male with AFib and hypertension. Acute chest pain onset 45 min prior,
pressure-like, 7/10, with diaphoresis and mild dyspnea. Currently on metoprolol, Eliquis, lisinopril.
Vitals: BP 158/96, HR 94 (irregular), SpO2 97%
ED Course: ECG — AFib with rate 94, no acute ST changes. Serial troponins negative x2.
Chest X-ray: no acute process. D-dimer negative. Pain resolved with sublingual nitroglycerin.
Assessment:
  1. Acute chest pain — rule out MI — TROPONIN NEGATIVE x2 (R07.9)
  2. Atrial fibrillation with rapid ventricular response
  3. Hypertension, uncontrolled
Plan: Discharge home, follow-up PCP 1 week, Cardiology 2 weeks, outpatient stress test.

ENCOUNTER: August 5, 2024 — Annual Physical Examination — Provider: Sarah Chen, MD
Reason: Annual preventive exam and chronic disease management.
Interval: AFib rate controlled. BP improved on lisinopril. March ER visit for chest pain (troponin neg).
Stress test (04/2024) — no inducible ischemia. Good exercise tolerance. Walking 30 min daily.
Quit smoking 7 years ago.
Vitals: BP 134/84, HR 68, SpO2 99%, Wt 196 lbs, BMI 28.4
Lab Results: TC 248, LDL 162, HDL 42, TG 220
Assessment:
  1. Atrial fibrillation, persistent, rate controlled (I48.91)
  2. Hypertension, improved but above target (I10)
  3. Hyperlipidemia, newly identified (E78.5)
  4. Overweight (BMI 28.4)
Medications:
  - Metoprolol 25mg BID — CONTINUE
  - Eliquis 5mg BID — CONTINUE
  - Lisinopril — INCREASE to 20mg daily
  - Atorvastatin 20mg PO daily — START

ENCOUNTER: January 12, 2025 — Follow-up Visit — Provider: Sarah Chen, MD
Reason: Routine follow-up for AFib, hypertension, and hyperlipidemia.
Interval: Compliant with all medications. No side effects. Palpitations rare.
Home BP averaging 128/78. Repeat lipids: TC 198, LDL 108, HDL 48, TG 180 — improved.
LFTs normal. Cr 1.0, eGFR 82.
Vitals: BP 126/78, HR 66, SpO2 99%, Wt 192 lbs, BMI 27.8
Assessment:
  1. Atrial fibrillation, persistent, well-controlled (I48.91)
  2. Hypertension, controlled on lisinopril 20mg (I10)
  3. Hyperlipidemia, improved on atorvastatin (E78.5)
Active Medications:
  - Metoprolol succinate 25mg PO BID
  - Eliquis 5mg PO BID
  - Lisinopril 20mg PO daily
  - Atorvastatin 20mg PO daily

ENCOUNTER: March 3, 2026 — EMERGENCY DEPARTMENT — Northwestern Memorial Hospital
Notification: Patient presented via EMS with acute severe chest pain and diaphoresis.
ECG: ST-elevation leads II, III, aVF, V5-V6 — acute STEMI.
Patient became hemodynamically unstable — cardiogenic shock.
Cardiac arrest (ventricular fibrillation) en route to cath lab.
ACLS x 35 minutes — no ROSC.
TIME OF DEATH: 14:23 CST
Cause of Death: a. Acute myocardial infarction (STEMI), b. Coronary artery disease, c. Hypertension
Manner of Death: Natural"""

    # Fallback: try to read the actual file
    try:
        with open(file_path, "r") as f:
            return f.read()
    except Exception:
        return f"[Document at {file_path} — content not available for analysis]"


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
