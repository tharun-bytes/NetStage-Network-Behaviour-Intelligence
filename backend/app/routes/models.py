from typing import Any
from fastapi import APIRouter, HTTPException, status

from backend.app.config import settings
from backend.app.schemas.model import ModelSummary, TrainModelRequest, TrainModelResponse
from backend.app.state import app_state
from src.ml.artifacts import (
    list_available_model_artifacts,
    load_model_artifact,
    save_model_artifact,
)
from src.ml.train import train_classification_model

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=list[ModelSummary])
def list_models() -> list[ModelSummary]:
    """List all trained in-memory and disk-persisted machine learning models."""
    summaries = []
    
    # In-memory models
    for m_id, m_dict in app_state.models.items():
        meta = m_dict.get("metadata", {})
        metrics = m_dict.get("metrics", {})
        summaries.append(ModelSummary(
            model_id=m_id,
            model_name=meta.get("model_name", m_id),
            model_type=meta.get("model_type", "unknown"),
            accuracy=metrics.get("accuracy", 0.0),
            macro_f1=metrics.get("macro_f1", 0.0),
            weighted_f1=metrics.get("weighted_f1", 0.0),
            saved_at=meta.get("saved_at"),
            is_active=(m_id == app_state.active_model_id)
        ))

    # Persisted artifacts not in memory
    persisted = list_available_model_artifacts(settings.MODELS_DIR)
    known_ids = {s.model_id for s in summaries}
    for p in persisted:
        if p["model_id"] not in known_ids:
            summaries.append(ModelSummary(
                model_id=p["model_id"],
                model_name=p.get("model_name", p["model_id"]),
                model_type=p.get("model_type", "unknown"),
                accuracy=p.get("accuracy", 0.0),
                macro_f1=p.get("macro_f1", 0.0),
                weighted_f1=p.get("weighted_f1", 0.0),
                saved_at=p.get("saved_at"),
                is_active=False
            ))

    return summaries

@router.post("/train", response_model=TrainModelResponse)
def train_model(req: TrainModelRequest) -> TrainModelResponse:
    """Train a machine-learning classification model on the currently active dataset."""
    df = app_state.dataset_df
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset loaded. Please load or upload a dataset before initiating model training."
        )

    try:
        train_result = train_classification_model(
            df=df,
            model_type=req.model_type,
            test_size=req.test_size,
            random_state=req.random_state,
            run_cv=req.run_cv
        )

        pipeline = train_result["pipeline"]
        metadata = train_result["metadata"]
        metrics = train_result["metrics"]

        # Save artifact to disk
        model_id = save_model_artifact(
            pipeline=pipeline,
            metadata=metadata,
            metrics=metrics,
            output_dir=settings.MODELS_DIR
        )

        metadata["model_id"] = model_id

        # Cache in memory
        app_state.models[model_id] = {
            "pipeline": pipeline,
            "metadata": metadata,
            "metrics": metrics,
        }
        app_state.active_model_id = model_id

        return TrainModelResponse(
            model_id=model_id,
            model_name=metadata["model_name"],
            model_type=metadata["model_type"],
            metrics=metrics,
            metadata=metadata,
            message="Model successfully trained, evaluated on held-out test split, and saved."
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

@router.get("/{model_id}/metrics")
def get_model_metrics(model_id: str) -> dict[str, Any]:
    """Retrieve detailed evaluation metrics, confusion matrix, and split metadata for a specific model."""
    if model_id in app_state.models:
        m = app_state.models[model_id]
        return {
            "model_id": model_id,
            "metadata": m["metadata"],
            "metrics": m["metrics"]
        }

    # Try loading from disk
    try:
        pipeline, full_meta = load_model_artifact(settings.MODELS_DIR, model_id)
        # Cache in memory
        app_state.models[model_id] = {
            "pipeline": pipeline,
            "metadata": full_meta.get("metadata", {}),
            "metrics": full_meta.get("metrics", {}),
        }
        return {
            "model_id": model_id,
            "metadata": full_meta.get("metadata", {}),
            "metrics": full_meta.get("metrics", {})
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model artifact '{model_id}' not found."
        )

@router.post("/{model_id}/activate")
def activate_model(model_id: str):
    """Set the specified model as the default active model for inference."""
    if model_id in app_state.models:
        app_state.active_model_id = model_id
        return {"active_model_id": model_id, "message": "Model activated successfully."}

    try:
        pipeline, full_meta = load_model_artifact(settings.MODELS_DIR, model_id)
        app_state.models[model_id] = {
            "pipeline": pipeline,
            "metadata": full_meta.get("metadata", {}),
            "metrics": full_meta.get("metrics", {}),
        }
        app_state.active_model_id = model_id
        return {"active_model_id": model_id, "message": "Model loaded and activated successfully."}
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model '{model_id}' not found.")
