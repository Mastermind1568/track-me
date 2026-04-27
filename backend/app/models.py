from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column, DateTime, func
from sqlmodel import Field, SQLModel


class Merchant(SQLModel, table=True):
    __tablename__ = "merchants"

    id: str = Field(primary_key=True, max_length=64)
    api_key: str = Field(unique=True, index=True, max_length=128)
    name: str = Field(max_length=255)
    active_device_id: Optional[str] = Field(default=None, max_length=255)


class Shipment(SQLModel, table=True):
    __tablename__ = "shipments"

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True, max_length=64)
    merchant_id: str = Field(foreign_key="merchants.id", index=True, max_length=64)
    tracking_no: str = Field(unique=True, index=True, max_length=32)
    status: str = Field(max_length=64)
    reference: Optional[str] = Field(default=None, max_length=255)
    service: str = Field(default="standard", max_length=64)
    parcel: dict[str, Any] = Field(sa_column=Column(JSON))
    sender: dict[str, Any] = Field(sa_column=Column(JSON))
    recipient: dict[str, Any] = Field(sa_column=Column(JSON))
    label_path: Optional[str] = Field(default=None)
    estimated_delivery_date: Optional[datetime] = Field(default=None)
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class ShipmentEvent(SQLModel, table=True):
    __tablename__ = "shipment_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    shipment_id: str = Field(foreign_key="shipments.id", index=True, max_length=64)
    status: str = Field(max_length=64)
    occurred_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    location: Optional[str] = Field(default=None, max_length=255)


class Webhook(SQLModel, table=True):
    __tablename__ = "webhooks"

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True, max_length=64)
    merchant_id: str = Field(foreign_key="merchants.id", index=True, max_length=64)
    url: str = Field(max_length=2048)
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
