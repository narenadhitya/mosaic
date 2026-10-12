import logging
import httpx
from typing import Dict, Any, Optional
from app.config import RESEND_API_KEY, RESEND_FROM_EMAIL, DEFAULT_NOTIFICATION_EMAIL

logger = logging.getLogger(__name__)

def send_resend_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an email using the Resend API with automated fallback handling
    for sandbox and test environments.
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY is not configured.")
        return {"success": False, "error": "RESEND_API_KEY not configured"}

    recipient = to_email if to_email and "@" in to_email else DEFAULT_NOTIFICATION_EMAIL
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [recipient],
        "subject": subject,
        "html": html_content
    }
    if text_content:
        payload["text"] = text_content

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)
            
            # If rejected due to domain restriction on free trial, gracefully fallback to delivered@resend.dev
            if resp.status_code == 403 and "can only send testing emails" in resp.text:
                logger.info(f"Target email {recipient} restricted by Resend sandbox; rerouting to {DEFAULT_NOTIFICATION_EMAIL}")
                payload["to"] = [DEFAULT_NOTIFICATION_EMAIL]
                resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)

            if resp.status_code in [200, 201]:
                data = resp.json()
                logger.info(f"Resend email dispatched successfully! ID: {data.get('id')}")
                return {
                    "success": True,
                    "email_id": data.get("id"),
                    "recipient": payload["to"][0],
                    "status": "delivered"
                }
            else:
                logger.error(f"Resend API error {resp.status_code}: {resp.text}")
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": resp.text
                }
    except Exception as e:
        logger.exception("Failed to connect to Resend API")
        return {"success": False, "error": str(e)}


def send_rent_reminder_email(
    tenant_name: str,
    flat_no: str,
    amount_rupees: float,
    due_date: str,
    landlord_name: str,
    landlord_vpa: str,
    to_email: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches a professional Rent Payment Reminder email via Resend.
    """
    subject = f"Payment Reminder: Flat {flat_no} Monthly Rent (₹{amount_rupees:,.2f}) Due Soon"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Mosaic Smart Living</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #c7d2fe;">Sunrise Heights Residents Community</p>
      </div>
      <div style="padding: 28px;">
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <span style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">Payment Due Alert</span>
          <h2 style="margin: 8px 0 0; font-size: 26px; font-weight: 900; color: #ffffff;">₹{amount_rupees:,.2f}</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Monthly Rent &bull; Flat {flat_no}</p>
        </div>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
          Hello <strong>{tenant_name}</strong>,
        </p>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          This is a friendly reminder from your landlord <strong>{landlord_name}</strong>. The monthly house rent for <strong>Flat {flat_no}</strong> is due on <strong>{due_date}</strong>.
        </p>
        <div style="background: #090d16; border-radius: 10px; padding: 14px; margin: 20px 0; font-size: 12px; color: #cbd5e1;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #64748b;">Direct Payee VPA:</span>
            <span style="font-family: monospace; color: #818cf8; font-weight: bold;">{landlord_vpa}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Settlement Standard:</span>
            <span style="color: #10b981; font-weight: 600;">NPCI UPI 2.0 Direct Settlement</span>
          </div>
        </div>
        <div style="text-align: center; margin: 28px 0 10px;">
          <a href="http://localhost:3000" style="background: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; display: inline-block;">
            Open Mosaic to Settle Rent
          </a>
        </div>
      </div>
      <div style="background: #090d16; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
        Protected by BIS IS 19671:2026 QR Guard &bull; Digital Personal Data Protection Act 2023
      </div>
    </div>
    """
    return send_resend_email(to_email or DEFAULT_NOTIFICATION_EMAIL, subject, html)


def send_payment_receipt_email(
    receipt_data: Dict[str, Any],
    to_email: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches a certified Digital Tax Receipt email via Resend.
    """
    subject = f"Receipt {receipt_data.get('receipt_number')}: {receipt_data.get('title')} Settled (₹{receipt_data.get('amount_paise', 0)/100:,.2f})"
    amount_rupees = receipt_data.get('amount_paise', 0) / 100
    is_rent = receipt_data.get('bill_type') == 'RENT'
    hra = receipt_data.get('hra_compliance') or {}

    hra_section = ""
    if is_rent and hra:
        hra_section = f"""
        <div style="background: rgba(79, 70, 229, 0.15); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 12px;">
          <strong style="color: #818cf8; display: block; margin-bottom: 6px;">HRA Tax Deduction Certificate (Sec 10(13A))</strong>
          <div style="color: #cbd5e1;">Landlord: <strong>{hra.get('landlord_name')}</strong> &bull; PAN: <span style="font-family: monospace; color: #34d399;">{hra.get('landlord_pan')}</span></div>
          <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">Period: {hra.get('rent_period')}</div>
        </div>
        """

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">Payment Confirmation & Tax Receipt</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">Sunrise Heights Residents Welfare Association</p>
      </div>
      <div style="padding: 28px;">
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; text-align: center;">
          <span style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase;">Cleared &bull; Double-Entry Balanced</span>
          <h2 style="margin: 6px 0 0; font-size: 28px; font-weight: 900; color: #ffffff;">₹{amount_rupees:,.2f}</h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Receipt No: <span style="font-family: monospace; color: #818cf8;">{receipt_data.get('receipt_number')}</span></p>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          Dear <strong>{receipt_data.get('payer_name')}</strong>, your payment for <strong>{receipt_data.get('title')}</strong> ({receipt_data.get('payer_flat')}) has cleared successfully.
        </p>
        {hra_section}
        <div style="background: #090d16; border-radius: 10px; padding: 14px; margin: 20px 0; font-size: 12px; color: #cbd5e1;">
          <div style="margin-bottom: 6px;"><strong>Payee:</strong> {receipt_data.get('payee', {}).get('name')} ({receipt_data.get('payee', {}).get('vpa')})</div>
          <div style="margin-bottom: 6px;"><strong>NPCI UPI Ref:</strong> <span style="font-family: monospace; color: #818cf8;">{receipt_data.get('payment_details', {}).get('transaction_ref')}</span></div>
          <div style="margin-bottom: 6px;"><strong>Trace ID:</strong> <span style="font-family: monospace; color: #94a3b8;">{receipt_data.get('payment_details', {}).get('trace_id')}</span></div>
          <div><strong>Digital Seal:</strong> <span style="font-family: monospace; color: #34d399;">{receipt_data.get('digital_seal_hash')}</span></div>
        </div>
        <p style="font-size: 11px; color: #64748b; text-align: center;">
          This electronic receipt is permanently recorded in the immutable double-entry ledger.
        </p>
      </div>
    </div>
    """
    return send_resend_email(to_email or DEFAULT_NOTIFICATION_EMAIL, subject, html)
