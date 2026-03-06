"""Image upload service: Cloudinary or Supabase. Backend stores final URL in DB."""

import asyncio
from typing import Optional

from app.config import get_settings

settings = get_settings()


def _upload_sync(file_data: bytes, filename: str, folder: str) -> Optional[str]:
    """Synchronous Cloudinary upload (run in thread)."""
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )
    result = cloudinary.uploader.upload(
        file_data,
        folder=folder,
        use_filename=True,
    )
    return result.get("secure_url")


async def upload_file(
    file_data: bytes, filename: str, folder: str = "cafe-kaya"
) -> Optional[str]:
    """
    Upload file to Cloudinary and return the public URL.
    Used when admin POSTs multipart/form-data to backend.
    """
    if (
        not settings.cloudinary_cloud_name
        or not settings.cloudinary_api_key
        or not settings.cloudinary_api_secret
    ):
        return None
    try:
        return await asyncio.to_thread(_upload_sync, file_data, filename, folder)
    except Exception:
        return None
