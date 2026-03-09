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

Pay special attention to:
- Cross-reference manner/cause of death against application health questionnaire answers (especially hazardous activities)
- Recent beneficiary changes (look at beneficiary_history for changes close to date of death)
- Contestability period status

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
    cause = (claim_data.get("cause_of_death") or "").lower()

    # Check for hazardous activity mismatch
    if manner == "accident" and any(kw in cause for kw in ("climbing", "fall", "rock")):
        flags.append("Cause of death involves rock climbing — applicant denied hazardous activity participation on application Q12")
        risk_level = "high"
        recommendation = "siu_referral"
    elif manner in ("accident", "undetermined"):
        flags.append(f"Manner of death ({manner}) requires additional documentation")
        if risk_level == "low":
            risk_level = "medium"

    # Check for recent beneficiary changes
    bene_history = policy_data.get("beneficiary_history") or []
    if len(bene_history) >= 2:
        last_change = bene_history[-1]
        prev_bene = bene_history[-2]
        change_date = last_change.get("effective_date", "")
        if change_date and last_change.get("change_type") == "beneficiary_change":
            try:
                changed = datetime.strptime(change_date, "%Y-%m-%d").date()
                months_since_change = (date.today() - changed).days / 30
                if months_since_change < 12:
                    flags.append(
                        f"Beneficiary changed from {prev_bene['name']} ({prev_bene['relationship']}) "
                        f"to {last_change['name']} ({last_change['relationship']}) "
                        f"{int(months_since_change)} months before death"
                    )
                    # Beneficiary change alone → medium; combined with hazardous activity → high
                    if risk_level == "high":
                        recommendation = "siu_referral"
                    elif risk_level == "low":
                        risk_level = "medium"
                        recommendation = "contestability_review"
            except Exception:
                pass

    summary = f"Death benefit claim submitted. Policy is {months_since_issue:.0f} months old."
    if risk_level == "high" and any("rock climbing" in f.lower() for f in flags):
        summary = (
            f"Multiple material concerns — accidental death from rock climbing while applicant denied hazardous activities on Q12."
        )
        if any("beneficiary changed" in f.lower() for f in flags):
            summary += " Combined with a recent beneficiary change. Recommend SIU referral."
        if contestability_alert:
            summary += f" Policy is within the 2-year contestability period ({months_since_issue:.0f} months)."
    elif contestability_alert:
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


FNOL_REQUIRED_FIELDS = [
    "policy_number",
    "beneficiary_name",
    "beneficiary_email",
    "beneficiary_phone",
    "beneficiary_relationship",
    "date_of_death",
    "cause_of_death",
    "manner_of_death",
    "payout_method",
]


def _collected_fields(draft: dict) -> list[str]:
    return [f for f in FNOL_REQUIRED_FIELDS if draft.get(f)]


def _missing_fields(draft: dict) -> list[str]:
    return [f for f in FNOL_REQUIRED_FIELDS if not draft.get(f)]


def extract_fnol_fields(user_message: str, draft: dict) -> dict:
    """Extract structured claim fields from a user message via non-streaming call."""
    # Detect if user wants to skip death certificate upload
    skip_phrases = ["don't have", "dont have", "skip", "don't have it", "no certificate",
                    "i'll provide later", "not right now", "no i don't", "i can't",
                    "later", "not available"]
    if should_request_death_cert(draft):
        msg_lower = user_message.lower().strip()
        if any(phrase in msg_lower for phrase in skip_phrases):
            return {"death_certificate_skipped": True}

    missing = _missing_fields(draft)
    if not missing:
        return {}

    system = f"""You extract life insurance claim fields from user messages.
Return ONLY valid JSON with extracted fields. Return {{}} if nothing extractable.

Possible keys (extract ONLY these):
- policy_number: string, format like "LT-XXXXX"
- beneficiary_name: string, full name
- beneficiary_email: string, email address
- beneficiary_phone: string, phone number
- beneficiary_relationship: string, e.g. "spouse", "child", "parent", "sibling", "other"
- date_of_death: string, YYYY-MM-DD format
- cause_of_death: string, brief description
- manner_of_death: string, one of "natural", "accident", "undetermined"
- payout_method: string, one of "lump_sum", "structured"

Already collected: {json.dumps({f: draft[f] for f in _collected_fields(draft)})}
Still needed: {json.dumps(missing)}

Only extract fields that are still needed. Return valid JSON only, no markdown."""

    messages = [{"role": "user", "content": [{"text": user_message}]}]

    client = _get_client()
    if client:
        try:
            text = _converse(system, messages, max_tokens=256, temperature=0.0)
            if not text or text.strip() == "":
                return {}
            return _parse_json(text)
        except Exception as e:
            print(f"FNOL extract error: {e}")

    return {}


