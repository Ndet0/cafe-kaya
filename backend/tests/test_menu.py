"""Tests for /api/menu endpoints (categories + menu items)."""

import uuid

import pytest
from app.models.menu import Category, MenuItem
from httpx import AsyncClient
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Helpers — use sync session, commit so the ASGI app can see the data
# ---------------------------------------------------------------------------


def _create_category(
    db: Session, name: str = "Drinks", sort_order: int = 0
) -> Category:
    cat = Category(name=name, sort_order=sort_order)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def _create_item(
    db: Session,
    category: Category,
    name: str = "Latte",
    price: float = 4.50,
) -> MenuItem:
    item = MenuItem(
        name=name,
        description="Creamy latte",
        price=price,
        category_id=category.id,
        image_url=None,
        sort_order=0,
        is_available=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# GET /api/menu/categories (public)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_categories_empty(client: AsyncClient):
    r = await client.get("/api/menu/categories")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient, db: Session):
    _create_category(db, "Coffee")
    _create_category(db, "Pastries")
    r = await client.get("/api/menu/categories")
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert "Coffee" in names
    assert "Pastries" in names


# ---------------------------------------------------------------------------
# GET /api/menu (public)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_menu_items_empty(client: AsyncClient):
    r = await client.get("/api/menu")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_menu_items(client: AsyncClient, db: Session):
    cat = _create_category(db)
    _create_item(db, cat, "Espresso", 3.00)
    r = await client.get("/api/menu")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    assert items[0]["name"] == "Espresso"


@pytest.mark.asyncio
async def test_list_menu_items_filter_by_category(client: AsyncClient, db: Session):
    cat1 = _create_category(db, "Hot")
    cat2 = _create_category(db, "Cold")
    _create_item(db, cat1, "Americano", 3.50)
    _create_item(db, cat2, "Iced Tea", 3.00)

    r = await client.get(f"/api/menu?category={cat1.id}")
    assert r.status_code == 200
    items = r.json()
    assert all(i["category_id"] == cat1.id for i in items)


# ---------------------------------------------------------------------------
# GET /api/menu/{item_id} (public)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_menu_item(client: AsyncClient, db: Session):
    cat = _create_category(db)
    item = _create_item(db, cat)
    r = await client.get(f"/api/menu/{item.id}")
    assert r.status_code == 200
    assert r.json()["name"] == item.name


@pytest.mark.asyncio
async def test_get_menu_item_not_found(client: AsyncClient):
    r = await client.get(f"/api/menu/{uuid.uuid4()}")
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/menu/categories (admin)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_category_admin(client: AsyncClient, admin_user, auth_headers):
    r = await client.post(
        "/api/menu/categories",
        json={"name": "Desserts", "sort_order": 1},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Desserts"


@pytest.mark.asyncio
async def test_create_category_unauthenticated(client: AsyncClient):
    r = await client.post("/api/menu/categories", json={"name": "Nope"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/menu (admin)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_menu_item_admin(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    cat = _create_category(db)
    r = await client.post(
        "/api/menu",
        json={
            "name": "Cappuccino",
            "description": "Foamy",
            "price": 5.00,
            "category_id": cat.id,
            "is_available": True,
        },
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Cappuccino"


@pytest.mark.asyncio
async def test_create_menu_item_bad_category(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.post(
        "/api/menu",
        json={
            "name": "Ghost Item",
            "price": 1.00,
            "category_id": str(uuid.uuid4()),
        },
        headers=auth_headers,
    )
    assert r.status_code == 400
    assert "Category not found" in r.json()["detail"]


@pytest.mark.asyncio
async def test_create_menu_item_unauthenticated(client: AsyncClient):
    r = await client.post(
        "/api/menu",
        json={
            "name": "No Auth",
            "price": 1.00,
            "category_id": str(uuid.uuid4()),
        },
    )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# PUT /api/menu/{item_id} (admin)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_menu_item(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    cat = _create_category(db)
    item = _create_item(db, cat)
    r = await client.put(
        f"/api/menu/{item.id}",
        json={"name": "Updated Latte", "price": 5.99},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Updated Latte"


@pytest.mark.asyncio
async def test_update_menu_item_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.put(
        f"/api/menu/{uuid.uuid4()}",
        json={"name": "Nope"},
        headers=auth_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_update_menu_item_unauthenticated(client: AsyncClient):
    r = await client.put(f"/api/menu/{uuid.uuid4()}", json={"name": "Nope"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /api/menu/{item_id} (admin)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_menu_item(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    cat = _create_category(db)
    item = _create_item(db, cat)
    r = await client.delete(f"/api/menu/{item.id}", headers=auth_headers)
    assert r.status_code == 204

    r2 = await client.get(f"/api/menu/{item.id}")
    assert r2.status_code == 404


@pytest.mark.asyncio
async def test_delete_menu_item_not_found(
    client: AsyncClient, admin_user, auth_headers
):
    r = await client.delete(f"/api/menu/{uuid.uuid4()}", headers=auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_menu_item_unauthenticated(client: AsyncClient):
    r = await client.delete(f"/api/menu/{uuid.uuid4()}")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Additional branch-coverage tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_menu_items_excludes_unavailable(
    client: AsyncClient, db: Session
):
    """Items with is_available=False are filtered out of the public list."""
    cat = _create_category(db)
    available = _create_item(db, cat, "Available Latte", 4.00)
    unavailable = MenuItem(
        name="Hidden Mocha",
        description="Unavailable",
        price=5.00,
        category_id=cat.id,
        image_url=None,
        sort_order=0,
        is_available=False,
    )
    db.add(unavailable)
    db.commit()

    r = await client.get("/api/menu")
    assert r.status_code == 200
    names = [i["name"] for i in r.json()]
    assert "Available Latte" in names
    assert "Hidden Mocha" not in names


@pytest.mark.asyncio
async def test_update_menu_item_bad_category(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    """Updating a menu item with a non-existent category_id returns 400."""
    cat = _create_category(db)
    item = _create_item(db, cat)
    r = await client.put(
        f"/api/menu/{item.id}",
        json={"category_id": str(uuid.uuid4())},
        headers=auth_headers,
    )
    assert r.status_code == 400
    assert "Category not found" in r.json()["detail"]


@pytest.mark.asyncio
async def test_create_menu_item_minimal_fields(
    client: AsyncClient, db: Session, admin_user, auth_headers
):
    """Creating a menu item with only required fields succeeds."""
    cat = _create_category(db)
    r = await client.post(
        "/api/menu",
        json={
            "name": "Minimal Item",
            "price": 2.50,
            "category_id": cat.id,
        },
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Minimal Item"
    assert data["description"] is None
    assert data["image_url"] is None
    assert data["is_available"] is True
