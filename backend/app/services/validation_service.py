from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.models.setting import PolicySetting
from app.rules.base import RuleResult
from app.rules.required_fields import RequiredFieldsRule
from app.rules.amount_rules import AmountValidationRule
from app.rules.tax_rules import TaxValidationRule
from app.rules.date_rules import DateValidationRule
from app.rules.policy_rules import PolicyThresholdRule
from app.services.duplicate_service import DuplicateService


class ValidationService:
    def __init__(self):
        self.duplicate_service = DuplicateService()
        self.required_rule = RequiredFieldsRule()
        self.amount_rule = AmountValidationRule()
        self.tax_rule = TaxValidationRule()
        self.date_rule = DateValidationRule()
        self.policy_rule = PolicyThresholdRule()

    def get_active_policy_limit(self, db: Session) -> float:
        setting = db.query(PolicySetting).filter(PolicySetting.id == "default").first()
        if setting and setting.max_invoice_limit:
            return float(setting.max_invoice_limit)
        return settings.MAX_AUTO_APPROVAL_AMOUNT

    def validate_invoice(
        self,
        invoice_data: Dict[str, Any],
        db: Session,
        in_memory_candidates: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[List[RuleResult], int, str, str, str, Optional[str], Optional[str]]:
        """
        Validates invoice against all rules.
        Returns:
            (violations, risk_score, risk_level, status, workflow_status, primary_exception_type, primary_reason)
        """
        violations: List[RuleResult] = []

        # 1. Required Fields
        r1 = self.required_rule.evaluate(invoice_data)
        if r1:
            violations.append(r1)

        # 2. Amount Validation
        r2 = self.amount_rule.evaluate(invoice_data)
        if r2:
            violations.append(r2)

        # 3. Date Validation
        r3 = self.date_rule.evaluate(invoice_data)
        if r3:
            violations.append(r3)

        # 4. Tax Validation
        r4 = self.tax_rule.evaluate(invoice_data)
        if r4:
            violations.append(r4)

        # 5. Policy Limit
        current_limit = self.get_active_policy_limit(db)
        r5 = self.policy_rule.evaluate(invoice_data, {"max_auto_approval_amount": current_limit})
        if r5:
            violations.append(r5)

        # 6. Duplicate Detection
        r6 = self.duplicate_service.check_duplicate(
            invoice_data,
            db,
            exclude_id=invoice_data.get("id"),
            in_memory_candidates=in_memory_candidates,
        )
        if r6:
            violations.append(r6)

        # Calculate explainable risk score
        risk_score = sum(v.score_weight for v in violations)
        # Cap score between 0 and 100
        risk_score = min(100, max(0, risk_score))

        # Risk level categorization
        if risk_score <= settings.RISK_LOW_MAX:
            risk_level = "LOW"
        elif risk_score <= settings.RISK_MEDIUM_MAX:
            risk_level = "MEDIUM"
        elif risk_score <= settings.RISK_HIGH_MAX:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        # Determine workflow status: Auto-Pass vs Human Review
        if len(violations) == 0:
            status = "clean"
            workflow_status = "AUTO_PASS"
            primary_exception_type = None
            primary_reason = "All deterministic validation rules passed"
        else:
            status = "exception"
            workflow_status = "HUMAN_REVIEW"
            
            # Pick highest severity violation as primary
            # Order of preference: CRITICAL / HIGH severity rules (DUPLICATE, POLICY_VIOLATION, TAX_MISMATCH, etc.)
            severity_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
            sorted_violations = sorted(
                violations,
                key=lambda v: (severity_order.get(v.severity, 1), v.score_weight),
                reverse=True,
            )
            top = sorted_violations[0]
            
            # Normalize to frontend exceptionType constants
            type_mapping = {
                "DUPLICATE": "duplicate_invoice",
                "POLICY_VIOLATION": "policy_limit",
                "MISSING_FIELD": "missing_fields",
                "TAX_MISMATCH": "tax_mismatch",
                "AMOUNT_ANOMALY": "amount_anomaly",
                "INVALID_DATE": "invalid_date",
            }
            primary_exception_type = type_mapping.get(top.exception_type, "other")
            primary_reason = top.title

        return (
            violations,
            risk_score,
            risk_level,
            status,
            workflow_status,
            primary_exception_type,
            primary_reason,
        )
