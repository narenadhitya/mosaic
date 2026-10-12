import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.database import get_db
from app.config import TRUSTED_VPA, TRUSTED_PAYEE_NAME, SOCIETY_ID

class FinancialEngineError(Exception):
    pass

class UnbalancedLedgerError(FinancialEngineError):
    pass

class InvalidStateTransitionError(FinancialEngineError):
    pass

def current_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def generate_trace_id(flat_no: str) -> str:
    ts = int(time.time())
    short_uuid = uuid.uuid4().hex[:6].upper()
    clean_flat = flat_no.replace(" ", "").upper()
    return f"TRC-{ts}-{clean_flat}-{short_uuid}"

def create_invoice(user_id: str, flat_no: str, resident_name: str, month: str, amount_rupees: float, due_date: str) -> Dict[str, Any]:
    amount_paise = int(round(amount_rupees * 100))
    inv_id = f"INV-{datetime.now().year}-{flat_no.replace(' ', '')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = current_iso()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO invoices (id, society_id, user_id, flat_no, resident_name, month, amount_paise, due_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', ?)
        """, (inv_id, SOCIETY_ID, user_id, flat_no, resident_name, month, amount_paise, due_date, created_at))
        
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (inv_id,))
        return dict(cursor.fetchone())

def initiate_payment(invoice_id: str, target_vpa: Optional[str] = None) -> Dict[str, Any]:
    """
    Carefully initiates a payment:
    1. Validates invoice is payable (UNPAID).
    2. Idempotency: checks no existing active PENDING payment exists.
    3. Generates unique trace ID.
    4. Creates payment in 'CREATED' and advances to 'PENDING'.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        inv = cursor.fetchone()
        if not inv:
            raise FinancialEngineError(f"Invoice '{invoice_id}' does not exist.")
            
        if inv["status"] == "PAID":
            raise FinancialEngineError(f"Invoice '{invoice_id}' is already paid.")
            
        # Check active pending payment (idempotency)
        cursor.execute("SELECT * FROM payments WHERE invoice_id = ? AND status = 'PENDING'", (invoice_id,))
        existing_pending = cursor.fetchone()
        if existing_pending:
            return {
                "payment": dict(existing_pending),
                "is_resumed": True,
                "message": "Existing pending payment session resumed."
            }
            
        payment_id = f"PAY-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
        trace_id = generate_trace_id(inv["flat_no"])
        vpa = target_vpa if target_vpa else TRUSTED_VPA
        payee_name = TRUSTED_PAYEE_NAME if vpa == TRUSTED_VPA else "External Payee"
        created_at = current_iso()
        
        # Step 1: Create in 'CREATED'
        cursor.execute("""
        INSERT INTO payments (id, invoice_id, user_id, flat_no, payer_name, amount_paise, target_vpa, target_payee_name, trace_id, status, is_fraud_scenario, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', 0, ?, ?)
        """, (payment_id, invoice_id, inv["user_id"], inv["flat_no"], inv["resident_name"], inv["amount_paise"], vpa, payee_name, trace_id, created_at, created_at))
        
        # Step 2: Strict state progression: CREATED -> PENDING
        cursor.execute("""
        UPDATE payments SET status = 'PENDING', updated_at = ? WHERE id = ?
        """, (current_iso(), payment_id))
        
        cursor.execute("SELECT * FROM payments WHERE id = ?", (payment_id,))
        payment = dict(cursor.fetchone())
        
        return {
            "payment": payment,
            "is_resumed": False,
            "message": "Payment initiated and transitioned to PENDING state."
        }

