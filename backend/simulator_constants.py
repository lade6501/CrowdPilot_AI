KICKOFF_TICK = 4
HALFTIME_TICK = 11
LATE_MATCH_TICK = 22
GATE_OCCUPANCY_MIN = 10
GATE_OCCUPANCY_MAX = 98
SAFETY_IDX_NOMINAL = 9.8
SAFETY_IDX_WARNING = 7.2
SAFETY_IDX_CRITICAL = 5.2
EFFICIENCY_BASELINE = 92
EFFICIENCY_MIN = 40
WEATHER_REFRESH_INTERVAL = 15

ADJACENT_GATE = {
    "Gate A": "Gate B",
    "Gate B": "Gate D",
    "Gate C": "Gate D",
    "Gate D": "Gate B",
}

REPLAY_PRESETS = {
    "7:00 PM": {
        "tick": 1,
        "mode": "replay",
        "timestamp": "19:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "Pre-match",
            "detail": "Warm-ups underway. Stadium gates opening."
        },
        "gates": {
            "Gate A": {"occupancy": 25, "queue": 2, "flow_rate": 6},
            "Gate B": {"occupancy": 30, "queue": 3, "flow_rate": 8},
            "Gate C": {"occupancy": 15, "queue": 1, "flow_rate": 4},
            "Gate D": {"occupancy": 18, "queue": 1, "flow_rate": 5}
        },
        "parking": {
            "Lot A": {"occupancy": 45, "capacity": 2000},
            "Lot B": {"occupancy": 30, "capacity": 1500},
            "Lot C": {"occupancy": 15, "capacity": 3000},
            "Lot D": {"occupancy": 10, "capacity": 2500}
        },
        "weather": {
            "condition": "Clear",
            "temp": 28,
            "humidity": 70,
            "wind_speed": 10,
            "alerts": []
        },
        "incidents": [],
        "metro": {
            "status": "On Time",
            "delay_minutes": 0,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "7:30 PM": {
        "tick": 5,
        "mode": "replay",
        "timestamp": "19:30:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "0 - 0",
            "time_label": "15'",
            "detail": "First half underway. Steady spectator inflow."
        },
        "gates": {
            "Gate A": {"occupancy": 55, "queue": 8, "flow_rate": 14},
            "Gate B": {"occupancy": 75, "queue": 14, "flow_rate": 18},
            "Gate C": {"occupancy": 40, "queue": 5, "flow_rate": 10},
            "Gate D": {"occupancy": 45, "queue": 6, "flow_rate": 11}
        },
        "parking": {
            "Lot A": {"occupancy": 78, "capacity": 2000},
            "Lot B": {"occupancy": 62, "capacity": 1500},
            "Lot C": {"occupancy": 35, "capacity": 3000},
            "Lot D": {"occupancy": 22, "capacity": 2500}
        },
        "weather": {
            "condition": "Cloudy",
            "temp": 27,
            "humidity": 75,
            "wind_speed": 12,
            "alerts": []
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 78% capacity. Safety officers redirecting flows.",
                "priority": "Medium",
                "status": "active"
            }
        ],
        "metro": {
            "status": "On Time",
            "delay_minutes": 0,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "8:00 PM": {
        "tick": 10,
        "mode": "replay",
        "timestamp": "20:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "1 - 0",
            "time_label": "Halftime",
            "detail": "USA scores! Halftime surge inside concourses."
        },
        "gates": {
            "Gate A": {"occupancy": 68, "queue": 12, "flow_rate": 15},
            "Gate B": {"occupancy": 92, "queue": 28, "flow_rate": 20},
            "Gate C": {"occupancy": 44, "queue": 6, "flow_rate": 11},
            "Gate D": {"occupancy": 48, "queue": 7, "flow_rate": 12}
        },
        "parking": {
            "Lot A": {"occupancy": 96, "capacity": 2000},
            "Lot B": {"occupancy": 88, "capacity": 1500},
            "Lot C": {"occupancy": 45, "capacity": 3000},
            "Lot D": {"occupancy": 30, "capacity": 2500}
        },
        "weather": {
            "condition": "Heavy Rain Warning",
            "temp": 25,
            "humidity": 90,
            "wind_speed": 22,
            "alerts": ["Heavy rain expected in 12 minutes"]
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 96% capacity. Redirecting to Lot C.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_metro_1",
                "timestamp": "19:54:10",
                "type": "metro_delay",
                "title": "Metro Line 2 Delays",
                "description": "Metro Line 2 experiencing a 10-minute signal delay at University Station.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_med_1",
                "timestamp": "19:56:45",
                "type": "medical",
                "title": "Medical Incident - Section 104",
                "description": "Spectator fainted in Section 104 due to heat. First aid team dispatched.",
                "priority": "Critical",
                "status": "active"
            }
        ],
        "metro": {
            "status": "Delayed",
            "delay_minutes": 10,
            "line": "Line 2 (Stadium Express)"
        }
    },
    "9:00 PM": {
        "tick": 15,
        "mode": "replay",
        "timestamp": "21:00:00",
        "match": {
            "teams": "USA vs Mexico",
            "score": "2 - 1",
            "time_label": "85'",
            "detail": "Tense final minutes! Early exiting flows starting."
        },
        "gates": {
            "Gate A": {"occupancy": 12, "queue": 1, "flow_rate": 2},
            "Gate B": {"occupancy": 15, "queue": 1, "flow_rate": 3},
            "Gate C": {"occupancy": 10, "queue": 1, "flow_rate": 1},
            "Gate D": {"occupancy": 12, "queue": 1, "flow_rate": 2}
        },
        "parking": {
            "Lot A": {"occupancy": 96, "capacity": 2000},
            "Lot B": {"occupancy": 90, "capacity": 1500},
            "Lot C": {"occupancy": 50, "capacity": 3000},
            "Lot D": {"occupancy": 32, "capacity": 2500}
        },
        "weather": {
            "condition": "Thunderstorm",
            "temp": 23,
            "humidity": 95,
            "wind_speed": 28,
            "alerts": ["Severe thunderstorm overhead. Seek shelter inside concourses."]
        },
        "incidents": [
            {
                "id": "inc_lot_a",
                "timestamp": "19:25:00",
                "type": "parking_full",
                "title": "Lot A Near Capacity",
                "description": "Parking Lot A is at 96% capacity.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_metro_1",
                "timestamp": "19:54:10",
                "type": "metro_delay",
                "title": "Metro Line 2 Delays",
                "description": "Metro Line 2 experiencing a 12-minute signal delay.",
                "priority": "Medium",
                "status": "active"
            },
            {
                "id": "inc_child_1",
                "timestamp": "20:48:22",
                "type": "lost_child",
                "title": "Lost Child - West Concourse",
                "description": "7-year-old child wearing a blue Colombia jersey separated near Gate C.",
                "priority": "Critical",
                "status": "active"
            }
        ],
        "metro": {
            "status": "Delayed",
            "delay_minutes": 12,
            "line": "Line 2 (Stadium Express)"
        }
    }
}
