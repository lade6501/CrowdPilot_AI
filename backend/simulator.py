import asyncio
import json
import random
import logging
import time
from typing import List, Dict, Any

logger = logging.getLogger("simulator")
logging.basicConfig(level=logging.INFO)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Any] = []

    async def connect(self, websocket: Any):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: Any):
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


REPLAY_PRESETS = {
    "7:00 PM": {
        "tick": 1,
        "mode": "replay",
        "timestamp": "19:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "Pre-match",
            "detail": "Warm-ups underway. Stadium gates opening."
        },
        "gates": {
            "Gate A": {"occupancy": 25, "queue": 2, "flow_rate": 6},
            "Gate B": {"occupancy": 30, "queue": 3, "flow_rate": 8},
            "Gate C": {"occupancy": 15, "queue": 1, "flow_rate": 4},
            "Gate D": {"occupancy": 18, "queue": 1, "flow_rate": 5}
        },
        "parking": {
            "Lot A": {"occupancy": 45, "capacity": 2000},
            "Lot B": {"occupancy": 30, "capacity": 1500},
            "Lot C": {"occupancy": 15, "capacity": 3000},
            "Lot D": {"occupancy": 10, "capacity": 2500}
        },
        "weather": {
            "condition": "Clear",
            "temp": 28,
            "humidity": 70,
            "wind_speed": 10,
            "alerts": []
        },
        "incidents": [],
        "metro": {
            "status": "On Time",
            "delay_minutes": 0,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "7:30 PM": {
        "tick": 5,
        "mode": "replay",
        "timestamp": "19:30:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "15'",
            "detail": "First half underway. Steady spectator inflow."
        },
        "gates": {
            "Gate A": {"occupancy": 55, "queue": 8, "flow_rate": 14},
            "Gate B": {"occupancy": 75, "queue": 14, "flow_rate": 18},
            "Gate C": {"occupancy": 40, "queue": 5, "flow_rate": 10},
            "Gate D": {"occupancy": 45, "queue": 6, "flow_rate": 11}
        },
        "parking": {
            "Lot A": {"occupancy": 78, "capacity": 2000},
            "Lot B": {"occupancy": 62, "capacity": 1500},
            "Lot C": {"occupancy": 35, "capacity": 3000},
            "Lot D": {"occupancy": 22, "capacity": 2500}
        },
        "weather": {
            "condition": "Cloudy",
            "temp": 27,
            "humidity": 75,
            "wind_speed": 12,
            "alerts": []
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 78% capacity. Safety officers redirecting flows.",
                "priority": "Medium",
                "status": "active"
            }
        ],
        "metro": {
            "status": "On Time",
            "delay_minutes": 0,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "8:00 PM": {
        "tick": 10,
        "mode": "replay",
        "timestamp": "20:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "1 - 0",
            "time_label": "Halftime",
            "detail": "USA scores! Halftime surge inside concourses."
        },
        "gates": {
            "Gate A": {"occupancy": 68, "queue": 12, "flow_rate": 15},
            "Gate B": {"occupancy": 92, "queue": 28, "flow_rate": 20},
            "Gate C": {"occupancy": 44, "queue": 6, "flow_rate": 11},
            "Gate D": {"occupancy": 48, "queue": 7, "flow_rate": 12}
        },
        "parking": {
            "Lot A": {"occupancy": 96, "capacity": 2000},
            "Lot B": {"occupancy": 88, "capacity": 1500},
            "Lot C": {"occupancy": 45, "capacity": 3000},
            "Lot D": {"occupancy": 30, "capacity": 2500}
        },
        "weather": {
            "condition": "Heavy Rain Warning",
            "temp": 25,
            "humidity": 90,
            "wind_speed": 22,
            "alerts": ["Heavy rain expected in 12 minutes"]
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 96% capacity. Redirecting to Lot C.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_metro_1",
                "timestamp": "19:54:10",
                "type": "metro_delay",
                "title": "Metro Line 2 Delays",
                "description": "Metro Line 2 experiencing a 10-minute signal delay at University Station.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_med_1",
                "timestamp": "19:56:45",
                "type": "medical",
                "title": "Medical Incident - Section 104",
                "description": "Spectator fainted in Section 104 due to heat. First aid team dispatched.",
                "priority": "Critical",
                "status": "active"
            }
        ],
        "metro": {
            "status": "Delayed",
            "delay_minutes": 10,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "9:00 PM": {
        "tick": 15,
        "mode": "replay",
        "timestamp": "21:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "2 - 1",
            "time_label": "85'",
            "detail": "Tense final minutes! Early exiting flows starting."
        },
        "gates": {
            "Gate A": {"occupancy": 12, "queue": 1, "flow_rate": 2},
            "Gate B": {"occupancy": 15, "queue": 1, "flow_rate": 3},
            "Gate C": {"occupancy": 10, "queue": 1, "flow_rate": 1},
            "Gate D": {"occupancy": 12, "queue": 1, "flow_rate": 2}
        },
        "parking": {
            "Lot A": {"occupancy": 96, "capacity": 2000},
            "Lot B": {"occupancy": 90, "capacity": 1500},
            "Lot C": {"occupancy": 50, "capacity": 3000},
            "Lot D": {"occupancy": 32, "capacity": 2500}
        },
        "weather": {
            "condition": "Thunderstorm",
            "temp": 23,
            "humidity": 95,
            "wind_speed": 28,
            "alerts": ["Severe thunderstorm overhead. Seek shelter inside concourses."]
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 96% capacity.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_metro_1",
                "timestamp": "19:54:10",
                "type": "metro_delay",
                "title": "Metro Line 2 Delays",
                "description": "Metro Line 2 experiencing a 12-minute signal delay.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_child_1",
                "timestamp": "20:48:22",
                "type": "lost_child",
                "title": "Lost Child - West Concourse",
                "description": "7-year-old child wearing a blue Colombia jersey separated near Gate C.",
                "priority": "Critical",
                "status": "active"
            }
        ],
        "metro": {
            "status": "Delayed",
            "delay_minutes": 12,
            "line": "Line 2 (Stadium Express)"
        }
    }
}


