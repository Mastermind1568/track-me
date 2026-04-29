import os
from uuid import uuid4

if os.getenv("VERCEL"):
    STORAGE_DIR = "/tmp/storage"
else:
    STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage")

os.makedirs(STORAGE_DIR, exist_ok=True)


def save_bytes(filename: str, data: bytes) -> str:
    path = os.path.join(STORAGE_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path


def make_tracking_no() -> str:
    return "TRK" + uuid4().hex[:12].upper()
