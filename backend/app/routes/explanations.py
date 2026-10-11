from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.app.config import settings
from backend.app.schemas.explanation import (
    ExplanationRequest,
    GlobalExplanationResponse,
    LocalExplanationResponse,
)
from backend.app.state import app_state
from src.ml.artifacts import load_model_artifact
from src.ml.explain import (
    compute_global_feature_importance,
    compute_local_prediction_explanation,
)

router = APIRouter(prefix="/explanations", tags=["Explainability"])

def _resolve_model(model_id: Optional[str]):
    m_id = model_id or app_state.active_model_id
    if not m_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active model available. Please train or select a model first."
        )

    if m_id in app_state.models:
        return m_id, app_state.models[m_id]["pipeline"], app_state.models[m_id]["metadata"]

    try:
        pipeline, full_meta = load_model_artifact(settings.MODELS_DIR, m_id)
        app_state.models[m_id] = {
            "pipeline": pipeline,
            "metadata": full_meta.get("metadata", {}),
            "metrics": full_meta.get("metrics", {}),
        }
        return m_id, pipeline, full_meta.get("metadata", {})
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model artifact '{m_id}' not found.")

@router.get("/global", response_model=GlobalExplanationResponse)
def get_global_explanation(
    model_id: Optional[str] = Query(None),
    top_n: int = Query(15, ge=3, le=50)
) -> GlobalExplanationResponse:
    """Retrieve global feature importance ranking for the selected model."""
    m_id, pipeline, metadata = _resolve_model(model_id)

    try:
        res = compute_global_feature_importance(pipeline, metadata, top_n=top_n)
        return GlobalExplanationResponse(
            model_id=m_id,
            model_name=metadata.get("model_name", m_id),
            model_type=res["model_type"],
            method=res["method"],
            total_features=res["total_features"],
            top_features=res["top_features"],
            limitations=res["limitations"]
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating explanation: {str(e)}")

@router.post("/local", response_model=LocalExplanationResponse)
def get_local_explanation(req: ExplanationRequest) -> LocalExplanationResponse:
    """Generate interpretable feature attributions and a deterministic plain-language summary for an individual flow."""
    m_id, pipeline, metadata = _resolve_model(req.model_id)

    if not req.record:
        # Default to first row from dataset if none supplied
        if app_state.dataset_df is not None:
            record_dict = app_state.dataset_df.iloc[0].to_dict()
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No flow record provided to explain.")
    else:
        record_dict = req.record

    predicted_cls = req.predicted_class or "Normal"

    try:
        res = compute_local_prediction_explanation(pipeline, metadata, record_dict, predicted_cls)
        return LocalExplanationResponse(
            model_id=m_id,
            model_name=metadata.get("model_name", m_id),
            predicted_class=res["predicted_class"],
            explanation_method=res["explanation_method"],
            top_drivers=res["top_drivers"],
            narrative_summary=res["narrative_summary"],
            limitations=res["limitations"]
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Local explanation error: {str(e)}")
