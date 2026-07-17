from pydantic import BaseModel, Field
from typing import List
from backend.agents.base import BaseAgent

class GateAssessment(BaseModel):
    gate_name: str = Field(..., description="Name of the gate, e.g. Gate A, Gate B")
    status: str = Field(..., description="Status category: 'normal', 'warning', or 'critical'")
    occupancy_percent: int = Field(..., description="Current occupancy level (percentage)")
    queue_length: int = Field(..., description="Current count of people in queue")
    assessment: str = Field(..., description="Short explanation of how this gate is performing")

class OperationsReport(BaseModel):
    critical_bottlenecks: List[str] = Field(..., description="List of immediate bottlenecks or capacity issues identified")
    gate_assessments: List[GateAssessment] = Field(..., description="Performance assessment for each stadium entry gate")
    operational_efficiency_score: int = Field(..., description="Overall operational score from 0 (critical) to 100 (perfect)")

class OperationsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Operations Specialist",
            system_prompt=(
                "You are the Operations Specialist Agent for CrowdPilot AI. "
                "Your role is to analyze current stadium gate statistics (occupancy levels, queue sizes, flow rates). "
                "Evaluate operational efficiency, identify active bottlenecks, and tag each gate with an operational "
                "status: 'normal' (<75% occupancy), 'warning' (75%-89%), or 'critical' (>=90%)."
            )
        )

    def analyze(self, gates_data: dict) -> OperationsReport:
        prompt = f"Analyze the following real-time gate occupancy data and generate a detailed operations report:\n{gates_data}"
        return self.call_gemini_structured(prompt, OperationsReport)
        

operations_agent = OperationsAgent()