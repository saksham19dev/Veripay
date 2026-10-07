from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class InvoiceException(Base):
    __tablename__ = "exceptions"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "EXC-1001"
    invoice_id = Column(String(50), ForeignKey("invoices.id"), nullable=False, index=True)
    
    # Exception category
    exception_type = Column(String(50), nullable=False, index=True)
    # Types: MISSING_FIELD, DUPLICATE, TAX_MISMATCH, INVALID_DATE, AMOUNT_ANOMALY, POLICY_VIOLATION, DATA_INCONSISTENCY
    
    severity = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    rule_code = Column(String(50), nullable=False)  # e.g. "RULE_REQ_01", "RULE_DUP_01", "RULE_TAX_01"
    score_weight = Column(Integer, default=15)
    
    evidence = Column(JSON, nullable=True)  # Structured evidence payload
    related_invoice_id = Column(String(50), nullable=True)  # Matched duplicate or related invoice
    
    # Workflow status
    status = Column(String(30), nullable=False, default="OPEN", index=True)
    # Status: OPEN, UNDER_REVIEW, RESOLVED, REJECTED, APPROVED
    
    reviewer_note = Column(Text, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    invoice = relationship("Invoice", back_populates="exceptions")
