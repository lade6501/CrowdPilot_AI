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
    with patch("asyncio.create_task"), \
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

def test_agentic_core_extra_coverage():
    from backend.agents.agentic_core import get_best_detour_gate
    gates = {
        "Gate A": {"occupancy": 30},
        "Gate B": {"occupancy": 80},
        "Gate C": {"occupancy": 40},
        "Gate D": {"occupancy": 50}
    }
    assert get_best_detour_gate("Gate B", gates) == "Gate A"

    agentic_manager.reset_queue()
    agentic_manager.update_autonomy("auto_execute_low")
    assert agentic_manager.autonomy_level == "auto_execute_low"

    action_id = agentic_manager.add_action_to_queue({
        "proposer": "Crowd Flow Agent",
        "why": "Testing high traffic",
        "action": "Open expression gates",
        "risk_level": "Low",
        "target_metric": "gates.Gate A.occupancy",
        "initial_value": 85
    })
    
    action = next(a for a in agentic_manager.actions_queue if a["id"] == action_id)
    action["status"] = "pending"
    agentic_manager.approve_action(action_id)
    assert action["status"] in ["approved", "auto_executed"]

    action["status"] = "pending"
    agentic_manager.deny_action(action_id)
    assert action["status"] == "denied"
    
    stadium_state = {
        "gates": {"Gate A": {"occupancy": 85}},
        "metro": {"delay_minutes": 5},
        "incidents": [{"id": "inc_med_1", "type": "medical", "status": "active"}],
        "weather": {"condition": "Clear", "alerts": []}
    }
    
    action["target_metric"] = "gates.Gate A.occupancy"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)
    
    action["target_metric"] = "metro.delay_minutes"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)

    action["target_metric"] = "incidents.medical.status"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)
    
    action["target_metric"] = "weather.condition"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)

    action["target_metric"] = "incidents.vip_arrival.status"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)

    action["target_metric"] = "parking.influx"
    action["verification_status"] = "pending"
    action["target_tick"] = 0
    agentic_manager.verify_action_results(stadium_state, 1)

    agentic_manager.deploy_scenario_plan("Evacuation plan details")
    
    stadium_state = {
        "gates": {
            "Gate A": {"occupancy": 10},
            "Gate B": {"occupancy": 10},
            "Gate C": {"occupancy": 10},
            "Gate D": {"occupancy": 10}
        },
        "incidents": [
            {"id": "inc_med", "type": "medical", "status": "active", "description": "Med incident"},
            {"id": "inc_metro", "type": "metro_delay", "status": "active", "description": "Metro incident"},
            {"id": "inc_storm", "type": "storm_warning", "status": "active", "description": "Storm incident"},
            {"id": "inc_vip", "type": "vip_arrival", "status": "active", "description": "VIP incident"}
        ],
        "exit_surge_active": True,
        "parking": {
            "Lot A": {"occupancy": 96},
            "Lot B": {"occupancy": 96},
            "Lot C": {"occupancy": 96},
            "Lot D": {"occupancy": 96}
        },
        "metro": {"delay_minutes": 10}
    }
    agentic_manager.perceive_telemetry(stadium_state, 1)

@pytest.mark.asyncio
async def test_resolve_disagreement_async():
    agentic_manager.reset_queue()
    cf_id = agentic_manager.add_action_to_queue({
        "proposer": "Crowd Flow Agent",
        "why": "Active fire alarm in South Concourse level 2. Immediate evacuation required.",
        "action": "Close Gate B and redirect 100% of evacuating crowd to Gate C.",
        "risk_level": "High",
        "target_metric": "gates.Gate B.occupancy",
        "initial_value": 98
    })
    log_id = agentic_manager.add_action_to_queue({
        "proposer": "Logistics Agent",
        "why": "Gate C is at 78% occupancy. Metro Line 2 is experiencing delays and cannot absorb redirected evacuees.",
        "action": "Conflict Detected: Gate C cannot absorb Gate B load. Reject Gate B closure direction.",
        "risk_level": "Medium",
        "target_metric": "gates.Gate B.occupancy",
        "initial_value": 98
    })
    await agentic_manager.resolve_disagreement(cf_id, log_id)
    cf_action = next(a for a in agentic_manager.actions_queue if a["id"] == cf_id)
    log_action = next(a for a in agentic_manager.actions_queue if a["id"] == log_id)
    assert cf_action["status"] == "resolved_by_governance"
    assert log_action["status"] == "resolved_by_governance"

def test_orchestrator_agent_orchestrate():
    from backend.agents.orchestrator import orchestrator_agent, get_mock_fallback_summary, OrchestratorAgent
    stadium_state_mock = {
        "gates": {
            "Gate A": {"occupancy": 45, "queue": 5, "flow_rate": 12},
            "Gate B": {"occupancy": 70, "queue": 10, "flow_rate": 18},
            "Gate C": {"occupancy": 35, "queue": 3, "flow_rate": 8},
            "Gate D": {"occupancy": 40, "queue": 4, "flow_rate": 9}
        },
        "parking": {
            "Lot A": {"occupancy": 82, "capacity": 2000},
            "Lot B": {"occupancy": 70, "capacity": 1500}
        },
        "weather": {
            "condition": "Cloudy",
            "temp": 28,
            "humidity": 78,
            "wind_speed": 14,
            "alerts": []
        },
        "incidents": [
            {
                "id": "inc_1",
                "timestamp": "18:45:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 82% capacity.",
                "priority": "Medium",
                "status": "active"
            }
        ],
        "metro": {
            "status": "Delayed",
            "delay_minutes": 10,
            "line": "Line 2 (Stadium Express)"
        }
    }
    with patch("backend.agents.orchestrator.operations_agent.analyze") as mock_ops, \
         patch("backend.agents.orchestrator.crowd_agent.analyze") as mock_crowd, \
         patch("backend.agents.orchestrator.risk_agent.analyze") as mock_risk, \
         patch.object(orchestrator_agent, "call_gemini_structured") as mock_call:
        
        mock_ops.return_value = MagicMock()
        mock_crowd.return_value = MagicMock()
        mock_risk.return_value = MagicMock()
        mock_call.return_value = mock_ops_summary
        
        summary = OrchestratorAgent.orchestrate(orchestrator_agent, stadium_state_mock)
        assert summary == mock_ops_summary
        
        mock_call.side_effect = Exception("API error")
        with pytest.raises(Exception):
            OrchestratorAgent.orchestrate(orchestrator_agent, stadium_state_mock)
        
    fallback = get_mock_fallback_summary(stadium_state_mock)
    assert fallback.overall_status in ["normal", "warning", "critical"]

@patch("google.generativeai.GenerativeModel")
def test_base_agent_calls(mock_gen_model):
    from backend.agents.base import BaseAgent
    from pydantic import BaseModel
    
    class DummySchema(BaseModel):
        val: str
        
    mock_inst = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = '{"val": "hello"}'
    mock_inst.generate_content.return_value = mock_resp
    mock_gen_model.return_value = mock_inst
    
    agent = BaseAgent(role="Test Agent", system_prompt="Test Prompt")
    res = agent.call_gemini_structured("hello", DummySchema)
    assert res.val == "hello"
    
    mock_resp.text = "raw text"
    res_text = agent.call_gemini_text("hello")
    assert res_text == "raw text"
    
    mock_inst.generate_content.side_effect = Exception("API error")
    with pytest.raises(Exception):
        agent.call_gemini_structured("hello", DummySchema)
        
    with pytest.raises(Exception):
        agent.call_gemini_text("hello")