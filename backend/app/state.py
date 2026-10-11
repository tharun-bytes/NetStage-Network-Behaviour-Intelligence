import time
from datetime import datetime, timezone
from typing import Any, Optional
import pandas as pd

class AppState:
    """In-memory session and artifact store for NetSage."""
    def __init__(self):
        self.start_time: float = time.time()
        
        # Dataset state
        self.dataset_df: Optional[pd.DataFrame] = None
        self.dataset_name: Optional[str] = None
        self.dataset_profile: Optional[dict[str, Any]] = None
        self.last_analysis_timestamp: Optional[str] = None
        
        # ML Models state: model_id -> dict with 'pipeline', 'metadata', 'metrics'
        self.models: dict[str, dict[str, Any]] = {}
        self.active_model_id: Optional[str] = None
        
        # Unsupervised Anomaly Detector state
        self.anomaly_detector: Optional[Any] = None
        self.anomaly_detector_metadata: Optional[dict[str, Any]] = None

    def get_uptime(self) -> float:
        return time.time() - self.start_time

    def get_status_summary(self) -> dict[str, Any]:
        has_df = self.dataset_df is not None
        classes_count = 0
        if has_df and "Attack_type" in self.dataset_df.columns:
            classes_count = int(self.dataset_df["Attack_type"].nunique())
            
        return {
            "dataset_loaded": has_df,
            "dataset_name": self.dataset_name,
            "dataset_records_count": len(self.dataset_df) if has_df else 0,
            "dataset_features_count": (len(self.dataset_df.columns) - 1) if (has_df and "Attack_type" in self.dataset_df.columns) else (len(self.dataset_df.columns) if has_df else 0),
            "dataset_classes_count": classes_count,
            "loaded_models_count": len(self.models),
            "active_model_name": self.models.get(self.active_model_id, {}).get("metadata", {}).get("model_name") if self.active_model_id else None,
            "anomaly_detector_ready": self.anomaly_detector is not None,
            "system_timestamp": datetime.now(timezone.utc).isoformat(),
        }

# Global application state instance
app_state = AppState()
