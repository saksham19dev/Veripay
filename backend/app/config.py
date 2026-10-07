import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "VeriFlow Invoice Exception Detection Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./veriflow.db")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Business Rules & Policies
    MAX_AUTO_APPROVAL_AMOUNT: float = 300000.0  # ₹300,000 threshold
    DUPLICATE_WINDOW_DAYS: int = 30
    TAX_TOLERANCE_PERCENTAGE: float = 1.0  # 1% allowable discrepancy
    AUTO_APPROVE_CONFIDENCE: float = 95.0

    # Risk Scoring Weights
    WEIGHT_DUPLICATE: int = 40
    WEIGHT_TAX_MISMATCH: int = 25
    WEIGHT_MISSING_FIELD: int = 15
    WEIGHT_POLICY_VIOLATION: int = 20
    WEIGHT_AMOUNT_ANOMALY: int = 15
    WEIGHT_DATA_INCONSISTENCY: int = 15

    # Risk Scoring Thresholds
    RISK_LOW_MAX: int = 19
    RISK_MEDIUM_MAX: int = 39
    RISK_HIGH_MAX: int = 69
    # 70+ is CRITICAL

    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE_MB: int = 25

    # AI Service Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")  # mock | openai | gemini | anthropic
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)
    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY", None)
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "gpt-4o-mini")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()
