from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user_context
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile & Role Context",
)
def get_current_user_profile(
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    user = db.query(User).filter(User.id == user_ctx["id"]).first()
    if not user:
        # Generate on-the-fly demo user record
        return UserResponse(
            id=user_ctx["id"],
            name=user_ctx["name"],
            email=f"{user_ctx['name'].lower().replace(' ', '.')}@enterprise.corp",
            role=user_ctx["role"],
            department="Accounts Payable" if user_ctx["role"] == "AP_REVIEWER" else "Corporate Finance" if user_ctx["role"] == "FINANCE_MANAGER" else "Procurement & Operations",
            title="Senior AP Auditor" if user_ctx["role"] == "AP_REVIEWER" else "VP Finance & Operations" if user_ctx["role"] == "FINANCE_MANAGER" else "Business Requisitioner",
            avatar_url=None,
        )
    return user


@router.get(
    "",
    response_model=List[UserResponse],
    summary="List Organization Users",
)
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()
