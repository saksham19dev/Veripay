from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.rules.duplicate_rules import DuplicateDetectionRule
from app.rules.base import RuleResult


class DuplicateService:
    def __init__(self):
        self.rule = DuplicateDetectionRule()

    def check_duplicate(
        self,
        invoice_data: Dict[str, Any],
        db: Session,
        exclude_id: Optional[str] = None,
        in_memory_candidates: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[RuleResult]:
        # Fetch candidate invoices from DB
        query = db.query(Invoice)
        if exclude_id:
            query = query.filter(Invoice.id != exclude_id)
        db_invoices = query.limit(500).all()

        candidates: List[Dict[str, Any]] = [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "supplier": inv.supplier,
                "amount": inv.amount,
                "total_amount": inv.total_amount,
                "invoice_date": inv.invoice_date,
                "date": inv.invoice_date,
            }
            for inv in db_invoices
        ]

        if in_memory_candidates:
            candidates.extend(in_memory_candidates)

        context = {"existing_invoices": candidates}
        return self.rule.evaluate(invoice_data, context)
