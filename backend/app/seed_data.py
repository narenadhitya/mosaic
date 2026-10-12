import json
from datetime import datetime, timezone
from app.merkle_utils import canonical_event_hash, build_merkle_tree
from app.config import TRUSTED_VPA, TRUSTED_PAYEE_NAME, SOCIETY_ID, SOCIETY_NAME

def get_seed_data():
    now_iso = datetime.now(timezone.utc).isoformat()

    society = {
        "id": SOCIETY_ID,
        "name": "Sunrise Heights Gated Community",
        "trusted_vpa": TRUSTED_VPA,
        "trusted_payee_name": TRUSTED_PAYEE_NAME,
        "bank_account": "50100428912345",
        "address": "Plot 42, Sector 14, Palm Beach Rd, Navi Mumbai, MH 400703"
    }

    # Core Personas:
    # 1. Resident (Tenant): Rohan Verma (Flat 4B)
    # 2. Landlord (Owner): Vikram Malhotra (Owns Flat 4B & Flat 501)
    # 3. Society Admin: R. Sundaram (RWA Secretary)
    users = [
        {"id": "usr_tenant_4b", "email": "rohan.verma@example.com", "name": "Rohan Verma", "role": "resident", "flat_no": "4B", "phone": "+919819000042"},
        {"id": "usr_owner_vikram", "email": "vikram.owner@example.com", "name": "Vikram Malhotra", "role": "landlord", "flat_no": "Multiple", "phone": "+919820112233"},
        {"id": "usr_admin_rwa", "email": "secretary@sunrise.in", "name": "R. Sundaram (RWA Desk)", "role": "admin", "flat_no": "Office", "phone": "+919820011002"},
        # Other society residents for directory
        {"id": "usr_101", "email": "ananya.roy@example.com", "name": "Ananya Roy", "role": "resident", "flat_no": "101", "phone": "+919819000101"},
        {"id": "usr_102", "email": "kavita.nair@example.com", "name": "Kavita Nair", "role": "resident", "flat_no": "102", "phone": "+919819000102"},
        {"id": "usr_201", "email": "rajesh.iyer@example.com", "name": "Rajesh Iyer", "role": "resident", "flat_no": "201", "phone": "+919819000201"},
        {"id": "usr_202", "email": "priya.sharma@example.com", "name": "Priya Sharma", "role": "resident", "flat_no": "202", "phone": "+919819000202"},
        {"id": "usr_301", "email": "farhan.m@example.com", "name": "Mohammed Farhan", "role": "resident", "flat_no": "301", "phone": "+919819000301"},
        {"id": "usr_302", "email": "sunita.d@example.com", "name": "Sunita Deshmukh", "role": "resident", "flat_no": "302", "phone": "+919819000302"},
        {"id": "usr_401", "email": "arjun.mehta@example.com", "name": "Arjun Mehta", "role": "resident", "flat_no": "401", "phone": "+919819000401"},
        {"id": "usr_502", "email": "amit.gupta@example.com", "name": "Amit Gupta", "role": "resident", "flat_no": "502", "phone": "+919819000502"},
        {"id": "usr_601", "email": "deepa.patel@example.com", "name": "Deepa Patel", "role": "resident", "flat_no": "601", "phone": "+919819000601"},
        {"id": "usr_602", "email": "suresh.joshi@example.com", "name": "Suresh Joshi", "role": "resident", "flat_no": "602", "phone": "+919819000602"}
    ]

    # Flats Portfolio:
    # Flat 4B is occupied by Rohan Verma and owned by Vikram Malhotra.
    # Flat 501 is vacant and ready for invite demo.
    flats = [
        {
            "id": "flat_4b",
            "flat_no": "4B",
            "wing": "Wing B",
            "bhk_type": "2 BHK",
            "owner_id": "usr_owner_vikram",
            "owner_name": "Vikram Malhotra",
            "owner_vpa": "vikram.owner@hdfcbank",
            "tenant_id": "usr_tenant_4b",
            "tenant_name": "Rohan Verma",
            "tenant_phone": "+919819000042",
            "monthly_rent_paise": 2500000,
            "is_occupied": True
        },
        {
            "id": "flat_501",
            "flat_no": "501",
            "wing": "Wing A",
            "bhk_type": "2 BHK",
            "owner_id": "usr_owner_vikram",
            "owner_name": "Vikram Malhotra",
            "owner_vpa": "vikram.owner@hdfcbank",
            "tenant_id": None,
            "tenant_name": None,
            "tenant_phone": None,
            "monthly_rent_paise": 2800000,
            "is_occupied": False
        },
        {
            "id": "flat_101",
            "flat_no": "101",
            "wing": "Wing A",
            "bhk_type": "1 BHK",
            "owner_id": "usr_owner_vikram",
            "owner_name": "Vikram Malhotra",
            "owner_vpa": "vikram.owner@hdfcbank",
            "tenant_id": "usr_101",
            "tenant_name": "Ananya Roy",
            "tenant_phone": "+919819000101",
            "monthly_rent_paise": 1800000,
            "is_occupied": True
        },
        {
            "id": "flat_201",
            "flat_no": "201",
            "wing": "Wing B",
            "bhk_type": "2 BHK",
            "owner_id": "usr_owner_vikram",
            "owner_name": "Vikram Malhotra",
            "owner_vpa": "vikram.owner@hdfcbank",
            "tenant_id": "usr_201",
            "tenant_name": "Rajesh Iyer",
            "tenant_phone": "+919819000201",
            "monthly_rent_paise": 2400000,
            "is_occupied": True
        }
    ]

    # Automated IoT Smart Meters for Flat 4B
    smart_meters = [
        {
            "id": "SM-ELEC-4B",
            "flat_no": "4B",
            "meter_type": "ELECTRICITY",
            "device_id": "IOT-PWR-4B-9021",
            "current_reading": 12450.5,
            "unit_label": "kWh",
            "cycle_consumption": 342.0,
            "rate_per_unit_paise": 800, # Rs. 8.00 / kWh
            "calculated_bill_paise": 273600, # Rs. 2,736
            "billing_period": "01 Oct – 31 Oct 2026",
            "due_date": "2026-10-18",
            "last_synced_at": now_iso,
            "status": "SYNCED_LIVE"
        },
        {
            "id": "SM-WATER-4B",
            "flat_no": "4B",
            "meter_type": "WATER",
            "device_id": "IOT-WTR-4B-4108",
            "current_reading": 840.2,
            "unit_label": "kL",
            "cycle_consumption": 14.5,
            "rate_per_unit_paise": 6000, # Rs. 60.00 / kL
            "calculated_bill_paise": 87000, # Rs. 870
            "billing_period": "01 Oct – 31 Oct 2026",
            "due_date": "2026-10-20",
            "last_synced_at": now_iso,
            "status": "SYNCED_LIVE"
        }
    ]

    # Active Bills for Flat 4B (Rent, Electricity, Water, Maintenance)
    bills = [
        {
            "id": "BILL-RENT-4B",
            "flat_no": "4B",
            "bill_type": "RENT",
            "title": "October House Rent (Flat 4B)",
            "amount_paise": 2500000, # Rs. 25,000
            "due_date": "2026-10-16",
            "payee_name": "Vikram Malhotra (Landlord)",
            "payee_vpa": "vikram.owner@hdfcbank",
            "status": "UNPAID",
            "created_at": "2026-10-01T09:00:00Z",
            "paid_at": None,
            "is_automated_meter": False,
            "meter_id": None
        },
        {
            "id": "BILL-ELEC-4B",
            "flat_no": "4B",
            "bill_type": "ELECTRICITY",
            "title": "Smart Meter Electricity (342 kWh)",
            "amount_paise": 273600, # Rs. 2,736
            "due_date": "2026-10-18",
            "payee_name": "State Electricity Discom (Sub-meter)",
            "payee_vpa": "mseb.billing@sbi",
            "status": "UNPAID",
            "created_at": "2026-10-02T10:00:00Z",
            "paid_at": None,
            "is_automated_meter": True,
            "meter_id": "SM-ELEC-4B"
        },
        {
            "id": "BILL-WATER-4B",
            "flat_no": "4B",
            "bill_type": "WATER",
            "title": "Smart Meter Water Charges (14.5 kL)",
            "amount_paise": 87000, # Rs. 870
            "due_date": "2026-10-20",
            "payee_name": "Sunrise Heights RWA",
            "payee_vpa": TRUSTED_VPA,
            "status": "UNPAID",
            "created_at": "2026-10-02T10:00:00Z",
            "paid_at": None,
            "is_automated_meter": True,
            "meter_id": "SM-WATER-4B"
        },
        {
            "id": "BILL-MAINT-4B",
            "flat_no": "4B",
            "bill_type": "MAINTENANCE",
            "title": "Society Maintenance & Security Dues",
            "amount_paise": 350000, # Rs. 3,500
            "due_date": "2026-10-15",
            "payee_name": "Sunrise Heights RWA",
            "payee_vpa": TRUSTED_VPA,
            "status": "UNPAID",
            "created_at": "2026-10-01T09:00:00Z",
            "paid_at": None,
            "is_automated_meter": False,
            "meter_id": None
        },
        # Paid historical bills for Flat 101 for realistic monthly metrics
        {
            "id": "BILL-RENT-101",
            "flat_no": "101",
            "bill_type": "RENT",
            "title": "October House Rent (Flat 101)",
            "amount_paise": 1800000,
            "due_date": "2026-10-05",
            "payee_name": "Vikram Malhotra",
            "payee_vpa": "vikram.owner@hdfcbank",
            "status": "PAID",
            "created_at": "2026-10-01T09:00:00Z",
            "paid_at": "2026-10-04T14:30:00Z",
            "is_automated_meter": False,
            "meter_id": None
        },
        {
            "id": "BILL-MAINT-101",
            "flat_no": "101",
            "bill_type": "MAINTENANCE",
            "title": "Society Maintenance Dues",
            "amount_paise": 350000,
            "due_date": "2026-10-10",
            "payee_name": "Sunrise Heights RWA",
            "payee_vpa": TRUSTED_VPA,
            "status": "PAID",
            "created_at": "2026-10-01T09:00:00Z",
            "paid_at": "2026-10-03T11:20:00Z",
            "is_automated_meter": False,
            "meter_id": None
        }
    ]

    # Active Digital Invites
    invites = [
        {
            "id": "INV-FLAT-501",
            "invite_code": "MOSAIC-FLAT-501",
            "flat_no": "501",
            "owner_id": "usr_owner_vikram",
            "owner_name": "Vikram Malhotra",
            "monthly_rent_paise": 2800000,
            "status": "PENDING",
            "created_at": now_iso,
            "invite_url": "http://localhost:3000/join?code=MOSAIC-FLAT-501"
        }
    ]

    # Proactive Reminders & Notifications for Resident Rohan (Flat 4B)
    notifications = [
        {
            "id": "NOTIF-01",
            "user_id": "usr_tenant_4b",
            "flat_no": "4B",
            "title": "Rent Due in 4 Days",
            "message": "Monthly rent of ₹25,000 for Flat 4B is due on 16th Oct to Vikram Malhotra. Pay on time to maintain your Cred score.",
            "notification_type": "RENT_DUE",
            "is_read": False,
            "created_at": now_iso
        },
        {
            "id": "NOTIF-02",
            "user_id": "usr_tenant_4b",
            "flat_no": "4B",
            "title": "Smart Meter Telemetry Synced",
            "message": "Electricity meter SM-ELEC-4B recorded 342.0 kWh consumed this cycle. Calculated bill: ₹2,736.",
            "notification_type": "METER_SYNC",
            "is_read": False,
            "created_at": now_iso
        },
        {
            "id": "NOTIF-03",
            "user_id": "usr_tenant_4b",
            "flat_no": "4B",
            "title": "Society Maintenance Notice",
            "message": "October maintenance fee of ₹3,500 has been raised by RWA Desk. Due date: 15th Oct.",
            "notification_type": "SOCIETY_NOTICE",
            "is_read": True,
            "created_at": now_iso
        }
    ]

    # Preserved Under-The-Hood Security Data for the Security Shield Drawer:
    # 10 Merkle events, Epoch 1, Seeded fraud payments, QR scenarios, DPDP logs
    events_raw = [
        {"index": 0, "event_type": "RENT_INVOICE_GENERATED", "trace_id": "TRC-893011-101", "details": {"flat_no": "101", "amount_paise": 1800000}},
        {"index": 1, "event_type": "RENT_PAYMENT_INITIATED", "trace_id": "TRC-893011-101", "details": {"payee": "vikram.owner@hdfcbank"}},
        {"index": 2, "event_type": "GATEWAY_CALLBACK_SUCCESS", "trace_id": "TRC-893011-101", "details": {"ref": "UPI/902183/HDFC"}},
        {"index": 3, "event_type": "LEDGER_ENTRY_BALANCED", "trace_id": "TRC-893011-101", "details": {"balanced_paise": 1800000}},
        {"index": 4, "event_type": "METER_CYCLE_LOCKED", "trace_id": "TRC-MTR-4B-01", "details": {"flat_no": "4B", "kwh": 342.0}},
        {"index": 5, "event_type": "MAINTENANCE_INVOICE_POSTED", "trace_id": "TRC-893012-101", "details": {"amount_paise": 350000}},
        {"index": 6, "event_type": "GATEWAY_CALLBACK_SUCCESS", "trace_id": "TRC-893012-101", "details": {"ref": "UPI/902184/HDFC"}},
        {"index": 7, "event_type": "LEDGER_ENTRY_BALANCED", "trace_id": "TRC-893012-101", "details": {"balanced_paise": 350000}},
        {"index": 8, "event_type": "DPDP_CONSENT_AUDIT_LOGGED", "trace_id": "TRC-DPDP-01", "details": {"purpose": "billing_telemetry"}},
        {"index": 9, "event_type": "QR_STANDARD_COMPLIANCE_PASS", "trace_id": "TRC-QR-01", "details": {"clause": "IS 19671: 5.3"}}
    ]

    leaf_hashes = [canonical_event_hash(ev) for ev in events_raw]
    merkle_root, levels = build_merkle_tree(leaf_hashes)

    merkle_epoch = {
        "epoch_id": 1,
        "root_hash": merkle_root,
        "event_count": len(events_raw),
        "closed_at": "2026-10-04T12:05:00Z",
        "leaf_hashes": leaf_hashes
    }

    # 4 QR Scenarios for IS 19671 inspector
    qr_scenarios = [
        {
            "id": "QR-SCENARIO-01",
            "label": "Valid Resident Rent QR (Flat 4B)",
            "description": "Full compliance with BIS IS 19671:2026 Clause 5.3 & 6.1.",
            "expected_verdict": "PASS",
            "payload": "upi://pay?pa=vikram.owner@hdfcbank&pn=Vikram+Malhotra&am=25000.00&cu=INR&tn=Flat+4B+Rent&tr=BILL-RENT-4B"
        },
        {
            "id": "QR-SCENARIO-02",
            "label": "Spoofed Attacker QR (Phishing)",
            "description": "Attacker replaced payee VPA. Violates Clause 5.3 (Payee Authentication).",
            "expected_verdict": "BLOCK_REVIEW",
            "payload": "upi://pay?pa=phishing.landlord@icici&pn=Vikram+Malhotra&am=25000.00&cu=INR&tn=Rent&tr=BILL-RENT-4B"
        },
        {
            "id": "QR-SCENARIO-03",
            "label": "Foreign Currency Foreign QR",
            "description": "QR encodes USD instead of INR. Violates Clause 6.1 (Currency Constraint).",
            "expected_verdict": "BLOCK_REVIEW",
            "payload": "upi://pay?pa=vikram.owner@hdfcbank&pn=Vikram+Malhotra&am=25000.00&cu=USD&tn=Rent&tr=BILL-RENT-4B"
        },
        {
            "id": "QR-SCENARIO-04",
            "label": "Mismatched Amount QR",
            "description": "QR encodes ₹35,000 for ₹25,000 rent. Violates Clause 6.1 (Amount Integrity).",
            "expected_verdict": "BLOCK_REVIEW",
            "payload": "upi://pay?pa=vikram.owner@hdfcbank&pn=Vikram+Malhotra&am=35000.00&cu=INR&tn=Rent&tr=BILL-RENT-4B"
        }
    ]

    # Seeded Fraud Payments for Knowledge Graph Radar
    fraud_records = [
        {"id": "PAY-FRD-201", "invoice_id": "BILL-RENT-4B", "user_id": "usr_tenant_4b", "flat_no": "4B", "payer_name": "Rohan Verma", "amount_paise": 2500000, "target_vpa": "maintenance.sunrise@icici", "target_payee_name": "Sunrise Ops", "trace_id": "TRC-FRD-201", "provider_ref": "UPI/99901/ICICI", "status": "FAILED", "is_fraud_scenario": True, "flagged_reason": "VPA_DEGREE_ANOMALY: Untrusted payee detected across multiple payers.", "created_at": "2026-10-05T14:10:00Z", "updated_at": "2026-10-05T14:10:05Z"},
        {"id": "PAY-FRD-202", "invoice_id": "BILL-RENT-4B", "user_id": "usr_201", "flat_no": "201", "payer_name": "Rajesh Iyer", "amount_paise": 2400000, "target_vpa": "maintenance.sunrise@icici", "target_payee_name": "Sunrise Ops", "trace_id": "TRC-FRD-202", "provider_ref": "UPI/99902/ICICI", "status": "FAILED", "is_fraud_scenario": True, "flagged_reason": "VPA_DEGREE_ANOMALY: Untrusted payee detected across multiple payers.", "created_at": "2026-10-05T14:15:00Z", "updated_at": "2026-10-05T14:15:05Z"},
        {"id": "PAY-FRD-301", "invoice_id": "BILL-RENT-4B", "user_id": "usr_301", "flat_no": "301", "payer_name": "Mohammed Farhan", "amount_paise": 2500000, "target_vpa": "maintenance.sunrise@icici", "target_payee_name": "Sunrise Ops", "trace_id": "TRC-FRD-301", "provider_ref": "UPI/99903/ICICI", "status": "FAILED", "is_fraud_scenario": True, "flagged_reason": "VPA_DEGREE_ANOMALY: Untrusted payee detected across multiple payers.", "created_at": "2026-10-05T14:20:00Z", "updated_at": "2026-10-05T14:20:05Z"}
    ]

    dpdp_logs = [
        {
            "id": "DPDP-001",
            "actor_id": "usr_admin_rwa",
            "actor_role": "admin",
            "target_user_id": "usr_tenant_4b",
            "purpose": "utility_telemetry_sync",
            "fields_accessed": ["flat_no", "cycle_consumption", "bill_amount_paise"],
            "ai_involved": False,
            "ai_language": None,
            "timestamp": now_iso
        }
    ]

    return {
        "society": society,
        "users": users,
        "flats": flats,
        "smart_meters": smart_meters,
        "bills": bills,
        "invites": invites,
        "notifications": notifications,
        "merkle_events": events_raw,
        "merkle_epoch": merkle_epoch,
        "qr_scenarios": qr_scenarios,
        "fraud_records": fraud_records,
        "dpdp_logs": dpdp_logs
    }
