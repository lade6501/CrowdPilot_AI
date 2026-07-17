import time
import random
import logging
import asyncio
from typing import List, Dict, Any

logger = logging.getLogger("agentic_core")

AGENT_REGISTRY = [
    {
        "id": "crowd_flow",
        "name": "Crowd Flow Agent",
        "scope": "Reads gate occupancy, queue size, and flow velocity.",
        "tools": ["propose_gate_rerouting", "propose_directional_signage", "propose_gate_closure"],
        "riskLevel": "Medium"
    },
    {
        "id": "incident_response",
        "name": "Incident Response Agent",
        "scope": "Perceives active hazards, coordinates severity and priority assessment.",
        "tools": ["triage_incident", "escalate_response"],
        "riskLevel": "Medium"
    },
    {
        "id": "comms",
        "name": "Comms Agent",
        "scope": "Drafts multilingual PA broadcasts, push alerts, and stadium warnings.",
        "tools": ["generate_announcement", "broadcast_to_crew"],
        "riskLevel": "Low"
    },
    {
        "id": "logistics",
        "name": "Logistics Agent",
        "scope": "Reads transit metrics, shuttle availability, and parking capacities.",
        "tools": ["deploy_shuttle_buses", "adjust_parking_inflow"],
        "riskLevel": "Medium"
    },
    {
        "id": "dispatch",
        "name": "Dispatch Agent",
        "scope": "Assigns stewards, medical personnel, and response teams to specific stadium coordinates.",
        "tools": ["dispatch_medic_team", "dispatch_steward_team"],
        "riskLevel": "Low"
    },
    {
        "id": "governance",
        "name": "Governance Agent",
        "scope": "Reviews other agents' proposed actions against stadium policy rules before execution.",
        "tools": ["policy_compliance_check", "override_actions"],
        "riskLevel": "High"
    }
]

