# CrowdPilot AI - Testing & Verification Documentation

This project contains a comprehensive automated testing suite covering the core backend simulator logic, agentic state triggers, compliance governance policies, and file ingestion validations.

---

## 1. How to Run Tests

### Prerequisites
Ensure your virtual environment is active and all required test packages are installed:

```bash
# Navigate to the project root
cd /Users/vishal/Documents/CrowdPilot

# Install test utilities if not present
./venv/bin/pip install pytest httpx
```

### Running the Test Suite
Run all tests using the virtual environment's `pytest`:

```bash
# Execute all backend tests
./venv/bin/pytest backend/test_main.py backend/test_agentic.py
```

---

## 2. Test Coverage Details

The test suite is split across two major test files:

### A. Core API Integrations (`backend/test_main.py`)
Verifies standard REST endpoints for responsiveness, correct validation handles, and state scrubbing actions:
* **API Health check:** `/api/status` returns `200` and config status.
* **Control Event Injector:** `/api/inject` correctly registers valid incidents (e.g. `medical`, `fire_alarm`) and rejects invalid events.
* **Replay Scrubbing:** `/api/replay` scrubbing updates modes and shifts simulated clocks.
* **Payload Validation:** Ensures invalid request bodies to endpoint hooks return `422` status codes.

### B. Agentic Rules & Governance (`backend/test_agentic.py`)
Verifies the internal logic of the autonomous agent loops, compliance checking policies, and data ingress validation:
* **Occupancy/Queue Threshold Logic:** Validates that the Crowd Flow Agent perceives gate telemetry independently and triggers proposal actions *only* when gate occupancy crosses $\ge 90\%$.
* **Governance Emergency Overrides:** Asserts that medical and fire emergency alerts bypass autonomy levels and force the action status into `pending` for manual human operator approval.
* **Max-Simultaneous-Closures Policy:** Verifies that Policy 1 correctly blocks and marks subsequent gate closure proposals as `failed_governance` to prevent stadium exits from bottlenecking.
* **Dataset Ingress CSV Ingestion:**
  * Checks that valid CSVs parse into correct state occupancies.
  * Asserts that malformed CSV rows (e.g. occupancy values $> 100\%$ or negative queue bounds) trigger `400 Bad Request` warnings.
  * Verifies missing column headers are rejected with descriptive messages.

---

## 3. Out of Scope / Mocking Strategy

* **Generative AI Mocks:** Real requests to the Gemini API (`google.generativeai`) are mocked out in the test suite (`test_agentic.py`). This guarantees tests run instantly, execute locally in offline environments, and do not consume any project rate limits or quotas.
* **Asynchronous Task Mocks:** Async loops like `run_governance_review` are tested using isolated synchronous execution scopes or mocked task parameters to prevent event loop binding conflicts during pytest sessions.
