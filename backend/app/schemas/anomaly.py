from typing import Any, Optional
from pydantic import BaseModel, Field

class AnomalyDetectionRequest(BaseModel):
    contamination: float = Field(0.05, ge=0.01, le=0.5, description="Expected proportion of anomalies in dataset")
    threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Custom normalized threshold (default 0.5)")

class AnomalyDetectionResponse(BaseModel):
    total_records: int
    flagged_count: int
    flagged_percentage: float
    threshold: float
    score_distribution: list[dict[str, Any]]
    feature_comparisons: list[dict[str, Any]]
    flagged_records: list[dict[str, Any]]
    interpretation: str