def should_request_death_cert(draft: dict) -> bool:
    """Check if it's time to ask for death certificate upload.

    We ask after beneficiary info is collected but before death details,
    unless the user already uploaded or skipped.
    """
    has_beneficiary = all(
        draft.get(f)
        for f in ["policy_number", "beneficiary_name", "beneficiary_relationship"]
    )
    has_death_info = any(
        draft.get(f)
        for f in ["date_of_death", "cause_of_death", "manner_of_death"]
    )
    already_uploaded = draft.get("death_certificate_uploaded")
    already_skipped = draft.get("death_certificate_skipped")
    return has_beneficiary and not has_death_info and not already_uploaded and not already_skipped


def stream_fnol_chat(messages: list[dict], draft: dict) -> Generator[str, None, None]:
    """Stream conversational FNOL response as text chunks."""
    collected = _collected_fields(draft)
    missing = _missing_fields(draft)

    system = f"""You are a compassionate claims assistant helping a beneficiary file a life insurance death benefit claim.

Current draft state:
- Collected: {json.dumps({f: draft[f] for f in collected}) if collected else "nothing yet"}
- Still needed: {json.dumps(missing) if missing else "ALL FIELDS COLLECTED"}
- Death certificate uploaded: {"yes" if draft.get("death_certificate_uploaded") else "no"}
- Death certificate skipped: {"yes" if draft.get("death_certificate_skipped") else "no"}

Guidelines:
- Be warm, empathetic, and professional — the user is grieving
- Keep responses to 2-4 sentences
- Ask for at most 2-3 pieces of information at a time
- The user is already logged into their carrier app — policy_number, beneficiary_name, beneficiary_email, and beneficiary_relationship are already known. NEVER ask for any of these.
- Guide through this order: phone number → death certificate upload → death details (if not extracted from certificate) → payout preference
- After phone is collected and death certificate has NOT been uploaded yet, ask the user to upload a death certificate. Say something like "If you have a copy of the death certificate, you can upload it now and I'll extract the details automatically."
- If the user uploaded a death certificate and fields were extracted, acknowledge what was extracted and move on to payout preference
- If the user says they don't have the death certificate or wants to skip, that's fine — ask for date of death, cause, and manner manually
- If all fields collected, congratulate them and say you'll show a review summary
- Never ask for information already collected
- Use natural language, not field names"""

    # Convert messages to Bedrock format
    bedrock_msgs = []
    for m in messages:
        bedrock_msgs.append({
            "role": m["role"],
            "content": [{"text": m["content"]}],
        })

    client = _get_client()
    if client:
        try:
            resp = client.converse_stream(
                modelId=BEDROCK_MODEL_ID,
                system=[{"text": system}],
                messages=bedrock_msgs,
                inferenceConfig={"maxTokens": 512, "temperature": 0.4},
            )
            for event in resp["stream"]:
                if "contentBlockDelta" in event:
                    delta = event["contentBlockDelta"]["delta"]
                    if "text" in delta:
                        yield delta["text"]
            return
        except Exception as e:
            print(f"FNOL chat stream error: {e}")

    # Mock fallback — contextual canned responses
    if "beneficiary_phone" not in collected:
        mock = "Thank you. What's the best phone number to reach you at?"
    elif not draft.get("death_certificate_uploaded") and not draft.get("death_certificate_skipped") and "date_of_death" not in collected:
        mock = f"Thank you, {draft.get('beneficiary_name', '')}. If you have a copy of the death certificate, you can upload it now and I'll extract the details automatically. This helps speed things up."
    elif "date_of_death" not in collected:
        mock = f"Thank you, {draft.get('beneficiary_name', '')}. I know this is difficult. Could you share the date of death and the cause?"
    elif "date_of_death" in collected and "payout_method" not in collected:
        mock = "We're almost done. For the benefit payout, would you prefer a lump sum or structured payments?"
    elif not missing:
        mock = "I have everything I need. Let me show you a summary so you can review and submit your claim."
    else:
        still = ", ".join(missing[:2])
        mock = f"Thank you for that information. I still need: {still}. Could you provide those?"

    for word in mock.split(" "):
        yield word + " "


