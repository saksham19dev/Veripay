from typing import Optional, Dict, Any
from app.rules.base import BaseRule, RuleResult
from app.config import settings


class TaxValidationRule(BaseRule):
    @property
    def rule_code(self) -> str:
        return "RULE_TAX_01"

    @property
    def name(self) -> str:
        return "Tax & Total Calculation Check"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        try:
            amount = float(invoice_data.get("amount", 0.0) or 0.0)
            tax_amount = float(invoice_data.get("tax_amount", 0.0) or 0.0)
            total_amount = float(invoice_data.get("total_amount", 0.0) or (amount + tax_amount))
        except (ValueError, TypeError):
            return None

        # Check if tax is negative
        if tax_amount < 0:
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Negative Tax Amount",
                description=f"Negative tax amount calculated (₹{tax_amount:,.2f}).",
                exception_type="TAX_MISMATCH",
                severity="HIGH",
                score_weight=settings.WEIGHT_TAX_MISMATCH,
                evidence={"tax_amount": tax_amount},
            )

        # If both amount and tax exist, compare expected_total vs total_amount
        if amount > 0 and tax_amount > 0 and total_amount > 0:
            expected_total = amount + tax_amount
            difference = abs(expected_total - total_amount)
            # Allow configurable tolerance (e.g. 1% or ₹5 for rounding)
            tolerance_threshold = max(5.0, (amount * (settings.TAX_TOLERANCE_PERCENTAGE / 100.0)))

            if difference > tolerance_threshold:
                return RuleResult(
                    is_violated=True,
                    rule_code=self.rule_code,
                    title="Tax Mismatch: Inconsistent Total Calculation",
                    description=(
                        f"Expected total (Base ₹{amount:,.2f} + Tax ₹{tax_amount:,.2f} = ₹{expected_total:,.2f}) "
                        f"differs from billed total (₹{total_amount:,.2f}) by ₹{difference:,.2f}."
                    ),
                    exception_type="TAX_MISMATCH",
                    severity="HIGH",
                    score_weight=settings.WEIGHT_TAX_MISMATCH,
                    evidence={
                        "base_amount": amount,
                        "tax_amount": tax_amount,
                        "expected_total": round(expected_total, 2),
                        "actual_total": round(total_amount, 2),
                        "variance": round(difference, 2),
                        "tolerance_allowed": round(tolerance_threshold, 2),
                    },
                )

        # Check if tax is higher than amount (abnormal tax rate > 100%)
        if amount > 0 and tax_amount > amount:
            return RuleResult(
                is_violated=True,
                rule_code="RULE_TAX_02",
                title="Abnormal Tax Rate Detected",
                description=f"Tax amount (₹{tax_amount:,.2f}) exceeds the base taxable amount (₹{amount:,.2f}).",
                exception_type="TAX_MISMATCH",
                severity="CRITICAL",
                score_weight=settings.WEIGHT_TAX_MISMATCH,
                evidence={"base_amount": amount, "tax_amount": tax_amount},
            )

        return None
