"""Re-export async session dependency for routers."""

from .db import get_session

__all__ = ["get_session"]
