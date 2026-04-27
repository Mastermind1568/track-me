import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db import engine, create_db_and_tables
from app.models import Merchant, Shipment, ShipmentEvent

async def seed():
    await create_db_and_tables()
    async with AsyncSession(engine) as session:
        # Check if merchant exists
        result = await session.execute(select(Merchant).where(Merchant.api_key == "demo-merchant-key"))
        merchant = result.scalars().first()
        
        if not merchant:
            merchant = Merchant(
                id="demo-merchant-id",
                name="Quickship Demo Merchant",
                api_key="demo-merchant-key"
            )
            session.add(merchant)
            await session.commit()
            await session.refresh(merchant)
            print("Created demo merchant.")
        
        # Check if test shipment exists
        result = await session.execute(select(Shipment).where(Shipment.tracking_no == "TRKB2C7CF5A3281"))
        shipment = result.scalars().first()
        
        if not shipment:
            shipment = Shipment(
                id="test-shipment-id",
                merchant_id=merchant.id,
                tracking_no="TRKB2C7CF5A3281",
                status="OUT_FOR_DELIVERY",
                reference="REF-001",
                service="Standard",
                parcel={"weight": 1.2, "dimensions": "10x10x10"},
                sender={"name": "Alice", "city": "New York", "address": "123 Broadway"},
                recipient={"name": "Bob", "city": "Los Angeles", "address": "456 Sunset Blvd"},
                label_path="/storage/label_TRKB2C7CF5A3281.pdf"
            )
            session.add(shipment)
            await session.flush()
            
            events = [
                ShipmentEvent(shipment_id=shipment.id, status="accepted", location="New York"),
                ShipmentEvent(shipment_id=shipment.id, status="IN_TRANSIT", location="Memphis Hub"),
                ShipmentEvent(shipment_id=shipment.id, status="OUT_FOR_DELIVERY", location="Los Angeles"),
            ]
            for e in events:
                session.add(e)
            
            await session.commit()
            print("Created test shipment TRKB2C7CF5A3281.")
        else:
            print("Test shipment already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
