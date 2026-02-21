"""Site settings router: contact info (address, phone, hours, map, social)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.db import get_db
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.settings import ContactSettingsResponse, ContactSettingsUpdate
from app.dependencies import get_current_user

router = APIRouter()

CONTACT_KEYS = [
    "address",
    "phone",
    "hours",
    "map_embed_url",
    "instagram_url",
    "facebook_url",
    "twitter_url",
]


def _get_setting(db: AsyncSession, key: str) -> str | None:
    """Sync helper to get one setting; we'll use async in route."""
    pass  # unused; we use async below


@router.get("/contact", response_model=ContactSettingsResponse)
async def get_contact_settings(db: AsyncSession = Depends(get_db)):
    """Get contact/location settings (public)."""
    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key.in_(CONTACT_KEYS))
    )
    rows = result.scalars().all()
    data = {}
    for row in rows:
        if row.value_json:
            data[row.key] = json.dumps(row.value_json) if isinstance(row.value_json, dict) else row.value
        else:
            data[row.key] = row.value
    return ContactSettingsResponse(**{k: data.get(k) for k in CONTACT_KEYS})


@router.put("/contact", response_model=ContactSettingsResponse)
async def update_contact_settings(
    body: ContactSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update contact/location settings (admin)."""
    payload = body.model_dump(exclude_unset=True)
    for key, value in payload.items():
        if key not in CONTACT_KEYS:
            continue
        result = await db.execute(select(SiteSettings).where(SiteSettings.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = value
            row.value_json = None
        else:
            db.add(SiteSettings(key=key, value=value))
    await db.commit()
    # Return current state
    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key.in_(CONTACT_KEYS))
    )
    rows = result.scalars().all()
    data = {}
    for row in rows:
        data[row.key] = row.value
    return ContactSettingsResponse(**{k: data.get(k) for k in CONTACT_KEYS})
