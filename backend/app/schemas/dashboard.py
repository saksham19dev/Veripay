from typing import Dict, Any, Optional
from pydantic import BaseModel


class DashboardBreakdown(BaseModel):
    duplicateInvoice: int = 0
    amountOverLimit: int = 0
    missingFields: int = 0
    incorrectTaxDetails: int = 0
    other: int = 0


class DashboardStatsResponse(BaseModel):
    # Frontend keys
    totalInvoices: int
    autoPassed: int
    exceptions: int
    pendingReview: int
    totalInvoicesGrowth: float = 12.0
    autoPassedGrowth: float = 18.0
    exceptionsGrowth: float = 27.0
    pendingReviewGrowth: float = -35.0
    breakdown: DashboardBreakdown

    # Extended backend analytics
    total_invoices: int
    auto_passed_invoices: int
    invoices_requiring_review: int
    resolved_exceptions: int
    high_risk_invoices: int
    duplicate_count: int
    total_invoice_amount: float
    exception_rate: float


class ExceptionBreakdownResponse(BaseModel):
    duplicate: int = 0
    tax_mismatch: int = 0
    missing_field: int = 0
    policy_violation: int = 0
    amount_anomaly: int = 0
    other: int = 0
    total: int = 0
