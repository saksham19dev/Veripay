import os
import io
import re
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.models.invoice import Invoice
from app.models.exception import InvoiceException
from app.schemas.invoice import InvoiceResponse, InvoiceListResponse, InvoiceUploadResponse
from app.schemas.exception import ExceptionResponse
from app.services.validation_service import ValidationService
from app.services.audit_service import AuditService
from app.services.ai_service import AIService
from app.ai.features import extract_features_from_context
from app.ai.risk_model import risk_model
from app.ai.risk_scoring import calculate_rule_score, combine_scores
from app.ai.evidence import EvidenceEngine
from app.ai.explainer import AIExplainer


# Aliases dictionary for normalizing column headers
COLUMN_ALIASES = {
    "invoice_number": [
        "invoice_number", "invoicenumber", "invoice_no", "invoiceno", "invoice #", "inv_no",
        "inv no", "invoice no.", "invoice no", "inv #", "bill_no", "bill no", "invoice id", "invoiceid", "id"
    ],
    "supplier": [
        "supplier", "supplier_name", "suppliername", "vendor", "vendor_name", "vendorname",
        "payee", "billed from", "company", "party_name", "party"
    ],
    "supplier_id": [
        "supplier_id", "vendor_id", "supplierid", "vendorid", "gstin", "gst_number"
    ],
    "invoice_date": [
        "invoice_date", "invoicedate", "date", "bill_date", "bill date", "issue_date",
        "inv_date", "document date", "doc_date"
    ],
    "due_date": [
        "due_date", "duedate", "payment_due", "due", "payment due date", "net due"
    ],
    "amount": [
        "amount", "subtotal", "taxable_amount", "taxable_value", "base_amount", "net_amount",
        "item_amount", "invoice_amount", "cost"
    ],
    "tax_amount": [
        "tax_amount", "tax", "gst", "gst_amount", "vat", "tax amount", "total tax", "cgst_sgst"
    ],
    "total_amount": [
        "total_amount", "total", "gross_amount", "invoice_total", "grand_total", "final_amount"
    ],
    "currency": [
        "currency", "curr"
    ],
    "purchase_order": [
        "purchase_order", "po", "po_number", "po #", "po number", "order_id"
    ],
    "department": [
        "department", "dept", "cost_center", "business_unit"
    ],
    "description": [
        "description", "notes", "memo", "line_item", "details", "item_description"
    ],
}


def normalize_column_name(col: str) -> Optional[str]:
    cleaned = re.sub(r"[^\w\s#]", "", str(col).strip().lower())
    cleaned_no_spaces = cleaned.replace(" ", "_")

    for canonical, variations in COLUMN_ALIASES.items():
        if cleaned in variations or cleaned_no_spaces in variations:
            return canonical
        for v in variations:
            if v in cleaned:
                return canonical
    return None


