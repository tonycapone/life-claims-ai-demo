"""
Strands Agent for the adjuster copilot — claim investigation assistant
with tools to look up claim details, policy info, contestability analysis,
regulatory deadlines, and draft letters.

All tools are read-only (except draft_letter which generates text but
doesn't send anything). No side-effect tools, no SSE queue needed.
"""
import os
import json
from datetime import date

from sqlalchemy.orm import Session

from app.models import Claim, Policy

BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "us.anthropic.claude-sonnet-4-6",
)
BEDROCK_REGION = os.getenv("AWS_REGION", "us-east-1")


SYSTEM_PROMPT = """You are an AI copilot for a life insurance claims adjuster. You help \
investigate claims, surface risk flags, explain regulatory requirements, and draft \
professional communications.

You have tools to look up claim details, policy information, contestability analysis, \
regulatory deadlines, and draft letters. Use them when asked — don't guess from memory.

Guidelines:
- Be concise — adjusters are busy. Lead with the answer, then supporting details.
- Cite specific data (dates, amounts, flags) from tool results.
- When asked to draft a letter, use the draft_letter tool and present the result.
- If a tool returns "not available" or "not run yet", say so clearly.
- Never fabricate claim data or risk flags.
- Use markdown formatting for readability (headers, bullet lists, bold for emphasis).
"""


def _format_currency(amount: float) -> str:
    return f"${amount:,.2f}"


def _bedrock_available() -> bool:
    try:
        import boto3
        client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        client.meta.region_name
        return True
    except Exception:
        return False


def build_adjuster_agent(db: Session, claim_id: str):
    """Build a Strands Agent with adjuster copilot tools. Returns the agent."""
    from strands import Agent, tool
    from strands.models.bedrock import BedrockModel
    from strands.handlers.callback_handler import null_callback_handler
    from botocore.config import Config as BotoConfig

    # ── Tool definitions (close over db, claim_id) ────────────────

    @tool
    def get_claim_details() -> str:
        """Get full details for the current claim including beneficiary contact info,
        death details, documents, risk assessment, payout info, and adjuster notes."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return "Claim not found."

        return json.dumps({
            "claim_number": claim.claim_number,
            "status": claim.status.value if claim.status else None,
            "insured_name": claim.insured_name,
            "insured_dob": claim.insured_dob,
            "policy_number": claim.policy_number,
            "policy_issue_date": claim.policy_issue_date,
            "face_amount": _format_currency(claim.face_amount) if claim.face_amount else None,
            "beneficiary_name": claim.beneficiary_name,
            "beneficiary_email": claim.beneficiary_email,
            "beneficiary_phone": claim.beneficiary_phone,
            "beneficiary_relationship": claim.beneficiary_relationship,
            "date_of_death": claim.date_of_death,
            "cause_of_death": claim.cause_of_death,
            "manner_of_death": claim.manner_of_death,
            "payout_method": claim.payout_method,
            "risk_level": claim.risk_level.value if claim.risk_level else None,
            "risk_flags": claim.risk_flags,
            "contestability_alert": claim.contestability_alert,
            "months_since_issue": claim.months_since_issue,
            "ai_summary": claim.ai_summary,
            "adjuster_notes": claim.adjuster_notes,
            "jurisdiction_state": claim.jurisdiction_state,
            "assigned_adjuster": claim.assigned_adjuster,
            "death_certificate_url": claim.death_certificate_url,
        }, default=str)

    @tool
    def get_policy_details() -> str:
        """Get the underlying policy information for this claim, including
        beneficiary history, issue date, policy type, and provisions."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return "Claim not found."

        policy = db.query(Policy).filter_by(policy_number=claim.policy_number).first()
        if not policy:
            return f"Policy {claim.policy_number} not found."

        ptype = policy.policy_type.value if hasattr(policy.policy_type, "value") else str(policy.policy_type)
        status = policy.status.value if hasattr(policy.status, "value") else str(policy.status)

        result = {
            "policy_number": policy.policy_number,
            "insured_name": policy.insured_name,
            "insured_dob": policy.insured_dob,
            "face_amount": _format_currency(policy.face_amount),
            "policy_type": ptype,
            "status": status,
            "issue_date": policy.issue_date,
            "beneficiaries": policy.beneficiaries,
            "beneficiary_history": policy.beneficiary_history,
        }
        return json.dumps(result, default=str)

    @tool
    def get_contestability_analysis() -> str:
        """Get the stored contestability analysis results for this claim.
        Returns discrepancies found between the insurance application and
        medical records, or indicates if the analysis hasn't been run yet."""
        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return "Claim not found."

        if not claim.contestability_analysis:
            return json.dumps({
                "status": "not_run",
                "message": "Contestability analysis has not been run yet. The adjuster can trigger it from the claim detail page.",
            })

        return json.dumps(claim.contestability_analysis, default=str)

    @tool
    def get_regulatory_info() -> str:
        """Get regulatory deadlines for this claim based on the jurisdiction
        state and filing date. Returns acknowledgment and decision deadlines
        with their status (on_track, approaching, overdue, completed)."""
        from app.regulatory import get_regulatory_deadlines

        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return "Claim not found."

        filing_date = claim.created_at.date() if claim.created_at else date.today()
        result = get_regulatory_deadlines(
            filing_date=filing_date,
            state_code=claim.jurisdiction_state,
            claim_status=claim.status.value if claim.status else None,
        )
        return json.dumps(result, default=str)

    @tool
    def draft_letter(draft_type: str) -> str:
        """Draft a professional communication letter for this claim.
        draft_type must be one of: acknowledgment, document_request, approval, denial.
        Returns the subject line and body text."""
        from app.ai import draft_communication

        claim = db.query(Claim).filter_by(id=claim_id).first()
        if not claim:
            return "Claim not found."

        claim_data = {
            "claim_number": claim.claim_number,
            "beneficiary_name": claim.beneficiary_name,
            "insured_name": claim.insured_name,
            "status": claim.status.value if claim.status else None,
        }
        result = draft_communication(claim_data, draft_type)
        return json.dumps(result, default=str)

    # ── Build agent ───────────────────────────────────────────────

    model = BedrockModel(
        model_id=BEDROCK_MODEL_ID,
        region_name=BEDROCK_REGION,
        boto_client_config=BotoConfig(
            retries={"mode": "adaptive", "max_attempts": 10},
        ),
    )

    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        callback_handler=null_callback_handler,
        tools=[
            get_claim_details,
            get_policy_details,
            get_contestability_analysis,
            get_regulatory_info,
            draft_letter,
        ],
    )

    return agent


