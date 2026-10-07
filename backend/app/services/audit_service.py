from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse


class AuditService:
    @staticmethod
    def create_log(
        db: Session,
        action: str,
        user: str = "System (VeriFlow Engine)",
        invoice_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        entity_type: str = "INVOICE",
        entity_id: Optional[str] = None,
        previous_status: Optional[str] = "None",
        new_status: Optional[str] = "Resolved",
        reason: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        log_id = f"AUD-{int(datetime.utcnow().timestamp() * 1000)}"
        audit = AuditLog(
            id=log_id,
            invoice_id=invoice_id or entity_id,
            user=user,
            user_id=user_id,
            user_role=user_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id or invoice_id,
            previous_status=previous_status,
            new_status=new_status,
            reason=reason,
            metadata_json=metadata_json,
            timestamp=datetime.utcnow(),
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    @staticmethod
    def get_logs(db: Session, limit: int = 100, invoice_id: Optional[str] = None) -> List[AuditLogResponse]:
        query = db.query(AuditLog)
        if invoice_id:
            query = query.filter(AuditLog.invoice_id == invoice_id)
        logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

        responses = []
        for log in logs:
            time_str = log.timestamp.strftime("%I:%M %p")
            date_str = log.timestamp.strftime("%d %b %Y")
            responses.append(
                AuditLogResponse(
                    id=log.id,
                    timestamp=time_str,
                    date=date_str,
                    invoiceId=log.invoice_id or "",
                    invoice_id=log.invoice_id,
                    action=log.action,
                    previousStatus=log.previous_status or "None",
                    newStatus=log.new_status or "Resolved",
                    reason=log.reason or "",
                    user=log.user,
                    user_id=log.user_id,
                    user_role=log.user_role,
                    entity_type=log.entity_type,
                    entity_id=log.entity_id,
                    metadata_json=log.metadata_json,
                    raw_timestamp=log.timestamp,
                )
            )
        return responses
