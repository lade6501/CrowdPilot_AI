import asyncio
import time
import logging
from backend.agents.agent_constants import GOVERNANCE_DELAY_SHORT

logger = logging.getLogger("agentic_core.governance")

def _is_medical_or_fire(proposer: str, action_text: str, why: str) -> tuple[bool, bool]:
    is_med = "medical" in proposer.lower() or "medic" in action_text.lower() or "medical" in why.lower()
    is_fire = "fire" in proposer.lower() or "evacuation" in action_text.lower() or "fire" in why.lower()
    return is_med, is_fire

async def run_governance_review(manager, action_id: str, action_data: dict):
    await asyncio.sleep(GOVERNANCE_DELAY_SHORT)
    
    action = next((a for a in manager.actions_queue if a["id"] == action_id), None)
    if not action:
        return

    proposer = action["proposer"]
    action_text = action["action"]
    risk = action["risk_level"]
    why = action["why"]

    if "close" in action_text.lower() and "gate" in action_text.lower():
        closed_gates = [a for a in manager.actions_queue if "close" in a["action"].lower() and a["status"] in ["approved", "auto_executed"] and a["id"] != action_id]
        if len(closed_gates) >= 1:
            action["status"] = "failed_governance"
            action["governance_check"] = "failed"
            action["governance_details"] = "Blocked: Exceeds max-simultaneous-closures policy (cannot close more than 1 gate simultaneously)."
            logger.warning(f"Action {action_id} blocked by Governance: Max gate closures policy violated.")
            return

    is_medical, is_fire = _is_medical_or_fire(proposer, action_text, why)
    
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

    if manager.autonomy_level == "suggest_only":
        action["governance_check"] = "passed"
        action["governance_details"] = "Passed policy check. Pending operator review (Autonomy set to 'Suggest Only')."
        action["status"] = "pending"
    elif manager.autonomy_level == "auto_execute_low":
        if risk == "Low":
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Automatically executing low-risk tactical action."
            action["status"] = "auto_executed"
            manager.execute_action_effects(action)
        else:
            action["governance_check"] = "passed"
            action["governance_details"] = f"Passed policy check. Pending operator review (Autonomy level bypasses {risk}-risk actions)."
            action["status"] = "pending"
    elif manager.autonomy_level == "full_autonomous":
        if risk in ["Low", "Medium"]:
            action["governance_check"] = "passed"
            action["governance_details"] = f"Passed policy check. Automatically executing {risk}-risk tactical action."
            action["status"] = "auto_executed"
            manager.execute_action_effects(action)
        else:
            action["governance_check"] = "passed"
            action["governance_details"] = "Passed policy check. Operator Approval Required (High-risk evacuation directives require human checks)."
            action["status"] = "pending"

def approve_action(manager, action_id: str):
    action = next((a for a in manager.actions_queue if a["id"] == action_id), None)
    if action and action["status"] == "pending":
        action["status"] = "approved"
        action["timestamp"] = time.strftime("%H:%M:%S")
        manager.execute_action_effects(action)
        logger.info(f"Action {action_id} manually approved by operator.")

def deny_action(manager, action_id: str):
    action = next((a for a in manager.actions_queue if a["id"] == action_id), None)
    if action and action["status"] == "pending":
        action["status"] = "denied"
        action["verification_status"] = "not_started"
        logger.info(f"Action {action_id} denied by operator.")
