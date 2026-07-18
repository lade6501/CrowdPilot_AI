import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.simulator import manager, start_simulator_loop, reset_simulator_to_live
from backend.services.state_sync import state_sync_payload

from backend.api.status import router as status_router
from backend.api.simulation import router as simulation_router
from backend.api.actions import router as actions_router
from backend.api.replay import router as replay_router
from backend.api.upload import router as upload_router
from backend.api.translation import router as translation_router
from backend.api.autonomy import router as autonomy_router

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO)

def raise_endpoint_error(message: str, error: Exception) -> None:
    logger.error("%s: %s", message, error)
    raise HTTPException(status_code=500, detail=str(error))

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
    allow_origins=["https://crowd-pilot-ai-nine.vercel.app", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status_router)
app.include_router(simulation_router)
app.include_router(actions_router)
app.include_router(replay_router)
app.include_router(upload_router)
app.include_router(translation_router)
app.include_router(autonomy_router)

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json(state_sync_payload())
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    import json
                    payload = json.loads(data)
                    if payload.get("type") == "reset_to_live":
                        await reset_simulator_to_live()
                        await websocket.send_json(state_sync_payload())
                except Exception as error:
                    logger.error("Error handling socket text: %s", error)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as error:
        logger.error("WebSocket error: %s", error)
        manager.disconnect(websocket)
