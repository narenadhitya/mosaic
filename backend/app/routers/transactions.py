from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models import PaymentModel

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[PaymentModel])
def get_transactions(include_fraud: bool = Query(True, description="Include seeded fraud scenario records")):
    with get_db() as conn:
        cursor = conn.cursor()
        if include_fraud:
            cursor.execute("SELECT * FROM payments ORDER BY created_at DESC")
        else:
            cursor.execute("SELECT * FROM payments WHERE is_fraud_scenario = 0 ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [PaymentModel(**dict(row)) for row in rows]

@router.get("/{payment_id}")
def get_transaction_detail(payment_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE id = ?", (payment_id,))
        p = cursor.fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Transaction not found")
        payment_dict = dict(p)
        
        # Associated invoice
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (payment_dict["invoice_id"],))
        inv = cursor.fetchone()
        invoice_dict = dict(inv) if inv else None
        
        # Associated ledger entry
        cursor.execute("SELECT * FROM ledger_entries WHERE payment_id = ?", (payment_id,))
        le = cursor.fetchone()
        ledger_entry = None
        if le:
            ledger_entry = dict(le)
            cursor.execute("SELECT * FROM ledger_lines WHERE entry_id = ?", (ledger_entry["id"],))
            ledger_entry["lines"] = [dict(l) for l in cursor.fetchall()]
            
        # Bank reconciliation match status
        cursor.execute("SELECT * FROM bank_statements WHERE matched_payment_id = ?", (payment_id,))
        bs = cursor.fetchone()
        bank_match = dict(bs) if bs else None
        
        return {
            "payment": payment_dict,
            "invoice": invoice_dict,
            "ledger_entry": ledger_entry,
            "bank_reconciliation": bank_match
        }
