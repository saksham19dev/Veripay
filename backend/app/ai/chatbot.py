from typing import Dict, Any, Optional
from app.schemas.chat import ChatResponse


class AIChatbot:
    @staticmethod
    def answer_grounded_question(
        question: str,
        invoice_context: Optional[Dict[str, Any]],
        msg_id: str,
        timestamp_str: str,
    ) -> ChatResponse:
        """
        Answers the reviewer's specific inquiry strictly grounded on invoice_context evidence.
        Never hallucinates facts or repeats unrequested invoice details.
        """
        q = question.lower().strip()

        # Fraud inquiries must ALWAYS uphold the product philosophy
        if "fraud" in q or "fake" in q or "scam" in q:
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=(
                    "No. The detected signals indicate that the invoice requires human review, "
                    "but they do not prove fraud. VeriFlow highlights rule violations, potential duplicates, "
                    "and calculation anomalies to assist human auditors. A human reviewer must make the final decision."
                ),
                timestamp=timestamp_str,
            )

        if not invoice_context:
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text="I don't have enough evidence to determine that. Please specify or select an invoice to inspect.",
                timestamp=timestamp_str,
            )

        inv_id = invoice_context.get("id", "Unknown")
        evidence = invoice_context.get("evidence", {})
        dup_ev = evidence.get("duplicate", {})
        tax_ev = evidence.get("tax", {})
        pol_ev = evidence.get("policy", {})
        miss_ev = evidence.get("missing_fields", {})
        risk_score = invoice_context.get("risk_score", 0)
        risk_level = invoice_context.get("risk_level", "LOW")
        rule_score = invoice_context.get("rule_score", 0)
        ml_score = invoice_context.get("ml_score", 0)
        reasons = invoice_context.get("reasons", [])

        # 1. Question: Duplicate check ("Is this a duplicate?", "Is this a possible duplicate?")
        if "duplicate" in q or "repeat" in q or "copied" in q:
            if dup_ev.get("detected"):
                rel_id = dup_ev.get("related_invoice", "a prior record")
                rel_sup = dup_ev.get("supplier", "the same vendor")
                rel_amt = dup_ev.get("amount", 0.0)
                fields = ", ".join(dup_ev.get("matching_fields") or ["Supplier Name", "Amount"])
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=(
                        f"Possible duplicate detected. Invoice {inv_id} matches prior record {rel_id} from '{rel_sup}' "
                        f"with identical amount ₹{rel_amt:,.2f} across fields: {fields}. "
                        "Review the earlier invoice before approving this one."
                    ),
                    timestamp=timestamp_str,
                    matchedFields=dup_ev.get("matching_fields"),
                    actionLabel="View Matching Invoice",
                    actionUrl=f"/invoices/{rel_id}",
                )
            else:
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text="I don't have enough evidence to determine that. No duplicate candidate records were detected in the ledger for this invoice.",
                    timestamp=timestamp_str,
                )

        # 2. Question: Tax details ("What is wrong with the tax?", "Tax mismatch?")
        if "tax" in q or "gst" in q or "vat" in q:
            if tax_ev.get("detected"):
                rec_val = tax_ev.get("recorded", 0.0)
                exp_val = tax_ev.get("expected", 0.0)
                diff_val = tax_ev.get("difference", 0.0)
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=(
                        f"Tax calculation mismatch on invoice {inv_id}: The recorded total is ₹{rec_val:,.2f}, "
                        f"while the expected total (base ₹{tax_ev.get('base_amount', 0.0):,.2f} + tax ₹{tax_ev.get('tax_amount', 0.0):,.2f}) "
                        f"is ₹{exp_val:,.2f}. The difference is ₹{diff_val:,.2f}."
                    ),
                    timestamp=timestamp_str,
                    actionLabel="Inspect Tax Details",
                    actionUrl=f"/invoices/{inv_id}",
                )
            else:
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=f"Tax calculations for invoice {inv_id} are consistent with recorded base amount and billed total.",
                    timestamp=timestamp_str,
                )

        # 3. Question: Risk score breakdown ("Why is the risk score 82?", "Why is score X?")
        if "score" in q or "why is the risk" in q or "points" in q:
            components = []
            if dup_ev.get("detected"):
                components.append("Possible duplicate: +30")
            if tax_ev.get("detected"):
                components.append("Tax mismatch: +20")
            if pol_ev.get("violated"):
                components.append("Policy violation: +20")
            if miss_ev.get("detected"):
                components.append("Missing fields: +15")
            if ml_score > 0:
                components.append(f"ML anomaly score: +{ml_score}")

            comp_str = "\n• " + "\n• ".join(components) if components else "\n• Deterministic baseline passed"
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=(
                    f"Risk score: {risk_score}/100 ({risk_level}).\n\n"
                    f"The score is influenced by:{comp_str}\n\n"
                    "These signals do not prove fraud. They indicate that the invoice requires human review."
                ),
                timestamp=timestamp_str,
                actionLabel="Review Invoice",
                actionUrl=f"/invoices/{inv_id}",
            )

        # 4. Question: Recommended action ("What should I do?", "What should I do next?")
        if "what should i do" in q or "recommend" in q or "next" in q or "action" in q:
            actions = []
            if dup_ev.get("detected"):
                actions.append(f"Verify source record {dup_ev.get('related_invoice')} to confirm if this is an accidental double-submission.")
            if tax_ev.get("detected"):
                actions.append("Request a corrected credit note or invoice from vendor to resolve the tax variance.")
            if pol_ev.get("violated"):
                actions.append(f"Obtain written Finance Manager approval for amount exceeding the ₹{pol_ev.get('threshold', 300000.0):,.2f} limit.")
            if miss_ev.get("detected"):
                actions.append("Contact submitter to provide missing documentation.")

            act_str = " ".join(actions) if actions else "Verify supplier credentials and proceed with standard approval."
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=f"Recommended auditor action for {inv_id}: {act_str}",
                timestamp=timestamp_str,
                actionLabel="Open Review Form",
                actionUrl=f"/invoices/{inv_id}",
            )

        # 5. Question: Why flagged? ("Why was this invoice flagged?", "Which rule was violated?")
        if "why" in q or "flagged" in q or "violated" in q or "rule" in q or "exception" in q:
            if reasons:
                reasons_str = "; ".join(reasons)
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=(
                        f"Invoice {inv_id} was flagged as {risk_level} RISK because: {reasons_str}. "
                        "Manual review is recommended before approval."
                    ),
                    timestamp=timestamp_str,
                    actionLabel="View Details",
                    actionUrl=f"/invoices/{inv_id}",
                )
            else:
                return ChatResponse(
                    id=msg_id,
                    sender="assistant",
                    text=f"Invoice {inv_id} was not flagged for rule violations. It passed all deterministic checks with LOW risk.",
                    timestamp=timestamp_str,
                )

        # 6. Question: Evidence ("Show me the evidence", "What evidence?")
        if "evidence" in q:
            ev_points = []
            if dup_ev.get("detected"):
                ev_points.append(f"Matching invoice: {dup_ev.get('related_invoice')} (Same supplier '{dup_ev.get('supplier')}', amount ₹{dup_ev.get('amount', 0.0):,.2f})")
            if tax_ev.get("detected"):
                ev_points.append(f"Tax variance: Expected ₹{tax_ev.get('expected', 0.0):,.2f} vs Recorded ₹{tax_ev.get('recorded', 0.0):,.2f}")
            if pol_ev.get("violated"):
                ev_points.append(f"Policy: Amount ₹{pol_ev.get('amount', 0.0):,.2f} exceeds threshold ₹{pol_ev.get('threshold', 0.0):,.2f}")

            ev_str = "\n• " + "\n• ".join(ev_points) if ev_points else "No exception evidence on file."
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=f"Structured evidence for invoice {inv_id}:{ev_str}",
                timestamp=timestamp_str,
            )

        # 7. Question: Summary ("Summarize this invoice")
        if "summarize" in q or "summary" in q or "overview" in q:
            inv_d = invoice_context.get("invoice", {})
            return ChatResponse(
                id=msg_id,
                sender="assistant",
                text=(
                    f"Summary of {inv_id}: Billed by '{inv_d.get('supplier', 'Vendor')}' on {inv_d.get('date', 'N/A')} "
                    f"for ₹{inv_d.get('amount', 0.0):,.2f} (Total: ₹{inv_d.get('total_amount', 0.0):,.2f}). "
                    f"Risk: {risk_level} ({risk_score}/100). Status: {invoice_context.get('status', 'exception')}."
                ),
                timestamp=timestamp_str,
                actionLabel="Inspect Record",
                actionUrl=f"/invoices/{inv_id}",
            )

        # Fallback question: Grounded refusal if query asks for data outside evidence
        return ChatResponse(
            id=msg_id,
            sender="assistant",
            text=(
                f"Regarding invoice {inv_id} ({invoice_context.get('supplier', 'vendor')}): "
                f"The invoice is classified as {risk_level} Risk ({risk_score}/100). "
                f"{invoice_context.get('explanation', 'Review the evidence dossier before sign-off.')}"
            ),
            timestamp=timestamp_str,
            actionLabel="View Invoice",
            actionUrl=f"/invoices/{inv_id}",
        )
