"""
AI layer — document extraction, risk scoring, adjuster copilot, communication drafting.
Uses Claude if ANTHROPIC_API_KEY is set. Falls back to realistic mocks otherwise.
"""
import os
import base64
import json
from datetime import date, datetime
from typing import Generator

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-3-5-sonnet-20241022"


def _get_client():
    if not ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        return None


def extract_document(file_bytes: bytes, filename: str) -> dict:
    """Extract structured fields from an uploaded death certificate."""
    client = _get_client()
    if client:
        try:
            ext = filename.split(".")[-1].lower()
            media_type = "application/pdf" if ext == "pdf" else f"image/{ext if ext in ('png','jpg','jpeg','webp') else 'jpeg'}"
            b64 = base64.standard_b64encode(file_bytes).decode()
            prompt = """Extract the following fields from this death certificate and return valid JSON only:
{
  "deceased_name": "full name",
  "date_of_death": "YYYY-MM-DD",
  "cause_of_death": "primary cause",
  "manner_of_death": "natural|accident|homicide|suicide|undetermined",
  "certifying_physician": "name",
  "jurisdiction": "city/county, state",
  "certificate_number": "number if visible"
}
If a field is not visible, use null."""
            resp = client.messages.create(
                model=MODEL, max_tokens=512,
                messages=[{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": prompt}
                ]}]
            )
            text = resp.content[0].text.strip()
            # Strip markdown code block if present
            if text.startswith("```"):
                text = "\n".join(text.split("\n")[1:-1])
            return json.loads(text)
        except Exception as e:
            print(f"AI extraction error: {e}")

    # Mock response
    return {
        "deceased_name": "Extracted from certificate",
        "date_of_death": str(date.today()),
        "cause_of_death": "As indicated on certificate",
        "manner_of_death": "natural",
        "certifying_physician": "Certifying physician",
        "jurisdiction": "County, State",
        "certificate_number": "MOCK-2026-001",
    }


