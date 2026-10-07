import os
import sys
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.invoice import Invoice
from app.models.exception import InvoiceException
from app.models.audit_log import AuditLog
from app.models.setting import PolicySetting


def seed_demo_data():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing records for a pristine demo setup
        db.query(InvoiceException).delete()
        db.query(Invoice).delete()
        db.query(AuditLog).delete()
        db.query(User).delete()
        db.query(PolicySetting).delete()
        db.commit()

        print("Seeding Users...")
        users = [
            User(
                id="usr-req-01",
                name="Alex Rivera",
                email="alex.rivera@enterprise.corp",
                role="REQUESTER",
                department="Procurement & Operations",
                title="Business Requisitioner",
            ),
            User(
                id="usr-rev-02",
                name="Jordan Lee",
                email="jordan.lee@enterprise.corp",
                role="AP_REVIEWER",
                department="Accounts Payable",
                title="Senior AP Auditor",
            ),
            User(
                id="usr-mgr-03",
                name="Elena Rostova",
                email="elena.rostova@enterprise.corp",
                role="FINANCE_MANAGER",
                department="Corporate Finance",
                title="VP Finance & Operations",
            ),
        ]
        db.add_all(users)

        print("Seeding Policy Settings...")
        settings = PolicySetting(
            id="default",
            max_invoice_limit=300000.0,
            duplicate_window_days=30,
            auto_approve_confidence=95.0,
            currency="INR (₹)",
            email_alerts=True,
            slack_alerts=False,
            ai_anomaly_detection=True,
            strict_gst_verification=True,
            theme="light",
        )
        db.add(settings)

        print("Seeding Realistic Invoices for Demo Flow...")

        # 1. Clean Invoice (AUTO-PASS)
        inv_clean = Invoice(
            id="INV-00123",
            invoice_number="INV-00123",
            supplier="Tata Tech Solutions Ltd",
            supplier_id="GSTIN27AABCT1330L1Z2",
            invoice_date="10 Sep 2025",
            due_date="10 Oct 2025",
            amount=45200.0,
            tax_amount=8136.0,
            total_amount=53336.0,
            currency="INR",
            purchase_order="PO-2025-8841",
            department="IT Infrastructure",
            status="clean",
            workflow_status="AUTO_PASS",
            reason="All deterministic validation rules passed",
            exception_type=None,
            rule_violated=None,
            risk_score=0,
            risk_level="LOW",
            tax_details={"gstNumber": "GSTIN27AABCT1330L1Z2", "taxAmount": 8136.0, "taxRate": 18.0, "isVerified": True},
            ai_explanation="Invoice INV-00123 passed all automated 3-way matching and deterministic compliance rules without exceptions.",
            notes=["Auto-approved by VeriFlow Engine"],
            line_items=[
                {"id": "LI-1", "description": "Cloud Migration Consulting Hours", "quantity": 40, "unitPrice": 1130.0, "total": 45200.0}
            ],
            payment_terms="Net 30",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            attachment_name="tata_tech_inv_00123.pdf",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=2),
        )

        # Base Invoice for duplicate scenario
        inv_dup_base = Invoice(
            id="INV-00120",
            invoice_number="INV-00120",
            supplier="Global Supplies Ltd.",
            supplier_id="GSTIN29AABCG7721K1Z4",
            invoice_date="09 Sep 2025",
            due_date="09 Oct 2025",
            amount=120500.0,
            tax_amount=21690.0,
            total_amount=142190.0,
            currency="INR",
            purchase_order="PO-2025-7719",
            department="Facilities",
            status="clean",
            workflow_status="AUTO_PASS",
            risk_score=0,
            risk_level="LOW",
            tax_details={"isVerified": True, "taxAmount": 21690.0},
            notes=["Original approved invoice record"],
            payment_terms="Net 30",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            created_at=datetime.utcnow() - timedelta(days=5),
            updated_at=datetime.utcnow() - timedelta(days=5),
        )

        # 2. Duplicate Invoice (HIGH Risk, Duplicate Exception)
        inv_duplicate = Invoice(
            id="INV-00124",
            invoice_number="INV-00124",
            supplier="Global Supplies Ltd.",
            supplier_id="GSTIN29AABCG7721K1Z4",
            invoice_date="09 Sep 2025",
            due_date="09 Oct 2025",
            amount=120500.0,
            tax_amount=21690.0,
            total_amount=142190.0,
            currency="INR",
            purchase_order="PO-2025-7719",
            department="Facilities",
            status="exception",
            workflow_status="HUMAN_REVIEW",
            reason="Possible duplicate invoice detected",
            exception_type="duplicate_invoice",
            rule_violated="RULE_DUP_01",
            risk_score=40,
            risk_level="HIGH",
            tax_details={"gstNumber": "GSTIN29AABCG7721K1Z4", "taxAmount": 21690.0, "isVerified": True},
            matched_evidence={
                "matchedInvoiceId": "INV-00120",
                "supplier": "Global Supplies Ltd.",
                "amount": 120500.0,
                "date": "09 Sep 2025",
                "matchedFields": ["Supplier Name", "Invoice Amount", "Invoice Date"],
            },
            ai_explanation="Flagged as possible duplicate of INV-00120. Vendor name, invoice amount (₹120,500.00), and billing date are identical. Auditor sign-off required.",
            notes=["Awaiting auditor review of duplicate evidence"],
            line_items=[
                {"id": "LI-2", "description": "Commercial HVAC Air Filters (Batch 4)", "quantity": 50, "unitPrice": 2410.0, "total": 120500.0}
            ],
            payment_terms="Net 30",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            attachment_name="global_supplies_reorder.pdf",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(days=1),
        )

        exc_dup = InvoiceException(
            id="EXC-1001",
            invoice_id="INV-00124",
            exception_type="DUPLICATE",
            severity="HIGH",
            title="Possible Duplicate Invoice Detected",
            description="Matches prior record INV-00120 from 'Global Supplies Ltd.' with identical vendor, amount (₹120,500), and date.",
            rule_code="RULE_DUP_01",
            score_weight=40,
            evidence={
                "matchedInvoiceId": "INV-00120",
                "supplier": "Global Supplies Ltd.",
                "amount": 120500.0,
                "date": "09 Sep 2025",
                "matchedFields": ["Supplier Name", "Invoice Amount", "Invoice Date"],
            },
            related_invoice_id="INV-00120",
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(days=1),
        )

        # 3. Tax Mismatch Invoice (HUMAN REVIEW)
        inv_tax = Invoice(
            id="INV-00125",
            invoice_number="INV-00125",
            supplier="Nexus Hardware Distributors",
            supplier_id="GSTIN07AABCN8891D1Z1",
            invoice_date="11 Sep 2025",
            due_date="11 Oct 2025",
            amount=80000.0,
            tax_amount=9500.0,  # Expected: 80000 + 9500 = 89500, but billed total is 96500
            total_amount=96500.0,
            currency="INR",
            purchase_order="PO-2025-9920",
            department="Engineering",
            status="exception",
            workflow_status="HUMAN_REVIEW",
            reason="Tax Mismatch: Inconsistent Total Calculation",
            exception_type="tax_mismatch",
            rule_violated="RULE_TAX_01",
            risk_score=25,
            risk_level="MEDIUM",
            tax_details={"gstNumber": "GSTIN07AABCN8891D1Z1", "taxAmount": 9500.0, "isVerified": False, "notes": "Discrepancy of ₹7,000 detected"},
            ai_explanation="Tax mismatch anomaly: Base taxable amount ₹80,000 + Tax ₹9,500 should equal ₹89,500, but billed total is ₹96,500 (discrepancy of ₹7,000.00).",
            notes=["Vendor contacted for credit note reconciliation"],
            line_items=[
                {"id": "LI-3", "description": "Server Rack Mounting Rails & Shelves", "quantity": 20, "unitPrice": 4000.0, "total": 80000.0}
            ],
            payment_terms="Net 30",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            attachment_name="nexus_inv_sep.pdf",
            created_at=datetime.utcnow() - timedelta(hours=18),
            updated_at=datetime.utcnow() - timedelta(hours=18),
        )

        exc_tax = InvoiceException(
            id="EXC-1002",
            invoice_id="INV-00125",
            exception_type="TAX_MISMATCH",
            severity="HIGH",
            title="Tax Mismatch: Inconsistent Total Calculation",
            description="Expected total (₹80,000.00 + ₹9,500.00 = ₹89,500.00) differs from billed total (₹96,500.00) by ₹7,000.00.",
            rule_code="RULE_TAX_01",
            score_weight=25,
            evidence={
                "base_amount": 80000.0,
                "tax_amount": 9500.0,
                "expected_total": 89500.0,
                "actual_total": 96500.0,
                "variance": 7000.0,
            },
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(hours=18),
        )

        # 4. High-Value Invoice exceeding Policy Limit (Policy Exception)
        inv_policy = Invoice(
            id="INV-00126",
            invoice_number="INV-00126",
            supplier="Apex Logistics Hub",
            supplier_id="GSTIN33AABCA4411P1Z5",
            invoice_date="12 Sep 2025",
            due_date="12 Oct 2025",
            amount=345000.0,  # Exceeds ₹300,000 limit
            tax_amount=62100.0,
            total_amount=407100.0,
            currency="INR",
            purchase_order="PO-2025-1102",
            department="Supply Chain",
            status="exception",
            workflow_status="HUMAN_REVIEW",
            reason="Policy violation: additional approval required",
            exception_type="policy_limit",
            rule_violated="RULE_POL_01",
            risk_score=20,
            risk_level="MEDIUM",
            tax_details={"taxAmount": 62100.0, "isVerified": True},
            ai_explanation="The invoice amount of ₹345,000 exceeds company auto-approval limit of ₹300,000. Finance Manager authorization required prior to payment release.",
            notes=["High value transaction flagged for manager review"],
            line_items=[
                {"id": "LI-4", "description": "National Freight Dedicated Fleet Retainer", "quantity": 1, "unitPrice": 345000.0, "total": 345000.0}
            ],
            payment_terms="Net 45",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            attachment_name="apex_logistics_retainer.pdf",
            created_at=datetime.utcnow() - timedelta(hours=10),
            updated_at=datetime.utcnow() - timedelta(hours=10),
        )

        exc_policy = InvoiceException(
            id="EXC-1003",
            invoice_id="INV-00126",
            exception_type="POLICY_VIOLATION",
            severity="HIGH",
            title="Policy Violation: Additional Approval Required",
            description="The invoice amount of ₹345,000.00 exceeds company auto-approval threshold of ₹300,000.00.",
            rule_code="RULE_POL_01",
            score_weight=20,
            evidence={
                "invoice_amount": 345000.0,
                "policy_threshold": 300000.0,
                "exceeded_by": 45000.0,
            },
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(hours=10),
        )

        # 5. Missing Required Fields Invoice
        inv_missing = Invoice(
            id="INV-00127",
            invoice_number="",  # Missing invoice number
            supplier="Unidentified Vendor Services",
            supplier_id="",
            invoice_date="13 Sep 2025",
            due_date="",
            amount=15400.0,
            tax_amount=0.0,
            total_amount=15400.0,
            currency="INR",
            purchase_order="",
            department="General",
            status="exception",
            workflow_status="HUMAN_REVIEW",
            reason="Missing Required Invoice Fields",
            exception_type="missing_fields",
            rule_violated="RULE_REQ_01",
            risk_score=15,
            risk_level="LOW",
            tax_details={"isVerified": False},
            ai_explanation="Mandatory fields missing: Missing official Invoice Number and GST details.",
            notes=["Returned to submitter for vendor invoice documentation"],
            line_items=[
                {"id": "LI-5", "description": "Uncategorized Repair Work", "quantity": 1, "unitPrice": 15400.0, "total": 15400.0}
            ],
            payment_terms="Immediate",
            submitted_by="usr-req-01",
            submitter_name="Alex Rivera",
            created_at=datetime.utcnow() - timedelta(hours=4),
            updated_at=datetime.utcnow() - timedelta(hours=4),
        )

        exc_missing = InvoiceException(
            id="EXC-1004",
            invoice_id="INV-00127",
            exception_type="MISSING_FIELD",
            severity="HIGH",
            title="Missing Required Invoice Fields",
            description="The invoice is missing essential mandatory data: Invoice Number.",
            rule_code="RULE_REQ_01",
            score_weight=15,
            evidence={"missing_fields": ["Invoice Number"]},
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(hours=4),
        )

        # Add additional diverse realistic invoices so dashboard shows rich volume
        additional_invoices = [
            Invoice(
                id=f"INV-00{128 + i}",
                invoice_number=f"INV-00{128 + i}",
                supplier=sup,
                invoice_date="14 Sep 2025",
                amount=amt,
                tax_amount=round(amt * 0.18, 2),
                total_amount=round(amt * 1.18, 2),
                status="clean",
                workflow_status="AUTO_PASS",
                risk_score=0,
                risk_level="LOW",
                created_at=datetime.utcnow() - timedelta(hours=2 * i),
                updated_at=datetime.utcnow() - timedelta(hours=2 * i),
            )
            for i, (sup, amt) in enumerate([
                ("CloudScale Hosting Ltd", 38400.0),
                ("Precision Office Supplies", 14500.0),
                ("Delta Security Systems", 68000.0),
                ("Zenith Telecom Services", 22900.0),
                ("Apex Logistics Hub", 89000.0),
            ])
        ]

        db.add_all([
            inv_clean,
            inv_dup_base,
            inv_duplicate,
            exc_dup,
            inv_tax,
            exc_tax,
            inv_policy,
            exc_policy,
            inv_missing,
            exc_missing,
            *additional_invoices,
        ])

        print("Seeding Audit Log Entries...")
        now = datetime.utcnow()
        audit_entries = [
            AuditLog(
                id=f"AUD-{int(now.timestamp() * 1000) - 50000}",
                invoice_id="INV-00124",
                user="Jordan Lee (AP Reviewer)",
                user_role="AP_REVIEWER",
                action="Exception Reviewed",
                previous_status="exception",
                new_status="UNDER_REVIEW",
                reason="Inspected duplicate evidence against record INV-00120",
                timestamp=now - timedelta(hours=6),
            ),
            AuditLog(
                id=f"AUD-{int(now.timestamp() * 1000) - 80000}",
                invoice_id="INV-00123",
                user="VeriFlow Automated Engine",
                user_role="SYSTEM",
                action="Invoice Validated",
                previous_status="pending",
                new_status="clean",
                reason="Deterministic validation passed with 0 exceptions",
                timestamp=now - timedelta(days=2),
            ),
            AuditLog(
                id=f"AUD-{int(now.timestamp() * 1000) - 120000}",
                invoice_id="BATCH-DEMO-01",
                user="Alex Rivera (Business Requisitioner)",
                user_role="REQUESTER",
                action="Batch Ingest Completed",
                previous_status="None",
                new_status="Resolved",
                reason="Uploaded Q3_Invoices_Master.xlsx: 10 records parsed",
                timestamp=now - timedelta(days=3),
            ),
        ]
        db.add_all(audit_entries)

        db.commit()
        print("Demo data seeded successfully!")
        print("  - Users: Alex Rivera (REQUESTER), Jordan Lee (AP_REVIEWER), Elena Rostova (FINANCE_MANAGER)")
        print("  - Clean invoice: INV-00123 (AUTO-PASS)")
        print("  - Duplicate invoice: INV-00124 matches INV-00120 (HIGH risk)")
        print("  - Tax mismatch: INV-00125 (HUMAN REVIEW)")
        print("  - Policy limit invoice: INV-00126 (POLICY VIOLATION)")
        print("  - Missing fields: INV-00127 (MISSING FIELD)")
        print("  - 5 Additional auto-passed invoices for volume")
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
