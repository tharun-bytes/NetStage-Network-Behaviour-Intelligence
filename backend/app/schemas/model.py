from typing import Any, Optional
from pydantic import BaseModel, Field

class TrainModelRequest(BaseModel):
    model_type: str = Field("random_forest", description="Model architecture: dummy, logistic_regression, random_forest, xgboost")
    test_size: float = Field(0.2, ge=0.05, le=0.5, description="Holdout test split ratio")
    random_state: int = Field(42, description="Reproducible random seed")
    run_cv: bool = Field(True, description="Whether to execute 5-fold cross-validation on train split")

class ModelSummary(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    accuracy: float
    macro_f1: float
    weighted_f1: float
    saved_at: Optional[str] = None
    is_active: bool = False

class TrainModelResponse(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    metrics: dict[str, Any]
    metadata: dict[str, Any]
    message: str
