from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "INV-00123"
    invoice_number = Column(String(100), index=True, nullable=True)
    supplier = Column(String(150), index=True, nullable=False)
    supplier_id = Column(String(100), nullable=True)
    invoice_date = Column(String(50), nullable=True)  # Formatted string e.g. "10 Sep 2025" or ISO
    raw_date = Column(DateTime, nullable=True)
    due_date = Column(String(50), nullable=True)
    raw_due_date = Column(DateTime, nullable=True)
    
    amount = Column(Float, nullable=False, default=0.0)  # Subtotal / line amount
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), default="INR")
    purchase_order = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True, default="Operations")

    # Workflow & Risk Status
    status = Column(String(30), default="clean", index=True)  # "clean", "exception", "pending"
    workflow_status = Column(String(30), default="AUTO_PASS", index=True)  # "AUTO_PASS", "HUMAN_REVIEW", "APPROVED", "REJECTED"
    reason = Column(String(255), nullable=True)
    exception_type = Column(String(50), nullable=True)  # duplicate_invoice, policy_limit, missing_fields, tax_mismatch, other
    rule_violated = Column(String(255), nullable=True)
    
    risk_score = Column(Integer, default=0, index=True)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL

    # Detailed Structured Metadata (Stored as JSON for compatibility & rich querying)
    tax_details = Column(JSON, nullable=True)
    matched_evidence = Column(JSON, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    notes = Column(JSON, nullable=True, default=list)
    line_items = Column(JSON, nullable=True, default=list)

    # Submitter & Document Info
    payment_terms = Column(String(100), nullable=True, default="Net 30")
    submitted_by = Column(String(50), nullable=True, index=True)  # user id e.g. "usr-req-01"
    submitter_name = Column(String(100), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    rfi_status = Column(String(30), default="none")  # none, pending_response, resolved
    rfi_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to detailed exceptions
    exceptions = relationship("InvoiceException", back_populates="invoice", cascade="all, delete-orphan")
