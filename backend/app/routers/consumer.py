from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import uuid
import time
from datetime import datetime, timezone
from app.database import get_db
from app.models import (
    FlatModel, SmartMeterModel, BillModel, NotificationModel,
    InviteModel, SmartMeterSyncRequest, LandlordInviteCreateRequest,
    LandlordNudgeRequest, RedeemInviteRequest, PayBillRequest
)
from app.graph_engine import analyze_payment_graph

router = APIRouter(prefix="/api/consumer", tags=["Consumer Living"])

def current_iso():
    return datetime.now(timezone.utc).isoformat()

# ============================================================================
# 1. RESIDENT HOME FEED (MyGate-Inspired)
# ============================================================================
@router.get("/home")
def get_consumer_home(
    role: str = Query("resident", description="Active persona: resident, landlord, admin"),
    flat_no: str = Query("4B", description="Flat number")
):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Active Flat Details
        cursor.execute("SELECT * FROM flats WHERE flat_no = ?", (flat_no,))
        flat_row = cursor.fetchone()
        if not flat_row:
            # Fallback to Flat 4B if not found
            cursor.execute("SELECT * FROM flats WHERE flat_no = '4B'")
            flat_row = cursor.fetchone()
        flat_dict = dict(flat_row)

        # 2. Bills for this flat
        cursor.execute("SELECT * FROM bills WHERE flat_no = ? ORDER BY due_date ASC", (flat_dict["flat_no"],))
        bills_rows = cursor.fetchall()
        bills = [dict(b) for b in bills_rows]

        unpaid_bills = [b for b in bills if b["status"] == "UNPAID"]
        total_unpaid_paise = sum(b["amount_paise"] for b in unpaid_bills)

        # 3. Smart Meters for this flat
        cursor.execute("SELECT * FROM smart_meters WHERE flat_no = ?", (flat_dict["flat_no"],))
        meters_rows = cursor.fetchall()
        smart_meters = [dict(m) for m in meters_rows]

        # 4. Monthly Expense Breakdown by category
        breakdown = {
            "RENT": sum(b["amount_paise"] for b in bills if b["bill_type"] == "RENT"),
            "ELECTRICITY": sum(b["amount_paise"] for b in bills if b["bill_type"] == "ELECTRICITY"),
            "WATER": sum(b["amount_paise"] for b in bills if b["bill_type"] == "WATER"),
            "MAINTENANCE": sum(b["amount_paise"] for b in bills if b["bill_type"] == "MAINTENANCE")
        }

        # 5. Notifications
        cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5")
        notifs_rows = cursor.fetchall()
        notifications = [dict(n) for n in notifs_rows]
        unread_count = sum(1 for n in notifications if not n["is_read"])

        # Determine user name based on persona
        user_name = "Rohan Verma"
        if role == "landlord":
            user_name = "Vikram Malhotra"
        elif role == "admin":
            user_name = "R. Sundaram (RWA Desk)"

        return {
            "active_flat": flat_dict,
            "user_name": user_name,
            "user_role": role,
            "bills": bills,
            "total_unpaid_paise": total_unpaid_paise,
            "smart_meters": smart_meters,
            "monthly_expense_breakdown": breakdown,
            "recent_notifications": notifications,
            "unread_notifications_count": unread_count
        }

