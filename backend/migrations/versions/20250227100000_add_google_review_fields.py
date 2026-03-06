"""Add Google review fields: google_review_id, profile_photo_url, review_time, last_synced_at.

Revision ID: 20250227100000
Revises: 20250221100000
Create Date: 2025-02-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250227100000"
down_revision: Union[str, None] = "20250221100000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reviews", sa.Column("google_review_id", sa.String(100), nullable=True)
    )
    op.add_column(
        "reviews", sa.Column("profile_photo_url", sa.String(500), nullable=True)
    )
    op.add_column(
        "reviews", sa.Column("review_time", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "reviews",
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_reviews_google_review_id", "reviews", ["google_review_id"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_reviews_google_review_id", table_name="reviews")
    op.drop_column("reviews", "last_synced_at")
    op.drop_column("reviews", "review_time")
    op.drop_column("reviews", "profile_photo_url")
    op.drop_column("reviews", "google_review_id")
