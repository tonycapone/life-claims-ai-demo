import os
import base64
from typing import Generator

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL = "claude-3-5-sonnet-20241022"


def _get_client():
    import anthropic
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def extract_document(file_bytes: bytes, filename: str) -> dict:
    """Extract structured fields from a death certificate using Claude vision."""
    if not ANTHROPIC_API_KEY:
        # Mock extraction for development
        return {
            "deceased_name": "John Michael Smith",
            "date_of_death": "2026-03-01",
            "cause_of_death": "Acute myocardial infarction",
            "manner_of_death": "Natural",
            "certifying_physician": "Dr. Emily Torres",
            "jurisdiction": "St. Louis County, Missouri",
            "certificate_number": "2026-MO-041892",
        }

    client = _get_client()
    ext = filename.rsplit(".", 1)[-1].lower()
    media_type = "application/pdf" if ext == "pdf" else f"image/{ext}"
    b64 = base64.standard_b64encode(file_bytes).decode("utf-8")

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": b64},
                    },
                    {
                        "type": "text",
                        "text": (
                            "Extract the following fields from this death certificate. "
                            "Return JSON only with keys: deceased_name, date_of_death (YYYY-MM-DD), "
                            "cause_of_death, manner_of_death, certifying_physician, jurisdiction, certificate_number. "
                            "If a field is not present, use null."
                        ),
                    },
                ],
            }
        ],
    )
    import json
    text = message.content[0].text
    # Extract JSON from response
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])


def score_risk(claim_data: dict, policy_data: dict) -> dict:
    """Score claim risk using Claude or realistic mock logic."""
    # Calculate months since policy issue
    from datetime import date
    import dateutil.parser

    issue_date_str = policy_data.get("issue_date") or claim_data.get("policy_issue_date")
    months_since_issue = 0
    if issue_date_str:
        try:
            issue_date = dateutil.parser.parse(issue_date_str).date()
            death_date_str = claim_data.get("date_of_death")
            ref_date = dateutil.parser.parse(death_date_str).date() if death_date_str else date.today()
            delta = ref_date - issue_date
            months_since_issue = delta.days / 30.44
        except Exception:
            pass

    if not ANTHROPIC_API_KEY:
        # Realistic mock based on months_since_issue
        flags = []
        risk_level = "low"
        contestability_alert = False
        recommendation = "fast_track"

        if months_since_issue < 6:
            risk_level = "high"
            flags.append("Policy purchased within 6 months of death")
            flags.append("High-risk new policy — recommend SIU review")
            recommendation = "siu_review"
            contestability_alert = True
        elif months_since_issue < 24:
            risk_level = "medium"
            flags.append(f"Policy within 2-year contestability period ({int(months_since_issue)} months)")
            recommendation = "contestability_review"
            contestability_alert = True

        cause = (claim_data.get("cause_of_death") or "").lower()
        if "cardiac" in cause or "heart" in cause or "myocardial" in cause:
            if months_since_issue < 24:
                flags.append("Cardiac cause of death — cross-check application health disclosures")

        return {
            "risk_level": risk_level,
            "contestability_alert": contestability_alert,
            "months_since_issue": round(months_since_issue, 1),
            "flags": flags,
            "recommendation": recommendation,
            "summary": (
                f"Policy is {int(months_since_issue)} months old. "
                f"Risk level: {risk_level}. "
                + (f"Within contestability window — recommend {recommendation.replace('_', ' ')}." if contestability_alert else "Outside contestability period — standard review.")
            ),
        }

    client = _get_client()
    import json
    prompt = f"""You are a life insurance claims risk analyst. Analyze this claim and return a JSON risk assessment.

Policy data: {json.dumps(policy_data)}
Claim data: {json.dumps(claim_data)}
Months since policy issue: {round(months_since_issue, 1)}

Return JSON with keys:
- risk_level: "low" | "medium" | "high"
- contestability_alert: boolean (true if policy < 24 months old)
- months_since_issue: number
- flags: array of specific risk flag strings
- recommendation: "fast_track" | "standard_review" | "contestability_review" | "siu_review"
- summary: 2-3 sentence professional summary

Return JSON only, no markdown."""

    msg = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    text = msg.content[0].text
    start = text.find("{")
    end = text.rfind("}") + 1
    result = json.loads(text[start:end])
    result["months_since_issue"] = round(months_since_issue, 1)
    return result


