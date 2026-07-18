import json
import logging
import urllib.request
import os
import random
from backend.simulator_constants import (
    SAFETY_IDX_CRITICAL,
    SAFETY_IDX_WARNING,
    SAFETY_IDX_NOMINAL,
    EFFICIENCY_BASELINE,
    EFFICIENCY_MIN,
    KICKOFF_TICK,
    HALFTIME_TICK,
    LATE_MATCH_TICK,
    GATE_OCCUPANCY_MIN,
    GATE_OCCUPANCY_MAX,
)

logger = logging.getLogger("simulator_helpers")

def _compute_operational_metrics(gates_dict: dict, incidents_list: list) -> tuple[float, str]:
    """
    Computes overall safety rating and status tier for the stadium.
    
    Args:
        gates_dict: Dictionary containing gates and their current occupancies.
        incidents_list: List of active incidents in progress.
        
    Returns:
        A tuple of (safety_index, overall_status).
    """
    critical_gates_count = sum(1 for g in gates_dict.values() if g.get("occupancy", 0) >= 90)
    active_critical_inc = any(
        inc.get("status") == "active" and inc.get("priority") == "Critical"
        for inc in incidents_list
    )
    active_high_inc = any(
        inc.get("status") == "active" and inc.get("priority") == "High"
        for inc in incidents_list
    )

    if critical_gates_count >= 2:
        safety_idx, overall_status = SAFETY_IDX_CRITICAL, "critical"
    elif critical_gates_count == 1:
        safety_idx, overall_status = SAFETY_IDX_WARNING, "warning"
    elif active_critical_inc:
        safety_idx, overall_status = SAFETY_IDX_CRITICAL, "critical"
    elif active_high_inc:
        safety_idx, overall_status = 7.5, "warning"
    else:
        safety_idx, overall_status = SAFETY_IDX_NOMINAL, "normal"
    return safety_idx, overall_status

def _compute_efficiency_score(gates_dict: dict, metro_delay: int) -> int:
    """
    Calculates operational flow efficiency index.
    
    Args:
        gates_dict: Current stadium gate metrics database.
        metro_delay: Delays registered on stadium metro express line.
        
    Returns:
        Calculated efficiency score clamped to baselines.
    """
    efficiency_scr = EFFICIENCY_BASELINE
    if metro_delay > 0:
        efficiency_scr -= min(25, int(metro_delay * 0.5))
        
    avg_queue = sum(g.get("queue", 0) for g in gates_dict.values()) / len(gates_dict) if gates_dict else 0
    efficiency_scr -= min(20, int(avg_queue * 0.6))
    return max(EFFICIENCY_MIN, efficiency_scr)

def fetch_real_weather() -> dict | None:
    """
    Fetches real-time weather alerts near stadium coordinates.
    
    Returns:
        Weather info mapping if successful, otherwise None.
    """
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

def _advance_timestamp(stadium_state: dict, sim_tick: int):
    """Calculates active simulation clocks based on ticks."""
    h = 19 + (sim_tick * 4) // 60
    m = (sim_tick * 4) % 60
    stadium_state["timestamp"] = f"{h:02d}:{m:02d}:00"

def _update_match_narrative(stadium_state: dict, tick: int):
    """Updates active team score and commentary details for milestones."""
    if tick == 1:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "Pre-match",
            "detail": "Inflow starting. Spectators moving past parking gates."
        }
    elif tick == KICKOFF_TICK:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "15'",
            "detail": "Kickoff commenced. High entry gate volumes."
        }
    elif tick == HALFTIME_TICK:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "1 - 0",
            "time_label": "Halftime",
            "detail": "USA Scores! Spectators flooding concession grids."
        }
    elif tick == LATE_MATCH_TICK:
        stadium_state["match"] = {
            "teams": "USA vs Mexico",
            "score": "2 - 1",
            "time_label": "85'",
            "detail": "Tense match climax. Early exit crowd preparation."
        }

