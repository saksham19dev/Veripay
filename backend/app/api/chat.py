from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context
from app.schemas.chat import ChatRequest, ChatResponse
from app.ai.service import AIServiceModule

router = APIRouter(tags=["AI Assistant"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="AI Assistant Chat Query",
    description="Provides factual explanations, duplicate evidence breakdowns, policy violations, and accounts payable insights.",
)
def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return AIServiceModule.chat_query(
        message=payload.message,
        db=db,
        invoice_id=payload.invoice_id,
        exception_id=payload.exception_id,
    )
