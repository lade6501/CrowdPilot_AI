import logging

logger = logging.getLogger("agentic_core.execution")

def execute_action_effects(manager, action: dict):
    from backend.simulator import stadium_state, sim_tick
    
    target = action.get("target_metric")
    if not target:
        return
        
    action["verification_status"] = "pending"
    action["target_tick"] = sim_tick + 2

    if target.startswith("gates.") and target.endswith(".occupancy"):
        gate_name = target.split(".")[1]
        action["initial_value"] = stadium_state["gates"][gate_name]["occupancy"]
        logger.info(f"Executing: {gate_name} congestion rerouting effects. Initial: {action['initial_value']}%")
        active_re = stadium_state.setdefault("active_reroutes", [])
        if gate_name not in active_re:
            active_re.append(gate_name)

    elif target == "metro.delay_minutes":
        action["initial_value"] = stadium_state["metro"]["delay_minutes"]
        logger.info(f"Executing: Shuttles dispatched to Metro. Initial Delay: {action['initial_value']}m")
        stadium_state["shuttle_bus_active"] = True

    elif target == "incidents.medical.status":
        logger.info("Executing: Medical dispatch to Section 104.")
        stadium_state["medical_dispatch_active"] = True
        
    elif target == "weather.condition":
        logger.info("Executing: Plazas cleared to shelters.")
        stadium_state["storm_shelter_active"] = True
        
    elif target == "incidents.vip_arrival.status":
        logger.info("Executing: VIP security clearance.")
        stadium_state["vip_clearance_active"] = True
