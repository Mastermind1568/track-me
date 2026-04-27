from typing import Optional

from pydantic import BaseModel


class Address(BaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    special_instructions: Optional[str] = None
    line1: str
    city: str
    province: str
    postal: str
    country: str


class Parcel(BaseModel):
    weight_kg: float
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None


class ShipmentCreate(BaseModel):
    reference: Optional[str] = None
    service: str = "standard"
    parcel: Parcel
    sender: Address
    recipient: Address

class EventCreate(BaseModel):
    status: str
    location: Optional[str] = None
    details: Optional[str] = None
    timestamp: Optional[str] = None

class LoginRequest(BaseModel):
    api_key: str
    device_id: str

class MerchantCreate(BaseModel):
    name: str
