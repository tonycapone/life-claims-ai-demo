"""
Tests for adjuster routes.
Stubs — will grow as endpoints are added.
"""


def test_adjuster_claims_queue_unauthenticated(client):
    """Adjuster routes should require auth once JWT middleware is added."""
    response = client.get("/api/adjuster/claims")
    assert response.status_code in (401, 404)


def test_adjuster_login_missing_route(client):
    """Placeholder — will test POST /api/adjuster/login once built."""
    response = client.post("/api/adjuster/login", json={})
    assert response.status_code in (404, 422)
