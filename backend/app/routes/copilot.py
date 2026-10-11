from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.copilot import CopilotChatRequest, CopilotChatResponse
from backend.app.state import app_state
from src.copilot.engine import generate_copilot_response
from src.ml.anomaly import detect_anomalies

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/chat", response_model=CopilotChatResponse)
def chat_with_copilot(req: CopilotChatRequest) -> CopilotChatResponse:
    """Ask NetSage AI Copilot for intelligence synthesis, anomaly summaries, or flow explanations."""
    df = app_state.dataset_df
    profile = app_state.dataset_profile
    active_m_id = app_state.active_model_id
    model_data = app_state.models.get(active_m_id) if active_m_id else None

    # Anomaly summary if ready
    anomaly_data = None
    if app_state.anomaly_detector is not None and df is not None:
        try:
            anomaly_data = detect_anomalies(
                pipeline=app_state.anomaly_detector,
                metadata=app_state.anomaly_detector_metadata or {},
                df=df.head(500)
            )
        except Exception:
            anomaly_data = None

    try:
        response_dict = generate_copilot_response(
            user_query=req.message,
            dataset_profile=profile,
            active_model_data=model_data,
            anomaly_data=anomaly_data,
            selected_record=req.selected_record,
        )
        return CopilotChatResponse(**response_dict)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security Copilot reasoning error: {str(e)}"
        )
