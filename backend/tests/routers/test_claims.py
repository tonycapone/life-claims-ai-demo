"""Tests for claims routes."""
from app.models import Policy, PolicyType, PolicyStatus


def _seed_policy(db_session):
    policy = Policy(
        policy_number="LT-99999",
        insured_name="Test User",
        insured_dob="1970-01-01",
        insured_ssn_last4="1234",
        face_amount=500000,
        issue_date="2022-01-01",
        policy_type=PolicyType.TERM,
        status=PolicyStatus.IN_FORCE,
        beneficiaries=[{"name": "Jane User", "relationship": "spouse", "percentage": 100}],
    )
    db_session.add(policy)
    db_session.commit()
    return policy


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200


def test_policy_lookup_by_number(client, db_session):
    _seed_policy(db_session)
    res = client.post("/api/claims/lookup", json={"policy_number": "LT-99999"})
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["policy_number"] == "LT-99999"


def test_policy_lookup_not_found(client):
    res = client.post("/api/claims/lookup", json={"policy_number": "NOTEXIST"})
    assert res.status_code == 404


def test_policy_lookup_by_name_dob_ssn(client, db_session):
    _seed_policy(db_session)
    res = client.post("/api/claims/lookup", json={
        "insured_name": "Test User",
        "insured_dob": "1970-01-01",
        "insured_ssn_last4": "1234",
    })
    assert res.status_code == 200
    assert res.json()["found"] is True


def test_create_claim(client, db_session):
    _seed_policy(db_session)
    res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
        "beneficiary_name": "Jane User",
        "beneficiary_email": "jane@test.com",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["claim_number"].startswith("CLM-")
    assert data["status"] == "draft"


def test_update_claim(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
    })
    claim_id = create_res.json()["id"]

    update_res = client.put(f"/api/claims/{claim_id}", json={
        "date_of_death": "2026-03-01",
        "cause_of_death": "Cardiac arrest",
        "manner_of_death": "natural",
    })
    assert update_res.status_code == 200
    assert update_res.json()["date_of_death"] == "2026-03-01"


def test_submit_claim(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
        "beneficiary_email": "jane@test.com",
        "beneficiary_name": "Jane",
    })
    claim_id = create_res.json()["id"]

    submit_res = client.post(f"/api/claims/{claim_id}/submit")
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "submitted"


def test_claim_status(client, db_session):
    _seed_policy(db_session)
    create_res = client.post("/api/claims", json={
        "policy_number": "LT-99999",
        "insured_name": "Test User",
        "beneficiary_email": "jane@test.com",
        "beneficiary_name": "Jane",
    })
    claim_data = create_res.json()
    client.post(f"/api/claims/{claim_data['id']}/submit")

    status_res = client.get("/api/claims/status", params={
        "claim_number": claim_data["claim_number"],
        "email": "jane@test.com",
    })
    assert status_res.status_code == 200


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
