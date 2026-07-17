import sys
import os
import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.agents.agentic_core import agentic_manager
from backend.agents.orchestrator import orchestrator_agent, OperationsSummary, RecommendationItem

client = TestClient(app)


mock_ops_summary = OperationsSummary(
    overall_status="normal",
    safety_index=9.8,
    efficiency_score=92,
    recommendations=[
        RecommendationItem(
            id="rec_1",
            title="Operational Redirection",
            problem="Mild gate load increase",
            reason="Telemetry drift",
            suggested_action="Maintain current gate flow and signage",
            expected_outcome="Flow velocity stays stable",
            confidence=95
        )
    ],
    prioritized_incidents=[],
    crowd_hotspots=[]
)

@pytest.fixture(autouse=True)
def setup_mocks():

    with patch("asyncio.create_task") as mock_create_task, \
         patch.object(orchestrator_agent, "orchestrate", return_value=mock_ops_summary):
        yield

def test_occupancy_threshold_logic():
    agentic_manager.reset_queue()
    mock_state = {
        "gates": {
            "Gate A": {"occupancy": 89, "queue": 4, "flow_rate": 10},
            "Gate B": {"occupancy": 91, "queue": 15, "flow_rate": 12},
            "Gate C": {"occupancy": 50, "queue": 2, "flow_rate": 8},
            "Gate D": {"occupancy": 40, "queue": 3, "flow_rate": 6}
        },
        "incidents": []
    }
    
    agentic_manager.perceive_telemetry(mock_state, current_tick=1)
    actions = agentic_manager.get_actions()
    

    gate_b_proposals = [a for a in actions if a["target_metric"] == "gates.Gate B.occupancy"]
    gate_a_proposals = [a for a in actions if a["target_metric"] == "gates.Gate A.occupancy"]
    
    assert len(gate_b_proposals) >= 1
    assert len(gate_a_proposals) == 0

def test_governance_emergency_override():
    agentic_manager.reset_queue()
    action_data = {
        "proposer": "Incident Response Agent",
        "why": "Medical emergency fainted spectator Section 104",
        "action": "Dispatch emergency medical team medic to Section 104",
        "target_metric": "incidents.medical.status",
        "risk_level": "High"
    }
    
    original_autonomy = agentic_manager.autonomy_level
    agentic_manager.autonomy_level = "full_autonomous"
    
    try:
        import asyncio
        action_id = agentic_manager.add_action_to_queue(action_data)
        

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(agentic_manager.run_governance_review(action_id, action_data))
        
        action = next(a for a in agentic_manager.actions_queue if a["id"] == action_id)

        assert action["status"] == "pending"
        assert "medical override" in action["governance_details"].lower() or "human check" in action["governance_details"].lower()
    finally:
        agentic_manager.autonomy_level = original_autonomy

def test_governance_max_closures_policy():
    agentic_manager.reset_queue()
    

    agentic_manager.actions_queue.append({
        "id": "action_old",
        "proposer": "Crowd Flow Agent",
        "why": "Gate A overload",
        "action": "Close Gate A due to structural safety checks",
        "risk_level": "High",
        "status": "approved",
        "target_metric": "gates.Gate A.occupancy",
        "verification_status": "not_started"
    })
    
    action_data = {
        "proposer": "Crowd Flow Agent",
        "why": "Gate B evacuation need",
        "action": "Close Gate B and redirect flow",
        "target_metric": "gates.Gate B.occupancy",
        "risk_level": "High"
    }
    
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    action_id = agentic_manager.add_action_to_queue(action_data)
    loop.run_until_complete(agentic_manager.run_governance_review(action_id, action_data))
    
    action = next(a for a in agentic_manager.actions_queue if a["id"] == action_id)

    assert action["status"] == "failed_governance"
    assert "closures policy" in action["governance_details"].lower() or "max-simultaneous-closures" in action["governance_details"].lower()

def test_csv_upload_validation_valid():
    csv_data = "gate,occupancy,queue,flow_rate\nGate A,85,12,14\nGate B,92,20,18"
    file = io.BytesIO(csv_data.encode("utf-8"))
    
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert "parsed_gates" in res_data
    assert res_data["parsed_gates"]["Gate A"]["occupancy"] == 85
    assert res_data["parsed_gates"]["Gate B"]["queue"] == 20

def test_csv_upload_validation_malformed():

    csv_data = "gate,occupancy,queue,flow_rate\nGate A,150,12,14"
    file = io.BytesIO(csv_data.encode("utf-8"))
    
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 400
    assert "malformed" in response.json()["detail"].lower()

def test_csv_upload_validation_wrong_headers():
    csv_data = "wrong_col,occupancy,queue\nGate A,85,12"
    file = io.BytesIO(csv_data.encode("utf-8"))
    
    response = client.post(
        "/api/upload",
        files={"file": ("snapshot.csv", file, "text/csv")}
    )
    assert response.status_code == 400
    assert "must contain columns" in response.json()["detail"].lower()