import time
import logging
import asyncio
from typing import List, Dict, Any

from backend.agents.agent_registry import AGENT_REGISTRY as AGENT_REGISTRY
from backend.agents import governance, execution, verification, perception, scenario

logger = logging.getLogger("agentic_core")

def get_best_detour_gate(src_gate: str, gates: dict) -> str:
    gate_options = [g for g in ["Gate A", "Gate B", "Gate C", "Gate D"] if g != src_gate]
    neighbors = {
        "Gate A": ["Gate B", "Gate D", "Gate C"],
        "Gate B": ["Gate A", "Gate C", "Gate D"],
        "Gate C": ["Gate B", "Gate D", "Gate A"],
        "Gate D": ["Gate A", "Gate C", "Gate B"]
    }
    src_neighbors = neighbors.get(src_gate, [])
    def sort_key(g):
        occ = gates.get(g, {}).get("occupancy", 0)
        is_safe = 0 if occ < 75 else 1
        dist_idx = src_neighbors.index(g) if g in src_neighbors else 99
        return (is_safe, occ, dist_idx)
    gate_options.sort(key=sort_key)
    return gate_options[0] if gate_options else "Gate D"

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

                    is_med = "medical" in proposer.lower() or "medic" in action_text.lower() or "medical" in why.lower()
                    is_fire = "fire" in proposer.lower() or "evacuation" in action_text.lower() or "fire" in why.lower()

                    if is_med or is_fire:
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
        await governance.run_governance_review(self, action_id, action_data)

    def approve_action(self, action_id: str):
        governance.approve_action(self, action_id)

    def deny_action(self, action_id: str):
        governance.deny_action(self, action_id)

    def execute_action_effects(self, action: Dict[str, Any]):
        execution.execute_action_effects(self, action)

    def verify_action_results(self, stadium_state: Dict[str, Any], current_tick: int):
        verification.verify_action_results(self, stadium_state, current_tick)

    def perceive_telemetry(self, stadium_state: Dict[str, Any], current_tick: int):
        perception.perceive_telemetry(self, stadium_state, current_tick)

    def trigger_scripted_disagreement(self):
        scenario.trigger_scripted_disagreement(self)

    async def resolve_disagreement(self, cf_id: str, log_id: str):
        await scenario.resolve_disagreement(self, cf_id, log_id)

    def deploy_scenario_plan(self, plan_summary: str):
        scenario.deploy_scenario_plan(self, plan_summary)

agentic_manager = AgenticManager()