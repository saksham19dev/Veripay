from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text, ForeignKey
from app.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "ANA-17180000"
    invoice_id = Column(String(50), ForeignKey("invoices.id"), nullable=False, index=True)
    model_version = Column(String(50), nullable=False, default="veriflow-risk-v1")
    
    # Combined & Component Risk Scores
    risk_score = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(20), nullable=False, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    rule_score = Column(Integer, nullable=False, default=0)
    ml_score = Column(Integer, nullable=False, default=0)
    
    # Explainable outputs
    reasons = Column(JSON, nullable=True, default=list)
    evidence = Column(JSON, nullable=True, default=dict)
    recommendation = Column(String(255), nullable=False, default="Manual review recommended.")
    explanation = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
