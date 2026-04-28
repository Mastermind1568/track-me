import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Add the backend root to sys.path
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

def create_debug_app(error_msg):
    app = FastAPI()
    @app.get("/{path:path}")
    async def debug_root(path: str = ""):
        return {
            "status": "debug_mode",
            "error": "Application failed to import",
            "details": error_msg,
            "sys_path": sys.path,
            "directory": os.listdir(_root)
        }
    return app

try:
    from app.main import app as real_app
    app = real_app
except Exception as e:
    # If the real app fails, serve the debug app instead
    app = create_debug_app(traceback.format_exc())

# Vercel looks for 'app' or 'handler'
handler = app
