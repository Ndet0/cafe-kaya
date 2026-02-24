"""Pytest fixtures: isolated test DB, async client, auth helpers.

Strategy: use the *synchronous* engine (psycopg2) for all test-data seeding
and cleanup, so the async connection pool used by the ASGI app never conflicts
with test infrastructure operations.
"""
import os
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# Point settings at test env before any app import
os.environ["CAFE_DATABASE_URL"] = (
    "postgresql+asyncpg://REMOVED_TEST_DB"
)
os.environ["JWT_SECRET"] = "test-secret-key-not-for-production"
os.environ["JWT_ALGORITHM"] = "HS256"

from app.db import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.auth import hash_password, create_access_token  # noqa: E402

# Import all model modules so Base.metadata knows every table
import app.models.menu  # noqa: F401, E402
import app.models.gallery  # noqa: F401, E402
import app.models.review  # noqa: F401, E402
import app.models.contact  # noqa: F401, E402
import app.models.settings  # noqa: F401, E402

TEST_DB_ASYNC = os.environ["CAFE_DATABASE_URL"]
TEST_DB_SYNC = TEST_DB_ASYNC.replace("+asyncpg", "+psycopg2")

engine_sync = create_engine(TEST_DB_SYNC, echo=False)
engine_async = create_async_engine(TEST_DB_ASYNC, echo=False, poolclass=NullPool)

TestAsyncSession = async_sessionmaker(
    engine_async,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Session-scoped: create / drop tables once
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.create_all(bind=engine_sync)
    yield
    Base.metadata.drop_all(bind=engine_sync)
    engine_sync.dispose()


# ---------------------------------------------------------------------------
# Per-test cleanup (sync — avoids asyncpg pool contention)
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _truncate_tables():
    yield
    with engine_sync.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


# ---------------------------------------------------------------------------
# Sync DB session for seeding test data
# ---------------------------------------------------------------------------

@pytest.fixture
def db(engine_sync=engine_sync) -> Session:
    """Synchronous session for inserting seed data visible to the ASGI app."""
    with Session(engine_sync) as session:
        yield session


# ---------------------------------------------------------------------------
# HTTP client — app gets its own async sessions
# ---------------------------------------------------------------------------

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db():
        async with TestAsyncSession() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://test",
    ) as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "testpassword123"


@pytest.fixture
def admin_user(db: Session) -> User:
    """Insert an admin user (committed via sync session)."""
    user = User(
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(sub=admin_user.id)


@pytest.fixture
def auth_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}
