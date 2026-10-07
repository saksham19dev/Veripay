from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel


class RuleResult(BaseModel):
    is_violated: bool
    rule_code: str
    title: str
    description: str
    exception_type: str  # MISSING_FIELD, DUPLICATE, TAX_MISMATCH, INVALID_DATE, AMOUNT_ANOMALY, POLICY_VIOLATION, DATA_INCONSISTENCY
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    score_weight: int = 15
    evidence: Optional[Dict[str, Any]] = None
    related_invoice_id: Optional[str] = None


class BaseRule(ABC):
    @property
    @abstractmethod
    def rule_code(self) -> str:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def evaluate(self, invoice_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Optional[RuleResult]:
        pass