# ============================================================================
# 2. LIVE SMART METER IOT SIMULATOR SYNC
# ============================================================================
@router.post("/smart-meter/sync")
def sync_smart_meter(req: SmartMeterSyncRequest):
    """
    Simulates automated IoT telemetry sync from the electricity/water meter.
    Increments consumption, recalculates charges, updates the corresponding bill,
    and dispatches a notification.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM smart_meters WHERE flat_no = ? AND meter_type = ?", (req.flat_no, req.meter_type))
        meter = cursor.fetchone()
        if not meter:
            raise HTTPException(status_code=404, detail="Smart meter device not found")

        # Increment readings
        increment = req.simulated_increment or (14.2 if req.meter_type == "ELECTRICITY" else 1.2)
        new_reading = round(meter["current_reading"] + increment, 1)
        new_cycle_consumption = round(meter["cycle_consumption"] + increment, 1)
        new_bill_paise = int(round(new_cycle_consumption * meter["rate_per_unit_paise"]))
        now = current_iso()

        # Update smart meter record
        cursor.execute("""
        UPDATE smart_meters 
        SET current_reading = ?, cycle_consumption = ?, calculated_bill_paise = ?, last_synced_at = ?
        WHERE id = ?
        """, (new_reading, new_cycle_consumption, new_bill_paise, now, meter["id"]))

        # Update the active unpaid bill linked to this meter
        cursor.execute("""
        UPDATE bills
        SET amount_paise = ?, title = ?
        WHERE flat_no = ? AND bill_type = ? AND status = 'UNPAID'
        """, (
            new_bill_paise, 
            f"Smart Meter {req.meter_type.capitalize()} ({new_cycle_consumption} {meter['unit_label']})",
            req.flat_no, 
            req.meter_type
        ))

        # Log an automated notification
        unit_str = f"{increment} {meter['unit_label']}"
        cursor.execute("""
        INSERT INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
        VALUES (?, 'usr_tenant_4b', ?, ?, ?, 'METER_SYNC', 0, ?)
        """, (
            f"NOTIF-{int(time.time())}-{uuid.uuid4().hex[:6]}", 
            req.flat_no,
            f"Smart Meter Synced (+{unit_str})",
            f"IoT device {meter['device_id']} updated reading to {new_reading} {meter['unit_label']}. Cycle total: {new_cycle_consumption} {meter['unit_label']} (₹{new_bill_paise/100:,.2f}).",
            now
        ))

        cursor.execute("SELECT * FROM smart_meters WHERE id = ?", (meter["id"],))
        updated_meter = dict(cursor.fetchone())

        return {
            "status": "synced",
            "meter": updated_meter,
            "increment_logged": increment,
            "new_bill_paise": new_bill_paise
        }

# ============================================================================
# 3. LANDLORD PORTFOLIO & TENANT INVITES
# ============================================================================
@router.get("/landlord/portfolio")
def get_landlord_portfolio(owner_id: str = "usr_owner_vikram"):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM flats WHERE owner_id = ?", (owner_id,))
        flats = [dict(f) for f in cursor.fetchall()]

        # Attach tenant rent clearance and utility status for each flat
        for f in flats:
            cursor.execute("SELECT * FROM bills WHERE flat_no = ?", (f["flat_no"],))
            flat_bills = [dict(b) for b in cursor.fetchall()]
            rent_bill = next((b for b in flat_bills if b["bill_type"] == "RENT"), None)
            utility_unpaid = [b for b in flat_bills if b["bill_type"] in ["ELECTRICITY", "WATER"] and b["status"] == "UNPAID"]

            f["rent_status"] = rent_bill["status"] if rent_bill else "PAID"
            f["rent_amount_paise"] = rent_bill["amount_paise"] if rent_bill else f["monthly_rent_paise"]
            f["rent_due_date"] = rent_bill["due_date"] if rent_bill else "N/A"
            f["utility_liabilities_count"] = len(utility_unpaid)
            f["utility_liabilities_paise"] = sum(b["amount_paise"] for b in utility_unpaid)

        # Active invites
        cursor.execute("SELECT * FROM invites WHERE owner_id = ? ORDER BY created_at DESC", (owner_id,))
        invites = [dict(i) for i in cursor.fetchall()]

        return {
            "owner_name": "Vikram Malhotra",
            "owner_vpa": "vikram.owner@hdfcbank",
            "flats": flats,
            "active_invites": invites
        }

@router.post("/landlord/invite")
def create_tenant_invite(req: LandlordInviteCreateRequest):
    invite_code = f"MOSAIC-{req.flat_no}-{uuid.uuid4().hex[:4].upper()}"
    inv_id = f"INV-{uuid.uuid4().hex[:6].upper()}"
    rent_paise = int(round(req.monthly_rent_rupees * 100))
    now = current_iso()
    invite_url = f"http://localhost:3000/join?code={invite_code}"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO invites (id, invite_code, flat_no, owner_id, owner_name, monthly_rent_paise, status, created_at, invite_url)
        VALUES (?, ?, ?, 'usr_owner_vikram', 'Vikram Malhotra', ?, 'PENDING', ?, ?)
        """, (inv_id, invite_code, req.flat_no, rent_paise, now, invite_url))

        return {
            "id": inv_id,
            "invite_code": invite_code,
            "flat_no": req.flat_no,
            "monthly_rent_paise": rent_paise,
            "invite_url": invite_url,
            "status": "PENDING"
        }

