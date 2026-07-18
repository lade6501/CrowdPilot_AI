AGENT_REGISTRY = [
    {
        "id": "crowd_flow",
        "name": "Crowd Flow Agent",
        "scope": "Reads gate occupancy, queue size, and flow velocity.",
        "tools": ["propose_gate_rerouting", "propose_directional_signage", "propose_gate_closure"],
        "riskLevel": "Medium"
    },
    {
        "id": "incident_response",
        "name": "Incident Response Agent",
        "scope": "Perceives active hazards, coordinates severity and priority assessment.",
        "tools": ["triage_incident", "escalate_response"],
        "riskLevel": "Medium"
    },
    {
        "id": "comms",
        "name": "Comms Agent",
        "scope": "Drafts multilingual PA broadcasts, push alerts, and stadium warnings.",
        "tools": ["generate_announcement", "broadcast_to_crew"],
        "riskLevel": "Low"
    },
    {
        "id": "logistics",
        "name": "Logistics Agent",
        "scope": "Reads transit metrics, shuttle availability, and parking capacities.",
        "tools": ["deploy_shuttle_buses", "adjust_parking_inflow"],
        "riskLevel": "Medium"
    },
    {
        "id": "dispatch",
        "name": "Dispatch Agent",
        "scope": "Assigns stewards, medical personnel, and response teams to specific stadium coordinates.",
        "tools": ["dispatch_medic_team", "dispatch_steward_team"],
        "riskLevel": "Low"
    },
    {
        "id": "governance",
        "name": "Governance Agent",
        "scope": "Reviews other agents' proposed actions against stadium policy rules before execution.",
        "tools": ["policy_compliance_check", "override_actions"],
        "riskLevel": "High"
    }
]
