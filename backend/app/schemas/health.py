from typing import Any, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field("healthy", description="Application health status")
    version: str = Field(..., description="API version")
    runtime: str = Field("Python", description="Runtime environment")
    uptime_seconds: float = Field(..., description="Server uptime in seconds")

class SystemStatusResponse(BaseModel):
    dataset_loaded: bool = False
    dataset_name: Optional[str] = None
    dataset_records_count: int = 0
    dataset_features_count: int = 0
    dataset_classes_count: int = 0
    loaded_models_count: int = 0
    active_model_name: Optional[str] = None
    anomaly_detector_ready: bool = False
    system_timestamp: str
