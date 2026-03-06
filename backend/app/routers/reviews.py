"""Reviews router: list, submit, approve/reject."""

from app.db import get_db
from app.dependencies import get_current_user
from app.models.review import Review
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.review import (ReviewCreate, ReviewRatingResponse,
                                ReviewResponse, ReviewsListResponse,
                                ReviewUpdate)
from app.services.review_sync import sync_google_reviews_if_needed
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

GOOGLE_RATING_KEY = "google_reviews_rating"
GOOGLE_TOTAL_KEY = "google_reviews_total"


@router.get("", response_model=ReviewsListResponse)
async def list_reviews(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List approved reviews (public). Triggers Google sync if cache expired. Returns combined local + Google."""
    await sync_google_reviews_if_needed(db)

    # Order by review_time (Google) or created_at (local), newest first
    result = await db.execute(
        select(Review)
        .where(Review.status == "approved")
        .order_by(
            func.coalesce(Review.review_time, Review.created_at).desc().nullslast()
        )
        .limit(limit)
        .offset(offset)
    )
    reviews = result.scalars().all()

    # Prefer Google rating/total if available
    rating = 0.0
    total_reviews = 0
    result = await db.execute(
        select(SiteSettings).where(
            SiteSettings.key.in_([GOOGLE_RATING_KEY, GOOGLE_TOTAL_KEY])
        )
    )
    for row in result.scalars().all():
        if row.key == GOOGLE_RATING_KEY and row.value:
            try:
                rating = float(row.value)
            except (ValueError, TypeError):
                pass
        elif row.key == GOOGLE_TOTAL_KEY and row.value:
            try:
                total_reviews = int(row.value)
            except (ValueError, TypeError):
                pass

    if total_reviews == 0:
        agg = await db.execute(
            select(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("count"),
            ).where(Review.status == "approved")
        )
        r = agg.one()
        rating = float(r.avg) if r.avg is not None else 0.0
        total_reviews = r.count or 0

    return ReviewsListResponse(
        rating=round(rating, 1),
        total_reviews=total_reviews,
        reviews=[
            ReviewResponse(
                id=r.id,
                name=r.name,
                text=r.text,
                rating=r.rating,
                created_at=(
                    (r.review_time or r.created_at).isoformat()
                    if (r.review_time or r.created_at)
                    else None
                ),
                source="google" if r.source == "google" else "local",
                profile_photo_url=r.profile_photo_url,
            )
            for r in reviews
        ],
    )


@router.get("/rating", response_model=ReviewRatingResponse)
async def get_rating(db: AsyncSession = Depends(get_db)):
    """Get aggregate rating (average and count) for approved reviews (public)."""
    result = await db.execute(
        select(
            func.avg(Review.rating).label("avg"), func.count(Review.id).label("count")
        ).where(Review.status == "approved")
    )
    row = result.one()
    average = float(row.avg) if row.avg is not None else 0.0
    count = row.count or 0
    return ReviewRatingResponse(average=round(average, 1), count=count)


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    body: ReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a review (public). Stored as pending until approved."""
    review = Review(
        name=body.name,
        email=body.email,
        text=body.text,
        rating=body.rating,
        status="pending",
        source="website",
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewResponse(
        id=review.id,
        name=review.name,
        text=review.text,
        rating=review.rating,
        created_at=review.created_at.isoformat() if review.created_at else None,
    )


@router.get("/pending", response_model=list[ReviewResponse])
async def list_pending_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pending reviews (admin)."""
    result = await db.execute(
        select(Review)
        .where(Review.status == "pending")
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return [
        ReviewResponse(
            id=r.id,
            name=r.name,
            text=r.text,
            rating=r.rating,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in reviews
    ]


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review_status(
    review_id: str,
    body: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or reject a review (admin)."""
    if body.status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=400, detail="status must be 'approved' or 'rejected'"
        )
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = body.status
    await db.commit()
    await db.refresh(review)
    return ReviewResponse(
        id=review.id,
        name=review.name,
        text=review.text,
        rating=review.rating,
        created_at=review.created_at.isoformat() if review.created_at else None,
    )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a review (admin)."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()
