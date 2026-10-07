from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context
from app.schemas.ai import AIAnalysisResponse, AIExplanationResponse
from app.ai.service import AIServiceModule

router = APIRouter(prefix="/ai", tags=["AI Engine & Analysis"])


@router.post(
    "/analyze/{invoice_id}",
    response_model=AIAnalysisResponse,
    summary="Analyze Invoice with Hybrid Rule + ML Anomaly Engine",
    description="Extracts 14 features, executes ML risk model, combines rule & ML scores, builds evidence, generates grounded explanation, and stores analysis record.",
)
def analyze_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return AIServiceModule.analyze_invoice(invoice_id=invoice_id, db=db, persist=True)


@router.get(
    "/explanation/{invoice_id}",
    response_model=AIExplanationResponse,
    summary="Get Latest Grounded AI Explanation for Invoice",
    description="Returns the latest factual, numerical, grounded explanation answering 'WHY DID VERIFLOW FLAG THIS SPECIFIC INVOICE?' without hallucination.",
)
def get_explanation(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return AIServiceModule.get_latest_explanation(invoice_id=invoice_id, db=db)
