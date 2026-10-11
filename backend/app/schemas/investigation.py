from typing import Any, Optional
from pydantic import BaseModel, Field

class InvestigationStartRequest(BaseModel):
    title: Optional[str] = Field(None, description="Optional custom investigation title")
    target_category: Optional[str] = Field(None, description="Optional specific traffic class to focus investigation on")
    anomaly_threshold: float = Field(0.5, ge=0.0, le=1.0, description="Outlier score cut-off threshold")
    max_records_to_investigate: int = Field(25, ge=5, le=100)

class AgentStepStatus(BaseModel):
    agent_name: str
    stage: str
    status: str = Field("pending", description="Status: pending, running, completed, error")
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    output_summary: Optional[str] = None
    evidence_collected_count: int = 0

class InvestigationDetail(BaseModel):
    investigation_id: str
    title: str
    status: str = Field("running", description="Status: running, completed, canceled, failed")
    created_at: str
    completed_at: Optional[str] = None
    dataset_name: str
    model_name: Optional[str] = None
    steps: list[AgentStepStatus] = []
    evidence_dossier: dict[str, Any] = {}
    final_report_markdown: Optional[str] = None
    final_report_json: Optional[dict[str, Any]] = None

class InvestigationSummary(BaseModel):
    investigation_id: str
    title: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    dataset_name: str
    anomalies_flagged: int = 0
    risk_level: str = "Medium"
