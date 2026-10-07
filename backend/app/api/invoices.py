from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context, require_roles, ROLE_REQUESTER, ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER
from app.schemas.invoice import InvoiceResponse, InvoiceListResponse, InvoiceUploadResponse, AddNoteRequest
from app.services.invoice_service import InvoiceService
from app.services.exception_service import ExceptionService

router = APIRouter(prefix="/invoices", tags=["Invoices"])
invoice_service = InvoiceService()


@router.post(
    "/upload",
    response_model=InvoiceUploadResponse,
    summary="Upload and Process Invoice Batch (CSV/XLSX/XLS)",
    description="Accepts CSV or Excel file, normalizes fields, executes deterministic rules and duplicate checks, and outputs auto-passed and human-review invoices.",
)
def upload_invoices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    # Validate extension
    filename = file.filename or "uploaded_file.csv"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["csv", "xlsx", "xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '.{ext}'. Supported file types: .csv, .xlsx, .xls",
        )

    return invoice_service.process_and_save_upload(
        file=file,
        db=db,
        user_name=user_ctx["name"],
        user_id=user_ctx["id"],
        user_role=user_ctx["role"],
    )


@router.get(
    "",
    response_model=InvoiceListResponse,
    summary="List Invoices with Filtering and Pagination",
)
def list_invoices(
    status: Optional[str] = Query(None, description="Status filter: clean, exception, pending, all"),
    exceptionType: Optional[str] = Query(None, description="Exception type filter"),
    search: Optional[str] = Query(None, description="Search term across ID, supplier, reason"),
    supplier: Optional[str] = Query(None, description="Filter by supplier name"),
    min_amount: Optional[float] = Query(None, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, description="Maximum amount"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    forceRequesterOnly: bool = Query(False, description="Strictly restrict to current user submissions"),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return invoice_service.get_invoices(
        db=db,
        status=status,
        exception_type=exceptionType,
        search=search,
        supplier=supplier,
        min_amount=min_amount,
        max_amount=max_amount,
        page=page,
        limit=limit,
        user_role=user_ctx["role"],
        user_id=user_ctx["id"],
        force_requester_only=forceRequesterOnly,
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Get Invoice Details by ID",
)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return invoice_service.get_invoice_by_id(
        db=db,
        invoice_id=invoice_id,
        user_role=user_ctx["role"],
        user_id=user_ctx["id"],
    )


@router.post(
    "/{invoice_id}/note",
    response_model=InvoiceResponse,
    summary="Add Reviewer Note to Invoice",
)
def add_invoice_note(
    invoice_id: str,
    payload: AddNoteRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER)),
):
    inv = ExceptionService.add_note(
        db=db,
        invoice_or_exc_id=invoice_id,
        note=payload.note,
        user_name=user_ctx["name"],
        user_role=user_ctx["role"],
    )
    return invoice_service.invoice_to_response(inv)


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Invoice Record (Finance Manager Only)",
)
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_FINANCE_MANAGER)),
):
    invoice_service.delete_invoice(
        db=db,
        invoice_id=invoice_id,
        user_name=user_ctx["name"],
        user_role=user_ctx["role"],
    )
    return None
