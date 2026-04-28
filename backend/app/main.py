import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import router
from .db import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # We no longer create tables on startup to avoid Vercel timeouts.
    # The database should be initialized once via a migration or seed script.
    yield


_DEFAULT_ORIGINS = "http://localhost:3000,http://localhost:4321,http://127.0.0.1:3000,http://127.0.0.1:4321"
_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _DEFAULT_ORIGINS).split(",") if o.strip()]

app = FastAPI(title="Quickship API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Quickship API",
        "version": "1.1.0",
        "docs": "/docs",
        "setup": "/init-db"
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

# Storage: use /tmp on serverless (read-only filesystem), local dir otherwise
if os.getenv("VERCEL"):
    STORAGE = "/tmp/storage"
else:
    STORAGE = os.path.join(os.path.dirname(__file__), "..", "storage")

try:
    os.makedirs(STORAGE, exist_ok=True)
    app.mount("/storage", StaticFiles(directory=STORAGE), name="storage")
except OSError:
    pass  # Gracefully skip if filesystem is restricted
