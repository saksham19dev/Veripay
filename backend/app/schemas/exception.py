from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ExceptionBase(BaseModel):
    invoice_id: str
    exception_type: str
    severity: str
    title: str
    description: str
    rule_code: str
    score_weight: int = 15
    evidence: Optional[Dict[str, Any]] = None
    related_invoice_id: Optional[str] = None
    status: str = "OPEN"
    reviewer_note: Optional[str] = None


class ExceptionResponse(ExceptionBase):
    id: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    # Frontend camelCase aliases
    invoiceId: Optional[str] = None
    exceptionType: Optional[str] = None
    exceptionName: Optional[str] = None
    detectedDate: Optional[str] = None
    ruleViolated: Optional[str] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ExceptionApproveRequest(BaseModel):
    note: Optional[str] = "Manual exception clearance"


class ExceptionRejectRequest(BaseModel):
    reason: str = "Policy non-compliance"


class ExceptionNoteRequest(BaseModel):
    note: str
