from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.anomaly import AnomalyDetectionRequest, AnomalyDetectionResponse
from backend.app.state import app_state
from src.ml.anomaly import (
    AnomalyDetectionError,
    detect_anomalies,
    train_isolation_forest_detector,
)

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.post("/detect", response_model=AnomalyDetectionResponse)
def run_anomaly_detection(req: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
    """Run unsupervised Isolation Forest anomaly scoring on active dataset flows."""
    df = app_state.dataset_df
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset loaded. Please load or upload network flow data first."
        )

    try:
        # Fit Isolation Forest detector if not cached or if contamination changed
        iso_res = train_isolation_forest_detector(
            df=df,
            contamination=req.contamination,
            random_state=42,
            target_column="Attack_type"
        )
        app_state.anomaly_detector = iso_res["pipeline"]
        app_state.anomaly_detector_metadata = iso_res["metadata"]

        # Run scoring
        results = detect_anomalies(
            pipeline=iso_res["pipeline"],
            metadata=iso_res["metadata"],
            df=df,
            custom_threshold=req.threshold
        )

        return AnomalyDetectionResponse(
            total_records=results["total_records"],
            flagged_count=results["flagged_count"],
            flagged_percentage=results["flagged_percentage"],
            threshold=results["threshold"],
            score_distribution=results["score_distribution"],
            feature_comparisons=results["feature_comparisons"],
            flagged_records=results["flagged_records"],
            interpretation=results["interpretation"]
        )

    except AnomalyDetectionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Anomaly detection failed: {str(e)}")
