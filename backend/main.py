import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the current directory is in path so we can import 'app' and other scripts
_root = os.path.dirname(os.path.abspath(__file__))
if _root not in sys.path:
    sys.path.insert(0, _root)

app = FastAPI()

# Add CORS so the other sites can talk to it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online", 
        "message": "Quickship API is Live",
        "version": "1.2.0",
        "docs": "/docs",
        "setup": {
            "initialize": "/init-db",
            "seed": "/seed-data"
        }
    }

@app.get("/init-db")
async def init_db():
    try:
        from app.db import create_db_and_tables
        await create_db_and_tables()
        return {"status": "success", "message": "Database initialized"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/seed-data")
async def seed_data():
    try:
        from seed_demo_stages import seed_demo_data
        await seed_demo_data()
        return {"status": "success", "message": "Demo data seeded successfully"}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

# Import the real routes
try:
    from app.api import router
    app.include_router(router, prefix="/api/v1")
except Exception as e:
    @app.get("/import-error")
    async def import_error():
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
