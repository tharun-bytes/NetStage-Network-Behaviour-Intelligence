from datetime import datetime, timezone
import time
from typing import Any, Optional
import uuid

import pandas as pd

from src.agents.investigation_agent import InvestigationAgent
from src.agents.reporting_agent import ReportingAgent
from src.agents.traffic_analyst import TrafficAnalystAgent

class InvestigationOrchestrator:
    """
    Coordinates multi-agent network investigation pipeline:
    TrafficAnalystAgent -> InvestigationAgent -> ReportingAgent.
    """
    def __init__(self):
        self.investigations: dict[str, dict[str, Any]] = {}
        self.analyst_agent = TrafficAnalystAgent()
        self.investigation_agent = InvestigationAgent()
        self.reporting_agent = ReportingAgent()

    def list_all(self) -> list[dict[str, Any]]:
        results = []
        for inv_id, inv in sorted(self.investigations.items(), key=lambda x: x[1]["created_at"], reverse=True):
            rep = inv.get("final_report_json", {})
            results.append({
                "investigation_id": inv_id,
                "title": inv.get("title", f"Investigation {inv_id}"),
                "status": inv.get("status", "completed"),
                "created_at": inv.get("created_at"),
                "completed_at": inv.get("completed_at"),
                "dataset_name": inv.get("dataset_name", "Unknown"),
                "anomalies_flagged": rep.get("total_candidates_flagged", 0),
                "risk_level": rep.get("risk_level", "Medium"),
            })
        return results

    def get(self, investigation_id: str) -> Optional[dict[str, Any]]:
        return self.investigations.get(investigation_id)

    def cancel(self, investigation_id: str) -> bool:
        if investigation_id in self.investigations:
            self.investigations[investigation_id]["status"] = "canceled"
            return True
        return False

    def run_investigation(
        self,
        df: pd.DataFrame,
        dataset_name: str,
        anomaly_results: dict[str, Any],
        global_explanation: Optional[dict[str, Any]] = None,
        model_name: Optional[str] = None,
        custom_title: Optional[str] = None,
        target_category: Optional[str] = None,
        max_records: int = 25
    ) -> dict[str, Any]:
        """Execute the multi-agent pipeline sequentially, recording step-by-step progress."""
        inv_id = f"INV_{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()
        title = custom_title or f"Forensic Telemetry Investigation — {dataset_name}"

        steps = [
            {
                "agent_name": self.analyst_agent.name,
                "stage": "Traffic Triage & Candidate Extraction",
                "status": "pending",
                "started_at": None,
                "completed_at": None,
                "output_summary": None,
                "evidence_collected_count": 0,
            },
            {
                "agent_name": self.investigation_agent.name,
                "stage": "Feature Divergence & Baseline Comparison",
                "status": "pending",
                "started_at": None,
                "completed_at": None,
                "output_summary": None,
                "evidence_collected_count": 0,
            },
            {
                "agent_name": self.reporting_agent.name,
                "stage": "Executive Forensic Report Synthesis",
                "status": "pending",
                "started_at": None,
                "completed_at": None,
                "output_summary": None,
                "evidence_collected_count": 0,
            },
        ]

        investigation_record = {
            "investigation_id": inv_id,
            "title": title,
            "status": "running",
            "created_at": now_str,
            "completed_at": None,
            "dataset_name": dataset_name,
            "model_name": model_name,
            "steps": steps,
            "evidence_dossier": {},
            "final_report_markdown": None,
            "final_report_json": None,
        }
        self.investigations[inv_id] = investigation_record

        try:
            # Step 1: Traffic Analyst Agent
            steps[0]["status"] = "running"
            steps[0]["started_at"] = datetime.now(timezone.utc).isoformat()
            
            traffic_evidence = self.analyst_agent.execute(
                df=df,
                anomaly_results=anomaly_results,
                target_category=target_category,
                max_records=max_records
            )
            
            steps[0]["status"] = "completed"
            steps[0]["completed_at"] = datetime.now(timezone.utc).isoformat()
            steps[0]["output_summary"] = traffic_evidence["analysis_notes"]
            steps[0]["evidence_collected_count"] = traffic_evidence["candidates_extracted_count"]
            investigation_record["evidence_dossier"]["traffic_evidence"] = traffic_evidence

            # Step 2: Investigation Agent
            steps[1]["status"] = "running"
            steps[1]["started_at"] = datetime.now(timezone.utc).isoformat()

            investigation_dossier = self.investigation_agent.execute(
                df=df,
                traffic_evidence=traffic_evidence,
                global_explanation=global_explanation
            )

            steps[1]["status"] = "completed"
            steps[1]["completed_at"] = datetime.now(timezone.utc).isoformat()
            steps[1]["output_summary"] = investigation_dossier["investigation_summary"]
            steps[1]["evidence_collected_count"] = len(investigation_dossier["feature_divergence_metrics"])
            investigation_record["evidence_dossier"]["investigation_dossier"] = investigation_dossier

            # Step 3: Reporting Agent
            steps[2]["status"] = "running"
            steps[2]["started_at"] = datetime.now(timezone.utc).isoformat()

            report_md, report_json = self.reporting_agent.execute(
                investigation_id=inv_id,
                investigation_title=title,
                dataset_name=dataset_name,
                traffic_evidence=traffic_evidence,
                investigation_dossier=investigation_dossier
            )

            steps[2]["status"] = "completed"
            steps[2]["completed_at"] = datetime.now(timezone.utc).isoformat()
            steps[2]["output_summary"] = f"Generated {report_json['risk_level']} Risk Forensic Report."
            steps[2]["evidence_collected_count"] = len(report_json["recommendations"])

            investigation_record["final_report_markdown"] = report_md
            investigation_record["final_report_json"] = report_json
            investigation_record["status"] = "completed"
            investigation_record["completed_at"] = datetime.now(timezone.utc).isoformat()

        except Exception as e:
            investigation_record["status"] = "failed"
            investigation_record["completed_at"] = datetime.now(timezone.utc).isoformat()
            investigation_record["error"] = str(e)
            for s in steps:
                if s["status"] == "running":
                    s["status"] = "error"
                    s["output_summary"] = f"Execution failed: {str(e)}"

        return investigation_record

# Singleton orchestrator
orchestrator = InvestigationOrchestrator()
