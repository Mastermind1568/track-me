"""
Alternate SQLModel schema (integer PKs, ORM relationships, JSON payloads).

Not imported by `app.main` / Alembic by default — the live API uses `app.models`.
Import this module when you are ready to migrate routes and add a new Alembic revision.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, String
from sqlmodel import Field, Relationship, SQLModel


def gen_uuid() -> str:
    return uuid.uuid4().hex


class Merchant(SQLModel, table=True):
    __tablename__ = "merchant"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    api_key: str = Field(default_factory=lambda: uuid.uuid4().hex, sa_column=Column(String(64), nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    shipments: list[Shipment] = Relationship(back_populates="merchant")


class Shipment(SQLModel, table=True):
    __tablename__ = "shipment"

    id: Optional[int] = Field(default=None, primary_key=True)
    shipment_id: str = Field(
        default_factory=gen_uuid,
        sa_column=Column(String(36), unique=True, nullable=False, index=True),
    )
    tracking_no: Optional[str] = Field(
        default=None,
        sa_column=Column(String(32), unique=True, nullable=True, index=True),
    )
    merchant_id: Optional[int] = Field(default=None, foreign_key="merchant.id")
    status: str = Field(default="accepted")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    sender: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    recipient: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    parcel: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    merchant: Optional[Merchant] = Relationship(back_populates="shipments")
    events: list[ShipmentEvent] = Relationship(back_populates="shipment")


class ShipmentEvent(SQLModel, table=True):
    __tablename__ = "shipment_event"

    id: Optional[int] = Field(default=None, primary_key=True)
    shipment_id: Optional[int] = Field(default=None, foreign_key="shipment.id", index=True)
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: Optional[str] = None
    details: Optional[str] = None

    shipment: Optional[Shipment] = Relationship(back_populates="events")
