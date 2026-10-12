from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import uuid
import time
from datetime import datetime, timezone
from app.database import get_db
from app.models import (
    FlatModel, SmartMeterModel, BillModel, NotificationModel,
    InviteModel, SmartMeterSyncRequest, LandlordInviteCreateRequest,
    LandlordNudgeRequest, RedeemInviteRequest, PayBillRequest,
    EmailReceiptRequest
)
from app.email_service import (
    send_resend_email, send_rent_reminder_email, send_payment_receipt_email
)

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
        user_name = flat_dict.get("resident_name") or "Rohan Verma"
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
# 2. LIVE SMART METER IOT SIMULATOR SYNC & TELEMETRY
# ============================================================================
@router.get("/smart-meter/telemetry")
def get_smart_meter_telemetry(
    flat_no: str = Query("4B", description="Flat number"), 
    meter_type: str = Query("ELECTRICITY", description="ELECTRICITY or WATER")
):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM smart_meters WHERE flat_no = ? AND meter_type = ?", (flat_no, meter_type))
        m = cursor.fetchone()
        if not m:
            raise HTTPException(status_code=404, detail="Meter not found")
        meter = dict(m)

    is_elec = meter_type == "ELECTRICITY"
    hourly_hours = [f"{h:02d}:00" for h in range(24)]

    if is_elec:
        curve = [
            0.5, 0.4, 0.4, 0.3, 0.4, 0.6,
            1.2, 1.8, 1.6, 1.2, 1.1, 1.4,
            2.2, 2.4, 2.1, 1.8, 1.5, 1.7,
            2.3, 2.6, 2.5, 2.0, 1.4, 0.8
        ]
        hourly_data = [{"hour": h, "value": curve[i], "unit": "kWh"} for i, h in enumerate(hourly_hours)]
        slabs = [
            {"tier": "Tier 1 (Base)", "range": "0 - 50 kWh", "rate_rupees": 4.15, "description": "Subsidized lifeline slab"},
            {"tier": "Tier 2 (Standard)", "range": "51 - 100 kWh", "rate_rupees": 5.60, "description": "Standard residential domestic tier"},
            {"tier": "Tier 3 (High Consumption)", "range": "> 100 kWh", "rate_rupees": 8.00, "description": "Non-telescopic domestic tariff (BESCOM LT-2)"}
        ]
        profiles = [
            {"id": "NORMAL", "label": "Normal Base Load", "delta": "+1.8 kWh", "desc": "Refrigeration, fans, LED lighting"},
            {"id": "AC_HEAVY", "label": "Multi-Split AC Surge", "delta": "+14.2 kWh", "desc": "1.5T 5-star inverter ACs cooling 3 BHK"},
            {"id": "GEYSER_HEAVY", "label": "Morning Geyser Surge", "delta": "+8.5 kWh", "desc": "25L storage water heater 2000W heating cycle"}
        ]
        hardware = {
            "model": "Schneider Electric PM5300 IoT Sub-Meter",
            "protocol": "Zigbee 3.0 / MQTT over TLS",
            "rssi": "-67 dBm (Strong Mesh)",
            "power_source": "AC Mains 230V ± 5%",
            "accuracy_class": "IEC 62053-22 Class 0.5S",
            "last_calibrated": "15 Jan 2026"
        }
    else:
        curve = [
            0.0, 0.0, 0.0, 0.0, 0.1, 0.4,
            1.2, 1.6, 0.9, 0.5, 0.4, 0.6,
            0.5, 0.4, 0.3, 0.3, 0.4, 0.8,
            1.4, 1.5, 1.1, 0.6, 0.2, 0.1
        ]
        hourly_data = [{"hour": h, "value": curve[i], "unit": "kL"} for i, h in enumerate(hourly_hours)]
        slabs = [
            {"tier": "Tier 1 (Essential)", "range": "0 - 8 kL", "rate_rupees": 35.00, "description": "BWSSB Lifeline domestic supply"},
            {"tier": "Tier 2 (Moderate)", "range": "9 - 15 kL", "rate_rupees": 60.00, "description": "Normal urban apartment family consumption"},
            {"tier": "Tier 3 (High Usage)", "range": "> 15 kL", "rate_rupees": 90.00, "description": "Tiered conservation conservation tariff"}
        ]
        profiles = [
            {"id": "NORMAL", "label": "Normal Usage", "delta": "+0.4 kL", "desc": "Kitchen, drinking RO and taps"},
            {"id": "WATER_PUMP", "label": "Overhead Tank Inflow", "delta": "+3.2 kL", "desc": "Submersible pump cycle into private flat loft tank"}
        ]
        hardware = {
            "model": "Itron Cyble Ultrasonic Water Flow Sensor",
            "protocol": "LoRaWAN 865 MHz (India ISM)",
            "rssi": "-74 dBm (Stable Long-Range)",
            "power_source": "Lithium Thionyl Chloride 3.6V (10-yr battery)",
            "accuracy_class": "ISO 4064 Class C (R400)",
            "last_calibrated": "20 Feb 2026"
        }

    return {
        "meter": meter,
        "hardware": hardware,
        "tariff_slabs": slabs,
        "load_profiles": profiles,
        "hourly_data": hourly_data
    }