class AgenticManager:
    def __init__(self):
        self.autonomy_level = "suggest_only"
        self.actions_queue: List[Dict[str, Any]] = []
        self.calibration_diff = "No calibration diff registered yet. Ingress uploader idle."
        self.auto_draft_announcement = None
        self.action_counter = 0

    def reset_queue(self):
        self.actions_queue = []
        self.auto_draft_announcement = None
        logger.info("Agentic Action Queue reset to clean slate.")

    def get_actions(self) -> List[Dict[str, Any]]:
        return self.actions_queue

    def update_autonomy(self, level: str):
        if level in ["suggest_only", "auto_execute_low", "full_autonomous"]:
            self.autonomy_level = level
            logger.info(f"Autonomy level updated to: {level}")
            

            for action in self.actions_queue:
                if action["status"] == "pending" and action["governance_check"] == "passed":
                    risk = action["risk_level"]
                    proposer = action["proposer"]
                    action_text = action["action"]
                    why = action["why"]


                    is_medical = "medical" in proposer.lower() or "medic" in action_text.lower() or "medical" in why.lower()
                    is_fire = "fire" in proposer.lower() or "evacuation" in action_text.lower() or "fire" in why.lower()

                    if is_medical or is_fire:
                        continue

                    if level == "auto_execute_low" and risk == "Low":
                        action["governance_details"] = "Passed policy check. Automatically executing low-risk tactical action (autonomy updated)."
                        action["status"] = "auto_executed"
                        self.execute_action_effects(action)
                        logger.info(f"Action {action['id']} auto-executed retroactively (Low-risk).")
                    elif level == "full_autonomous" and risk in ["Low", "Medium"]:
                        action["governance_details"] = f"Passed policy check. Automatically executing {risk}-risk tactical action (autonomy updated)."
                        action["status"] = "auto_executed"
                        self.execute_action_effects(action)
                        logger.info(f"Action {action['id']} auto-executed retroactively ({risk}-risk).")

    def add_action_to_queue(self, action_data: Dict[str, Any]) -> str:
        self.action_counter += 1
        action_id = f"act_{self.action_counter}"
        
        new_action = {
            "id": action_id,
            "proposer": action_data.get("proposer"),
            "why": action_data.get("why"),
            "action": action_data.get("action"),
            "risk_level": action_data.get("risk_level", "Low"),
            "status": "review",
            "timestamp": time.strftime("%H:%M:%S"),
            "verification_status": "not_started",
            "verification_result": "",
            "governance_check": "review",
            "governance_details": "Governance Agent reviewing proposed action against policy rules...",
            "target_metric": action_data.get("target_metric"),
            "initial_value": action_data.get("initial_value"),
            "target_tick": 0
        }
        self.actions_queue.append(new_action)
        

        asyncio.create_task(self.run_governance_review(action_id, action_data))
        return action_id

    async def run_governance_review(self, action_id: str, action_data: Dict[str, Any]):

        await asyncio.sleep(1.5)
        
        action = next((a for a in self.actions_queue if a["id"] == action_id), None)
        if not action:
            return

        proposer = action["proposer"]
        action_text = action["action"]
        risk = action["risk_level"]
        why = action["why"]


        if "close" in action_text.lower() and "gate" in action_text.lower():

            closed_gates = [a for a in self.actions_queue if "close" in a["action"].lower() and a["status"] in ["approved", "auto_executed"] and a["id"] != action_id]
            if len(closed_gates) >= 1:
                action["status"] = "failed_governance"
                action["governance_check"] = "failed"
                action["governance_details"] = "Blocked: Exceeds max-simultaneous-closures policy (cannot close more than 1 gate simultaneously)."
                logger.warning(f"Action {action_id} blocked by Governance: Max gate closures policy violated.")
                return


        is_medical = "medical" in proposer.lower() or "medic" in action_text.lower() or "medical" in why.lower()
        is_fire = "fire" in proposer.lower() or "evacuation" in action_text.lower() or "fire" in why.lower()
        
        if is_medical:
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Operator Approval Required (Medical override policy always requires human check)."
            action["status"] = "pending"
            logger.info(f"Action {action_id} passed governance. Medical incident requires human operator approval.")
            return

        if is_fire:
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Operator Approval Required (South Concourse Fire Evacuation protocol requires human confirmation)."
            action["status"] = "pending"
            logger.info(f"Action {action_id} passed governance. Fire incident requires human operator approval.")
            return


        is_low_confidence = "low confidence" in action_text.lower() or "low confidence" in why.lower()
        if is_low_confidence:
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Operator Approval Required (Low confidence prediction bypasses Autonomy settings)."
            action["status"] = "pending"
            logger.info(f"Action {action_id} passed governance. Low-confidence requires human operator approval.")
            return


        if self.autonomy_level == "suggest_only":
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Pending operator review (Autonomy set to 'Suggest Only')."
            action["status"] = "pending"
        elif self.autonomy_level == "auto_execute_low":
            if risk == "Low":
                action["governance_check"] = "passed"
                action["governance_details"] = "Passed policy check. Automatically executing low-risk tactical action."
                action["status"] = "auto_executed"
                self.execute_action_effects(action)
            else:
                action["governance_check"] = "passed"
                action["governance_details"] = f"Passed policy check. Pending operator review (Autonomy level bypasses {risk}-risk actions)."
                action["status"] = "pending"
        elif self.autonomy_level == "full_autonomous":
            if risk in ["Low", "Medium"]:
                action["governance_check"] = "passed"
                action["governance_details"] = f"Passed policy check. Automatically executing {risk}-risk tactical action."
                action["status"] = "auto_executed"
                self.execute_action_effects(action)
            else:
                action["governance_check"] = "passed"
                action["governance_details"] = "Passed policy check. Operator Approval Required (High-risk evacuation directives require human checks)."
                action["status"] = "pending"

    def approve_action(self, action_id: str):
        action = next((a for a in self.actions_queue if a["id"] == action_id), None)
        if action and action["status"] == "pending":
            action["status"] = "approved"
            action["timestamp"] = time.strftime("%H:%M:%S")
            self.execute_action_effects(action)
            logger.info(f"Action {action_id} manually approved by operator.")

    def deny_action(self, action_id: str):
        action = next((a for a in self.actions_queue if a["id"] == action_id), None)
        if action and action["status"] == "pending":
            action["status"] = "denied"
            action["verification_status"] = "not_started"
            logger.info(f"Action {action_id} denied by operator.")

    def execute_action_effects(self, action: Dict[str, Any]):
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

    def verify_action_results(self, stadium_state: Dict[str, Any], current_tick: int):
        for action in self.actions_queue:
            if action["verification_status"] == "pending" and current_tick >= action["target_tick"]:
                target = action["target_metric"]
                initial = action["initial_value"]
                action_text = action["action"]
                
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
        for action in self.actions_queue:
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
        self.actions_queue = new_queue

    def perceive_telemetry(self, stadium_state: Dict[str, Any], current_tick: int):

        for gate_name, gate_data in stadium_state["gates"].items():
            gate_load = gate_data["occupancy"]
            if gate_load >= 90:

                gate_proposed = any(a["target_metric"] == f"gates.{gate_name}.occupancy" and a["status"] in ["review", "pending"] for a in self.actions_queue)
                if not gate_proposed:

                    is_fire_active = any(inc["type"] == "fire_alarm" and inc["status"] == "active" for inc in stadium_state["incidents"])
                    
                    if gate_name == "Gate B" and is_fire_active:
                        self.trigger_scripted_disagreement()
                    else:

                        confidence = 74 if gate_name == "Gate B" else (78 if gate_name == "Gate A" else 82)
                        confidence_flag = "Low Confidence" if confidence < 80 else "Normal Confidence"
                        

                        self.add_action_to_queue({
                            "proposer": "Crowd Flow Agent",
                            "why": f"{gate_name} load reached {gate_load}% (critical bottleneck risk) [{confidence_flag} - High incoming flow variance]",
                            "action": f"Reroute incoming traffic from {gate_name} to adjacent entrances. Deploy digital directional signage.",
                            "risk_level": "Medium",
                            "target_metric": f"gates.{gate_name}.occupancy",
                            "initial_value": gate_load
                        })
                        


                        target_spillover = "Gate D" if gate_name == "Gate B" else "Gate B"
                        self.add_action_to_queue({
                            "proposer": "Crowd Flow Agent",
                            "why": f"{target_spillover} predicted to reach 85% in 3 min due to {gate_name} overflow (cascade spillover prediction)",
                            "action": f"Pre-position Steward Team 5 at {target_spillover} corridor access points to prepare for redirected spectator waves.",
                            "risk_level": "Low",
                            "target_metric": f"gates.{target_spillover}.occupancy",
                            "initial_value": stadium_state["gates"][target_spillover]["occupancy"]
                        })
                        

                        self.auto_draft_announcement = {
                            "situation": f"{gate_name} occupancy is critical ({gate_load}%). All fans are redirected to adjacent gates immediately.",
                            "audience": "General Public",
                            "tone": "Calm"
                        }
                        logger.info(f"Comms Agent handoff completed for {gate_name}. PA draft notification staged.")


        for inc in stadium_state["incidents"]:
            if inc["status"] == "active":
                inc_id = inc["id"]
                inc_proposed = any(inc_id in a["why"] for a in self.actions_queue)
                if not inc_proposed:

                    if inc["type"] == "medical":
                        self.add_action_to_queue({
                            "proposer": "Incident Response Agent",
                            "why": f"Medical alert reported: {inc['description']} (Incident ID: {inc_id})",
                            "action": "Dispatch paramedics unit 3 with cardiac monitor and stretchers to Section 104.",
                            "risk_level": "Medium",
                            "target_metric": "incidents.medical.status",
                            "initial_value": 0
                        })
                        self.add_action_to_queue({
                            "proposer": "Dispatch Agent",
                            "why": f"Medic team routing corridor blockages (Incident ID: {inc_id})",
                            "action": "Deploy Steward Team 4 to clear east bowl egress pathways.",
                            "risk_level": "Low",
                            "target_metric": "incidents.medical.steward",
                            "initial_value": 0
                        })
                    elif inc["type"] == "metro_delay":
                        self.add_action_to_queue({
                            "proposer": "Logistics Agent",
                            "why": f"Metro station delay reported: {inc['description']} (Incident ID: {inc_id})",
                            "action": "Coordinate and dispatch 6 shuttle buses from South Parking Lot D to transport commuters.",
                            "risk_level": "Medium",
                            "target_metric": "metro.delay_minutes",
                            "initial_value": stadium_state["metro"]["delay_minutes"]
                        })
                    elif inc["type"] in ["storm_warning", "weather"]:
                        self.add_action_to_queue({
                            "proposer": "Incident Response Agent",
                            "why": f"Lightning hazard reported: {inc['description']} (Incident ID: {inc_id})",
                            "action": "Clear stadium plazas immediately. Guide fans to concourse shelter zones.",
                            "risk_level": "Medium",
                            "target_metric": "weather.condition",
                            "initial_value": 1
                        })
                    elif inc["type"] == "vip_arrival":
                        self.add_action_to_queue({
                            "proposer": "Dispatch Agent",
                            "why": f"VIP arrival lockdown active: {inc['description']} (Incident ID: {inc_id})",
                            "action": "Deploy security barricades and clear corridors for VIP motorcade ingress.",
                            "risk_level": "Low",
                            "target_metric": "incidents.vip_arrival.status",
                            "initial_value": 1
                        })


        is_exit_surge = stadium_state.get("exit_surge_active", False)
        if is_exit_surge:
            surge_proposed = any("exit surge" in a["why"].lower() for a in self.actions_queue)
            if not surge_proposed:
                self.add_action_to_queue({
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
            if avg_parking >= 80:
                steward_proposed = any(a["target_metric"] == "parking.influx" for a in self.actions_queue)
                if not steward_proposed:
                    self.add_action_to_queue({
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
                if lot_occ >= 95:
                    proposed = any(a["target_metric"] == f"gates.{gate_name}.parking_surge" for a in self.actions_queue)
                    if not proposed:
                        self.add_action_to_queue({
                            "proposer": "Crowd Flow Agent",
                            "why": f"Lot {lot_name[-1]} at {lot_occ}% (Full) — predicted arrival surge at {gate_name} in ~6 min.",
                            "action": f"Pre-position auxiliary ticketing stewards at {gate_name} to handle the incoming parking lot wave.",
                            "risk_level": "Low",
                            "target_metric": f"gates.{gate_name}.parking_surge",
                            "initial_value": stadium_state["gates"][gate_name]["occupancy"]
                        })

    def trigger_scripted_disagreement(self):
        logger.info("Triggering scripted Multi-Agent Disagreement Demo...")
        

        cf_id = self.add_action_to_queue({
            "proposer": "Crowd Flow Agent",
            "why": "Active fire alarm in South Concourse level 2. Immediate evacuation required.",
            "action": "Close Gate B and redirect 100% of evacuating crowd to Gate C.",
            "risk_level": "High",
            "target_metric": "gates.Gate B.occupancy",
            "initial_value": 98
        })
        

        log_id = self.add_action_to_queue({
            "proposer": "Logistics Agent",
            "why": "Gate C is at 78% occupancy. Metro Line 2 is experiencing delays and cannot absorb redirected evacuees.",
            "action": "Conflict Detected: Gate C cannot absorb Gate B load. Reject Gate B closure direction.",
            "risk_level": "Medium",
            "target_metric": "gates.Gate B.occupancy",
            "initial_value": 98
        })
        

        asyncio.create_task(self.resolve_disagreement(cf_id, log_id))

    async def resolve_disagreement(self, cf_id: str, log_id: str):

        await asyncio.sleep(1.6)
        
        cf_action = next((a for a in self.actions_queue if a["id"] == cf_id), None)
        log_action = next((a for a in self.actions_queue if a["id"] == log_id), None)
        
        if cf_action and log_action:
            cf_action["status"] = "resolved_by_governance"
            cf_action["governance_check"] = "failed"
            cf_action["governance_details"] = "Resolved by Governance: Action superseded by unified merged resolution."
            
            log_action["status"] = "resolved_by_governance"
            log_action["governance_check"] = "failed"
            log_action["governance_details"] = "Resolved by Governance: Conflict resolved via unified merged resolution."
            

            self.add_action_to_queue({
                "proposer": "Governance Agent (Conflict Resolution)",
                "why": "Resolved conflict: Redirecting Gate B spectators to Gate C will block exits and strain metro resources.",
                "action": "Unified Evacuation Plan: Redirect 50% load to Gate D, deploy additional signs, and dispatch 8 shuttle buses to Lot D.",
                "risk_level": "High",
                "target_metric": "gates.Gate B.occupancy",
                "initial_value": 98
            })
            

            self.auto_draft_announcement = {
                "situation": "Fire alarm triggered. Please do not use Gate B. Orderly evacuation redirected to Gate D. Shuttles boarding at Lot D.",
                "audience": "General Public",
                "tone": "Urgent"
            }
            logger.info("Governance Agent successfully merged Crowd Flow and Logistics conflicts.")

    def deploy_scenario_plan(self, plan_summary: str):
        self.add_action_to_queue({
            "proposer": "Scenario Simulator",
            "why": "Operator deployed simulated mitigation recommendations.",
            "action": f"Tactical deployment: {plan_summary}",
            "risk_level": "Medium",
            "target_metric": "gates.Gate B.occupancy",
            "initial_value": 95
        })
        logger.info("Scenario simulation plan successfully injected into the action queue.")

agentic_manager = AgenticManager()