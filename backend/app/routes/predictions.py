import io
from typing import Optional
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
import pandas as pd

from backend.app.config import settings
from backend.app.schemas.prediction import PredictionResponse, SinglePredictionRequest
from backend.app.state import app_state
from src.data.loader import DataLoaderError, load_network_flow_csv
from src.ml.artifacts import load_model_artifact
from src.ml.predict import PredictionError, predict_network_flows

router = APIRouter(prefix="/predictions", tags=["Predictions"])

def _get_model(model_id: Optional[str]):
    m_id = model_id or app_state.active_model_id
    if not m_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active model available. Please train or select a model first."
        )

    if m_id in app_state.models:
        return m_id, app_state.models[m_id]["pipeline"], app_state.models[m_id]["metadata"]

    # Try loading from disk
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

@router.post("/single", response_model=PredictionResponse)
def predict_single_flow(req: SinglePredictionRequest) -> PredictionResponse:
    """Predict traffic category and class probabilities for a single network flow record."""
    m_id, pipeline, metadata = _get_model(req.model_id)

    try:
        df_single = pd.DataFrame([req.features])
        result = predict_network_flows(pipeline, metadata, df_single)

        return PredictionResponse(
            model_id=m_id,
            model_name=metadata.get("model_name", m_id),
            total_records=result["total_records"],
            predictions_summary=result["predictions_summary"],
            classes=result["classes"],
            records=result["records"],
        )

    except PredictionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")

@router.post("/batch", response_model=PredictionResponse)
async def predict_batch_csv(
    file: UploadFile = File(...),
    model_id: Optional[str] = Query(None)
) -> PredictionResponse:
    """Run batch inference on an uploaded unlabelled network flow CSV file."""
    m_id, pipeline, metadata = _get_model(model_id)

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files (.csv) are accepted.")

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large.")

    try:
        bytes_io = io.BytesIO(contents)
        bytes_io.name = file.filename
        df_input, _ = load_network_flow_csv(bytes_io)

        # Drop target column if user mistakenly included it in unlabelled evaluation
        target_col = metadata.get("target_column", "Attack_type")
        if target_col in df_input.columns:
            df_input = df_input.drop(columns=[target_col])

        result = predict_network_flows(pipeline, metadata, df_input)

        return PredictionResponse(
            model_id=m_id,
            model_name=metadata.get("model_name", m_id),
            total_records=result["total_records"],
            predictions_summary=result["predictions_summary"],
            classes=result["classes"],
            records=result["records"],
        )

    except (DataLoaderError, PredictionError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Batch prediction error: {str(e)}")
