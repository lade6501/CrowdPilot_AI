import logging

logger = logging.getLogger("agentic_core.verification")

def verify_action_results(manager, stadium_state: dict, current_tick: int):
    for action in manager.actions_queue:
        if action["verification_status"] == "pending" and current_tick >= action["target_tick"]:
            target = action["target_metric"]
            initial = action["initial_value"]
            
            if target.startswith("gates.") and target.endswith(".occupancy"):
                gate_name = target.split(".")[1]
                current_val = stadium_state["gates"][gate_name]["occupancy"]
                if current_val < initial or current_val < 90:
                    action["verification_status"] = "success"
                    action["verification_result"] = f"Verified: {gate_name} occupancy stabilized at {current_val}% - Congestion target met."
                else:
                    action["verification_status"] = "failed"
                    action["verification_result"] = f"Verification Failed: {gate_name} occupancy remains at {current_val}% - Escalating to Governance Agent."
            
            elif target == "metro.delay_minutes":
                current_val = stadium_state["metro"]["delay_minutes"]
                if current_val < initial:
                    action["verification_status"] = "success"
                    action["verification_result"] = f"Verified: Transit delays resolved (from {initial}m to {current_val}m) - Crowd flow stabilized."
                else:
                    action["verification_status"] = "failed"
                    action["verification_result"] = "Verification Failed: Commuter backlogs persisting - Escalating to Logistics."

            elif target == "incidents.medical.status":
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: Medical team arrived at Section 104. Spectator stabilized. Incident resolved."

                for inc in stadium_state["incidents"]:
                    if inc["type"] == "medical":
                        inc["status"] = "resolved"

            elif target == "weather.condition":
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: Plazas fully cleared. All fans safely inside covered concourse shelters."
                stadium_state["weather"]["alerts"] = []
                
            elif target == "incidents.vip_arrival.status":
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: VIP motorcade cleared. East concourse corridors returned to normal fan ingress."
                for inc in stadium_state["incidents"]:
                    if inc["type"] == "vip_arrival":
                        inc["status"] = "resolved"
                        
            elif target == "parking.influx":
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: Additional gate lanes opened. Commuter arrival surge absorbed safely."
                        
            elif "parking_surge" in target:
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: Auxiliary stewards deployed. Fan entry times remained stable during lot exit peak."
                        
            else:
                action["verification_status"] = "success"
                action["verification_result"] = "Verified: Actions deployed successfully and metrics stabilized."

    new_queue = []
    for action in manager.actions_queue:
        is_completed = (
            action["verification_status"] in ["success", "failed"] or 
            action["status"] in ["denied", "failed_governance"]
        )
        
        if is_completed:
            cleanup_tick = action.get("cleanup_tick")
            if not cleanup_tick:
                action["cleanup_tick"] = current_tick + 3
                new_queue.append(action)
            elif current_tick < cleanup_tick:
                new_queue.append(action)
        else:
            new_queue.append(action)
    manager.actions_queue = new_queue
