"""Unit tests for review sync service."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
import respx
from app.models.review import Review
from app.models.settings import SiteSettings
from app.services.google_reviews import GOOGLE_PLACES_DETAILS_URL
from app.services.review_sync import (GOOGLE_SYNC_KEY, _get_last_synced,
                                      _set_last_synced,
                                      sync_google_reviews_if_needed)
from httpx import Response
from sqlalchemy import select

# ---------------------------------------------------------------------------
# Cache boundary tests (use patched datetime)
# ---------------------------------------------------------------------------

FIXED_NOW = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)


@pytest.mark.asyncio
@respx.mock
async def test_sync_skipped_when_cache_at_expiration_boundary(async_db):
    """When last_synced exactly equals cutoff, no sync."""
    cache_hours = 12
    last_synced_val = FIXED_NOW - timedelta(hours=cache_hours)
    async_db.add(
        Review(
            name="Cached",
            email=None,
            text="x",
            rating=5,
            status="approved",
            source="google",
            google_review_id="g1",
            last_synced_at=last_synced_val,
        )
    )
    await async_db.commit()

    with patch("app.services.review_sync.datetime") as mock_dt:
        import datetime as dt_module

        mock_dt.now.return_value = FIXED_NOW
        mock_dt.fromtimestamp = dt_module.datetime.fromtimestamp
        mock_dt.fromisoformat = dt_module.datetime.fromisoformat

        result = await sync_google_reviews_if_needed(async_db)

    assert result is False
    assert respx.calls.call_count == 0


@pytest.mark.asyncio
@respx.mock
async def test_sync_runs_when_cache_older_than_boundary(async_db):
    """When last_synced is older than cutoff by 1s, sync runs."""
    cache_hours = 12
    last_synced_val = FIXED_NOW - timedelta(hours=cache_hours, seconds=1)
    async_db.add(
        Review(
            name="Old",
            email=None,
            text="x",
            rating=5,
            status="approved",
            source="google",
            google_review_id="g1",
            last_synced_at=last_synced_val,
        )
    )
    await async_db.commit()

    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4.5,
                    "user_ratings_total": 10,
                    "reviews": [
                        {
                            "author_name": "New",
                            "text": "Fresh",
                            "rating": 5,
                            "time": 1700000000,
                        },
                    ],
                },
            },
        )
    )

    with patch("app.services.review_sync.datetime") as mock_dt:
        import datetime as dt_module

        mock_dt.now.return_value = FIXED_NOW
        mock_dt.fromtimestamp = dt_module.datetime.fromtimestamp
        mock_dt.fromisoformat = dt_module.datetime.fromisoformat

        result = await sync_google_reviews_if_needed(async_db)

    assert result is True
    assert respx.calls.call_count == 1


@pytest.mark.asyncio
@respx.mock
async def test_sync_skipped_when_cache_newer_than_boundary(async_db):
    """When last_synced is newer than cutoff, no sync."""
    cache_hours = 12
    last_synced_val = FIXED_NOW - timedelta(hours=cache_hours, seconds=-1)
    async_db.add(
        Review(
            name="Fresh",
            email=None,
            text="x",
            rating=5,
            status="approved",
            source="google",
            google_review_id="g1",
            last_synced_at=last_synced_val,
        )
    )
    await async_db.commit()

    with patch("app.services.review_sync.datetime") as mock_dt:
        import datetime as dt_module

        mock_dt.now.return_value = FIXED_NOW
        mock_dt.fromtimestamp = dt_module.datetime.fromtimestamp
        mock_dt.fromisoformat = dt_module.datetime.fromisoformat

        result = await sync_google_reviews_if_needed(async_db)

    assert result is False
    assert respx.calls.call_count == 0


# ---------------------------------------------------------------------------
# Duplicate upsert, empty DB, empty reviews, Google fail
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
@respx.mock
async def test_duplicate_google_review_id_upsert_no_duplicate_rows(async_db):
    """Syncing same review twice updates existing row, no duplicate."""
    mock_response = Response(
        200,
        json={
            "status": "OK",
            "result": {
                "rating": 4,
                "user_ratings_total": 1,
                "reviews": [
                    {
                        "author_name": "Alice",
                        "text": "First",
                        "rating": 5,
                        "time": 1700000000,
                    },
                ],
            },
        },
    )
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(return_value=mock_response)

    result1 = await sync_google_reviews_if_needed(async_db)
    assert result1 is True

    count1 = (
        (await async_db.execute(select(Review).where(Review.source == "google")))
        .scalars()
        .all()
    )
    assert len(count1) == 1

    # Make cache expired: set last_synced_at to 13 hours ago so second sync runs
    old_time = datetime.now(timezone.utc) - timedelta(hours=13)
    for r in count1:
        r.last_synced_at = old_time
    await async_db.commit()

    # Same mock response - same review; respx will match again
    result2 = await sync_google_reviews_if_needed(async_db)

    assert result2 is True
    count2 = (
        (await async_db.execute(select(Review).where(Review.source == "google")))
        .scalars()
        .all()
    )
    assert len(count2) == 1
    assert count2[0].name == "Alice"


@pytest.mark.asyncio
@respx.mock
async def test_sync_when_db_initially_empty(async_db):
    """No reviews, no SiteSettings; sync fetches and inserts."""
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4.5,
                    "user_ratings_total": 2,
                    "reviews": [
                        {
                            "author_name": "A",
                            "text": "Good",
                            "rating": 5,
                            "time": 1700000000,
                        },
                        {
                            "author_name": "B",
                            "text": "Nice",
                            "rating": 4,
                            "time": 1700000001,
                        },
                    ],
                },
            },
        )
    )
    result = await sync_google_reviews_if_needed(async_db)
    assert result is True
    reviews = (
        (await async_db.execute(select(Review).where(Review.source == "google")))
        .scalars()
        .all()
    )
    assert len(reviews) == 2


@pytest.mark.asyncio
@respx.mock
async def test_sync_when_google_returns_empty_list(async_db):
    """Google returns empty reviews; _set_last_synced called, no crash."""
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {"rating": 4, "user_ratings_total": 0, "reviews": []},
            },
        )
    )
    result = await sync_google_reviews_if_needed(async_db)
    assert result is True
    row = (
        await async_db.execute(
            select(SiteSettings).where(SiteSettings.key == GOOGLE_SYNC_KEY)
        )
    ).scalar_one_or_none()
    assert row is not None
    assert row.value is not None


@pytest.mark.asyncio
@respx.mock
async def test_sync_when_google_fails_but_cached_reviews_exist(async_db):
    """Pre-insert Google reviews; API fails; sync returns False, no deletions."""
    async_db.add(
        Review(
            name="Cached",
            email=None,
            text="Kept",
            rating=5,
            status="approved",
            source="google",
            google_review_id="cached1",
            last_synced_at=datetime.now(timezone.utc),
        )
    )
    await async_db.commit()

    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(200, json={"status": "REQUEST_DENIED"})
    )

    with patch("app.services.review_sync.datetime") as mock_dt:
        import datetime as dt_module

        future = datetime.now(timezone.utc) + timedelta(hours=13)
        mock_dt.now.return_value = future
        mock_dt.fromtimestamp = dt_module.datetime.fromtimestamp
        mock_dt.fromisoformat = dt_module.datetime.fromisoformat

        result = await sync_google_reviews_if_needed(async_db)

    assert result is False
    reviews = (
        (await async_db.execute(select(Review).where(Review.source == "google")))
        .scalars()
        .all()
    )
    assert len(reviews) == 1
    assert reviews[0].name == "Cached"


# ---------------------------------------------------------------------------
# _get_last_synced from SiteSettings, invalid value, _set_last_synced new row
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_last_synced_from_site_settings(async_db):
    """When no Google reviews, fallback to SiteSettings."""
    from app.services.review_sync import _get_last_synced

    ts = "2024-01-14T12:00:00+00:00"
    async_db.add(SiteSettings(key=GOOGLE_SYNC_KEY, value=ts))
    await async_db.commit()

    result = await _get_last_synced(async_db)
    assert result is not None
    assert result.isoformat().startswith("2024-01-14")


@pytest.mark.asyncio
async def test_get_last_synced_invalid_site_settings_value(async_db):
    """Invalid isoformat in SiteSettings; returns None."""
    from app.services.review_sync import _get_last_synced

    async_db.add(SiteSettings(key=GOOGLE_SYNC_KEY, value="not-valid-iso"))
    await async_db.commit()

    result = await _get_last_synced(async_db)
    assert result is None


@pytest.mark.asyncio
async def test_set_last_synced_creates_new_row(async_db):
    """When no SiteSettings row exists, _set_last_synced creates one."""
    now = datetime.now(timezone.utc)
    await _set_last_synced(async_db, now)

    row = (
        await async_db.execute(
            select(SiteSettings).where(SiteSettings.key == GOOGLE_SYNC_KEY)
        )
    ).scalar_one_or_none()
    assert row is not None
    assert row.value == now.isoformat()


@pytest.mark.asyncio
async def test_set_last_synced_updates_existing_row(async_db):
    """When SiteSettings row exists, _set_last_synced updates it."""
    async_db.add(SiteSettings(key=GOOGLE_SYNC_KEY, value="old"))
    await async_db.commit()

    now = datetime.now(timezone.utc)
    await _set_last_synced(async_db, now)

    row = (
        await async_db.execute(
            select(SiteSettings).where(SiteSettings.key == GOOGLE_SYNC_KEY)
        )
    ).scalar_one_or_none()
    assert row is not None
    assert row.value == now.isoformat()


# ---------------------------------------------------------------------------
# No Google config
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sync_returns_false_when_google_not_configured(async_db, monkeypatch):
    """When GOOGLE_PLACE_ID or API key missing, sync returns False."""
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_PLACE_ID", raising=False)

    result = await sync_google_reviews_if_needed(async_db)
    assert result is False

    monkeypatch.setenv("GOOGLE_PLACE_ID", "test-place-id")
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "REMOVED_GOOGLE_API_KEY")
    get_settings.cache_clear()
