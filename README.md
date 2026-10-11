# NetSage AI — Network Behaviour Intelligence & Explainable ML Platform

[![Python Version](https://img.shields.io/badge/python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade, explainable machine learning and autonomous AI forensic platform engineered for deep behavioral telemetry profiling, multi-class cyber attack classification, unsupervised anomaly detection, and AI-assisted investigation on IoT network flows (calibrated for the **UCI RT-IoT2022** dataset).

---

## 1. Problem Statement & Vision
Modern smart homes, industrial supervisory control systems (SCADA), and IoT device fleets generate vast volumes of bidirectional transport flows. Conventional signature-based intrusion detection systems frequently fail against novel reconnaissance or volumetric floods, while black-box deep learning models provide zero interpretable reasoning for security operations center (SOC) analysts.

**NetSage AI** bridges this gap by providing:
1. **Statistical Flow Telemetry Profiling**: Ingests, validates, and profiles network flow summaries with automated data hygiene audits (duplicate detection, infinite value guards, and collinear feature matrices).
2. **Multi-Class Attack Classification**: Classifies flows into genuine categories (e.g. *DOS SYN Flooding*, *ARP Poisoning*, *NMAP Reconnaissance*, *Metasploit Brute Force*, and *Normal Benign IoT Messaging*).
3. **Unsupervised Anomaly Scoring**: Deploys label-free **Isolation Forests** to isolate rare structural behavioral deviations without bias from target labels.
4. **Explainable AI (XAI)**: Generates global feature importance rankings and local single-flow decision driver breakdowns accompanied by deterministic natural-language summaries.
5. **AI Security Copilot**: Grounded natural-language conversational assistant that answers analyst queries using verified dataset profiles, classifier metrics, and anomaly scores.
6. **Multi-Agent Forensic Investigation Pipeline**: Coordinated 3-agent autonomous workflow (**Traffic Analyst** → **Investigation Agent** → **Reporting Agent**) producing downloadable Markdown and JSON forensic dossiers.
7. **Defensive Data Architecture**: Zero data leakage (IP addresses, MACs, packet IDs excluded from feature matrices) and zero metric fabrication.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with strict TypeScript
- **Bundler & Tooling**: Vite 8, Tailwind CSS, Lucide Icons
- **Visualizations**: Recharts analytical charts (class distribution bars, pie breakdowns, anomaly score histograms, confusion matrices, and feature importance rankings)
- **Visual Assets**: 8 original high-resolution technical illustrations (`hero-network.jpg`, `network-topology.jpg`, `ai-analysis-core.jpg`, `anomaly-shield.jpg`, `dataset-upload.jpg`, `report-audit.jpg`, `netsage-mark.jpg`, `grid-texture.jpg`)
- **Design System**: Enterprise Dark Theme with graphite surfaces (`#0a0d14`), navy cards (`#111827`), cyan accents (`#06b6d4`), violet AI accents (`#8b5cf6`), and high-contrast monospace indicators.

### Backend
- **Core Server**: FastAPI with Uvicorn ASGI runtime
- **Validation**: Strict Pydantic v2 schemas across all requests and responses
- **Machine Learning**: Scikit-learn (Pipelines, ColumnTransformer, RobustScaler, SimpleImputer, Isolation Forest), XGBoost, SHAP
- **Multi-Agent Engine**: Sequential state orchestrator managing agent lifecycles, evidence collection, and forensic report generation
- **Artifacts**: Safe model persistence via Joblib compression and synchronized JSON metadata tracking dataset fingerprints.

---

## 3. Architecture Overview

```
NetSage/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point, CORS & router mounting
│   │   ├── config.py            # Global paths, limits & environment settings
│   │   ├── state.py             # In-memory session & artifact manager
│   │   ├── routes/              # Modular REST API endpoints (/api/v1)
│   │   │   ├── health.py        # /health and /status endpoints
│   │   │   ├── datasets.py      # /upload, /sample, /profile, /records, /export
│   │   │   ├── models.py        # /train, /metrics, /activate
│   │   │   ├── predictions.py   # /single and /batch inference
│   │   │   ├── anomalies.py     # /detect (Isolation Forest)
│   │   │   ├── explanations.py  # /global and /local XAI attributions
│   │   │   ├── reports.py       # Consolidated exportable intelligence summaries
│   │   │   ├── copilot.py       # /copilot/chat grounded conversational assistant
│   │   │   └── investigations.py# /investigations/start, /investigations, /reports/{id}
│   │   └── schemas/             # Strict Pydantic request/response models
│   ├── requirements.txt
│   └── tests/                   # Pytest automated test suite (19 test cases)
├── frontend/
│   ├── public/
│   │   └── assets/netsage/      # 8 original high-res visual assets & brand mark
│   ├── src/
│   │   ├── pages/               # 11 Core analytical views
│   │   │   ├── OverviewPage.tsx         # Telemetry Overview & Hero Banner
│   │   │   ├── TrafficExplorerPage.tsx  # Interactive filterable flow table
│   │   │   ├── ClassificationPage.tsx   # Single & batch inference with confidence
│   │   │   ├── AnomalyAnalysisPage.tsx  # Unsupervised Isolation Forest scoring
│   │   │   ├── ExplainabilityPage.tsx   # Global & local feature attribution
│   │   │   ├── AICopilotPage.tsx        # Conversational security assistant
│   │   │   ├── AIAgentControlPage.tsx   # 3-Agent autonomous forensic workflow
│   │   │   ├── ModelLabPage.tsx         # Model evaluation & confusion matrices
│   │   │   ├── ReportsHistoryPage.tsx   # Audit trail & downloadable reports
│   │   │   ├── DataManagementPage.tsx   # UCI RT-IoT2022 ingestion & validation
│   │   │   └── SettingsAboutPage.tsx    # Model cards & ethical guidelines
│   │   ├── context/AppContext.tsx       # Global telemetry & model state
│   │   ├── api/client.ts                # Strongly typed REST client
│   │   └── components/
│   ├── package.json
│   └── vitest.config.ts                 # Vitest & React Testing Library suite
├── src/
│   ├── data/                    # Loader, Schema Validator, Preprocessing Pipeline, Fixture Generator
│   ├── ml/                      # Train Pipeline, Metrics, Predictions, Isolation Forest, Explainability
│   ├── agents/                  # Traffic Analyst, Investigation Agent, Reporting Agent, Orchestrator
│   └── copilot/                 # Grounded reasoning engine with deterministic fallback
├── notebooks/                   # 01_exploratory_data_analysis.ipynb
├── data/                        # Dataset documentation & sample CSVs
├── models/                      # Versioned model artifacts (<model_id>.joblib & metadata.json)
├── docs/                        # ARCHITECTURE.md, MODEL_CARD.md
└── scripts/                     # setup_env.bat, run_backend.bat, run_frontend.bat
```

---

## 4. Quickstart & Installation

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Node.js v18+ and npm

### 1. Automated Setup (Windows)
```powershell
.\scripts\setup_env.bat
```

### 2. Manual Step-by-Step Setup

**Step A: Backend Environment**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r backend/requirements.txt
```

**Step B: Frontend Environment**
```powershell
cd frontend
npm install
cd ..
```

---

## 5. Running the Application

### Option 1: Using Startup Scripts
In separate PowerShell terminals:
```powershell
# Terminal 1: Backend API (runs on http://localhost:8000)
.\scripts\run_backend.bat

# Terminal 2: Frontend Web App (runs on http://localhost:5173)
.\scripts\run_frontend.bat
```

### Option 2: Direct Execution
```powershell
# Terminal 1:
.\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2:
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**. The interactive Swagger API documentation is available at **`http://localhost:8000/docs`**.

---

## 6. Running Automated Tests

### Backend Tests (pytest)
Runs 19 automated unit and integration tests across data validation, preprocessing, model training, anomaly detection, copilot reasoning, and multi-agent orchestration:
```powershell
.\venv\Scripts\pytest.exe -v
```
*Result: 19 passed in ~3.7s*

### Frontend Tests (vitest)
Runs UI integration and render tests:
```powershell
cd frontend
npm run test -- --run
```
*Result: 3 passed in ~3.9s*

### Frontend Production Build
Verifies strict TypeScript compilation and production asset bundling:
```powershell
cd frontend
npm run build
```
*Result: 2,501 modules transformed, `dist/` bundle created with zero errors.*

---

## 7. Multi-Agent Forensic Investigation Workflow

NetSage AI features an autonomous 3-agent sequential investigation pipeline:

1. **Traffic Analyst Agent (`TrafficAnalystAgent`)**:
   - Ingests raw telemetry and computes global protocol and service breakdowns.
   - Filters candidate high-risk flows using Isolation Forest outlier thresholding.
   - Isolates suspicious flow signatures for deep forensic handoff.

2. **Forensic Investigation Agent (`ForensicInvestigationAgent`)**:
   - Compares candidate anomalous flows against normal baseline distributions.
   - Computes empirical feature divergence ratios (e.g. packet frequency, header inflation, payload ratios).
   - Generates an evidence dossier with flagged candidate flow attributes.

3. **Forensic Reporting Agent (`ForensicReportingAgent`)**:
   - Synthesizes findings into an executive intelligence summary.
   - Assigns structured risk ratings (*Low*, *Medium*, *High*, *Critical*).
   - Generates tailored defensive mitigation playbooks and outputs downloadable Markdown and JSON forensic reports.

---

## 8. Defensive Security Principles & Ethical Boundaries
- **Passive Flow Analysis**: NetSage operates exclusively on exported flow metadata (e.g. Zeek, NetFlow, IPFIX, or CSV summaries). It contains zero exploit code, scanning utilities, or packet injection tools.
- **Zero Data Leakage**: Identifier columns (`id.orig_h`, `id.resp_h`, `id.orig_p`, `mac_addr`, `flow_id`) are stripped before feature transformations to prevent memorization of specific endpoints.
- **Explainability First**: Every prediction includes feature attribution drivers so that SOC operators never make blocking decisions based on uninterpretable model outputs.

---

## 9. Author & License
Developed as a portfolio project demonstrating machine learning, explainability, software architecture, and full-stack cybersecurity data analytics.

Released under the **MIT License**.
