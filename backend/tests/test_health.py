"""Health and basic API tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """Health check returns 200 and status ok."""
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
