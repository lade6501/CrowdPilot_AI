import logging
from fastapi import APIRouter, HTTPException
from backend.schemas import AutonomyRequest
from backend.agents.agentic_core import agentic_manager
from backend.services.state_sync import broadcast_state_sync, sync_agentic_state

logger = logging.getLogger("api.autonomy")
router = APIRouter()

@router.post("/api/autonomy")
async def post_autonomy(req: AutonomyRequest):
    try:
        agentic_manager.update_autonomy(req.level)
        sync_agentic_state()
        await broadcast_state_sync()
        return {"status": "updated", "autonomy_level": agentic_manager.autonomy_level}
    except Exception as error:
        logger.error("Error updating autonomy: %s", error)
        raise HTTPException(status_code=500, detail=str(error))
