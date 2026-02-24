"""Tests for /api/settings endpoints."""
import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# GET /api/settings/contact (public)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_contact_settings_empty(client: AsyncClient):
    """All fields should be None when nothing has been set."""
    r = await client.get("/api/settings/contact")
    assert r.status_code == 200
    data = r.json()
    for key in ("address", "phone", "hours", "map_embed_url",
                "instagram_url", "facebook_url", "twitter_url"):
        assert key in data


# ---------------------------------------------------------------------------
# PUT /api/settings/contact (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_contact_settings(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.put(
        "/api/settings/contact",
        json={
            "address": "123 Cafe St",
            "phone": "+1-555-0100",
            "hours": "Mon-Fri 7am-5pm",
        },
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["address"] == "123 Cafe St"
    assert data["phone"] == "+1-555-0100"


@pytest.mark.asyncio
async def test_update_contact_settings_unauthenticated(client: AsyncClient):
    r = await client.put(
        "/api/settings/contact",
        json={"address": "Nope"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_update_and_read_back(
    client: AsyncClient, admin_user, auth_headers
):
    """Update, then GET to verify persistence within the test transaction."""
    await client.put(
        "/api/settings/contact",
        json={"instagram_url": "https://instagram.com/cafe"},
        headers=auth_headers,
    )
    r = await client.get("/api/settings/contact")
    assert r.status_code == 200
    assert r.json()["instagram_url"] == "https://instagram.com/cafe"


@pytest.mark.asyncio
async def test_partial_update(
    client: AsyncClient, admin_user, auth_headers
):
    """Only the provided keys should change; others remain untouched."""
    await client.put(
        "/api/settings/contact",
        json={"phone": "111", "address": "First St"},
        headers=auth_headers,
    )
    r = await client.put(
        "/api/settings/contact",
        json={"phone": "222"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["phone"] == "222"
    assert data["address"] == "First St"
