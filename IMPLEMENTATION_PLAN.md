# NetSage Implementation Plan — Network Behaviour Intelligence & Explainable ML Platform

## Executive Summary
NetSage is a production-grade, explainable machine-learning platform designed for analyzing IoT network-flow records (modeled around the UCI RT-IoT2022 dataset). It delivers exploratory data analysis, multi-class flow classification, unsupervised anomaly detection (Isolation Forest), interpretable feature-level explainability (global and local SHAP / Tree-based importance), model evaluation benchmarks, and defensive network intelligence reporting.

---

## 1. Architecture Overview

### Backend (Python 3.13 / FastAPI)
- **FastAPI Core**: Modular REST API with `/api/v1` routes for datasets, models, predictions, anomalies, explainability, and reports.
- **Data Engineering**: Robust CSV loader, schema validator, missing value handling, feature engineering, and profile generator (`src/data/`).
- **Machine Learning**:
  - Baseline Dummy Classifier
  - Regularized Multinomial Logistic Regression
  - Random Forest Classifier (with tree feature contributions)
  - Optional XGBoost Classifier (with graceful fallback if binaries unavailable)
  - Unsupervised Isolation Forest Anomaly Detector
  - Model evaluation with Confusion Matrix, PR-AUC, per-class Precision/Recall/F1, and zero-division guards.
  - Explainability module implementing local feature attribution and global importance.
  - Model artifact persistence (`joblib` + JSON metadata containing dataset fingerprints, feature schemas, hyperparameters, and metrics).
- **Safety**: Safe local file handling, Pydantic strict schemas, zero arbitrary code execution, no hardcoded secrets.

### Frontend (React 18 / TypeScript / Vite / Tailwind CSS)
- **Theme**: Premium Cybersecurity Dark Theme (deep navy surfaces, graphite backgrounds, cyan/violet accents, high-contrast monospace indicators, subtle borders).
- **Analytical Visualizations**: Recharts integration for class distributions, confusion matrices, ROC/PR curves, anomaly score histograms, and waterfall/bar feature importance charts.
- **8 Core Analytical Views**:
  1. `Overview`: Dataset composition, class balance, live model status, KPI counters.
  2. `Traffic Explorer`: Filterable, searchable, paginated flow records, feature correlations, distribution inspector, CSV export.
  3. `Classification`: Multi-model inference, batch CSV upload with schema compatibility checking, manual single-flow parameter probe, class confidence outputs.
  4. `Anomaly Analysis`: Isolation Forest score distributions, tunable contamination thresholds, flagged suspicious flows, baseline feature deviations.
  5. `Model Lab`: Multi-model head-to-head comparison, confusion matrices, per-class radar/bar performance, training duration, and split provenance.
  6. `Explainability`: Global feature importance ranking, individual prediction explanations, plain-language deterministic reasoning summaries.
  7. `Data Management`: UCI RT-IoT2022 ingestion instructions, dataset health & profiling report, schema validator, model artifact inspector.
  8. `Settings / About`: Architecture notes, model card summary, dataset attribution, local runtime diagnostics, limitations and defensive principles.

---

## 2. API Contract Specification (`/api/v1`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | GET | Backend health status, runtime information, system uptime |
| `/api/v1/status` | GET | Active dataset metadata, loaded model artifacts, ready flags |
| `/api/v1/datasets/upload` | POST | Upload CSV dataset, perform schema validation, store in session |
| `/api/v1/datasets/profile` | GET | Comprehensive statistical profile, missing values, class distributions |
| `/api/v1/datasets/records` | GET | Paginated, sorted, and filtered view of flow records |
| `/api/v1/datasets/sample` | POST | Load bundled standard RT-IoT2022 sample fixture |
| `/api/v1/models` | GET | List available trained models and persisted artifacts |
| `/api/v1/models/train` | POST | Train selected model (Dummy, Logistic Regression, Random Forest, etc.) |
| `/api/v1/models/{model_id}/metrics` | GET | Retrieve detailed evaluation metrics, confusion matrix, and split details |
| `/api/v1/predictions` | POST | Run inference on single flow or batch CSV; outputs predicted category & probabilities |
| `/api/v1/anomalies/detect` | POST | Run unsupervised Isolation Forest; returns score, flag, threshold |
| `/api/v1/explanations` | POST | Compute global feature importance or local feature attribution |
| `/api/v1/reports/export` | GET | Export analytical findings and model evaluation as structured CSV/JSON summary |

---

## 3. Data Contract: UCI RT-IoT2022 Standard

Target: `Attack_type` (e.g. `DOS_SYN_Hping`, `ARP_poisoning`, `NMAP_UDP_SCAN`, `MQTT_Publish`, `Normal`, `Metasploit_Brute_Force`, `DDoS_TCP_Syn_Flood`).

Key Flow Features:
- Transport & Service: `proto`, `service`
- Temporal & Rate: `flow_duration`, `fwd_pkts_per_sec`, `bwd_pkts_per_sec`, `flow_pkts_per_sec`, `flow_bytes_per_sec`, `flow_iat.avg`
- Packet Volume & Sizes: `fwd_pkts_tot`, `bwd_pkts_tot`, `fwd_pkts_payload.avg`, `bwd_pkts_payload.avg`, `payload_bytes_per_second`
- TCP Flags: `flow_FIN_flag_count`, `flow_SYN_flag_count`, `flow_RST_flag_count`, `flow_ACK_flag_count`, `flow_PSH_flag_count`
- Subflows: `fwd_subflow_pkts`, `bwd_subflow_pkts`, `fwd_subflow_bytes`, `bwd_subflow_bytes`

Excluded Leakage Columns:
- Packet IDs, unique timestamps, IP addresses (if any), redundant duplicate labels.

---

## 4. Verification & Testing Strategy
- **Unit Tests (Backend `pytest`)**:
  - `test_data.py`: Schema validation, missing value imputation, CSV parsing, malicious input sanitization.
  - `test_ml.py`: Classifier pipeline fitting, holdout split reproducibility, zero division handling, Isolation Forest scores.
  - `test_api.py`: FastAPI endpoints, error handling, file upload limits, predictions and metrics serialization.
- **Frontend Tests (`Vitest`) & Typecheck**:
  - TypeScript strict compilation (`tsc --noEmit`).
  - Component rendering, navigation, mock API calls, empty and error state display.
- **E2E Integration Verification**:
  - Launch FastAPI on port 8000.
  - Launch Vite on port 5173.
  - Test full workflow: load sample -> review EDA -> train Random Forest -> evaluate -> run single & batch prediction -> view explainability -> detect anomalies -> export report.

---

## 5. Development Stages & Milestones
- [x] **Stage 0**: Plan architecture, API contract, and documentation setup.
- [ ] **Stage 1**: Scaffold Backend (FastAPI, virtualenv, dependencies, health endpoints) and Frontend (Vite, React, Tailwind, Lucide).
- [ ] **Stage 2**: Implement Data & ML Engine (`src/data/`, `src/ml/`, synthetic generator for RT-IoT2022, training and evaluation pipelines).
- [ ] **Stage 3**: Build all 8 Frontend pages with polished UI and interactive charts.
- [ ] **Stage 4**: Integrate Frontend with Backend, implement error boundaries, upload limits, and responsive layout.
- [ ] **Stage 5**: Execute automated tests, generate production builds, create `README.md`, `ARCHITECTURE.md`, `MODEL_CARD.md`, and verify clean execution.
