from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime
from app.database import Base


class PolicySetting(Base):
    __tablename__ = "policy_settings"

    id = Column(String(50), primary_key=True, default="default")
    max_invoice_limit = Column(Float, default=300000.0)
    duplicate_window_days = Column(Integer, default=30)
    auto_approve_confidence = Column(Float, default=95.0)
    currency = Column(String(20), default="INR (₹)")
    email_alerts = Column(Boolean, default=True)
    slack_alerts = Column(Boolean, default=False)
    ai_anomaly_detection = Column(Boolean, default=True)
    strict_gst_verification = Column(Boolean, default=True)
    theme = Column(String(20), default="light")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
