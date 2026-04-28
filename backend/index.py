"""Vercel Serverless Function entry point."""
import traceback

try:
    from app.main import app
except Exception as e:
    # If the app fails to import, create a minimal FastAPI that reports the error
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    error_msg = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"

    @app.get("/{path:path}")
    async def error_handler(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={"error": "App failed to start", "detail": error_msg}
        )
