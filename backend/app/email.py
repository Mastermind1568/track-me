import os

def send_status_update_email(tracking_no: str, status: str):
    email_html = f"""
    ======================================================================
    EMAIL DISPATCH INTERCEPTED
    TO: Customer
    SUBJECT: Shipment Update - {tracking_no}
    ----------------------------------------------------------------------
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
        <h1 style="text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">Status Update</h1>
        <p>Your waybill <strong>#{tracking_no}</strong> has been updated.</p>
        <p>New Status: <strong>{status.upper()}</strong></p>
        <a href="{os.getenv('TRACKING_URL_BASE', 'http://localhost:4321')}/track/{tracking_no}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; margin-top: 20px; font-weight: bold;">VIEW LIVE TRACKING</a>
    </div>
    ======================================================================
    """
    print(email_html)
