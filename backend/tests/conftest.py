import asyncio
import os
import sys
from pathlib import Path

_api_root = Path(__file__).resolve().parents[1]
if str(_api_root) not in sys.path:
    sys.path.insert(0, str(_api_root))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

import pytest
from sqlmodel import SQLModel

from app.db import async_session, engine
from app.models import Merchant


@pytest.fixture(scope="session", autouse=True)
def _setup_database() -> None:
    async def setup() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
            await conn.run_sync(SQLModel.metadata.create_all)
        async with async_session() as session:
            session.add(
                Merchant(
                    id="merchant_demo",
                    api_key="demo-merchant-key",
                    name="Demo Merchant",
                )
            )
            await session.commit()

    asyncio.run(setup())
