import asyncio
import logging
from fastapi import APIRouter, HTTPException
from backend.schemas import SimulateRequest, InjectRequest
from backend.simulator import stadium_state, inject_incident, reset_simulator_to_live
from backend.agents.simulation import simulation_agent
from backend.services.state_sync import broadcast_state_sync

logger = logging.getLogger("api.simulation")
router = APIRouter()

VALID_INCIDENT_TYPES = {
    "medical",
    "fire_alarm",
    "metro_failure",
    "storm_warning",
    "vip_arrival",
    "full_time",
}

@router.post("/api/simulate")
async def post_simulate(req: SimulateRequest):
    try:
        current_gates = stadium_state["gates"]
        result = await asyncio.to_thread(simulation_agent.simulate, current_gates, req.scenario)
        return result
    except Exception as error:
        logger.error("Error in scenario simulation endpoint: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/inject")
async def post_inject(req: InjectRequest):
    if req.incident_type not in VALID_INCIDENT_TYPES:
        valid_types = sorted(VALID_INCIDENT_TYPES)
        raise HTTPException(status_code=400, detail=f"Invalid incident_type. Must be one of: {valid_types}")
    try:
        await inject_incident(req.incident_type)
        return {"status": "injected", "type": req.incident_type}
    except Exception as error:
        logger.error("Error injecting incident: %s", error)
        raise HTTPException(status_code=500, detail=str(error))

@router.post("/api/resume")
async def post_resume():
    try:
        await reset_simulator_to_live()
        await broadcast_state_sync()
        return {"status": "resumed", "mode": "live"}
    except Exception as error:
        logger.error("Error resuming simulator to live: %s", error)
        raise HTTPException(status_code=500, detail=str(error))
