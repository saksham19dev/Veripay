from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import require_roles, ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER, get_current_user_context
from app.schemas.exception import (
    ExceptionResponse,
    ExceptionApproveRequest,
    ExceptionRejectRequest,
    ExceptionNoteRequest,
)
from app.schemas.invoice import InvoiceResponse
from app.services.exception_service import ExceptionService
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/exceptions", tags=["Exceptions"])


@router.get(
    "",
    response_model=List[ExceptionResponse],
    summary="List Exceptions with Filtering",
)
def list_exceptions(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, UNDER_REVIEW, RESOLVED, REJECTED, APPROVED"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    exception_type: Optional[str] = Query(None, description="Filter by type"),
    invoice_id: Optional[str] = Query(None, description="Filter by invoice ID"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return ExceptionService.get_exceptions(
        db=db,
        status=status,
        severity=severity,
        exception_type=exception_type,
        invoice_id=invoice_id,
        limit=limit,
    )


@router.get(
    "/{exception_id}",
    response_model=ExceptionResponse,
    summary="Get Detailed Exception by ID",
)
def get_exception(
    exception_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    exc = ExceptionService.get_by_id(db, exception_id)
    return ExceptionResponse(
        id=exc.id,
        invoice_id=exc.invoice_id,
        invoiceId=exc.invoice_id,
        exception_type=exc.exception_type,
        exceptionType=exc.exception_type.lower(),
        exceptionName=exc.title,
        severity=exc.severity,
        title=exc.title,
        description=exc.description,
        explanation=exc.description,
        rule_code=exc.rule_code,
        ruleViolated=exc.rule_code,
        score_weight=exc.score_weight,
        evidence=exc.evidence,
        related_invoice_id=exc.related_invoice_id,
        status=exc.status,
        reviewer_note=exc.reviewer_note,
        created_at=exc.created_at,
        detectedDate=exc.created_at.strftime("%d %b %Y"),
        resolved_at=exc.resolved_at,
        resolved_by=exc.resolved_by,
    )


@router.post(
    "/{id}/approve",
    response_model=InvoiceResponse,
    summary="Approve Exception or Flagged Invoice",
    description="Marks exception/invoice approved, records reviewer note, and writes immutable audit entry.",
)
def approve_exception_or_invoice(
    id: str,
    payload: ExceptionApproveRequest = ExceptionApproveRequest(),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER)),
):
    inv = ExceptionService.approve_exception(
        db=db,
        exception_id=id,
        note=payload.note,
        user_name=user_ctx["name"],
        user_role=user_ctx["role"],
    )
    return InvoiceService.invoice_to_response(inv)


@router.post(
    "/{id}/reject",
    response_model=InvoiceResponse,
    summary="Reject Exception or Flagged Invoice",
    description="Marks exception/invoice rejected, records rejection rationale, and logs compliance audit entry.",
)
def reject_exception_or_invoice(
    id: str,
    payload: ExceptionRejectRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER)),
):
    inv = ExceptionService.reject_exception(
        db=db,
        exception_id=id,
        reason=payload.reason,
        user_name=user_ctx["name"],
        user_role=user_ctx["role"],
    )
    return InvoiceService.invoice_to_response(inv)


@router.post(
    "/{id}/note",
    response_model=InvoiceResponse,
    summary="Add Reviewer Note to Exception or Invoice",
)
def add_exception_note(
    id: str,
    payload: ExceptionNoteRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER)),
):
    inv = ExceptionService.add_note(
        db=db,
        invoice_or_exc_id=id,
        note=payload.note,
        user_name=user_ctx["name"],
        user_role=user_ctx["role"],
    )
    return InvoiceService.invoice_to_response(inv)
