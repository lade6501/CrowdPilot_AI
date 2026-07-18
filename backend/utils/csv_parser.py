import io
import pandas as pd
from fastapi import HTTPException

REQUIRED_CSV_COLUMNS = {"gate", "occupancy", "queue"}

def normalize_gate_name(value: object) -> str:
    gate_value = str(value).strip()
    if not gate_value:
        return ""
    return gate_value if gate_value.lower().startswith("gate") else f"Gate {gate_value}"

def parse_csv_gate_row(row_index: object, row: pd.Series) -> tuple[str, dict]:
    gate_name = normalize_gate_name(row["gate"])
    if not gate_name:
        return "", {}

    try:
        occupancy = int(row["occupancy"]) # type: ignore
        queue = int(row["queue"]) # type: ignore
        flow_rate = int(row.get("flow_rate", 10)) # type: ignore
        if not (0 <= occupancy <= 100):
            raise ValueError(f"Occupancy must be between 0 and 100 (got {occupancy})")
        if queue < 0:
            raise ValueError(f"Queue size cannot be negative (got {queue})")
        if flow_rate < 0:
            raise ValueError(f"Flow rate cannot be negative (got {flow_rate})")
    except (ValueError, TypeError) as validation_error:
        raise HTTPException(
            status_code=400,
            detail=f"Malformed data on row {row_index}: {validation_error}",
        )

    return gate_name, {
        "occupancy": occupancy,
        "queue": queue,
        "flow_rate": flow_rate,
    }

def parse_gate_csv(content: bytes) -> dict:
    dataframe = pd.read_csv(io.BytesIO(content))
    dataframe.columns = [column.strip().lower() for column in dataframe.columns]
    if not REQUIRED_CSV_COLUMNS.issubset(dataframe.columns):
        raise HTTPException(
            status_code=400,
            detail="CSV must contain columns: 'gate', 'occupancy', and 'queue'.",
        )

    custom_gates = {}
    for row_index, row in dataframe.iterrows():
        gate_name, gate_metrics = parse_csv_gate_row(row_index, row)
        if gate_name:
            custom_gates[gate_name] = gate_metrics
    return custom_gates

def build_uploaded_state(custom_gates: dict) -> dict:
    from backend.simulator import stadium_state
    return {
        "mode": "live",
        "timestamp": stadium_state["timestamp"],
        "match": stadium_state["match"],
        "gates": custom_gates,
        "parking": stadium_state["parking"],
        "weather": stadium_state["weather"],
        "incidents": [
            {
                "id": "inc_upload_1",
                "timestamp": stadium_state["timestamp"],
                "type": "custom_data",
                "title": "Uploaded Operational Snapshot Analysis",
                "description": f"Analyzed custom CSV upload consisting of {len(custom_gates)} gate states.",
                "priority": "Medium",
                "status": "active",
            }
        ],
        "metro": stadium_state["metro"],
    }
