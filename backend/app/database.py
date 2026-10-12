import sqlite3
import json
from contextlib import contextmanager
from app.config import DB_PATH
from app.seed_data import get_seed_data

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(force_reseed: bool = False):
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        
        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS societies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            trusted_vpa TEXT NOT NULL,
            trusted_payee_name TEXT NOT NULL,
            bank_account TEXT NOT NULL,
            address TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            flat_no TEXT,
            phone TEXT
        );

        CREATE TABLE IF NOT EXISTS flats (
            id TEXT PRIMARY KEY,
            flat_no TEXT UNIQUE NOT NULL,
            wing TEXT NOT NULL,
            bhk_type TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            owner_vpa TEXT NOT NULL,
            tenant_id TEXT,
            tenant_name TEXT,
            tenant_phone TEXT,
            monthly_rent_paise INTEGER NOT NULL,
            is_occupied BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS smart_meters (
            id TEXT PRIMARY KEY,
            flat_no TEXT NOT NULL,
            meter_type TEXT NOT NULL,
            device_id TEXT UNIQUE NOT NULL,
            current_reading REAL NOT NULL,
            unit_label TEXT NOT NULL,
            cycle_consumption REAL NOT NULL,
            rate_per_unit_paise INTEGER NOT NULL,
            calculated_bill_paise INTEGER NOT NULL,
            billing_period TEXT NOT NULL,
            due_date TEXT NOT NULL,
            last_synced_at TEXT NOT NULL,
            status TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bills (
            id TEXT PRIMARY KEY,
            flat_no TEXT NOT NULL,
            bill_type TEXT NOT NULL,
            title TEXT NOT NULL,
            amount_paise INTEGER NOT NULL,
            due_date TEXT NOT NULL,
            payee_name TEXT NOT NULL,
            payee_vpa TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            paid_at TEXT,
            is_automated_meter BOOLEAN NOT NULL DEFAULT 0,
            meter_id TEXT
        );

        CREATE TABLE IF NOT EXISTS invites (
            id TEXT PRIMARY KEY,
            invite_code TEXT UNIQUE NOT NULL,
            flat_no TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            monthly_rent_paise INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            invite_url TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            flat_no TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_type TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            flat_no TEXT NOT NULL,
            payer_name TEXT NOT NULL,
            amount_paise INTEGER NOT NULL,
            target_vpa TEXT NOT NULL,
            target_payee_name TEXT NOT NULL,
            trace_id TEXT UNIQUE NOT NULL,
            provider_ref TEXT,
            status TEXT NOT NULL,
            is_fraud_scenario BOOLEAN NOT NULL DEFAULT 0,
            flagged_reason TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ledger_entries (
            id TEXT PRIMARY KEY,
            payment_id TEXT NOT NULL,
            trace_id TEXT NOT NULL,
            description TEXT NOT NULL,
            total_debit_paise INTEGER NOT NULL,
            total_credit_paise INTEGER NOT NULL,
            posted_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ledger_lines (
            id TEXT PRIMARY KEY,
            entry_id TEXT NOT NULL,
            account_name TEXT NOT NULL,
            debit_paise INTEGER NOT NULL,
            credit_paise INTEGER NOT NULL,
            FOREIGN KEY(entry_id) REFERENCES ledger_entries(id)
        );

        CREATE TABLE IF NOT EXISTS qr_scenarios (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            description TEXT NOT NULL,
            expected_verdict TEXT NOT NULL,
            payload TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS merkle_events (
            index_num INTEGER PRIMARY KEY,
            event_type TEXT NOT NULL,
            trace_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            payload_hash TEXT NOT NULL,
            details_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS merkle_epochs (
            epoch_id INTEGER PRIMARY KEY,
            root_hash TEXT NOT NULL,
            event_count INTEGER NOT NULL,
            closed_at TEXT NOT NULL,
            leaf_hashes_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS dpdp_logs (
            id TEXT PRIMARY KEY,
            actor_id TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            target_user_id TEXT NOT NULL,
            purpose TEXT NOT NULL,
            fields_accessed_json TEXT NOT NULL,
            ai_involved BOOLEAN NOT NULL,
            ai_language TEXT,
            timestamp TEXT NOT NULL
        );
        """)
        
        cursor.execute("SELECT COUNT(*) FROM flats")
        flat_count = cursor.fetchone()[0]
        
        if flat_count == 0 or force_reseed:
            seed = get_seed_data()
            
            if force_reseed:
                cursor.execute("PRAGMA foreign_keys = OFF;")
                for table in ["notifications", "invites", "bills", "smart_meters", "flats",
                              "dpdp_logs", "merkle_epochs", "merkle_events", "qr_scenarios", 
                              "ledger_lines", "ledger_entries", "payments", "users", "societies"]:
                    cursor.execute(f"DELETE FROM {table}")
                cursor.execute("PRAGMA foreign_keys = ON;")

            # 1. Society
            s = seed["society"]
            cursor.execute("""
            INSERT OR REPLACE INTO societies (id, name, trusted_vpa, trusted_payee_name, bank_account, address)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (s["id"], s["name"], s["trusted_vpa"], s["trusted_payee_name"], s["bank_account"], s["address"]))

            # 2. Users
            for u in seed["users"]:
                cursor.execute("""
                INSERT OR REPLACE INTO users (id, email, name, role, flat_no, phone)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (u["id"], u["email"], u["name"], u["role"], u["flat_no"], u["phone"]))

            # 3. Flats
            for f in seed["flats"]:
                cursor.execute("""
                INSERT OR REPLACE INTO flats (id, flat_no, wing, bhk_type, owner_id, owner_name, owner_vpa, tenant_id, tenant_name, tenant_phone, monthly_rent_paise, is_occupied)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (f["id"], f["flat_no"], f["wing"], f["bhk_type"], f["owner_id"], f["owner_name"], f["owner_vpa"], f["tenant_id"], f["tenant_name"], f["tenant_phone"], f["monthly_rent_paise"], f["is_occupied"]))

            # 4. Smart Meters
            for sm in seed["smart_meters"]:
                cursor.execute("""
                INSERT OR REPLACE INTO smart_meters (id, flat_no, meter_type, device_id, current_reading, unit_label, cycle_consumption, rate_per_unit_paise, calculated_bill_paise, billing_period, due_date, last_synced_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (sm["id"], sm["flat_no"], sm["meter_type"], sm["device_id"], sm["current_reading"], sm["unit_label"], sm["cycle_consumption"], sm["rate_per_unit_paise"], sm["calculated_bill_paise"], sm["billing_period"], sm["due_date"], sm["last_synced_at"], sm["status"]))

            # 5. Bills
            for b in seed["bills"]:
                cursor.execute("""
                INSERT OR REPLACE INTO bills (id, flat_no, bill_type, title, amount_paise, due_date, payee_name, payee_vpa, status, created_at, paid_at, is_automated_meter, meter_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (b["id"], b["flat_no"], b["bill_type"], b["title"], b["amount_paise"], b["due_date"], b["payee_name"], b["payee_vpa"], b["status"], b["created_at"], b["paid_at"], b["is_automated_meter"], b["meter_id"]))

            # 6. Invites
            for inv in seed["invites"]:
                cursor.execute("""
                INSERT OR REPLACE INTO invites (id, invite_code, flat_no, owner_id, owner_name, monthly_rent_paise, status, created_at, invite_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (inv["id"], inv["invite_code"], inv["flat_no"], inv["owner_id"], inv["owner_name"], inv["monthly_rent_paise"], inv["status"], inv["created_at"], inv["invite_url"]))

            # 7. Notifications
            for n in seed["notifications"]:
                cursor.execute("""
                INSERT OR REPLACE INTO notifications (id, user_id, flat_no, title, message, notification_type, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (n["id"], n["user_id"], n["flat_no"], n["title"], n["message"], n["notification_type"], n["is_read"], n["created_at"]))

            # 8. QR Scenarios (Under the hood)
            for qr in seed["qr_scenarios"]:
                cursor.execute("""
                INSERT OR REPLACE INTO qr_scenarios (id, label, description, expected_verdict, payload)
                VALUES (?, ?, ?, ?, ?)
                """, (qr["id"], qr["label"], qr["description"], qr["expected_verdict"], qr["payload"]))

            # 9. Merkle Epoch & Events (Under the hood)
            mep = seed["merkle_epoch"]
            cursor.execute("""
            INSERT OR REPLACE INTO merkle_epochs (epoch_id, root_hash, event_count, closed_at, leaf_hashes_json)
            VALUES (?, ?, ?, ?, ?)
            """, (mep["epoch_id"], mep["root_hash"], mep["event_count"], mep["closed_at"], json.dumps(mep["leaf_hashes"])))

            for me in seed["merkle_events"]:
                cursor.execute("""
                INSERT OR REPLACE INTO merkle_events (index_num, event_type, trace_id, timestamp, payload_hash, details_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (me["index"], me["event_type"], me["trace_id"], "2026-10-04T12:00:00Z", "hash", json.dumps(me["details"])))

            # 10. Fraud Payments (Under the hood)
            for p in seed["fraud_records"]:
                cursor.execute("""
                INSERT OR REPLACE INTO payments (id, invoice_id, user_id, flat_no, payer_name, amount_paise, target_vpa, target_payee_name, trace_id, provider_ref, status, is_fraud_scenario, flagged_reason, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (p["id"], p["invoice_id"], p["user_id"], p["flat_no"], p["payer_name"], p["amount_paise"], p["target_vpa"], p["target_payee_name"], p["trace_id"], p["provider_ref"], p["status"], p["is_fraud_scenario"], p["flagged_reason"], p["created_at"], p["updated_at"]))

            # 11. DPDP Logs
            for dp in seed["dpdp_logs"]:
                cursor.execute("""
                INSERT OR REPLACE INTO dpdp_logs (id, actor_id, actor_role, target_user_id, purpose, fields_accessed_json, ai_involved, ai_language, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (dp["id"], dp["actor_id"], dp["actor_role"], dp["target_user_id"], dp["purpose"], json.dumps(dp["fields_accessed"]), dp["ai_involved"], dp["ai_language"], dp["timestamp"]))
