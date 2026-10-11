from datetime import datetime, timezone
import time
from typing import Any

class ReportingAgent:
    """
    Agent 3: Synthesizes evidence dossiers from Traffic Analyst and Investigation Agents
    into an executive forensic investigation report (Markdown and JSON formats).
    """
    def __init__(self):
        self.name = "Reporting Agent"

    def execute(
        self,
        investigation_id: str,
        investigation_title: str,
        dataset_name: str,
        traffic_evidence: dict[str, Any],
        investigation_dossier: dict[str, Any]
    ) -> tuple[str, dict[str, Any]]:
        start_time = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        candidate_count = traffic_evidence.get("candidates_extracted_count", 0)
        div_metrics = investigation_dossier.get("feature_divergence_metrics", [])
        
        # Determine aggregate threat risk level
        if candidate_count > 40:
            risk_level = "High"
        elif candidate_count > 10:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Construct JSON report
        report_json = {
            "report_id": f"REP_{investigation_id}",
            "investigation_id": investigation_id,
            "title": investigation_title,
            "generated_at": now_iso,
            "risk_level": risk_level,
            "dataset_analyzed": dataset_name,
            "total_candidates_flagged": candidate_count,
            "protocol_breakdown": traffic_evidence.get("protocol_breakdown", {}),
            "feature_divergence": div_metrics,
            "executive_summary": (
                f"Multi-agent investigation completed for {dataset_name}. "
                f"Identified {candidate_count} high-priority anomalous flow patterns. "
                f"Overall threat assessment score: {risk_level} Risk."
            ),
            "recommendations": [
                "Implement rate-limiting rules on external ingress points for TCP SYN handshake bursts.",
                "Verify whether high-frequency UDP flows correspond to internal DNS or an active UDP reconnaissance scan.",
                "Review IoT gateway firewall logs for correlated connection attempts during the affected timestamps.",
            ],
            "limitations_notice": (
                "Findings reflect historical flow record analysis and statistical tree isolation. "
                "No destructive or active blocking actions have been executed automatically."
            )
        }

        # Construct Markdown report
        md_lines = [
            f"# NetSage AI — Forensic Network Investigation Report",
            f"**Report ID:** `REP_{investigation_id}`  ",
            f"**Date:** {now_iso}  ",
            f"**Threat Risk Level:** **{risk_level.upper()}**  ",
            f"**Dataset:** `{dataset_name}`  ",
            "",
            "## 1. Executive Summary",
            report_json["executive_summary"],
            "",
            "## 2. Evidence Dossier & Protocol Breakdown",
            f"- **Candidate Suspicious Flows:** {candidate_count}",
        ]
        for proto, cnt in traffic_evidence.get("protocol_breakdown", {}).items():
            md_lines.append(f"  - `{proto.upper()}`: {cnt} flows")

        md_lines.extend([
            "",
            "## 3. Feature Divergence Analysis",
            "| Feature Metric | Normal Baseline Mean | Outlier Candidate Mean | Divergence Ratio |",
            "| :--- | :--- | :--- | :--- |",
        ])
        for dm in div_metrics:
            md_lines.append(
                f"| `{dm['feature']}` | {dm['baseline_normal_mean']} | {dm['anomalous_candidate_mean']} | **{dm['divergence_ratio']}x** |"
            )

        md_lines.extend([
            "",
            "## 4. Strategic Defensive Recommendations",
        ])
        for rec in report_json["recommendations"]:
            md_lines.append(f"1. {rec}")

        md_lines.extend([
            "",
            "## 5. Defensive Scope & Verification Notice",
            report_json["limitations_notice"],
        ])

        report_markdown = "\n".join(md_lines)
        return report_markdown, report_json
