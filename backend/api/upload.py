import asyncio
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.simulator import stadium_state
from backend.agents.orchestrator import orchestrator_agent
from backend.agents.agentic_core import agentic_manager
from backend.services.state_sync import broadcast_state_sync, sync_agentic_state
from backend.utils.csv_parser import parse_gate_csv, build_uploaded_state

logger = logging.getLogger("api.upload")
router = APIRouter()

MAX_UPLOAD_BYTES = 2 * 1024 * 1024

@router.post("/api/upload")
async def post_upload(file: UploadFile = File(...)):
    try:
        if not file.filename or not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 2MB.")
        custom_gates = parse_gate_csv(content)
        custom_state = build_uploaded_state(custom_gates)
        result = await asyncio.to_thread(orchestrator_agent.orchestrate, custom_state)
        
        agentic_manager.calibration_diff = f"Gate B flow-rate threshold adjusted 15→18 p/m based on ingest of {len(custom_gates)} gate states."
        stadium_state["calibration_diff"] = agentic_manager.calibration_diff
        sync_agentic_state()
        await broadcast_state_sync()
        return {
            "parsed_gates": custom_gates,
            "analysis": result
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as error:
        logger.error("Error uploading and analyzing CSV: %s", error)
        raise HTTPException(status_code=500, detail=str(error))
