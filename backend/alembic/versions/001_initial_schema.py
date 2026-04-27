"""initial schema and demo merchant

Revision ID: 001_initial
Revises:
Create Date: 2026-04-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "merchants",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("api_key", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_merchants_api_key"), "merchants", ["api_key"], unique=True)

    op.create_table(
        "shipments",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("merchant_id", sa.String(length=64), nullable=False),
        sa.Column("tracking_no", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("reference", sa.String(length=255), nullable=True),
        sa.Column("service", sa.String(length=64), nullable=False),
        sa.Column("parcel", sa.JSON(), nullable=False),
        sa.Column("sender", sa.JSON(), nullable=False),
        sa.Column("recipient", sa.JSON(), nullable=False),
        sa.Column("label_path", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shipments_merchant_id"), "shipments", ["merchant_id"], unique=False)
    op.create_index(op.f("ix_shipments_tracking_no"), "shipments", ["tracking_no"], unique=True)

    op.create_table(
        "shipment_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("shipment_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["shipment_id"], ["shipments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shipment_events_shipment_id"), "shipment_events", ["shipment_id"], unique=False)

    op.create_table(
        "webhooks",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("merchant_id", sa.String(length=64), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_webhooks_merchant_id"), "webhooks", ["merchant_id"], unique=False)

    op.execute(
        "INSERT INTO merchants (id, api_key, name) VALUES "
        "('merchant_demo', 'demo-merchant-key', 'Demo Merchant')"
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_webhooks_merchant_id"), table_name="webhooks")
    op.drop_table("webhooks")
    op.drop_index(op.f("ix_shipment_events_shipment_id"), table_name="shipment_events")
    op.drop_table("shipment_events")
    op.drop_index(op.f("ix_shipments_tracking_no"), table_name="shipments")
    op.drop_index(op.f("ix_shipments_merchant_id"), table_name="shipments")
    op.drop_table("shipments")
    op.drop_index(op.f("ix_merchants_api_key"), table_name="merchants")
    op.drop_table("merchants")
