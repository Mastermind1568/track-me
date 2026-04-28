import os
import sys

# CRITICAL: Tell Python where to find the 'app' folder
# Vercel runs from a temporary directory, so we must use absolute paths.
pwd = os.path.dirname(os.path.abspath(__file__))
if pwd not in sys.path:
    sys.path.insert(0, pwd)

try:
    from app.main import app as real_app
    app = real_app
except ImportError as e:
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/")
    async def error():
        return {
            "error": "Module Discovery Error",
            "message": str(e),
            "sys_path": sys.path,
            "pwd": pwd,
            "contents": os.listdir(pwd)
        }
except Exception as e:
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.get("/")
    async def error():
        import traceback
        return {
            "error": "General Startup Error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }
