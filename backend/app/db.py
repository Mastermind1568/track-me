"""
Async SQLAlchemy / SQLModel engine and sessions.

Runtime URLs use async drivers (+asyncpg, +aiosqlite). Alembic uses sync URLs;
see get_migration_url().
"""

from __future__ import annotations

import os
import ssl
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

_DEFAULT_ASYNC = "sqlite+aiosqlite:///./quickship.db"


def _get_raw_url() -> str:
    """Get the raw database URL from environment, checking Vercel's vars first."""
    return os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or _DEFAULT_ASYNC


def _normalize_async(url: str) -> str:
    """Normalize any database URL to use the correct async driver."""
    # SQLite
    if url.startswith("sqlite://") and "+aiosqlite" not in url:
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    # Already has asyncpg
    if "+asyncpg" in url:
        return url
    # psycopg -> asyncpg
    if "+psycopg" in url:
        return url.replace("+psycopg", "+asyncpg")
    # postgres:// or postgresql:// (bare, no driver specified)
    if url.startswith("postgres://") or url.startswith("postgresql://"):
        # Normalize to postgresql+asyncpg://
        url = url.replace("postgres://", "postgresql://", 1) if url.startswith("postgres://") else url
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _normalize_sync(url: str) -> str:
    """Normalize any database URL to use the correct sync driver."""
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "+psycopg")
    if "+aiosqlite" in url:
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def get_async_database_url() -> str:
    return _normalize_async(_get_raw_url())


def get_migration_url() -> str:
    """Sync URL for Alembic (psycopg or sqlite)."""
    return _normalize_sync(_get_raw_url())


def _create_async_engine():
    url = get_async_database_url()
    echo = os.getenv("SQL_ECHO", "").lower() in ("1", "true", "yes")

    # SQLite
    if url.startswith("sqlite+aiosqlite"):
        if ":memory:" in url:
            return create_async_engine(
                url,
                echo=echo,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        return create_async_engine(url, echo=echo, connect_args={"check_same_thread": False})

    # Postgres — asyncpg uses an ssl.SSLContext, NOT connect_args
    kwargs = {"echo": echo, "pool_pre_ping": True}

    # If connecting to a cloud Postgres, enable SSL
    if os.getenv("POSTGRES_URL") or os.getenv("VERCEL"):
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        kwargs["connect_args"] = {"ssl": ssl_ctx}

    return create_async_engine(url, **kwargs)


engine = _create_async_engine()
async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def create_db_and_tables() -> None:
    from app import models as _models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
