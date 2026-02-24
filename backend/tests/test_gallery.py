"""Tests for /api/gallery endpoints."""
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models.gallery import GalleryImage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_image(
    db: Session,
    url: str = "https://example.com/img.jpg",
    alt: str = "test image",
    sort_order: int = 0,
) -> GalleryImage:
    img = GalleryImage(image_url=url, alt=alt, span="", sort_order=sort_order)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


# ---------------------------------------------------------------------------
# GET /api/gallery (public)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_gallery_empty(client: AsyncClient):
    r = await client.get("/api/gallery")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_gallery(client: AsyncClient, db: Session):
    _create_image(db, alt="A")
    _create_image(db, alt="B")
    r = await client.get("/api/gallery")
    assert r.status_code == 200
    assert len(r.json()) >= 2


# ---------------------------------------------------------------------------
# POST /api/gallery (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_gallery_image(client: AsyncClient, admin_user, auth_headers):
    r = await client.post(
        "/api/gallery",
        json={"image_url": "https://example.com/new.jpg", "alt": "new"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["image_url"] == "https://example.com/new.jpg"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_gallery_image_unauthenticated(client: AsyncClient):
    r = await client.post(
        "/api/gallery",
        json={"image_url": "https://example.com/x.jpg"},
    )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/gallery/{image_id} (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_gallery_image(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    img = _create_image(db)
    r = await client.put(
        f"/api/gallery/{img.id}",
        json={"alt": "updated alt"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["alt"] == "updated alt"


@pytest.mark.asyncio
async def test_update_gallery_image_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.put(
        f"/api/gallery/{uuid.uuid4()}",
        json={"alt": "nope"},
        headers=auth_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_gallery_image_unauthenticated(client: AsyncClient):
    r = await client.put(
        f"/api/gallery/{uuid.uuid4()}", json={"alt": "nope"}
    )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/gallery/reorder (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_reorder_gallery(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    a = _create_image(db, alt="A", sort_order=0)
    b = _create_image(db, alt="B", sort_order=1)
    r = await client.put(
        "/api/gallery/reorder",
        json={"ordered_ids": [b.id, a.id]},
        headers=auth_headers,
    )
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_reorder_gallery_unauthenticated(client: AsyncClient):
    r = await client.put("/api/gallery/reorder", json={"ordered_ids": []})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /api/gallery/{image_id} (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_gallery_image(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    img = _create_image(db)
    r = await client.delete(f"/api/gallery/{img.id}", headers=auth_headers)
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_delete_gallery_image_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.delete(
        f"/api/gallery/{uuid.uuid4()}", headers=auth_headers
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_gallery_image_unauthenticated(client: AsyncClient):
    r = await client.delete(f"/api/gallery/{uuid.uuid4()}")
    assert r.status_code == 401
