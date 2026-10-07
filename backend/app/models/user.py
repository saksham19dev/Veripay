from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=False, default="AP_REVIEWER")  # REQUESTER, AP_REVIEWER, FINANCE_MANAGER
    department = Column(String(100), nullable=False, default="Accounts Payable")
    title = Column(String(100), nullable=False, default="AP Specialist")
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
