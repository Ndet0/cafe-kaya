"""Application configuration from environment."""

import json
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings

# Load .env from backend directory only (avoid inheriting parent DATABASE_URL)
_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Settings loaded from environment variables."""

    # App
    app_name: str = "Cafe Kaya API"
    debug: bool = False

    # Database (PostgreSQL). Must use async driver for the app.
    # Uses CAFE_DATABASE_URL to avoid collisions with system-level DATABASE_URL.
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cafe_kaya",
        validation_alias="CAFE_DATABASE_URL",
    )

    @property
    def database_url_async(self) -> str:
        """URL with async driver (so we don't inherit sync URL from env)."""
        url = self.database_url
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS: env read as string to avoid pydantic-settings JSON decode; parsed to list via property
    cors_origins_raw: str = Field(default="", env="CORS_ORIGINS")

    @property
    def cors_origins(self) -> list[str]:
        """Parsed CORS origins (comma-separated or JSON array in env; empty/missing uses default)."""
        default = [
            "http://localhost:8080",
            "http://localhost:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:5173",
        ]
        value = self.cors_origins_raw
        if not value or not value.strip():
            return default
        s = value.strip()
        if s.startswith("["):
            return json.loads(value)
        return [x.strip() for x in value.split(",") if x.strip()]

    # Cloudinary (optional)
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None

    # Google Places (optional, for review sync)
    google_places_api_key: str | None = Field(
        default=None, validation_alias="GOOGLE_PLACES_API_KEY"
    )
    google_place_id: str | None = Field(
        default=None, validation_alias="GOOGLE_PLACE_ID"
    )
    google_reviews_cache_hours: int = Field(
        default=12, validation_alias="GOOGLE_REVIEWS_CACHE_HOURS"
    )

    class Config:
        env_file = _BACKEND_DIR / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
