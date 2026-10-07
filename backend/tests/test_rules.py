import pytest
from app.rules.required_fields import RequiredFieldsRule
from app.rules.amount_rules import AmountValidationRule
from app.rules.tax_rules import TaxValidationRule
from app.rules.date_rules import DateValidationRule
from app.rules.policy_rules import PolicyThresholdRule
from app.rules.duplicate_rules import DuplicateDetectionRule


def test_required_fields_rule_detects_missing_info():
    rule = RequiredFieldsRule()

    # Missing supplier and invoice number
    res = rule.evaluate({"amount": 500.0, "invoice_date": "2025-09-10"})
    assert res is not None
    assert res.is_violated is True
    assert "Invoice Number" in res.evidence["missing_fields"]
    assert "Supplier Name" in res.evidence["missing_fields"]

    # All required present
    res_clean = rule.evaluate({
        "invoice_number": "INV-100",
        "supplier": "Acme Corp",
        "invoice_date": "2025-09-10",
        "amount": 1000.0,
    })
    assert res_clean is None


def test_amount_validation_rule():
    rule = AmountValidationRule()

    # Negative amount
    res_neg = rule.evaluate({"amount": -50.0, "total_amount": -50.0})
    assert res_neg is not None
    assert res_neg.is_violated is True
    assert res_neg.exception_type == "AMOUNT_ANOMALY"

    # Zero amount
    res_zero = rule.evaluate({"amount": 0.0, "total_amount": 0.0})
    assert res_zero is not None
    assert res_zero.is_violated is True

    # Valid positive amount
    res_valid = rule.evaluate({"amount": 1500.0, "total_amount": 1770.0})
    assert res_valid is None


def test_tax_validation_rule():
    rule = TaxValidationRule()

    # Consistent calculation (100 + 18 = 118)
    res_clean = rule.evaluate({"amount": 100.0, "tax_amount": 18.0, "total_amount": 118.0})
    assert res_clean is None

    # Inconsistent calculation (100 + 18 = 118, but billed 150)
    res_mismatch = rule.evaluate({"amount": 100.0, "tax_amount": 18.0, "total_amount": 150.0})
    assert res_mismatch is not None
    assert res_mismatch.is_violated is True
    assert res_mismatch.exception_type == "TAX_MISMATCH"
    assert res_mismatch.evidence["variance"] == 32.0


def test_date_validation_rule():
    rule = DateValidationRule()

    # Due date before invoice date
    res_due = rule.evaluate({
        "invoice_date": "2025-09-15",
        "due_date": "2025-09-01",
    })
    assert res_due is not None
    assert res_due.is_violated is True
    assert res_due.exception_type == "INVALID_DATE"

    # Valid date sequence
    res_valid = rule.evaluate({
        "invoice_date": "2025-09-01",
        "due_date": "2025-09-30",
    })
    assert res_valid is None


def test_policy_threshold_rule():
    rule = PolicyThresholdRule(max_amount=100000.0)

    # Within limit
    res_within = rule.evaluate({"amount": 50000.0, "total_amount": 59000.0})
    assert res_within is None

    # Exceeding threshold
    res_exceeded = rule.evaluate({"amount": 120000.0, "total_amount": 141600.0})
    assert res_exceeded is not None
    assert res_exceeded.is_violated is True
    assert res_exceeded.exception_type == "POLICY_VIOLATION"


def test_duplicate_detection_rule():
    rule = DuplicateDetectionRule()

    existing = [
        {
            "id": "INV-001",
            "invoice_number": "INV-001",
            "supplier": "ABC Traders",
            "amount": 85000.0,
            "total_amount": 85000.0,
            "invoice_date": "10 Sep 2025",
        }
    ]

    candidate = {
        "id": "INV-002",
        "invoice_number": "INV-001",
        "supplier": "ABC Traders",
        "amount": 85000.0,
        "total_amount": 85000.0,
        "invoice_date": "10 Sep 2025",
    }

    res = rule.evaluate(candidate, {"existing_invoices": existing})
    assert res is not None
    assert res.is_violated is True
    assert res.exception_type == "DUPLICATE"
    assert res.related_invoice_id == "INV-001"