def stream_copilot(claim_data: dict, message: str) -> Generator:
    """Stream adjuster copilot response, context-aware to the claim."""
    import json

    if not ANTHROPIC_API_KEY:
        # Mock streaming response
        mock = (
            f"Based on the claim data for {claim_data.get('insured_name', 'this insured')}, "
            f"here is my analysis: The policy is {claim_data.get('months_since_issue', 'N/A')} months old. "
        )
        if claim_data.get("contestability_alert"):
            mock += "This claim is within the 2-year contestability period. I recommend requesting medical records and reviewing the original application for any health disclosure discrepancies. "
        mock += "Let me know if you need a draft communication or further analysis."
        for word in mock.split():
            yield word + " "
        return

    client = _get_client()
    system = f"""You are an AI copilot for a life insurance claims adjuster. 
You have full context of the current claim and help adjusters make decisions, draft communications, and analyze risk.

Current claim context:
{json.dumps(claim_data, indent=2)}

Be professional, precise, and helpful. Use insurance industry terminology. 
When asked to draft letters, write complete professional correspondence."""

    with client.messages.stream(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": message}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def draft_communication(claim_data: dict, draft_type: str) -> str:
    """Generate a professional communication draft."""
    templates = {
        "acknowledgment": f"""Subject: Claim Received — {claim_data.get('claim_number', '')}

Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

We have received your death benefit claim (Claim #{claim_data.get('claim_number', '')}) for policy holder {claim_data.get('insured_name', '')}. We are deeply sorry for your loss.

Our claims team will review your submission and contact you within 5-7 business days. If you have questions, please reference your claim number.

Sincerely,
ClaimPath Claims Department""",

        "document_request": f"""Subject: Additional Documents Required — Claim {claim_data.get('claim_number', '')}

Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

Thank you for submitting your claim. To continue processing, we require the following additional documentation:

- Certified copy of the death certificate
- Medical records from the past 2 years
- Completed attending physician's statement

Please upload these documents through the ClaimPath portal within 30 days.

Sincerely,
ClaimPath Claims Department""",

        "approval": f"""Subject: Claim Approved — {claim_data.get('claim_number', '')}

Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

We are pleased to inform you that your death benefit claim (Claim #{claim_data.get('claim_number', '')}) has been approved.

The death benefit will be processed according to your stated payout preference. Please allow 3-5 business days for the funds to reach your account.

We extend our deepest condolences for your loss.

Sincerely,
ClaimPath Claims Department""",

        "denial": f"""Subject: Claim Decision — {claim_data.get('claim_number', '')}

Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

After careful review of your death benefit claim (Claim #{claim_data.get('claim_number', '')}), we are unable to approve payment at this time.

[Reason for denial to be inserted by adjuster]

You have the right to appeal this decision within 60 days. Please contact our appeals department for more information.

Sincerely,
ClaimPath Claims Department""",

        "medical_records_request": f"""Subject: Medical Records Request — Claim {claim_data.get('claim_number', '')}

Dear {claim_data.get('beneficiary_name', 'Beneficiary')},

As part of our standard review process for Claim #{claim_data.get('claim_number', '')}, we are requesting medical records for {claim_data.get('insured_name', 'the insured')}.

This request is part of our contestability review, as the policy was issued within the past two years. We need records covering the 24 months prior to the policy issue date.

Please provide written authorization to release medical records from [physician name/hospital].

Sincerely,
ClaimPath Claims Department""",
    }

    if ANTHROPIC_API_KEY:
        import json
        client = _get_client()
        prompt = f"""Draft a professional, empathetic {draft_type} letter for this life insurance claim.

Claim data: {json.dumps(claim_data)}

Write a complete professional letter. Be compassionate but clear. Include subject line.
Return only the letter text, no additional commentary."""

        msg = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text

    return templates.get(draft_type, templates["acknowledgment"])