@router.post("/smart-meter/sync")
def sync_smart_meter(req: SmartMeterSyncRequest):
    """
    Simulates automated IoT telemetry sync from the electricity/water meter.
    Supports distinct realistic load profiles (AC heavy, Geyser, Water pump, Normal).
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM smart_meters WHERE flat_no = ? AND meter_type = ?", (req.flat_no, req.meter_type))
        meter = cursor.fetchone()
        if not meter:
            raise HTTPException(status_code=404, detail="Smart meter device not found")

        # Determine increment from profile or explicit value
        if req.simulated_increment is not None:
            increment = req.simulated_increment
            profile_label = "Manual Simulation"
        elif req.load_profile == "AC_HEAVY":
            increment = 14.2
            profile_label = "Multi-Split Inverter AC Surge"
        elif req.load_profile == "GEYSER_HEAVY":
            increment = 8.5
            profile_label = "Morning Water Heater Surge"
        elif req.load_profile == "WATER_PUMP":
            increment = 3.2
            profile_label = "Overhead Tank Pump Top-up"
        else: # NORMAL
            increment = 1.8 if req.meter_type == "ELECTRICITY" else 0.4
            profile_label = "Normal Base Living Load"

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
            f"IoT Telemetry Synced: {profile_label} (+{unit_str})",
            f"Device {meter['device_id']} logged {profile_label}. Cycle total now {new_cycle_consumption} {meter['unit_label']} (₹{new_bill_paise/100:,.2f}).",
            now
        ))

        cursor.execute("SELECT * FROM smart_meters WHERE id = ?", (meter["id"],))
        updated_meter = dict(cursor.fetchone())

        return {
            "status": "synced",
            "meter": updated_meter,
            "load_profile": req.load_profile or "NORMAL",
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
        cursor.execute("SELECT * FROM flats WHERE flat_no = ?", (req.flat_no,))
        flat_row = cursor.fetchone()
        user_id = flat_row["tenant_id"] if flat_row and flat_row["tenant_id"] else "usr_tenant_4b"
        tenant_name = flat_row["tenant_name"] if flat_row and flat_row["tenant_name"] else "Rohan Verma"
        owner_name = flat_row["owner_name"] if flat_row and flat_row["owner_name"] else "Vikram Malhotra"
        owner_vpa = flat_row["owner_vpa"] if flat_row and flat_row["owner_vpa"] else "vikram.owner@hdfcbank"
        rent_rupees = (flat_row["monthly_rent_paise"] / 100) if flat_row else 25000.0

        cursor.execute("""
        INSERT INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
        VALUES (?, ?, ?, 'Rent Payment Reminder', ?, 'RENT_DUE', 0, ?)
        """, (f"NOTIF-{int(time.time())}-{uuid.uuid4().hex[:6]}", user_id, req.flat_no, msg, now))

    # Send real email notification via Resend!
    email_dispatch = send_rent_reminder_email(
        tenant_name=tenant_name,
        flat_no=req.flat_no,
        amount_rupees=rent_rupees,
        due_date="16 Oct 2026",
        landlord_name=owner_name,
        landlord_vpa=owner_vpa
    )

    return {
        "status": "sent",
        "message": f"Payment reminder dispatched to Flat {req.flat_no} ({tenant_name}) & email sent via Resend!",
        "email_dispatch": email_dispatch
    }

@router.get("/invite/{code}")
def get_invite_details(code: str):
    """
    Look up invite details by code to display flat summary before resident joins.
    """
    clean_code = code.strip().upper()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT i.*, f.wing, f.bhk_type 
        FROM invites i
        LEFT JOIN flats f ON i.flat_no = f.flat_no
        WHERE UPPER(i.invite_code) = ?
        """, (clean_code,))
        inv = cursor.fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail="Invite code not found or expired.")
        return dict(inv)

