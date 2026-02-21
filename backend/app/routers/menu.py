"""Menu router: categories and menu items CRUD."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models.menu import Category, MenuItem
from app.models.user import User
from app.schemas.menu import (
    CategoryCreate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
)
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all menu categories (public)."""
    result = await db.execute(
        select(Category).order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()
    return list(categories)


@router.get("", response_model=list[MenuItemResponse])
async def list_menu_items(
    category: str | None = Query(None, description="Filter by category id"),
    db: AsyncSession = Depends(get_db),
):
    """List menu items, optionally filtered by category (public)."""
    q = select(MenuItem).where(MenuItem.is_available == True).order_by(MenuItem.sort_order, MenuItem.name)
    if category:
        q = q.where(MenuItem.category_id == category)
    q = q.options(selectinload(MenuItem.category))
    result = await db.execute(q)
    items = result.scalars().all()
    return [
        MenuItemResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            price=item.price,
            category_id=item.category_id,
            category_name=item.category.name if item.category else None,
            image_url=item.image_url,
            sort_order=item.sort_order,
            is_available=item.is_available,
        )
        for item in items
    ]


@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single menu item (public)."""
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id).options(selectinload(MenuItem.category))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return MenuItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        price=item.price,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        image_url=item.image_url,
        sort_order=item.sort_order,
        is_available=item.is_available,
    )


# --- Admin routes ---


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a category (admin)."""
    category = Category(name=body.name, sort_order=body.sort_order)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.post("", response_model=MenuItemResponse)
async def create_menu_item(
    body: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a menu item (admin)."""
    result = await db.execute(select(Category).where(Category.id == body.category_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category not found")
    item = MenuItem(
        name=body.name,
        description=body.description,
        price=body.price,
        category_id=body.category_id,
        image_url=body.image_url,
        sort_order=body.sort_order,
        is_available=body.is_available,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    result = await db.execute(select(MenuItem).where(MenuItem.id == item.id).options(selectinload(MenuItem.category)))
    item = result.scalar_one()
    return MenuItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        price=item.price,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        image_url=item.image_url,
        sort_order=item.sort_order,
        is_available=item.is_available,
    )


@router.put("/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: str,
    body: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a menu item (admin)."""
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id).options(selectinload(MenuItem.category))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    if body.category_id is not None:
        r = await db.execute(select(Category).where(Category.id == body.category_id))
        if not r.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category not found")
    await db.commit()
    await db.refresh(item)
    return MenuItemResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        price=item.price,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        image_url=item.image_url,
        sort_order=item.sort_order,
        is_available=item.is_available,
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a menu item (admin)."""
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await db.delete(item)
    await db.commit()