# ── Mock fallback (no Bedrock) ──────────────────────────────────

def mock_copilot_response(message: str, claim: Claim) -> list[dict]:
    """Keyword-based canned responses when Bedrock is unavailable."""
    msg = message.lower()
    events = []

    if any(w in msg for w in ["risk", "flag", "red flag", "concern"]):
        flags = claim.risk_flags or []
        if flags:
            lines = [f"**Risk Level: {(claim.risk_level.value if claim.risk_level else 'unknown').upper()}**\n"]
            for f in flags:
                lines.append(f"- {f}")
            if claim.ai_summary:
                lines.append(f"\n{claim.ai_summary}")
            text = "\n".join(lines)
        else:
            text = f"No risk flags identified for this claim. Risk level: {claim.risk_level.value if claim.risk_level else 'not scored yet'}."

    elif any(w in msg for w in ["contestab", "discrepan", "misrepresent", "application"]):
        if claim.contestability_analysis:
            analysis = claim.contestability_analysis
            discs = analysis.get("discrepancies", [])
            lines = [f"**Contestability Analysis** — {len(discs)} discrepancies found\n"]
            for d in discs:
                lines.append(f"- **{d.get('severity', 'unknown').upper()}**: {d.get('assessment', '')[:120]}...")
            lines.append(f"\n**Summary:** {analysis.get('summary', '')}")
            text = "\n".join(lines)
        else:
            text = "Contestability analysis has not been run yet. You can trigger it from the claim detail page."

    elif any(w in msg for w in ["regulat", "deadline", "timeline", "compliance"]):
        from app.regulatory import get_regulatory_deadlines
        filing_date = claim.created_at.date() if claim.created_at else date.today()
        info = get_regulatory_deadlines(
            filing_date=filing_date,
            state_code=claim.jurisdiction_state,
            claim_status=claim.status.value if claim.status else None,
        )
        lines = [f"**{info['state_name']} ({info['state']})** — {info['statute_reference']}\n"]
        for d in info.get("deadlines", []):
            status_icon = {"on_track": "on track", "approaching": "APPROACHING", "overdue": "OVERDUE", "completed": "completed"}.get(d["status"], d["status"])
            lines.append(f"- **{d['name']}**: {d['due_date']} ({d['days_remaining']} days remaining — {status_icon})")
        text = "\n".join(lines)

    elif any(w in msg for w in ["draft", "letter", "write", "communication"]):
        from app.ai import draft_communication
        draft_type = "acknowledgment"
        if "denial" in msg or "deny" in msg:
            draft_type = "denial"
        elif "approval" in msg or "approve" in msg:
            draft_type = "approval"
        elif "document" in msg or "request" in msg:
            draft_type = "document_request"

        claim_data = {
            "claim_number": claim.claim_number,
            "beneficiary_name": claim.beneficiary_name,
            "insured_name": claim.insured_name,
            "status": claim.status.value if claim.status else None,
        }
        result = draft_communication(claim_data, draft_type)
        text = f"**{result['subject']}**\n\n{result['body']}"

    elif any(w in msg for w in ["policy", "coverage", "face amount", "beneficiar"]):
        text = (
            f"**Policy {claim.policy_number}**\n"
            f"- Insured: {claim.insured_name}\n"
            f"- Face Amount: {_format_currency(claim.face_amount) if claim.face_amount else 'N/A'}\n"
            f"- Issue Date: {claim.policy_issue_date}\n"
            f"- Months Since Issue: {claim.months_since_issue}\n"
            f"- Contestability Alert: {'Yes' if claim.contestability_alert else 'No'}"
        )

    elif any(w in msg for w in ["status", "summary", "overview", "where"]):
        text = (
            f"**Claim {claim.claim_number}** — {claim.status.value if claim.status else 'unknown'}\n\n"
            f"- Insured: {claim.insured_name}\n"
            f"- Beneficiary: {claim.beneficiary_name} ({claim.beneficiary_relationship})\n"
            f"- Cause of Death: {claim.cause_of_death or 'not recorded'}\n"
            f"- Face Amount: {_format_currency(claim.face_amount) if claim.face_amount else 'N/A'}\n"
        )
        if claim.ai_summary:
            text += f"\n{claim.ai_summary}"

    else:
        text = (
            f"I can help you investigate claim {claim.claim_number}. Try asking about:\n"
            f"- Risk flags and concerns\n"
            f"- Contestability analysis results\n"
            f"- Regulatory deadlines\n"
            f"- Policy details\n"
            f"- Draft a communication letter"
        )

    events.append({"type": "text", "data": text})
    return events
