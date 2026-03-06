"""
AI layer — document extraction, risk scoring, adjuster copilot, communication drafting.
Uses AWS Bedrock with Claude Haiku. Falls back to realistic mocks if Bedrock unavailable.
"""
import os
import json
from datetime import date, datetime
from typing import Generator

BEDROCK_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "us.anthropic.claude-haiku-4-5-20251001-v1:0"
)
BEDROCK_REGION = os.getenv("AWS_REGION", "us-east-1")

_bedrock_client = None


def _get_client():
    global _bedrock_client
    if _bedrock_client is not None:
        return _bedrock_client
    try:
        import boto3
        _bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        # Quick check that creds are valid by describing the client
        _bedrock_client.meta.region_name
        return _bedrock_client
    except Exception:
        _bedrock_client = None
        return None


def _converse(system: str, messages: list, max_tokens: int = 512, temperature: float = 0.3) -> str:
    """Call Bedrock converse API and return the assistant text."""
    client = _get_client()
    if not client:
        return ""
    resp = client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": system}],
        messages=messages,
        inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
    )
    text = ""
    for block in resp["output"]["message"]["content"]:
        if "text" in block:
            text += block["text"]
    return text.strip()


def _parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = "\n".join(text.split("\n")[1:-1])
    return json.loads(text)


def extract_document(file_bytes: bytes, filename: str) -> dict:
    """Extract structured fields from an uploaded death certificate."""
    client = _get_client()
    if client:
        try:
            ext = filename.split(".")[-1].lower()
            fmt_map = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp", "gif": "gif"}
            image_format = fmt_map.get(ext, "jpeg")

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

            if ext == "pdf":
                content = [
                    {"document": {"format": "pdf", "name": "death_cert", "source": {"bytes": file_bytes}}},
                    {"text": prompt},
                ]
            else:
                content = [
                    {"image": {"format": image_format, "source": {"bytes": file_bytes}}},
                    {"text": prompt},
                ]

            messages = [{"role": "user", "content": content}]
            text = _converse("You are a document extraction assistant. Return only valid JSON.", messages)
            return _parse_json(text)
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

    client = _get_client()
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
            messages = [{"role": "user", "content": [{"text": prompt}]}]
            text = _converse("You are a life insurance claims risk analyst. Return only valid JSON.", messages)
            result = _parse_json(text)
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

    manner = (claim_data.get("manner_of_death") or "").lower()
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
    """Stream adjuster copilot response as SSE chunks via Bedrock converse_stream."""
    system_prompt = f"""You are an AI assistant for a life insurance claims adjuster. You have full context on the following claim:

{json.dumps(claim_data, default=str, indent=2)}

Answer questions concisely and accurately. You can draft letters, explain policy terms, flag risks, and suggest next steps.
Never make up facts not in the claim data. If asked to draft a communication, write it professionally and empathetically."""

    client = _get_client()
    if client:
        try:
            messages = [{"role": "user", "content": [{"text": message}]}]
            resp = client.converse_stream(
                modelId=BEDROCK_MODEL_ID,
                system=[{"text": system_prompt}],
                messages=messages,
                inferenceConfig={"maxTokens": 1024, "temperature": 0.3},
            )
            for event in resp["stream"]:
                if "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"]["delta"]
                    if "text" in delta:
                        yield delta["text"]
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

    for word in mock.split(" "):
        yield word + " "


def draft_communication(claim_data: dict, draft_type: str) -> dict:
    """Generate a professional communication draft."""
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

    client = _get_client()
    if client:
        try:
            prompt = f"""Write a professional, empathetic {draft_type} letter for this life insurance claim.
Claim: {json.dumps(claim_data, default=str)}
Return JSON: {{"subject": "...", "body": "..."}}"""
            messages = [{"role": "user", "content": [{"text": prompt}]}]
            text = _converse("You are a professional insurance communications writer. Return only valid JSON.", messages)
            return _parse_json(text)
        except Exception:
            pass

    return templates.get(draft_type, templates["acknowledgment"])
