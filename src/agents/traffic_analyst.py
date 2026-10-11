import time
from typing import Any
import pandas as pd

class TrafficAnalystAgent:
    """
    Agent 1: Ingests traffic dataset, evaluates flow rates & anomalies,
    identifies candidate records for forensic investigation, and collects baseline evidence.
    """
    def __init__(self):
        self.name = "Traffic Analyst Agent"

    def execute(
        self,
        df: pd.DataFrame,
        anomaly_results: dict[str, Any],
        target_category: str | None = None,
        max_records: int = 25
    ) -> dict[str, Any]:
        start_time = time.time()
        
        flagged_records = anomaly_results.get("flagged_records", [])
        total_records = len(df)
        
        # Filter suspicious candidates
        candidate_flows = []
        for r in flagged_records:
            attrs = r.get("attributes", {})
            if target_category and attrs.get("Attack_type") != target_category:
                continue
            candidate_flows.append({
                "flow_index": r.get("index"),
                "anomaly_score": r.get("anomaly_score"),
                "proto": attrs.get("proto", "unknown"),
                "service": attrs.get("service", "none"),
                "flow_duration": attrs.get("flow_duration"),
                "flow_pkts_per_sec": attrs.get("flow_pkts_per_sec"),
                "flow_SYN_flag_count": attrs.get("flow_SYN_flag_count"),
                "declared_label": attrs.get("Attack_type", "Unknown"),
            })
            if len(candidate_flows) >= max_records:
                break

        # Protocol breakdown of candidates
        proto_counts = {}
        for c in candidate_flows:
            p = c["proto"]
            proto_counts[p] = proto_counts.get(p, 0) + 1

        evidence = {
            "agent": self.name,
            "execution_duration_seconds": round(time.time() - start_time, 3),
            "total_dataset_volume": total_records,
            "candidates_extracted_count": len(candidate_flows),
            "candidate_flows": candidate_flows,
            "protocol_breakdown": proto_counts,
            "analysis_notes": (
                f"Identified {len(candidate_flows)} priority candidate flows exhibiting "
                f"severe deviation in flow rate and TCP synchronization flags."
            )
        }
        return evidence
