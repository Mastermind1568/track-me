from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Vercel Hello World"}

@app.get("/api")
async def api_root():
    return {"status": "ok", "message": "API is working"}
