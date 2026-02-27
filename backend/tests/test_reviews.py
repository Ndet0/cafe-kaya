"""Tests for /api/reviews endpoints."""
import uuid
from unittest.mock import patch

import pytest
import respx
from httpx import AsyncClient, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.main import app as fastapi_app
from app.models.review import Review
from app.models.settings import SiteSettings
from app.services.google_reviews import GOOGLE_PLACES_DETAILS_URL


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
@respx.mock
async def test_list_reviews_empty(client: AsyncClient):
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "OK", "result": {"rating": 4.5, "user_ratings_total": 0, "reviews": []}},
    ))
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    assert data["reviews"] == []
    assert data["rating"] == 0.0
    assert data["total_reviews"] == 0


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_only_approved(client: AsyncClient, db: Session):
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "OK", "result": {"rating": 4.5, "user_ratings_total": 0, "reviews": []}},
    ))
    _create_review(db, name="Visible", status="approved")
    _create_review(db, name="Hidden", status="pending")
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    names = [rv["name"] for rv in data["reviews"]]
    assert "Visible" in names
    assert "Hidden" not in names


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_pagination(client: AsyncClient, db: Session):
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "OK", "result": {"rating": 4.5, "user_ratings_total": 0, "reviews": []}},
    ))
    for i in range(5):
        _create_review(db, name=f"User{i}")
    r = await client.get("/api/reviews?limit=2&offset=0")
    assert r.status_code == 200
    assert len(r.json()["reviews"]) == 2


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_triggers_sync_when_cache_expired(client: AsyncClient):
    mock_response = Response(
        200,
        json={
            "status": "OK",
            "result": {
                "rating": 4.7,
                "user_ratings_total": 120,
                "reviews": [
                    {
                        "author_name": "Google User",
                        "text": "Great place!",
                        "rating": 5,
                        "time": 1700000000,
                        "profile_photo_url": "https://example.com/photo.jpg",
                    },
                ],
            },
        },
    )
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=mock_response)
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    assert len(data["reviews"]) >= 1
    assert data["rating"] == 4.7
    assert data["total_reviews"] == 120
    names = [rv["name"] for rv in data["reviews"]]
    assert "Google User" in names


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_skips_sync_when_cache_fresh(client: AsyncClient):
    mock_response = Response(
        200,
        json={
            "status": "OK",
            "result": {
                "rating": 4.5,
                "user_ratings_total": 10,
                "reviews": [
                    {"author_name": "Cached", "text": "Nice", "rating": 5, "time": 1700000000},
                ],
            },
        },
    )
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=mock_response)
    r1 = await client.get("/api/reviews")
    assert r1.status_code == 200
    r2 = await client.get("/api/reviews")
    assert r2.status_code == 200
    assert respx.calls.call_count == 1


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_combined_local_and_google(client: AsyncClient, db: Session):
    _create_review(db, name="Local Alice", text="Local review")
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={
            "status": "OK",
            "result": {
                "rating": 4.5,
                "user_ratings_total": 2,
                "reviews": [
                    {"author_name": "Google Bob", "text": "From Google", "rating": 4, "time": 1700000000},
                ],
            },
        },
    ))
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    names = [rv["name"] for rv in data["reviews"]]
    assert "Local Alice" in names
    assert "Google Bob" in names


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_handles_google_api_failure(client: AsyncClient, db: Session):
    _create_review(db, name="Local Only")
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "REQUEST_DENIED", "error_message": "Invalid API key"},
    ))
    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    assert len(data["reviews"]) == 1
    assert data["reviews"][0]["name"] == "Local Only"


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_uses_google_rating_from_site_settings(
    client: AsyncClient, db: Session
):
    """When SiteSettings has valid rating/total, uses them."""
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "OK", "result": {"rating": 4.5, "user_ratings_total": 0, "reviews": []}},
    ))
    # Pre-insert Google review with recent last_synced so sync skips (cache fresh)
    from datetime import datetime, timezone
    recent = datetime.now(timezone.utc)
    db.add(Review(
        name="Cached", email=None, text="x", rating=5, status="approved",
        source="google", google_review_id="g1", last_synced_at=recent,
    ))
    db.add(SiteSettings(key="google_reviews_rating", value="4.7"))
    db.add(SiteSettings(key="google_reviews_total", value="150"))
    db.commit()

    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    assert data["rating"] == 4.7
    assert data["total_reviews"] == 150


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_invalid_rating_in_site_settings_fallback_to_db_agg(
    client: AsyncClient, db: Session
):
    """When SiteSettings has invalid rating/total, fallback to DB aggregation."""
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=Response(
        200,
        json={"status": "OK", "result": {"rating": 4.5, "user_ratings_total": 0, "reviews": []}},
    ))
    _create_review(db, name="A", rating=4, status="approved")
    _create_review(db, name="B", rating=5, status="approved")
    db.add(SiteSettings(key="google_reviews_rating", value="not-a-float"))
    db.add(SiteSettings(key="google_reviews_total", value="invalid-int"))
    db.commit()

    r = await client.get("/api/reviews")
    assert r.status_code == 200
    data = r.json()
    assert data["rating"] == 4.5
    assert data["total_reviews"] == 2


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_get_db_failure_returns_500(client: AsyncClient):
    """When get_db raises, request fails with 500 or propagates exception."""
    async def failing_get_db():
        raise RuntimeError("DB connection failed")

    fastapi_app.dependency_overrides[get_db] = failing_get_db
    try:
        r = await client.get("/api/reviews")
        assert r.status_code == 500
    except RuntimeError:
        pass  # Exception propagates when dependency fails before response sent
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
@respx.mock
async def test_list_reviews_sync_exception_returns_500(client: AsyncClient):
    """When sync_google_reviews_if_needed raises, request fails with 500 or propagates."""
    with patch(
        "app.routers.reviews.sync_google_reviews_if_needed",
        side_effect=RuntimeError("Sync failed"),
    ):
        try:
            r = await client.get("/api/reviews")
            assert r.status_code == 500
        except RuntimeError:
            pass  # Exception propagates when sync fails before response sent


@pytest.mark.asyncio
async def test_submit_review_rollback_on_commit_failure(client: AsyncClient, db: Session):
    """When commit raises, transaction rolls back and no row is persisted."""
    from tests.conftest import TestAsyncSession

    async def get_db_commit_raises():
        async with TestAsyncSession() as session:
            async def raise_on_commit():
                raise RuntimeError("commit failed")

            session.commit = raise_on_commit
            try:
                yield session
            finally:
                await session.rollback()

    fastapi_app.dependency_overrides[get_db] = get_db_commit_raises
    try:
        try:
            await client.post(
                "/api/reviews",
                json={"name": "RollbackTest", "text": "Should not persist", "rating": 5},
            )
        except RuntimeError:
            pass

        # Verify no review was committed
        from sqlalchemy import select
        result = db.execute(select(Review).where(Review.name == "RollbackTest"))
        assert result.scalar_one_or_none() is None
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)


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
async def test_submit_review_with_email(client: AsyncClient):
    r = await client.post("/api/reviews", json={
        "name": "Bob",
        "email": "bob@test.com",
        "text": "Loved it",
        "rating": 5,
    })
    assert r.status_code == 201
    assert r.json()["name"] == "Bob"


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
async def test_list_pending_empty(client: AsyncClient, db: Session, admin_user, auth_headers):
    r = await client.get("/api/reviews/pending", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []


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