def post_double_entry_ledger(cursor, payment_id: str, trace_id: str, amount_paise: int, flat_no: str) -> Dict[str, Any]:
    """
    Deterministic balanced accounting rule:
    Total Debits MUST EXACTLY equal Total Credits to the last paise.
    Unbalanced entries are immediately rejected.
    """
    entry_id = f"LED-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
    desc = f"Maintenance collection for Flat {flat_no} via UPI [Trace: {trace_id}]"
    posted_at = current_iso()
    
    # Define ledger lines:
    # Debit Bank (+Asset)
    # Credit Revenue (+Income)
    lines = [
        {
            "id": f"LNL-{entry_id}-1",
            "account_name": "Bank: HDFC Operating (50100428912345)",
            "debit_paise": amount_paise,
            "credit_paise": 0
        },
        {
            "id": f"LNL-{entry_id}-2",
            "account_name": "Revenue: Society Maintenance Collections",
            "debit_paise": 0,
            "credit_paise": amount_paise
        }
    ]
    
    total_debit = sum(l["debit_paise"] for l in lines)
    total_credit = sum(l["credit_paise"] for l in lines)
    
    if total_debit != total_credit:
        raise UnbalancedLedgerError(f"Unbalanced entry! Debits ({total_debit} paise) != Credits ({total_credit} paise)")
        
    cursor.execute("""
    INSERT INTO ledger_entries (id, payment_id, trace_id, description, total_debit_paise, total_credit_paise, posted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (entry_id, payment_id, trace_id, desc, total_debit, total_credit, posted_at))
    
    for l in lines:
        cursor.execute("""
        INSERT INTO ledger_lines (id, entry_id, account_name, debit_paise, credit_paise)
        VALUES (?, ?, ?, ?, ?)
        """, (l["id"], entry_id, l["account_name"], l["debit_paise"], l["credit_paise"]))
        
    return {
        "entry_id": entry_id,
        "total_debit_paise": total_debit,
        "total_credit_paise": total_credit,
        "posted_at": posted_at,
        "lines": lines
    }

def process_gateway_callback(payment_id: str, status: str, provider_ref: str, callback_amount_paise: int) -> Dict[str, Any]:
    """
    Handles payment provider callback:
    - Verifies valid state transition: PENDING -> SUCCESS or FAILED.
    - Idempotency check: duplicate callback for already posted payment is ignored without double-posting.
    - Amount verification: callback amount must match payment record.
    - On SUCCESS: posts balanced ledger and marks invoice PAID.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM payments WHERE id = ?", (payment_id,))
        p = cursor.fetchone()
        if not p:
            raise FinancialEngineError(f"Payment '{payment_id}' not found.")
            
        current_status = p["status"]
        
        # Idempotency / Duplicate Callback Guard
        if current_status == "SUCCESS":
            return {
                "action": "IGNORED_DUPLICATE",
                "payment_id": payment_id,
                "current_status": "SUCCESS",
                "message": "Duplicate callback received for already posted payment. Double-posting prevented."
            }
            
        # Enforce strict sequence: only PENDING can transition
        if current_status != "PENDING":
            raise InvalidStateTransitionError(f"Cannot transition payment from '{current_status}' to '{status}'. Must be in PENDING.")

        now = current_iso()
        
        # Amount Mismatch Guard
        if callback_amount_paise != p["amount_paise"]:
            flag_msg = f"AMOUNT_MISMATCH: Expected {p['amount_paise']} paise, callback contained {callback_amount_paise} paise."
            cursor.execute("""
            UPDATE payments 
            SET status = 'FAILED', provider_ref = ?, flagged_reason = ?, updated_at = ?
            WHERE id = ?
            """, (provider_ref, flag_msg, now, payment_id))
            return {
                "action": "PAYMENT_FAILED",
                "payment_id": payment_id,
                "status": "FAILED",
                "reason": flag_msg
            }
            
        if status == "SUCCESS":
            # 1. Update Payment to SUCCESS
            cursor.execute("""
            UPDATE payments 
            SET status = 'SUCCESS', provider_ref = ?, updated_at = ?
            WHERE id = ?
            """, (provider_ref, now, payment_id))
            
            # 2. Post balanced double-entry ledger
            ledger_info = post_double_entry_ledger(
                cursor=cursor,
                payment_id=payment_id,
                trace_id=p["trace_id"],
                amount_paise=p["amount_paise"],
                flat_no=p["flat_no"]
            )
            
            # 3. Mark Invoice as PAID
            cursor.execute("""
            UPDATE invoices SET status = 'PAID' WHERE id = ?
            """, (p["invoice_id"],))
            
            return {
                "action": "PAYMENT_POSTED",
                "payment_id": payment_id,
                "status": "SUCCESS",
                "provider_ref": provider_ref,
                "ledger_entry": ledger_info,
                "invoice_id": p["invoice_id"]
            }
            
        else: # FAILURE
            cursor.execute("""
            UPDATE payments 
            SET status = 'FAILED', provider_ref = ?, flagged_reason = 'Gateway transaction declined', updated_at = ?
            WHERE id = ?
            """, (provider_ref, now, payment_id))
            
            return {
                "action": "PAYMENT_FAILED",
                "payment_id": payment_id,
                "status": "FAILED",
                "reason": "Gateway transaction declined"
            }

def run_simulator(payment_id: str, scenario: str, override_amount_paise: Optional[int] = None) -> Dict[str, Any]:
    """
    Simulator engine for testing all deterministic gateway outcomes on demand.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE id = ?", (payment_id,))
        p = cursor.fetchone()
        if not p:
            raise FinancialEngineError(f"Payment '{payment_id}' not found.")
            
    amt = override_amount_paise if override_amount_paise is not None else p["amount_paise"]
    ref = f"UPI/{int(time.time())}{uuid.uuid4().hex[:4].upper()}/HDFC"
    
    if scenario == "SUCCESS":
        return process_gateway_callback(
            payment_id=payment_id,
            status="SUCCESS",
            provider_ref=ref,
            callback_amount_paise=amt
        )
    elif scenario == "FAILURE":
        return process_gateway_callback(
            payment_id=payment_id,
            status="FAILURE",
            provider_ref=ref,
            callback_amount_paise=amt
        )
    elif scenario == "TIMEOUT":
        # Simulate gateway dropping the connection / timeout: payment remains in PENDING
        return {
            "action": "SIMULATOR_TIMEOUT",
            "payment_id": payment_id,
            "status": "PENDING",
            "message": "Gateway timed out after 30 seconds. Payment remains in PENDING state. No ledger posted."
        }
    elif scenario == "DUPLICATE_CALLBACK":
        # Simulates callback firing twice
        # First ensure payment is success or call it
        return process_gateway_callback(
            payment_id=payment_id,
            status="SUCCESS",
            provider_ref=ref,
            callback_amount_paise=amt
        )
    elif scenario == "AMOUNT_MISMATCH":
        # Intentionally alter amount
        bad_amt = amt - 100000 if amt > 100000 else amt + 100000
        return process_gateway_callback(
            payment_id=payment_id,
            status="SUCCESS",
            provider_ref=ref,
            callback_amount_paise=bad_amt
        )
    else:
        raise FinancialEngineError(f"Unknown simulation scenario: '{scenario}'")