def analyze_contestability(application_text: str, medical_records_text: str, claim_data: dict = None) -> dict:
    """Compare insurance application answers against medical records to find discrepancies.

    This is the killer feature — finds material misrepresentations in seconds
    vs. 2-3 days of manual adjuster review.
    """
    client = _get_client()
    if client:
        try:
            system = """You are an expert life insurance claims analyst specializing in contestability investigations.

Your task is to compare an insurance application's health questionnaire answers against actual medical records to identify material misrepresentations — cases where the applicant answered health questions inaccurately.

Return your analysis as valid JSON only (no markdown fences) with this exact structure:
{
  "discrepancies": [
    {
      "application_question": "The exact question from the application",
      "applicant_answer": "What the applicant answered (Yes or No)",
      "medical_finding": "What the medical records actually show, with specific details",
      "source_date": "YYYY-MM-DD of the relevant medical record entry",
      "severity": "material" or "minor",
      "assessment": "Professional assessment of the misrepresentation and its significance"
    }
  ],
  "summary": "2-3 sentence overview of findings",
  "recommendation": "contestability_review" or "standard_review",
  "materiality_assessment": "Assessment of whether the undisclosed conditions are material to the risk and/or related to the cause of death"
}

Rules:
- Only flag actual discrepancies where the application answer contradicts the medical evidence
- "material" severity means the information would have affected the underwriting decision
- "minor" severity means it's a discrepancy but unlikely to have changed the outcome
- Be specific — cite dates, diagnoses, medications, and ICD codes from the records
- The materiality_assessment should address whether undisclosed conditions relate to cause of death"""

            claim_context = ""
            if claim_data:
                claim_context = f"""

=== CLAIM DETAILS ===
Manner of death: {claim_data.get('manner_of_death', 'unknown')}
Cause of death: {claim_data.get('cause_of_death', 'unknown')}
Date of death: {claim_data.get('date_of_death', 'unknown')}

Also cross-reference the cause/manner of death against application questions about hazardous activities."""

            prompt = f"""Compare the following insurance application against the medical records and identify all discrepancies.

=== INSURANCE APPLICATION ===
{application_text}

=== MEDICAL RECORDS ===
{medical_records_text}
{claim_context}
Analyze each health question answer against the medical record evidence. Return JSON only."""

            messages = [{"role": "user", "content": [{"text": prompt}]}]
            text = _converse(system, messages, max_tokens=2048, temperature=0.2)
            return _parse_json(text)
        except Exception as e:
            print(f"Contestability analysis error: {e}")

    # ── Mock fallback — realistic hardcoded data matching synthetic documents ──
    discrepancies = [
        {
            "application_question": "Have you ever been diagnosed with or treated for any form of heart disease, including but not limited to coronary artery disease, arrhythmia, or heart failure?",
            "applicant_answer": "No",
            "medical_finding": "Patient was diagnosed with atrial fibrillation (I48.91) on June 15, 2023 and started on metoprolol 25mg BID for rate control and Eliquis 5mg BID for stroke prophylaxis. AFib documented as persistent condition through January 2025.",
            "source_date": "2023-06-15",
            "severity": "material",
            "assessment": "Material misrepresentation — Atrial fibrillation is a form of cardiac arrhythmia (heart disease) that was diagnosed 14 months prior to the application date. This condition was actively being treated with two medications at the time of application. This would have significantly impacted underwriting, likely resulting in a rated policy or decline."
        },
        {
            "application_question": "Have you been prescribed medication for high blood pressure (hypertension)?",
            "applicant_answer": "No",
            "medical_finding": "Patient was diagnosed with hypertension (I10) on September 20, 2023 with BP reading of 148/92. Started on lisinopril 10mg daily, later increased to 20mg on August 5, 2024. Was actively taking lisinopril at time of application.",
            "source_date": "2023-09-20",
            "severity": "material",
            "assessment": "Material misrepresentation — Hypertension was diagnosed 11 months before the application and actively treated with lisinopril at the time of application. Combined with the undisclosed atrial fibrillation, this represents a significantly elevated cardiovascular risk profile that was concealed from the insurer."
        },
        {
            "application_question": "Have you been hospitalized or visited an emergency room in the past 5 years for any reason?",
            "applicant_answer": "No",
            "medical_finding": "Patient presented to the Emergency Department on March 10, 2024 with acute chest pain radiating to left arm. Evaluated for possible MI with serial troponins (negative x2), ECG, and chest X-ray. Pain resolved with sublingual nitroglycerin. Discharged with follow-up.",
            "source_date": "2024-03-10",
            "severity": "material",
            "assessment": "Material misrepresentation — ER visit for acute chest pain occurred 9 months before the application date. The presentation (chest pain with left arm radiation, requiring nitroglycerin) is directly relevant to cardiovascular risk assessment. The subsequent stress test and cardiology referral further demonstrate the significance of this event."
        },
        {
            "application_question": "Are you currently taking any prescription medications?",
            "applicant_answer": "No",
            "medical_finding": "As of the last visit before the application (January 12, 2025), patient was actively taking four prescription medications: metoprolol 25mg BID, Eliquis 5mg BID, lisinopril 20mg daily, and atorvastatin 20mg daily.",
            "source_date": "2025-01-12",
            "severity": "material",
            "assessment": "Material misrepresentation — Patient was taking four prescription medications for cardiovascular conditions at the time of application. These medications (beta-blocker, anticoagulant, ACE inhibitor, statin) collectively indicate a significant cardiac risk profile that was entirely undisclosed."
        },
    ]

    # Conditionally add hazardous activity discrepancy for accidental death claims
    claim_manner = ""
    claim_cause = ""
    if claim_data:
        claim_manner = (claim_data.get("manner_of_death") or "").lower()
        claim_cause = (claim_data.get("cause_of_death") or "").lower()

    if claim_manner == "accident" and any(kw in claim_cause for kw in ("climbing", "fall", "rock", "trauma")):
        discrepancies.append({
            "application_question": "Do you participate in any hazardous activities (e.g., skydiving, scuba diving, motorsports, rock climbing)?",
            "applicant_answer": "No",
            "medical_finding": "Death certificate indicates death by blunt force trauma from a fall during recreational rock climbing at Starved Rock State Park. The death circumstance directly involves a hazardous activity that was denied on the application.",
            "source_date": "2026-03-03",
            "severity": "material",
            "assessment": "Material misrepresentation — The insured died while rock climbing, an activity specifically listed on Q12 that the applicant denied participating in. This is directly relevant to the cause of death and represents a concealed risk factor."
        })

    count = len(discrepancies)
    summary = f"{count} material misrepresentations identified on the insurance application. The applicant denied having heart disease, hypertension, ER visits, and prescription medications — all of which are directly contradicted by medical records showing active atrial fibrillation, hypertension, an ER visit for chest pain, and four daily cardiovascular medications."
    if count > 4:
        summary += " Additionally, the death certificate reveals the insured died during rock climbing — a hazardous activity specifically denied on the application."

    materiality = "The undisclosed conditions are directly and causally related to the cause of death (acute myocardial infarction / STEMI). The insured had a documented history of atrial fibrillation, hypertension, hyperlipidemia, and a prior ER visit for chest pain — all significant cardiovascular risk factors that culminated in the fatal cardiac event. Had these conditions been disclosed at application, the policy would very likely have been rated at a significantly higher premium, issued with exclusions, or declined entirely. These misrepresentations are material under Illinois insurance law (215 ILCS 5/154) and the policy is within the 2-year contestability period."
    if count > 4:
        materiality = "The insured died from blunt force trauma during recreational rock climbing — an activity specifically listed and denied on application Q12. This represents a direct, causal link between the misrepresentation and the insured event. Additionally, four medical misrepresentations were identified: undisclosed atrial fibrillation, hypertension, an ER visit for chest pain, and four active prescription medications. The combination of a hazardous activity directly causing death plus multiple medical misrepresentations represents an exceptionally strong basis for contestability action under Illinois insurance law (215 ILCS 5/154)."

    return {
        "discrepancies": discrepancies,
        "summary": summary,
        "recommendation": "contestability_review",
        "materiality_assessment": materiality,
    }


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
