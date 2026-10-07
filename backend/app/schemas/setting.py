from typing import Optional
from pydantic import BaseModel, ConfigDict


class AppSettingsSchema(BaseModel):
    maxInvoiceLimit: float = 300000.0
    duplicateWindowDays: int = 30
    autoApproveConfidence: float = 95.0
    currency: str = "INR (₹)"
    emailAlerts: bool = True
    slackAlerts: bool = False
    aiAnomalyDetection: bool = True
    strictGstVerification: bool = True
    theme: str = "light"

    model_config = ConfigDict(from_attributes=True)


class AppSettingsUpdate(BaseModel):
    maxInvoiceLimit: Optional[float] = None
    duplicateWindowDays: Optional[int] = None
    autoApproveConfidence: Optional[float] = None
    currency: Optional[str] = None
    emailAlerts: Optional[bool] = None
    slackAlerts: Optional[bool] = None
    aiAnomalyDetection: Optional[bool] = None
    strictGstVerification: Optional[bool] = None
    theme: Optional[str] = None
