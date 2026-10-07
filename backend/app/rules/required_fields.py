from typing import Optional, Dict, Any, List
from app.rules.base import BaseRule, RuleResult
from app.config import settings


class RequiredFieldsRule(BaseRule):
    @property
    def rule_code(self) -> str:
        return "RULE_REQ_01"

    @property
    def name(self) -> str:
        return "Mandatory Information Check"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        missing: List[str] = []

        # Check invoice number / id
        inv_num = invoice_data.get("invoice_number") or invoice_data.get("id")
        if not inv_num or str(inv_num).strip() in ("", "nan", "None", "null"):
            missing.append("Invoice Number")

        # Check supplier
        supplier = invoice_data.get("supplier") or invoice_data.get("supplier_name")
        if not supplier or str(supplier).strip() in ("", "nan", "None", "null"):
            missing.append("Supplier Name")

        # Check date
        inv_date = invoice_data.get("invoice_date") or invoice_data.get("date")
        if not inv_date or str(inv_date).strip() in ("", "nan", "None", "null"):
            missing.append("Invoice Date")

        # Check amount
        amount = invoice_data.get("amount")
        total_amount = invoice_data.get("total_amount")
        if (amount is None or str(amount).strip() in ("", "nan", "None", "null")) and \
           (total_amount is None or str(total_amount).strip() in ("", "nan", "None", "null")):
            missing.append("Amount")

        if missing:
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Missing Required Invoice Fields",
                description=f"The invoice is missing essential mandatory data: {', '.join(missing)}.",
                exception_type="MISSING_FIELD",
                severity="HIGH" if ("Invoice Number" in missing or "Supplier Name" in missing) else "MEDIUM",
                score_weight=settings.WEIGHT_MISSING_FIELD,
                evidence={"missing_fields": missing},
            )

        return None
