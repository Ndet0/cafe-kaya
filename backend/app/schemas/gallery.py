"""Gallery image schemas."""
from pydantic import BaseModel


class GalleryImageBase(BaseModel):
    image_url: str
    alt: str = ""
    span: str = ""
    sort_order: int = 0


class GalleryImageCreate(GalleryImageBase):
    pass


class GalleryImageUpdate(BaseModel):
    image_url: str | None = None
    alt: str | None = None
    span: str | None = None
    sort_order: int | None = None


class GalleryImageResponse(BaseModel):
    id: str
    image_url: str
    alt: str
    span: str
    sort_order: int

    class Config:
        from_attributes = True


class GalleryReorderRequest(BaseModel):
    ordered_ids: list[str]
