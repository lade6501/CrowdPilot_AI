from pydantic import BaseModel, Field
from typing import List
from backend.agents.base import BaseAgent

class CrowdPrediction(BaseModel):
    gate_name: str = Field(..., description="Name of the gate")
    arrival_trend: str = Field(..., description="Arrival rate trend: 'escalating', 'stable', or 'decelerating'")
    projected_occupancy_15m: int = Field(..., description="Predicted occupancy percentage in 15 minutes")
    projected_queue_time_mins: int = Field(..., description="Projected queue wait time in minutes")
    time_to_critical_mins: int = Field(..., description="Estimated minutes until occupancy exceeds safe threshold (>85%). Set to -1 if safe or stable.")
    crowd_behavior_notes: str = Field(..., description="Analysis notes regarding spectator inflow patterns and crowd density behaviors")

class CrowdIntelligenceReport(BaseModel):
    predictions: List[CrowdPrediction] = Field(..., description="Congestion predictions per gate")
    congested_hotspots: List[str] = Field(..., description="Specific zones or plazas projected to experience severe crowding")
    general_crowd_risk_level: str = Field(..., description="General crowd safety risk level: 'Low', 'Medium', 'High', or 'Critical'")

class CrowdIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Crowd Intelligence Specialist",
            system_prompt=(
                "You are the Crowd Intelligence Specialist Agent for CrowdPilot AI. "
                "Your role is to run predictive crowd analytics. "
                "Analyze queue growth, arrival trends, and calculate estimated queue wait times. "
                "Identify where congestion hotspots are forming and predict how long organizers have "
                "before crowd densities reach unsafe capacity levels."
            )
        )

    def analyze(self, gates_data: dict, history: list | None = None) -> CrowdIntelligenceReport:
        prompt = (
            f"Analyze the current gates data:\n{gates_data}\n"
            f"Historical trend context (if any):\n{history}\n"
            "Predict gate congestion patterns and calculate queue times."
        )
        return self.call_gemini_structured(prompt, CrowdIntelligenceReport)

crowd_agent = CrowdIntelligenceAgent()