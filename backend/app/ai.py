import os
import base64
from typing import Generator

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL = "claude-3-5-sonnet-20241022"


def extract_document(file_bytes: bytes, filename: str) -> dict:
    """Extract fields from a death certificate using Claude vision, or return mock."""
    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            ext = filename.lower().split(".")[-1]
            media_type = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png" if ext == "png" else "application/pdf"
            b64 = base64.standard_b64encode(file_bytes).decode("utf-8")
            response = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": media_type, "data": b64},
                        },
                        {
                            "type": "text",
                            "text": (
                                "Extract the following fields from this death certificate and return them as JSON only:\n"
                                "deceased_name, date_of_death (YYYY-MM-DD), cause_of_death, manner_of_death, "
                                "certifying_physician, jurisdiction, certificate_number.\n"
                                "Return only valid JSON with these keys. If a field is not found, use null."
                            ),
                        },
                    ],
                }],
            )
            import json
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception:
            pass

    # Mock extraction
    return {
        "deceased_name": "John Michael Smith",
        "date_of_death": "2026-03-01",
        "cause_of_death": "Acute myocardial infarction",
        "manner_of_death": "Natural",
        "certifying_physician": "Dr. Emily Torres",
        "jurisdiction": "St. Louis County, Missouri",
        "certificate_number": "2026-MO-041892",
    }


def score_risk(claim_data: dict, policy_data: dict) -> dict:
    """Score claim risk using Claude, or return realistic mock."""
    months_since_issue = claim_data.get("months_since_issue", 48)

    if ANTHROPIC_API_KEY:
        try:
            import anthropic, json
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            prompt = (
                f"You are a life insurance claims risk scoring AI.\n"
                f"Claim data: {claim_data}\nPolicy data: {policy_data}\n"
                f"Return a JSON object with: risk_level (low/medium/high), contestability_alert (bool), "
                f"months_since_issue (number), flags (list of strings), recommendation "
                f"(fast_track/standard_review/contestability_review/escalate_siu), summary (string)."
            )
            response = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception:
            pass

    # Mock scoring logic
    flags = []
    if months_since_issue < 6:
        risk_level = "high"
        contestability = True
        flags.append("Policy purchased within 6 months of death — high fraud risk")
        flags.append(f"Policy within 2-year contestability period ({months_since_issue:.0f} months old)")
        recommendation = "escalate_siu"
    elif months_since_issue < 24:
        risk_level = "medium"
        contestability = True
        flags.append(f"Policy within 2-year contestability period ({months_since_issue:.0f} months old)")
        flags.append("Recommend medical records review before approval")
        recommendation = "contestability_review"
    else:
        risk_level = "low"
        contestability = False
        recommendation = "fast_track"

    return {
        "risk_level": risk_level,
        "contestability_alert": contestability,
        "months_since_issue": months_since_issue,
        "flags": flags,
        "recommendation": recommendation,
        "summary": (
            f"Policy is {months_since_issue:.0f} months old. "
            + ("Within 2-year contestability period — recommend full review before paying." if contestability
               else "Outside contestability period — standard processing applies.")
        ),
    }


def stream_copilot(claim_data: dict, message: str) -> Generator[str, None, None]:
    """Stream AI copilot response for adjuster chat."""
    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            system = (
                "You are an AI copilot for life insurance claims adjusters. "
                "You have deep knowledge of insurance regulations, contestability law, fraud detection, "
                "and claims processing best practices. Be concise, professional, and action-oriented.\n"
                f"Current claim context:\n{claim_data}"
            )
            with client.messages.stream(
                model=MODEL,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": message}],
            ) as stream:
                for text in stream.text_stream:
                    yield text
            return
        except Exception:
            pass

    # Mock streaming
    mock = (
        "Based on the claim details, here is my assessment:\n\n"
        "This claim requires careful review given the policy age. "
        "I recommend requesting certified medical records from the treating physician "
        "to verify consistency with the application health disclosures. "
        "Standard contestability review timeline is 4-8 weeks. "
        "Document all communications in the audit trail."
    )
    for word in mock.split(" "):
        yield word + " "


def draft_communication(claim_data: dict, draft_type: str) -> str:
    """Generate a professional communication draft."""
    beneficiary = claim_data.get("beneficiary_name", "the beneficiary")
    claim_num = claim_data.get("claim_number", "your claim")
    insured = claim_data.get("insured_name", "the insured")

    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            prompt = (
                f"Write a professional, empathetic {draft_type} letter for a life insurance death benefit claim.\n"
                f"Claim data: {claim_data}\n"
                f"The letter should be appropriate for a grieving beneficiary. "
                f"Keep it concise, clear, and legally appropriate. Return only the letter body."
            )
            response = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()
        except Exception:
            pass

    templates = {
        "acknowledgment": (
            f"Dear {beneficiary},\n\n"
            f"We have received your death benefit claim (Claim #{claim_num}) for policy held by {insured}. "
            f"We understand this is a difficult time, and we want to assure you that we are here to help.\n\n"
            f"Our claims team will review your submission and contact you within 3-5 business days with next steps. "
            f"You can check your claim status at any time using your claim number and email address.\n\n"
            f"We are deeply sorry for your loss.\n\nSincerely,\nClaimPath Claims Team"
        ),
        "document_request": (
            f"Dear {beneficiary},\n\n"
            f"Thank you for submitting your claim (Claim #{claim_num}). To proceed with our review, "
            f"we require the following additional documentation:\n\n"
            f"- Certified medical records from the treating physician for the 24 months preceding the date of death\n\n"
            f"Please upload these documents through the ClaimPath portal at your earliest convenience. "
            f"If you have any questions, please don't hesitate to contact us.\n\n"
            f"We appreciate your patience during this process.\n\nSincerely,\nClaimPath Claims Team"
        ),
        "approval": (
            f"Dear {beneficiary},\n\n"
            f"We are pleased to inform you that your death benefit claim (Claim #{claim_num}) has been approved. "
            f"The benefit will be processed and disbursed to your designated account within 3-5 business days.\n\n"
            f"We are deeply sorry for your loss and hope this helps provide some financial security during this time.\n\n"
            f"Sincerely,\nClaimPath Claims Team"
        ),
        "denial": (
            f"Dear {beneficiary},\n\n"
            f"We have completed our review of your death benefit claim (Claim #{claim_num}). "
            f"After careful consideration, we are unable to approve this claim at this time. "
            f"Please see the enclosed explanation of benefits for full details.\n\n"
            f"You have the right to appeal this decision within 60 days. "
            f"Please contact our claims team to initiate an appeal.\n\n"
            f"Sincerely,\nClaimPath Claims Team"
        ),
    }
    return templates.get(draft_type, templates["acknowledgment"])
