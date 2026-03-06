"""Sync Google reviews into the database with caching."""

import logging
from datetime import datetime, timedelta, timezone

from app.config import get_settings
from app.models.review import Review
from app.models.settings import SiteSettings
from app.services.google_reviews import fetch_google_reviews
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

GOOGLE_SYNC_KEY = "google_reviews_last_synced"
GOOGLE_RATING_KEY = "google_reviews_rating"
GOOGLE_TOTAL_KEY = "google_reviews_total"


async def _get_last_synced(db: AsyncSession) -> datetime | None:
    """Get last sync time from most recent Google review or site_settings."""
    result = await db.execute(
        select(Review.last_synced_at)
        .where(Review.source == "google")
        .order_by(Review.last_synced_at.desc().nullslast())
        .limit(1)
    )
    last_synced = result.scalar_one_or_none()
    if last_synced is not None:
        return last_synced
    # Fallback: site_settings when no Google reviews exist yet
    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key == GOOGLE_SYNC_KEY)
    )
    settings_row = result.scalar_one_or_none()
    if settings_row and getattr(settings_row, "value", None):
        try:
            val = settings_row.value
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass
    return None


async def _set_last_synced(db: AsyncSession, now: datetime) -> None:
    """Persist last sync time in site_settings (used when no Google reviews)."""
    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key == GOOGLE_SYNC_KEY)
    )
    row = result.scalar_one_or_none()
    ts = now.isoformat()
    if row:
        row.value = ts
    else:
        db.add(SiteSettings(key=GOOGLE_SYNC_KEY, value=ts))
    await db.commit()


async def sync_google_reviews_if_needed(db: AsyncSession) -> bool:
    """
    Sync Google reviews if cache has expired.
    Returns True if sync was performed, False otherwise.
    """
    settings = get_settings()
    if not settings.google_place_id or not settings.google_places_api_key:
        return False

    cache_hours = settings.google_reviews_cache_hours
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=cache_hours)

    last_synced = await _get_last_synced(db)
    if last_synced is not None and last_synced >= cutoff:
        return False

    data = await fetch_google_reviews()
    if data is None:
        return False

    reviews_data = data.get("reviews") or []
    rating = data.get("rating") or 0.0
    total = data.get("user_ratings_total") or 0

    if not reviews_data:
        await _set_last_synced(db, now)
        await _set_google_rating_info(db, rating, total)
        return True

    for r in reviews_data:
        review_time = (
            datetime.fromtimestamp(r["time"], tz=timezone.utc)
            if r.get("time")
            else None
        )
        text = r.get("text") or "—"
        if len(text) > 10000:
            text = text[:10000]

        stmt = insert(Review).values(
            google_review_id=r["google_review_id"],
            name=r["author_name"],
            email=None,
            text=text,
            rating=r["rating"],
            status="approved",
            source="google",
            profile_photo_url=r.get("profile_photo_url"),
            review_time=review_time,
            last_synced_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["google_review_id"],
            set_={
                "name": stmt.excluded.name,
                "text": stmt.excluded.text,
                "rating": stmt.excluded.rating,
                "profile_photo_url": stmt.excluded.profile_photo_url,
                "review_time": stmt.excluded.review_time,
                "last_synced_at": now,
            },
        )
        await db.execute(stmt)

    await _set_google_rating_info(db, rating, total)
    await db.commit()
    logger.info("Synced %d Google reviews", len(reviews_data))
    return True


async def _set_google_rating_info(db: AsyncSession, rating: float, total: int) -> None:
    """Store Google place rating and total in site_settings."""
    for key, val in [(GOOGLE_RATING_KEY, str(rating)), (GOOGLE_TOTAL_KEY, str(total))]:
        result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = val
        else:
            db.add(SiteSettings(key=key, value=val))
