from datetime import datetime, timezone
import json
from typing import Any
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from backend.app.state import app_state

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_report_summary(export_format: str = Query("json", pattern="^(json|txt)$")) -> Any:
    """Generate a consolidated intelligence report of the current dataset and active model evaluation."""
    profile = app_state.dataset_profile
    active_m_id = app_state.active_model_id
    model_info = app_state.models.get(active_m_id) if active_m_id else None

    report_payload = {
        "report_title": "NetSage — Network Behaviour Intelligence & Explainable ML Assessment",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "platform_version": "1.0.0",
        "dataset_summary": {
            "source_name": app_state.dataset_name,
            "total_records": profile.get("rows_count") if profile else 0,
            "total_features": profile.get("columns_count") if profile else 0,
            "target_classes_detected": list(profile.get("target_distribution", {}).keys()) if profile else [],
            "warnings_count": profile.get("warnings_count", 0) if profile else 0,
        },
        "model_evaluation": {
            "model_id": active_m_id,
            "model_name": model_info["metadata"].get("model_name") if model_info else "No model evaluated",
            "model_architecture": model_info["metadata"].get("model_type") if model_info else "None",
            "holdout_accuracy": model_info["metrics"].get("accuracy") if model_info else None,
            "macro_f1": model_info["metrics"].get("macro_f1") if model_info else None,
            "weighted_f1": model_info["metrics"].get("weighted_f1") if model_info else None,
            "training_duration_seconds": model_info["metrics"].get("training_duration_seconds") if model_info else None,
        },
        "anomaly_detection": {
            "unsupervised_engine_ready": app_state.anomaly_detector is not None,
            "default_algorithm": "Isolation Forest",
        },
        "defensive_security_notice": (
            "This report is generated for defensive data analysis and IoT network profiling. "
            "All metrics and attributions represent statistical model inference from historical records."
        )
    }

    if export_format == "txt":
        txt_output = (
            f"========================================================================\n"
            f" NETSAGE — NETWORK BEHAVIOUR INTELLIGENCE REPORT\n"
            f" Generated: {report_payload['generated_at']}\n"
            f"========================================================================\n\n"
            f"DATASET PROFILE:\n"
            f" - Source: {report_payload['dataset_summary']['source_name']}\n"
            f" - Total Records: {report_payload['dataset_summary']['total_records']}\n"
            f" - Features Analyzed: {report_payload['dataset_summary']['total_features']}\n"
            f" - Target Classes: {', '.join(report_payload['dataset_summary']['target_classes_detected'])}\n\n"
            f"MODEL PERFORMANCE:\n"
            f" - Model: {report_payload['model_evaluation']['model_name']}\n"
            f" - Holdout Accuracy: {report_payload['model_evaluation']['holdout_accuracy']}\n"
            f" - Macro F1: {report_payload['model_evaluation']['macro_f1']}\n"
            f" - Weighted F1: {report_payload['model_evaluation']['weighted_f1']}\n\n"
            f"NOTICE:\n"
            f" {report_payload['defensive_security_notice']}\n"
            f"========================================================================\n"
        )
        return Response(
            content=txt_output.encode("utf-8"),
            media_type="text/plain",
            headers={"Content-Disposition": 'attachment; filename="netsage_summary_report.txt"'}
        )

    return report_payload
