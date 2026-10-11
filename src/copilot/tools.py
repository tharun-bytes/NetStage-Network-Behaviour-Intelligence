import logging
from typing import Any, Optional
import pandas as pd
from src.ml.anomaly import detect_anomalies, train_isolation_forest_detector
from src.ml.explain import compute_global_feature_importance, compute_local_prediction_explanation
from src.ml.predict import predict_network_flows
from src.agents.orchestrator import orchestrator

logger = logging.getLogger("netsage.copilot.tools")

def get_dataset_metadata(app_state: Any) -> dict[str, Any]:
    """Retrieve active dataset metadata, column counts, missing values, and data hygiene stats."""
    if app_state.dataset_df is None or app_state.dataset_profile is None:
        return {"status": "error", "message": "No dataset currently loaded in NetSage."}
    
    prof = app_state.dataset_profile
    return {
        "status": "success",
        "dataset_name": prof.get("source_name"),
        "total_records": prof.get("rows_count"),
        "total_columns": prof.get("columns_count"),
        "numeric_features": prof.get("numeric_features", []),
        "categorical_features": prof.get("categorical_features", []),
        "duplicate_rows": prof.get("duplicate_rows", 0),
        "duplicate_percentage": prof.get("duplicate_percentage", 0.0),
        "infinite_values": prof.get("infinite_values_count", 0),
        "target_column": prof.get("target_column"),
        "warnings": prof.get("warnings", []),
    }

def get_class_distributions(app_state: Any) -> dict[str, Any]:
    """Retrieve actual target class frequencies and percentages."""
    if app_state.dataset_profile is None:
        return {"status": "error", "message": "No dataset currently loaded."}
    
    dist = app_state.dataset_profile.get("target_distribution", {})
    return {
        "status": "success",
        "total_classes": len(dist),
        "distributions": dist,
    }

def get_model_status_and_metrics(app_state: Any, model_id: Optional[str] = None) -> dict[str, Any]:
    """Retrieve registered model information, holdout metrics, accuracy, and F1 scores."""
    target_id = model_id or app_state.active_model_id
    if not target_id or target_id not in app_state.models:
        return {
            "status": "error",
            "message": "No model currently trained or active in NetSage. Train a model in the Model Lab.",
            "available_models": list(app_state.models.keys()),
        }
    
    m = app_state.models[target_id]
    metrics = m.get("metrics", {})
    meta = m.get("metadata", {})
    return {
        "status": "success",
        "model_id": target_id,
        "model_name": meta.get("model_name"),
        "model_type": meta.get("model_type"),
        "accuracy": metrics.get("accuracy"),
        "balanced_accuracy": metrics.get("balanced_accuracy"),
        "macro_f1": metrics.get("macro_f1"),
        "weighted_f1": metrics.get("weighted_f1"),
        "classes": meta.get("classes", []),
        "total_test_samples": metrics.get("total_test_samples"),
        "cv_weighted_f1_mean": metrics.get("cv_weighted_f1_mean"),
    }

def get_anomaly_summary_and_top_records(app_state: Any, limit: int = 5, threshold: float = 0.5) -> dict[str, Any]:
    """Retrieve actual Isolation Forest anomaly scores and ranked outlier records."""
    df = app_state.dataset_df
    if df is None:
        return {"status": "error", "message": "No dataset loaded to score anomalies."}
    
    if app_state.anomaly_detector is None:
        try:
            iso_res = train_isolation_forest_detector(df, contamination=0.05, random_state=42)
            app_state.anomaly_detector = iso_res["pipeline"]
            app_state.anomaly_detector_metadata = iso_res["metadata"]
        except Exception as e:
            return {"status": "error", "message": f"Failed to train Isolation Forest: {str(e)}"}
    
    try:
        res = detect_anomalies(
            pipeline=app_state.anomaly_detector,
            metadata=app_state.anomaly_detector_metadata or {},
            df=df,
            custom_threshold=threshold,
        )
        flagged = res.get("flagged_records", [])
        top_anomalies = sorted(flagged, key=lambda x: x["anomaly_score"], reverse=True)[:limit]
        return {
            "status": "success",
            "total_records": res.get("total_records"),
            "flagged_count": res.get("flagged_count"),
            "flagged_percentage": res.get("flagged_percentage"),
            "threshold_used": threshold,
            "top_outliers": top_anomalies,
            "interpretation": res.get("interpretation"),
        }
    except Exception as e:
        return {"status": "error", "message": f"Anomaly detection failed: {str(e)}"}

