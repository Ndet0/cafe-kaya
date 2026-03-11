"""Pytest fixtures: isolated SQLite test DB, async client, auth helpers.

Strategy: use file-based SQLite so that the synchronous engine (for test-data
seeding/cleanup) and the asynchronous engine (used by the ASGI app) share the
same database.
"""

import os
import pathlib
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# SQLite test database paths
# ---------------------------------------------------------------------------

_TEST_DIR = pathlib.Path(__file__).resolve().parent
_TEST_DB = _TEST_DIR / "test.db"
TEST_DB_SYNC = f"sqlite:///{_TEST_DB}"
TEST_DB_ASYNC = f"sqlite+aiosqlite:///{_TEST_DB}"

# Point settings at test env before any app import
os.environ["CAFE_DATABASE_URL"] = TEST_DB_ASYNC
os.environ["JWT_SECRET"] = "test-secret-key-not-for-production"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["GOOGLE_PLACE_ID"] = "test-place-id"
os.environ["GOOGLE_PLACES_API_KEY"] = "test-google-api-key"

# Import all model modules so Base.metadata knows every table
import app.models.contact  # noqa: F401, E402
import app.models.gallery  # noqa: F401, E402
import app.models.menu  # noqa: F401, E402
import app.models.review  # noqa: F401, E402
import app.models.settings  # noqa: F401, E402
from app.db import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.auth import create_access_token, hash_password  # noqa: E402

# ---------------------------------------------------------------------------
# Engines and session factory
# ---------------------------------------------------------------------------

engine_sync = create_engine(
    TEST_DB_SYNC,
    connect_args={"check_same_thread": False},
    echo=False,
)

engine_async = create_async_engine(
    TEST_DB_ASYNC,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestAsyncSession = async_sessionmaker(
    engine_async,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Enable foreign-key enforcement on every SQLite connection
@event.listens_for(engine_sync, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


# ---------------------------------------------------------------------------
# Session-scoped: create / drop tables once
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.create_all(bind=engine_sync)
    yield
    Base.metadata.drop_all(bind=engine_sync)
    engine_sync.dispose()
    for suffix in ("", "-wal", "-shm"):
        p = pathlib.Path(str(_TEST_DB) + suffix)
        p.unlink(missing_ok=True)


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
# Async DB session for unit-testing services directly
# ---------------------------------------------------------------------------


@pytest.fixture
async def async_db() -> AsyncGenerator[AsyncSession, None]:
    """Async session for testing services that need direct DB access."""
    async with TestAsyncSession() as session:
        yield session


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
