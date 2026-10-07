from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: str
    role: str
    department: str
    title: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    id: str


class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
