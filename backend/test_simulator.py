import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
import copy
from unittest.mock import MagicMock, patch
from backend.simulator_helpers import (
    _compute_operational_metrics,
    _compute_efficiency_score,
    fetch_real_weather,
)
from backend import simulator

class MockWebsocket:
    def __init__(self):
        self.accepted = False
        self.sent_messages = []
        self.should_fail_send = False

    async def accept(self):
        self.accepted = True

    async def send_text(self, text):
        if self.should_fail_send:
            raise Exception("Websocket send failed")
        self.sent_messages.append(text)

@pytest.fixture(autouse=True)
def clean_state():
    backup_state = copy.deepcopy(simulator.stadium_state)
    backup_tick = simulator.sim_tick
    backup_locked = simulator.is_locked_to_replay
    backup_weather = simulator.last_weather_fetch_tick
    yield
    simulator.stadium_state.clear()
    simulator.stadium_state.update(backup_state)
    simulator.sim_tick = backup_tick
    simulator.is_locked_to_replay = backup_locked
    simulator.last_weather_fetch_tick = backup_weather

def test_connection_manager_connect_disconnect():
    cm = simulator.ConnectionManager()
    ws = MockWebsocket()
    asyncio.run(cm.connect(ws))
    assert len(cm.active_connections) == 1
    assert ws.accepted is True
    cm.disconnect(ws)
    assert len(cm.active_connections) == 0

def test_connection_manager_broadcast():
    cm = simulator.ConnectionManager()
    ws1 = MockWebsocket()
    ws2 = MockWebsocket()
    ws2.should_fail_send = True
    asyncio.run(cm.connect(ws1))
    asyncio.run(cm.connect(ws2))
    asyncio.run(cm.broadcast({"test": "data"}))
    assert len(ws1.sent_messages) == 1
    assert len(cm.active_connections) == 1

def test_compute_operational_metrics():
    gates = {"G1": {"occupancy": 30}, "G2": {"occupancy": 40}}
    incidents = []
    idx, status = _compute_operational_metrics(gates, incidents)
    assert idx == 9.8
    assert status == "normal"
    
    gates = {"G1": {"occupancy": 95}, "G2": {"occupancy": 40}}
    idx, status = _compute_operational_metrics(gates, incidents)
    assert idx == 7.2
    assert status == "warning"
    
    gates = {"G1": {"occupancy": 95}, "G2": {"occupancy": 90}}
    idx, status = _compute_operational_metrics(gates, incidents)
    assert idx == 5.2
    assert status == "critical"
    
    gates = {"G1": {"occupancy": 30}}
    incidents = [{"status": "active", "priority": "Critical"}]
    idx, status = _compute_operational_metrics(gates, incidents)
    assert idx == 5.2
    assert status == "critical"
    
    incidents = [{"status": "active", "priority": "High"}]
    idx, status = _compute_operational_metrics(gates, incidents)
    assert idx == 7.5
    assert status == "warning"

def test_compute_efficiency_score():
    gates = {"G1": {"queue": 5}, "G2": {"queue": 10}}
    score = _compute_efficiency_score(gates, metro_delay=10)
    assert score < 92
    score = _compute_efficiency_score({"G1": {"queue": 100}}, metro_delay=1000)
    assert score == 47

@patch("urllib.request.urlopen")
def test_fetch_real_weather(mock_urlopen):
    mock_resp = MagicMock()
    mock_resp.read.return_value = b'{"weather": [{"main": "Clear"}], "main": {"temp": 25.4, "humidity": 60}, "wind": {"speed": 5.0}}'
    mock_resp.__enter__.return_value = mock_resp
    mock_urlopen.return_value = mock_resp
    with patch.dict("os.environ", {"OPENWEATHER_API_KEY": "dummy_key"}):
        res = fetch_real_weather()
        assert res is not None
        assert res["condition"] == "Clear"
        assert res["temp"] == 25
    mock_urlopen.side_effect = Exception("HTTP Error")
    with patch.dict("os.environ", {"OPENWEATHER_API_KEY": "dummy_key"}):
        res = fetch_real_weather()
        assert res is None

