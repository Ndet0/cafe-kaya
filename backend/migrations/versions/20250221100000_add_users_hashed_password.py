"""Add users.hashed_password if missing (idempotent).

Revision ID: 20250221100000
Revises: 20250221000000
Create Date: 2025-02-21

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250221100000"
down_revision: Union[str, None] = "20250221000000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);"
    )
    op.execute(
        "UPDATE users SET hashed_password = '' WHERE hashed_password IS NULL;"
    )
    op.execute(
        "ALTER TABLE users ALTER COLUMN hashed_password SET NOT NULL;"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE users DROP COLUMN IF EXISTS hashed_password;"
    )
