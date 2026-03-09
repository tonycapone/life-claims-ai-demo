"""Add beneficiary_history to policies

Revision ID: 6fe74174f8b6
Revises: 8b8bd4d00e6d
Create Date: 2026-03-09 16:00:33.605867

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fe74174f8b6'
down_revision: Union[str, Sequence[str], None] = '8b8bd4d00e6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('policies', sa.Column('beneficiary_history', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('policies', 'beneficiary_history')
