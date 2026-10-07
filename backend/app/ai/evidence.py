from typing import Dict, Any, List, Optional
from app.config import settings


class EvidenceEngine:
    @staticmethod
    def build_evidence(
        invoice_dict: Dict[str, Any],
        violations: List[Any],
        duplicate_candidate: Optional[Dict[str, Any]] = None,
        policy_threshold: float = None,
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive, grounded, structured evidence payload from real invoice facts,
        triggered rules, and duplicate candidate comparisons.
        """
        threshold = policy_threshold or settings.MAX_AUTO_APPROVAL_AMOUNT
        inv_amt = float(invoice_dict.get("amount", 0.0) or 0.0)
        tax_amt = float(invoice_dict.get("tax_amount", 0.0) or 0.0)
        tot_amt = float(invoice_dict.get("total_amount", inv_amt + tax_amt) or (inv_amt + tax_amt))
        supplier = str(invoice_dict.get("supplier") or invoice_dict.get("supplier_name") or "")
        inv_id = str(invoice_dict.get("id") or invoice_dict.get("invoice_number") or "")

        evidence: Dict[str, Any] = {
            "invoice": {
                "id": inv_id,
                "supplier": supplier,
                "amount": inv_amt,
                "tax_amount": tax_amt,
                "total_amount": tot_amt,
                "date": str(invoice_dict.get("invoice_date") or invoice_dict.get("date") or ""),
            },
            "duplicate": {
                "detected": False,
                "related_invoice": None,
                "supplier": None,
                "amount": None,
                "date": None,
                "matching_fields": [],
            },
            "tax": {
                "detected": False,
                "expected": round(inv_amt + tax_amt, 2),
                "recorded": round(tot_amt, 2),
                "difference": round(abs((inv_amt + tax_amt) - tot_amt), 2),
                "tax_amount": tax_amt,
                "base_amount": inv_amt,
            },
            "policy": {
                "violated": False,
                "amount": max(inv_amt, tot_amt),
                "threshold": threshold,
                "exceeded_by": 0.0,
            },
            "missing_fields": {
                "detected": False,
                "fields": [],
            },
            "amount_anomaly": {
                "detected": False,
                "amount": inv_amt,
                "reason": None,
            },
        }

        # 1. Process Duplicate Signals
        # Check explicit duplicate candidate or violations
        if duplicate_candidate:
            evidence["duplicate"]["detected"] = True
            evidence["duplicate"]["related_invoice"] = duplicate_candidate.get("matchedInvoiceId") or duplicate_candidate.get("id")
            evidence["duplicate"]["supplier"] = duplicate_candidate.get("supplier")
            evidence["duplicate"]["amount"] = duplicate_candidate.get("amount")
            evidence["duplicate"]["date"] = duplicate_candidate.get("date")
            evidence["duplicate"]["matching_fields"] = duplicate_candidate.get("matchedFields", ["Supplier Name", "Invoice Amount"])

        for v in violations:
            v_type = getattr(v, "exception_type", "")
            v_ev = getattr(v, "evidence", {}) or {}

            if v_type == "DUPLICATE":
                evidence["duplicate"]["detected"] = True
                if not evidence["duplicate"]["related_invoice"]:
                    evidence["duplicate"]["related_invoice"] = getattr(v, "related_invoice_id", None) or v_ev.get("matchedInvoiceId")
                    evidence["duplicate"]["supplier"] = v_ev.get("supplier")
                    evidence["duplicate"]["amount"] = v_ev.get("amount")
                    evidence["duplicate"]["date"] = v_ev.get("date")
                    evidence["duplicate"]["matching_fields"] = v_ev.get("matchedFields", ["Supplier Name", "Invoice Amount"])

            elif v_type == "TAX_MISMATCH":
                evidence["tax"]["detected"] = True
                if "expected_total" in v_ev:
                    evidence["tax"]["expected"] = v_ev["expected_total"]
                    evidence["tax"]["recorded"] = v_ev.get("actual_total", tot_amt)
                    evidence["tax"]["difference"] = v_ev.get("variance", abs(evidence["tax"]["expected"] - evidence["tax"]["recorded"]))

            elif v_type == "POLICY_VIOLATION":
                evidence["policy"]["violated"] = True
                eff_amt = max(inv_amt, tot_amt)
                evidence["policy"]["amount"] = eff_amt
                evidence["policy"]["threshold"] = threshold
                evidence["policy"]["exceeded_by"] = max(0.0, eff_amt - threshold)

            elif v_type == "MISSING_FIELD":
                evidence["missing_fields"]["detected"] = True
                missing_list = v_ev.get("missing_fields", [])
                evidence["missing_fields"]["fields"] = missing_list

            elif v_type == "AMOUNT_ANOMALY":
                evidence["amount_anomaly"]["detected"] = True
                evidence["amount_anomaly"]["reason"] = getattr(v, "title", "Amount anomaly detected")

        return evidence