def score_risk(claim_data: dict, policy_data: dict) -> dict:
    """Score claim risk and flag contestability issues."""
    client = _get_client()

    # Always compute contestability based on dates
    issue_date = policy_data.get("issue_date", "")
    months_since_issue = 0
    contestability_alert = False
    if issue_date:
        try:
            issued = datetime.strptime(issue_date, "%Y-%m-%d").date()
            months_since_issue = (date.today() - issued).days / 30
            contestability_alert = months_since_issue < 24
        except Exception:
            pass

    if client:
        try:
            prompt = f"""Analyze this life insurance death benefit claim and return a risk assessment as JSON.

Claim data: {json.dumps(claim_data, default=str)}
Policy data: {json.dumps(policy_data, default=str)}
Months since policy issued: {months_since_issue:.1f}

Return JSON only:
{{
  "risk_level": "low|medium|high",
  "contestability_alert": true|false,
  "flags": ["list of specific risk flags as strings"],
  "recommendation": "fast_track|standard_review|contestability_review|siu_referral",
  "ai_summary": "2-3 sentence plain English summary for adjuster"
}}"""
            resp = client.messages.create(
                model=MODEL, max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp.content[0].text.strip()
            if text.startswith("```"):
                text = "\n".join(text.split("\n")[1:-1])
            result = json.loads(text)
            result["months_since_issue"] = round(months_since_issue, 1)
            return result
        except Exception as e:
            print(f"AI risk scoring error: {e}")

    # Mock: derive from data
    flags = []
    risk_level = "low"
    recommendation = "fast_track"

    if contestability_alert:
        flags.append(f"Policy issued {months_since_issue:.0f} months ago — within 2-year contestability period")
        risk_level = "medium"
        recommendation = "contestability_review"

    if months_since_issue < 6:
        flags.append("Policy purchased less than 6 months before death — requires investigation")
        risk_level = "high"
        recommendation = "siu_referral"

    manner = claim_data.get("manner_of_death", "").lower()
    if manner in ("accident", "undetermined"):
        flags.append(f"Manner of death ({manner}) requires additional documentation")
        if risk_level == "low":
            risk_level = "medium"

    summary = f"Death benefit claim submitted. Policy is {months_since_issue:.0f} months old."
    if contestability_alert:
        summary += " Policy is within the 2-year contestability period — recommend medical records review before approving."
    else:
        summary += " Policy is outside the contestability window."

    return {
        "risk_level": risk_level,
        "contestability_alert": contestability_alert,
        "months_since_issue": round(months_since_issue, 1),
        "flags": flags,
        "recommendation": recommendation,
        "ai_summary": summary,
    }


def stream_copilot(claim_data: dict, message: str) -> Generator[str, None, None]:
    """Stream adjuster copilot response as SSE chunks."""
    client = _get_client()

    system_prompt = f"""You are an AI assistant for a life insurance claims adjuster. You have full context on the following claim:

{json.dumps(claim_data, default=str, indent=2)}

Answer questions concisely and accurately. You can draft letters, explain policy terms, flag risks, and suggest next steps.
Never make up facts not in the claim data. If asked to draft a communication, write it professionally and empathetically."""

    if client:
        try:
            with client.messages.stream(
                model=MODEL, max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": message}]
            ) as stream:
                for text in stream.text_stream:
                    yield text
            return
        except Exception as e:
            print(f"Copilot stream error: {e}")

    # Mock response
    mock = f"Based on claim {claim_data.get('claim_number','')}: "
    if "contestab" in message.lower():
        mock += "This claim falls within the 2-year contestability period. I recommend requesting the insured's medical records from the past 5 years before making a determination."
    elif "draft" in message.lower() or "letter" in message.lower():
        mock += f"""Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

Thank you for submitting your claim (#{claim_data.get('claim_number','')}). We have received your documentation and our team is reviewing your claim. We will contact you within 5-7 business days with an update.

If you have questions, please reference your claim number.

Sincerely,
Claims Department"""
    elif "risk" in message.lower() or "flag" in message.lower():
        mock += f"Risk level: {claim_data.get('risk_level','unknown')}. Flags: {', '.join(claim_data.get('risk_flags') or ['None'])}"
    else:
        mock += f"The claim is currently in {claim_data.get('status','unknown')} status. {claim_data.get('ai_summary','')}"

    # Yield in chunks for streaming feel
    for word in mock.split(" "):
        yield word + " "


def draft_communication(claim_data: dict, draft_type: str) -> dict:
    """Generate a professional communication draft."""
    client = _get_client()
    beneficiary = claim_data.get("beneficiary_name", "Beneficiary")
    claim_number = claim_data.get("claim_number", "")

    templates = {
        "acknowledgment": {
            "subject": f"Claim Received — {claim_number}",
            "body": f"""Dear {beneficiary},

We have received your death benefit claim (#{claim_number}) and want to express our sincere condolences for your loss.

Our claims team has begun reviewing your submission. We will contact you within 5–7 business days with a status update. If additional documentation is required, we will reach out promptly.

You can check your claim status at any time using your claim number and email address.

With our sincerest condolences,
Claims Department"""
        },
        "document_request": {
            "subject": f"Additional Documents Required — {claim_number}",
            "body": f"""Dear {beneficiary},

Thank you for submitting your claim (#{claim_number}). To continue processing, we need the following:

• Certified copy of the death certificate (if not already provided)
• Medical records from the past 5 years
• Any additional documentation requested by your claims adjuster

Please submit these documents at your earliest convenience. If you have questions, please don't hesitate to contact us.

Sincerely,
Claims Department"""
        },
        "approval": {
            "subject": f"Claim Approved — {claim_number}",
            "body": f"""Dear {beneficiary},

We are pleased to inform you that your death benefit claim (#{claim_number}) has been approved.

The benefit will be processed according to your selected payout preference. Please allow 3–5 business days for funds to be disbursed.

We are truly sorry for your loss and hope this brings some measure of relief during this difficult time.

Sincerely,
Claims Department"""
        },
        "denial": {
            "subject": f"Claim Decision — {claim_number}",
            "body": f"""Dear {beneficiary},

After careful review of your claim (#{claim_number}), we are unable to approve payment at this time.

[ADJUSTER: Insert specific reason here]

You have the right to appeal this decision within 60 days. Please contact our claims department to initiate an appeal or for further information.

Sincerely,
Claims Department"""
        },
    }

    if client:
        try:
            prompt = f"""Write a professional, empathetic {draft_type} letter for this life insurance claim.
Claim: {json.dumps(claim_data, default=str)}
Return JSON: {{"subject": "...", "body": "..."}}"""
            resp = client.messages.create(
                model=MODEL, max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp.content[0].text.strip()
            if text.startswith("```"):
                text = "\n".join(text.split("\n")[1:-1])
            return json.loads(text)
        except Exception:
            pass

    return templates.get(draft_type, templates["acknowledgment"])
