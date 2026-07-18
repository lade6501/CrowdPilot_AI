import json
import logging
import urllib.request
import os
from backend.simulator_constants import (
    SAFETY_IDX_CRITICAL,
    SAFETY_IDX_WARNING,
    SAFETY_IDX_NOMINAL,
    EFFICIENCY_BASELINE,
    EFFICIENCY_MIN,
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