stadium_state: Dict[str, Any] = {
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

WEATHER_REFRESH_INTERVAL = 15
last_weather_fetch_tick = -999

def fetch_real_weather():
    import urllib.request
    import urllib.parse
    import os
    
    lat, lon = 25.9580, -80.2389
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key:
        return None
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        req = urllib.request.Request(url, headers={'User-Agent': 'CrowdPilot Stadium Admin'})
        with urllib.request.urlopen(req, timeout=5.0) as response:
            data = json.loads(response.read().decode('utf-8'))
            return {
                "condition": data["weather"][0]["main"],
                "temp": round(data["main"]["temp"]),
                "humidity": data["main"]["humidity"],
                "wind_speed": round(data["wind"]["speed"] * 3.6),
                "alerts": []
            }
    except Exception as e:
        logger.error(f"Weather API fetch failed: {e}")
        return None

async def trigger_ai_orchestration():
    try:
        from backend.agents.orchestrator import orchestrator_agent
        summary = await asyncio.to_thread(orchestrator_agent.orchestrate, stadium_state)
        stadium_state["ai_summary"] = summary.model_dump()
        stadium_state["ai_error"] = None
        stadium_state["quota_limited"] = False
        stadium_state["quota_countdown"] = 0
        logger.info("AI Orchestrator successfully synthesized current operational summary.")
    except Exception as e:
        logger.error(f"Error compiling AI orchestrations: {e}")
        err_str = str(e)
        

        from backend.agents.orchestrator import get_mock_fallback_summary
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
    global is_locked_to_replay, stadium_state, live_state_backup
    if preset_name in REPLAY_PRESETS:
        if not is_locked_to_replay:

            live_state_backup = json.loads(json.dumps(stadium_state))
            live_state_backup["tick"] = sim_tick

        is_locked_to_replay = True
        preset_data = REPLAY_PRESETS[preset_name]
        

        from backend.agents.agentic_core import agentic_manager
        agentic_manager.reset_queue()
        

        stadium_state["mode"] = "replay"
        stadium_state["timestamp"] = preset_data["timestamp"]
        stadium_state["match"] = preset_data["match"]
        stadium_state["gates"] = json.loads(json.dumps(preset_data["gates"]))
        stadium_state["parking"] = json.loads(json.dumps(preset_data["parking"]))
        stadium_state["weather"] = json.loads(json.dumps(preset_data["weather"]))
        stadium_state["incidents"] = json.loads(json.dumps(preset_data["incidents"]))
        stadium_state["metro"] = json.loads(json.dumps(preset_data["metro"]))
        

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
    

    from backend.agents.agentic_core import agentic_manager
    agentic_manager.reset_queue()
    

    stadium_state["actions_queue"] = agentic_manager.get_actions()
    stadium_state["autonomy_level"] = agentic_manager.autonomy_level
    stadium_state["calibration_diff"] = agentic_manager.calibration_diff
    stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement

async def inject_incident(incident_type: str):
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
        

        from backend.agents.agentic_core import agentic_manager
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

async def simulate_step():
    global sim_tick, is_locked_to_replay, last_weather_fetch_tick
    
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
                        from backend.agents.agentic_core import agentic_manager
                        agentic_manager.perceive_telemetry(stadium_state, sim_tick)
            else:
                stadium_state["weather_source"] = "fallback"

    if stadium_state.get("quota_limited"):
        stadium_state["quota_countdown"] = max(0, stadium_state.get("quota_countdown", 30) - 4)
        if stadium_state["quota_countdown"] == 0:
            stadium_state["quota_limited"] = False

    if is_locked_to_replay:
        return

    sim_tick += 1
    events_generated = []
    

    h = 19 + (sim_tick * 4) // 60
    m = (sim_tick * 4) % 60
    stadium_state["timestamp"] = f"{h:02d}:{m:02d}:00"
    

    if sim_tick == 1:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "Pre-match",
            "detail": "Inflow starting. Spectators moving past parking gates."
        }
    elif sim_tick == 4:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "15'",
            "detail": "Kickoff commenced. High entry gate volumes."
        }
    elif sim_tick == 11:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "1 - 0",
            "time_label": "Halftime",
            "detail": "USA Scores! Spectators flooding concession grids."
        }
    elif sim_tick == 22:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "2 - 1",
            "time_label": "85'",
            "detail": "Tense match climax. Early exit crowd preparation."
        }



    lots = stadium_state.get("parking", {})
    if lots:
        avg_parking_occ = sum(lot["occupancy"] for lot in lots.values()) / len(lots)
        parking_influx = 1.0 + (avg_parking_occ / 200.0)
    else:
        parking_influx = 1.0

    if 1 <= sim_tick <= 6:
        stadium_state["gates"]["Gate A"]["occupancy"] += int(random.randint(1, 4) * parking_influx)
        stadium_state["gates"]["Gate A"]["queue"] += int(random.randint(1, 3) * parking_influx)
    elif 7 <= sim_tick <= 12:
        stadium_state["gates"]["Gate B"]["occupancy"] += int(random.randint(1, 3) * parking_influx)
        stadium_state["gates"]["Gate B"]["queue"] += int(random.randint(1, 2) * parking_influx)
        stadium_state["gates"]["Gate C"]["occupancy"] += int(random.randint(1, 3) * parking_influx)
        stadium_state["gates"]["Gate C"]["queue"] += int(random.randint(1, 2) * parking_influx)
    elif 13 <= sim_tick <= 20:
        stadium_state["gates"]["Gate D"]["occupancy"] += int(random.randint(1, 4) * parking_influx)
        stadium_state["gates"]["Gate D"]["queue"] += int(random.randint(1, 3) * parking_influx)

    for gate in ["Gate A", "Gate B", "Gate C", "Gate D"]:
        stadium_state["gates"][gate]["occupancy"] += int(random.randint(-1, 2) * parking_influx)
        stadium_state["gates"][gate]["queue"] += int(random.randint(-1, 1) * parking_influx)

        stadium_state["gates"][gate]["occupancy"] = max(10, min(98, stadium_state["gates"][gate]["occupancy"]))
        stadium_state["gates"][gate]["queue"] = max(1, min(45, stadium_state["gates"][gate]["queue"]))

    stadium_state["parking"]["Lot A"]["occupancy"] = min(100, stadium_state["parking"]["Lot A"]["occupancy"] + random.randint(0, 1))
    stadium_state["parking"]["Lot B"]["occupancy"] = min(100, stadium_state["parking"]["Lot B"]["occupancy"] + random.randint(0, 1))


    if stadium_state.get("weather_source") != "live":
        if sim_tick == 3:
            stadium_state["weather"]["condition"] = "Heavy Rain Warning"
            stadium_state["weather"]["alerts"].append("Heavy rain expected in 12 minutes")
        elif sim_tick == 7:
            stadium_state["weather"]["condition"] = "Thunderstorm"
            stadium_state["weather"]["alerts"] = ["Severe thunderstorm overhead. Seek shelter inside concourses."]


    if sim_tick == 2:
        new_inc = {
            "id": f"inc_{sim_tick}",
            "timestamp": stadium_state["timestamp"],
            "type": "metro_delay",
            "title": "Metro Line 2 Delays",
            "description": "Metro Line 2 experiencing a 10-minute signal delay at University Station.",
            "priority": "Medium",
            "status": "active"
        }
        stadium_state["incidents"].append(new_inc)
        
    elif sim_tick == 5:
        new_inc = {
            "id": f"inc_{sim_tick}",
            "timestamp": stadium_state["timestamp"],
            "type": "medical",
            "title": "Medical Incident - Section 104",
            "description": "Spectator fainted in Section 104. First aid team dispatched.",
            "priority": "Critical",
            "status": "active"
        }
        stadium_state["incidents"].append(new_inc)


    active_reroutes = stadium_state.setdefault("active_reroutes", [])
    reroutes_to_keep = []
    
    for gate_name in active_reroutes:
        if gate_name in stadium_state["gates"]:

            stadium_state["gates"][gate_name]["occupancy"] -= random.randint(8, 14)
            stadium_state["gates"][gate_name]["queue"] -= random.randint(3, 7)
            

            target_alt = "Gate D" if gate_name == "Gate B" else ("Gate B" if gate_name == "Gate A" else ("Gate D" if gate_name == "Gate C" else "Gate B"))
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


    from backend.agents.agentic_core import agentic_manager
    agentic_manager.perceive_telemetry(stadium_state, sim_tick)
    agentic_manager.verify_action_results(stadium_state, sim_tick)


    stadium_state["actions_queue"] = agentic_manager.get_actions()
    stadium_state["autonomy_level"] = agentic_manager.autonomy_level
    stadium_state["calibration_diff"] = agentic_manager.calibration_diff
    stadium_state["auto_draft_announcement"] = agentic_manager.auto_draft_announcement


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

                stadium_state["incidents"].append({
                    "id": f"inc_arr_{asset['id']}",
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


    if "sla_countdowns" not in stadium_state:
        stadium_state["sla_countdowns"] = {}
        
    any_breach = False
    
    for gate_name, gate_data in stadium_state["gates"].items():
        if gate_data["occupancy"] >= 90:
            if gate_name not in stadium_state["sla_countdowns"]:
                stadium_state["sla_countdowns"][gate_name] = 20
            else:
                stadium_state["sla_countdowns"][gate_name] = max(0, stadium_state["sla_countdowns"][gate_name] - 4)
                
            if stadium_state["sla_countdowns"][gate_name] == 0:
                any_breach = True
                breach_id = f"inc_sla_{gate_name.replace(' ', '_').lower()}"
                

                sla_logged = any(inc["id"] == breach_id and inc["status"] == "active" for inc in stadium_state["incidents"])
                if not sla_logged:
                    stadium_state["sla_breached"] = True
                    timestamp = time.strftime("%H:%M:%S")
                    stadium_state["incidents"].append({
                        "id": breach_id,
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
                
            breach_id = f"inc_sla_{gate_name.replace(' ', '_').lower()}"
            for inc in stadium_state["incidents"]:
                if inc.get("id") == breach_id and inc.get("status") == "active":
                    inc["status"] = "resolved"
                    logger.info(f"Safety SLA Breach marked as resolved ({gate_name} telemetry stabilized).")
                    
    if len(stadium_state["sla_countdowns"]) == 0:
        stadium_state["sla_breached"] = False
        

    gates_dict = stadium_state.get("gates", {})
    for g_name, g_data in gates_dict.items():
        g_data["occupancy"] = max(0, min(100, g_data["occupancy"]))
        g_data["queue"] = max(0, g_data["queue"])

    incidents_list = stadium_state.get("incidents", [])
    

    critical_gates_count = sum(1 for g in gates_dict.values() if g.get("occupancy", 0) >= 90)
    

    safety_idx = 9.8
    if critical_gates_count >= 2:
        safety_idx = 5.2
    elif critical_gates_count == 1:
        safety_idx = 7.2
    else:

        active_critical_inc = any(inc.get("status") == "active" and inc.get("priority") == "Critical" for inc in incidents_list)
        active_high_inc = any(inc.get("status") == "active" and inc.get("priority") == "High" for inc in incidents_list)
        if active_critical_inc:
            safety_idx = 5.2
        elif active_high_inc:
            safety_idx = 7.5
            

    efficiency_scr = 92
    metro_delay = stadium_state.get("metro", {}).get("delay_minutes", 0)
    if metro_delay > 0:
        efficiency_scr -= min(25, int(metro_delay * 0.5))
        
    avg_queue = sum(g.get("queue", 0) for g in gates_dict.values()) / len(gates_dict) if gates_dict else 0
    efficiency_scr -= min(20, int(avg_queue * 0.6))
    efficiency_scr = max(40, efficiency_scr)
    

    overall_status = "normal"
    if critical_gates_count >= 2:
        overall_status = "critical"
    elif critical_gates_count == 1:
        overall_status = "warning"
    else:

        active_critical_inc = any(inc.get("status") == "active" and inc.get("priority") == "Critical" for inc in incidents_list)
        active_high_inc = any(inc.get("status") == "active" and inc.get("priority") == "High" for inc in incidents_list)
        if active_critical_inc:
            overall_status = "critical"
        elif active_high_inc:
            overall_status = "warning"
            
    stadium_state["overall_status"] = overall_status
    stadium_state["safety_index"] = safety_idx
    stadium_state["efficiency_score"] = efficiency_scr


    await manager.broadcast({
        "type": "state_sync",
        "tick": sim_tick,
        "state": stadium_state
    })

async def start_simulator_loop():
    logger.info("Simulator loop started.")
    while True:
        try:
            await asyncio.sleep(4.0)
            await simulate_step()
        except asyncio.CancelledError:
            logger.info("Simulator loop stopped.")
            break
        except Exception as e:
            logger.error(f"Error in simulator loop: {e}", exc_info=True)
            await asyncio.sleep(5.0)