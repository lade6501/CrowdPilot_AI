import asyncio
import logging
from fastapi import APIRouter, HTTPException
from backend.schemas import AnnouncementRequest, DeployPlanRequest
from backend.simulator import stadium_state, trigger_ai_orchestration
from backend.agents.communication import communication_agent
from backend.agents.agentic_core import agentic_manager
from backend.services.state_sync import broadcast_state_sync, sync_agentic_state

logger = logging.getLogger("api.actions")
router = APIRouter()

@router.post("/api/announcement")
async def post_announcement(req: AnnouncementRequest):
    try:
        result = await asyncio.to_thread(
            communication_agent.generate_announcement, 
            req.situation, 
            req.tone, 
            req.audience
        )
        return result
    except Exception as error:
        logger.error("Error in announcement generation endpoint: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/orchestrate")
async def post_orchestrate():
    try:
        await trigger_ai_orchestration()
        await broadcast_state_sync()
        return {
            "status": "success",
            "ai_summary": stadium_state.get("ai_summary"),
            "ai_error": stadium_state.get("ai_error")
        }
    except Exception as error:
        logger.error("Error in manual orchestration endpoint: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/actions/{action_id}/approve")
async def post_approve_action(action_id: str):
    try:
        agentic_manager.approve_action(action_id)
        sync_agentic_state()
        await broadcast_state_sync()
        return {"status": "approved", "action_id": action_id}
    except Exception as error:
        logger.error("Error approving action: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/actions/{action_id}/deny")
async def post_deny_action(action_id: str):
    try:
        agentic_manager.deny_action(action_id)
        sync_agentic_state()
        await broadcast_state_sync()
        return {"status": "denied", "action_id": action_id}
    except Exception as error:
        logger.error("Error denying action: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/actions/deploy-plan")
async def post_deploy_plan(req: DeployPlanRequest):
    try:
        agentic_manager.deploy_scenario_plan(req.plan_summary)
        sync_agentic_state()
        await broadcast_state_sync()
        return {"status": "deployed", "plan_summary": req.plan_summary}
    except Exception as error:
        logger.error("Error deploying simulated plan: %s", error)
        raise HTTPException(status_code=500, detail=str(error))
