"""Create an admin user. Run from backend dir: python -m scripts.create_admin <email> <password>"""
import asyncio
import sys
from pathlib import Path

# Add parent so app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models.user import User
from app.services.auth import hash_password


async def main():
    if len(sys.argv) != 3:
        print("Usage: python -m scripts.create_admin <email> <password>")
        sys.exit(1)
    email = sys.argv[1]
    password = sys.argv[2]

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print(f"User {email} already exists.")
            return
        user = User(
            email=email,
            hashed_password=hash_password(password),
            role="admin",
        )
        db.add(user)
        await db.commit()
        print(f"Admin user created: {email}")


if __name__ == "__main__":
    asyncio.run(main())
