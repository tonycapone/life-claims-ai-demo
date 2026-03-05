"""Tests for adjuster routes."""
from passlib.hash import sha256_crypt
from app.models import Adjuster, Policy, Claim, ClaimStatus, PolicyType, PolicyStatus


def _seed_adjuster(db_session):
    adj = Adjuster(
        username="testadj",
        full_name="Test Adjuster",
        email="test@claimpath.ai",
        hashed_password=sha256_crypt.hash("testpass123"),
    )
    db_session.add(adj)
    db_session.commit()
    return adj


def _seed_claim(db_session):
    policy = Policy(
        policy_number="LT-88888",
        insured_name="Insured Person",
        face_amount=250000,
        issue_date="2025-01-01",
        policy_type=PolicyType.TERM,
        status=PolicyStatus.IN_FORCE,
    )
    db_session.add(policy)
    db_session.flush()

    claim = Claim(
        claim_number="CLM-2026-00001",
        policy_number="LT-88888",
        insured_name="Insured Person",
        beneficiary_name="Beneficiary Person",
        beneficiary_email="ben@test.com",
        status=ClaimStatus.SUBMITTED,
        contestability_alert=True,
        months_since_issue=14.0,
    )
    db_session.add(claim)
    db_session.commit()
    return claim


def _get_auth_token(client, db_session):
    _seed_adjuster(db_session)
    res = client.post("/api/adjuster/login", json={"username": "testadj", "password": "testpass123"})
    return res.json()["access_token"]


def test_adjuster_login(client, db_session):
    _seed_adjuster(db_session)
    res = client.post("/api/adjuster/login", json={"username": "testadj", "password": "testpass123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["adjuster"]["username"] == "testadj"


def test_adjuster_login_wrong_password(client, db_session):
    _seed_adjuster(db_session)
    res = client.post("/api/adjuster/login", json={"username": "testadj", "password": "wrongpass"})
    assert res.status_code == 401


def test_adjuster_claims_queue_unauthenticated(client):
    res = client.get("/api/adjuster/claims")
    assert res.status_code in (401, 403)


def test_adjuster_claims_queue(client, db_session):
    token = _get_auth_token(client, db_session)
    _seed_claim(db_session)
    res = client.get("/api/adjuster/claims", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 1


def test_adjuster_claim_detail(client, db_session):
    token = _get_auth_token(client, db_session)
    claim = _seed_claim(db_session)
    res = client.get(f"/api/adjuster/claims/{claim.id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "claim" in data
    assert data["claim"]["claim_number"] == "CLM-2026-00001"


def test_adjuster_claim_action(client, db_session):
    token = _get_auth_token(client, db_session)
    claim = _seed_claim(db_session)
    res = client.post(
        f"/api/adjuster/claims/{claim.id}/action",
        json={"action": "review", "notes": "Starting review"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_review"


def test_adjuster_chat(client, db_session):
    token = _get_auth_token(client, db_session)
    claim = _seed_claim(db_session)
    res = client.post(
        "/api/adjuster/chat",
        json={"claim_id": claim.id, "message": "Summarize this claim"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200


def test_adjuster_draft(client, db_session):
    token = _get_auth_token(client, db_session)
    claim = _seed_claim(db_session)
    res = client.post(
        "/api/adjuster/draft",
        json={"claim_id": claim.id, "draft_type": "acknowledgment"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "subject" in data
    assert "body" in data
