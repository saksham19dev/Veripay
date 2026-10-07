from fastapi import APIRouter
from app.api.invoices import router as invoices_router
from app.api.exceptions import router as exceptions_router
from app.api.dashboard import router as dashboard_router
from app.api.audit import router as audit_router
from app.api.chat import router as chat_router
from app.api.users import router as users_router
from app.api.settings import router as settings_router
from app.api.ai import router as ai_router

api_router = APIRouter(prefix="/api")

api_router.include_router(invoices_router)
api_router.include_router(exceptions_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_router)
api_router.include_router(chat_router)
api_router.include_router(users_router)
api_router.include_router(settings_router)
api_router.include_router(ai_router)
