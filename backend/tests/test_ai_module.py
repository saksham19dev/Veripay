import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from seed import seed_demo_data
from app.ai.features import extract_features_from_context, FEATURE_NAMES
from app.ai.risk_model import InvoiceRiskModel, risk_model
from app.ai.risk_scoring import calculate_rule_score, combine_scores
from app.ai.evidence import EvidenceEngine
from app.ai.explainer import AIExplainer
from app.ai.chatbot import AIChatbot
from app.ai.service import AIServiceModule

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_demo_data()


# 1. Feature Extraction Tests
def test_feature_extraction():
    inv_data = {
        "id": "INV-TEST-FEAT",
        "supplier": "Acme Supplies",
        "amount": 50000.0,
        "tax_amount": 9000.0,
        "total_amount": 59000.0,
        "invoice_date": "2025-09-10",
    }
    df = extract_features_from_context(inv_data)
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert list(df.columns) == FEATURE_NAMES
    assert df["invoice_amount"].iloc[0] == 50000.0
    assert df["tax_percentage"].iloc[0] == 18.0
    # Missing values handled without NaNs
    assert not df.isna().any().any()


# 2. Model Loading & Prediction Tests
def test_model_loading_and_prediction():
    model = InvoiceRiskModel()
    # Model should have loaded trained joblib binary
    assert model.model is not None
    assert model.model_version == "veriflow-risk-v1"

    sample_df = pd.DataFrame([{
        "invoice_amount": 120500.0,
        "tax_amount": 21690.0,
        "tax_percentage": 18.0,
        "total_amount": 142190.0,
        "missing_field_count": 0,
        "duplicate_similarity": 0.95,
        "supplier_invoice_count": 5,
        "supplier_average_amount": 120500.0,
        "supplier_amount_deviation": 0.0,
        "amount_deviation_percentage": 0.0,
        "days_since_previous_supplier_invoice": 1.0,
        "policy_violation_count": 0,
        "validation_error_count": 1,
        "previous_duplicate_count": 1,
    }], columns=FEATURE_NAMES)

    prob, ml_score = model.predict_risk(sample_df)
    assert 0.0 <= prob <= 1.0
    assert 0 <= ml_score <= 100


# 3. Hybrid Risk Scoring Tests
def test_hybrid_risk_scoring():
    # 0.6 * rule_score + 0.4 * ml_score
    # E.g. rule_score = 50, ml_score = 30 -> 0.6*50 + 0.4*30 = 30 + 12 = 42 (HIGH)
    res = combine_scores(rule_score=50, ml_score=30)
    assert res["risk_score"] == 42
    assert res["risk_level"] == "HIGH"
    assert res["rule_score"] == 50
    assert res["ml_score"] == 30

    # Low score test
    res_low = combine_scores(rule_score=0, ml_score=10)
    assert res_low["risk_score"] == 4
    assert res_low["risk_level"] == "LOW"


# 4. Evidence Engine Tests
def test_evidence_engine():
    inv_data = {
        "id": "INV-EVID-01",
        "supplier": "Global Supplies Ltd.",
        "amount": 120500.0,
        "tax_amount": 21690.0,
        "total_amount": 142190.0,
    }
    dup_cand = {
        "matchedInvoiceId": "INV-00120",
        "supplier": "Global Supplies Ltd.",
        "amount": 120500.0,
        "date": "09 Sep 2025",
        "matchedFields": ["Supplier Name", "Invoice Amount"],
    }

    evidence = EvidenceEngine.build_evidence(
        invoice_dict=inv_data,
        violations=[],
        duplicate_candidate=dup_cand,
    )
    assert evidence["duplicate"]["detected"] is True
    assert evidence["duplicate"]["related_invoice"] == "INV-00120"
    assert evidence["duplicate"]["matching_fields"] == ["Supplier Name", "Invoice Amount"]
    assert evidence["tax"]["expected"] == 142190.0


