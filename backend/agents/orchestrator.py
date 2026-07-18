import logging
from pydantic import BaseModel, Field
from typing import List
from backend.agents.base import BaseAgent
from backend.agents.operations import operations_agent
from backend.agents.crowd import crowd_agent
from backend.agents.risk import risk_agent

logger = logging.getLogger("orchestrator")

class RecommendationItem(BaseModel):
    id: str = Field(..., description="Unique recommendation ID (e.g. rec_1)")
    title: str = Field(..., description="Short, bold title of recommendation")
    problem: str = Field(..., description="Specific problem identified")
    reason: str = Field(..., description="Deep explanation of why this is happening (X AI details)")
    suggested_action: str = Field(..., description="Clear action plan for organizers")
    expected_outcome: str = Field(..., description="Projected outcome and safety/traffic percentage improvements")
    confidence: int = Field(..., description="Confidence score percentage (0-100)")

class PrioritizedIncidentSummary(BaseModel):
    incident_id: str = Field(..., description="ID of the incident")
    title: str = Field(..., description="Title of the incident")
    priority: str = Field(..., description="Risk tier: 'Critical', 'High', 'Medium', or 'Low'")
    reasoning: str = Field(..., description="Brief explanation of why it fits this priority tier")

class OperationsSummary(BaseModel):
    overall_status: str = Field(..., description="Overall stadium state: 'normal', 'warning', or 'critical'")
    safety_index: float = Field(..., description="Stadium safety rating on a 0.0 to 10.0 scale")
    efficiency_score: int = Field(..., description="Operational efficiency score (0-100)")
    recommendations: List[RecommendationItem] = Field(..., description="Prioritized recommendations for organizers")
    prioritized_incidents: List[PrioritizedIncidentSummary] = Field(..., description="Timeline of incidents with their assessed priority")
    crowd_hotspots: List[str] = Field(..., description="List of sectors or gates currently experiencing heavy bottleneck risk")

class OrchestratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Central Orchestrator Agent",
            system_prompt=(
                "You are the Central Orchestrator Agent (AI COO) for CrowdPilot AI stadium operations. "
                "Your task is to coordinate the operations, crowd, and risk agents. "
                "Synthesize their reports along with raw stadium parameters (parking, weather, metro, gates) "
                "into a single, high-fidelity operational overview for stadium organizers. "
                "Provide detailed, explainable recommendations containing problems, safety-first justifications, "
                "action plans, and expected outcomes, with clear confidence scores."
            )
        )

    def orchestrate(self, stadium_state: dict) -> OperationsSummary:
        logger_ref = "Orchestrator dispatching tasks to specialists..."
        print(logger_ref)
        
        gates = stadium_state.get("gates", {})
        parking = stadium_state.get("parking", {})
        weather = stadium_state.get("weather", {})
        incidents = stadium_state.get("incidents", [])
        metro = stadium_state.get("metro", {})

        ops_report = operations_agent.analyze(gates)
        crowd_report = crowd_agent.analyze(gates, history=None)
        risk_report = risk_agent.analyze(incidents, weather, metro)

        synthesizer_prompt = (
            f"Raw Stadium State:\n"
            f"- Gates: {gates}\n"
            f"- Parking: {parking}\n"
            f"- Weather: {weather}\n"
            f"- Metro status: {metro}\n"
            f"- Incidents: {incidents}\n\n"
            f"Specialist Findings:\n"
            f"- Operations Report: {ops_report.model_dump_json()}\n"
            f"- Crowd Intelligence Report: {crowd_report.model_dump_json()}\n"
            f"- Risk Assessment Report: {risk_report.model_dump_json()}\n\n"
            f"Review the specialists' work, resolve any contradictions, and produce the final master Operations Summary."
        )

        try:
            return self.call_gemini_structured(synthesizer_prompt, OperationsSummary)
        except Exception as e:
            logger.error(f"Gemini API Error in Central Orchestrator: {e}. Activating mock fallback generator.")
            raise e

def get_best_detour_gate(src_gate: str, gates: dict) -> str:
    gate_options = [g for g in ["Gate A", "Gate B", "Gate C", "Gate D"] if g != src_gate]
    neighbors = {
        "Gate A": ["Gate B", "Gate D", "Gate C"],
        "Gate B": ["Gate A", "Gate C", "Gate D"],
        "Gate C": ["Gate B", "Gate D", "Gate A"],
        "Gate D": ["Gate A", "Gate C", "Gate B"]
    }
    src_neighbors = neighbors.get(src_gate, [])
    def sort_key(g):
        occ = gates.get(g, {}).get("occupancy", 0)
        is_safe = 0 if occ < 75 else 1
        dist_idx = src_neighbors.index(g) if g in src_neighbors else 99
        return (is_safe, occ, dist_idx)
    gate_options.sort(key=sort_key)
    return gate_options[0] if gate_options else "Gate D"

