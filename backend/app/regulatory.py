"""
State regulatory deadline rules for life insurance claims.

Hardcoded lookup for key states. In production this would be a
database-backed compliance engine, but for the demo, a dict
with the critical states is enough to show we understand the
adjuster's world.
"""
from datetime import date, timedelta
from typing import Optional


# ── State Rules ──────────────────────────────────────────────
# Each entry: { acknowledge_days, acknowledge_type, decide_days,
#               decide_type, statute_reference, state_name }
# *_type: "calendar" or "business"

STATE_RULES: dict[str, dict] = {
    "CA": {
        "state_name": "California",
        "acknowledge_days": 15,
        "acknowledge_type": "calendar",
        "decide_days": 40,
        "decide_type": "calendar",
        "decide_label": "Decision (from proof of loss)",
        "statute_reference": "CA Insurance Code \u00a710112.95",
    },
    "NY": {
        "state_name": "New York",
        "acknowledge_days": 15,
        "acknowledge_type": "business",
        "decide_days": 30,
        "decide_type": "calendar",
        "decide_label": "Decision (from all docs received)",
        "statute_reference": "NY Insurance Law \u00a73214",
    },
    "TX": {
        "state_name": "Texas",
        "acknowledge_days": 15,
        "acknowledge_type": "business",
        "decide_days": 60,
        "decide_type": "calendar",
        "decide_label": "Payment (from proof of loss)",
        "statute_reference": "TX Insurance Code \u00a71103.203",
    },
    "IL": {
        "state_name": "Illinois",
        "acknowledge_days": 15,
        "acknowledge_type": "business",
        "decide_days": 30,
        "decide_type": "calendar",
        "decide_label": "Decision",
        "statute_reference": "215 ILCS 5/154.6",
    },
    "FL": {
        "state_name": "Florida",
        "acknowledge_days": 14,
        "acknowledge_type": "calendar",
        "decide_days": 90,
        "decide_type": "calendar",
        "decide_label": "Decision",
        "statute_reference": "FL Statutes \u00a7627.4615",
    },
}

DEFAULT_RULE: dict = {
    "state_name": "Default (NAIC Model)",
    "acknowledge_days": 15,
    "acknowledge_type": "calendar",
    "decide_days": 30,
    "decide_type": "calendar",
    "decide_label": "Decision",
    "statute_reference": "NAIC Model Unfair Claims Settlement Practices Act",
}


def _add_business_days(start: date, days: int) -> date:
    """Add N business days (Mon-Fri) to a start date."""
    current = start
    added = 0
    while added < days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Mon=0 .. Fri=4
            added += 1
    return current


def _add_days(start: date, days: int, day_type: str) -> date:
    if day_type == "business":
        return _add_business_days(start, days)
    return start + timedelta(days=days)


def _deadline_status(days_remaining: int, is_completed: bool) -> str:
    if is_completed:
        return "completed"
    if days_remaining < 0:
        return "overdue"
    if days_remaining <= 5:
        return "approaching"
    return "on_track"


def get_regulatory_deadlines(
    filing_date: date,
    state_code: Optional[str],
    claim_status: Optional[str] = None,
    today: Optional[date] = None,
) -> dict:
    """
    Calculate regulatory deadlines for a claim.

    Returns:
      {
        "state": "IL",
        "state_name": "Illinois",
        "deadlines": [
          {"name": "Acknowledgment", "due_date": "2026-03-18",
           "days_remaining": 10, "status": "on_track"},
          ...
        ],
        "statute_reference": "215 ILCS 5/154.6"
      }
    """
    if today is None:
        today = date.today()

    rule = STATE_RULES.get(state_code or "", DEFAULT_RULE)
    code = state_code or "DEFAULT"

    # Acknowledgment deadline
    ack_due = _add_days(filing_date, rule["acknowledge_days"], rule["acknowledge_type"])
    ack_remaining = (ack_due - today).days

    # Determine if acknowledgment is completed based on claim status
    # If claim is past submitted, acknowledgment has been made
    ack_completed = claim_status in (
        "under_review", "pending_documents", "contestability_review",
        "siu_review", "approved", "paid", "denied",
    )

    # Decision deadline
    decide_due = _add_days(filing_date, rule["decide_days"], rule["decide_type"])
    decide_remaining = (decide_due - today).days

    decide_completed = claim_status in ("approved", "paid", "denied")

    deadlines = [
        {
            "name": "Acknowledgment",
            "due_date": ack_due.isoformat(),
            "days_remaining": ack_remaining,
            "status": _deadline_status(ack_remaining, ack_completed),
            "day_type": rule["acknowledge_type"],
            "day_count": rule["acknowledge_days"],
        },
        {
            "name": rule.get("decide_label", "Decision"),
            "due_date": decide_due.isoformat(),
            "days_remaining": decide_remaining,
            "status": _deadline_status(decide_remaining, decide_completed),
            "day_type": rule["decide_type"],
            "day_count": rule["decide_days"],
        },
    ]

    return {
        "state": code,
        "state_name": rule["state_name"],
        "deadlines": deadlines,
        "statute_reference": rule["statute_reference"],
    }
