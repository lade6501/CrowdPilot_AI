import logging
import asyncio
from backend.agents.agent_constants import GOVERNANCE_DELAY_LONG

logger = logging.getLogger("agentic_core.scenario")

def trigger_scripted_disagreement(manager):
    logger.info("Triggering scripted Multi-Agent Disagreement Demo...")
    
    cf_id = manager.add_action_to_queue({
        "proposer": "Crowd Flow Agent",
        "why": "Active fire alarm in South Concourse level 2. Immediate evacuation required.",
        "action": "Close Gate B and redirect 100% of evacuating crowd to Gate C.",
        "risk_level": "High",
        "target_metric": "gates.Gate B.occupancy",
        "initial_value": 98
    })
    
    log_id = manager.add_action_to_queue({
        "proposer": "Logistics Agent",
        "why": "Gate C is at 78% occupancy. Metro Line 2 is experiencing delays and cannot absorb redirected evacuees.",
        "action": "Conflict Detected: Gate C cannot absorb Gate B load. Reject Gate B closure direction.",
        "risk_level": "Medium",
        "target_metric": "gates.Gate B.occupancy",
        "initial_value": 98
    })
    
    asyncio.create_task(resolve_disagreement(manager, cf_id, log_id))

async def resolve_disagreement(manager, cf_id: str, log_id: str):
    await asyncio.sleep(GOVERNANCE_DELAY_LONG)
    
    cf_action = next((a for a in manager.actions_queue if a["id"] == cf_id), None)
    log_action = next((a for a in manager.actions_queue if a["id"] == log_id), None)
    
    if cf_action and log_action:
        cf_action["status"] = "resolved_by_governance"
        cf_action["governance_check"] = "failed"
        cf_action["governance_details"] = "Resolved by Governance: Action superseded by unified merged resolution."
        
        log_action["status"] = "resolved_by_governance"
        log_action["governance_check"] = "failed"
        log_action["governance_details"] = "Resolved by Governance: Conflict resolved via unified merged resolution."
        
        manager.add_action_to_queue({
            "proposer": "Governance Agent (Conflict Resolution)",
            "why": "Resolved conflict: Redirecting Gate B spectators to Gate C will block exits and strain metro resources.",
            "action": "Unified Evacuation Plan: Redirect 50% load to Gate D, deploy additional signs, and dispatch 8 shuttle buses to Lot D.",
            "risk_level": "High",
            "target_metric": "gates.Gate B.occupancy",
            "initial_value": 98
        })
        
        manager.auto_draft_announcement = {
            "situation": "Fire alarm triggered. Please do not use Gate B. Orderly evacuation redirected to Gate D. Shuttles boarding at Lot D.",
            "audience": "General Public",
            "tone": "Urgent"
        }
        logger.info("Governance Agent successfully merged Crowd Flow and Logistics conflicts.")

def deploy_scenario_plan(manager, plan_summary: str):
    manager.add_action_to_queue({
        "proposer": "Scenario Simulator",
        "why": "Operator deployed simulated mitigation recommendations.",
        "action": f"Tactical deployment: {plan_summary}",
        "risk_level": "Medium",
        "target_metric": "gates.Gate B.occupancy",
        "initial_value": 95
    })
    logger.info("Scenario simulation plan successfully injected into the action queue.")
