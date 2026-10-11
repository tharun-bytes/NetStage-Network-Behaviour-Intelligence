# Model Card — NetSage Machine Learning Platform

## 1. Model Details
- **Organization**: NetSage Open Source Defensive Network Analytics
- **Model Architectures**:
  - `DummyClassifier`: Baseline majority-class benchmark
  - `Multinomial Logistic Regression`: L2-regularized linear baseline with StandardScaler
  - `RandomForestClassifier`: 120 estimators, depth-bounded tree ensemble (primary model)
  - `XGBoostClassifier`: Gradient boosted tree ensemble (high-efficiency optional model)
  - `IsolationForest`: 100 estimators, unsupervised path-length outlier detector
- **Model Version**: 1.0.0
- **Frameworks**: Python 3.13, Scikit-learn 1.9+, Joblib, XGBoost, SHAP

---

## 2. Intended Use & Scope
- **Primary Use Case**: Defensive post-incident data analysis, flow categorization, and behavioral outlier triage in IoT smart-home and industrial sensor networks.
- **Out of Scope**:
  - Offensive exploitation or penetration testing automation.
  - Autonomous firewall blocking without human-in-the-loop validation.
  - Live raw packet sniffing or unauthorized packet capture.

---

## 3. Training & Evaluation Dataset
- **Dataset**: UCI RT-IoT2022 (Real-Time Internet of Things 2022)
- **Target Column**: `Attack_type`
- **Class Labels**:
  1. `Normal` (benign IoT baseline traffic)
  2. `DOS_SYN_Hping`
  3. `Thing_Speak` (legitimate IoT cloud telemetry)
  4. `ARP_poisoning`
  5. `MQTT_Publish` (standard MQTT protocol telemetry)
  6. `NMAP_UDP_SCAN`
  7. `NMAP_TCP_SCAN`
  8. `NMAP_SYN_SCAN`
  9. `Metasploit_Brute_Force`
  10. `DDoS_TCP_Syn_Flood`

---

## 4. Feature Selection & Leakage Mitigation
- **Included Features**:
  - Directional Packet Counts: `fwd_pkts_tot`, `bwd_pkts_tot`, `fwd_data_pkts_tot`, `bwd_data_pkts_tot`
  - Flow Temporal Dynamics: `flow_duration`, `fwd_pkts_per_sec`, `bwd_pkts_per_sec`, `flow_pkts_per_sec`, `flow_bytes_per_sec`, `flow_iat.avg`
  - Payload Summaries: `fwd_pkts_payload.avg`, `bwd_pkts_payload.avg`, `payload_bytes_per_second`
  - TCP Flag Counts: `flow_FIN_flag_count`, `flow_SYN_flag_count`, `flow_RST_flag_count`, `flow_ACK_flag_count`, `flow_PSH_flag_count`
  - Protocol & Service Categoricals: `proto`, `service`
- **Strictly Excluded Leakage Attributes**:
  - `src_ip`, `dst_ip`, `src_mac`, `dst_mac`: Excluded to avoid overfitting to specific testbed IP addresses.
  - `timestamp`: Excluded to prevent temporal leakage between training and testing sessions.

---

## 5. Evaluation Methodology
- **Holdout Separation**: Strict 80/20 stratified split. All preprocessing transformers (imputers, scalers, one-hot encoders) are fitted strictly on the 80% training partition.
- **Cross-Validation**: 5-Fold Stratified Cross-Validation executed exclusively on the training split to estimate variance and guard against overfitting.
- **Metrics Tracked**:
  - Accuracy & Balanced Accuracy
  - Macro F1-Score (unweighted average across classes; critical for imbalanced classes)
  - Weighted F1-Score (frequency-weighted)
  - Per-Class Precision, Recall, F1, and Support
  - Full Confusion Matrix

---

## 6. Known Limitations & Caveats
1. **Concept Drift**: Network flow distributions shift when new IoT device types or firmware updates are deployed. Models should be retrained periodically.
2. **Encrypted Payloads**: As modern IoT protocols increasingly adopt TLS/DTLS, payload statistics may show uniform entropy; transport timing (`flow_iat`) and packet rates become primary discriminators.
3. **Probability Interpretation**: Model output probabilities reflect relative confidence conditioned on training distributions, not calibrated real-world probabilities of an active intrusion.
