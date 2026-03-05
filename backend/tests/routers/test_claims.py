"""Tests for claims routes."""
from app.models import Policy, PolicyType, PolicyStatus


def _seed_policy(db_session):
    p = Policy(
        policy_number="LT-99999",
        insured_name="Test User",
        insured_dob="1970-01-01",
        insured_ssn_last4="1234",
        face_amount=250000.0,
        issue_date="2022-01-01",
        policy_type=PolicyType.TERM,
        status=PolicyStatus.IN_FORCE,
    )
    db_session.add(p)
    db_session.commit()
    return p


def test_lookup_policy_not_found(client):
    response = client.post("/api/claims/lookup", json={"policy_number": "XX-00000"})
    assert response.status_code == 404


def test_lookup_policy_found(client, db_session):
    _seed_policy(db_session)
    response = client.post("/api/claims/lookup", json={"policy_number": "LT-99999"})
    assert response.status_code == 200
    data = response.json()
    assert data["found"] is True
    assert "LT-99999" in data["policy_number"]


def test_create_claim(client, db_session):
    _seed_policy(db_session)
    response = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
        "beneficiary_name": "Jane Doe",
        "beneficiary_email": "jane@example.com",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "draft"
    assert data["claim_number"].startswith("CLM-")
    return data


def test_update_claim(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
    })
    claim_id = create_res.json()["id"]
    update_res = client.put(f"/api/claims/{claim_id}", json={"date_of_death": "2026-01-15"})
    assert update_res.status_code == 200
    assert update_res.json()["date_of_death"] == "2026-01-15"


def test_submit_claim(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
        "beneficiary_email": "jane@example.com",
    })
    claim_id = create_res.json()["id"]
    client.put(f"/api/claims/{claim_id}", json={"date_of_death": "2026-03-01"})
    submit_res = client.post(f"/api/claims/{claim_id}/submit")
    assert submit_res.status_code == 200
    data = submit_res.json()
    assert data["status"] == "submitted"
    assert data["risk_level"] in ("low", "medium", "high")


def test_verify_identity(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
    })
    claim_id = create_res.json()["id"]
    res = client.post(f"/api/claims/{claim_id}/verify")
    assert res.status_code == 200
    assert res.json()["verified"] is True
