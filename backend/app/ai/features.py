import math
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.exception import InvoiceException

FEATURE_NAMES = [
    "invoice_amount",
    "tax_amount",
    "tax_percentage",
    "total_amount",
    "missing_field_count",
    "duplicate_similarity",
    "supplier_invoice_count",
    "supplier_average_amount",
    "supplier_amount_deviation",
    "amount_deviation_percentage",
    "days_since_previous_supplier_invoice",
    "policy_violation_count",
    "validation_error_count",
    "previous_duplicate_count",
]


def safe_float(val: Any, default: float = 0.0) -> float:
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def extract_features_from_context(
    invoice_dict: Dict[str, Any],
    db: Optional[Session] = None,
    violations: Optional[List[Any]] = None,
    duplicate_candidate: Optional[Dict[str, Any]] = None,
) -> pd.DataFrame:
    """
    Extracts numerical ML features strictly from current invoice attributes,
    deterministic validation signals, and historical supplier context.
    Never uses future information or target labels.
    """
    inv_amt = safe_float(invoice_dict.get("amount", 0.0))
    tax_amt = safe_float(invoice_dict.get("tax_amount", 0.0))
    total_amt = safe_float(invoice_dict.get("total_amount", inv_amt + tax_amt))
    supplier_name = str(invoice_dict.get("supplier") or invoice_dict.get("supplier_name") or "").strip()
    inv_id = str(invoice_dict.get("id") or "")

    # 1. Tax percentage
    tax_pct = (tax_amt / inv_amt * 100.0) if inv_amt > 0 else 0.0
    tax_pct = min(100.0, max(0.0, tax_pct))

    # 2. Count violations by type
    viols = violations or []
    missing_count = 0
    policy_count = 0
    val_error_count = len(viols)

    for v in viols:
        v_type = getattr(v, "exception_type", "")
        if v_type == "MISSING_FIELD":
            missing_count += 1
        elif v_type == "POLICY_VIOLATION":
            policy_count += 1

    # Check raw fields for missing count if violations list not supplied
    if not viols:
        if not invoice_dict.get("invoice_number"):
            missing_count += 1
        if not supplier_name:
            missing_count += 1
        if not invoice_dict.get("date") and not invoice_dict.get("invoice_date"):
            missing_count += 1

    # 3. Duplicate similarity score (0.0 to 1.0)
    dup_sim = 0.0
    if duplicate_candidate:
        matched_fields = duplicate_candidate.get("matchedFields", [])
        if "Invoice Number" in matched_fields and "Supplier Name" in matched_fields:
            dup_sim = 1.0
        elif len(matched_fields) >= 3:
            dup_sim = 0.95
        elif len(matched_fields) == 2:
            dup_sim = 0.75
        elif len(matched_fields) == 1:
            dup_sim = 0.40
    else:
        # Check if any violation is DUPLICATE
        for v in viols:
            if getattr(v, "exception_type", "") == "DUPLICATE":
                dup_sim = 0.90
                break

    # 4. Historical Supplier Context from DB (No future lookahead)
    sup_inv_count = 1
    sup_avg_amt = inv_amt
    sup_amt_dev = 0.0
    amt_dev_pct = 0.0
    days_since_prev = 30.0
    prev_dup_count = 0

    if db and supplier_name:
        try:
            # Query prior invoices from same supplier
            query = db.query(Invoice).filter(Invoice.supplier == supplier_name)
            if inv_id:
                query = query.filter(Invoice.id != inv_id)
            past_invoices = query.limit(50).all()

            if past_invoices:
                sup_inv_count = len(past_invoices) + 1
                amounts = [safe_float(i.amount) for i in past_invoices if safe_float(i.amount) > 0]
                if amounts:
                    sup_avg_amt = sum(amounts) / len(amounts)
                    sup_amt_dev = abs(inv_amt - sup_avg_amt)
                    amt_dev_pct = (sup_amt_dev / sup_avg_amt * 100.0) if sup_avg_amt > 0 else 0.0

                # Count previous duplicates from this supplier
                prev_dup_count = sum(1 for i in past_invoices if i.exception_type == "duplicate_invoice")

                # Days since previous supplier invoice
                latest_past = past_invoices[0]
                if latest_past.created_at:
                    now_dt = datetime.utcnow()
                    delta = (now_dt - latest_past.created_at).days
                    days_since_prev = max(0.0, float(delta))
        except Exception:
            pass

    row = {
        "invoice_amount": round(inv_amt, 2),
        "tax_amount": round(tax_amt, 2),
        "tax_percentage": round(tax_pct, 2),
        "total_amount": round(total_amt, 2),
        "missing_field_count": int(missing_count),
        "duplicate_similarity": round(dup_sim, 2),
        "supplier_invoice_count": int(sup_inv_count),
        "supplier_average_amount": round(sup_avg_amt, 2),
        "supplier_amount_deviation": round(sup_amt_dev, 2),
        "amount_deviation_percentage": round(amt_dev_pct, 2),
        "days_since_previous_supplier_invoice": round(days_since_prev, 1),
        "policy_violation_count": int(policy_count),
        "validation_error_count": int(val_error_count),
        "previous_duplicate_count": int(prev_dup_count),
    }

    df = pd.DataFrame([row], columns=FEATURE_NAMES)
    return df
