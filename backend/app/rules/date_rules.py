from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.rules.base import BaseRule, RuleResult
from app.config import settings


def parse_flexible_date(date_val: Any) -> Optional[datetime]:
    if not date_val:
        return None
    if isinstance(date_val, datetime):
        return date_val
    s = str(date_val).strip()
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%d %b %Y",
        "%d %B %Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


class DateValidationRule(BaseRule):
    @property
    def rule_code(self) -> str:
        return "RULE_DATE_01"

    @property
    def name(self) -> str:
        return "Invoice Date & Due Date Validation"

    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        inv_date_raw = invoice_data.get("invoice_date") or invoice_data.get("date")
        due_date_raw = invoice_data.get("due_date")

        if not inv_date_raw:
            return None  # Missing field rule handles this

        dt_inv = parse_flexible_date(inv_date_raw)
        if dt_inv is None:
            return RuleResult(
                is_violated=True,
                rule_code="RULE_DATE_INVALID",
                title="Invalid Invoice Date Format",
                description=f"Invoice date '{inv_date_raw}' could not be parsed into a valid calendar date.",
                exception_type="INVALID_DATE",
                severity="HIGH",
                score_weight=settings.WEIGHT_DATA_INCONSISTENCY,
                evidence={"raw_date": str(inv_date_raw)},
            )

        # Check future date (more than 30 days ahead)
        now = datetime.utcnow()
        if dt_inv > (now + timedelta(days=30)):
            return RuleResult(
                is_violated=True,
                rule_code="RULE_DATE_FUTURE",
                title="Future Invoice Date Anomaly",
                description=f"Invoice date {dt_inv.strftime('%d %b %Y')} is more than 30 days in the future.",
                exception_type="INVALID_DATE",
                severity="MEDIUM",
                score_weight=settings.WEIGHT_DATA_INCONSISTENCY,
                evidence={"invoice_date": dt_inv.strftime("%Y-%m-%d")},
            )

        # Check due date vs invoice date
        if due_date_raw:
            dt_due = parse_flexible_date(due_date_raw)
            if dt_due and dt_due < dt_inv:
                return RuleResult(
                    is_violated=True,
                    rule_code="RULE_DATE_DUE_BEFORE_INV",
                    title="Due Date Before Invoice Date",
                    description=(
                        f"Due date ({dt_due.strftime('%d %b %Y')}) cannot precede "
                        f"the invoice date ({dt_inv.strftime('%d %b %Y')})."
                    ),
                    exception_type="INVALID_DATE",
                    severity="HIGH",
                    score_weight=settings.WEIGHT_DATA_INCONSISTENCY,
                    evidence={
                        "invoice_date": dt_inv.strftime("%Y-%m-%d"),
                        "due_date": dt_due.strftime("%Y-%m-%d"),
                    },
                )

        return None
