"""Gallery router: list and CRUD images."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.gallery import GalleryImage
from app.models.user import User
from app.schemas.gallery import (
    GalleryImageCreate,
    GalleryImageUpdate,
    GalleryImageResponse,
    GalleryReorderRequest,
)
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=list[GalleryImageResponse])
async def list_gallery(db: AsyncSession = Depends(get_db)):
    """List gallery images ordered by sort_order (public)."""
    result = await db.execute(
        select(GalleryImage).order_by(GalleryImage.sort_order)
    )
    images = result.scalars().all()
    return list(images)


@router.post("", response_model=GalleryImageResponse, status_code=status.HTTP_201_CREATED)
async def create_gallery_image(
    body: GalleryImageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a gallery image (admin)."""
    image = GalleryImage(
        image_url=body.image_url,
        alt=body.alt,
        span=body.span,
        sort_order=body.sort_order,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


@router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_gallery(
    body: GalleryReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update gallery image order (admin)."""
    for i, img_id in enumerate(body.ordered_ids):
        result = await db.execute(select(GalleryImage).where(GalleryImage.id == img_id))
        img = result.scalar_one_or_none()
        if img:
            img.sort_order = i
    await db.commit()


@router.put("/{image_id}", response_model=GalleryImageResponse)
async def update_gallery_image(
    image_id: str,
    body: GalleryImageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a gallery image (admin)."""
    result = await db.execute(select(GalleryImage).where(GalleryImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(image, k, v)
    await db.commit()
    await db.refresh(image)
    return image


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a gallery image (admin)."""
    result = await db.execute(select(GalleryImage).where(GalleryImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(image)
    await db.commit()