class InvoiceService:
    def __init__(self):
        self.validation_service = ValidationService()

    @staticmethod
    def invoice_to_response(inv: Invoice) -> InvoiceResponse:
        """Serializes SQLAlchemy Invoice model into InvoiceResponse with frontend camelCase aliases."""
        date_str = inv.invoice_date or (inv.created_at.strftime("%d %b %Y") if inv.created_at else "")
        created_str = inv.created_at.isoformat() if inv.created_at else ""
        updated_str = inv.updated_at.isoformat() if inv.updated_at else ""

        # Map linked exceptions
        excs_response = []
        if inv.exceptions:
            for e in inv.exceptions:
                excs_response.append(
                    ExceptionResponse(
                        id=e.id,
                        invoice_id=e.invoice_id,
                        invoiceId=e.invoice_id,
                        exception_type=e.exception_type,
                        exceptionType=e.exception_type.lower(),
                        exceptionName=e.title,
                        severity=e.severity,
                        title=e.title,
                        description=e.description,
                        explanation=e.description,
                        rule_code=e.rule_code,
                        ruleViolated=e.rule_code,
                        score_weight=e.score_weight,
                        evidence=e.evidence,
                        related_invoice_id=e.related_invoice_id,
                        status=e.status,
                        reviewer_note=e.reviewer_note,
                        created_at=e.created_at,
                        detectedDate=e.created_at.strftime("%d %b %Y"),
                        resolved_at=e.resolved_at,
                        resolved_by=e.resolved_by,
                    )
                )

        return InvoiceResponse(
            id=inv.id,
            invoice_number=inv.invoice_number,
            supplier=inv.supplier,
            supplier_id=inv.supplier_id,
            date=date_str,
            due_date=inv.due_date,
            amount=inv.amount,
            tax_amount=inv.tax_amount,
            total_amount=inv.total_amount,
            currency=inv.currency or "INR",
            purchase_order=inv.purchase_order,
            department=inv.department or "Operations",
            status=inv.status,
            workflow_status=inv.workflow_status,
            reason=inv.reason,
            exception_type=inv.exception_type,
            rule_violated=inv.rule_violated,
            risk_score=inv.risk_score,
            risk_level=inv.risk_level,
            payment_terms=inv.payment_terms or "Net 30",
            submitted_by=inv.submitted_by,
            submitter_name=inv.submitter_name,
            attachment_name=inv.attachment_name,
            rfi_status=inv.rfi_status or "none",
            rfi_message=inv.rfi_message,
            tax_details=inv.tax_details,
            matched_evidence=inv.matched_evidence,
            ai_explanation=inv.ai_explanation,
            notes=inv.notes or [],
            line_items=inv.line_items or [],
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            # Frontend camelCase
            exceptionType=inv.exception_type,
            ruleViolated=inv.rule_violated,
            taxDetails=inv.tax_details,
            matchedEvidence=inv.matched_evidence,
            aiExplanation=inv.ai_explanation,
            lineItems=inv.line_items or [],
            paymentTerms=inv.payment_terms or "Net 30",
            submittedBy=inv.submitted_by,
            submitterName=inv.submitter_name,
            attachmentName=inv.attachment_name,
            rfiStatus=inv.rfi_status or "none",
            rfiMessage=inv.rfi_message,
            riskScore=inv.risk_score,
            riskLevel=inv.risk_level,
            workflowStatus=inv.workflow_status,
            createdAt=created_str,
            updatedAt=updated_str,
            exceptions=excs_response,
        )

    def parse_file_to_dataframe(self, file_content: bytes, filename: str) -> pd.DataFrame:
        lower_name = filename.lower()
        try:
            if lower_name.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(file_content))
            elif lower_name.endswith(".xlsx") or lower_name.endswith(".xls"):
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file format. Please upload a CSV (.csv) or Excel file (.xlsx, .xls)."
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Failed to parse uploaded document: {str(e)}")

        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")

        return df

    def normalize_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        # Map columns
        column_map = {}
        for col in df.columns:
            canonical = normalize_column_name(col)
            if canonical:
                column_map[col] = canonical

        # Required critical columns
        has_id_or_number = any(val in ["invoice_number"] for val in column_map.values())
        has_supplier = any(val in ["supplier"] for val in column_map.values())
        has_amount = any(val in ["amount", "total_amount"] for val in column_map.values())

        if not (has_id_or_number or has_supplier or has_amount):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not recognize required invoice columns. Please ensure columns include "
                    "variations of Invoice Number, Supplier/Vendor, and Amount."
                )
            )

        # Avoid duplicate column collisions when multiple headers match the same canonical name
        used_canonicals = set()
        clean_col_map = {}
        for col, canonical in column_map.items():
            if canonical not in used_canonicals:
                clean_col_map[col] = canonical
                used_canonicals.add(canonical)

        df_renamed = df.rename(columns=clean_col_map)
        records = []
        for raw_record in df_renamed.to_dict(orient="records"):
            record = {}
            for k, val in raw_record.items():
                try:
                    if pd.isna(val):
                        record[k] = None
                    else:
                        record[k] = val
                except (ValueError, TypeError):
                    record[k] = val
            records.append(record)

        return records

    def process_and_save_upload(
        self,
        file: UploadFile,
        db: Session,
        user_name: str = "AP Ingest Worker",
        user_id: Optional[str] = None,
        user_role: str = "AP_REVIEWER",
    ) -> InvoiceUploadResponse:
        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        df = self.parse_file_to_dataframe(content, file.filename)
        normalized_records = self.normalize_dataframe(df)

        new_invoices: List[Invoice] = []
        new_responses: List[InvoiceResponse] = []
        clean_count = 0
        exceptions_count = 0

        # We keep track of in-memory candidates within the batch for inter-batch duplicate checks
        in_memory_candidates: List[Dict[str, Any]] = []

        batch_timestamp = int(datetime.utcnow().timestamp())

        for idx, row in enumerate(normalized_records):
            inv_id_raw = row.get("invoice_number") or row.get("id")
            if inv_id_raw and str(inv_id_raw).strip() not in ("", "nan", "None"):
                inv_id = str(inv_id_raw).strip()
            else:
                inv_id = f"INV-UP-{batch_timestamp}-{idx+1:03d}"

            supplier = str(row.get("supplier") or row.get("supplier_name") or "Unknown Vendor").strip()
            
            # Numeric conversion
            try:
                amt = float(row.get("amount") or 0.0)
            except (ValueError, TypeError):
                amt = 0.0

            try:
                tax = float(row.get("tax_amount") or 0.0)
            except (ValueError, TypeError):
                tax = 0.0

            try:
                tot = float(row.get("total_amount") or (amt + tax))
            except (ValueError, TypeError):
                tot = amt + tax

            date_str = str(row.get("invoice_date") or row.get("date") or datetime.utcnow().strftime("%d %b %Y"))
            due_str = str(row.get("due_date")) if row.get("due_date") else None
            currency = str(row.get("currency") or "INR")
            po = str(row.get("purchase_order")) if row.get("purchase_order") else None
            dept = str(row.get("department") or "Operations")

            # Structured payload for validation
            eval_payload = {
                "id": inv_id,
                "invoice_number": inv_id,
                "supplier": supplier,
                "amount": amt,
                "tax_amount": tax,
                "total_amount": tot,
                "invoice_date": date_str,
                "date": date_str,
                "due_date": due_str,
                "currency": currency,
            }

            # Run deterministic validation engine
            (
                violations,
                risk_score,
                risk_level,
                status,
                workflow_status,
                primary_exception_type,
                primary_reason,
            ) = self.validation_service.validate_invoice(
                eval_payload,
                db,
                in_memory_candidates=in_memory_candidates,
            )

            # Extract features and compute ML risk score
            features_df = extract_features_from_context(
                invoice_dict=eval_payload,
                db=db,
                violations=violations,
                duplicate_candidate=None,
            )
            ml_prob, ml_score = risk_model.predict_risk(features_df)
            rule_sc = calculate_rule_score(violations)
            score_res = combine_scores(rule_score=rule_sc, ml_score=ml_score)
            risk_score = score_res["risk_score"]
            risk_level = score_res["risk_level"]

            # Build evidence and tax details
            matched_evidence = None
            for v in violations:
                if v.exception_type == "DUPLICATE" and v.evidence:
                    matched_evidence = v.evidence
                    break

            tax_details = {
                "taxAmount": tax,
                "isVerified": (tax > 0 and len([v for v in violations if v.exception_type == "TAX_MISMATCH"]) == 0),
            }

            # Build grounded evidence payload
            evidence_obj = EvidenceEngine.build_evidence(
                invoice_dict=eval_payload,
                violations=violations,
                duplicate_candidate=matched_evidence,
            )

            # Generate grounded factual explanation
            ai_explanation = AIExplainer.generate_explanation(
                invoice_id=inv_id,
                risk_level=risk_level,
                risk_score=risk_score,
                evidence=evidence_obj,
                rule_score=rule_sc,
                ml_score=ml_score,
            )

            # Check if invoice with this ID already exists in DB (handle gracefully / update or version)
            existing = db.query(Invoice).filter(Invoice.id == inv_id).first()
            if existing:
                inv_id = f"{inv_id}-DUP"

            invoice_record = Invoice(
                id=inv_id,
                invoice_number=str(row.get("invoice_number") or inv_id),
                supplier=supplier,
                supplier_id=str(row.get("supplier_id") or ""),
                invoice_date=date_str,
                due_date=due_str,
                amount=amt,
                tax_amount=tax,
                total_amount=tot,
                currency=currency,
                purchase_order=po,
                department=dept,
                status=status,
                workflow_status=workflow_status,
                reason=primary_reason if status == "exception" else None,
                exception_type=primary_exception_type,
                rule_violated=violations[0].rule_code if violations else None,
                risk_score=risk_score,
                risk_level=risk_level,
                tax_details=tax_details,
                matched_evidence=matched_evidence,
                ai_explanation=ai_explanation,
                notes=[],
                line_items=[{"description": str(row.get("description") or "Item Services"), "amount": amt}],
                payment_terms=str(row.get("payment_terms") or "Net 30"),
                submitted_by=user_id or "usr-req-01",
                submitter_name=user_name,
                attachment_name=file.filename,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            db.add(invoice_record)

            # Create Exception records for each violation
            for v_idx, v in enumerate(violations):
                exc_rec = InvoiceException(
                    id=f"EXC-{int(datetime.utcnow().timestamp())}-{idx+1:02d}-{v_idx+1:02d}",
                    invoice_id=inv_id,
                    exception_type=v.exception_type,
                    severity=v.severity,
                    title=v.title,
                    description=v.description,
                    rule_code=v.rule_code,
                    score_weight=v.score_weight,
                    evidence=v.evidence,
                    related_invoice_id=v.related_invoice_id,
                    status="OPEN",
                    created_at=datetime.utcnow(),
                )
                db.add(exc_rec)

            in_memory_candidates.append(eval_payload)
            new_invoices.append(invoice_record)

            if status == "clean":
                clean_count += 1
            else:
                exceptions_count += 1

        db.commit()

        # Audit log for file upload batch
        AuditService.create_log(
            db=db,
            action="Batch Ingest Completed",
            user=f"{user_name} ({user_role.replace('_', ' ').title()})",
            invoice_id=f"BATCH-{batch_timestamp}",
            user_id=user_id,
            user_role=user_role,
            previous_status="None",
            new_status="Resolved",
            reason=f"Uploaded {file.filename}: {len(new_invoices)} records processed ({clean_count} auto-passed, {exceptions_count} exceptions).",
            metadata_json={"filename": file.filename, "total": len(new_invoices), "clean": clean_count, "exceptions": exceptions_count},
        )

        # Refresh and serialize
        for inv in new_invoices:
            db.refresh(inv)
            new_responses.append(self.invoice_to_response(inv))

        return InvoiceUploadResponse(
            total=len(new_invoices),
            clean=clean_count,
            exceptions=exceptions_count,
            newInvoices=new_responses,
        )

    def get_invoices(
        self,
        db: Session,
        status: Optional[str] = None,
        exception_type: Optional[str] = None,
        search: Optional[str] = None,
        supplier: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        page: int = 1,
        limit: int = 20,
        user_role: str = "AP_REVIEWER",
        user_id: Optional[str] = None,
        force_requester_only: bool = False,
    ) -> InvoiceListResponse:
        query = db.query(Invoice)

        # Role-based restriction: REQUESTER can only see own invoices
        if user_role == "REQUESTER" or force_requester_only:
            req_id = user_id or "usr-req-01"
            query = query.filter((Invoice.submitted_by == req_id) | (Invoice.submitted_by == None))

        # Status filter
        if status and status.lower() != "all":
            query = query.filter(Invoice.status == status.lower())

        # Exception type filter
        if exception_type and exception_type.lower() != "all":
            query = query.filter(Invoice.exception_type == exception_type.lower())

        # Supplier filter
        if supplier and supplier.lower() != "all":
            query = query.filter(Invoice.supplier.ilike(f"%{supplier}%"))

        # Amount range
        if min_amount is not None:
            query = query.filter(Invoice.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Invoice.amount <= max_amount)

        # Search term across ID, supplier, reason, amounts
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (Invoice.id.ilike(s)) |
                (Invoice.supplier.ilike(s)) |
                (Invoice.reason.ilike(s)) |
                (Invoice.invoice_number.ilike(s))
            )

        total = query.count()
        page = max(1, page)
        limit = max(1, min(100, limit))
        total_pages = max(1, (total + limit - 1) // limit)
        offset = (page - 1) * limit

        invoices = query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()
        response_list = [self.invoice_to_response(inv) for inv in invoices]

        return InvoiceListResponse(
            invoices=response_list,
            total=total,
            page=page,
            totalPages=total_pages,
        )

    def get_invoice_by_id(
        self,
        db: Session,
        invoice_id: str,
        user_role: str = "AP_REVIEWER",
        user_id: Optional[str] = None,
    ) -> InvoiceResponse:
        inv = db.query(Invoice).filter(Invoice.id.ilike(invoice_id)).first()
        if not inv:
            raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")

        # Requester confidentiality check
        if user_role == "REQUESTER":
            req_id = user_id or "usr-req-01"
            if inv.submitted_by and inv.submitted_by != req_id:
                raise HTTPException(
                    status_code=403,
                    detail="403 Forbidden: You do not have permission to view other users' confidential invoices."
                )

        return self.invoice_to_response(inv)

    def delete_invoice(
        self,
        db: Session,
        invoice_id: str,
        user_name: str = "Manager",
        user_role: str = "FINANCE_MANAGER",
    ):
        if user_role != "FINANCE_MANAGER":
            raise HTTPException(status_code=403, detail="403 Forbidden: Only Finance Managers can delete invoices.")

        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")

        db.delete(inv)
        db.commit()

        AuditService.create_log(
            db=db,
            action="Invoice Deleted",
            user=f"{user_name} ({user_role})",
            invoice_id=invoice_id,
            user_role=user_role,
            reason="Invoice record purged by Finance Manager",
        )
