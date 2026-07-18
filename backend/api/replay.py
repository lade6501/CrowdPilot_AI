import logging
from fastapi import APIRouter, HTTPException
from backend.schemas import ReplayRequest
from backend.simulator import load_replay_preset

logger = logging.getLogger("api.replay")
router = APIRouter()

@router.post("/api/replay")
async def post_replay(req: ReplayRequest):
    try:
        await load_replay_preset(req.time_slot)
        return {"status": "scrubbed", "time_slot": req.time_slot}
    except Exception as error:
        logger.error("Error loading replay preset: %s", error)
        raise HTTPException(status_code=500, detail=str(error))
