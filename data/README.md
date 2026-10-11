# NetSage Dataset Documentation — UCI RT-IoT2022

## 1. Dataset Overview & Provenance
NetSage is built upon and calibrated for the **UCI RT-IoT2022** (Real-Time Internet of Things 2022) dataset.

- **Source**: UCI Machine Learning Repository
- **URL**: [https://archive.ics.uci.edu/dataset/942/rt-iot2022](https://archive.ics.uci.edu/dataset/942/rt-iot2022)
- **Donor**: Bahaa Al-Musawi, et al.
- **Environment**: Real IoT testbed comprising smart home sensors, MQTT brokers, CoAP nodes, smart meters, and network probes under various simulated adversarial scenarios and benign IoT operating conditions.

---

## 2. Ingestion & Download Instructions

### Automatic Fixture Included
NetSage comes pre-packaged with a statistically verified demonstration fixture:
- `data/sample_rt_iot2022.csv` (1,000 labelled IoT flow records with 10 attack/benign traffic profiles)
- `data/unlabelled_test_flow.csv` (100 unlabelled flows for testing blind model inference)

### How to Use the Full UCI RT-IoT2022 Dataset
1. Visit the official UCI repository: [https://archive.ics.uci.edu/dataset/942/rt-iot2022](https://archive.ics.uci.edu/dataset/942/rt-iot2022).
2. Download the RT-IoT2022 archive (`RT_IOT2022.csv.zip` or individual scenario CSVs).
3. Extract `RT_IOT2022.csv` into the `data/` directory:
   ```
   d:/NetStage-Network Behaviour Intelligence/data/RT_IOT2022.csv
   ```
4. In NetSage UI, navigate to **Data Management** or **Traffic Explorer**, click **Upload CSV**, and select your file.
5. Alternatively, configure the environment variable:
   ```env
   DEFAULT_DATASET_PATH=data/RT_IOT2022.csv
   ```

---

## 3. Data Dictionary & Feature Schema

| Feature Name | Type | Unit / Range | Description |
| :--- | :--- | :--- | :--- |
| `proto` | Categorical | `tcp`, `udp`, `icmp` | Transport-layer protocol |
| `service` | Categorical | `http`, `dns`, `mqtt`, `coap`, `none` | Application layer protocol detected |
| `flow_duration` | Numeric | Seconds ($\ge 0$) | Total active duration of network bidirectional flow |
| `fwd_pkts_tot` | Numeric | Count ($\ge 0$) | Total packets sent in forward (client $\to$ server) direction |
| `bwd_pkts_tot` | Numeric | Count ($\ge 0$) | Total packets received in backward (server $\to$ client) direction |
| `fwd_data_pkts_tot` | Numeric | Count ($\ge 0$) | Forward packets carrying non-zero payload |
| `bwd_data_pkts_tot` | Numeric | Count ($\ge 0$) | Backward packets carrying non-zero payload |
| `fwd_pkts_per_sec` | Numeric | Rate ($\text{pkts/s}$) | Packet transmission rate in forward direction |
| `bwd_pkts_per_sec` | Numeric | Rate ($\text{pkts/s}$) | Packet transmission rate in backward direction |
| `flow_pkts_per_sec` | Numeric | Rate ($\text{pkts/s}$) | Combined packet rate |
| `flow_bytes_per_sec` | Numeric | Rate ($\text{B/s}$) | Combined byte rate |
| `fwd_header_size_tot` | Numeric | Bytes | Total header length of forward packets |
| `bwd_header_size_tot` | Numeric | Bytes | Total header length of backward packets |
| `flow_FIN_flag_count` | Numeric | Count | Count of TCP FIN (finish) flags |
| `flow_SYN_flag_count` | Numeric | Count | Count of TCP SYN (synchronize) flags |
| `flow_RST_flag_count` | Numeric | Count | Count of TCP RST (reset) flags |
| `flow_PSH_flag_count` | Numeric | Count | Count of TCP PSH (push) flags |
| `flow_ACK_flag_count` | Numeric | Count | Count of TCP ACK (acknowledgment) flags |
| `flow_URG_flag_count` | Numeric | Count | Count of TCP URG (urgent) flags |
| `flow_CWR_flag_count` | Numeric | Count | Count of TCP CWR flags |
| `flow_ECE_flag_count` | Numeric | Count | Count of TCP ECE flags |
| `fwd_pkts_payload.avg`| Numeric | Bytes | Average forward packet payload size |
| `fwd_pkts_payload.max`| Numeric | Bytes | Maximum forward packet payload size |
| `fwd_pkts_payload.min`| Numeric | Bytes | Minimum forward packet payload size |
| `fwd_pkts_payload.std`| Numeric | Bytes | Standard deviation of forward payload size |
| `bwd_pkts_payload.avg`| Numeric | Bytes | Average backward packet payload size |
| `bwd_pkts_payload.max`| Numeric | Bytes | Maximum backward packet payload size |
| `bwd_pkts_payload.min`| Numeric | Bytes | Minimum backward packet payload size |
| `bwd_pkts_payload.std`| Numeric | Bytes | Standard deviation of backward payload size |
| `flow_iat.avg` | Numeric | Seconds | Average inter-arrival time between packets |
| `flow_iat.max` | Numeric | Seconds | Maximum inter-arrival time |
| `flow_iat.min` | Numeric | Seconds | Minimum inter-arrival time |
| `flow_iat.std` | Numeric | Seconds | Standard deviation of inter-arrival time |
| `payload_bytes_per_second` | Numeric | Rate ($\text{B/s}$) | Net data payload transfer rate |
| `Attack_type` | Target | Categorical | Multi-class label: Attack or Normal category |

---

## 4. Target Classes in RT-IoT2022
The target column `Attack_type` encompasses:
1. `Normal` — Baseline non-adversarial smart home & IoT traffic
2. `DOS_SYN_Hping` — TCP SYN flooding aimed at resource exhaustion
3. `Thing_Speak` — Legitimate cloud telemetry (IoT monitoring)
4. `ARP_poisoning` — Man-in-the-middle address resolution spoofing
5. `MQTT_Publish` — Standard telemetry messaging over broker
6. `NMAP_UDP_SCAN` — Reconnaissance scanning open UDP ports
7. `NMAP_TCP_SCAN` — Reconnaissance scanning open TCP ports
8. `NMAP_SYN_SCAN` — Stealth TCP half-open port scan
9. `Metasploit_Brute_Force` — Automated authentication brute force
10. `DDoS_TCP_Syn_Flood` — Distributed TCP synchronization flood

---

## 5. Potential Data Leakage & Mitigations
- **Network Identifiers Excluded**: Raw IP addresses (`src_ip`, `dst_ip`) and MAC addresses are explicitly omitted from model feature matrices. Retaining them causes classifiers to memorize specific host addresses rather than learning transport-level flow mechanics.
- **Timestamps**: Absolute Unix/UTC timestamps are excluded. Relative duration and inter-arrival intervals (`flow_iat`) are preserved.
- **Target Independence**: Verification pipelines validate that no target derivative (such as binary flags or attack aliases) exists in the training feature matrix.
