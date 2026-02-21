"""Contact message schemas."""
from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str | None = None
    message: str


class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str | None
    message: str
    read: bool
    created_at: str | None = None

    class Config:
        from_attributes = True
