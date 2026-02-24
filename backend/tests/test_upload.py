"""Tests for /api/upload endpoint."""
import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


def _fake_image_file(
    filename: str = "photo.jpg", content_type: str = "image/jpeg"
) -> tuple[str, io.BytesIO, str]:
    """Return a tuple suitable for httpx multipart upload."""
    buf = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100)  # JPEG header stub
    return (filename, buf, content_type)


# ---------------------------------------------------------------------------
# POST /api/upload (admin)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@patch(
    "app.routers.upload.upload_file",
    new_callable=AsyncMock,
    return_value="https://res.cloudinary.com/demo/image/upload/v1/cafe-kaya/photo.jpg",
)
async def test_upload_image_success(
    mock_upload, client: AsyncClient, admin_user, auth_headers
):
    name, buf, ct = _fake_image_file()
    r = await client.post(
        "/api/upload",
        files={"file": (name, buf, ct)},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["url"].startswith("https://")
    mock_upload.assert_awaited_once()


@pytest.mark.asyncio
async def test_upload_non_image_rejected(
    client: AsyncClient, admin_user, auth_headers
):
    buf = io.BytesIO(b"not an image")
    r = await client.post(
        "/api/upload",
        files={"file": ("doc.txt", buf, "text/plain")},
        headers=auth_headers,
    )
    assert r.status_code == 400
    assert "image" in r.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_unauthenticated(client: AsyncClient):
    name, buf, ct = _fake_image_file()
    r = await client.post(
        "/api/upload",
        files={"file": (name, buf, ct)},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
@patch(
    "app.routers.upload.upload_file",
    new_callable=AsyncMock,
    return_value=None,
)
async def test_upload_cloudinary_not_configured(
    mock_upload, client: AsyncClient, admin_user, auth_headers
):
    """When Cloudinary env vars are missing, upload_file returns None -> 503."""
    name, buf, ct = _fake_image_file()
    r = await client.post(
        "/api/upload",
        files={"file": (name, buf, ct)},
        headers=auth_headers,
    )
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"].lower()
