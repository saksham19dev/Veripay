import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all models are registered
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("veriflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    logger.info("Initializing VeriFlow database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Upload directory verified: %s", settings.UPLOAD_DIR)
    
    yield
    
    logger.info("Shutting down VeriFlow Backend...")


app = FastAPI(
    title="VeriFlow - AI-Assisted Invoice Exception Detection Engine",
    description=(
        "VeriFlow analyzes incoming invoices, detects rule violations, anomalies, and duplicates, "
        "calculates explainable risk scores, and routes items to Auto-Pass or Human Review."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for React + TypeScript frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"] if os.getenv("CORS_ALLOW_ALL", "true").lower() == "true" else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Error Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": request.url.path,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        errors.append(f"{field}: {err.get('msg', 'Invalid value')}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "status_code": 422,
            "message": "Input validation error",
            "errors": errors,
            "path": request.url.path,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "status_code": 500,
            "message": "An internal server error occurred. Please contact the administrator.",
            "path": request.url.path,
        },
    )


# Include API Routes
app.include_router(api_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc",
        "principle": "Detect -> Explain -> Review -> Record",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": settings.VERSION,
    }
