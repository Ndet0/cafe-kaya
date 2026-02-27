"""Unit tests for Google reviews service."""
import pytest
import respx
import httpx
from httpx import Response

from app.config import get_settings
from app.services.google_reviews import (
    GOOGLE_PLACES_DETAILS_URL,
    fetch_google_reviews,
    _strip_html,
    _make_google_review_id,
)


def test_strip_html():
    assert _strip_html("Hello <b>world</b>") == "Hello world"
    # Tags are removed; content between tags may remain
    assert "<" not in _strip_html("<script>alert(1)</script>")
    assert "script" not in _strip_html("<script>alert(1)</script>").lower()
    assert _strip_html("Plain text") == "Plain text"
    assert _strip_html("") == ""


def test_make_google_review_id():
    id1 = _make_google_review_id("Alice", 1700000000, "Great!")
    id2 = _make_google_review_id("Alice", 1700000000, "Great!")
    assert id1 == id2
    id3 = _make_google_review_id("Bob", 1700000000, "Great!")
    assert id1 != id3


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_success():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4.5,
                    "user_ratings_total": 100,
                    "reviews": [
                        {
                            "author_name": "Test User",
                            "text": "Great place!",
                            "rating": 5,
                            "time": 1700000000,
                            "profile_photo_url": "https://example.com/photo.jpg",
                        },
                    ],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["rating"] == 4.5
    assert result["user_ratings_total"] == 100
    assert len(result["reviews"]) == 1
    assert result["reviews"][0]["author_name"] == "Test User"
    assert result["reviews"][0]["text"] == "Great place!"
    assert result["reviews"][0]["rating"] == 5
    assert result["reviews"][0]["profile_photo_url"] == "https://example.com/photo.jpg"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_strips_html():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4,
                    "user_ratings_total": 1,
                    "reviews": [
                        {
                            "author_name": "User",
                            "text": "Good <b>coffee</b> and <script>x</script> nice",
                            "rating": 4,
                            "time": 1700000000,
                        },
                    ],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert "<b>" not in result["reviews"][0]["text"]
    assert "<script>" not in result["reviews"][0]["text"]


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_request_denied():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={"status": "REQUEST_DENIED", "error_message": "Invalid API key"},
        )
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_over_quota():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={"status": "OVER_QUERY_LIMIT"},
        )
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_malformed_json():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(200, content=b"not valid json")
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_no_reviews_field():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {"rating": 4, "user_ratings_total": 5},
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["reviews"] == []
    assert result["rating"] == 4.0
    assert result["user_ratings_total"] == 5


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_zero_results():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "ZERO_RESULTS",
                "result": {"rating": 0, "user_ratings_total": 0, "reviews": []},
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["reviews"] == []


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_empty_reviews_array():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4,
                    "user_ratings_total": 0,
                    "reviews": [],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["reviews"] == []
    assert result["rating"] == 4.0
    assert result["user_ratings_total"] == 0


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_non_200_status():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(500, json={"error": "server error"})
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_timeout():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        side_effect=httpx.TimeoutException("timeout")
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_invalid_request():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={"status": "INVALID_REQUEST", "error_message": "Bad request"},
        )
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_unknown_error():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={"status": "UNKNOWN_ERROR"},
        )
    )
    result = await fetch_google_reviews()
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_skips_review_with_missing_rating():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4,
                    "user_ratings_total": 2,
                    "reviews": [
                        {"author_name": "A", "text": "Good", "time": 1700000000},
                        {"author_name": "B", "text": "Nice", "rating": 5, "time": 1700000000},
                    ],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert len(result["reviews"]) == 1
    assert result["reviews"][0]["author_name"] == "B"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_missing_user_ratings_total():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4.5,
                    "reviews": [
                        {"author_name": "U", "text": "Ok", "rating": 4, "time": 1700000000},
                    ],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["user_ratings_total"] == 0


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_invalid_profile_photo_url():
    respx.get(GOOGLE_PLACES_DETAILS_URL).mock(
        return_value=Response(
            200,
            json={
                "status": "OK",
                "result": {
                    "rating": 4,
                    "user_ratings_total": 1,
                    "reviews": [
                        {
                            "author_name": "U",
                            "text": "Ok",
                            "rating": 4,
                            "time": 1700000000,
                            "profile_photo_url": "ftp://evil.com/img.jpg",
                        },
                    ],
                },
            },
        )
    )
    result = await fetch_google_reviews()
    assert result is not None
    assert result["reviews"][0]["profile_photo_url"] is None


@pytest.mark.asyncio
@respx.mock
async def test_fetch_google_reviews_not_configured(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_PLACE_ID", raising=False)
    result = await fetch_google_reviews()
    assert result is None
    monkeypatch.setenv("GOOGLE_PLACE_ID", "test-place-id")
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "REMOVED_GOOGLE_API_KEY")
    get_settings.cache_clear()
