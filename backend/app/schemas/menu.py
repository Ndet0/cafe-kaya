"""Menu and category schemas."""
from decimal import Decimal
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str

    class Config:
        from_attributes = True


class MenuItemBase(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    category_id: str
    image_url: str | None = None
    sort_order: int = 0
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    category_id: str | None = None
    image_url: str | None = None
    sort_order: int | None = None
    is_available: bool | None = None


class MenuItemResponse(BaseModel):
    id: str
    name: str
    description: str | None
    price: Decimal
    category_id: str
    category_name: str | None = None
    image_url: str | None
    sort_order: int
    is_available: bool

    class Config:
        from_attributes = True
