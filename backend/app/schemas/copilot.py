from typing import Any, Optional
from pydantic import BaseModel, Field

class CopilotChatRequest(BaseModel):
    message: str = Field(..., description="User query or analysis request to the security copilot")
    conversation_id: Optional[str] = Field(None, description="Optional active conversation session ID")
    context_type: Optional[str] = Field("general", description="Context scope: general, anomalies, models, records, dataset")
    selected_record: Optional[dict[str, Any]] = Field(None, description="Optional specific flow record being inspected")
    context_data: Optional[dict[str, Any]] = Field(None, description="Optional extra structured context (e.g. model metrics or anomaly score)")

class CopilotFinding(BaseModel):
    category: str
    severity: str = Field("medium", description="Severity: info, low, medium, high, critical")
    title: str
    description: str
    supporting_features: list[str] = []

class CopilotAction(BaseModel):
    id: str
    label: str
    action_type: str = "navigate"
    payload: dict[str, Any] = {}

class CopilotChatResponse(BaseModel):
    conversation_id: str = "conv_default"
    reply: str
    summary: str
    findings: list[CopilotFinding] = []
    evidence_references: list[str] = []
    uncertainty_notes: str
    recommendations: list[str] = []
    related_actions: list[CopilotAction] = []
    is_rule_based_fallback: bool = True
    provider: str = "Deterministic Rule-Based Intelligence Engine"

class ConversationSummary(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class ChatMessageItem(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str
    data: Optional[CopilotChatResponse] = None
