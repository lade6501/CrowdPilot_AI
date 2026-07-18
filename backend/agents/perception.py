import logging
from backend.agents.agent_constants import (
    CONFIDENCE_GATE_A,
    CONFIDENCE_GATE_B,
    CONFIDENCE_DEFAULT,
    CONFIDENCE_THRESHOLD_LOW,
    PARKING_AVG_THRESHOLD,
    PARKING_LOT_CRITICAL_THRESHOLD,
)

logger = logging.getLogger("agentic_core.perception")

def perceive_telemetry(manager, stadium_state: dict, current_tick: int):
    from backend.agents.agentic_core import get_best_detour_gate

    for gate_name, gate_data in stadium_state["gates"].items():
        gate_load = gate_data["occupancy"]
        if gate_load >= 90:
            gate_proposed = any(a["target_metric"] == f"gates.{gate_name}.occupancy" and a["status"] in ["review", "pending"] for a in manager.actions_queue)
            if not gate_proposed:
                is_fire_active = any(inc["type"] == "fire_alarm" and inc["status"] == "active" for inc in stadium_state["incidents"])
                
                if gate_name == "Gate B" and is_fire_active:
                    manager.trigger_scripted_disagreement()
                else:
                    confidence = CONFIDENCE_GATE_B if gate_name == "Gate B" else (CONFIDENCE_GATE_A if gate_name == "Gate A" else CONFIDENCE_DEFAULT)
                    confidence_flag = "Low Confidence" if confidence < CONFIDENCE_THRESHOLD_LOW else "Normal Confidence"
                    
                    manager.add_action_to_queue({
                        "proposer": "Crowd Flow Agent",
                        "why": f"{gate_name} load reached {gate_load}% (critical bottleneck risk) [{confidence_flag} - High incoming flow variance]",
                        "action": f"Reroute incoming traffic from {gate_name} to adjacent entrances. Deploy digital directional signage.",
                        "risk_level": "Medium",
                        "target_metric": f"gates.{gate_name}.occupancy",
                        "initial_value": gate_load
                    })
                    
                    target_spillover = get_best_detour_gate(gate_name, stadium_state["gates"])
                    manager.add_action_to_queue({
                        "proposer": "Crowd Flow Agent",
                        "why": f"{target_spillover} predicted to reach 85% in 3 min due to {gate_name} overflow (cascade spillover prediction)",
                        "action": f"Pre-position Steward Team 5 at {target_spillover} corridor access points to prepare for redirected spectator waves.",
                        "risk_level": "Low",
                        "target_metric": f"gates.{target_spillover}.occupancy",
                        "initial_value": stadium_state["gates"][target_spillover]["occupancy"]
                    })
                    
                    manager.auto_draft_announcement = {
                        "situation": f"{gate_name} occupancy is critical ({gate_load}%). All fans are redirected to adjacent gates immediately.",
                        "audience": "General Public",
                        "tone": "Calm"
                    }
                    logger.info(f"Comms Agent handoff completed for {gate_name}. PA draft notification staged.")

    for inc in stadium_state["incidents"]:
        if inc["status"] == "active":
            inc_id = inc["id"]
            inc_proposed = any(inc_id in a["why"] for a in manager.actions_queue)
            if not inc_proposed:
                if inc["type"] == "medical":
                    manager.add_action_to_queue({
                        "proposer": "Incident Response Agent",
                        "why": f"Medical alert reported: {inc['description']} (Incident ID: {inc_id})",
                        "action": "Dispatch paramedics unit 3 with cardiac monitor and stretchers to Section 104.",
                        "risk_level": "Medium",
                        "target_metric": "incidents.medical.status",
                        "initial_value": 0
                    })
                    manager.add_action_to_queue({
                        "proposer": "Dispatch Agent",
                        "why": f"Medic team routing corridor blockages (Incident ID: {inc_id})",
                        "action": "Deploy Steward Team 4 to clear east bowl egress pathways.",
                        "risk_level": "Low",
                        "target_metric": "incidents.medical.steward",
                        "initial_value": 0
                    })
                elif inc["type"] == "metro_delay":
                    manager.add_action_to_queue({
                        "proposer": "Logistics Agent",
                        "why": f"Metro station delay reported: {inc['description']} (Incident ID: {inc_id})",
                        "action": "Coordinate and dispatch 6 shuttle buses from South Parking Lot D to transport commuters.",
                        "risk_level": "Medium",
                        "target_metric": "metro.delay_minutes",
                        "initial_value": stadium_state["metro"]["delay_minutes"]
                    })
                elif inc["type"] in ["storm_warning", "weather"]:
                    manager.add_action_to_queue({
                        "proposer": "Incident Response Agent",
                        "why": f"Lightning hazard reported: {inc['description']} (Incident ID: {inc_id})",
                        "action": "Clear stadium plazas immediately. Guide fans to concourse shelter zones.",
                        "risk_level": "Medium",
                        "target_metric": "weather.condition",
                        "initial_value": 1
                    })
                elif inc["type"] == "vip_arrival":
                    manager.add_action_to_queue({
                        "proposer": "Dispatch Agent",
                        "why": f"VIP arrival lockdown active: {inc['description']} (Incident ID: {inc_id})",
                        "action": "Deploy security barricades and clear corridors for VIP motorcade ingress.",
                        "risk_level": "Low",
                        "target_metric": "incidents.vip_arrival.status",
                        "initial_value": 1
                    })

    is_exit_surge = stadium_state.get("exit_surge_active", False)
    if is_exit_surge:
        surge_proposed = any("exit surge" in a["why"].lower() for a in manager.actions_queue)
        if not surge_proposed:
            manager.add_action_to_queue({
                "proposer": "Crowd Flow Agent",
                "why": "Full-time whistle exit surge detected. Synchronized spectator mass egress across all stadium gate paths.",
                "action": "Unlock all outer gate perimeter security checkpoints. Suspend turnstile ticket scans.",
                "risk_level": "Medium",
                "target_metric": "gates.all.occupancy",
                "initial_value": 90
            })

    lots = stadium_state.get("parking", {})
    if lots:
        avg_parking = sum(lot["occupancy"] for lot in lots.values()) / len(lots)
        if avg_parking >= PARKING_AVG_THRESHOLD:
            steward_proposed = any(a["target_metric"] == "parking.influx" for a in manager.actions_queue)
            if not steward_proposed:
                manager.add_action_to_queue({
                    "proposer": "Logistics Agent",
                    "why": f"Average parking lot occupancy reached {int(avg_parking)}%. High inbound spectator volume expected at gates.",
                    "action": "Increase gate steward presence and open additional express lanes to handle arrival wave.",
                    "risk_level": "Low",
                    "target_metric": "parking.influx",
                    "initial_value": int(avg_parking)
                })

    lot_map = {
        "Gate A": "Lot A",
        "Gate B": "Lot B",
        "Gate C": "Lot C",
        "Gate D": "Lot D"
    }
    for gate_name, lot_name in lot_map.items():
        lot_data = stadium_state.get("parking", {}).get(lot_name)
        if lot_data:
            lot_occ = lot_data["occupancy"]
            if lot_occ >= PARKING_LOT_CRITICAL_THRESHOLD:
                proposed = any(a["target_metric"] == f"gates.{gate_name}.parking_surge" for a in manager.actions_queue)
                if not proposed:
                    manager.add_action_to_queue({
                        "proposer": "Crowd Flow Agent",
                        "why": f"Lot {lot_name[-1]} at {lot_occ}% (Full) — predicted arrival surge at {gate_name} in ~6 min.",
                        "action": f"Pre-position auxiliary ticketing stewards at {gate_name} to handle the incoming parking lot wave.",
                        "risk_level": "Low",
                        "target_metric": f"gates.{gate_name}.parking_surge",
                    })
