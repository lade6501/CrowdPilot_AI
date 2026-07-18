STATE_SYNC_TYPE = "state_sync"

def state_sync_payload() -> dict:
    from backend.simulator import stadium_state
    return {
        "type": STATE_SYNC_TYPE,
        "tick": stadium_state.get("tick", 0),
        "state": stadium_state,
    }

async def broadcast_state_sync() -> None:
    from backend.simulator import manager
    await manager.broadcast(state_sync_payload())

def sync_agentic_state() -> None:
    from backend.agents.agentic_core import agentic_manager
    from backend.simulator import stadium_state
    stadium_state["actions_queue"] = agentic_manager.get_actions()
    stadium_state["autonomy_level"] = agentic_manager.autonomy_level
