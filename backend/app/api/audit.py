from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context, require_roles, ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Audit Log"])


@router.get(
    "/audit-log",
    response_model=List[AuditLogResponse],
    summary="Get Immutable Audit Logs",
    description="Returns chronological compliance actions: approvals, rejections, notes, batch ingests, and explanations.",
)
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    invoice_id: Optional[str] = Query(None, description="Filter logs for a specific invoice"),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER)),
):
    return AuditService.get_logs(db, limit=limit, invoice_id=invoice_id)
