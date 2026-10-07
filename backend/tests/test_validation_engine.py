import pytest
from app.database import SessionLocal, Base, engine
from app.services.validation_service import ValidationService
from app.models.invoice import Invoice


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


def test_auto_pass_clean_invoice(db_session):
    service = ValidationService()

    clean_invoice = {
        "id": "INV-TEST-CLEAN",
        "invoice_number": "INV-TEST-CLEAN",
        "supplier": "Clean Vendor Ltd",
        "invoice_date": "2025-09-10",
        "due_date": "2025-10-10",
        "amount": 20000.0,
        "tax_amount": 3600.0,
        "total_amount": 23600.0,
        "currency": "INR",
    }

    violations, score, level, status, workflow, p_type, p_reason = service.validate_invoice(
        clean_invoice, db_session
    )

    assert len(violations) == 0
    assert score == 0
    assert level == "LOW"
    assert status == "clean"
    assert workflow == "AUTO_PASS"
    assert p_type is None


def test_human_review_flagged_invoice(db_session):
    service = ValidationService()

    # Invoice with policy violation (> 300,000) and tax mismatch
    flagged_invoice = {
        "id": "INV-TEST-FLAGGED",
        "invoice_number": "INV-TEST-FLAGGED",
        "supplier": "High Value Vendor",
        "invoice_date": "2025-09-10",
        "due_date": "2025-10-10",
        "amount": 350000.0,  # Exceeds limit
        "tax_amount": 20000.0,
        "total_amount": 420000.0,  # Tax mismatch: 350k + 20k != 420k
        "currency": "INR",
    }

    violations, score, level, status, workflow, p_type, p_reason = service.validate_invoice(
        flagged_invoice, db_session
    )

    assert len(violations) >= 2
    assert score >= 40  # 20 (policy) + 25 (tax) = 45
    assert level in ["HIGH", "CRITICAL"]
    assert status == "exception"
    assert workflow == "HUMAN_REVIEW"
    assert p_type is not None
