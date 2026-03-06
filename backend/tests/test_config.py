"""Tests for application configuration."""

import pytest
from app.config import Settings, get_settings
from pydantic import ValidationError


def test_missing_google_places_api_key(monkeypatch):
    """When GOOGLE_PLACES_API_KEY is unset, settings has None."""
    get_settings.cache_clear()
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_PLACE_ID", raising=False)
    settings = get_settings()
    assert settings.google_places_api_key is None
    monkeypatch.setenv("GOOGLE_PLACE_ID", "test-place-id")
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "REMOVED_GOOGLE_API_KEY")
    get_settings.cache_clear()


def test_missing_google_place_id(monkeypatch):
    """When GOOGLE_PLACE_ID is unset, settings has None."""
    get_settings.cache_clear()
    monkeypatch.delenv("GOOGLE_PLACE_ID", raising=False)
    settings = get_settings()
    assert settings.google_place_id is None
    monkeypatch.setenv("GOOGLE_PLACE_ID", "test-place-id")
    get_settings.cache_clear()


def test_invalid_google_reviews_cache_hours(monkeypatch):
    """When GOOGLE_REVIEWS_CACHE_HOURS is non-int, ValidationError."""
    get_settings.cache_clear()
    monkeypatch.setenv("GOOGLE_REVIEWS_CACHE_HOURS", "abc")
    with pytest.raises(ValidationError):
        Settings()
    monkeypatch.delenv("GOOGLE_REVIEWS_CACHE_HOURS", raising=False)
    get_settings.cache_clear()


def test_default_google_reviews_cache_hours(monkeypatch):
    """Default google_reviews_cache_hours is 12."""
    get_settings.cache_clear()
    monkeypatch.delenv("GOOGLE_REVIEWS_CACHE_HOURS", raising=False)
    settings = get_settings()
    assert settings.google_reviews_cache_hours == 12
    get_settings.cache_clear()


def test_cors_origins_empty_string_uses_default(monkeypatch):
    """When CORS_ORIGINS is empty, uses default list."""
    get_settings.cache_clear()
    monkeypatch.setenv("CORS_ORIGINS", "")
    settings = get_settings()
    default = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ]
    assert settings.cors_origins == default
    get_settings.cache_clear()


def test_cors_origins_json_array():
    """When cors_origins_raw is JSON array, parses correctly."""
    settings = Settings(cors_origins_raw='["https://a.com", "https://b.com"]')
    assert settings.cors_origins == ["https://a.com", "https://b.com"]


def test_cors_origins_comma_separated():
    """When cors_origins_raw is comma-separated, parses to list."""
    settings = Settings(cors_origins_raw="a.com, b.com , c.com")
    assert settings.cors_origins == ["a.com", "b.com", "c.com"]


def test_database_url_async_conversion(monkeypatch):
    """When CAFE_DATABASE_URL has postgresql:// without asyncpg, adds +asyncpg."""
    get_settings.cache_clear()
    monkeypatch.setenv("CAFE_DATABASE_URL", "postgresql://user:pass@host:5432/db")
    settings = get_settings()
    assert settings.database_url_async == "postgresql+asyncpg://user:pass@host:5432/db"
    assert "+asyncpg" in settings.database_url_async
    get_settings.cache_clear()
