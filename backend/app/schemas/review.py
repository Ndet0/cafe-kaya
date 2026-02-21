"""Review schemas."""
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    name: str
    text: str
    rating: int = Field(ge=1, le=5)
    email: str | None = None


class ReviewUpdate(BaseModel):
    status: str  # approved, rejected


class ReviewResponse(BaseModel):
    id: str
    name: str
    text: str
    rating: int
    created_at: str | None = None

    class Config:
        from_attributes = True


class ReviewRatingResponse(BaseModel):
    average: float
    count: int
