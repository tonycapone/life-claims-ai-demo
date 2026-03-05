"""
Seed script for ClaimPath demo data.
Run via: npm run db:seed
Idempotent — safe to re-run.
"""
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from passlib.context import CryptContext
from app.database import SessionLocal, Base, engine
from app.models import Policy, PolicyType, PolicyStatus, Claim, ClaimStatus, RiskLevel, Adjuster

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # ── Adjusters ────────────────────────────────────────────────────────
        adjusters = [
            {"username": "jmartinez", "full_name": "J. Martinez", "email": "jmartinez@carrier.com", "password": "password123"},
            {"username": "rthompson", "full_name": "R. Thompson", "email": "rthompson@carrier.com", "password": "password123"},
            {"username": "apatel",    "full_name": "A. Patel",    "email": "apatel@carrier.com",    "password": "password123"},
        ]
        for a in adjusters:
            if not db.query(Adjuster).filter_by(username=a["username"]).first():
                db.add(Adjuster(
                    username=a["username"],
                    full_name=a["full_name"],
                    email=a["email"],
                    hashed_password=pwd_context.hash(a["password"]),
                ))
        db.commit()
        print("✅ Adjusters seeded")

        # ── Policies ─────────────────────────────────────────────────────────
        today = date.today()
        policies = [
            {
                "policy_number": "LT-29471",
                "insured_name": "John Michael Smith",
                "insured_dob": "1968-04-15",
                "insured_ssn_last4": "4471",
                "face_amount": 500000.00,
                "issue_date": str(today - timedelta(days=14 * 30)),  # 14 months ago
                "policy_type": PolicyType.TERM,
                "status": PolicyStatus.IN_FORCE,
                "beneficiaries": [
                    {"name": "Sarah Smith", "relationship": "Spouse", "percentage": 100}
                ],
            },
            {
                "policy_number": "LT-18823",
                "insured_name": "Maria Elena Garcia",
                "insured_dob": "1955-11-02",
                "insured_ssn_last4": "8823",
                "face_amount": 250000.00,
                "issue_date": str(today - timedelta(days=4 * 365)),  # 4 years ago
                "policy_type": PolicyType.TERM,
                "status": PolicyStatus.IN_FORCE,
                "beneficiaries": [
                    {"name": "Carlos Garcia", "relationship": "Spouse", "percentage": 60},
                    {"name": "Isabella Garcia", "relationship": "Child", "percentage": 40},
                ],
            },
            {
                "policy_number": "FE-00291",
                "insured_name": "Robert James Johnson",
                "insured_dob": "1942-07-22",
                "insured_ssn_last4": "0291",
                "face_amount": 25000.00,
                "issue_date": str(today - timedelta(days=5 * 30)),   # 5 months ago
                "policy_type": PolicyType.FINAL_EXPENSE,
                "status": PolicyStatus.IN_FORCE,
                "beneficiaries": [
                    {"name": "Patricia Johnson", "relationship": "Child", "percentage": 100}
                ],
            },
            {
                "policy_number": "LT-44901",
                "insured_name": "Linda Wei Chen",
                "insured_dob": "1962-03-08",
                "insured_ssn_last4": "4901",
                "face_amount": 750000.00,
                "issue_date": str(today - timedelta(days=3 * 365)),  # 3 years ago
                "policy_type": PolicyType.TERM,
                "status": PolicyStatus.IN_FORCE,
                "beneficiaries": [
                    {"name": "David Chen", "relationship": "Spouse", "percentage": 100}
                ],
            },
            {
                "policy_number": "IU-10032",
                "insured_name": "David Anthony Williams",
                "insured_dob": "1958-09-30",
                "insured_ssn_last4": "0032",
                "face_amount": 1000000.00,
                "issue_date": str(today - timedelta(days=2 * 365 + 90)),  # 2+ years ago
                "policy_type": PolicyType.IUL,
                "status": PolicyStatus.IN_FORCE,
                "beneficiaries": [
                    {"name": "Angela Williams", "relationship": "Spouse", "percentage": 50},
                    {"name": "Marcus Williams",  "relationship": "Child",  "percentage": 25},
                    {"name": "Tanya Williams",   "relationship": "Child",  "percentage": 25},
                ],
            },
        ]

        for p in policies:
            if not db.query(Policy).filter_by(policy_number=p["policy_number"]).first():
                db.add(Policy(**p))
        db.commit()
        print("✅ Policies seeded")

        # ── Claims ────────────────────────────────────────────────────────────
        import uuid
        claims = [
            {
                "id": "claim-001",
                "claim_number": "CLM-2026-00138",
                "policy_number": "LT-29471",
                "insured_name": "John Michael Smith",
                "beneficiary_name": "Sarah Smith",
                "beneficiary_email": "sarah.smith@email.com",
                "beneficiary_phone": "314-555-0142",
                "beneficiary_relationship": "Spouse",
                "date_of_death": str(today - timedelta(days=3)),
                "cause_of_death": "Acute myocardial infarction",
                "manner_of_death": "Natural",
                "identity_verified": True,
                "status": ClaimStatus.CONTESTABILITY_REVIEW,
                "risk_level": RiskLevel.MEDIUM,
                "contestability_alert": True,
                "months_since_issue": 14.0,
                "risk_flags": [
                    "Policy issued 14 months ago — within 2-year contestability period",
                    "Cardiac event not disclosed on original application",
                ],
                "ai_summary": "Death benefit claim for John Smith. Policy LT-29471 was issued 14 months ago placing it within the 2-year contestability period. Cause of death (acute myocardial infarction) was not disclosed as a pre-existing condition on the application. Recommend requesting medical records before approving.",
                "assigned_adjuster": "jmartinez",
            },
            {
                "id": "claim-002",
                "claim_number": "CLM-2026-00135",
                "policy_number": "LT-18823",
                "insured_name": "Maria Elena Garcia",
                "beneficiary_name": "Carlos Garcia",
                "beneficiary_email": "carlos.garcia@email.com",
                "beneficiary_phone": "312-555-0198",
                "beneficiary_relationship": "Spouse",
                "date_of_death": str(today - timedelta(days=5)),
                "cause_of_death": "Pancreatic cancer",
                "manner_of_death": "Natural",
                "identity_verified": True,
                "status": ClaimStatus.UNDER_REVIEW,
                "risk_level": RiskLevel.LOW,
                "contestability_alert": False,
                "months_since_issue": 48.0,
                "risk_flags": [],
                "ai_summary": "Standard death benefit claim for Maria Garcia. Policy is 4 years old — outside contestability period. Cause of death (pancreatic cancer) is a covered natural cause. Identity verified. Recommend fast-track processing.",
                "assigned_adjuster": "rthompson",
            },
            {
                "id": "claim-003",
                "claim_number": "CLM-2026-00140",
                "policy_number": "FE-00291",
                "insured_name": "Robert James Johnson",
                "beneficiary_name": "Patricia Johnson",
                "beneficiary_email": "patricia.j@email.com",
                "beneficiary_phone": "773-555-0211",
                "beneficiary_relationship": "Child",
                "date_of_death": str(today - timedelta(days=1)),
                "cause_of_death": "Unknown",
                "manner_of_death": "Accident",
                "identity_verified": False,
                "status": ClaimStatus.SUBMITTED,
                "risk_level": RiskLevel.HIGH,
                "contestability_alert": True,
                "months_since_issue": 5.0,
                "risk_flags": [
                    "Policy purchased only 5 months before death",
                    "Cause of death listed as unknown/accident — requires investigation",
                    "Policy within 2-year contestability period",
                ],
                "ai_summary": "High-risk claim. Final expense policy purchased 5 months ago, insured died in an accident with unknown cause. Multiple red flags present. Recommend SIU review before any further processing.",
                "assigned_adjuster": None,
            },
            {
                "id": "claim-004",
                "claim_number": "CLM-2026-00129",
                "policy_number": "LT-44901",
                "insured_name": "Linda Wei Chen",
                "beneficiary_name": "David Chen",
                "beneficiary_email": "david.chen@email.com",
                "beneficiary_phone": "415-555-0177",
                "beneficiary_relationship": "Spouse",
                "date_of_death": str(today - timedelta(days=12)),
                "cause_of_death": "Stroke",
                "manner_of_death": "Natural",
                "identity_verified": True,
                "status": ClaimStatus.APPROVED,
                "risk_level": RiskLevel.LOW,
                "contestability_alert": False,
                "months_since_issue": 36.0,
                "risk_flags": [],
                "ai_summary": "Clean claim. Policy 3 years old, natural cause of death, identity verified, all documents in order. Approved.",
                "assigned_adjuster": "apatel",
                "payout_method": "lump_sum",
            },
        ]

        for c in claims:
            if not db.query(Claim).filter_by(claim_number=c["claim_number"]).first():
                db.add(Claim(**c))
        db.commit()
        print("✅ Claims seeded")
        print("\n🎉 Seed complete! Ready to demo.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
