# CrowdPilot AI - FIFA Stadium Operations Copilot

CrowdPilot AI is an agentic, policy-governed stadium operations decision engine designed for event organizers managing crowd flow at the FIFA World Cup 2026. It monitors live gates, parking telemetry, weather reports, and transit logs to predict congestion surges, resolve emergency incidents, and verify mitigation efforts. By closing the loop between Perception ➔ Reasoning ➔ Action ➔ Verification, CrowdPilot transforms raw telemetry into verified, real-time stadium resilience.

---

## 1. Technical Architecture & Component Roles

The system is organized into a modular decoupled architecture:

```
[Web UI Dashboard] <====== WebSockets (State Sync) ======> [FastAPI Server]
        ||                                                      ||
        || (Trigger UI Decisions)                               || (Tick updates / active effects)
        \/                                                      \/
[Orchestrator Agent] <==== calls sub-agents ====> [Simulation Loop (stadium_state)]
        ||                                                      ||
        || (Formulates recommendations)                         || (Evaluates triggers)
        \/                                                      \/
[Governance Shield Check] <==== policy constraints ====> [Agentic Queue (agentic_core)]
```

### Core Components
* **FastAPI Backend Gateway (`backend/main.py`):** Acts as the centralized API server, hosting REST endpoints for incidents, actions execution, plan deployment, and timeline replay, as well as managing active client WebSocket streams.
* **Telemetry Simulation Loop (`backend/simulator.py`):** Executes cheap, local state updates (random walk spectator inflows, metro delays, active assets tracking, and countdown tickers) on a 4-second loop without blocking operations on expensive LLM calls.
* **Agentic Queue Manager (`backend/agents/agentic_core.py`):** Holds the registry of active operational agents, perceives gate load anomalies, posts proposed interventions, reviews policies via the Governance Agent, and tracks post-mitigation verification audits.
* **Specialized AI Agents (`backend/agents/`):**
  * `Crowd Flow Agent`: Predicts gate overloads and cascading gate spillovers.
  * `Incident Response Agent`: Triages medical/emergency incidents and delegates coordinates.
  * `Comms Agent`: Localizes translations into English, Spanish, French, Portuguese, and Hindi.
  * `Logistics Agent`: Dispatches backup shuttles and coordinates transit lines.
  * `Governance Agent`: Safeguards actions against safety threshold policies.
* **Interactive UI Dashboard (`frontend/src/`):** A high-fidelity, multilingual visual command console rendering active alerts, a dynamic SVG digital twin representation with moving asset animations, autonomy selectors, and the agentic action queue.

---

## 2. Key Design Decisions

### Manual "Run AI Analysis" Trigger (Rate-Limit Protection)
To ensure optimal resource efficiency, the central `Orchestrator Agent` does not poll or request LLM reasoning on every tick of the simulator. Since LLM tokens and reasoning API calls have high operational costs and strict rate limits, AI-driven synthesis is only invoked upon:
1. **Explicit User Interaction:** When the operator clicks the "Run AI Analysis" button.
2. **Telemetry Ingress Calibration:** When a custom data snapshot is uploaded.
3. **Hypothetical What-If Planning:** When solutions are simulated inside the Scenario panel.
All local state evaluations (such as critical gate count indices and SLA countdowns) run on cheap, local deterministic rules.

### Governance Shield Isolation
No action proposed by any agent is executed directly on the simulator state. All proposals must pass through the compliance check block of the `Governance Agent`. If a proposal violates rules (such. as closing multiple gates simultaneously), the action is blocked (`failed_governance`) and requires manual operator override.

---

## 3. Setup and Installation

### 1. Environment Variables
Create a `.env` file inside the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Server runs at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your web browser.

---

## 4. Testing & Verification
We maintain a test suite verifying core API routes and agent governance behaviors. Please refer to [TESTING.md](file:///Users/vishal/Documents/CrowdPilot/TESTING.md) for full execution instructions, test descriptions, and mock setup guides.

```bash
# To execute tests
./venv/bin/pytest backend/test_main.py backend/test_agentic.py
```

---

## 5. Data & Privacy
CrowdPilot AI operates strictly on aggregated numerical telemetry (occupancy percentages, queue sizes, flow rates, and lot capacities). The system does not ingest, track, or maintain any personally identifiable information (PII) of individual spectators, maintaining strict privacy compliance with international event venue regulations.
