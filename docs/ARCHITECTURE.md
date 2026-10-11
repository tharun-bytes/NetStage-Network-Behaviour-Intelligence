# NetSage Architecture Documentation

## 1. System Overview
NetSage is structured as a decoupled, multi-tier intelligence application:
- **Presentation Layer**: Single Page Application (SPA) built with React 19, TypeScript (strict type checking), Vite, Tailwind CSS, Lucide icons, and Recharts.
- **Service & API Layer**: High-performance REST API built with FastAPI and Pydantic v2 schemas under `/api/v1`.
- **Data Engineering & ML Layer**: Modular Python data validation, scikit-learn preprocessing pipelines, multi-class classifiers (Dummy, Logistic Regression, Random Forest, XGBoost), unsupervised Isolation Forest anomaly detection, and explainable AI attribution engines.

```
┌─────────────────────────────────────────────────────────────┐
│                       NetSage Web UI                        │
│             (React 19 / TypeScript / Vite / Recharts)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Core                     │
│    (/api/v1/health, /datasets, /models, /predictions, ...)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Data Engineering        │ │    Machine Learning Core   │
│  - CSV Loader & Sanitize     │ │  - Train Pipeline (Sklearn)│
│  - Schema Profiler & Quality │ │  - Unsupervised IsoForest  │
│  - Imputation & Scalers      │ │  - XAI Attribution Engine  │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│         data/ Storage        │ │        models/ Disk        │
│  - UCI RT-IoT2022 Fixtures   │ │  - <model_id>.joblib       │
│  - User Uploaded Flow CSVs   │ │  - <model_id>_metadata.json│
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Component Boundaries & Responsibilities

### Frontend Boundary
- **State Management**: Encapsulated in `AppContext.tsx`, providing centralized access to active dataset profiles, registered models, notifications, and loading flags.
- **Decoupled API Client**: `api/client.ts` centralizes all HTTP communication, mapping responses to strict TypeScript domain models and translating backend errors into user-friendly messages.
- **No Client-side ML Execution**: All statistical models, probability distributions, anomaly flags, and SHAP/tree attributions are computed on the backend server and transmitted as verified analytical JSON payloads.

### Backend Boundary
- **Pydantic Validation**: All inputs and outputs are validated with Pydantic models with bounded ranges and strict type constraints.
- **In-Memory Session State**: `AppState` caches active dataset DataFrames, trained Pipelines, and Isolation Forest instances for fast interactive exploration.
- **Artifact Isolation**: Persisted model artifacts are written to `models/` with synchronized metadata. Models are loaded safely from local disk rather than deserializing arbitrary remote inputs.

---

## 3. Data Processing & ML Pipeline Lifecycle

```
[Raw Flow CSV]
      │
      ▼
[src/data/loader.py] ──> Validates format, sizes, utf-8 / latin-1 fallback
      │
      ▼
[src/data/validation.py] ──> Checks nulls, infs, negative rates, class imbalance, leakage
      │
      ▼
[src/data/preprocessing.py]
      │
      ├─► Numerical: InfiniteCleaner ──► Median Imputer ──► StandardScaler/RobustScaler
      └─► Categorical: Most Frequent Imputer ──► OneHotEncoder (handle_unknown='ignore')
      │
      ▼
[scikit-learn Pipeline]
      │
      ├─► Model Training: Stratified Train/Test Split (80/20) + 5-Fold Stratified CV
      ├─► Evaluation: Accuracy, Balanced Acc, Macro/Weighted F1, Confusion Matrix
      ├─► Anomaly Detection: Unsupervised Isolation Forest (Label-free fitting)
      └─► Explainability: MDI Tree Weights / Coefficients + Local Flow Attribution
```

---

## 4. Error-Handling Strategy
1. **Never Fail Silently**: All errors raise explicit exceptions (`DataLoaderError`, `SchemaValidationError`, `PredictionError`, `AnomalyDetectionError`).
2. **Safe HTTP Mapping**: Custom exception handlers map domain exceptions to specific HTTP status codes (400 for invalid CSV formatting or missing schema features, 404 for missing models/datasets, 413 for oversized payloads).
3. **No Sensitive Stack Trace Exposure**: Uncaught system exceptions log complete tracebacks to server logs while returning structured, sanitized JSON error payloads to clients.

---

## 5. AI Security Copilot Architecture
- **Grounded Context Injection**: The copilot engine (`src/copilot/engine.py`) operates on structured context dictionaries extracted directly from active dataset distributions, classifier evaluation metrics, and Isolation Forest anomaly records.
- **Zero Hallucination Guardrails**: Prompts are constrained to real telemetry facts. If asked about features or devices not present in the ingested dataset, the engine explicitly reports the boundary limitation.
- **Deterministic Rule-Based Intelligence**: When no commercial LLM API key (e.g. Gemini, OpenAI) is configured, the copilot executes a deterministic expert system that calculates actual statistical deviations, risk ratings, and recommended defensive actions.

---

## 6. Multi-Agent Autonomous Forensic Pipeline
The platform implements a sequential 3-agent orchestration state machine (`src/agents/orchestrator.py`):

```
[Ingested Telemetry]
        │
        ▼
[Stage 1: Traffic Analyst Agent]
  - Filters candidate flows exceeding anomaly threshold
  - Aggregates protocol and service breakdowns
  - Hands off flagged candidate flow subset
        │
        ▼
[Stage 2: Investigation Agent]
  - Computes distribution baseline shifts (mean, std)
  - Identifies top divergent flow features
  - Compiles comprehensive evidence dossier
        │
        ▼
[Stage 3: Reporting Agent]
  - Synthesizes forensic findings into executive briefing
  - Assigns calibrated risk ratings (Low, Medium, High, Critical)
  - Produces downloadable Markdown and JSON forensic reports
```

All agent executions maintain full audit traces with step statuses (`pending` → `running` → `completed`), timestamps, and artifact download endpoints.

