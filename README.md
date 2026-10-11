# NetSage AI — Network Behaviour Intelligence & Explainable ML Platform

[![Python Version](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Repository](https://img.shields.io/badge/GitHub-NetSage%20AI-181717.svg?logo=github)](https://github.com/tharun-bytes/NetStage-Network-Behaviour-Intelligence)

**NetSage AI** is an enterprise-grade, explainable machine learning platform and autonomous AI forensic system engineered for deep network-flow telemetry profiling, multi-class cyber attack classification, unsupervised outlier detection, and LLM-powered defensive investigations on IoT transport traffic (calibrated for the **UCI RT-IoT2022** benchmark).

---

## 1. Executive Summary & Vision

Modern smart environments, edge industrial networks (SCADA/ICS), and consumer IoT device fleets generate high-velocity bidirectional network-flow telemetry. Conventional signature-based intrusion detection systems (IDS) fail against zero-day reconnaissance and polymorphic volumetric attacks, while black-box deep learning architectures leave security operations center (SOC) analysts with opaque alerts and zero interpretable rationale.

**NetSage AI** bridges this gap with an explainable, defensive cyber intelligence platform:

1. **Statistical Flow Telemetry Profiling**: Automatically ingests, validates, and profiles network flow records with data hygiene audits (duplicate detection, infinite value guards, and cross-feature correlation matrices).
2. **Supervised Multi-Class Attack Classification**: Accurately classifies traffic into authentic categories (*DOS SYN Flooding*, *ARP Poisoning*, *NMAP Reconnaissance*, *Metasploit Brute Force*, and *Normal Benign IoT Messaging*).
3. **Unsupervised Outlier Scoring**: Deploys label-free **Isolation Forests** to detect novel behavioral anomalies without label bias.
4. **Explainable AI (XAI)**: Generates global feature importance rankings (MDI) and local single-flow decision driver breakdowns accompanied by human-readable narrative summaries.
5. **AI Security Copilot**: Conversational analyst powered by **Google Gemini** (`gemini-3.5-flash`), grounded in live telemetry profiles, model evaluations, and inspected flow records, backed by a deterministic fallback engine.
6. **Multi-Agent Forensic Investigation Pipeline**: Coordinated 3-agent autonomous workflow (**Traffic Analyst** → **Investigation Agent** → **Reporting Agent**) outputting downloadable Markdown and JSON forensic audit dossiers.
7. **Production Authentication Subsystem**: Google OAuth (Identity Services) and salted PBKDF2-HMAC-SHA256 password hashing with JWT session persistence and One-Click Demo Analyst Access.
8. **Defensive Security Architecture**: Strict zero-leakage data pipelines (IP addresses, MACs, flow IDs automatically stripped) and zero metric fabrication.

---

## 2. Core Capabilities & Architecture

### Full-Stack Architecture Diagram

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │                   NetSage AI Web UI                    │
                                 │   React 19 • TypeScript • Vite • Tailwind • Recharts   │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ REST / JSON (JWT Bearer)
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │                 FastAPI Backend Service                │
                                 │       Modular Routers • Pydantic v2 • Scikit-Learn     │
                                 └────────┬──────────────────┬───────────────────┬────────┘
                                          │                  │                   │
                     ┌────────────────────┴─────┐   ┌────────┴──────────┐   ┌────┴────────────────────┐
                     │   Data & ML Pipeline     │   │  Auth & Sessions  │   │  AI Copilot & Agents    │
                     ├──────────────────────────┤   ├───────────────────┤   ├─────────────────────────┤
                     │ • ColumnTransformer      │   │ • Google OAuth    │   │ • Google Gemini LLM     │
                     │ • RobustScaler + Imputer │   │ • PBKDF2 Hashing  │   │ • Telemetry Grounding   │
                     │ • Random Forest / XGBoost│   │ • JWT Bearer Auth │   │ • Multi-Turn Memory     │
                     │ • Isolation Forest Anom  │   │ • Demo Access     │   │ • 3-Agent Orchestrator  │
                     │ • Local / Global XAI     │   │ • Users Registry  │   │ • Deterministic Fallback│
                     └──────────────────────────┘   └───────────────────┘   └─────────────────────────┘
```

---

## 3. Technology Stack

### Frontend Command Center
* **Framework**: React 19 with strict TypeScript
* **Styling & Theme**: Tailwind CSS with custom cyber palette:
  * Midnight Navy (`#050816`), Deep Blue (`#0B1024`), Electric Cyan (`#22D3EE`), Muted Slate
* **Visualizations**: Recharts interactive analytical charts (class distribution bars, pie breakdowns, anomaly score histograms, confusion matrices, and feature attribution waterfalls)
* **Custom Visual Assets**: Original dark cyberpunk background artwork across all 11 application tabs (`hero-bg.jpg`, `dashboard-bg.jpg`, `dataset-bg.jpg`, `traffic-bg.jpg`, `models-bg.jpg`, `anomaly-bg.jpg`, `xai-bg.jpg`, `agents-bg.jpg`, `reports-bg.jpg`, `copilot-bg.jpg`)
* **State & Networking**: Centralized React Context (`AppContext`, `AuthContext`) + Axios/Fetch client with interceptors for JWT token injection.

### Backend Analytical Engine
* **Web Framework**: FastAPI with Uvicorn ASGI runtime & CORS middleware
* **Validation & Schemas**: Pydantic v2 schemas across all 10 API route domains
* **Machine Learning**: Scikit-learn (Pipelines, ColumnTransformer, RobustScaler, SimpleImputer, Isolation Forest), XGBoost, SHAP
* **Authentication**: PBKDF2-HMAC-SHA256 password hashing (100,000 rounds + 16-byte random salt), JWT (`HS256`, 24h validity), and Google token verification via `oauth2.googleapis.com`
* **AI Copilot**: Google Gemini API (`gemini-3.5-flash` with multi-model fallback to `gemini-3.8-flash` and `gemini-flash-latest`) + grounded prompt synthesis + user-isolated conversation persistence in `data/conversations/`
* **Testing & Quality**: Pytest with automated test client, Vitest with React Testing Library

---

## 4. Repository Structure

```
NetSage/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point & router mounting
│   │   ├── config.py            # Environment settings & directory paths
│   │   ├── state.py             # In-memory telemetry cache & active model state
│   │   ├── auth.py              # PBKDF2 hashing, JWT signing, Google token verification
│   │   ├── routes/              # Modular REST API endpoints (/api/v1)
│   │   │   ├── auth.py          # /google, /register, /login, /me, /logout, /forgot-password
│   │   │   ├── health.py        # /health and /status endpoints
│   │   │   ├── datasets.py      # /sample, /upload, /records, /export
│   │   │   ├── models.py        # /train, /metrics, /activate
│   │   │   ├── predictions.py   # /single and /batch inference
│   │   │   ├── anomalies.py     # /detect (Isolation Forest)
│   │   │   ├── explanations.py  # /global and /local XAI attributions
│   │   │   ├── reports.py       # Consolidated exportable summaries
│   │   │   ├── copilot.py       # /copilot/chat with Gemini & conversational history
│   │   │   └── investigations.py# Multi-agent autonomous workflow & report generation
│   │   └── schemas/             # Pydantic v2 validation contracts
│   ├── requirements.txt
│   └── tests/                   # 22 automated Pytest test cases
├── frontend/
│   ├── public/
│   │   └── assets/netsage/      # 10 original high-res visual backgrounds & brand mark
│   ├── src/
│   │   ├── pages/               # 12 Core views
│   │   │   ├── HeroLandingPage.tsx      # Public landing page with cyber command visuals
│   │   │   ├── LoginPage.tsx            # Google sign-in, email login, and Demo Access
│   │   │   ├── SignupPage.tsx           # Account registration with password meter
│   │   │   ├── OverviewPage.tsx         # Telemetry dashboard & quick dataset ingestion
│   │   │   ├── TrafficExplorerPage.tsx  # Filterable flow records data grid
│   │   │   ├── ClassificationPage.tsx   # Single & batch attack prediction
│   │   │   ├── AnomalyAnalysisPage.tsx  # Unsupervised Isolation Forest outlier scores
│   │   │   ├── ExplainabilityPage.tsx   # Global & local feature attribution waterfalls
│   │   │   ├── AICopilotPage.tsx        # Dedicated Conversational Security Analyst
│   │   │   ├── AIAgentControlPage.tsx   # 3-Agent autonomous forensic orchestration
│   │   │   ├── ModelLabPage.tsx         # Model training & multi-class confusion matrices
│   │   │   ├── ReportsHistoryPage.tsx   # Audit trail & downloadable Markdown/JSON reports
│   │   │   ├── DataManagementPage.tsx   # UCI RT-IoT2022 ingestion & validation
│   │   │   └── SettingsAboutPage.tsx    # Analyst profile, model cards & system status
│   │   ├── context/
│   │   │   ├── AppContext.tsx           # Telemetry, models & anomaly state
│   │   │   └── AuthContext.tsx          # User profile, JWT token & demo session
│   │   ├── components/
│   │   │   ├── common/FloatingCopilotWidget.tsx  # Application-wide AI copilot popup
│   │   │   ├── common/PageBackground.tsx        # Theme background art renderer
│   │   │   └── auth/ForgotPasswordModal.tsx     # Simulated password recovery
│   │   ├── api/client.ts                # Strongly typed REST client with Bearer auth
│   │   └── types/index.ts               # Complete TypeScript interfaces
│   ├── package.json
│   └── vitest.config.ts                 # Vitest testing configuration
├── src/
│   ├── data/                    # Loader, Schema Validator, Preprocessing Pipeline
│   ├── ml/                      # Train Pipeline, Metrics, Predictions, Isolation Forest, XAI
│   ├── agents/                  # Traffic Analyst, Investigation Agent, Reporting Agent
│   └── copilot/                 # Grounded Gemini engine with deterministic fallback & tools
├── data/                        # Sample UCI RT-IoT2022 dataset fixture (1,200 flows)
├── models/                      # Versioned model artifacts
├── docs/                        # ARCHITECTURE.md, MODEL_CARD.md
├── scripts/                     # setup_env.bat, run_backend.bat, run_frontend.bat
├── .env.example                 # Sanitized environment template
└── pytest.ini                   # Pytest configuration
```

---

## 5. Quickstart & Installation

### Prerequisites
* **Python**: 3.11, 3.12, or 3.13
* **Node.js**: v18+ and npm
* **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/tharun-bytes/NetStage-Network-Behaviour-Intelligence.git
cd NetStage-Network-Behaviour-Intelligence
```

### 2. Environment Configuration
Copy the template configuration to `.env`:
```bash
copy .env.example .env
```
Open `.env` and configure your credentials:
```env
# Google Gemini API Key (obtain from https://aistudio.google.com/)
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-3.5-flash
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# Google OAuth Client ID (optional, for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# JWT Secret Key
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Backend Setup
```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 4. Frontend Setup
```powershell
cd frontend
npm install
cd ..
```

---

## 6. Running the Application

### Option 1: Automated Launch Scripts (Windows)
Open two PowerShell terminals:
```powershell
# Terminal 1: Backend API (http://127.0.0.1:8000)
.\scripts\run_backend.bat

# Terminal 2: Frontend Web App (http://127.0.0.1:5173)
.\scripts\run_frontend.bat
```

### Option 2: Direct Shell Execution
```powershell
# Terminal 1: Backend
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

* **Frontend Web App**: **[http://127.0.0.1:5173](http://127.0.0.1:5173)**
* **Backend API Docs (Swagger)**: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
* **API Health Check**: **[http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)**

---

## 7. Authentication & Login Options

When accessing the frontend:

1. **One-Click Demo Access**:
   - On the Sign In page, click **"Quick Demo Access"** to immediately sign in as **Lead Security Analyst** (`analyst.demo@netsage.ai` / `DemoAnalyst2026!`). No manual setup or registration needed.
2. **Google Identity Services**:
   - Click **"Continue with Google"** to authenticate via Google OAuth. ID tokens are verified server-side with user avatars and emails imported automatically.
3. **Standard Registration**:
   - Create a local analyst account via `/signup` with real-time password strength validation.

---

## 8. Guided Feature Tour

1. **Ingest Verified Telemetry**:
   - On the **Overview** page or **Data Management** tab, click **"Load UCI RT-IoT2022 Fixture"** to instantly ingest 1,200 verified flows across 10 attack/benign traffic profiles.
2. **Train an Explainable Classifier**:
   - Navigate to **Model Lab** and click **"Train Model"** on **Random Forest** or **XGBoost**. The system executes an 80/20 stratified split with holdout metrics and per-class confusion matrices.
3. **Unsupervised Outlier Profiling**:
   - Open **Anomaly Analysis** to run the **Isolation Forest** detector, visualize score distribution histograms, and inspect flagged structural deviations.
4. **Inspect Local Decision Drivers**:
   - In **Explainability (XAI)**, view global feature rankings (MDI) or click any individual flow in the **Traffic Explorer** to generate local waterfall attributions.
5. **Chat with AI Security Copilot**:
   - Open the **AI Copilot** tab or the floating widget in the bottom-right corner. Ask:
     - *"Analyze my active dataset and highlight anomalies."*
     - *"What features caused the model to flag flow #42?"*
     - *"Generate a comprehensive forensic report."*
6. **Execute Autonomous Multi-Agent Investigation**:
   - Navigate to **AI Agent Control** and click **"Run Autonomous Investigation"**. Watch the sequential 3-agent pipeline compile findings, quantify risk ratings, and export downloadable Markdown and JSON forensic audit reports.

---

## 9. Automated Testing & Verification

### Backend Tests (pytest)
Runs 22 comprehensive unit and integration tests across data validation, schema guards, model training, anomaly detection, authentication endpoints, and copilot reasoning:
```powershell
.\venv\Scripts\pytest.exe backend/tests -v
```
```
backend\tests\test_api.py ..........                                     [ 45%]
backend\tests\test_auth.py ..                                            [ 54%]
backend\tests\test_data.py .....                                         [ 77%]
backend\tests\test_ml.py .....                                           [100%]
======================= 22 passed, 1 warning in 21.42s ========================
```

### Frontend Tests (vitest)
Runs 9 component, routing, authentication, and state management tests:
```powershell
cd frontend
npm test -- --run
```
```
✓ src/test/App.test.tsx (3 tests)
✓ src/test/Auth.test.tsx (6 tests)
Test Files  2 passed (2) | Tests 9 passed (9)
```

### Production Build Verification
Verifies strict TypeScript compilation and production asset bundling:
```powershell
cd frontend
npm run build
```
```
vite v8.3.4 building client environment for production...
✓ 2505 modules transformed.
dist/index.html                   0.52 kB │ gzip:   0.33 kB
dist/assets/index-D7UeUa1c.css   62.18 kB │ gzip:  10.45 kB
dist/assets/index-BLVp348r.js   785.12 kB │ gzip: 221.80 kB
✓ built in 1.21s (0 errors)
```

---

## 10. Defensive Principles & Security Boundaries

* **Passive Metadata Analysis**: NetSage AI analyzes flow metadata summaries (Zeek, NetFlow, IPFIX, or CSV logs). It contains zero exploit code, scanning mechanisms, or packet injection scripts.
* **Zero Data Leakage**: Sensitive network identifiers (`id.orig_h`, `id.resp_h`, `id.orig_p`, `mac_addr`, `flow_id`) are stripped before model training to eliminate memorization of specific network hosts.
* **Transparent Explainability**: Every machine learning classification provides continuous feature attributions so that analysts never execute defensive actions without evidence.
* **Credential Protection**: Server-side credentials (`LLM_API_KEY`, `JWT_SECRET`) are kept strictly in server environments and are never exposed in client bundles or log outputs.

---

## 11. Author & License

Developed by **[Tharun](https://github.com/tharun-bytes)** as an enterprise-grade portfolio project demonstrating machine learning engineering, cybersecurity data analytics, explainable AI, and full-stack software architecture.

Released under the **[MIT License](LICENSE)**.
