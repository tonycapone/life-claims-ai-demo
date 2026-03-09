"""
Strands Agent for the carrier chat — general-purpose policy assistant
that naturally transitions into claim filing when the user reports a death.

Tools get DB access via closure. SSE side-effect tools push events to an
asyncio.Queue that the streaming endpoint drains alongside text events.
"""
import os
import json
import asyncio
import uuid
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Policy, Claim, ClaimStatus

BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "us.anthropic.claude-haiku-4-5-20251001-v1:0",
)
BEDROCK_REGION = os.getenv("AWS_REGION", "us-east-1")


def _format_currency(amount: float) -> str:
    return f"${amount:,.2f}"


def _generate_claim_number() -> str:
    year = date.today().year
    short = str(uuid.uuid4())[:5].upper()
    return f"CLM-{year}-{short}"


SYSTEM_PROMPT_TEMPLATE = """You are a friendly, helpful AI assistant for {carrier_name}. The policyholder \
{insured_name} is logged into their account. You can help with anything related to their policy.

Policy context:
- Policy: {number} ({policy_type})
- Face Amount: {face_amount}
- Status: {status}
- Issued: {issue_date}
- Premium: {premium}/month (autopay enabled)
- Beneficiaries: {beneficiary_list}

You have tools to look up policy details, payment info, and beneficiary information. \
Use them when the user asks questions — don't guess from the context above.

If someone indicates the policyholder has died or they want to file a claim, follow \
this checklist IN ORDER. Do not skip steps or jump ahead.

CLAIM CHECKLIST:
1. Respond with genuine empathy — this person is grieving
2. You're speaking with someone on the policyholder's account — you DON'T know \
who they are. Ask who you're speaking with and their relationship to the insured.
3. Collect their phone number and email address
4. Once you have their identity info, use start_claim() to create the claim
5. Verify the insured's identity — ask the beneficiary to confirm the insured's \
full legal name, date of birth, and the last 4 digits of their Social Security number. \
Use update_claim() to record the confirmed SSN last 4.
6. ALWAYS use request_document_upload() to ask them to upload a death certificate. \
This is REQUIRED — do NOT skip it or ask them to describe the death details verbally. \
The upload widget extracts date, cause, and manner of death automatically.
7. After the death certificate, ask about payout preference (lump sum or structured payments). \
Use update_claim() to record it.
8. When ALL items above are collected, use show_claim_review() to let them review and submit.

Guidelines:
- 2-4 sentences per response, warm and professional
- For general questions, use your tools — give real answers from the policy data
- Never ask for information you already have
- Never proactively mention death or claims unless the user does
- When collecting claim information, ask for one or two things at a time, not everything at once
- Work through the checklist step by step — do not combine or skip steps
"""


def _build_system_prompt(policy: Policy) -> str:
    benes = policy.beneficiaries or []
    bene_list = ", ".join(
        f"{b['name']} ({b['relationship']}, {b['percentage']}%)" for b in benes
    )
    policy_type_labels = {
        "term": "Term Life",
        "final_expense": "Final Expense",
        "iul": "Indexed Universal Life",
    }
    ptype = policy_type_labels.get(
        policy.policy_type.value if hasattr(policy.policy_type, "value") else policy.policy_type,
        str(policy.policy_type),
    )
    return SYSTEM_PROMPT_TEMPLATE.format(
        carrier_name="Tidewell Life Insurance",
        insured_name=policy.insured_name,
        number=policy.policy_number,
        policy_type=ptype,
        face_amount=_format_currency(policy.face_amount),
        status="Active" if (policy.status.value if hasattr(policy.status, "value") else policy.status) == "in_force" else str(policy.status),
        issue_date=policy.issue_date,
        premium="$42.50",
        beneficiary_list=bene_list or "None on file",
    )


def _bedrock_available() -> bool:
    """Quick check whether Bedrock credentials are configured."""
    try:
        import boto3
        client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        client.meta.region_name  # noqa — validates client creation
        return True
    except Exception:
        return False


