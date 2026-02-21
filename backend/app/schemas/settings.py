"""Site settings schemas."""
from pydantic import BaseModel


class ContactSettingsResponse(BaseModel):
    address: str | None = None
    phone: str | None = None
    hours: str | None = None
    map_embed_url: str | None = None
    instagram_url: str | None = None
    facebook_url: str | None = None
    twitter_url: str | None = None


class ContactSettingsUpdate(BaseModel):
    address: str | None = None
    phone: str | None = None
    hours: str | None = None
    map_embed_url: str | None = None
    instagram_url: str | None = None
    facebook_url: str | None = None
    twitter_url: str | None = None
