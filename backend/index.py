import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

try:
    # Try to import the real application
    from app.main import app as real_app
    app = real_app
except Exception as e:
    # If it fails, report why
    error_info = traceback.format_exc()
    
    @app.get("/{path:path}")
    async def catch_all(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application Crash",
                "message": str(e),
                "traceback": error_info
            }
        )
