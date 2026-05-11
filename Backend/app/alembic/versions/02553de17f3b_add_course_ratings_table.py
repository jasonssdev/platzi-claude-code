"""add_course_ratings_table

Revision ID: 02553de17f3b
Revises: d18a08253457
Create Date: 2026-05-11 13:38:05.785762

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02553de17f3b'
down_revision: Union[str, None] = 'd18a08253457'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'course_ratings',
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='chk_rating_range'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_course_ratings_course_id', 'course_ratings', ['course_id'], unique=False)
    op.create_index('idx_course_ratings_user_id', 'course_ratings', ['user_id'], unique=False)
    op.create_index(op.f('ix_course_ratings_id'), 'course_ratings', ['id'], unique=False)
    # Partial unique index: garantiza un solo rating activo por usuario/curso.
    # No se puede usar UNIQUE constraint normal porque NULL != NULL en PostgreSQL.
    op.create_index(
        'unique_active_user_course_rating',
        'course_ratings', ['course_id', 'user_id'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL'),
    )


def downgrade() -> None:
    op.drop_index('unique_active_user_course_rating', table_name='course_ratings')
    op.drop_index(op.f('ix_course_ratings_id'), table_name='course_ratings')
    op.drop_index('idx_course_ratings_user_id', table_name='course_ratings')
    op.drop_index('idx_course_ratings_course_id', table_name='course_ratings')
    op.drop_table('course_ratings')
