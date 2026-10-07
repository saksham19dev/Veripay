from typing import Optional, List
from pydantic import BaseModel


class BreakdownItem(BaseModel):
    label: str
    count: int


class ChatRequest(BaseModel):
    message: str
    invoice_id: Optional[str] = None
    exception_id: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    sender: str = "assistant"
    text: str
    timestamp: str
    matchedFields: Optional[List[str]] = None
    actionLabel: Optional[str] = None
    actionUrl: Optional[str] = None
    breakdownList: Optional[List[BreakdownItem]] = None
    isThinking: Optional[bool] = False
