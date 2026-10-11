from typing import Any, Optional
from pydantic import BaseModel, Field

class ExplanationRequest(BaseModel):
    model_id: Optional[str] = None
    record: Optional[dict[str, Any]] = None
    predicted_class: Optional[str] = None
    top_n: int = Field(15, ge=3, le=50)

class GlobalExplanationResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    method: str
    total_features: int
    top_features: list[dict[str, Any]]
    limitations: str

class LocalExplanationResponse(BaseModel):
    model_id: str
    model_name: str
    predicted_class: str
    explanation_method: str
    top_drivers: list[dict[str, Any]]
    narrative_summary: str
    limitations: str
