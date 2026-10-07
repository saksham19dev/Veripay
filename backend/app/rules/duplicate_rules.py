import difflib
from typing import Optional, Dict, Any, List
from app.rules.base import BaseRule, RuleResult
from app.config import settings


def normalize_str(val: Any) -> str:
    if val is None:
        return ""
    return "".join(c.lower() for c in str(val) if c.isalnum())


class DuplicateDetectionRule(BaseRule):
    @property
    def rule_code(self) -> str:
        return "RULE_DUP_01"

    @property
    def name(self) -> str:
        return "Duplicate Invoice Detection Rule"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        existing_invoices: List[Dict[str, Any]] = context.get("existing_invoices", []) if context else []
        if not existing_invoices:
            return None

        current_id = str(invoice_data.get("id") or "").strip().lower()
        curr_inv_num = normalize_str(invoice_data.get("invoice_number") or invoice_data.get("id"))
        curr_supplier = normalize_str(invoice_data.get("supplier") or invoice_data.get("supplier_name"))
        curr_amount = float(invoice_data.get("amount", 0.0) or 0.0)
        curr_total = float(invoice_data.get("total_amount", 0.0) or curr_amount)
        curr_date = str(invoice_data.get("invoice_date") or invoice_data.get("date") or "").strip()

        best_match = None
        match_reasons = []

        for candidate in existing_invoices:
            cand_id = str(candidate.get("id") or "").strip().lower()
            if current_id and cand_id == current_id:
                continue  # Skip self

            cand_inv_num = normalize_str(candidate.get("invoice_number") or candidate.get("id"))
            cand_supplier = normalize_str(candidate.get("supplier") or candidate.get("supplier_name"))
            cand_amount = float(candidate.get("amount", 0.0) or 0.0)
            cand_total = float(candidate.get("total_amount", 0.0) or cand_amount)
            cand_date = str(candidate.get("invoice_date") or candidate.get("date") or "").strip()

            matched_fields = []

            # 1. Exact invoice number match
            if curr_inv_num and cand_inv_num and curr_inv_num == cand_inv_num:
                matched_fields.append("Invoice Number")

            # 2. Supplier name match (exact or high fuzzy similarity)
            supplier_match = False
            if curr_supplier and cand_supplier:
                if curr_supplier == cand_supplier:
                    matched_fields.append("Supplier Name")
                    supplier_match = True
                else:
                    ratio = difflib.SequenceMatcher(None, curr_supplier, cand_supplier).ratio()
                    if ratio >= 0.85:
                        matched_fields.append("Supplier Name (High Similarity)")
                        supplier_match = True

            # 3. Amount match (exact or within ₹1.0)
            amount_match = False
            if curr_amount > 0 and cand_amount > 0 and abs(curr_amount - cand_amount) < 1.0:
                matched_fields.append("Invoice Amount")
                amount_match = True
            elif curr_total > 0 and cand_total > 0 and abs(curr_total - cand_total) < 1.0:
                matched_fields.append("Total Amount")
                amount_match = True

            # 4. Date match
            if curr_date and cand_date and curr_date == cand_date:
                matched_fields.append("Invoice Date")

            # Strong duplicate condition:
            # - Same invoice number + same supplier, OR
            # - Same supplier + identical amount + same/close date, OR
            # - Same invoice number + identical amount
            is_duplicate = False
            if "Invoice Number" in matched_fields and supplier_match:
                is_duplicate = True
            elif supplier_match and amount_match:
                is_duplicate = True
            elif "Invoice Number" in matched_fields and amount_match:
                is_duplicate = True

            if is_duplicate:
                best_match = candidate
                match_reasons = matched_fields
                break

        if best_match:
            cand_id_display = str(best_match.get("id") or best_match.get("invoice_number"))
            cand_supplier_display = str(best_match.get("supplier") or best_match.get("supplier_name"))
            cand_amount_display = float(best_match.get("amount", 0.0) or 0.0)
            cand_date_display = str(best_match.get("invoice_date") or best_match.get("date") or "")

            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Possible Duplicate Invoice Detected",
                description=(
                    f"Possible duplicate invoice detected. Matches existing record {cand_id_display} "
                    f"from '{cand_supplier_display}' with matching {', '.join(match_reasons)}. "
                    "Manual verification recommended before payment."
                ),
                exception_type="DUPLICATE",
                severity="HIGH" if len(match_reasons) >= 3 else "MEDIUM",
                score_weight=settings.WEIGHT_DUPLICATE,
                evidence={
                    "matchedInvoiceId": cand_id_display,
                    "supplier": cand_supplier_display,
                    "amount": cand_amount_display,
                    "date": cand_date_display,
                    "matchedFields": match_reasons,
                },
                related_invoice_id=cand_id_display,
            )

        return None