def _grow_gate_occupancy(stadium_state: dict, tick: int):
    """Simulates automatic gate spectator flow rates based on parking capacity influx."""
    lots = stadium_state.get("parking", {})
    if lots:
        avg_parking_occ = sum(lot["occupancy"] for lot in lots.values()) / len(lots)
        parking_influx = 1.0 + (avg_parking_occ / 200.0)
    else:
        parking_influx = 1.0

    if 1 <= tick <= 6:
        stadium_state["gates"]["Gate A"]["occupancy"] += int(random.randint(1, 4) * parking_influx)
        stadium_state["gates"]["Gate A"]["queue"] += int(random.randint(1, 3) * parking_influx)
    elif 7 <= tick <= 12:
        stadium_state["gates"]["Gate B"]["occupancy"] += int(random.randint(1, 3) * parking_influx)
        stadium_state["gates"]["Gate B"]["queue"] += int(random.randint(1, 2) * parking_influx)
        stadium_state["gates"]["Gate C"]["occupancy"] += int(random.randint(1, 3) * parking_influx)
        stadium_state["gates"]["Gate C"]["queue"] += int(random.randint(1, 2) * parking_influx)
    elif 13 <= tick <= 20:
        stadium_state["gates"]["Gate D"]["occupancy"] += int(random.randint(1, 4) * parking_influx)
        stadium_state["gates"]["Gate D"]["queue"] += int(random.randint(1, 3) * parking_influx)

    for gate in ["Gate A", "Gate B", "Gate C", "Gate D"]:
        stadium_state["gates"][gate]["occupancy"] += int(random.randint(-1, 2) * parking_influx)
        stadium_state["gates"][gate]["queue"] += int(random.randint(-1, 1) * parking_influx)

        stadium_state["gates"][gate]["occupancy"] = max(GATE_OCCUPANCY_MIN, min(GATE_OCCUPANCY_MAX, stadium_state["gates"][gate]["occupancy"]))
        stadium_state["gates"][gate]["queue"] = max(1, min(45, stadium_state["gates"][gate]["queue"]))

def _update_parking(stadium_state: dict):
    """Simulates parking lots load increases."""
    stadium_state["parking"]["Lot A"]["occupancy"] = min(100, stadium_state["parking"]["Lot A"]["occupancy"] + random.randint(0, 1))
    stadium_state["parking"]["Lot B"]["occupancy"] = min(100, stadium_state["parking"]["Lot B"]["occupancy"] + random.randint(0, 1))

def _apply_scripted_weather(stadium_state: dict, tick: int):
    """Simulates scripted fallback weather conditions."""
    if stadium_state.get("weather_source") != "live":
        if tick == 3:
            stadium_state["weather"]["condition"] = "Heavy Rain Warning"
            stadium_state["weather"]["alerts"].append("Heavy rain expected in 12 minutes")
        elif tick == 7:
            stadium_state["weather"]["condition"] = "Thunderstorm"
            stadium_state["weather"]["alerts"] = ["Severe thunderstorm overhead. Seek shelter inside concourses."]

def _inject_scripted_incidents(stadium_state: dict, tick: int):
    """Simulates scripted incident events timeline triggers."""
    if tick == 2:
        new_inc = {
            "id": f"inc_{tick}",
            "timestamp": stadium_state["timestamp"],
            "type": "metro_delay",
            "title": "Metro Line 2 Delays",
            "description": "Metro Line 2 experiencing a 10-minute signal delay at University Station.",
            "priority": "Medium",
            "status": "active"
        }
        stadium_state["incidents"].append(new_inc)
    elif tick == 5:
        new_inc = {
            "id": f"inc_{tick}",
            "timestamp": stadium_state["timestamp"],
            "type": "medical",
            "title": "Medical Incident - Section 104",
            "description": "Spectator fainted in Section 104. First aid team dispatched.",
            "priority": "Critical",
            "status": "active"
        }
        stadium_state["incidents"].append(new_inc)

def _clamp_gate_values(stadium_state: dict):
    """Clamps occupancy levels and queue metrics to stadium physical limitations."""
    gates_dict = stadium_state.get("gates", {})
    for g_data in gates_dict.values():
        g_data["occupancy"] = max(0, min(100, g_data["occupancy"]))
        g_data["queue"] = max(0, g_data["queue"])
