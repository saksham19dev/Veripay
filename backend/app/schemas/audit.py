from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    timestamp: str  # Formatted string for UI
    date: str
    invoiceId: Optional[str] = None
    invoice_id: Optional[str] = None
    action: str
    previousStatus: Optional[str] = "None"
    newStatus: Optional[str] = "Resolved"
    reason: Optional[str] = ""
    user: str
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    entity_type: Optional[str] = "INVOICE"
    entity_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    raw_timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
