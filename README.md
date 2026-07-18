# 🏟️ CrowdPilot AI

<div align="center">

### AI-Powered Digital Twin for FIFA World Cup 2026 Stadium Operations

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Three.js](https://img.shields.io/badge/Three.js-Digital_Twin-black?logo=threedotjs)](https://threejs.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-success)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PromptWars](https://img.shields.io/badge/PromptWars-2026-purple)]()

**CrowdPilot AI** is an agentic AI platform that helps stadium operators monitor, predict, and respond to crowd situations in real time using a Digital Twin, multi-agent AI, and live telemetry — closing the loop from perception all the way to a verified operational outcome, not just a recommendation.

🔗 **Live Demo:** [crowd-pilot-ai-nine.vercel.app](https://crowd-pilot-ai-nine.vercel.app/)

</div>

---

## 🏆 PromptWars 2026 Submission

**Vertical:** Smart Stadiums & Tournament Operations (FIFA World Cup 2026)

The FIFA World Cup 2026 will bring unprecedented crowd density across 16 venues in 3 countries. CrowdPilot AI directly targets the challenge's core ask — a GenAI solution that improves crowd management, accessibility support, multilingual assistance, and real-time decision support for organizers, operators, and stadium staff during live tournament operations.

### ✨ Key Features

- 🧠 **Multi-Agent AI Orchestrator:** Specialized agents for crowd flow, incident response, logistics, communications, and governance collaborate dynamically to reason over live state.
- 🏟️ **Live 2D & 3D Digital Twin:** A tactical SVG view and an isometric React Three Fiber view render flow particles, predicted spillover arcs, and live response-unit navigation.
- 📡 **Real-Time WebSocket Telemetry:** Gate densities, parking occupancy, weather conditions, transit status, and incident states stream directly from the simulator into every connected client.
- 🚨 **AI Incident Response & Simulation:** Triage panels for emergencies such as fires, storms, medical dispatches, and VIP lockdowns with instant scenario forecasting.
- 📈 **Predictive Crowd Analytics:** Automated forecasting of spillover between gates before it happens, enabling pre-positioning instead of reaction.
- ♿ **Dynamic Accessibility Operations:** Accessibility status is tracked per gate and mirrored across the 2D and 3D views. When congestion rises, mobility carts and wheelchair companion lines are rerouted to adjacent gates automatically.
- 🛡️ **Governance Shield & SLA Lockout:** A policy layer reviews proposed actions before execution, blocks unsafe combinations, and escalates critical breaches to operator approval.
- 🗣️ **Multilingual, TTS-Enabled Communications:** PA announcements are drafted for incident context and audience tone, then read aloud via the Web Speech API in English, Spanish, French, or Hindi.
- 🌦️ **Live Weather & Parking Signals:** Weather and parking data feed into the same agentic perception pipeline as gate telemetry, so external disruptions can trigger the same governed response workflow.
- 🔁 **Historical Replay Timeline:** Temporal scrubbing across match snapshots lets operators review how conditions evolved over time.

---

## 🏗️ Architecture

```text
        React + TypeScript
                │
       REST API + WebSockets
                │
        FastAPI Backend
                │
      AI Orchestrator (Gemini)
                │
 ┌──────────────┼──────────────┐
 │              │              │
Crowd      Incident      Logistics
 Agent        Agent         Agent
 │              │              │
 └──────────────┼──────────────┘
                │
         Governance Shield
                │
      Digital Twin Simulator
```

### Component Roles & Logic

- **FastAPI Backend Gateway (`backend/main.py`):** Central server interface for replay scrubbing, autonomy changes, plan deployment, and WebSocket management.
- **Telemetry Simulator (`backend/simulator.py`):** Runs deterministic local state updates for inflow, parking load, weather, transit, and SLA timers in the background.
- **Agentic Queue Manager (`backend/agents/agentic_core.py`):** Drives multi-agent perception loops, queues mitigation proposals, runs governance checks, and verifies action results.
- **UI Command Console (`frontend/src/`):** Renders the interactive SVG twin and React Three Fiber 3D digital twin from a single shared WebSocket-backed state store.

---

## 🤖 AI Decision Workflow

```text
Observe → Analyze → Predict → Recommend → Governance Check → Execute → Verify
```

1. **Observe:** Continuous telemetry analysis of gate capacities, parking, weather, and safety indices.
2. **Analyze & Predict:** Detect bottlenecks, active threats, and cascading spillover before thresholds are breached.
3. **Recommend:** Assemble mitigation plans such as signage reroutes, backup transport, steward positioning, and accessibility rerouting.
4. **Governance Check:** Verify every proposed action against safety policies before it is allowed to execute.
5. **Execute:** Dispatch units, publish announcements, and update live state — either automatically or after explicit operator approval.
6. **Verify:** Audit the resulting telemetry so the system confirms a real improvement rather than assuming success.

---

## 🛠️ Tech Stack

| Frontend      | Backend      | AI              | Visualization     |
| ------------- | ------------ | --------------- | ----------------- |
| React 19      | FastAPI      | Google Gemini   | SVG Digital Twin  |
| TypeScript    | Python 3.11+ | Multi-Agent AI  | React Three Fiber |
| Tailwind CSS  | WebSockets   | AI Orchestrator | Three.js          |
| Framer Motion | Uvicorn      | Web Speech API  | OrbitControls     |

---

## 🚀 Getting Started

### Backend Setup

1. **Configure Environment Variables:** Create a `.env` file inside `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
SIMULATION_TICK_INTERVAL=0 # Set to override loop speed (seconds). 0 defaults to dev (4s) / prod (12s)
SLA_BREACH_THRESHOLD=0     # Set to override SLA breach timer (seconds). 0 defaults to dev (20s) / prod (60s)
```

2. **Run Backend Gateway:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Server runs at `http://localhost:8000`.

### Frontend Setup

1. **Run Client Console:**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🎯 Why CrowdPilot AI?

Unlike traditional dashboards that only display metrics, **CrowdPilot AI** explains:

- ✅ **What's happening:** Real-time crowd, weather, and parking mapping with incident coordinates.
- 🔍 **Why it's happening:** Structural breakdown of capacity metrics and contributing signals.
- 📈 **What will happen next:** Multi-gate cascading overflow prediction before thresholds are breached.
- 🤖 **What action should be taken:** Drafted PA announcements, responder dispatch coordinates, and accessibility rerouting.
- 🛡️ **Why the recommendation is safe:** Direct compliance reporting via the Governance Shield.
- ♿ **Who needs extra support:** Live accessibility-operations status per gate, so mobility-impaired spectators are never routed into a congested corridor.

Helping operators make faster, safer, and AI-assisted decisions during live stadium operations.

---

## 📂 Project Structure

```text
CrowdPilot/
├── backend/
│   ├── agents/          # Multi-Agent logic, governance policy, and risk constraints
│   ├── main.py          # FastAPI Gateway routes
│   └── simulator.py     # Deterministic simulation loops + live weather/parking feeds
├── frontend/
│   ├── src/
│   │   ├── components/  # 2D/3D map, gate cards, timelines, dashboards
│   │   ├── context/     # React state and WebSocket hook
│   │   └── utils/       # Translations and shared helpers
└── README.md
```

---

## 🎯 Assumptions Made

- **Gate Adjacency Network:** Stadium entrances are arranged in a circular perimeter network (Gate A connected to B/D, B to A/C, C to B/D, D to A/C). Crowds rerouted from a blocked gate are pushed to the nearest adjacent gate with available capacity.
- **Autonomy & SLA Constraints:** A gate occupancy ≥ 90% is treated as a critical threat. The safety SLA response window is 20 seconds in local development and 60 seconds in cloud production, after which an unresolved critical gate auto-escalates and requires manual operator override.
- **Accessibility Trigger Threshold:** Accessibility-routing warnings trigger at a lower, more conservative threshold (≥ 75% occupancy) than the general critical-gate threshold (≥ 90%), assuming mobility-impaired spectators need earlier intervention.
- **Token & Cost Optimizations:** Complex reasoning analysis is manually triggered by the operator on-demand ("Run AI Analysis"), while simple telemetry threshold checks run locally on every tick at effectively no cost.
- **Privacy Controls:** Incoming spectator telemetry is assumed pre-aggregated at gate transit points and contains no personally identifiable information (PII).

---

## 🔒 Security & Safe Practices

- **CORS Access Protections:** CORS rules are strictly locked down to the production domain and local development server (`http://localhost:5173` and `https://crowd-pilot-ai-nine.vercel.app`), preventing malicious cross-origin requests.
- **Sanitized React Nodes:** The UI uses standard JSX bindings throughout, mitigating Cross-Site Scripting (XSS) by preventing injection of unescaped text.
- **No Database Exposure:** All simulation steps are managed in-memory with strict Pydantic model schemas, eliminating SQL Injection (SQLi) risk.
- **Governed Action Execution:** No AI-proposed action mutates simulation state directly — every action passes through the Governance Shield's policy whitelist first.
- **Secrets Management:** API keys (`GEMINI_API_KEY`, `OPENWEATHER_API_KEY`) are read from environment variables only and are never committed to the repository.

---

## 🧪 Code Quality & Build Status

- ✅ **TypeScript Build:** Successful, strict mode.
- ✅ **Linter:** `0 warnings`, `0 errors` (verified via `oxlint`).
- ✅ **Backend Tests:** `12 / 12` passed (`pytest`) — covering occupancy threshold logic, governance policy checks, and telemetry parsing.

---

## 📸 Screenshots

### Immersive 3D Digital Twin (Presentation Mode)

[![CrowdPilot Command View](docs/screenshot.png)](docs/screenshot.png)

---

## 📜 License

MIT License
