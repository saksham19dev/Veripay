from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context
from app.schemas.dashboard import DashboardStatsResponse, ExceptionBreakdownResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get Overview Dashboard Statistics",
    description="Returns aggregate counts, auto-pass vs review counts, growth percentages, and category breakdown.",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return DashboardService.get_stats(db)


@router.get(
    "/exception-breakdown",
    response_model=ExceptionBreakdownResponse,
    summary="Get Categorized Exception Breakdown",
    description="Returns exception counts grouped by duplicate, tax mismatch, missing field, policy violation, and amount anomaly.",
)
def get_exception_breakdown(
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    return DashboardService.get_exception_breakdown(db)
