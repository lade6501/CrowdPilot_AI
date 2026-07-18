import asyncio
import json
import random
import logging
import time
import copy
from typing import List
from fastapi import WebSocket
from config import config, is_production
from agents.orchestrator import orchestrator_agent, get_mock_fallback_summary
from agents.agentic_core import agentic_manager
from simulator_constants import (
    WEATHER_REFRESH_INTERVAL,
    ADJACENT_GATE,
    REPLAY_PRESETS,
)
from simulator_helpers import (
    _compute_operational_metrics,
    _compute_efficiency_score,
    fetch_real_weather,
    _advance_timestamp,
    _update_match_narrative,
    _grow_gate_occupancy,
    _update_parking,
    _apply_scripted_weather,
    _inject_scripted_incidents,
    _clamp_gate_values,
)

logger = logging.getLogger("simulator")
logging.basicConfig(level=logging.INFO)

class ConnectionManager:
    """Manages active WebSocket connections for live simulation streaming."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        logger.info(f"Broadcasting event: {message.get('type')}")
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                disconnected.append(connection)
                
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

stadium_state: dict = {
    "mode": "live",
    "timestamp": "19:00:00",
    "match": {
        "teams": "USA vs Mexico",
        "score": "0 - 0",
        "time_label": "Pre-match",
        "detail": "Live tracking initialized. Warmups under progress."
    },
    "gates": {
        "Gate A": {"occupancy": 45, "queue": 5, "flow_rate": 12},
        "Gate B": {"occupancy": 70, "queue": 10, "flow_rate": 18},
        "Gate C": {"occupancy": 35, "queue": 3, "flow_rate": 8},
        "Gate D": {"occupancy": 40, "queue": 4, "flow_rate": 9}
    },
    "parking": {
        "Lot A": {"occupancy": 82, "capacity": 2000},
        "Lot B": {"occupancy": 70, "capacity": 1500},
        "Lot C": {"occupancy": 30, "capacity": 3000},
        "Lot D": {"occupancy": 20, "capacity": 2500}
    },
    "weather": {
        "condition": "Cloudy",
        "temp": 28,
        "humidity": 78,
        "wind_speed": 14,
        "alerts": []
    },
    "assets": [],
    "incidents": [
        {
            "id": "inc_initial_1",
            "timestamp": "18:45:00",
            "type": "parking_full",
            "title": "Lot A Near Capacity",
            "description": "Parking Lot A is at 82% capacity. Officers directing to Lot C.",
            "priority": "Medium",
            "status": "active"
        }
    ],
    "metro": {
        "status": "Delayed",
        "delay_minutes": 10,
        "line": "Line 2 (Stadium Express)"
    },
    "ai_ops_calls": 0
}

sim_tick = 0
is_locked_to_replay = False
live_state_backup = None
last_weather_fetch_tick = -999

async def trigger_ai_orchestration():
    """Triggers the background central orchestrator agent to run reasoning loop."""
    try:
        summary = await asyncio.to_thread(orchestrator_agent.orchestrate, stadium_state)
        stadium_state["ai_summary"] = summary.model_dump()
        stadium_state["ai_error"] = None
        stadium_state["quota_limited"] = False
        stadium_state["quota_countdown"] = 0
        logger.info("AI Orchestrator successfully synthesized current operational summary.")
    except Exception as e:
        logger.error(f"Error compiling AI orchestrations: {e}")
        err_str = str(e)
        
        summary = get_mock_fallback_summary(stadium_state)
        stadium_state["ai_summary"] = summary.model_dump()
        
        if "429" in err_str or "quota" in err_str.lower() or "limit" in err_str.lower():
            stadium_state["quota_limited"] = True
            stadium_state["quota_countdown"] = 30
            stadium_state["ai_error"] = None
            logger.info("AI Quota Limit triggered. Pre-computed fallback summary successfully generated.")
        else:
            stadium_state["ai_error"] = "AI reasoning temporarily unavailable — operating on fallback local models"
            stadium_state["quota_limited"] = False
            stadium_state["quota_countdown"] = 0

async def load_replay_preset(preset_name: str):
    """Loads a replay preset from predefined static data checkpoints."""
    global is_locked_to_replay, stadium_state, live_state_backup
    if preset_name in REPLAY_PRESETS:
        if not is_locked_to_replay:
            live_state_backup = copy.deepcopy(stadium_state)
            live_state_backup["tick"] = sim_tick

        is_locked_to_replay = True
        preset_data = REPLAY_PRESETS[preset_name]
        
        agentic_manager.reset_queue()
        
        stadium_state["mode"] = "replay"
        stadium_state["timestamp"] = preset_data["timestamp"]
        stadium_state["match"] = preset_data["match"]
        stadium_state["gates"] = copy.deepcopy(preset_data["gates"])
        stadium_state["parking"] = copy.deepcopy(preset_data["parking"])
        stadium_state["weather"] = copy.deepcopy(preset_data["weather"])
        stadium_state["incidents"] = copy.deepcopy(preset_data["incidents"])
        stadium_state["metro"] = copy.deepcopy(preset_data["metro"])
        
        await trigger_ai_orchestration()
        
        stadium_state["actions_queue"] = agentic_manager.get_actions()
        stadium_state["autonomy_level"] = agentic_manager.autonomy_level
        stadium_state["calibration_diff"] = agentic_manager.calibration_diff
        stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement
        
        await manager.broadcast({
            "type": "state_sync",
            "tick": preset_data["tick"],
            "state": stadium_state
        })

async def reset_simulator_to_live():
    """Resets simulator back to live execution and restores backed up live variables."""
    global is_locked_to_replay, stadium_state, live_state_backup, sim_tick
    is_locked_to_replay = False
    
    if live_state_backup:
        stadium_state["mode"] = "live"
        stadium_state["timestamp"] = live_state_backup["timestamp"]
        stadium_state["match"] = live_state_backup["match"]
        stadium_state["gates"] = live_state_backup["gates"]
        stadium_state["parking"] = live_state_backup["parking"]
        stadium_state["weather"] = live_state_backup["weather"]
        stadium_state["incidents"] = live_state_backup["incidents"]
        stadium_state["metro"] = live_state_backup["metro"]
        stadium_state["ai_summary"] = live_state_backup.get("ai_summary")
        stadium_state["ai_error"] = live_state_backup.get("ai_error")
        sim_tick = live_state_backup.get("tick", sim_tick)
        live_state_backup = None
    else:
        stadium_state["mode"] = "live"
        
    logger.info("Simulator returned to Live Feed mode.")
    
    agentic_manager.reset_queue()
    
    stadium_state["actions_queue"] = agentic_manager.get_actions()
    stadium_state["autonomy_level"] = agentic_manager.autonomy_level
    stadium_state["calibration_diff"] = agentic_manager.calibration_diff
    stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement

async def inject_incident(incident_type: str):
    """Simulates real-time operator manual incident injection."""
    logger.info(f"Injecting incident: {incident_type}")
    
    timestamp = stadium_state.get("timestamp", "20:00:00")
    inc_id = f"inc_injected_{random.randint(100, 999)}"
    
    new_inc = None
    if incident_type == "medical":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "medical",
            "title": "Medical Incident - Upper Bowl Sector 220",
            "description": "Spectator experiencing respiratory distress. Paramedics dispatched.",
            "priority": "Critical",
            "status": "active"
        }
    elif incident_type == "fire_alarm":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "facility",
            "title": "Fire Alarm Triggered - South Concourse Level 2",
            "description": "Smoke detector triggered. Initializing localized sector evacuation protocols.",
            "priority": "Critical",
            "status": "active"
        }
        stadium_state["gates"]["Gate B"]["occupancy"] = 98
        stadium_state["gates"]["Gate B"]["queue"] = 48
    elif incident_type == "metro_failure":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "metro",
            "title": "Metro Express Line 2 Power Failure",
            "description": "Total power failure. Grid down between Terminal and Stadium. Alternate shuttle buses required.",
            "priority": "Critical",
            "status": "active"
        }
        stadium_state["metro"]["status"] = "Stopped"
        stadium_state["metro"]["delay_minutes"] = 45
    elif incident_type == "storm_warning":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "weather",
            "title": "Severe Lightning Strike Warning",
            "description": "Lightning strikes detected within 5km radius. Safe evacuation shelter codes activated.",
            "priority": "High",
            "status": "active"
        }
        stadium_state["weather"]["condition"] = "Severe Lightning"
        stadium_state["weather"]["alerts"] = ["Severe Lightning Strike hazard. Keep concourse exits locked."]
    elif incident_type == "vip_arrival":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "facility",
            "title": "VIP Motorcade Transit Block",
            "description": "Dignitary arrival at East Plaza. Temporarily locking Gate B corridor paths for security clearance.",
            "priority": "High",
            "status": "active"
        }
        stadium_state["gates"]["Gate B"]["flow_rate"] = 0
    elif incident_type == "full_time":
        new_inc = {
            "id": inc_id,
            "timestamp": timestamp,
            "type": "match_event",
            "title": "FULL-TIME EXIT SURGE ACTIVATED",
            "description": "Final whistle blown. High-density egress surge cascading across all four gate corridors simultaneously.",
            "priority": "High",
            "status": "active"
        }
        stadium_state["match"]["time_label"] = "90'+4"
        stadium_state["match"]["detail"] = "Match Completed. Spectators exiting seat bowl in large waves."
        stadium_state["exit_surge_active"] = True
        
        for g_name in stadium_state["gates"]:
            stadium_state["gates"][g_name]["occupancy"] = random.randint(88, 94)
            stadium_state["gates"][g_name]["queue"] = random.randint(120, 160)
    
    if new_inc:
        stadium_state["incidents"].append(new_inc)
        
        await trigger_ai_orchestration()
        
        agentic_manager.perceive_telemetry(stadium_state, sim_tick)
        stadium_state["actions_queue"] = agentic_manager.get_actions()
        stadium_state["autonomy_level"] = agentic_manager.autonomy_level
        stadium_state["calibration_diff"] = agentic_manager.calibration_diff
        stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement
        
        await manager.broadcast({
            "type": "state_sync",
            "tick": sim_tick,
            "state": stadium_state
        })

async def _refresh_weather_if_due():
    """Triggers standard weather updates if refresh interval tick threshold is met."""
    global last_weather_fetch_tick
    if not is_locked_to_replay:
        has_manual_weather = any(
            inc.get("type") == "weather" and 
            "lightning" in inc.get("title", "").lower() and 
            inc.get("status") == "active" 
            for inc in stadium_state.get("incidents", [])
        )
        
        if not has_manual_weather and (sim_tick - last_weather_fetch_tick >= WEATHER_REFRESH_INTERVAL):
            last_weather_fetch_tick = sim_tick
            real_w = await asyncio.to_thread(fetch_real_weather)
            if real_w:
                stadium_state["weather"].update(real_w)
                stadium_state["weather_source"] = "live"
                
                condition = real_w["condition"].lower()
                wind = real_w["wind_speed"]
                if "thunderstorm" in condition or "storm" in condition or wind > 40:
                    weather_logged = any(
                        inc.get("type") == "weather" and 
                        inc.get("status") == "active" 
                        for inc in stadium_state.get("incidents", [])
                    )
                    if not weather_logged:
                        timestamp = time.strftime("%H:%M:%S")
                        stadium_state["incidents"].append({
                            "id": f"inc_weather_live_{sim_tick}",
                            "timestamp": timestamp,
                            "type": "weather",
                            "title": "Severe Weather Detected (Live API)",
                            "description": f"Live weather API reports {real_w['condition']} condition with {wind} km/h wind speeds. Activating safety checks.",
                            "priority": "High",
                            "status": "active"
                        })
                        agentic_manager.perceive_telemetry(stadium_state, sim_tick)
            else:
                stadium_state["weather_source"] = "fallback"

def _tick_down_quota_limit():
    """Ticks down API quota limit lockouts sequentially."""
    if stadium_state.get("quota_limited"):
        stadium_state["quota_countdown"] = max(0, stadium_state.get("quota_countdown", 30) - 4)
        if stadium_state["quota_countdown"] == 0:
            stadium_state["quota_limited"] = False


def _process_active_reroutes():
    """Calculates crowd diversion metrics for active AI reroutes."""
    active_reroutes = stadium_state.setdefault("active_reroutes", [])
    reroutes_to_keep = []
    
    for gate_name in active_reroutes:
        if gate_name in stadium_state["gates"]:
            stadium_state["gates"][gate_name]["occupancy"] -= random.randint(8, 14)
            stadium_state["gates"][gate_name]["queue"] -= random.randint(3, 7)
            
            target_alt = ADJACENT_GATE.get(gate_name, "Gate B")
            if target_alt in stadium_state["gates"]:
                stadium_state["gates"][target_alt]["occupancy"] += random.randint(2, 6)
                stadium_state["gates"][target_alt]["queue"] += random.randint(1, 3)
            
            if stadium_state["gates"][gate_name]["occupancy"] > 72:
                reroutes_to_keep.append(gate_name)
            else:
                logger.info(f"Rerouting completed: {gate_name} has stabilized.")
                if gate_name == "Gate B":
                    for inc in stadium_state["incidents"]:
                        if inc["type"] == "facility" and "fire" in inc["title"].lower():
                            inc["status"] = "resolved"
                            
    stadium_state["active_reroutes"] = reroutes_to_keep

def _resolve_dispatched_incidents():
    """Performs resolution state checks for safety resources."""
    if stadium_state.get("shuttle_bus_active"):
        stadium_state["metro"]["delay_minutes"] = max(0, stadium_state["metro"]["delay_minutes"] - 15)
        if stadium_state["metro"]["delay_minutes"] == 0:
            stadium_state["metro"]["status"] = "On Time"
            stadium_state["shuttle_bus_active"] = False
            for inc in stadium_state["incidents"]:
                if inc["type"] == "metro" or inc["type"] == "metro_delay":
                    inc["status"] = "resolved"

    if stadium_state.get("storm_shelter_active"):
        stadium_state["weather"]["condition"] = "Clear"
        stadium_state["weather"]["alerts"] = []
        stadium_state["storm_shelter_active"] = False
        for inc in stadium_state["incidents"]:
            if inc["type"] == "weather" or inc["type"] == "storm_warning":
                inc["status"] = "resolved"
                
    if stadium_state.get("medical_dispatch_active"):
        stadium_state["medical_dispatch_active"] = False
        for inc in stadium_state["incidents"]:
            if inc["type"] == "medical":
                inc["status"] = "resolved"

    if stadium_state.get("vip_clearance_active"):
        stadium_state["gates"]["Gate B"]["flow_rate"] = 18
        stadium_state["vip_clearance_active"] = False
        for inc in stadium_state["incidents"]:
            if inc["type"] == "facility" and "vip" in inc["title"].lower():
                inc["status"] = "resolved"

def _sync_agentic_state():
    """Syncs active autonomy parameters down to frontend layout objects."""
    stadium_state["actions_queue"] = agentic_manager.get_actions()
    stadium_state["autonomy_level"] = agentic_manager.autonomy_level
    stadium_state["calibration_diff"] = agentic_manager.calibration_diff
    stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement

def _update_assets():
    """Spawns and animates operational responders (medics, shuttles, stewards) on the map."""
    active_assets = stadium_state.setdefault("assets", [])
    active_reroutes = stadium_state.setdefault("active_reroutes", [])
    
    for gate_name in active_reroutes:
        asset_id = f"ast_steward_{gate_name.lower().replace(' ', '_')}"
        if not any(a["id"] == asset_id for a in active_assets):
            dest_coords = {"Gate A": (480, 100), "Gate B": (720, 210), "Gate C": (480, 320), "Gate D": (240, 210)}
            dest_x, dest_y = dest_coords.get(gate_name, (720, 210))
            active_assets.append({
                "id": asset_id,
                "type": "steward",
                "label": f"STEWARD-{gate_name[-1]}",
                "x": 480, "y": 210,
                "startX": 480, "startY": 210,
                "destX": dest_x, "destY": dest_y,
                "progress": 0.0,
                "status": "en route"
            })
        
    shuttle_active = stadium_state.get("shuttle_bus_active")
    if shuttle_active and not any(a["id"] == "ast_shuttle" for a in active_assets):
        active_assets.append({
            "id": "ast_shuttle",
            "type": "shuttle",
            "label": "BUS-8",
            "x": 700, "y": 380,
            "startX": 700, "startY": 380,
            "destX": 100, "destY": 350,
            "progress": 0.0,
            "status": "en route"
        })
        
    medic_active = stadium_state.get("medical_dispatch_active")
    if medic_active and not any(a["id"] == "ast_medic" for a in active_assets):
        active_assets.append({
            "id": "ast_medic",
            "type": "medic",
            "label": "MEDIC-3",
            "x": 400, "y": 70,
            "startX": 400, "startY": 70,
            "destX": 480, "destY": 170,
            "progress": 0.0,
            "status": "en route"
        })
        
    assets_to_keep = []
    for asset in active_assets:
        if asset["progress"] < 1.0:
            asset["progress"] = min(1.0, asset["progress"] + 0.34)
            asset["x"] = int(asset["startX"] + (asset["destX"] - asset["startX"]) * asset["progress"])
            asset["y"] = int(asset["startY"] + (asset["destY"] - asset["startY"]) * asset["progress"])
            
            if asset["progress"] >= 1.0:
                asset["status"] = "arrived"
                timestamp = time.strftime("%H:%M:%S")
                tracking_id = f"inc_arr_{asset['id']}_{sim_tick}"
                if not any(inc["id"] == tracking_id for inc in stadium_state["incidents"]):
                    stadium_state["incidents"].append({
                        "id": tracking_id,
                        "timestamp": timestamp,
                        "type": "asset_tracking",
                        "title": f"Asset {asset['label']} Arrived",
                        "description": f"Resource {asset['label']} has arrived at target destination.",
                        "priority": "Low",
                        "status": "resolved"
                    })
            assets_to_keep.append(asset)
        else:
            if asset.get("fading"):
                pass
            else:
                asset["fading"] = True
                assets_to_keep.append(asset)
                
    stadium_state["assets"] = assets_to_keep

def _check_sla_breaches(tick: int):
    """Monitors gates for safety SLA countdown timer triggers."""
    if "sla_countdowns" not in stadium_state:
        stadium_state["sla_countdowns"] = {}
        
    is_prod = is_production()
    tick_interval = config.SIMULATION_TICK_INTERVAL if config.SIMULATION_TICK_INTERVAL > 0 else (12 if is_prod else 8)
    sla_max = config.SLA_BREACH_THRESHOLD if config.SLA_BREACH_THRESHOLD > 0 else (60 if is_prod else 40)
    
    for gate_name, gate_data in stadium_state["gates"].items():
        if gate_data["occupancy"] >= 90:
            if gate_name not in stadium_state["sla_countdowns"]:
                stadium_state["sla_countdowns"][gate_name] = sla_max
            else:
                stadium_state["sla_countdowns"][gate_name] = max(0, stadium_state["sla_countdowns"][gate_name] - tick_interval)
                
            if stadium_state["sla_countdowns"][gate_name] == 0:
                breach_prefix = f"inc_sla_{gate_name.replace(' ', '_').lower()}"
                
                sla_logged = any(inc["id"].startswith(breach_prefix) and inc["status"] == "active" for inc in stadium_state["incidents"])
                if not sla_logged:
                    stadium_state["sla_breached"] = True
                    timestamp = time.strftime("%H:%M:%S")
                    stadium_state["incidents"].append({
                        "id": f"{breach_prefix}_{tick}",
                        "timestamp": timestamp,
                        "type": "safety_sla",
                        "title": f"SAFETY SLA BREACH: {gate_name.upper()} OVERLOADED",
                        "description": f"{gate_name} occupancy exceeded 90% threshold for over 20s without mitigation completion. SLA breached.",
                        "priority": "Critical",
                        "status": "active"
                    })

                    for action in agentic_manager.actions_queue:
                        if action["target_metric"] == f"gates.{gate_name}.occupancy" and action["status"] == "pending":
                            action["risk_level"] = "High"
                            action["governance_check"] = "failed"
                            action["governance_details"] = "ESCALATED DUE TO SLA BREACH: Autonomy overridden. Safety lock requires Operator manual bypass."
        else:
            if gate_name in stadium_state["sla_countdowns"]:
                del stadium_state["sla_countdowns"][gate_name]
                
            breach_prefix = f"inc_sla_{gate_name.replace(' ', '_').lower()}"
            for inc in stadium_state["incidents"]:
                if inc.get("id", "").startswith(breach_prefix) and inc.get("status") == "active":
                    inc["status"] = "resolved"
                    logger.info(f"Safety SLA Breach marked as resolved ({gate_name} telemetry stabilized).")
                    
    if len(stadium_state["sla_countdowns"]) == 0:
        stadium_state["sla_breached"] = False

async def simulate_step():
    """Main orchestrator for sequential simulation loop tasks."""
    global sim_tick, is_locked_to_replay
    await _refresh_weather_if_due()
    _tick_down_quota_limit()
    
    if is_locked_to_replay:
        return
        
    sim_tick += 1
    
    _advance_timestamp(stadium_state, sim_tick)
    _update_match_narrative(stadium_state, sim_tick)
    _grow_gate_occupancy(stadium_state, sim_tick)
    _update_parking(stadium_state)
    _apply_scripted_weather(stadium_state, sim_tick)
    _inject_scripted_incidents(stadium_state, sim_tick)
    _process_active_reroutes()
    _resolve_dispatched_incidents()
    
    agentic_manager.perceive_telemetry(stadium_state, sim_tick)
    agentic_manager.verify_action_results(stadium_state, sim_tick)
    
    _sync_agentic_state()
    _update_assets()
    _check_sla_breaches(sim_tick)
    _clamp_gate_values(stadium_state)
    
    safety_idx, overall_status = _compute_operational_metrics(stadium_state["gates"], stadium_state["incidents"])
    stadium_state["safety_index"] = safety_idx
    stadium_state["overall_status"] = overall_status
    stadium_state["efficiency_score"] = _compute_efficiency_score(stadium_state["gates"], stadium_state.get("metro", {}).get("delay_minutes", 0))
    
    await manager.broadcast({
        "type": "state_sync",
        "tick": sim_tick,
        "state": stadium_state
    })

async def start_simulator_loop():
    """Starts the persistent background simulation loop process."""
    logger.info("Simulator loop started.")
    is_prod = is_production()
    tick_interval = float(config.SIMULATION_TICK_INTERVAL) if config.SIMULATION_TICK_INTERVAL > 0 else (12.0 if is_prod else 4.0)
    logger.info(f"Running simulation with interval: {tick_interval}s")
    while True:
        try:
            await asyncio.sleep(tick_interval)
            await simulate_step()
        except asyncio.CancelledError:
            logger.info("Simulator loop stopped.")
            break
        except Exception as e:
            logger.error(f"Error in simulator loop: {e}", exc_info=True)
            await asyncio.sleep(5.0)