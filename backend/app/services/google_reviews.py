"""Google Places API service for fetching reviews."""

import hashlib
import json
import logging
import re
from datetime import datetime, timezone

import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

GOOGLE_PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# Strip HTML tags from review text to prevent XSS
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    """Remove HTML tags from text."""
    if not text:
        return ""
    return HTML_TAG_PATTERN.sub("", text).strip()


def _make_google_review_id(author_name: str, time_sec: int, text: str) -> str:
    """Generate a stable unique ID for a Google review (API does not provide one)."""
    content = f"{author_name}_{time_sec}_{(text or '')[:200]}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:64]


async def fetch_google_reviews() -> dict | None:
    """
    Fetch place details including reviews from Google Places API.
    Returns normalized structure or None on failure.
    """
    settings = get_settings()
    api_key = settings.google_places_api_key
    place_id = settings.google_place_id

    if not api_key or not place_id:
        logger.debug("Google Places API not configured (missing key or place_id)")
        return None

    params = {
        "place_id": place_id,
        "fields": "rating,reviews,user_ratings_total",
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(GOOGLE_PLACES_DETAILS_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except json.JSONDecodeError as e:
        logger.warning("Google Places API malformed JSON: %s", e)
        return None
    except httpx.TimeoutException as e:
        logger.warning("Google Places API timeout: %s", e)
        return None
    except httpx.HTTPError as e:
        logger.warning("Google Places API HTTP error: %s", e)
        return None

    status = data.get("status")
    if status not in ("OK", "ZERO_RESULTS"):
        logger.warning(
            "Google Places API error status: %s - %s",
            status,
            data.get("error_message", ""),
        )
        if status in (
            "REQUEST_DENIED",
            "INVALID_REQUEST",
            "OVER_QUERY_LIMIT",
            "UNKNOWN_ERROR",
        ):
            return None
        return None

    result = data.get("result") or {}
    rating = result.get("rating")
    user_ratings_total = result.get("user_ratings_total") or 0
    raw_reviews = result.get("reviews") or []

    reviews = []
    for r in raw_reviews:
        text = _strip_html(r.get("text") or "")
        time_sec = r.get("time") or 0
        author_name = r.get("author_name") or "Anonymous"
        rating_val = r.get("rating")
        if rating_val is None:
            continue
        profile_photo_url = r.get("profile_photo_url")
        if profile_photo_url and not profile_photo_url.startswith(
            ("http://", "https://")
        ):
            profile_photo_url = None

        reviews.append(
            {
                "google_review_id": _make_google_review_id(author_name, time_sec, text),
                "author_name": author_name[:200],
                "text": text[:5000] if text else "",
                "rating": int(rating_val) if 1 <= rating_val <= 5 else 5,
                "profile_photo_url": (
                    profile_photo_url[:500] if profile_photo_url else None
                ),
                "time": time_sec,
            }
        )

    return {
        "rating": float(rating) if rating is not None else 0.0,
        "user_ratings_total": int(user_ratings_total),
        "reviews": reviews,
    }
