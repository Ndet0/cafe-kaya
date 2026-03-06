"""Upload router: multipart image upload (admin). Returns URL for use in menu/gallery."""

from app.dependencies import get_current_user
from app.models.user import User
from app.services.upload import upload_file
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

router = APIRouter()


@router.post("", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image; returns { "url": "..." } for use in menu or gallery (admin)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    data = await file.read()
    url = await upload_file(data, file.filename or "image.jpg")
    if not url:
        raise HTTPException(
            status_code=503,
            detail="Image upload not configured (set CLOUDINARY_* env) or upload failed",
        )
    return {"url": url}