def build_carrier_agent(db: Session, sse_queue: asyncio.Queue, policy: Policy):
    """Build a Strands Agent with carrier tools. Returns (agent, system_prompt)."""
    from strands import Agent, tool
    from strands.models.bedrock import BedrockModel
    from strands.handlers.callback_handler import null_callback_handler
    from botocore.config import Config as BotoConfig

    system_prompt = _build_system_prompt(policy)

    # ── Tool definitions (close over db, sse_queue, policy) ──────────

    @tool
    def lookup_policy(policy_number: str) -> str:
        """Look up a life insurance policy by number. Returns policy details
        including insured name, face amount, type, status, and issue date."""
        p = db.query(Policy).filter_by(policy_number=policy_number.upper()).first()
        if not p:
            return f"No policy found with number {policy_number}."
        ptype = p.policy_type.value if hasattr(p.policy_type, "value") else str(p.policy_type)
        status = p.status.value if hasattr(p.status, "value") else str(p.status)
        return json.dumps({
            "policy_number": p.policy_number,
            "insured_name": p.insured_name,
            "face_amount": _format_currency(p.face_amount),
            "policy_type": ptype,
            "status": status,
            "issue_date": p.issue_date,
        })

    @tool
    def get_beneficiaries(policy_number: str) -> str:
        """Get the list of beneficiaries for a policy, including names,
        relationships, and payout percentages."""
        p = db.query(Policy).filter_by(policy_number=policy_number.upper()).first()
        if not p:
            return f"No policy found with number {policy_number}."
        benes = p.beneficiaries or []
        if not benes:
            return "No beneficiaries on file for this policy."
        lines = []
        for b in benes:
            lines.append(f"- {b['name']} ({b['relationship']}): {b['percentage']}%")
        return "\n".join(lines)

    @tool
    def get_payment_info(policy_number: str) -> str:
        """Get payment information for a policy including premium amount,
        frequency, next payment date, and recent payment history."""
        p = db.query(Policy).filter_by(policy_number=policy_number.upper()).first()
        if not p:
            return f"No policy found with number {policy_number}."
        return json.dumps({
            "premium_amount": "$42.50",
            "frequency": "Monthly",
            "payment_method": "Autopay (checking account ending in 4821)",
            "next_payment_date": "April 1, 2026",
            "last_payment": "March 1, 2026 — $42.50 (processed)",
            "payment_status": "Current — no missed payments",
        })

    @tool
    def start_claim(
        policy_number: str,
        beneficiary_name: str,
        beneficiary_relationship: str,
        beneficiary_phone: str,
        beneficiary_email: str,
    ) -> str:
        """Start a death benefit claim. Call this once you have the beneficiary's
        name, relationship to the insured, phone number, and email address.
        Returns a claim ID and claim number."""
        p = db.query(Policy).filter_by(policy_number=policy_number.upper()).first()
        if not p:
            return f"No policy found with number {policy_number}."

        claim = Claim(
            claim_number=_generate_claim_number(),
            policy_number=p.policy_number,
            insured_name=p.insured_name,
            insured_dob=p.insured_dob,
            policy_issue_date=p.issue_date,
            face_amount=p.face_amount,
            beneficiary_name=beneficiary_name,
            beneficiary_email=beneficiary_email,
            beneficiary_phone=beneficiary_phone,
            beneficiary_relationship=beneficiary_relationship,
            status=ClaimStatus.DRAFT,
            jurisdiction_state="IL",
        )
        db.add(claim)
        db.commit()
        db.refresh(claim)

        # Push state event so frontend knows claim was created
        sse_queue.put_nowait({
            "type": "state",
            "data": {
                "claim_id": claim.id,
                "claim_number": claim.claim_number,
                "policy_number": p.policy_number,
                "beneficiary_name": beneficiary_name,
                "beneficiary_email": beneficiary_email,
                "beneficiary_phone": beneficiary_phone,
                "beneficiary_relationship": beneficiary_relationship,
            },
        })

        return json.dumps({
            "claim_id": claim.id,
            "claim_number": claim.claim_number,
            "message": "Claim created successfully.",
        })

    @tool
    def update_claim(
        claim_id: str,
        date_of_death: Optional[str] = None,
        cause_of_death: Optional[str] = None,
        manner_of_death: Optional[str] = None,
        payout_method: Optional[str] = None,
        insured_ssn_last4: Optional[str] = None,
    ) -> str:
        """Update a claim with death details, payout preference, or insured identity
        confirmation. Call this as you collect information from the beneficiary."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return f"No claim found with ID {claim_id}."

        updated = {}
        if date_of_death:
            claim.date_of_death = date_of_death
            updated["date_of_death"] = date_of_death
        if cause_of_death:
            claim.cause_of_death = cause_of_death
            updated["cause_of_death"] = cause_of_death
        if manner_of_death:
            claim.manner_of_death = manner_of_death
            updated["manner_of_death"] = manner_of_death
        if payout_method:
            claim.payout_method = payout_method
            updated["payout_method"] = payout_method
        if insured_ssn_last4:
            updated["insured_ssn_last4"] = insured_ssn_last4

        db.commit()

        if updated:
            sse_queue.put_nowait({
                "type": "state",
                "data": {"claim_id": claim_id, **updated},
            })

        return f"Claim updated: {json.dumps(updated)}"

    @tool
    def request_document_upload(claim_id: str, document_type: str) -> str:
        """Request the user to upload a document (e.g. death_certificate).
        Call this when you need the beneficiary to provide documentation."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return f"No claim found with ID {claim_id}."

        sse_queue.put_nowait({
            "type": "action",
            "action": "upload_death_cert",
            "data": {"claim_id": claim_id, "document_type": document_type},
        })

        return f"Upload widget displayed to user for {document_type}."

    @tool
    def show_claim_review(claim_id: str) -> str:
        """Show the claim review and submission card to the beneficiary.
        Call this when all required information has been collected."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return f"No claim found with ID {claim_id}."

        sse_queue.put_nowait({
            "type": "action",
            "action": "show_review",
            "data": {"claim_id": claim_id},
        })

        return "Review card displayed to user."

    # ── Build agent ──────────────────────────────────────────────────

    model = BedrockModel(
        model_id=BEDROCK_MODEL_ID,
        region_name=BEDROCK_REGION,
        boto_client_config=BotoConfig(
            retries={"mode": "adaptive", "max_attempts": 10},
        ),
    )

    agent = Agent(
        model=model,
        system_prompt=system_prompt,
        callback_handler=null_callback_handler,
        tools=[
            lookup_policy,
            get_beneficiaries,
            get_payment_info,
            start_claim,
            update_claim,
            request_document_upload,
            show_claim_review,
        ],
    )

    return agent


# ── Mock fallback (no Bedrock) ──────────────────────────────────────

def mock_carrier_response(last_message: str, policy: Policy, draft: dict) -> list[dict]:
    """Keyword-based canned responses when Bedrock is unavailable."""
    msg = last_message.lower()
    events = []

    if any(w in msg for w in ["payment", "premium", "bill", "pay"]):
        text = (
            f"Your premium is $42.50/month, paid via autopay from your checking account "
            f"ending in 4821. Your next payment is scheduled for April 1, 2026. "
            f"All payments are current — no missed payments on record."
        )
    elif any(w in msg for w in ["coverage", "benefit", "how much", "face", "amount"]):
        text = (
            f"Your policy {policy.policy_number} has a face amount of "
            f"{_format_currency(policy.face_amount)}. It's a Term Life policy "
            f"issued on {policy.issue_date} and is currently active."
        )
    elif any(w in msg for w in ["beneficiary", "beneficiaries", "who gets"]):
        benes = policy.beneficiaries or []
        if benes:
            parts = [f"{b['name']} ({b['relationship']}, {b['percentage']}%)" for b in benes]
            text = f"The beneficiaries on your policy are: {', '.join(parts)}."
        else:
            text = "There are no beneficiaries currently on file for this policy."
    elif any(w in msg for w in ["claim", "died", "passed", "death", "deceased", "lost"]):
        text = (
            "I'm so sorry to hear that. I want to help you through this process. "
            "May I ask who I'm speaking with and your relationship to the policyholder?"
        )
    elif any(w in msg for w in ["sarah", "wife", "spouse", "husband"]):
        if not draft.get("claim_id"):
            text = (
                "Thank you, Sarah. I'm so sorry for your loss. "
                "To get started with the claim, could you please provide me with "
                "your phone number and email address so we can stay in touch?"
            )
        else:
            text = "How can I help you with the claim?"
    elif any(w in msg for w in ["phone", "email", "@", "555"]):
        text = (
            "Thank you for providing your contact information. I've started the claim process. "
            "Could you tell me the date and cause of death? Or if you have the death certificate, "
            "I can extract that information for you."
        )
    else:
        text = (
            f"I can help you with questions about your policy {policy.policy_number}. "
            f"I can look up payment information, coverage details, beneficiary information, "
            f"or help you file a claim. What would you like to know?"
        )

    events.append({"type": "text", "data": text})
    return events
