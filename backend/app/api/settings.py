from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import require_roles, ROLE_FINANCE_MANAGER, get_current_user_context
from app.models.setting import PolicySetting
from app.schemas.setting import AppSettingsSchema, AppSettingsUpdate
from app.services.audit_service import AuditService

router = APIRouter(prefix="/settings", tags=["Settings & Policies"])


def get_or_create_settings(db: Session) -> PolicySetting:
    setting = db.query(PolicySetting).filter(PolicySetting.id == "default").first()
    if not setting:
        setting = PolicySetting(
            id="default",
            max_invoice_limit=300000.0,
            duplicate_window_days=30,
            auto_approve_confidence=95.0,
            currency="INR (₹)",
            email_alerts=True,
            slack_alerts=False,
            ai_anomaly_detection=True,
            strict_gst_verification=True,
            theme="light",
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get(
    "",
    response_model=AppSettingsSchema,
    summary="Get Current Policy & Application Settings",
)
def get_settings(
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_context),
):
    setting = get_or_create_settings(db)
    return AppSettingsSchema(
        maxInvoiceLimit=setting.max_invoice_limit,
        duplicateWindowDays=setting.duplicate_window_days,
        autoApproveConfidence=setting.auto_approve_confidence,
        currency=setting.currency,
        emailAlerts=setting.email_alerts,
        slackAlerts=setting.slack_alerts,
        aiAnomalyDetection=setting.ai_anomaly_detection,
        strictGstVerification=setting.strict_gst_verification,
        theme=setting.theme,
    )


@router.put(
    "",
    response_model=AppSettingsSchema,
    summary="Update Policy & Application Settings (Finance Manager Only)",
)
@router.post(
    "",
    response_model=AppSettingsSchema,
    summary="Update Policy & Application Settings (Finance Manager Only)",
)
def update_settings(
    payload: AppSettingsUpdate,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_roles(ROLE_FINANCE_MANAGER)),
):
    setting = get_or_create_settings(db)

    changes = []
    if payload.maxInvoiceLimit is not None:
        changes.append(f"Max Limit: {setting.max_invoice_limit} -> {payload.maxInvoiceLimit}")
        setting.max_invoice_limit = payload.maxInvoiceLimit
    if payload.duplicateWindowDays is not None:
        setting.duplicate_window_days = payload.duplicateWindowDays
    if payload.autoApproveConfidence is not None:
        setting.auto_approve_confidence = payload.autoApproveConfidence
    if payload.currency is not None:
        setting.currency = payload.currency
    if payload.emailAlerts is not None:
        setting.email_alerts = payload.emailAlerts
    if payload.slackAlerts is not None:
        setting.slack_alerts = payload.slackAlerts
    if payload.aiAnomalyDetection is not None:
        setting.ai_anomaly_detection = payload.aiAnomalyDetection
    if payload.strictGstVerification is not None:
        setting.strict_gst_verification = payload.strictGstVerification
    if payload.theme is not None:
        setting.theme = payload.theme

    db.commit()
    db.refresh(setting)

    # Log policy update in audit trail
    AuditService.create_log(
        db=db,
        action="Policy Rules Updated",
        user=f"{user_ctx['name']} (Finance Manager)",
        user_role=ROLE_FINANCE_MANAGER,
        entity_type="POLICY",
        entity_id="default",
        reason=f"Policy updated: {', '.join(changes) if changes else 'Configuration saved'}",
        metadata_json=payload.model_dump(exclude_unset=True),
    )

    return AppSettingsSchema(
        maxInvoiceLimit=setting.max_invoice_limit,
        duplicateWindowDays=setting.duplicate_window_days,
        autoApproveConfidence=setting.auto_approve_confidence,
        currency=setting.currency,
        emailAlerts=setting.email_alerts,
        slackAlerts=setting.slack_alerts,
        aiAnomalyDetection=setting.ai_anomaly_detection,
        strictGstVerification=setting.strict_gst_verification,
        theme=setting.theme,
    )
