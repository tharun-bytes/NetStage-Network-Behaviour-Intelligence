import random
from pathlib import Path
import numpy as np
import pandas as pd

def generate_rt_iot2022_synthetic_data(n_samples: int = 1200, random_state: int = 42) -> pd.DataFrame:
    """Generate statistically grounded synthetic network flows matching the UCI RT-IoT2022 schema."""
    np.random.seed(random_state)
    random.seed(random_state)

    classes = [
        "Normal",
        "DOS_SYN_Hping",
        "Thing_Speak",
        "ARP_poisoning",
        "MQTT_Publish",
        "NMAP_UDP_SCAN",
        "NMAP_TCP_SCAN",
        "NMAP_SYN_SCAN",
        "Metasploit_Brute_Force",
        "DDoS_TCP_Syn_Flood"
    ]
    # Class distribution weights representing an IoT testbed environment
    weights = [0.25, 0.15, 0.12, 0.08, 0.12, 0.06, 0.06, 0.06, 0.05, 0.05]
    
    records = []
    for _ in range(n_samples):
        attack_type = np.random.choice(classes, p=weights)
        
        # Base flow attributes default
        proto = "tcp"
        service = "none"
        flow_duration = max(0.001, np.random.exponential(1.5))
        fwd_pkts_tot = int(np.random.poisson(10)) + 1
        bwd_pkts_tot = int(np.random.poisson(8))
        fwd_data_pkts_tot = max(1, fwd_pkts_tot - 2)
        bwd_data_pkts_tot = max(0, bwd_pkts_tot - 2)
        
        flow_FIN = 0
        flow_SYN = 0
        flow_RST = 0
        flow_PSH = 0
        flow_ACK = 0
        flow_URG = 0
        flow_CWR = 0
        flow_ECE = 0
        
        fwd_payload_avg = float(np.random.uniform(20, 250))
        fwd_payload_max = fwd_payload_avg * np.random.uniform(1.2, 2.5)
        fwd_payload_min = float(np.random.uniform(0, 20))
        fwd_payload_std = float(np.random.uniform(5, 50))

        bwd_payload_avg = float(np.random.uniform(20, 400))
        bwd_payload_max = bwd_payload_avg * np.random.uniform(1.2, 3.0)
        bwd_payload_min = float(np.random.uniform(0, 10))
        bwd_payload_std = float(np.random.uniform(5, 60))
        
        iat_avg = float(max(0.0001, np.random.exponential(0.05)))
        iat_max = float(iat_avg * np.random.uniform(1.5, 4.0))
        iat_min = float(iat_avg * np.random.uniform(0.1, 0.5))
        iat_std = float(iat_avg * np.random.uniform(0.3, 1.2))

        if attack_type == "Normal":
            proto = np.random.choice(["tcp", "udp"], p=[0.7, 0.3])
            service = np.random.choice(["http", "dns", "none"], p=[0.4, 0.3, 0.3])
            flow_FIN = 1
            flow_SYN = 1
            flow_ACK = int(fwd_pkts_tot + bwd_pkts_tot - 1)
            flow_PSH = int(np.random.binomial(fwd_pkts_tot, 0.3))

        elif attack_type in ["DOS_SYN_Hping", "DDoS_TCP_Syn_Flood"]:
            proto = "tcp"
            service = "none"
            flow_duration = max(0.0001, np.random.uniform(0.01, 0.5))
            fwd_pkts_tot = int(np.random.uniform(50, 400))
            bwd_pkts_tot = 0
            fwd_data_pkts_tot = 0
            bwd_data_pkts_tot = 0
            flow_SYN = fwd_pkts_tot
            flow_ACK = 0
            flow_FIN = 0
            fwd_payload_avg = 0.0
            fwd_payload_max = 0.0
            fwd_payload_min = 0.0
            fwd_payload_std = 0.0
            bwd_payload_avg = 0.0
            bwd_payload_max = 0.0
            bwd_payload_min = 0.0
            bwd_payload_std = 0.0
            iat_avg = float(np.random.uniform(0.0001, 0.002))

        elif attack_type in ["NMAP_SYN_SCAN", "NMAP_TCP_SCAN"]:
            proto = "tcp"
            service = "none"
            flow_duration = float(np.random.uniform(0.001, 0.05))
            fwd_pkts_tot = int(np.random.choice([1, 2, 3]))
            bwd_pkts_tot = int(np.random.choice([0, 1]))
            fwd_data_pkts_tot = 0
            bwd_data_pkts_tot = 0
            flow_SYN = fwd_pkts_tot
            flow_RST = 1 if bwd_pkts_tot > 0 else 0
            fwd_payload_avg = 0.0
            fwd_payload_max = 0.0
            fwd_payload_min = 0.0
            fwd_payload_std = 0.0
            bwd_payload_avg = 0.0
            bwd_payload_max = 0.0
            bwd_payload_min = 0.0
            bwd_payload_std = 0.0

        elif attack_type == "NMAP_UDP_SCAN":
            proto = "udp"
            service = "none"
            flow_duration = float(np.random.uniform(0.001, 0.08))
            fwd_pkts_tot = int(np.random.choice([1, 2]))
            bwd_pkts_tot = 0
            fwd_data_pkts_tot = 0
            bwd_data_pkts_tot = 0
            fwd_payload_avg = 0.0
            fwd_payload_max = 0.0
            fwd_payload_min = 0.0
            fwd_payload_std = 0.0
            bwd_payload_avg = 0.0
            bwd_payload_max = 0.0
            bwd_payload_min = 0.0
            bwd_payload_std = 0.0

        elif attack_type == "MQTT_Publish":
            proto = "tcp"
            service = "mqtt"
            flow_duration = float(np.random.uniform(0.5, 5.0))
            fwd_pkts_tot = int(np.random.uniform(4, 15))
            bwd_pkts_tot = int(np.random.uniform(3, 12))
            flow_SYN = 1
            flow_ACK = int(fwd_pkts_tot + bwd_pkts_tot)
            flow_PSH = int(np.random.uniform(1, 4))
            fwd_payload_avg = float(np.random.uniform(30, 95))
            bwd_payload_avg = float(np.random.uniform(10, 40))

        elif attack_type == "Thing_Speak":
            proto = "tcp"
            service = "http"
            flow_duration = float(np.random.uniform(0.8, 3.5))
            fwd_pkts_tot = int(np.random.uniform(6, 20))
            bwd_pkts_tot = int(np.random.uniform(5, 18))
            flow_SYN = 1
            flow_ACK = int(fwd_pkts_tot + bwd_pkts_tot)
            flow_PSH = int(np.random.uniform(2, 6))
            fwd_payload_avg = float(np.random.uniform(120, 280))
            bwd_payload_avg = float(np.random.uniform(200, 600))

        elif attack_type == "Metasploit_Brute_Force":
            proto = "tcp"
            service = "http"
            flow_duration = float(np.random.uniform(0.1, 1.2))
            fwd_pkts_tot = int(np.random.uniform(10, 30))
            bwd_pkts_tot = int(np.random.uniform(8, 25))
            flow_SYN = 1
            flow_ACK = int(fwd_pkts_tot + bwd_pkts_tot)
            flow_RST = int(np.random.choice([0, 1]))
            flow_PSH = int(np.random.uniform(4, 10))
            fwd_payload_avg = float(np.random.uniform(180, 350))
            bwd_payload_avg = float(np.random.uniform(80, 200))

        elif attack_type == "ARP_poisoning":
            proto = "icmp"
            service = "none"
            flow_duration = float(np.random.uniform(0.05, 0.8))
            fwd_pkts_tot = int(np.random.uniform(8, 35))
            bwd_pkts_tot = 0
            fwd_data_pkts_tot = fwd_pkts_tot
            bwd_data_pkts_tot = 0
            fwd_payload_avg = 42.0
            fwd_payload_max = 42.0
            fwd_payload_min = 42.0
            fwd_payload_std = 0.0
            bwd_payload_avg = 0.0
            bwd_payload_max = 0.0
            bwd_payload_min = 0.0
            bwd_payload_std = 0.0

        # Computed rates & totals
        tot_pkts = fwd_pkts_tot + bwd_pkts_tot
        fwd_header_size = fwd_pkts_tot * 20
        bwd_header_size = bwd_pkts_tot * 20
        fwd_bytes = fwd_header_size + (fwd_pkts_tot * fwd_payload_avg)
        bwd_bytes = bwd_header_size + (bwd_pkts_tot * bwd_payload_avg)
        tot_bytes = fwd_bytes + bwd_bytes
        
        fwd_pkts_per_sec = float(fwd_pkts_tot / flow_duration)
        bwd_pkts_per_sec = float(bwd_pkts_tot / flow_duration)
        flow_pkts_per_sec = float(tot_pkts / flow_duration)
        flow_bytes_per_sec = float(tot_bytes / flow_duration)
        payload_bytes_per_sec = float((fwd_pkts_tot * fwd_payload_avg + bwd_pkts_tot * bwd_payload_avg) / flow_duration)

        record = {
            "proto": proto,
            "service": service,
            "flow_duration": round(flow_duration, 5),
            "fwd_pkts_tot": fwd_pkts_tot,
            "bwd_pkts_tot": bwd_pkts_tot,
            "fwd_data_pkts_tot": fwd_data_pkts_tot,
            "bwd_data_pkts_tot": bwd_data_pkts_tot,
            "fwd_pkts_per_sec": round(fwd_pkts_per_sec, 2),
            "bwd_pkts_per_sec": round(bwd_pkts_per_sec, 2),
            "flow_pkts_per_sec": round(flow_pkts_per_sec, 2),
            "flow_bytes_per_sec": round(flow_bytes_per_sec, 2),
            "fwd_header_size_tot": fwd_header_size,
            "bwd_header_size_tot": bwd_header_size,
            "flow_FIN_flag_count": flow_FIN,
            "flow_SYN_flag_count": flow_SYN,
            "flow_RST_flag_count": flow_RST,
            "flow_PSH_flag_count": flow_PSH,
            "flow_ACK_flag_count": flow_ACK,
            "flow_URG_flag_count": flow_URG,
            "flow_CWR_flag_count": flow_CWR,
            "flow_ECE_flag_count": flow_ECE,
            "fwd_pkts_payload.avg": round(fwd_payload_avg, 2),
            "fwd_pkts_payload.max": round(fwd_payload_max, 2),
            "fwd_pkts_payload.min": round(fwd_payload_min, 2),
            "fwd_pkts_payload.std": round(fwd_payload_std, 2),
            "bwd_pkts_payload.avg": round(bwd_payload_avg, 2),
            "bwd_pkts_payload.max": round(bwd_payload_max, 2),
            "bwd_pkts_payload.min": round(bwd_payload_min, 2),
            "bwd_pkts_payload.std": round(bwd_payload_std, 2),
            "flow_iat.avg": round(iat_avg, 6),
            "flow_iat.max": round(iat_max, 6),
            "flow_iat.min": round(iat_min, 6),
            "flow_iat.std": round(iat_std, 6),
            "payload_bytes_per_second": round(payload_bytes_per_sec, 2),
            "Attack_type": attack_type
        }
        records.append(record)
        
    return pd.DataFrame(records)

if __name__ == "__main__":
    out_dir = Path("data")
    out_dir.mkdir(parents=True, exist_ok=True)
    df_labelled = generate_rt_iot2022_synthetic_data(1200, random_state=42)
    df_labelled.to_csv(out_dir / "sample_rt_iot2022.csv", index=False)
    print(f"Generated sample_rt_iot2022.csv ({len(df_labelled)} rows)")
    
    # Generate unlabelled inference test fixture
    df_unlabelled = df_labelled.drop(columns=["Attack_type"]).sample(100, random_state=99)
    df_unlabelled.to_csv(out_dir / "unlabelled_test_flow.csv", index=False)
    print(f"Generated unlabelled_test_flow.csv ({len(df_unlabelled)} rows)")
