from pydantic import BaseModel, Field
from typing import List
from backend.agents.base import BaseAgent

class PrioritizedIncident(BaseModel):
    incident_id: str = Field(..., description="ID of the incident")
    title: str = Field(..., description="Title of the incident")
    priority: str = Field(..., description="Assigned priority: 'Critical', 'High', 'Medium', or 'Low'")
    reasoning: str = Field(..., description="Explanation of why this priority was assigned (safety, traffic, flow implications)")
    mitigation_urgency: str = Field(..., description="Urgency of action: 'Immediate', 'Prompt', 'Scheduled', or 'Monitor'")

class RiskReport(BaseModel):
    prioritized_incidents: List[PrioritizedIncident] = Field(..., description="List of incidents prioritized by threat level")
    stadium_safety_threat_index: float = Field(..., description="Overall risk threat score for the stadium (0.0 to 10.0)")
    critical_vulnerabilities: List[str] = Field(..., description="Summary of current vulnerabilities affecting stadium operations (e.g. weather, transport delays)")

class RiskAssessmentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Risk Assessment Specialist",
            system_prompt=(
                "You are the Risk Assessment Specialist Agent for CrowdPilot AI. "
                "Your role is to assess operational, weather, facilities, medical, and crowd risk. "
                "Evaluate incoming incidents and assign standard priority levels: 'Critical' (life safety, severe capacity loss), "
                "'High' (escalating crowding, delays, adverse weather warnings), "
                "'Medium' (localized minor delays, standard facility faults), or "
                "'Low' (minor details, routine maintenance). Provide justifications for each assessment."
            )
        )

    def analyze(self, incidents: list, weather: dict, metro: dict) -> RiskReport:
        prompt = (
            f"Analyze the safety threat level based on the following logs:\n"
            f"Active Incidents: {incidents}\n"
            f"Weather Data: {weather}\n"
            f"Metro Transit Status: {metro}\n\n"
            "Assess risk, prioritize all incidents, and evaluate the overall safety threat index (0.0 - 10.0)."
        )
        return self.call_gemini_structured(prompt, RiskReport)

risk_agent = RiskAssessmentAgent()