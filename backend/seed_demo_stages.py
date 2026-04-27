import asyncio
import os
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models import Merchant, Shipment, ShipmentEvent
from app.db import get_async_database_url
from datetime import datetime, timedelta

DEMO_SHIPMENTS = [
    {
        "tracking_no": "QSDEMO-ACCEPTED",
        "status": "accepted",
        "sender": {"name": "Jane Miller", "company": "Brooklyn Candles Co.", "line1": "245 Kent Ave", "city": "Brooklyn", "province": "NY", "postal": "11249", "country": "US", "email": "jane@brooklyncandles.com", "phone": "+17185551234"},
        "recipient": {"name": "Carlos Rivera", "company": "", "line1": "1401 S Michigan Ave", "city": "Chicago", "province": "IL", "postal": "60605", "country": "US", "email": "carlos.r@gmail.com", "phone": "+13125559876"},
        "events": [
            {"status": "accepted", "location": "Brooklyn, NY", "hours_offset": 0},
        ]
    },
    {
        "tracking_no": "QSDEMO-TRANSIT",
        "status": "in transit",
        "sender": {"name": "Sarah Chen", "company": "Bloom Botanicals", "line1": "550 Montgomery St", "city": "San Francisco", "province": "CA", "postal": "94111", "country": "US", "email": "sarah@bloombotanicals.com", "phone": "+14155551111"},
        "recipient": {"name": "David Thompson", "company": "", "line1": "3500 Las Vegas Blvd S", "city": "Las Vegas", "province": "NV", "postal": "89109", "country": "US", "email": "david.t@outlook.com", "phone": "+17025552222"},
        "events": [
            {"status": "accepted", "location": "San Francisco, CA", "hours_offset": 0},
            {"status": "in transit", "location": "Bakersfield, CA", "hours_offset": 8},
        ]
    },
    {
        "tracking_no": "QSDEMO-OUTDELIVERY",
        "status": "out for delivery",
        "sender": {"name": "Mike Johnson", "company": "Austin Leather Works", "line1": "1100 Congress Ave", "city": "Austin", "province": "TX", "postal": "78701", "country": "US", "email": "mike@austinleather.com", "phone": "+15125553333"},
        "recipient": {"name": "Emily Watson", "company": "", "line1": "200 Peachtree St NW", "city": "Atlanta", "province": "GA", "postal": "30303", "country": "US", "email": "emily.w@yahoo.com", "phone": "+14045554444"},
        "events": [
            {"status": "accepted", "location": "Austin, TX", "hours_offset": 0},
            {"status": "in transit", "location": "Jackson, MS", "hours_offset": 14},
            {"status": "out for delivery", "location": "Atlanta, GA", "hours_offset": 26},
        ]
    },
    {
        "tracking_no": "QSDEMO-DELIVERED",
        "status": "delivered",
        "sender": {"name": "Lisa Park", "company": "Seattle Roasters", "line1": "1912 Pike Pl", "city": "Seattle", "province": "WA", "postal": "98101", "country": "US", "email": "lisa@seattleroasters.com", "phone": "+12065555555"},
        "recipient": {"name": "Tom Bradley", "company": "", "line1": "350 5th Ave", "city": "New York", "province": "NY", "postal": "10118", "country": "US", "email": "tom.b@gmail.com", "phone": "+12125556666"},
        "events": [
            {"status": "accepted", "location": "Seattle, WA", "hours_offset": 0},
            {"status": "in transit", "location": "Boise, ID", "hours_offset": 10},
            {"status": "in transit", "location": "Denver, CO", "hours_offset": 24},
            {"status": "out for delivery", "location": "New York, NY", "hours_offset": 48},
            {"status": "delivered", "location": "New York, NY", "hours_offset": 52},
        ]
    },
]

async def run():
    engine = create_async_engine(get_async_database_url())
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Merchant))
        merchant = result.scalars().first()
        if not merchant:
            print("No merchant found.")
            return

        for demo in DEMO_SHIPMENTS:
            # Check if already exists
            existing = await session.execute(select(Shipment).where(Shipment.tracking_no == demo["tracking_no"]))
            if existing.scalars().first():
                print(f"  Skipping {demo['tracking_no']} (already exists)")
                continue

            shipment_id = uuid4().hex
            base_time = datetime.utcnow() - timedelta(hours=60)

            # Calculate ETA
            s_prov = demo["sender"]["province"].lower()
            r_prov = demo["recipient"]["province"].lower()
            s_city = demo["sender"]["city"].lower()
            r_city = demo["recipient"]["city"].lower()
            days = 3
            if s_prov == r_prov:
                days = 1 if s_city == r_city else 2
            else:
                days = 4

            s = Shipment(
                id=shipment_id,
                merchant_id=merchant.id,
                tracking_no=demo["tracking_no"],
                status=demo["status"],
                reference=f"DEMO-{demo['tracking_no'][-8:]}",
                service="standard",
                parcel={"weight_kg": 2.5},
                sender=demo["sender"],
                recipient=demo["recipient"],
                label_path=f"storage/label_{demo['tracking_no']}.pdf",
                estimated_delivery_date=base_time + timedelta(days=days),
                created_at=base_time,
            )
            session.add(s)

            for ev in demo["events"]:
                event = ShipmentEvent(
                    shipment_id=shipment_id,
                    status=ev["status"],
                    location=ev["location"],
                    occurred_at=base_time + timedelta(hours=ev["hours_offset"]),
                )
                session.add(event)

            print(f"  Created {demo['tracking_no']} ({demo['status']})")

        await session.commit()
        print("\nDone! Preview these tracking numbers:")
        for d in DEMO_SHIPMENTS:
            print(f"  http://localhost:4321/track/{d['tracking_no']}")

if __name__ == "__main__":
    asyncio.run(run())
