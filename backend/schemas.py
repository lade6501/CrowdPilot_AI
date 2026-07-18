from pydantic import BaseModel, Field

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