def test_trigger_ai_orchestration():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        asyncio.run(simulator.trigger_ai_orchestration())
        assert simulator.stadium_state["ai_summary"] == {"summary": "operational summary"}
        assert simulator.stadium_state["ai_error"] is None
        mock_orch.side_effect = Exception("429 Too Many Requests: quota exceeded")
        asyncio.run(simulator.trigger_ai_orchestration())
        assert simulator.stadium_state["quota_limited"] is True
        mock_orch.side_effect = Exception("Generic Error")
        asyncio.run(simulator.trigger_ai_orchestration())
        assert simulator.stadium_state["ai_error"] is not None

def test_load_replay_preset():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        asyncio.run(simulator.load_replay_preset("8:00 PM"))
        assert simulator.stadium_state["mode"] == "replay"
        assert simulator.stadium_state["timestamp"] == "20:00:00"
        asyncio.run(simulator.load_replay_preset("invalid_preset"))
        assert simulator.stadium_state["mode"] == "replay"

def test_reset_simulator_to_live():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        simulator.is_locked_to_replay = True
        asyncio.run(simulator.load_replay_preset("8:00 PM"))
        asyncio.run(simulator.reset_simulator_to_live())
        assert simulator.is_locked_to_replay is False
        assert simulator.stadium_state["mode"] == "live"

def test_inject_incident():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        asyncio.run(simulator.inject_incident("medical"))
        assert any(inc.get("type") == "medical" for inc in simulator.stadium_state["incidents"])
        asyncio.run(simulator.inject_incident("fire_alarm"))
        assert any(inc.get("type") == "facility" and "fire" in inc.get("title", "").lower() for inc in simulator.stadium_state["incidents"])
        asyncio.run(simulator.inject_incident("metro_failure"))
        assert simulator.stadium_state["metro"]["status"] == "Stopped"
        asyncio.run(simulator.inject_incident("storm_warning"))
        assert simulator.stadium_state["weather"]["condition"] == "Severe Lightning"
        asyncio.run(simulator.inject_incident("vip_arrival"))
        assert simulator.stadium_state["gates"]["Gate B"]["flow_rate"] == 0
        asyncio.run(simulator.inject_incident("full_time"))
        assert simulator.stadium_state["exit_surge_active"] is True

def test_weather_refresh_logic():
    simulator.is_locked_to_replay = False
    simulator.sim_tick = 30
    simulator.last_weather_fetch_tick = 0
    with patch("backend.simulator.fetch_real_weather", return_value={
        "condition": "Thunderstorm", "temp": 20, "humidity": 90, "wind_speed": 45, "alerts": []
    }):
        asyncio.run(simulator._refresh_weather_if_due())
        assert simulator.last_weather_fetch_tick == 30
        assert simulator.stadium_state["weather_source"] == "live"
        assert any("Severe Weather" in inc.get("title", "") for inc in simulator.stadium_state["incidents"])

def test_tick_down_quota_limit():
    simulator.stadium_state["quota_limited"] = True
    simulator.stadium_state["quota_countdown"] = 10
    simulator._tick_down_quota_limit()
    assert simulator.stadium_state["quota_countdown"] == 6
    simulator.stadium_state["quota_countdown"] = 2
    simulator._tick_down_quota_limit()
    assert simulator.stadium_state["quota_limited"] is False

def test_advance_timestamp():
    simulator.sim_tick = 5
    simulator._advance_timestamp()
    assert simulator.stadium_state["timestamp"] == "19:20:00"

def test_update_match_narrative():
    simulator._update_match_narrative(1)
    assert simulator.stadium_state["match"]["time_label"] == "Pre-match"
    simulator._update_match_narrative(4)
    assert simulator.stadium_state["match"]["time_label"] == "15'"
    simulator._update_match_narrative(11)
    assert simulator.stadium_state["match"]["time_label"] == "Halftime"
    simulator._update_match_narrative(22)
    assert simulator.stadium_state["match"]["time_label"] == "85'"

