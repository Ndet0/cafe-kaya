"""Tests for /api/auth endpoints."""
import pytest
from httpx import AsyncClient

from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


# ---- POST /api/auth/login ----

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user):
    r = await client.post("/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user):
    r = await client.post("/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": "wrongpassword",
    })
    assert r.status_code == 401
    assert "Incorrect" in r.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    r = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields(client: AsyncClient):
    r = await client.post("/api/auth/login", json={})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_invalid_email_format(client: AsyncClient):
    r = await client.post("/api/auth/login", json={
        "email": "not-an-email",
        "password": "test",
    })
    assert r.status_code == 422


# ---- GET /api/auth/login (should be 405) ----

@pytest.mark.asyncio
async def test_login_get_method_not_allowed(client: AsyncClient):
    r = await client.get("/api/auth/login")
    assert r.status_code == 405
    assert r.headers.get("allow") == "POST"


# ---- GET /api/auth/me ----

@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, admin_user, auth_headers):
    r = await client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert "id" in data


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    r = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    r = await client.get("/api/auth/me", headers={
        "Authorization": "Bearer invalid.jwt.token",
    })
    assert r.status_code == 401
