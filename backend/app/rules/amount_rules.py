from typing import Optional, Dict, Any
from app.rules.base import BaseRule, RuleResult
from app.config import settings


class AmountValidationRule(BaseRule):
    @property
    def rule_code(self) -> str:
        return "RULE_AMT_01"

    @property
    def name(self) -> str:
        return "Amount Validity Check"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        try:
            amount = float(invoice_data.get("amount", 0.0) or 0.0)
            total_amount = float(invoice_data.get("total_amount", 0.0) or amount)
        except (ValueError, TypeError):
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Invalid Amount Format",
                description="Invoice amount or total amount is not a valid numerical value.",
                exception_type="AMOUNT_ANOMALY",
                severity="HIGH",
                score_weight=settings.WEIGHT_AMOUNT_ANOMALY,
                evidence={"amount_raw": invoice_data.get("amount"), "total_raw": invoice_data.get("total_amount")},
            )

        if amount < 0 or total_amount < 0:
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Negative Invoice Amount",
                description=f"Negative invoice amounts detected (Amount: ₹{amount:,.2f}, Total: ₹{total_amount:,.2f}). Requires review.",
                exception_type="AMOUNT_ANOMALY",
                severity="HIGH",
                score_weight=settings.WEIGHT_AMOUNT_ANOMALY,
                evidence={"amount": amount, "total_amount": total_amount},
            )

        if amount == 0 and total_amount == 0:
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Zero Value Invoice",
                description="Invoice amount is zero. Invoices submitted with zero valuation must be verified for accuracy.",
                exception_type="AMOUNT_ANOMALY",
                severity="MEDIUM",
                score_weight=settings.WEIGHT_AMOUNT_ANOMALY,
                evidence={"amount": amount, "total_amount": total_amount},
            )

        return None
