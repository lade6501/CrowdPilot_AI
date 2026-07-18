import sys
import os
import io
import pytest
import asyncio
from unittest.mock import patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.agents.agentic_core import agentic_manager

client = TestClient(app)

def test_api_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_api_simulate_missing_body():
    response = client.post("/api/simulate", json={})
    assert response.status_code == 422

@patch("backend.agents.simulation.simulation_agent.simulate")
def test_api_simulate_success(mock_simulate):
    mock_simulate.return_value = {"simulation": "result"}
    response = client.post("/api/simulate", json={"scenario": "Close Gate A"})
    assert response.status_code == 200
    assert response.json() == {"simulation": "result"}

@patch("backend.agents.simulation.simulation_agent.simulate")
def test_api_simulate_failure(mock_simulate):
    mock_simulate.side_effect = Exception("Simulation failed")
    response = client.post("/api/simulate", json={"scenario": "Close Gate A"})
    assert response.status_code == 500

def test_api_announcement_missing_body():
    response = client.post("/api/announcement", json={})
    assert response.status_code == 422

@patch("backend.agents.communication.communication_agent.generate_announcement")
def test_api_announcement_success(mock_announce):
    mock_announce.return_value = {"announcement": "draft text"}
    response = client.post(
        "/api/announcement",
        json={"situation": "Delay", "tone": "Calm", "audience": "All"}
    )
    assert response.status_code == 200
    assert response.json() == {"announcement": "draft text"}

@patch("backend.agents.communication.communication_agent.generate_announcement")
def test_api_announcement_failure(mock_announce):
    mock_announce.side_effect = Exception("Announcement failed")
    response = client.post(
        "/api/announcement",
        json={"situation": "Delay", "tone": "Calm", "audience": "All"}
    )
    assert response.status_code == 500

def test_api_inject_valid():
    response = client.post("/api/inject", json={"incident_type": "medical"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "injected"

def test_api_inject_invalid():
    response = client.post("/api/inject", json={"incident_type": "invalid_event"})
    assert response.status_code == 400

def test_api_replay_valid():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        response = client.post("/api/replay", json={"time_slot": "8:00 PM"})
        assert response.status_code == 200
        assert response.json()["status"] == "scrubbed"

@patch("backend.simulator.trigger_ai_orchestration")
def test_api_orchestrate(mock_trigger):
    response = client.post("/api/orchestrate")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@patch("backend.agents.base.BaseAgent.call_gemini_text")
def test_api_translate(mock_call):
    mock_call.return_value = "Hola"
    # Target Spanish (es) calls mock
    response = client.post("/api/translate", json={"text": "Hello", "target_lang": "es"})
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Hola"
    
    # Target English (en) returns directly
    response = client.post("/api/translate", json={"text": "Hello", "target_lang": "en"})
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Hello"

def test_api_autonomy():
    response = client.post("/api/autonomy", json={"level": "full_autonomous"})
    assert response.status_code == 200
    assert response.json()["autonomy_level"] == "full_autonomous"

def test_api_approve_action():
    action_id = "test_action_1"
    agentic_manager.actions_queue = [{
        "id": action_id,
        "proposer": "Crowd Flow Agent",
        "why": "Testing high traffic",
        "action": "Open expression gates",
        "risk_level": "Low",
        "target_metric": "gates.Gate A.occupancy",
        "status": "pending",
        "verification_status": "not_started"
    }]
    response = client.post(f"/api/actions/{action_id}/approve")
    assert response.status_code == 200
    assert response.json()["status"] == "approved"

def test_api_deny_action():
    action_id = "test_action_2"
    agentic_manager.actions_queue = [{
        "id": action_id,
        "proposer": "Crowd Flow Agent",
        "why": "Testing high traffic",
        "action": "Open expression gates",
        "risk_level": "Low",
        "target_metric": "gates.Gate A.occupancy",
        "status": "pending",
        "verification_status": "not_started"
    }]
    response = client.post(f"/api/actions/{action_id}/deny")
    assert response.status_code == 200
    assert response.json()["status"] == "denied"

def test_api_deploy_plan():
    response = client.post("/api/actions/deploy-plan", json={"plan_summary": "Test Plan"})
    assert response.status_code == 200
    assert response.json()["status"] == "deployed"

def test_api_resume():
    response = client.post("/api/resume")
    assert response.status_code == 200
    assert response.json()["status"] == "resumed"

@patch("backend.api.upload.orchestrator_agent.orchestrate")
def test_csv_upload_validation_valid(mock_orchestrate):
    mock_summary = MagicMock()
    mock_summary.model_dump.return_value = {"summary": "uploaded CSV summary"}
    mock_orchestrate.return_value = mock_summary
    
    csv_data = "gate,occupancy,queue,flow_rate\nGate A,85,12,14\nGate B,92,20,18"
    file = io.BytesIO(csv_data.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 200
    assert "parsed_gates" in response.json()

def test_websocket_endpoint():
    with client.websocket_connect("/ws/events") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "state_sync"
        websocket.send_text("ping")
        resp = websocket.receive_text()
        assert resp == "pong"

def test_csv_upload_validation_malformed():
    csv_data = "gate,occupancy,queue,flow_rate\nGate A,150,12,14"
    file = io.BytesIO(csv_data.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 400

def test_csv_upload_validation_wrong_headers():
    csv_data = "wrong_col,occupancy,queue\nGate A,85,12"
    file = io.BytesIO(csv_data.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 400

def test_lifespan():
    async def dummy_loop():
        await asyncio.sleep(0)
    with patch("backend.simulator.start_simulator_loop", return_value=dummy_loop()):
        with TestClient(app) as c:
            response = c.get("/api/status")
            assert response.status_code == 200

def test_websocket_disconnect():
    with patch("backend.simulator.manager.connect", side_effect=Exception("Connection refused")):
        with pytest.raises(Exception):
            with client.websocket_connect("/ws/events") as ws:
                ws.receive_json()

@patch("backend.agents.base.BaseAgent.call_gemini_text")
def test_api_translate_languages(mock_call):
    mock_call.return_value = "Bonjour"
    response = client.post("/api/translate", json={"text": "Hello", "target_lang": "fr"})
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Bonjour"
    
    mock_call.return_value = "Namaste"
    response = client.post("/api/translate", json={"text": "Hello", "target_lang": "hi"})
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Namaste"

@patch("backend.agents.agentic_core.agentic_manager.update_autonomy", side_effect=Exception("Autonomy update error"))
def test_api_autonomy_failure(mock_update):
    response = client.post("/api/autonomy", json={"level": "full_autonomous"})
    assert response.status_code == 500

@patch("backend.agents.agentic_core.agentic_manager.approve_action", side_effect=Exception("Approve error"))
def test_api_approve_action_failure(mock_approve):
    response = client.post("/api/actions/test_action_1/approve")
    assert response.status_code == 500

@patch("backend.agents.agentic_core.agentic_manager.deny_action", side_effect=Exception("Deny error"))
def test_api_deny_action_failure(mock_deny):
    response = client.post("/api/actions/test_action_1/deny")
    assert response.status_code == 500

@patch("backend.agents.agentic_core.agentic_manager.deploy_scenario_plan", side_effect=Exception("Deploy error"))
def test_api_deploy_plan_failure(mock_deploy):
    response = client.post("/api/actions/deploy-plan", json={"plan_summary": "Test Plan"})
    assert response.status_code == 500

@patch("backend.api.simulation.reset_simulator_to_live", side_effect=Exception("Resume error"))
def test_api_resume_failure(mock_resume):
    response = client.post("/api/resume")
    assert response.status_code == 500