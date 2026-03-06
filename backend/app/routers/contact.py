"""Contact router: submit message (public), list (admin)."""

from app.db import get_db
from app.dependencies import get_current_user
from app.models.contact import ContactMessage
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def submit_contact(
    body: ContactCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a contact message (public)."""
    msg = ContactMessage(
        name=body.name,
        email=body.email,
        subject=body.subject,
        message=body.message,
    )
    db.add(msg)
    await db.commit()
    return {"message": "Thank you for your message. We will get back to you soon."}


@router.get("", response_model=list[ContactResponse])
async def list_contact_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List contact messages (admin)."""
    result = await db.execute(
        select(ContactMessage).order_by(ContactMessage.created_at.desc())
    )
    messages = result.scalars().all()
    return [
        ContactResponse(
            id=m.id,
            name=m.name,
            email=m.email,
            subject=m.subject,
            message=m.message,
            read=m.read,
            created_at=m.created_at.isoformat() if m.created_at else None,
        )
        for m in messages
    ]


@router.patch("/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a contact message as read (admin)."""
    result = await db.execute(
        select(ContactMessage).where(ContactMessage.id == message_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.read = True
    await db.commit()
