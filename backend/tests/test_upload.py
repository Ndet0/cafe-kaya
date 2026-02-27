"""Tests for /api/upload endpoint."""
import io
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.services.upload import upload_file


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


# ---------------------------------------------------------------------------
# Upload service unit tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.upload.settings")
async def test_upload_file_returns_none_when_not_configured(mock_settings):
    """upload_file returns None when Cloudinary env vars are missing."""
    mock_settings.cloudinary_cloud_name = None
    mock_settings.cloudinary_api_key = None
    mock_settings.cloudinary_api_secret = None
    result = await upload_file(b"data", "test.jpg")
    assert result is None


@pytest.mark.asyncio
@patch("app.services.upload.asyncio.to_thread")
@patch("app.services.upload.settings")
async def test_upload_file_success(mock_settings, mock_to_thread):
    """upload_file returns URL when Cloudinary upload succeeds."""
    mock_settings.cloudinary_cloud_name = "test"
    mock_settings.cloudinary_api_key = "key"
    mock_settings.cloudinary_api_secret = "secret"
    mock_to_thread.return_value = "https://res.cloudinary.com/demo/x.jpg"
    result = await upload_file(b"imagedata", "photo.jpg")
    assert result == "https://res.cloudinary.com/demo/x.jpg"
    mock_to_thread.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.upload.asyncio.to_thread")
@patch("app.services.upload.settings")
async def test_upload_file_returns_none_on_exception(mock_settings, mock_to_thread):
    """upload_file returns None when upload raises."""
    mock_settings.cloudinary_cloud_name = "test"
    mock_settings.cloudinary_api_key = "key"
    mock_settings.cloudinary_api_secret = "secret"
    mock_to_thread.side_effect = Exception("upload failed")
    result = await upload_file(b"imagedata", "photo.jpg")
    assert result is None


@pytest.mark.asyncio
@patch("app.services.upload.settings")
async def test_upload_file_upload_sync_path(mock_settings):
    """upload_file runs _upload_sync when Cloudinary configured."""
    mock_settings.cloudinary_cloud_name = "test"
    mock_settings.cloudinary_api_key = "key"
    mock_settings.cloudinary_api_secret = "secret"
    import cloudinary.uploader
    with patch.object(cloudinary.uploader, "upload", return_value={"secure_url": "https://res.cloudinary.com/demo/uploaded.jpg"}):
        result = await upload_file(b"imagedata", "photo.jpg", folder="test-folder")
    assert result == "https://res.cloudinary.com/demo/uploaded.jpg"
