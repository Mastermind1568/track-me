import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_and_track():
    payload = {
        "reference": "TEST1",
        "service": "standard",
        "parcel": {"weight_kg": 1.0},
        "sender": {"line1": "123 Main St", "city": "Toronto", "province": "ON", "postal": "M5V1E3", "country": "CA"},
        "recipient": {"line1": "55 Queen St", "city": "Toronto", "province": "ON", "postal": "M5C2N1", "country": "CA"},
    }
    headers = {"X-API-Key": "demo-merchant-key"}
    resp = client.post("/api/v1/shipments", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    trk = data["tracking_no"]
    t = client.get(f"/api/v1/track/{trk}")
    assert t.status_code == 200
    body = t.json()
    assert body["tracking_no"] == trk
    assert body["status"] == "accepted"
    assert len(body["timeline"]) >= 1
