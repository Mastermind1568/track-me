import os
import sys
from fastapi import FastAPI

# Force current dir into path
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _root)

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "online", "mode": "minimal"}

@app.get("/debug")
async def debug():
    return {"sys_path": sys.path, "files": os.listdir(_root)}

# Try to link the real app if possible
try:
    from app.main import app as real_app
    app.mount("/api", real_app)
except Exception as e:
    @app.get("/error")
    async def error():
        return {"error": str(e)}

handler = app
