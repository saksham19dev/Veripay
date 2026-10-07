from typing import Optional, Dict, Any
from app.rules.base import BaseRule, RuleResult
from app.config import settings


class PolicyThresholdRule(BaseRule):
    def __init__(self, max_amount: Optional[float] = None):
        self._max_amount = max_amount

    @property
    def rule_code(self) -> str:
        return "RULE_POL_01"

    @property
    def name(self) -> str:
        return "High-Value Policy Limit Rule"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        # Context can override default max amount (e.g. from dynamic DB policy settings)
        threshold = (
            context.get("max_auto_approval_amount")
            if context and "max_auto_approval_amount" in context
            else (self._max_amount or settings.MAX_AUTO_APPROVAL_AMOUNT)
        )

        try:
            amount = float(invoice_data.get("amount", 0.0) or 0.0)
            total_amount = float(invoice_data.get("total_amount", 0.0) or amount)
            effective_amount = max(amount, total_amount)
        except (ValueError, TypeError):
            return None

        if effective_amount > threshold:
            return RuleResult(
                is_violated=True,
                rule_code=self.rule_code,
                title="Policy Violation: Additional Approval Required",
                description=(
                    f"The invoice amount of ₹{effective_amount:,.2f} exceeds company auto-approval "
                    f"threshold of ₹{threshold:,.2f}. Mandatory management review required."
                ),
                exception_type="POLICY_VIOLATION",
                severity="HIGH" if effective_amount > (threshold * 1.5) else "MEDIUM",
                score_weight=settings.WEIGHT_POLICY_VIOLATION,
                evidence={
                    "invoice_amount": effective_amount,
                    "policy_threshold": threshold,
                    "exceeded_by": effective_amount - threshold,
                },
            )

        return None
