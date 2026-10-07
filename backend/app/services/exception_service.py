from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.exception import InvoiceException
from app.models.invoice import Invoice
from app.services.audit_service import AuditService
from app.schemas.exception import ExceptionResponse


class ExceptionService:
    @staticmethod
    def get_exceptions(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        exception_type: Optional[str] = None,
        invoice_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[ExceptionResponse]:
        query = db.query(InvoiceException)
        if status and status.lower() != "all":
            query = query.filter(InvoiceException.status.ilike(status))
        if severity and severity.lower() != "all":
            query = query.filter(InvoiceException.severity.ilike(severity))
        if exception_type and exception_type.lower() != "all":
            query = query.filter(InvoiceException.exception_type.ilike(exception_type))
        if invoice_id:
            query = query.filter(InvoiceException.invoice_id == invoice_id)

        items = query.order_by(InvoiceException.created_at.desc()).limit(limit).all()
        results = []
        for exc in items:
            date_str = exc.created_at.strftime("%d %b %Y")
            results.append(
                ExceptionResponse(
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
                    detectedDate=date_str,
                    resolved_at=exc.resolved_at,
                    resolved_by=exc.resolved_by,
                )
            )
        return results

    @staticmethod
    def get_by_id(db: Session, exception_id: str) -> InvoiceException:
        exc = db.query(InvoiceException).filter(InvoiceException.id == exception_id).first()
        if not exc:
            raise HTTPException(status_code=404, detail=f"Exception with id '{exception_id}' not found")
        return exc

    @staticmethod
    def approve_exception(
        db: Session,
        exception_id: str,
        note: Optional[str] = None,
        user_name: str = "AP Reviewer",
        user_role: str = "AP_REVIEWER",
    ) -> Invoice:
        # Check if exception_id is an Exception ID (EXC-) or directly an Invoice ID (INV-)
        exc = db.query(InvoiceException).filter(InvoiceException.id == exception_id).first()
        invoice = None
        if exc:
            invoice = db.query(Invoice).filter(Invoice.id == exc.invoice_id).first()
            exc.status = "APPROVED"
            exc.resolved_at = datetime.utcnow()
            exc.resolved_by = user_name
            exc.reviewer_note = note or "Exception verified and cleared by auditor"
        else:
            invoice = db.query(Invoice).filter(Invoice.id.ilike(exception_id)).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice / Exception record not found")

        prev_status = invoice.status
        invoice.status = "clean"
        invoice.workflow_status = "APPROVED"
        invoice.reason = None
        invoice_notes = list(invoice.notes or [])
        approval_note = note or "Approved manually by AP Reviewer"
        invoice_notes.append(f"Approved: {approval_note}")
        invoice.notes = invoice_notes
        invoice.updated_at = datetime.utcnow()

        # Update all linked exceptions for this invoice
        all_excs = db.query(InvoiceException).filter(InvoiceException.invoice_id == invoice.id).all()
        for e in all_excs:
            e.status = "APPROVED"
            e.resolved_at = datetime.utcnow()
            e.resolved_by = user_name
            e.reviewer_note = approval_note

        db.commit()
        db.refresh(invoice)

        # Create immutable Audit Log
        AuditService.create_log(
            db=db,
            action="Invoice Approved",
            user=f"{user_name} ({user_role.replace('_', ' ').title()})",
            invoice_id=invoice.id,
            user_role=user_role,
            entity_type="INVOICE",
            entity_id=invoice.id,
            previous_status=prev_status,
            new_status="clean",
            reason=approval_note,
            metadata_json={"exception_cleared": exception_id},
        )

        return invoice

    @staticmethod
    def reject_exception(
        db: Session,
        exception_id: str,
        reason: str,
        user_name: str = "AP Reviewer",
        user_role: str = "AP_REVIEWER",
    ) -> Invoice:
        exc = db.query(InvoiceException).filter(InvoiceException.id == exception_id).first()
        invoice = None
        if exc:
            invoice = db.query(Invoice).filter(Invoice.id == exc.invoice_id).first()
            exc.status = "REJECTED"
            exc.resolved_at = datetime.utcnow()
            exc.resolved_by = user_name
            exc.reviewer_note = reason
        else:
            invoice = db.query(Invoice).filter(Invoice.id.ilike(exception_id)).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice / Exception record not found")

        prev_status = invoice.status
        invoice.status = "exception"
        invoice.workflow_status = "REJECTED"
        invoice.reason = f"Rejected: {reason}"
        invoice_notes = list(invoice.notes or [])
        invoice_notes.append(f"Rejected: {reason}")
        invoice.notes = invoice_notes
        invoice.updated_at = datetime.utcnow()

        all_excs = db.query(InvoiceException).filter(InvoiceException.invoice_id == invoice.id).all()
        for e in all_excs:
            e.status = "REJECTED"
            e.resolved_at = datetime.utcnow()
            e.resolved_by = user_name
            e.reviewer_note = reason

        db.commit()
        db.refresh(invoice)

        AuditService.create_log(
            db=db,
            action="Invoice Rejected",
            user=f"{user_name} ({user_role.replace('_', ' ').title()})",
            invoice_id=invoice.id,
            user_role=user_role,
            entity_type="INVOICE",
            entity_id=invoice.id,
            previous_status=prev_status,
            new_status="Rejected",
            reason=reason,
            metadata_json={"rejection_reason": reason},
        )

        return invoice

    @staticmethod
    def add_note(
        db: Session,
        invoice_or_exc_id: str,
        note: str,
        user_name: str = "AP Reviewer",
        user_role: str = "AP_REVIEWER",
    ) -> Invoice:
        exc = db.query(InvoiceException).filter(InvoiceException.id == invoice_or_exc_id).first()
        invoice = None
        if exc:
            invoice = db.query(Invoice).filter(Invoice.id == exc.invoice_id).first()
            exc.reviewer_note = note
        else:
            invoice = db.query(Invoice).filter(Invoice.id.ilike(invoice_or_exc_id)).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice record not found")

        invoice_notes = list(invoice.notes or [])
        invoice_notes.append(note)
        invoice.notes = invoice_notes
        invoice.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(invoice)

        AuditService.create_log(
            db=db,
            action="Reviewer Note Added",
            user=f"{user_name} ({user_role.replace('_', ' ').title()})",
            invoice_id=invoice.id,
            user_role=user_role,
            entity_type="INVOICE",
            entity_id=invoice.id,
            previous_status=invoice.status,
            new_status=invoice.status,
            reason=f"Note: {note}",
        )

        return invoice
