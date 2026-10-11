from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from backend.app.schemas.investigation import (
    InvestigationDetail,
    InvestigationStartRequest,
    InvestigationSummary,
)
from backend.app.state import app_state
from src.agents.orchestrator import orchestrator
from src.ml.anomaly import detect_anomalies, train_isolation_forest_detector
from src.ml.explain import compute_global_feature_importance

router = APIRouter(tags=["AI Agents & Investigations"])

@router.post("/investigations/start", response_model=InvestigationDetail)
def start_investigation(req: InvestigationStartRequest) -> InvestigationDetail:
    """Trigger the multi-agent investigation workflow: Traffic Analyst -> Investigation Agent -> Reporting Agent."""
    df = app_state.dataset_df
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset loaded. Please load or upload flow telemetry before initiating an investigation."
        )

    # Ensure anomaly detector is trained
    if app_state.anomaly_detector is None:
        try:
            iso_res = train_isolation_forest_detector(df, contamination=0.05, random_state=42)
            app_state.anomaly_detector = iso_res["pipeline"]
            app_state.anomaly_detector_metadata = iso_res["metadata"]
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fit anomaly detector: {str(e)}")

    # Score anomalies
    try:
        anomaly_results = detect_anomalies(
            pipeline=app_state.anomaly_detector,
            metadata=app_state.anomaly_detector_metadata or {},
            df=df,
            custom_threshold=req.anomaly_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Anomaly detection failed: {str(e)}")

    # Global explanation if active model exists
    global_exp = None
    model_name = None
    if app_state.active_model_id and app_state.active_model_id in app_state.models:
        m = app_state.models[app_state.active_model_id]
        model_name = m["metadata"].get("model_name")
        try:
            global_exp = compute_global_feature_importance(m["pipeline"], m["metadata"], top_n=10)
        except Exception:
            global_exp = None

    # Run orchestrated multi-agent pipeline
    investigation_record = orchestrator.run_investigation(
        df=df,
        dataset_name=app_state.dataset_name or "active_dataset.csv",
        anomaly_results=anomaly_results,
        global_explanation=global_exp,
        model_name=model_name,
        custom_title=req.title,
        target_category=req.target_category,
        max_records=req.max_records_to_investigate
    )

    return InvestigationDetail(**investigation_record)

@router.get("/investigations", response_model=list[InvestigationSummary])
def list_investigations() -> list[InvestigationSummary]:
    """Retrieve history of all multi-agent forensic investigations."""
    return [InvestigationSummary(**inv) for inv in orchestrator.list_all()]

@router.get("/investigations/{investigation_id}", response_model=InvestigationDetail)
def get_investigation_detail(investigation_id: str) -> InvestigationDetail:
    """Retrieve full trace, step statuses, evidence dossier, and final report for an investigation."""
    inv = orchestrator.get(investigation_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found."
        )
    return InvestigationDetail(**inv)

@router.post("/investigations/{investigation_id}/cancel")
def cancel_investigation(investigation_id: str):
    """Cancel a running multi-agent investigation."""
    success = orchestrator.cancel(investigation_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Investigation '{investigation_id}' not found.")
    return {"investigation_id": investigation_id, "status": "canceled"}

@router.get("/reports/{report_id}")
def download_investigation_report(report_id: str, format: str = Query("markdown", pattern="^(markdown|json)$")):
    """Download investigation report as formatted Markdown or JSON."""
    # Find matching investigation by report ID or investigation ID
    target_inv = None
    for inv in orchestrator.investigations.values():
        if inv["final_report_json"] and inv["final_report_json"].get("report_id") == report_id:
            target_inv = inv
            break
        elif inv["investigation_id"] == report_id:
            target_inv = inv
            break

    if not target_inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report '{report_id}' not found.")

    if format == "json":
        import json
        content = json.dumps(target_inv["final_report_json"], indent=2).encode("utf-8")
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{report_id}.json"'}
        )
    else:
        content = (target_inv["final_report_markdown"] or "No markdown report available.").encode("utf-8")
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{report_id}.md"'}
        )
