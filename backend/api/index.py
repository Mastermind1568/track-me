"""Vercel Serverless Function entry point for FastAPI."""
import os
import sys

# Ensure the backend root is on sys.path so `app` package is importable
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from app.main import app  # noqa: E402

# Vercel expects either `app` (ASGI) or `handler` (WSGI)
handler = app
