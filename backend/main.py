import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    return {"status": "online", "message": "Quickship API is Live"}

@app.get("/init-db")
async def init_db():
    try:
        from app.db import create_db_and_tables
        await create_db_and_tables()
        return {"status": "success", "message": "Database initialized"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Import the real routes
try:
    from app.api import router
    app.include_router(router, prefix="/api/v1")
except Exception as e:
    @app.get("/import-error")
    async def import_error():
        return {"error": str(e)}
