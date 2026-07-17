import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import io
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd

from backend.config import config
from backend.simulator import manager, start_simulator_loop, stadium_state, inject_incident, load_replay_preset
from backend.agents.orchestrator import orchestrator_agent
from backend.agents.simulation import simulation_agent
from backend.agents.communication import communication_agent

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):

    task = asyncio.create_task(start_simulator_loop())
    logger.info("FastAPI Server and Background Simulator started successfully.")
    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Simulator loop terminated successfully.")

app = FastAPI(
    title="CrowdPilot AI - Stadium Operations Engine",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
async def get_status():
    has_key = bool(config.GEMINI_API_KEY)
    return {
        "status": "healthy",
        "gemini_api_configured": has_key,
        "mode": "live" if has_key else "mock"
    }


class SimulateRequest(BaseModel):
    scenario: str = Field(..., json_schema_extra={"example": "What happens if Gate B closes?"})

class AnnouncementRequest(BaseModel):
    situation: str = Field(..., json_schema_extra={"example": "Gate B closed due to overcrowding"})
    tone: str = Field(..., json_schema_extra={"example": "Calm"})
    audience: str = Field(..., json_schema_extra={"example": "International Visitors"})

class InjectRequest(BaseModel):
    incident_type: str = Field(..., json_schema_extra={"example": "medical"})

class ReplayRequest(BaseModel):
    time_slot: str = Field(..., json_schema_extra={"example": "8:00 PM"})

class AutonomyRequest(BaseModel):
    level: str = Field(..., json_schema_extra={"example": "auto_execute_low"})

class DeployPlanRequest(BaseModel):
    plan_summary: str = Field(..., json_schema_extra={"example": "Close Gate B, redirect 50% load to Gate D."})

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

@app.post("/api/simulate")
async def post_simulate(req: SimulateRequest):
    try:
        current_gates = stadium_state["gates"]
        result = await asyncio.to_thread(simulation_agent.simulate, current_gates, req.scenario)
        return result
    except Exception as e:
        logger.error(f"Error in scenario simulation endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/announcement")
async def post_announcement(req: AnnouncementRequest):
    try:
        result = await asyncio.to_thread(
            communication_agent.generate_announcement, 
            req.situation, 
            req.tone, 
            req.audience
        )
        return result
    except Exception as e:
        logger.error(f"Error in announcement generation endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/inject")
async def post_inject(req: InjectRequest):
    valid_types = ["medical", "fire_alarm", "metro_failure", "storm_warning", "vip_arrival", "full_time"]
    if req.incident_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid incident_type. Must be one of: {valid_types}")
    try:
        await inject_incident(req.incident_type)
        return {"status": "injected", "type": req.incident_type}
    except Exception as e:
        logger.error(f"Error injecting incident: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/replay")
async def post_replay(req: ReplayRequest):
    try:
        await load_replay_preset(req.time_slot)
        return {"status": "scrubbed", "time_slot": req.time_slot}
    except Exception as e:
        logger.error(f"Error loading replay preset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orchestrate")
async def post_orchestrate():
    try:
        from backend.simulator import trigger_ai_orchestration
        await trigger_ai_orchestration()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {
            "status": "success",
            "ai_summary": stadium_state.get("ai_summary"),
            "ai_error": stadium_state.get("ai_error")
        }
    except Exception as e:
        logger.error(f"Error in manual orchestration endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate")
async def post_translate(req: TranslateRequest):
    try:
        from backend.agents.base import BaseAgent
        agent = BaseAgent(
            role="Translation Specialist",
            system_prompt="You are a professional multilingual translator. Translate the given text into the target language. Respond ONLY with the translated text. Do not add any introduction, headers, quotes, or markdown formatting."
        )
        lang_names = {
            "es": "Spanish",
            "fr": "French",
            "hi": "Hindi"
        }
        target_name = lang_names.get(req.target_lang, "English")
        if target_name == "English":
            return {"translated_text": req.text}
            
        prompt = f"Translate the following text to {target_name}:\n{req.text}"
        translated = agent.call_gemini_text(prompt)
        return {"translated_text": translated}
    except Exception as e:
        logger.error(f"Error in translation endpoint: {e}")
        return {"translated_text": req.text}

@app.post("/api/autonomy")
async def post_autonomy(req: AutonomyRequest):
    try:
        from backend.agents.agentic_core import agentic_manager
        agentic_manager.update_autonomy(req.level)
        stadium_state["autonomy_level"] = agentic_manager.autonomy_level
        stadium_state["actions_queue"] = agentic_manager.get_actions()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {"status": "updated", "autonomy_level": agentic_manager.autonomy_level}
    except Exception as e:
        logger.error(f"Error updating autonomy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/actions/{action_id}/approve")
async def post_approve_action(action_id: str):
    try:
        from backend.agents.agentic_core import agentic_manager
        agentic_manager.approve_action(action_id)
        stadium_state["actions_queue"] = agentic_manager.get_actions()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {"status": "approved", "action_id": action_id}
    except Exception as e:
        logger.error(f"Error approving action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/actions/{action_id}/deny")
async def post_deny_action(action_id: str):
    try:
        from backend.agents.agentic_core import agentic_manager
        agentic_manager.deny_action(action_id)
        stadium_state["actions_queue"] = agentic_manager.get_actions()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {"status": "denied", "action_id": action_id}
    except Exception as e:
        logger.error(f"Error denying action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/actions/deploy-plan")
async def post_deploy_plan(req: DeployPlanRequest):
    try:
        from backend.agents.agentic_core import agentic_manager
        agentic_manager.deploy_scenario_plan(req.plan_summary)
        stadium_state["actions_queue"] = agentic_manager.get_actions()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {"status": "deployed", "plan_summary": req.plan_summary}
    except Exception as e:
        logger.error(f"Error deploying simulated plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/resume")
async def post_resume():
    try:
        from backend.simulator import reset_simulator_to_live
        await reset_simulator_to_live()

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        return {"status": "resumed", "mode": "live"}
    except Exception as e:
        logger.error(f"Error resuming simulator to live: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/upload")
async def post_upload(file: UploadFile = File(...)):
    try:

        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
            
        content = await file.read()
        

        if len(content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 2MB.")
            
        df = pd.read_csv(io.BytesIO(content))
        df.columns = [c.strip().lower() for c in df.columns]
        
        if "gate" not in df.columns or "occupancy" not in df.columns or "queue" not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain columns: 'gate', 'occupancy', and 'queue'."
            )
            
        custom_gates = {}
        for idx, row in df.iterrows():
            g_val = str(row["gate"]).strip()
            if not g_val:
                continue
            gate_name = g_val if g_val.lower().startswith("gate") else f"Gate {g_val}"
            
            try:
                occupancy = int(row["occupancy"])
                queue = int(row["queue"])
                flow_rate = int(row.get("flow_rate", 10))
                

                if not (0 <= occupancy <= 100):
                    raise ValueError(f"Occupancy must be between 0 and 100 (got {occupancy})")
                if queue < 0:
                    raise ValueError(f"Queue size cannot be negative (got {queue})")
                if flow_rate < 0:
                    raise ValueError(f"Flow rate cannot be negative (got {flow_rate})")
            except (ValueError, TypeError) as val_err:
                raise HTTPException(
                    status_code=400,
                    detail=f"Malformed data on row {idx + 1}: {str(val_err)}"
                )
            
            custom_gates[gate_name] = {
                "occupancy": occupancy,
                "queue": queue,
                "flow_rate": flow_rate
            }
            
        custom_state = {
            "mode": "live",
            "timestamp": stadium_state["timestamp"],
            "match": stadium_state["match"],
            "gates": custom_gates,
            "parking": stadium_state["parking"],
            "weather": stadium_state["weather"],
            "incidents": [
                {
                    "id": "inc_upload_1",
                    "timestamp": stadium_state["timestamp"],
                    "type": "custom_data",
                    "title": "Uploaded Operational Snapshot Analysis",
                    "description": f"Analyzed custom CSV upload consisting of {len(custom_gates)} gate states.",
                    "priority": "Medium",
                    "status": "active"
                }
            ],
            "metro": stadium_state["metro"]
        }
        
        result = await asyncio.to_thread(orchestrator_agent.orchestrate, custom_state)
        

        from backend.agents.agentic_core import agentic_manager
        agentic_manager.calibration_diff = f"Gate B flow-rate threshold adjusted 15→18 p/m based on ingest of {len(custom_gates)} gate states."
        stadium_state["calibration_diff"] = agentic_manager.calibration_diff
        

        stadium_state["actions_queue"] = agentic_manager.get_actions()
        stadium_state["autonomy_level"] = agentic_manager.autonomy_level
        

        await manager.broadcast({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })

        return {
            "parsed_gates": custom_gates,
            "analysis": result
        }
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Error uploading and analyzing CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "state_sync",
            "tick": stadium_state.get("tick", 0),
            "state": stadium_state
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    import json
                    payload = json.loads(data)
                    if payload.get("type") == "reset_to_live":
                        from backend.simulator import reset_simulator_to_live
                        await reset_simulator_to_live()

                        await websocket.send_json({
                            "type": "state_sync",
                            "tick": stadium_state.get("tick", 0),
                            "state": stadium_state
                        })
                except Exception as e:
                    logger.error(f"Error handling socket text: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)