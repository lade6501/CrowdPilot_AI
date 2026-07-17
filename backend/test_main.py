import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "gemini_api_configured" in data
    assert "mode" in data

def test_api_simulate_missing_body():
    response = client.post("/api/simulate", json={})
    assert response.status_code == 422

def test_api_announcement_missing_body():
    response = client.post("/api/announcement", json={})
    assert response.status_code == 422

def test_api_inject_valid():
    response = client.post("/api/inject", json={"incident_type": "medical"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "injected"
    assert data["type"] == "medical"

def test_api_inject_invalid():
    response = client.post("/api/inject", json={"incident_type": "invalid_event"})
    assert response.status_code == 400

def test_api_replay_valid():
    response = client.post("/api/replay", json={"time_slot": "8:00 PM"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "scrubbed"
    assert data["time_slot"] == "8:00 PM"