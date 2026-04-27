import os
from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from . import storage
from .deps import get_session
from .models import Merchant, Shipment, ShipmentEvent, Webhook
from .schemas import ShipmentCreate, EventCreate, LoginRequest, MerchantCreate
from pydantic import BaseModel
from .email import send_status_update_email
from datetime import timedelta
from fastapi import BackgroundTasks
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")


async def require_api_key(
    x_api_key: Optional[str],
    x_device_id: Optional[str],
    session: AsyncSession
) -> Merchant:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
    result = await session.execute(select(Merchant).where(Merchant.api_key == x_api_key))
    merchant = result.scalars().first()
    if not merchant:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
    
    if x_device_id and merchant.active_device_id != x_device_id:
        raise HTTPException(status_code=401, detail="Logged out: Your account was accessed from another device.")
        
    return merchant


def _dt_iso(t: Optional[datetime]) -> str:
    if t is None:
        return ""
    if t.tzinfo is not None:
        return t.isoformat().replace("+00:00", "Z")
    return t.isoformat() + "Z"


@router.post("/auth/login")
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Merchant).where(Merchant.api_key == payload.api_key))
    merchant = result.scalars().first()
    if not merchant:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    merchant.active_device_id = payload.device_id
    await session.commit()
    return {"message": "Login successful", "merchant": {"name": merchant.name}}

def require_admin(x_admin_key: Optional[str] = Header(None)):
    expected = os.getenv("ADMIN_SECRET_KEY", "quickship_admin_2026")
    if not x_admin_key or x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Invalid Admin Key")
    return True

@router.post("/admin/merchants")
async def create_merchant(
    payload: MerchantCreate,
    session: AsyncSession = Depends(get_session),
    admin: bool = Depends(require_admin),
):
    merchant_id = uuid4().hex
    api_key = f"qs_live_{uuid4().hex}"
    merchant = Merchant(
        id=merchant_id,
        name=payload.name,
        api_key=api_key
    )
    session.add(merchant)
    await session.commit()
    return {"message": "Merchant created", "api_key": api_key, "merchant": {"id": merchant_id, "name": merchant.name}}

@router.get("/admin/merchants")
async def list_merchants(
    session: AsyncSession = Depends(get_session),
    admin: bool = Depends(require_admin),
):
    result = await session.execute(select(Merchant))
    merchants = result.scalars().all()
    return [{"id": m.id, "name": m.name, "active_device_id": m.active_device_id} for m in merchants]


@router.post("/shipments", status_code=201)
async def create_shipment(
    payload: ShipmentCreate,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    shipment_id = uuid4().hex
    tracking_no = storage.make_tracking_no()
    label_path = os.path.join(storage.STORAGE_DIR, f"label_{tracking_no}.pdf")
    
    # Generate actual PDF with logo
    c = canvas.Canvas(label_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, 750, "Quickship Direct Shipping Label")
    
    logo_path = os.path.join(os.path.dirname(__file__), "../../tracking-frontend/public/images/logo.png")
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 400, 720, width=80, height=80, preserveAspectRatio=True, mask='auto')
        
    c.setFont("Helvetica", 14)
    c.drawString(50, 700, f"Tracking Number: {tracking_no}")
    c.drawString(50, 670, f"Service: {payload.service.upper()}")
    c.drawString(50, 640, f"Reference: {payload.reference}")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 600, "SENDER:")
    c.setFont("Helvetica", 12)
    c.drawString(50, 580, f"{payload.sender.name} ({payload.sender.company or ''})")
    c.drawString(50, 560, f"{payload.sender.line1}")
    c.drawString(50, 540, f"{payload.sender.city}, {payload.sender.province} {payload.sender.postal}")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, 600, "RECIPIENT:")
    c.setFont("Helvetica", 12)
    c.drawString(300, 580, f"{payload.recipient.name} ({payload.recipient.company or ''})")
    c.drawString(300, 560, f"{payload.recipient.line1}")
    c.drawString(300, 540, f"{payload.recipient.city}, {payload.recipient.province} {payload.recipient.postal}")
    
    c.rect(40, 480, 500, 40)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(290, 492, f"*{tracking_no}*")
    c.save()

    # Calculate Dynamic ETA
    days_to_add = 3 # Default 3 days
    s_prov = payload.sender.province.lower() if payload.sender.province else ""
    r_prov = payload.recipient.province.lower() if payload.recipient.province else ""
    s_city = payload.sender.city.lower() if payload.sender.city else ""
    r_city = payload.recipient.city.lower() if payload.recipient.city else ""
    
    if s_prov and r_prov and s_prov == r_prov:
        if s_city and r_city and s_city == r_city:
            days_to_add = 1 # Next day if same city
        else:
            days_to_add = 2 # 2 days if same state
    elif s_prov and r_prov:
        days_to_add = 4 # 4 days cross state
        
    estimated_delivery_date = datetime.utcnow() + timedelta(days=days_to_add)

    shipment = Shipment(
        id=shipment_id,
        merchant_id=merchant.id,
        tracking_no=tracking_no,
        status="accepted",
        reference=payload.reference,
        service=payload.service,
        parcel=payload.parcel.model_dump(),
        sender=payload.sender.model_dump(),
        recipient=payload.recipient.model_dump(),
        label_path=label_path,
        estimated_delivery_date=estimated_delivery_date,
    )
    session.add(shipment)
    await session.flush()

    event = ShipmentEvent(
        shipment_id=shipment_id,
        status="accepted",
        location=payload.sender.city,
    )
    session.add(event)
    await session.commit()
    await session.refresh(shipment)

    basename = os.path.basename(label_path)
    return {
        "shipment_id": shipment_id,
        "tracking_no": tracking_no,
        "label_url": f"/storage/{basename}",
    }