def test_grow_gate_occupancy():
    simulator._grow_gate_occupancy(2)
    simulator._grow_gate_occupancy(8)
    simulator._grow_gate_occupancy(15)
    for g in ["Gate A", "Gate B", "Gate C", "Gate D"]:
        assert simulator.stadium_state["gates"][g]["occupancy"] >= 10
        assert simulator.stadium_state["gates"][g]["queue"] >= 1

def test_apply_scripted_weather():
    simulator.stadium_state["weather_source"] = "fallback"
    simulator.stadium_state["weather"]["alerts"] = []
    simulator._apply_scripted_weather(3)
    assert simulator.stadium_state["weather"]["condition"] == "Heavy Rain Warning"
    simulator._apply_scripted_weather(7)
    assert simulator.stadium_state["weather"]["condition"] == "Thunderstorm"

def test_inject_scripted_incidents():
    simulator.stadium_state["incidents"] = []
    simulator._inject_scripted_incidents(2)
    assert any(inc.get("type") == "metro_delay" for inc in simulator.stadium_state["incidents"])
    simulator._inject_scripted_incidents(5)
    assert any(inc.get("type") == "medical" for inc in simulator.stadium_state["incidents"])

def test_process_active_reroutes():
    simulator.stadium_state["active_reroutes"] = ["Gate B"]
    simulator.stadium_state["incidents"] = [{
        "id": "inc_fire_b",
        "type": "facility",
        "title": "fire alarm in B",
        "status": "active"
    }]
    for _ in range(50):
        simulator._process_active_reroutes()
    assert "Gate B" not in simulator.stadium_state["active_reroutes"]

def test_resolve_dispatched_incidents():
    simulator.stadium_state["shuttle_bus_active"] = True
    simulator.stadium_state["metro"]["delay_minutes"] = 10
    simulator.stadium_state["incidents"] = [{
        "id": "inc_metro_del",
        "type": "metro",
        "status": "active"
    }]
    simulator._resolve_dispatched_incidents()
    assert simulator.stadium_state["metro"]["delay_minutes"] == 0
    assert simulator.stadium_state["metro"]["status"] == "On Time"

def test_update_assets():
    simulator.stadium_state["active_reroutes"] = ["Gate A"]
    simulator.stadium_state["shuttle_bus_active"] = True
    simulator.stadium_state["medical_dispatch_active"] = True
    simulator.stadium_state["assets"] = []
    simulator.stadium_state["incidents"] = []
    simulator._update_assets()
    assert len(simulator.stadium_state["assets"]) > 0
    for _ in range(3):
        simulator._update_assets()
    assert any(a["status"] == "arrived" for a in simulator.stadium_state["assets"])

def test_check_sla_breaches():
    simulator.stadium_state["gates"]["Gate A"]["occupancy"] = 95
    simulator.stadium_state["incidents"] = []
    simulator._check_sla_breaches(1)
    for tick in range(2, 20):
        simulator._check_sla_breaches(tick)
    assert simulator.stadium_state["sla_breached"] is True
    assert any(inc.get("type") == "safety_sla" for inc in simulator.stadium_state["incidents"])

def test_simulate_step():
    with patch("backend.simulator.orchestrator_agent.orchestrate") as mock_orch:
        mock_summary = MagicMock()
        mock_summary.model_dump.return_value = {"summary": "operational summary"}
        mock_orch.return_value = mock_summary
        simulator.is_locked_to_replay = False
        asyncio.run(simulator.simulate_step())
        assert simulator.stadium_state["efficiency_score"] >= 40
        simulator.is_locked_to_replay = True
        asyncio.run(simulator.simulate_step())

def test_start_simulator_loop():
    with patch("asyncio.sleep", side_effect=asyncio.CancelledError):
        asyncio.run(simulator.start_simulator_loop())
