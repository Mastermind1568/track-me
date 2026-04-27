import asyncio
import os
import random
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from app.models import Merchant, Shipment, ShipmentEvent
from app.db import get_async_database_url
from datetime import datetime, timedelta

async def run():
    engine = create_async_engine(get_async_database_url())
    async with AsyncSession(engine) as session:
        # Get first merchant
        result = await session.execute(select(Merchant))
        merchant = result.scalars().first()
        if not merchant:
            print("No merchant found.")
            return

        print(f"Generating data for merchant: {merchant.name}")
        
        statuses = ["delivered", "in transit", "out for delivery", "exception"]
        weights = [0.6, 0.25, 0.1, 0.05] # 60% delivered, 25% transit, 10% out, 5% exception
        
        for _ in range(45):
            shipment_id = uuid4().hex
            tracking_no = f"QS{random.randint(100000000, 999999999)}"
            
            status = random.choices(statuses, weights=weights)[0]
            
            # create shipment
            s = Shipment(
                id=shipment_id,
                merchant_id=merchant.id,
                tracking_no=tracking_no,
                status=status,
                reference=f"ORD-{random.randint(1000, 9999)}",
                service="standard",
                parcel={"weight_kg": round(random.uniform(0.5, 15.0), 1)},
                sender={"line1": "123 Hub St", "city": "New York", "province": "NY", "postal": "10001", "country": "US"},
                recipient={"line1": "456 Dest Ave", "city": "Los Angeles", "province": "CA", "postal": "90001", "country": "US"},
                label_path=f"storage/label_{tracking_no}.pdf",
                estimated_delivery_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)) + timedelta(days=random.randint(1, 5)),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            )
            session.add(s)
            
            # add events
            ev1 = ShipmentEvent(shipment_id=shipment_id, status="accepted", location="New York, NY", occurred_at=s.created_at + timedelta(hours=1))
            session.add(ev1)
            
            if status in ["in transit", "out for delivery", "delivered", "exception"]:
                ev2 = ShipmentEvent(shipment_id=shipment_id, status="in transit", location="Chicago, IL", occurred_at=s.created_at + timedelta(days=1))
                session.add(ev2)
                
            if status in ["out for delivery", "delivered"]:
                ev3 = ShipmentEvent(shipment_id=shipment_id, status="out for delivery", location="Los Angeles, CA", occurred_at=s.created_at + timedelta(days=2))
                session.add(ev3)
                
            if status == "delivered":
                ev4 = ShipmentEvent(shipment_id=shipment_id, status="delivered", location="Los Angeles, CA", occurred_at=s.created_at + timedelta(days=2, hours=4))
                session.add(ev4)
                
            if status == "exception":
                ev_err = ShipmentEvent(shipment_id=shipment_id, status="exception", location="Denver, CO", occurred_at=s.created_at + timedelta(days=1, hours=5), details="Weather delay")
                session.add(ev_err)

        await session.commit()
        print("Generated 45 mock shipments.")

if __name__ == "__main__":
    asyncio.run(run())