def get_feature_explanations(app_state: Any, model_id: Optional[str] = None, top_n: int = 8) -> dict[str, Any]:
    """Retrieve global feature importance ranking for the active or requested model."""
    target_id = model_id or app_state.active_model_id
    if not target_id or target_id not in app_state.models:
        return {"status": "error", "message": "No trained model available for explainability."}
    
    m = app_state.models[target_id]
    try:
        exp = compute_global_feature_importance(m["pipeline"], m["metadata"], top_n=top_n)
        return {"status": "success", "explanation": exp}
    except Exception as e:
        return {"status": "error", "message": f"Feature attribution error: {str(e)}"}

def explain_specific_record(app_state: Any, record_data: dict[str, Any], model_id: Optional[str] = None) -> dict[str, Any]:
    """Run model inference and local feature attribution on a specific network flow record."""
    target_id = model_id or app_state.active_model_id
    if not target_id or target_id not in app_state.models:
        return {"status": "error", "message": "No active classifier available to evaluate record."}
    
    m = app_state.models[target_id]
    try:
        pred_res = predict_network_flows(m["pipeline"], m["metadata"], pd.DataFrame([record_data]))
        predicted_class = pred_res["records"][0]["predicted_class"]
        confidence = pred_res["records"][0].get("confidence")

        local_exp = compute_local_prediction_explanation(
            pipeline=m["pipeline"],
            metadata=m["metadata"],
            record_dict=record_data,
            predicted_class=predicted_class,
        )
        return {
            "status": "success",
            "predicted_class": predicted_class,
            "confidence": confidence,
            "top_drivers": local_exp.get("top_drivers", []),
            "narrative_summary": local_exp.get("narrative_summary"),
        }
    except Exception as e:
        return {"status": "error", "message": f"Record attribution failed: {str(e)}"}

def trigger_investigation(app_state: Any, title: Optional[str] = None, threshold: float = 0.5, max_records: int = 25) -> dict[str, Any]:
    """Execute the multi-agent investigation workflow: Traffic Analyst -> Investigation Agent -> Reporting Agent."""
    df = app_state.dataset_df
    if df is None:
        return {"status": "error", "message": "Cannot trigger investigation without a loaded dataset."}
    
    # Anomaly scoring
    if app_state.anomaly_detector is None:
        iso_res = train_isolation_forest_detector(df, contamination=0.05, random_state=42)
        app_state.anomaly_detector = iso_res["pipeline"]
        app_state.anomaly_detector_metadata = iso_res["metadata"]
    
    anomaly_results = detect_anomalies(
        pipeline=app_state.anomaly_detector,
        metadata=app_state.anomaly_detector_metadata or {},
        df=df,
        custom_threshold=threshold,
    )

    global_exp = None
    model_name = None
    if app_state.active_model_id and app_state.active_model_id in app_state.models:
        m = app_state.models[app_state.active_model_id]
        model_name = m["metadata"].get("model_name")
        try:
            global_exp = compute_global_feature_importance(m["pipeline"], m["metadata"], top_n=10)
        except Exception:
            global_exp = None

    investigation_record = orchestrator.run_investigation(
        df=df,
        dataset_name=app_state.dataset_name or "active_dataset.csv",
        anomaly_results=anomaly_results,
        global_explanation=global_exp,
        model_name=model_name,
        custom_title=title or "Automated Copilot Forensic Investigation",
        max_records=max_records,
    )

    return {
        "status": "success",
        "investigation_id": investigation_record["investigation_id"],
        "title": investigation_record["title"],
        "report_id": investigation_record["final_report_json"].get("report_id") if investigation_record.get("final_report_json") else None,
        "risk_rating": investigation_record["final_report_json"].get("risk_rating") if investigation_record.get("final_report_json") else "Medium",
        "candidate_count": investigation_record["evidence_dossier"].get("candidate_flows_count", 0),
    }
