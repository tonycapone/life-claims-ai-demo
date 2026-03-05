from sqlalchemy import Column, String, DateTime, Float, Enum, Text, Boolean, JSON, Integer
from sqlalchemy.sql import func
from app.database import Base
import enum
import uuid


def new_uuid():
    return str(uuid.uuid4())


class PolicyType(str, enum.Enum):
    TERM = "term"
    FINAL_EXPENSE = "final_expense"
    IUL = "iul"


class PolicyStatus(str, enum.Enum):
    IN_FORCE = "in_force"
    LAPSED = "lapsed"
    CANCELLED = "cancelled"


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=new_uuid)
    policy_number = Column(String, unique=True, nullable=False, index=True)
    insured_name = Column(String, nullable=False)
    insured_dob = Column(String)               # YYYY-MM-DD
    insured_ssn_last4 = Column(String)
    face_amount = Column(Float, nullable=False)
    issue_date = Column(String, nullable=False) # YYYY-MM-DD
    policy_type = Column(Enum(PolicyType), nullable=False)
    status = Column(Enum(PolicyStatus), default=PolicyStatus.IN_FORCE)
    beneficiaries = Column(JSON)               # [{name, relationship, percentage}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Adjuster(Base):
    __tablename__ = "adjusters"

    id = Column(String, primary_key=True, default=new_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClaimStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    PENDING_DOCUMENTS = "pending_documents"
    CONTESTABILITY_REVIEW = "contestability_review"
    SIU_REVIEW = "siu_review"
    APPROVED = "approved"
    PAID = "paid"
    DENIED = "denied"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, default=new_uuid)
    claim_number = Column(String, unique=True, nullable=False)

    # Policy lookup
    policy_number = Column(String, nullable=False)
    insured_name = Column(String, nullable=False)
    insured_dob = Column(String)
    policy_issue_date = Column(String)
    face_amount = Column(Float)

    # Beneficiary info
    beneficiary_name = Column(String)
    beneficiary_email = Column(String)
    beneficiary_phone = Column(String)
    beneficiary_relationship = Column(String)
    beneficiary_ssn_last4 = Column(String)
    identity_verified = Column(Boolean, default=False)

    # Death info
    date_of_death = Column(String)
    cause_of_death = Column(String)
    manner_of_death = Column(String)  # natural, accident, homicide, suicide, unknown

    # Documents
    death_certificate_url = Column(String)
    death_certificate_extracted = Column(JSON)  # AI-extracted fields

    # Payout
    payout_method = Column(String)  # lump_sum, structured
    bank_account_last4 = Column(String)
    routing_number = Column(String)

    # AI analysis
    status = Column(Enum(ClaimStatus), default=ClaimStatus.DRAFT)
    risk_level = Column(Enum(RiskLevel))
    risk_flags = Column(JSON)  # list of flag strings
    contestability_alert = Column(Boolean, default=False)
    months_since_issue = Column(Float)
    ai_summary = Column(Text)

    # Adjuster
    assigned_adjuster = Column(String)
    adjuster_notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
