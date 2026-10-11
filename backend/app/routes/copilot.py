from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.auth import get_current_user_optional
from backend.app.schemas.copilot import (
    ChatMessageItem,
    ConversationSummary,
    CopilotChatRequest,
    CopilotChatResponse,
)
from backend.app.state import app_state
from src.copilot.engine import (
    clear_all_conversations,
    delete_conversation,
    get_or_create_conversation,
    list_conversations,
    process_copilot_turn,
)

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/chat", response_model=CopilotChatResponse)
def chat_with_copilot(
    req: CopilotChatRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
) -> CopilotChatResponse:
    """Ask NetSage AI Copilot for intelligence synthesis, anomaly summaries, flow explanations, or reports."""
    try:
        user_id = current_user["user_id"] if current_user else "guest"
        response_dict = process_copilot_turn(
            user_query=req.message,
            conversation_id=req.conversation_id,
            context_type=req.context_type or "general",
            selected_record=req.selected_record,
            context_data=req.context_data,
            app_state=app_state,
            user_id=user_id,
        )
        return CopilotChatResponse(**response_dict)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security Copilot reasoning error: {str(e)}"
        )

@router.get("/conversations", response_model=list[ConversationSummary])
def get_conversations(
    current_user: Optional[dict] = Depends(get_current_user_optional),
) -> list[ConversationSummary]:
    """Retrieve history of active conversation sessions for current user or guest."""
    user_id = current_user["user_id"] if current_user else "guest"
    return [ConversationSummary(**c) for c in list_conversations(user_id=user_id)]

@router.post("/conversations", response_model=ConversationSummary)
def create_new_conversation(
    title: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional),
) -> ConversationSummary:
    """Initialize a new conversation session for current user or guest."""
    user_id = current_user["user_id"] if current_user else "guest"
    conv = get_or_create_conversation(title=title, user_id=user_id)
    return ConversationSummary(
        conversation_id=conv["conversation_id"],
        title=conv["title"],
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
        message_count=len(conv.get("messages", [])),
    )

@router.get("/conversations/{conversation_id}")
def get_conversation_history(
    conversation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
) -> dict[str, Any]:
    """Retrieve message history and active context for a conversation session."""
    user_id = current_user["user_id"] if current_user else "guest"
    conv = get_or_create_conversation(conversation_id, user_id=user_id)
    return {
        "conversation_id": conv["conversation_id"],
        "title": conv["title"],
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "messages": conv.get("messages", []),
    }

@router.delete("/conversations/{conversation_id}")
def remove_conversation(
    conversation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Delete a specific conversation session."""
    user_id = current_user["user_id"] if current_user else "guest"
    success = delete_conversation(conversation_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Conversation '{conversation_id}' not found.")
    return {"conversation_id": conversation_id, "status": "deleted"}

@router.delete("/conversations")
def clear_conversations(
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Clear conversation history for the current user."""
    user_id = current_user["user_id"] if current_user else "guest"
    clear_all_conversations(user_id=user_id)
    return {"status": "cleared", "message": "All conversations have been removed."}
