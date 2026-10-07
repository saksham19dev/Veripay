from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Text
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "AUD-17180000"
    invoice_id = Column(String(50), nullable=True, index=True)
    user = Column(String(100), nullable=False)  # Display name e.g. "Jordan Lee (AP Reviewer)"
    user_id = Column(String(50), nullable=True, index=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    # Actions: Invoice Uploaded, Invoice Validated, Exception Created, Invoice Approved, Invoice Rejected, Reviewer Note Added, AI Explanation Generated
    
    entity_type = Column(String(50), default="INVOICE")
    entity_id = Column(String(50), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
