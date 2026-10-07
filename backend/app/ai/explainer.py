from typing import Dict, Any, List


class AIExplainer:
    @staticmethod
    def generate_explanation(
        invoice_id: str,
        risk_level: str,
        risk_score: int,
        evidence: Dict[str, Any],
        rule_score: int = 0,
        ml_score: int = 0,
    ) -> str:
        """
        Generates a concise (3-6 sentence), factual, grounded, numerical explanation
        answering 'WHY DID VERIFLOW FLAG THIS SPECIFIC INVOICE?'.
        Never uses generic fluff or ungrounded accusations.
        """
        dup_ev = evidence.get("duplicate", {})
        tax_ev = evidence.get("tax", {})
        pol_ev = evidence.get("policy", {})
        miss_ev = evidence.get("missing_fields", {})
        amt_ev = evidence.get("amount_anomaly", {})
        inv_data = evidence.get("invoice", {})
        inv_amt = inv_data.get("amount", 0.0)

        # Clean invoice case
        if risk_score == 0 and not any([
            dup_ev.get("detected"),
            tax_ev.get("detected"),
            pol_ev.get("violated"),
            miss_ev.get("detected"),
            amt_ev.get("detected"),
        ]):
            return (
                f"Invoice {invoice_id} is evaluated as LOW RISK ({risk_score}/100). "
                "All deterministic checks—including mandatory field validation, tax consistency, duplicate screening, "
                "and policy threshold limits—passed without discrepancy. "
                "Automated straight-through processing is permitted."
            )

        # Flagged invoice explanations
        reasons_sentences: List[str] = []

        # Duplicate signal
        if dup_ev.get("detected"):
            rel_id = dup_ev.get("related_invoice") or "an existing ledger entry"
            rel_sup = dup_ev.get("supplier") or inv_data.get("supplier", "the same vendor")
            rel_amt = dup_ev.get("amount") or inv_amt
            fields_str = ", ".join(dup_ev.get("matching_fields") or ["Supplier Name", "Amount"])
            reasons_sentences.append(
                f"A possible duplicate invoice was detected matching prior record {rel_id} for '{rel_sup}' "
                f"with identical amount of ₹{rel_amt:,.2f} across fields: {fields_str}."
            )

        # Tax signal
        if tax_ev.get("detected"):
            exp_tax = tax_ev.get("expected", 0.0)
            rec_tax = tax_ev.get("recorded", 0.0)
            diff = tax_ev.get("difference", 0.0)
            reasons_sentences.append(
                f"The recorded total of ₹{rec_tax:,.2f} differs from the expected total of ₹{exp_tax:,.2f} "
                f"(base ₹{tax_ev.get('base_amount', inv_amt):,.2f} + tax ₹{tax_ev.get('tax_amount', 0.0):,.2f}), "
                f"creating a calculation variance of ₹{diff:,.2f}."
            )

        # Policy signal
        if pol_ev.get("violated"):
            pol_amt = pol_ev.get("amount", inv_amt)
            thresh = pol_ev.get("threshold", 300000.0)
            reasons_sentences.append(
                f"The invoice amount of ₹{pol_amt:,.2f} exceeds the company auto-approval limit of ₹{thresh:,.2f} "
                f"by ₹{pol_ev.get('exceeded_by', 0.0):,.2f}, requiring mandatory management authorization."
            )

        # Missing fields signal
        if miss_ev.get("detected"):
            fields_joined = ", ".join(miss_ev.get("fields") or ["mandatory fields"])
            reasons_sentences.append(
                f"Essential mandatory information is missing from the record: {fields_joined}."
            )

        # Amount anomaly signal
        if amt_ev.get("detected"):
            reasons_sentences.append(
                f"The invoice amount was flagged for anomalous valuation ({amt_ev.get('reason')})."
            )

        if not reasons_sentences:
            reasons_sentences.append(
                f"Unusual statistical anomaly signals were identified by the ML risk classifier (ML Score: {ml_score}/100)."
            )

        # Assemble full explanation (3-6 sentences)
        intro = f"Invoice {invoice_id} is classified as {risk_level} RISK with an overall composite score of {risk_score}/100 (Deterministic Rules: +{rule_score}, ML Anomaly: +{ml_score})."
        details = " ".join(reasons_sentences)
        conclusion = "Manual review by an accounts payable auditor is recommended before disbursement."

        return f"{intro} {details} {conclusion}"

    @staticmethod
    def generate_recommendation(risk_level: str) -> str:
        """Determines human-in-the-loop recommendation based on risk category."""
        recs = {
            "LOW": "Likely clean. Auto-pass permitted if all deterministic rules pass.",
            "MEDIUM": "Review recommended. Cross-verify highlighted values before sign-off.",
            "HIGH": "Manual review required. Review evidence and verify candidate records before approval.",
            "CRITICAL": "Priority manual review required. High anomaly signals detected; halt automated payment.",
        }
        return recs.get(risk_level.upper(), "Manual review recommended.")
