from typing import Any, Optional
from pydantic import BaseModel, Field

class CopilotChatRequest(BaseModel):
    message: str = Field(..., description="User query or analysis request to the security copilot")
    context_type: Optional[str] = Field("general", description="Context scope: general, anomalies, models, records")
    selected_record: Optional[dict[str, Any]] = Field(None, description="Optional specific flow record being inspected")

class CopilotFinding(BaseModel):
    category: str
    severity: str = Field("medium", description="Severity: info, low, medium, high, critical")
    title: str
    description: str
    supporting_features: list[str] = []

class CopilotChatResponse(BaseModel):
    reply: str
    summary: str
    findings: list[CopilotFinding] = []
    evidence_references: list[str] = []
    uncertainty_notes: str
    recommendations: list[str] = []
    is_rule_based_fallback: bool = True
    provider: str = "Deterministic Rule-Based Intelligence Engine"
