"""Tests for adjuster routes."""
from passlib.context import CryptContext
from app.models import Adjuster, Policy, PolicyType, PolicyStatus

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def _seed_adjuster(db_session):
    a = Adjuster(
        username="j.martinez",
        full_name="J. Martinez",
        email="j.martinez@claimpath.ai",
        hashed_password=pwd_context.hash("testpass123"),
    )
    db_session.add(a)
    db_session.commit()
    return a


def _seed_policy(db_session):
    p = Policy(
        policy_number="LT-88888",
        insured_name="Adj Test User",
        insured_dob="1960-06-15",
        insured_ssn_last4="5678",
        face_amount=500000.0,
        issue_date="2022-06-01",
        policy_type=PolicyType.TERM,
        status=PolicyStatus.IN_FORCE,
    )
    db_session.add(p)
    db_session.commit()
    return p


def _login(client, db_session):
    _seed_adjuster(db_session)
    res = client.post("/api/adjuster/login", json={"username": "j.martinez", "password": "testpass123"})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_adjuster_login_invalid(client):
    res = client.post("/api/adjuster/login", json={"username": "nobody", "password": "wrong"})
    assert res.status_code == 401


def test_adjuster_login_success(client, db_session):
    token = _login(client, db_session)
    assert token


def test_claims_queue_unauthenticated(client):
    res = client.get("/api/adjuster/claims")
    assert res.status_code == 401


def test_claims_queue_authenticated(client, db_session):
    token = _login(client, db_session)
    res = client.get("/api/adjuster/claims", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_claim_action(client, db_session):
    _seed_policy(db_session)
    token = _login(client, db_session)
    headers = {"Authorization": f"Bearer {token}"}
    # Create a claim first
    claim_res = client.post("/api/claims", json={
        "policy_number": "LT-88888",
        "insured_name": "Adj Test User",
        "beneficiary_email": "ben@example.com",
    })
    claim_id = claim_res.json()["id"]
    client.post(f"/api/claims/{claim_id}/submit")
    # Take action
    action_res = client.post(
        f"/api/adjuster/claims/{claim_id}/action",
        json={"action": "approve", "notes": "Looks good"},
        headers=headers,
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "approved"
