"""Tests for /api/contact endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models.contact import ContactMessage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_message(
    db: Session,
    name: str = "Jane",
    email: str = "jane@example.com",
    subject: str = "Hello",
    message: str = "I love this place!",
) -> ContactMessage:
    msg = ContactMessage(
        name=name, email=email, subject=subject, message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ---------------------------------------------------------------------------
# POST /api/contact (public)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_submit_contact(client: AsyncClient):
    r = await client.post("/api/contact", json={
        "name": "Jane",
        "email": "jane@example.com",
        "subject": "Inquiry",
        "message": "Do you have vegan options?",
    })
    assert r.status_code == 202
    assert "message" in r.json()


@pytest.mark.asyncio
async def test_submit_contact_minimal(client: AsyncClient):
    r = await client.post("/api/contact", json={
        "name": "Tom",
        "email": "tom@example.com",
        "message": "Quick question",
    })
    assert r.status_code == 202


@pytest.mark.asyncio
async def test_submit_contact_invalid_email(client: AsyncClient):
    r = await client.post("/api/contact", json={
        "name": "Bad",
        "email": "not-an-email",
        "message": "Fail",
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_submit_contact_missing_fields(client: AsyncClient):
    r = await client.post("/api/contact", json={})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/contact (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_contact_messages_admin(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    _create_message(db)
    r = await client.get("/api/contact", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Jane"


@pytest.mark.asyncio
async def test_list_contact_messages_unauthenticated(client: AsyncClient):
    r = await client.get("/api/contact")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /api/contact/{message_id}/read (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_mark_message_read(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    msg = _create_message(db)
    assert msg.read is False
    r = await client.patch(
        f"/api/contact/{msg.id}/read", headers=auth_headers
    )
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_mark_message_read_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.patch(
        f"/api/contact/{uuid.uuid4()}/read", headers=auth_headers
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_mark_message_read_unauthenticated(client: AsyncClient):
    r = await client.patch(f"/api/contact/{uuid.uuid4()}/read")
    assert r.status_code == 401
