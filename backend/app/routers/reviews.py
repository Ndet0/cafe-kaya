"""Reviews router: list, submit, approve/reject."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, ReviewRatingResponse
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=list[ReviewResponse])
async def list_reviews(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List approved reviews (public)."""
    result = await db.execute(
        select(Review)
        .where(Review.status == "approved")
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
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


@router.get("/rating", response_model=ReviewRatingResponse)
async def get_rating(db: AsyncSession = Depends(get_db)):
    """Get aggregate rating (average and count) for approved reviews (public)."""
    result = await db.execute(
        select(func.avg(Review.rating).label("avg"), func.count(Review.id).label("count")).where(
            Review.status == "approved"
        )
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
        select(Review).where(Review.status == "pending").order_by(Review.created_at.desc())
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
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")
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
