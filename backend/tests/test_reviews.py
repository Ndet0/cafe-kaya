"""Tests for /api/reviews endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models.review import Review


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_review(
    db: Session,
    name: str = "Alice",
    text: str = "Great coffee!",
    rating: int = 5,
    status: str = "approved",
) -> Review:
    review = Review(
        name=name, email="alice@test.com", text=text,
        rating=rating, status=status, source="website",
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# ---------------------------------------------------------------------------
# GET /api/reviews (public — approved only)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_reviews_empty(client: AsyncClient):
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_reviews_only_approved(client: AsyncClient, db: Session):
    _create_review(db, name="Visible", status="approved")
    _create_review(db, name="Hidden", status="pending")
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    names = [rv["name"] for rv in r.json()]
    assert "Visible" in names
    assert "Hidden" not in names


@pytest.mark.asyncio
async def test_list_reviews_pagination(client: AsyncClient, db: Session):
    for i in range(5):
        _create_review(db, name=f"User{i}")
    r = await client.get("/api/reviews?limit=2&offset=0")
    assert r.status_code == 200
    assert len(r.json()) == 2


# ---------------------------------------------------------------------------
# GET /api/reviews/rating (public)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_rating_empty(client: AsyncClient):
    r = await client.get("/api/reviews/rating")
    assert r.status_code == 200
    data = r.json()
    assert data["average"] == 0.0
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_get_rating_with_reviews(client: AsyncClient, db: Session):
    _create_review(db, rating=4, status="approved")
    _create_review(db, rating=5, status="approved")
    _create_review(db, rating=3, status="pending")
    r = await client.get("/api/reviews/rating")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 2
    assert data["average"] == 4.5


# ---------------------------------------------------------------------------
# POST /api/reviews (public)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_review(client: AsyncClient):
    r = await client.post("/api/reviews", json={
        "name": "Bob",
        "text": "Loved it",
        "rating": 5,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Bob"
    assert data["rating"] == 5


@pytest.mark.asyncio
async def test_submit_review_validation_error(client: AsyncClient):
    r = await client.post("/api/reviews", json={
        "name": "Bob",
        "text": "Bad rating",
        "rating": 6,
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_submit_review_missing_fields(client: AsyncClient):
    r = await client.post("/api/reviews", json={})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/reviews/pending (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_pending_admin(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    _create_review(db, name="PendingOne", status="pending")
    r = await client.get("/api/reviews/pending", headers=auth_headers)
    assert r.status_code == 200
    names = [rv["name"] for rv in r.json()]
    assert "PendingOne" in names


@pytest.mark.asyncio
async def test_list_pending_unauthenticated(client: AsyncClient):
    r = await client.get("/api/reviews/pending")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /api/reviews/{review_id} (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_approve_review(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    review = _create_review(db, status="pending")
    r = await client.patch(
        f"/api/reviews/{review.id}",
        json={"status": "approved"},
        headers=auth_headers,
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_reject_review(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    review = _create_review(db, status="pending")
    r = await client.patch(
        f"/api/reviews/{review.id}",
        json={"status": "rejected"},
        headers=auth_headers,
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_update_review_invalid_status(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    review = _create_review(db, status="pending")
    r = await client.patch(
        f"/api/reviews/{review.id}",
        json={"status": "invalid"},
        headers=auth_headers,
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_update_review_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.patch(
        f"/api/reviews/{uuid.uuid4()}",
        json={"status": "approved"},
        headers=auth_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_review_unauthenticated(client: AsyncClient):
    r = await client.patch(
        f"/api/reviews/{uuid.uuid4()}", json={"status": "approved"}
    )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /api/reviews/{review_id} (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_review(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    review = _create_review(db)
    r = await client.delete(f"/api/reviews/{review.id}", headers=auth_headers)
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_delete_review_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.delete(
        f"/api/reviews/{uuid.uuid4()}", headers=auth_headers
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_review_unauthenticated(client: AsyncClient):
    r = await client.delete(f"/api/reviews/{uuid.uuid4()}")
    assert r.status_code == 401
