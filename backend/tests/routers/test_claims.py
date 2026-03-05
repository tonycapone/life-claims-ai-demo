"""
Tests for claims routes.
Routes aren't built yet — these are stubs that will grow as endpoints are added.
"""


def test_claims_lookup_missing_route(client):
    """Placeholder — will test POST /api/claims/lookup once built."""
    response = client.post("/api/claims/lookup", json={})
    # 404 expected until route is implemented
    assert response.status_code in (404, 422)


def test_create_claim_missing_route(client):
    """Placeholder — will test POST /api/claims once built."""
    response = client.post("/api/claims", json={})
    assert response.status_code in (404, 422)
