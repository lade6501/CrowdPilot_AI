from fastapi import APIRouter
from backend.config import config

router = APIRouter()

@router.get("/api/status")
async def get_status():
    has_key = bool(config.GEMINI_API_KEY)
    return {
        "status": "healthy",
        "gemini_api_configured": has_key,
        "mode": "live" if has_key else "mock"
    }