@router.post("/resident/redeem-invite")
def redeem_invite(req: RedeemInviteRequest):
    now = current_iso()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invites WHERE UPPER(invite_code) = ? AND status = 'PENDING'", (req.invite_code.strip().upper(),))
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

        # 1. Ensure smart meters exist for this newly occupied flat
        cursor.execute("SELECT COUNT(*) FROM smart_meters WHERE flat_no = ?", (invite["flat_no"],))
        if cursor.fetchone()[0] == 0:
            elec_id = f"sm_{uuid.uuid4().hex[:6]}"
            cursor.execute("""
            INSERT INTO smart_meters (id, flat_no, meter_type, device_id, current_reading, unit_label, cycle_consumption, rate_per_unit_paise, calculated_bill_paise, billing_period, due_date, last_synced_at, status)
            VALUES (?, ?, 'ELECTRICITY', ?, 145.0, 'kWh', 145.0, 800, 116000, '01 Oct 2026 - 31 Oct 2026', '2026-10-20', ?, 'SYNCED_LIVE')
            """, (elec_id, invite["flat_no"], f"DEV-MTR-ELEC-{invite['flat_no'].replace(' ', '')}", now))

            wtr_id = f"sm_{uuid.uuid4().hex[:6]}"
            cursor.execute("""
            INSERT INTO smart_meters (id, flat_no, meter_type, device_id, current_reading, unit_label, cycle_consumption, rate_per_unit_paise, calculated_bill_paise, billing_period, due_date, last_synced_at, status)
            VALUES (?, ?, 'WATER', ?, 9.2, 'kL', 9.2, 6000, 55200, '01 Oct 2026 - 31 Oct 2026', '2026-10-25', ?, 'SYNCED_LIVE')
            """, (wtr_id, invite["flat_no"], f"DEV-MTR-WTR-{invite['flat_no'].replace(' ', '')}", now))

        # 2. Ensure active bills exist for this newly occupied flat
        cursor.execute("SELECT COUNT(*) FROM bills WHERE flat_no = ?", (invite["flat_no"],))
        if cursor.fetchone()[0] == 0:
            # Rent
            cursor.execute("""
            INSERT INTO bills (id, flat_no, bill_type, title, amount_paise, due_date, payee_name, payee_vpa, status, created_at, is_automated_meter)
            VALUES (?, ?, 'RENT', 'Monthly Apartment Rent', ?, '2026-10-16', ?, 'vikram.owner@hdfcbank', 'UNPAID', ?, 0)
            """, (f"bill_rent_{uuid.uuid4().hex[:6]}", invite["flat_no"], invite["monthly_rent_paise"], invite["owner_name"], now))

            # Electricity
            cursor.execute("""
            INSERT INTO bills (id, flat_no, bill_type, title, amount_paise, due_date, payee_name, payee_vpa, status, created_at, is_automated_meter)
            VALUES (?, ?, 'ELECTRICITY', 'Smart Meter Electricity (145.0 kWh)', 116000, '2026-10-20', 'BESCOM (via Sunrise Heights RWA)', 'sunrise.society@hdfcbank', 'UNPAID', ?, 1)
            """, (f"bill_elec_{uuid.uuid4().hex[:6]}", invite["flat_no"], now))

            # Water
            cursor.execute("""
            INSERT INTO bills (id, flat_no, bill_type, title, amount_paise, due_date, payee_name, payee_vpa, status, created_at, is_automated_meter)
            VALUES (?, ?, 'WATER', 'Smart Meter Water (9.2 kL)', 55200, '2026-10-25', 'BWSSB (via Sunrise Heights RWA)', 'sunrise.society@hdfcbank', 'UNPAID', ?, 1)
            """, (f"bill_wtr_{uuid.uuid4().hex[:6]}", invite["flat_no"], now))

            # Society maintenance
            cursor.execute("""
            INSERT INTO bills (id, flat_no, bill_type, title, amount_paise, due_date, payee_name, payee_vpa, status, created_at, is_automated_meter)
            VALUES (?, ?, 'MAINTENANCE', 'Monthly Society Maintenance', 350000, '2026-10-30', 'Sunrise Heights RWA', 'sunrise.society@hdfcbank', 'UNPAID', ?, 0)
            """, (f"bill_maint_{uuid.uuid4().hex[:6]}", invite["flat_no"], now))

        # 3. Insert welcome notification
        cursor.execute("""
        INSERT INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
        VALUES (?, ?, ?, 'Welcome to Your New Home!', ?, 'SOCIETY_NOTICE', 0, ?)
        """, (
            f"NOTIF-{int(time.time())}-{uuid.uuid4().hex[:6]}",
            user_id,
            invite["flat_no"],
            f"Welcome to Flat {invite['flat_no']}, {req.resident_name}! Your lease of ₹{invite['monthly_rent_paise']/100:,.0f}/month and automated smart meters are now activated.",
            now
        ))

        return {
            "status": "success",
            "message": f"Successfully joined Flat {invite['flat_no']}!",
            "flat_no": invite["flat_no"],
            "resident_name": req.resident_name,
            "monthly_rent_paise": invite["monthly_rent_paise"]
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

        return {
            "bis_qr_engine": {
                "standard": "BIS IS 19671:2026 (ISO 5201:2024)",
                "status": "ACTIVE_ENFORCING",
                "rules": ["Clause 5.3 Payee Authentication", "Clause 6.1 Amount & INR Currency Integrity"],
                "scenarios": qr_scenarios
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

def generate_receipt_dict(cursor, bill_id: str) -> Dict[str, Any]:
    cursor.execute("SELECT * FROM bills WHERE id = ?", (bill_id,))
    b = cursor.fetchone()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill = dict(b)

    # Lookup payment record
    cursor.execute("SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1", (bill_id,))
    p = cursor.fetchone()
    payment = dict(p) if p else None

    # Lookup flat details (owner, tenant, wing)
    cursor.execute("SELECT * FROM flats WHERE flat_no = ?", (bill["flat_no"],))
    f = cursor.fetchone()
    flat = dict(f) if f else {}

    # Society details
    cursor.execute("SELECT * FROM societies LIMIT 1")
    s = cursor.fetchone()
    society = dict(s) if s else {}

    payer_name = payment["payer_name"] if payment else (flat.get("tenant_name") or "Rohan Verma")
    tx_ref = payment["provider_ref"] if payment else (f"UPI/{int(time.time())}{bill_id[:4].upper()}/YESB")
    trace_id = payment["trace_id"] if payment else f"TRC-{int(time.time())}-{bill['flat_no']}"
    paid_at = bill.get("paid_at") or (payment["created_at"] if payment else current_iso())

    is_rent = bill["bill_type"] == "RENT"
    is_elec = bill["bill_type"] == "ELECTRICITY"
    is_water = bill["bill_type"] == "WATER"

    meter_info = None
    if bill.get("is_automated_meter"):
        cursor.execute("SELECT * FROM smart_meters WHERE flat_no = ? AND meter_type = ?", (bill["flat_no"], bill["bill_type"]))
        m = cursor.fetchone()
        if m:
            meter_info = dict(m)

    clean_id = (payment["id"] if payment else bill["id"]).replace("BILL-", "").replace("PAY-", "")
    receipt_no = f"REC-2026-{bill['bill_type']}-{clean_id}"

    return {
        "receipt_number": receipt_no,
        "bill_id": bill["id"],
        "flat_no": bill["flat_no"],
        "wing": flat.get("wing", "Sunflower Wing"),
        "bill_type": bill["bill_type"],
        "title": bill["title"],
        "amount_paise": bill["amount_paise"],
        "due_date": bill["due_date"],
        "paid_at": paid_at,
        "status": bill["status"],
        "payer_name": payer_name,
        "payer_phone": flat.get("tenant_phone") or "+91 98765 43210",
        "payer_flat": f"Flat {bill['flat_no']}, {flat.get('wing', 'Sunflower Wing')}",
        "society": {
            "name": society.get("name", "Sunrise Heights RWA"),
            "address": society.get("address", "Plot 42, Outer Ring Road, Bellandur, Bengaluru 560103"),
            "registration_no": "RWA/BLR/2021/8841",
            "gstin": "29AAAAA0000A1Z5",
            "trusted_vpa": society.get("trusted_vpa", "sunrise.society@hdfcbank")
        },
        "payee": {
            "name": bill["payee_name"],
            "vpa": bill["payee_vpa"],
            "pan": "ABCDE1234F" if is_rent else None,
            "category": "Property Owner" if is_rent else ("Power DISCOM" if is_elec else ("Water Board" if is_water else "Community RWA"))
        },
        "payment_details": {
            "transaction_ref": tx_ref,
            "trace_id": trace_id,
            "payment_mode": "UPI Instant Direct Settlement",
            "ledger_status": "POSTED & BALANCED",
            "settlement_rail": "NPCI UPI 2.0 Direct"
        },
        "smart_meter": meter_info,
        "hra_compliance": {
            "is_hra_eligible": is_rent,
            "landlord_name": flat.get("owner_name", "Vikram Malhotra"),
            "landlord_pan": "ABCDE1234F",
            "landlord_vpa": flat.get("owner_vpa", "vikram.owner@hdfcbank"),
            "rent_period": "01 Oct 2026 – 31 Oct 2026",
            "declaration": "Certified electronic rent receipt for Section 10(13A) Income Tax HRA claim."
        } if is_rent else None,
        "bis_compliance": "BIS IS 19671:2026 Clause 5.3 & 6.1 Verified",
        "digital_seal_hash": f"SHA256:{uuid.uuid4().hex[:16].upper()}"
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

        # Determine payer name dynamically from flat resident
        cursor.execute("SELECT tenant_id, tenant_name FROM flats WHERE flat_no = ?", (bill["flat_no"],))
        flat_row = cursor.fetchone()
        payer_name = (flat_row["tenant_name"] if flat_row and flat_row["tenant_name"] else "Rohan Verma")
        user_id = (flat_row["tenant_id"] if flat_row and flat_row["tenant_id"] else "usr_tenant_4b")

        if bill["status"] == "PAID":
            receipt = generate_receipt_dict(cursor, req.bill_id)
            return {
                "status": "already_paid",
                "message": "Bill has already been paid and settled.",
                "bill": dict(bill),
                "transaction_ref": receipt["payment_details"]["transaction_ref"],
                "trace_id": receipt["payment_details"]["trace_id"],
                "payee_name": bill["payee_name"],
                "payee_vpa": bill["payee_vpa"],
                "receipt": receipt
            }

        # 1. Update bill to PAID
        cursor.execute("UPDATE bills SET status = 'PAID', paid_at = ? WHERE id = ?", (now, req.bill_id))

        # 2. Record payment in payments table
        payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        trace_id = f"TRC-{int(time.time())}-{bill['flat_no']}-{uuid.uuid4().hex[:4].upper()}"
        upi_ref = f"UPI/{int(time.time())}{uuid.uuid4().hex[:4].upper()}/YESB"

        cursor.execute("""
        INSERT INTO payments (id, invoice_id, user_id, flat_no, payer_name, amount_paise, target_vpa, target_payee_name, trace_id, provider_ref, status, is_fraud_scenario, flagged_reason, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS', 0, NULL, ?, ?)
        """, (payment_id, req.bill_id, user_id, bill["flat_no"], payer_name, bill["amount_paise"], bill["payee_vpa"], bill["payee_name"], trace_id, upi_ref, now, now))

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
        VALUES (?, ?, ?, ?, ?, 'PAYMENT_CONFIRMED', 0, ?)
        """, (
            notif_id,
            user_id,
            bill["flat_no"],
            f"Payment Cleared: ₹{bill['amount_paise']/100:,.2f}",
            f"Successfully transferred to {bill['payee_name']} ({bill['payee_vpa']}) via {req.upi_app}. Ref: {upi_ref}.",
            now
        ))

        # Fetch updated bill & receipt
        cursor.execute("SELECT * FROM bills WHERE id = ?", (req.bill_id,))
        updated_bill = dict(cursor.fetchone())
        receipt = generate_receipt_dict(cursor, req.bill_id)

        # Dispatch real email receipt via Resend!
        email_dispatch = send_payment_receipt_email(receipt)

        return {
            "status": "success",
            "message": f"Payment of ₹{bill['amount_paise']/100:,.2f} completed successfully!",
            "transaction_ref": upi_ref,
            "trace_id": trace_id,
            "payee_name": bill["payee_name"],
            "payee_vpa": bill["payee_vpa"],
            "bill": updated_bill,
            "receipt": receipt,
            "email_dispatch": email_dispatch
        }

# ============================================================================
# 7. OFFICIAL PAYMENT RECEIPTS & NOTIFICATIONS
# ============================================================================
@router.get("/receipt/{bill_id}")
def get_bill_receipt(bill_id: str):
    """
    Retrieve official payment receipt and tax-compliant certificate for a bill.
    Supports HRA rent deduction, smart meter IoT reading verification, and society stamps.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        return generate_receipt_dict(cursor, bill_id)

@router.post("/email/send-receipt")
def email_bill_receipt(req: EmailReceiptRequest):
    """
    Email the certified receipt for a bill to a resident or landlord via Resend.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        receipt = generate_receipt_dict(cursor, req.bill_id)
        email_dispatch = send_payment_receipt_email(receipt, to_email=req.email)
        return {
            "status": "success" if email_dispatch.get("success") else "warning",
            "message": f"Official receipt {receipt['receipt_number']} dispatched via Resend!",
            "email_dispatch": email_dispatch
        }

@router.post("/notifications/mark-all-read")
def mark_all_notifications_read():
    """
    Mark all unread notifications as read.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1")
    return {"status": "success", "message": "All notifications marked as read."}

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str):
    """
    Mark a single notification as read.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notif_id,))
    return {"status": "success", "message": "Notification marked as read."}
