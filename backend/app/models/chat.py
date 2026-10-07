from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Text
from app.database import Base


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String(50), primary_key=True, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    text = Column(Text, nullable=False)
    invoice_id = Column(String(50), nullable=True)
    exception_id = Column(String(50), nullable=True)
    matched_fields = Column(JSON, nullable=True)
    action_label = Column(String(100), nullable=True)
    action_url = Column(String(255), nullable=True)
    breakdown_list = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
