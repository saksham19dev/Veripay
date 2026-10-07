from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AIAnalysisResponse(BaseModel):
    invoice_id: str
    risk_score: int
    risk_level: str
    rule_score: int
    ml_score: int
    reasons: List[str]
    evidence: Dict[str, Any]
    explanation: str
    recommendation: str
    model_version: str = "veriflow-risk-v1"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AIExplanationResponse(BaseModel):
    invoice_id: str
    explanation: str
    risk_level: str
    risk_score: int
    reasons: List[str]
    evidence: Dict[str, Any]
    model_version: str = "veriflow-risk-v1"

    model_config = ConfigDict(from_attributes=True)
