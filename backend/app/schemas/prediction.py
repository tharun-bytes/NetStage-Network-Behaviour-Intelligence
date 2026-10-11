from typing import Any, Optional
from pydantic import BaseModel, Field

class SinglePredictionRequest(BaseModel):
    model_id: Optional[str] = Field(None, description="Model ID to invoke, or defaults to active model")
    features: dict[str, Any] = Field(..., description="Dictionary of flow features")

class PredictionResponse(BaseModel):
    model_id: str
    model_name: str
    total_records: int
    predictions_summary: dict[str, int]
    classes: list[str]
    records: list[dict[str, Any]]
    disclaimer: str = (
        "Confidence scores reflect model probabilities conditioned on historical training data. "
        "They do not constitute guaranteed probabilities of actual cyber intrusions."
    )