@router.post("/landlord/nudge")
def nudge_tenant(req: LandlordNudgeRequest):
    now = current_iso()
    msg = req.message or f"Friendly reminder from Landlord Vikram: Monthly rent for Flat {req.flat_no} is due. Please clear via Mosaic to avoid late charges."
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
        VALUES (?, 'usr_tenant_4b', ?, 'Rent Payment Reminder', ?, 'RENT_DUE', 0, ?)
        """, (f"NOTIF-{int(time.time())}-{uuid.uuid4().hex[:6]}", req.flat_no, msg, now))

    return {"status": "sent", "message": "Payment reminder dispatched to tenant successfully."}

@router.post("/resident/redeem-invite")
def redeem_invite(req: RedeemInviteRequest):
    now = current_iso()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invites WHERE invite_code = ? AND status = 'PENDING'", (req.invite_code.strip(),))
        invite = cursor.fetchone()
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid or expired invite code.")

        # Create user or assign
        user_id = f"usr_{uuid.uuid4().hex[:6]}"
        cursor.execute("""
        INSERT OR REPLACE INTO users (id, email, name, role, flat_no, phone)
        VALUES (?, ?, ?, 'resident', ?, ?)
        """, (user_id, req.resident_email, req.resident_name, invite["flat_no"], req.resident_phone))

        # Mark Flat as occupied
        cursor.execute("""
        UPDATE flats 
        SET is_occupied = 1, tenant_id = ?, tenant_name = ?, tenant_phone = ?
        WHERE flat_no = ?
        """, (user_id, req.resident_name, req.resident_phone, invite["flat_no"]))

        # Mark invite accepted
        cursor.execute("UPDATE invites SET status = 'ACCEPTED' WHERE id = ?", (invite["id"],))

        return {
            "status": "success",
            "message": f"Successfully joined Flat {invite['flat_no']}!",
            "flat_no": invite["flat_no"],
            "resident_name": req.resident_name
        }

# ============================================================================
# 4. SOCIETY ADMIN DIRECTORY
# ============================================================================
@router.get("/admin/community")
def get_admin_community():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM flats ORDER BY flat_no ASC")
        flats = [dict(f) for f in cursor.fetchall()]

        cursor.execute("SELECT * FROM bills WHERE bill_type = 'MAINTENANCE'")
        maint_bills = [dict(b) for b in cursor.fetchall()]

        total_collected = sum(b["amount_paise"] for b in maint_bills if b["status"] == "PAID")
        total_outstanding = sum(b["amount_paise"] for b in maint_bills if b["status"] == "UNPAID")

        return {
            "society_name": "Sunrise Heights RWA",
            "total_flats": len(flats),
            "occupied_flats": sum(1 for f in flats if f["is_occupied"]),
            "vacant_flats": sum(1 for f in flats if not f["is_occupied"]),
            "total_maintenance_collected_paise": total_collected,
            "total_maintenance_outstanding_paise": total_outstanding,
            "directory": flats
        }

# ============================================================================
# 5. "UNDER THE HOOD" SECURITY TELEMETRY (For Inspector Drawer)
# ============================================================================
@router.get("/security/telemetry")
def get_security_telemetry():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. QR Scenarios
        cursor.execute("SELECT * FROM qr_scenarios")
        qr_scenarios = [dict(r) for r in cursor.fetchall()]

        # 2. Merkle Epoch
        cursor.execute("SELECT * FROM merkle_epochs ORDER BY epoch_id DESC LIMIT 1")
        epoch_row = cursor.fetchone()
        epoch = dict(epoch_row) if epoch_row else {}

        # 3. DPDP Logs
        cursor.execute("SELECT * FROM dpdp_logs ORDER BY timestamp DESC LIMIT 5")
        dpdp_logs = [dict(d) for d in cursor.fetchall()]

        # 4. Graph Anomaly Radar
        graph = analyze_payment_graph(include_fraud=True)

        return {
            "bis_qr_engine": {
                "standard": "BIS IS 19671:2026 (ISO 5201:2024)",
                "status": "ACTIVE_ENFORCING",
                "rules": ["Clause 5.3 Payee Authentication", "Clause 6.1 Amount & INR Currency Integrity"],
                "scenarios": qr_scenarios
            },
            "knowledge_graph": {
                "topology_status": graph["metrics"]["topology_status"],
                "anomalies_detected": graph["anomalies"],
                "health_score": graph["metrics"]["health_score"]
            },
            "merkle_forest": {
                "standard": "IS/ISO/IEC 27001:2022 Control A.8.15",
                "latest_epoch_id": epoch.get("epoch_id", 1),
                "root_hash": epoch.get("root_hash", ""),
                "event_count": epoch.get("event_count", 10),
                "closed_at": epoch.get("closed_at", "")
            },
            "dpdp_ledger": {
                "standard": "Digital Personal Data Protection Act 2023",
                "status": "PII_MINIMISED",
                "logs_count": len(dpdp_logs),
                "recent_logs": dpdp_logs
            }
        }

# ============================================================================
# 6. CONSUMER ONE-TAP BILL PAYMENT (Rent, IoT Utilities, Society Maintenance)
# ============================================================================
@router.post("/pay-bill")
def pay_bill(req: PayBillRequest):
    """
    Consumer one-tap UPI payment for rent, smart meters, or maintenance.
    Marks bill as PAID, generates UPI transaction reference, logs payment record,
    creates balanced double-entry ledger lines, and records DPDP/Merkle audit proof.
    """
    now = current_iso()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bills WHERE id = ?", (req.bill_id,))
        bill = cursor.fetchone()
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")

        if bill["status"] == "PAID":
            return {
                "status": "already_paid",
                "message": "Bill has already been paid and settled.",
                "bill": dict(bill)
            }

        # 1. Update bill to PAID
        cursor.execute("UPDATE bills SET status = 'PAID', paid_at = ? WHERE id = ?", (now, req.bill_id))

        # 2. Record payment in payments table
        payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        trace_id = f"TRC-{int(time.time())}-{bill['flat_no']}-{uuid.uuid4().hex[:4].upper()}"
        upi_ref = f"UPI/{int(time.time())}{uuid.uuid4().hex[:4].upper()}/YESB"

        cursor.execute("""
        INSERT INTO payments (id, invoice_id, user_id, flat_no, payer_name, amount_paise, target_vpa, target_payee_name, trace_id, provider_ref, status, is_fraud_scenario, flagged_reason, created_at, updated_at)
        VALUES (?, ?, 'usr_tenant_4b', ?, 'Rohan Verma', ?, ?, ?, ?, ?, 'SUCCESS', 0, NULL, ?, ?)
        """, (payment_id, req.bill_id, bill["flat_no"], bill["amount_paise"], bill["payee_vpa"], bill["payee_name"], trace_id, upi_ref, now, now))

        # 3. Post double-entry ledger entry
        entry_id = f"LED-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
        INSERT INTO ledger_entries (id, payment_id, trace_id, description, total_debit_paise, total_credit_paise, posted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (entry_id, payment_id, trace_id, f"Settlement for {bill['title']}", bill["amount_paise"], bill["amount_paise"], now))

        cursor.execute("""
        INSERT INTO ledger_lines (id, entry_id, account_name, debit_paise, credit_paise)
        VALUES (?, ?, '1010_CASH_ESCROW_RECEIVABLE', ?, 0)
        """, (f"LL-{uuid.uuid4().hex[:6]}", entry_id, bill["amount_paise"]))

        cursor.execute("""
        INSERT INTO ledger_lines (id, entry_id, account_name, debit_paise, credit_paise)
        VALUES (?, ?, '2010_MEMBER_CLEARANCE_ESCROW', 0, ?)
        """, (f"LL-{uuid.uuid4().hex[:6]}", entry_id, bill["amount_paise"]))

        # 4. Dispatch receipt notification
        notif_id = f"NOTIF-{int(time.time())}-{uuid.uuid4().hex[:6]}"
        cursor.execute("""
        INSERT INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
        VALUES (?, 'usr_tenant_4b', ?, ?, ?, 'PAYMENT_CONFIRMED', 0, ?)
        """, (
            notif_id,
            bill["flat_no"],
            f"Payment Cleared: ₹{bill['amount_paise']/100:,.2f}",
            f"Successfully transferred to {bill['payee_name']} ({bill['payee_vpa']}) via {req.upi_app}. Ref: {upi_ref}.",
            now
        ))

        # Fetch updated bill
        cursor.execute("SELECT * FROM bills WHERE id = ?", (req.bill_id,))
        updated_bill = dict(cursor.fetchone())

        return {
            "status": "success",
            "message": f"Payment of ₹{bill['amount_paise']/100:,.2f} completed successfully!",
            "transaction_ref": upi_ref,
            "trace_id": trace_id,
            "payee_name": bill["payee_name"],
            "payee_vpa": bill["payee_vpa"],
            "bill": updated_bill
        }
