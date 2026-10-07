import os
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.invoice import Invoice
from app.models.exception import InvoiceException
from app.schemas.chat import ChatResponse, BreakdownItem


class AIService:
    @staticmethod
    def generate_invoice_explanation(invoice: Invoice, violations: List[Any]) -> str:
        """Generates an explainable summary of why an invoice was auto-passed or flagged."""
        if not violations:
            return (
                f"Invoice {invoice.id} for {invoice.supplier} (₹{invoice.amount:,.2f}) successfully passed "
                "all automated checks including mandatory fields, tax calculation, duplicate checks, "
                "and policy limits without discrepancies."
            )

        explanation_parts = []
        for v in violations:
            title = getattr(v, "title", str(v))
            desc = getattr(v, "description", "")
            explanation_parts.append(f"• {title}: {desc}")

        reasons_text = "\n".join(explanation_parts)
        return (
            f"Invoice {invoice.id} flagged for human review (Risk Score: {invoice.risk_score}/100, Level: {invoice.risk_level}). "
            f"Detected rule violations:\n{reasons_text}\n"
            "Recommendation: Manual inspection required before accounts payable authorization."
        )

    @staticmethod
    def answer_chat(
        message: str,
        db: Session,
        invoice_id: Optional[str] = None,
        exception_id: Optional[str] = None,
    ) -> ChatResponse:
        lower = message.lower()
        now = datetime.utcnow()
        time_str = now.strftime("%I:%M %p")
        msg_id = f"msg-{int(now.timestamp() * 1000)}"

        # 1. Resolve invoice context
        target_inv: Optional[Invoice] = None
        if invoice_id:
            target_inv = db.query(Invoice).filter(Invoice.id.ilike(invoice_id)).first()
        elif exception_id:
            exc = db.query(InvoiceException).filter(InvoiceException.id == exception_id).first()
            if exc:
                target_inv = db.query(Invoice).filter(Invoice.id == exc.invoice_id).first()
        else:
            # Check if an invoice ID pattern is in the message (e.g. inv-00124 or 124)
            all_invoices = db.query(Invoice).limit(200).all()
            for inv in all_invoices:
                if inv.id.lower() in lower or (inv.invoice_number and inv.invoice_number.lower() in lower):
                    target_inv = inv
                    break
            if not target_inv and ("124" in lower):
                target_inv = db.query(Invoice).filter(Invoice.id.ilike("%124%")).first()

        # If LLM API Key is configured, attempt real LLM call
        if settings.OPENAI_API_KEY and settings.AI_PROVIDER == "openai":
            try:
                import httpx
                # Build context
                context_str = "You are VeriFlow AI, an accounts payable assistant. Do NOT invent invoice facts."
                if target_inv:
                    context_str += (
                        f"\nContext: Invoice {target_inv.id}, Supplier: {target_inv.supplier}, "
                        f"Amount: ₹{target_inv.amount}, Status: {target_inv.status}, Risk Score: {target_inv.risk_score}, "
                        f"Rule Violated: {target_inv.rule_violated}, Explanation: {target_inv.ai_explanation}."
                    )
                resp = httpx.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.AI_MODEL_NAME or "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": context_str},
                            {"role": "user", "content": message},
                        ],
                        "temperature": 0.2,
                    },
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    return ChatResponse(
                        id=msg_id,
                        sender="assistant",
                        text=answer_text,
                        timestamp=time_str,
                        actionLabel="View Record" if target_inv else None,
                        actionUrl=f"/invoices/{target_inv.id}" if target_inv else None,
                    )
            except Exception:
                pass  # Fall back to deterministic grounded AI response

        # Deterministic Grounded Mock AI Engine
        # Case A: An invoice is specifically in focus
        if target_inv:
            inv_exceptions = (
                db.query(InvoiceException)
                .filter(InvoiceException.invoice_id == target_inv.id)
                .all()
            )
            
            if "duplicate" in lower or "possible duplicate" in lower:
                if target_inv.matched_evidence:
                    ev = target_inv.matched_evidence
                    matched_id = ev.get("matchedInvoiceId", "unknown")
                    matched_supplier = ev.get("supplier", target_inv.supplier)
                    matched_amt = ev.get("amount", target_inv.amount)
                    matched_fields = ev.get("matchedFields", ["Supplier Name", "Invoice Amount"])
                    return ChatResponse(
                        id=msg_id,
                        sender="assistant",
                        text=(
                            f"Invoice {target_inv.id} has a high duplicate risk score. "
                            f"It matches prior record {matched_id} for supplier '{matched_supplier}' with "
                            f"identical amount ₹{matched_amt:,.2f}. Matched fields: {', '.join(matched_fields)}."
                        ),
                        timestamp=time_str,
                        matchedFields=matched_fields,
                        actionLabel="View Matched Record",
                        actionUrl=f"/invoices/{matched_id}",
                    )
                else:
                    return ChatResponse(
                        id=msg_id,
                        sender="assistant",
                        text=f"Invoice {target_inv.id} does not show duplicate matching signals in the current ledger.",
                        timestamp=time_str,
                        actionLabel="View Details",
                        actionUrl=f"/invoices/{target_inv.id}",
                    )

            if "why" in lower or "flagged" in lower or "rule" in lower or "evidence" in lower or "risk" in lower:
                exc_summary = "; ".join(
                    [f"{e.title} ({e.rule_code}): {e.description}" for e in inv_exceptions]
                ) or target_inv.reason or "No specific violation found."
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=(
                        f"Invoice {target_inv.id} was flagged with a Risk Score of {target_inv.risk_score}/100 ({target_inv.risk_level} Risk). "
                        f"Violations identified: {exc_summary} "
                        "VeriFlow recommends human auditor sign-off before clearance."
                    ),
                    timestamp=time_str,
                    matchedFields=[e.rule_code for e in inv_exceptions] or ["Risk Analysis"],
                    actionLabel="Inspect Invoice",
                    actionUrl=f"/invoices/{target_inv.id}",
                )

            # Summarize invoice
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=(
                    f"Summary for {target_inv.id}: Issued by '{target_inv.supplier}' on {target_inv.invoice_date} "
                    f"for ₹{target_inv.amount:,.2f}. Current status is '{target_inv.status}' with workflow state "
                    f"'{target_inv.workflow_status}'. {target_inv.ai_explanation or ''}"
                ),
                timestamp=time_str,
                actionLabel="Open Invoice Details",
                actionUrl=f"/invoices/{target_inv.id}",
            )

        # Case B: Supplier inquiries (e.g. "Global Supplies" or "Apex")
        all_suppliers = db.query(Invoice.supplier).distinct().all()
        for (sup_name,) in all_suppliers:
            if sup_name and sup_name.lower() in lower:
                sup_invoices = db.query(Invoice).filter(Invoice.supplier == sup_name).all()
                total_sup = len(sup_invoices)
                exc_count = sum(1 for i in sup_invoices if i.status == "exception")
                dup_count = sum(1 for i in sup_invoices if i.exception_type == "duplicate_invoice")
                pol_count = sum(1 for i in sup_invoices if i.exception_type == "policy_limit")
                tax_count = sum(1 for i in sup_invoices if i.exception_type == "tax_mismatch")
                
                breakdowns = []
                if dup_count:
                    breakdowns.append(BreakdownItem(label="Duplicate Invoices", count=dup_count))
                if pol_count:
                    breakdowns.append(BreakdownItem(label="Amount > Policy Limit", count=pol_count))
                if tax_count:
                    breakdowns.append(BreakdownItem(label="Tax Mismatch", count=tax_count))

                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=f"Supplier '{sup_name}' has {total_sup} total invoices in VeriFlow, with {exc_count} active exceptions requiring attention.",
                    timestamp=time_str,
                    breakdownList=breakdowns if breakdowns else None,
                    actionLabel="View Supplier Invoices",
                    actionUrl=f"/invoices?search={sup_name.replace(' ', '+')}",
                )

        # Case C: Queue stats & common exceptions
        if "pending" in lower or "how many" in lower or "review" in lower:
            pending_count = db.query(Invoice).filter(Invoice.status.in_(["exception", "pending"])).count()
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=f"There are currently {pending_count} invoices requiring human review in the queue.",
                timestamp=time_str,
                actionLabel="Review Pending Invoices",
                actionUrl="/exceptions",
            )

        if "common" in lower or "most" in lower:
            dup_count = db.query(Invoice).filter(Invoice.exception_type == "duplicate_invoice").count()
            pol_count = db.query(Invoice).filter(Invoice.exception_type == "policy_limit").count()
            tax_count = db.query(Invoice).filter(Invoice.exception_type == "tax_mismatch").count()
            miss_count = db.query(Invoice).filter(Invoice.exception_type == "missing_fields").count()
            
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=(
                    f"The top exception drivers are Duplicate Invoices ({dup_count}), "
                    f"Policy Limit Violations ({pol_count}), Missing Fields ({miss_count}), "
                    f"and Tax Calculation Mismatches ({tax_count})."
                ),
                timestamp=time_str,
                breakdownList=[
                    BreakdownItem(label="Duplicate Invoices", count=dup_count),
                    BreakdownItem(label="Policy Limit", count=pol_count),
                    BreakdownItem(label="Missing Fields", count=miss_count),
                    BreakdownItem(label="Tax Mismatch", count=tax_count),
                ],
                actionLabel="Inspect Exceptions Breakdown",
                actionUrl="/exceptions",
            )

        # Default helpful assistant response
        total_invs = db.query(Invoice).count()
        clean_invs = db.query(Invoice).filter(Invoice.status == "clean").count()
        exc_invs = db.query(Invoice).filter(Invoice.status == "exception").count()

        return ChatResponse(
            id=msg_id,
            sender="assistant",
            text=(
                f"I analyzed your AP inquiry regarding '{message}'. "
                f"The system currently tracks {total_invs} invoices ({clean_invs} auto-passed, {exc_invs} flagged for review). "
                "You can ask me to explain any invoice ID (e.g. 'Why was INV-00124 flagged?'), examine vendor trends, or check duplicate evidence."
            ),
            timestamp=time_str,
            actionLabel="Explore Invoices",
            actionUrl="/invoices",
        )
