import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from seed import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    seed_demo_data()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_dashboard_stats():
    response = client.get(
        "/api/dashboard/stats",
        headers={"X-User-Role": "AP_REVIEWER"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "totalInvoices" in data
    assert "autoPassed" in data
    assert "exceptions" in data
    assert "breakdown" in data
    assert data["totalInvoices"] > 0


def test_dashboard_exception_breakdown():
    response = client.get("/api/dashboard/exception-breakdown")
    assert response.status_code == 200
    data = response.json()
    assert "duplicate" in data
    assert "tax_mismatch" in data
    assert "missing_field" in data


def test_list_invoices_and_filters():
    # List all
    res = client.get("/api/invoices")
    assert res.status_code == 200
    data = res.json()
    assert "invoices" in data
    assert len(data["invoices"]) > 0

    # Filter clean
    res_clean = client.get("/api/invoices?status=clean")
    assert res_clean.status_code == 200
    for inv in res_clean.json()["invoices"]:
        assert inv["status"] == "clean"

    # Filter exception
    res_exc = client.get("/api/invoices?status=exception")
    assert res_exc.status_code == 200
    for inv in res_exc.json()["invoices"]:
        assert inv["status"] == "exception"


def test_get_single_invoice_detail():
    res = client.get("/api/invoices/INV-00124")
    assert res.status_code == 200
    inv = res.json()
    assert inv["id"] == "INV-00124"
    assert inv["supplier"] == "Global Supplies Ltd."
    assert inv["status"] == "exception"
    assert inv["matchedEvidence"] is not None


def test_csv_upload_pipeline():
    csv_content = (
        "Invoice Number,Supplier Name,Invoice Date,Amount,Tax Amount,Total Amount,Department\n"
        "INV-TEST-901,Vertex Innovations,2025-09-12,50000,9000,59000,IT\n"
        "INV-TEST-902,Apex Logistics Hub,2025-09-12,380000,68400,448400,Supply Chain\n"
    )
    files = {
        "file": ("test_batch.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post(
        "/api/invoices/upload",
        files=files,
        headers={"X-User-Role": "AP_REVIEWER", "X-User-Name": "Jordan Lee"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["clean"] >= 1  # 50k should clean pass
    assert data["exceptions"] >= 1  # 380k exceeds policy limit


def test_approve_reject_workflow():
    # Approve exception invoice
    res_appr = client.post(
        "/api/exceptions/INV-00125/approve",
        json={"note": "Tax discrepancy reconciled with supplier credit note"},
        headers={"X-User-Role": "AP_REVIEWER", "X-User-Name": "Jordan Lee"}
    )
    assert res_appr.status_code == 200
    updated_inv = res_appr.json()
    assert updated_inv["status"] == "clean"

    # Rejection of another invoice
    res_rej = client.post(
        "/api/exceptions/INV-00126/reject",
        json={"reason": "Executive authorization not granted"},
        headers={"X-User-Role": "FINANCE_MANAGER", "X-User-Name": "Elena Rostova"}
    )
    assert res_rej.status_code == 200
    assert res_rej.json()["status"] == "exception"

    # Audit log should record both actions
    res_audit = client.get("/api/audit-log", headers={"X-User-Role": "AP_REVIEWER"})
    assert res_audit.status_code == 200
    logs = res_audit.json()
    actions = [l["action"] for l in logs]
    assert "Invoice Approved" in actions
    assert "Invoice Rejected" in actions


def test_role_based_access_control():
    # Requesters cannot approve invoices (HTTP 403)
    res = client.post(
        "/api/exceptions/INV-00124/approve",
        json={"note": "Unauthorized attempt"},
        headers={"X-User-Role": "REQUESTER", "X-User-Name": "Alex Rivera"}
    )
    assert res.status_code == 403


def test_ai_chat_assistant():
    # Ask why an invoice was flagged
    res = client.post(
        "/api/chat",
        json={"message": "Why was invoice INV-00124 flagged?", "invoice_id": "INV-00124"}
    )
    assert res.status_code == 200
    chat_resp = res.json()
    assert "INV-00124" in chat_resp["text"] or "duplicate" in chat_resp["text"].lower()
    assert chat_resp["sender"] == "assistant"