@router.get("/shipments")
async def list_shipments(
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(
        select(Shipment)
        .where(Shipment.merchant_id == merchant.id)
        .order_by(Shipment.created_at.desc())
    )
    shipments = result.scalars().all()
    return [
        {
            "id": s.id,
            "tracking_no": s.tracking_no,
            "status": s.status,
            "reference": s.reference,
            "service": s.service,
            "created_at": _dt_iso(s.created_at),
        }
        for s in shipments
    ]

@router.get("/shipments/analytics")
async def get_analytics(
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(
        select(Shipment)
        .where(Shipment.merchant_id == merchant.id)
    )
    shipments = result.scalars().all()
    
    total = len(shipments)
    status_counts = {}
    delivered = 0
    
    for s in shipments:
        status = s.status.lower()
        if status == "delivered":
            delivered += 1
        status_counts[status] = status_counts.get(status, 0) + 1
        
    success_rate = (delivered / total * 100) if total > 0 else 0
    
    return {
        "total": total,
        "success_rate": round(success_rate, 2),
        "status_breakdown": status_counts,
        "active_shipments": total - delivered
    }

@router.get("/shipments/{shipment_id}")
async def get_shipment(
    shipment_id: str,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalars().first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    stmt = (
        select(ShipmentEvent)
        .where(ShipmentEvent.shipment_id == shipment.id)
        .order_by(ShipmentEvent.occurred_at, ShipmentEvent.id)
    )
    ev_result = await session.execute(stmt)
    events = ev_result.scalars().all()
    timeline = [
        {"id": ev.id, "status": ev.status, "timestamp": _dt_iso(ev.occurred_at), "location": ev.location}
        for ev in events
    ]
    return {
        "id": shipment.id,
        "tracking_no": shipment.tracking_no,
        "status": shipment.status,
        "timeline": timeline
    }

@router.post("/shipments/{shipment_id}/events", status_code=201)
async def create_event(
    shipment_id: str,
    payload: EventCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalars().first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    event = ShipmentEvent(
        shipment_id=shipment.id,
        status=payload.status,
        location=payload.location,
    )
    session.add(event)
    
    # Update the overall shipment status
    if payload.status.lower() in ["in transit", "out for delivery", "delivered"]:
        shipment.status = payload.status
        background_tasks.add_task(send_status_update_email, shipment.tracking_no, payload.status)

    await session.commit()

    # Dispatch webhooks in background
    background_tasks.add_task(dispatch_webhooks, shipment.merchant_id, {
        "event": "shipment.updated",
        "tracking_no": shipment.tracking_no,
        "shipment_id": shipment.id,
        "status": payload.status,
        "location": payload.location,
        "timestamp": _dt_iso(event.occurred_at),
    })

    return {"message": "Event added"}

@router.put("/shipments/{shipment_id}/events/{event_id}")
async def update_event(
    shipment_id: str,
    event_id: int,
    payload: EventCreate,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(select(ShipmentEvent).where(ShipmentEvent.id == event_id))
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = payload.status
    event.location = payload.location
    await session.commit()
    return {"message": "Event updated"}

class NotificationRequest(BaseModel):
    message: str
    method: str

@router.post("/shipments/{shipment_id}/notify")
async def notify_client(
    shipment_id: str,
    payload: NotificationRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalars().first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
        
    # In a real system, we would trigger Twilio SMS or SendGrid Email here based on payload.method
    # We will just print to console for demo purposes.
    print(f"[MOCK DISPATCH] Sending {payload.method.upper()} to {shipment.recipient.get('name')}: '{payload.message}'")
    
    return {"message": f"Successfully queued {payload.method} notification."}


@router.get("/track/{trackingNo}")
async def track(trackingNo: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Shipment).where(Shipment.tracking_no == trackingNo))
    shipment = result.scalars().first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    stmt = (
        select(ShipmentEvent)
        .where(ShipmentEvent.shipment_id == shipment.id)
        .order_by(ShipmentEvent.occurred_at, ShipmentEvent.id)
    )
    ev_result = await session.execute(stmt)
    events = ev_result.scalars().all()
    timeline = [
        {"status": ev.status, "timestamp": _dt_iso(ev.occurred_at), "location": ev.location}
        for ev in events
    ]
    return {
        "tracking_no": trackingNo, 
        "status": shipment.status, 
        "origin": shipment.sender,
        "destination": shipment.recipient,
        "estimated_delivery_date": _dt_iso(shipment.estimated_delivery_date),
        "timeline": timeline
    }


@router.post("/webhooks")
async def register_webhook(
    url: str,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    webhook_id = uuid4().hex
    hook = Webhook(id=webhook_id, merchant_id=merchant.id, url=url)
    session.add(hook)
    await session.commit()
    await session.refresh(hook)
    return {"webhook_id": webhook_id, "url": url, "created_at": _dt_iso(hook.created_at)}


@router.get("/webhooks")
async def list_webhooks(
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(
        select(Webhook).where(Webhook.merchant_id == merchant.id).order_by(Webhook.created_at)
    )
    hooks = result.scalars().all()
    return [
        {"id": h.id, "url": h.url, "created_at": _dt_iso(h.created_at)}
        for h in hooks
    ]


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    session: AsyncSession = Depends(get_session),
    x_api_key: Optional[str] = Header(None),
    x_device_id: Optional[str] = Header(None),
):
    merchant = await require_api_key(x_api_key, x_device_id, session)
    result = await session.execute(
        select(Webhook).where(Webhook.id == webhook_id, Webhook.merchant_id == merchant.id)
    )
    hook = result.scalars().first()
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await session.delete(hook)
    await session.commit()
    return {"message": "Webhook deleted"}


async def dispatch_webhooks(merchant_id: str, payload: dict):
    """Fire all registered webhooks for a merchant with retry."""
    import asyncio

    from .db import engine as async_engine
    async with AsyncSession(async_engine) as session:
        result = await session.execute(
            select(Webhook).where(Webhook.merchant_id == merchant_id)
        )
        hooks = result.scalars().all()

    max_retries = 3
    async with httpx.AsyncClient(timeout=10) as client:
        for hook in hooks:
            success = False
            for attempt in range(max_retries):
                try:
                    resp = await client.post(hook.url, json=payload)
                    if resp.status_code < 500:
                        logger.info(f"Webhook {hook.id} -> {hook.url} returned {resp.status_code}")
                        success = True
                        break
                    logger.warning(f"Webhook {hook.id} -> {hook.url} returned {resp.status_code}, retrying ({attempt + 1}/{max_retries})...")
                except Exception as e:
                    logger.warning(f"Webhook {hook.id} -> {hook.url} attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s backoff
            if not success:
                logger.error(f"Webhook {hook.id} -> {hook.url} FAILED after {max_retries} attempts")
