from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

# Role constants
ROLE_REQUESTER = "REQUESTER"
ROLE_AP_REVIEWER = "AP_REVIEWER"
ROLE_FINANCE_MANAGER = "FINANCE_MANAGER"


def get_current_user_context(
    x_user_role: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
) -> dict:
    role = (x_user_role or "AP_REVIEWER").upper()
    if role not in [ROLE_REQUESTER, ROLE_AP_REVIEWER, ROLE_FINANCE_MANAGER]:
        role = ROLE_AP_REVIEWER

    user_id = x_user_id or ("usr-req-01" if role == ROLE_REQUESTER else "usr-mgr-03" if role == ROLE_FINANCE_MANAGER else "usr-rev-02")
    user_name = x_user_name or ("Alex Rivera" if role == ROLE_REQUESTER else "Elena Rostova" if role == ROLE_FINANCE_MANAGER else "Jordan Lee")

    return {
        "role": role,
        "id": user_id,
        "name": user_name,
    }


def require_roles(*allowed_roles: str):
    def role_checker(ctx: dict = Depends(get_current_user_context)):
        if ctx["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"403 Forbidden: User with role '{ctx['role']}' is not authorized to access this resource."
            )
        return ctx
    return role_checker