def get_mock_fallback_summary(stadium_state: dict) -> OperationsSummary:
    gates = stadium_state.get("gates", {})
    incidents = stadium_state.get("incidents", [])
    

    max_occ = max(g.get("occupancy", 0) for g in gates.values()) if gates else 0
    overall = "normal"
    if max_occ >= 90 or any(inc.get("status") == "active" and inc.get("priority") == "Critical" for inc in incidents):
        overall = "critical"
    elif max_occ >= 75 or any(inc.get("status") == "active" for inc in incidents):
        overall = "warning"
        
    safety = 9.8
    if overall == "critical":
        safety = 6.4
    elif overall == "warning":
        safety = 8.2
        
    efficiency = 92
    if overall == "critical":
        efficiency = 75
    elif overall == "warning":
        efficiency = 84

    recs = []
    for inc in incidents:
        if inc.get("status") == "active":
            inc_type = inc.get("type")
            inc_title = inc.get("title", "")
            
            if inc_type == "medical":
                recs.append(RecommendationItem(
                    id="rec_fallback_med",
                    title="Section 104 Triage",
                    problem="Spectator respiratory distress in Section 104",
                    reason="Elevated seat bowl temperatures coupled with high concourse load.",
                    suggested_action="Dispatch paramedic unit 3 with stretcher and ventilation gear. Clear east pathways.",
                    expected_outcome="Spectator stabilized. Safety index restored.",
                    confidence=95
                ))
            elif inc_type == "metro" or inc_type == "metro_delay":
                recs.append(RecommendationItem(
                    id="rec_fallback_metro",
                    title="Transit Shuttle Dispatch",
                    problem="Metro Line 2 Power Failure delay",
                    reason="Transit line signal node failure strands inbound commuters.",
                    suggested_action="Deploy 8 transit shuttle buses from South Parking Lot D to main station.",
                    expected_outcome="Transit delay minimized. Flow stabilized.",
                    confidence=90
                ))
            elif inc_type == "weather" or inc_type == "storm_warning":
                recs.append(RecommendationItem(
                    id="rec_fallback_weather",
                    title="Storm Plaza Evacuation",
                    problem="Severe lightning warnings within 5km radius",
                    reason="Lightning strike hazards pose extreme risks to uncovered plazas.",
                    suggested_action="Clear plaza sectors. Direct fans to covered inner concourse areas.",
                    expected_outcome="100% spectator shelter compliance achieved.",
                    confidence=94
                ))
            elif "vip" in inc_title.lower() or inc_type == "facility" and "vip" in inc_title.lower():
                recs.append(RecommendationItem(
                    id="rec_fallback_vip",
                    title="VIP Route Corridor Lockdown",
                    problem="Dignitary arrival transit blockages",
                    reason="VIP security protocols require temporary east corridor clearances.",
                    suggested_action="Deploy security barricades. Direct incoming fans to western gates.",
                    expected_outcome="Corridor cleared for dignitary motorcade transit.",
                    confidence=96
                ))
            elif "fire" in inc_title.lower() or inc_type == "facility" and "fire" in inc_title.lower():
                recs.append(RecommendationItem(
                    id="rec_fallback_fire",
                    title="Gate B Evacuation",
                    problem="Fire Alarm active on South Concourse level 2",
                    reason="Active smoke alarm restricts spectator routing at Gate B.",
                    suggested_action="Close Gate B corridors. Redirect flow to Gate D. Deploy shuttle buses.",
                    expected_outcome="31% reduction in crowd bottlenecks. Safe evacuation.",
                    confidence=98
                ))


    for g_name, g_data in gates.items():
        g_occ = g_data.get("occupancy", 0)
        if g_occ >= 90:
            is_fire_g = g_name == "Gate B" and any("fire" in inc.get("title", "").lower() for inc in incidents)
            if not is_fire_g:
                target_alt = get_best_detour_gate(g_name, gates)
                recs.append(RecommendationItem(
                    id=f"rec_fallback_{g_name.lower().replace(' ', '_')}",
                    title=f"{g_name} Congestion Diversion",
                    problem=f"{g_name} load at critical peak capacity ({g_occ}%)",
                    reason=f"High arrival volume at {g_name} corridor is creating a severe queue.",
                    suggested_action=f"Reroute incoming traffic from {g_name} to {target_alt}. Update digital billboard messages.",
                    expected_outcome=f"{g_name} occupancy reduced by 20% in 2 ticks.",
                    confidence=92 if g_name != "Gate B" else 74
                ))

    if not recs:
        recs.append(RecommendationItem(
            id="rec_fallback_normal",
            title="Telemetry Load Balancer",
            problem="Normal spectator waves at entrance gates",
            reason="Arrival flow velocity is balanced across all four gate nodes.",
            suggested_action="Maintain current ingress settings. Continue standard sensor monitoring.",
            expected_outcome="Optimal operations entry flow rates preserved.",
            confidence=98
        ))

    prioritized = []
    for inc in incidents:
        prioritized.append(PrioritizedIncidentSummary(
            incident_id=inc.get("id", "inc_1"),
            title=inc.get("title", "Incident"),
            priority=inc.get("priority", "Medium"),
            reasoning="Assembled and assessed via operational backup guidelines."
        ))

    return OperationsSummary(
        overall_status=overall,
        safety_index=safety,
        efficiency_score=efficiency,
        recommendations=recs,
        prioritized_incidents=prioritized,
        crowd_hotspots=[g for g, v in gates.items() if v.get("occupancy", 0) >= 75]
    )

orchestrator_agent = OrchestratorAgent()