# 5. Numerical Explanation Generation Tests
def test_numerical_tax_explanation():
    evidence = {
        "invoice": {"id": "INV-00125", "supplier": "Nexus Hardware", "amount": 80000.0},
        "duplicate": {"detected": False},
        "tax": {
            "detected": True,
            "expected": 89500.0,
            "recorded": 96500.0,
            "difference": 7000.0,
            "base_amount": 80000.0,
            "tax_amount": 9500.0,
        },
        "policy": {"violated": False},
        "missing_fields": {"detected": False},
        "amount_anomaly": {"detected": False},
    }

    explanation = AIExplainer.generate_explanation(
        invoice_id="INV-00125",
        risk_level="HIGH",
        risk_score=65,
        evidence=evidence,
        rule_score=40,
        ml_score=25,
    )

    # Must contain actual numerical values
    assert "₹96,500.00" in explanation or "96,500" in explanation
    assert "₹89,500.00" in explanation or "89,500" in explanation
    assert "₹7,000.00" in explanation or "7,000" in explanation
    assert "INV-00125" in explanation


# 6. Chatbot Question-Specific Tests
def test_chatbot_fraud_disclaimer():
    resp = AIChatbot.answer_grounded_question(
        question="Is this definitely fraud?",
        invoice_context={"id": "INV-00124"},
        msg_id="m1",
        timestamp_str="12:00 PM",
    )
    assert "do not prove fraud" in resp.text.lower()
    assert "human reviewer must make the final decision" in resp.text.lower()


def test_chatbot_grounding_duplicate_inquiry():
    inv_context = {
        "id": "INV-00124",
        "supplier": "Global Supplies Ltd.",
        "evidence": {
            "duplicate": {
                "detected": True,
                "related_invoice": "INV-00120",
                "supplier": "Global Supplies Ltd.",
                "amount": 120500.0,
                "matching_fields": ["Supplier Name", "Invoice Amount", "Invoice Date"],
            },
            "tax": {"detected": False},
        },
    }

    resp = AIChatbot.answer_grounded_question(
        question="Is this a duplicate?",
        invoice_context=inv_context,
        msg_id="m2",
        timestamp_str="12:00 PM",
    )
    assert "INV-00120" in resp.text
    assert "120,500" in resp.text
    assert "Possible duplicate" in resp.text


# 7. CRITICAL TEST: Hallucination Prevention when No Duplicate Evidence
def test_chatbot_no_duplicate_hallucination():
    inv_context = {
        "id": "INV-CLEAN-01",
        "evidence": {
            "duplicate": {"detected": False},
            "tax": {"detected": False},
        },
    }

    resp = AIChatbot.answer_grounded_question(
        question="Is this a duplicate?",
        invoice_context=inv_context,
        msg_id="m3",
        timestamp_str="12:00 PM",
    )
    assert "I don't have enough evidence to determine that" in resp.text


# 8. CRITICAL TEST: Provide invoice A, ensure invoice B is not mixed
def test_chatbot_invoice_isolation():
    inv_a_context = {
        "id": "INV-AAA",
        "evidence": {
            "duplicate": {
                "detected": True,
                "related_invoice": "INV-AAA-DUP",
                "supplier": "Vendor A",
                "amount": 50000.0,
            }
        }
    }
    # Asking without context or for different ID
    resp_empty = AIChatbot.answer_grounded_question(
        question="Why was invoice INV-BBB flagged?",
        invoice_context=None,
        msg_id="m4",
        timestamp_str="12:00 PM",
    )
    assert "I don't have enough evidence" in resp_empty.text
    assert "INV-AAA" not in resp_empty.text


# 9. AI Analysis API Integration Test
def test_ai_analyze_endpoint():
    res = client.post("/api/ai/analyze/INV-00124")
    assert res.status_code == 200
    data = res.json()
    assert data["invoice_id"] == "INV-00124"
    assert "risk_score" in data
    assert "risk_level" in data
    assert "ml_score" in data
    assert "rule_score" in data
    assert "evidence" in data
    assert data["model_version"] == "veriflow-risk-v1"
    assert "recommendation" in data
    assert "explanation" in data


# 10. AI Explanation API Integration Test
def test_ai_explanation_endpoint():
    res = client.get("/api/ai/explanation/INV-00125")
    assert res.status_code == 200
    data = res.json()
    assert data["invoice_id"] == "INV-00125"
    assert "explanation" in data
    assert "INV-00125" in data["explanation"]
