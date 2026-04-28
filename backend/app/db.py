"""
Async SQLAlchemy / SQLModel engine and sessions.

Runtime URLs use async drivers (+asyncpg, +aiosqlite). Alembic uses sync URLs;
see get_migration_url().
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

_DEFAULT_ASYNC = "sqlite+aiosqlite:///./quickship.db"


def get_async_database_url() -> str:
    # Check for Vercel's default env var first, then our custom one
    url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or _DEFAULT_ASYNC
    if url.startswith("sqlite://") and "+aiosqlite" not in url:
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if (url.startswith("postgresql://") or url.startswith("postgres://")) and "+asyncpg" not in url and "+psycopg" not in url:
        return url.replace("://", "+asyncpg://", 1).replace("postgres+", "postgresql+", 1)
    return url


def get_migration_url() -> str:
    """Sync URL for Alembic (psycopg or sqlite)."""
    url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or _DEFAULT_ASYNC
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "+psycopg")
    if "+aiosqlite" in url:
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if url.startswith("sqlite://") and "+aiosqlite" not in url:
        return url
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def _create_async_engine():
    url = get_async_database_url()
    echo = os.getenv("SQL_ECHO", "").lower() in ("1", "true", "yes")
    if url.startswith("sqlite+aiosqlite"):
        if ":memory:" in url:
            return create_async_engine(
                url,
                echo=echo,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        return create_async_engine(url, echo=echo, connect_args={"check_same_thread": False})
    return create_async_engine(url, echo=echo, pool_pre_ping=True)


engine = _create_async_engine()
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def create_db_and_tables() -> None:
    from app import models as _models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
