import json
from app.database import init_db, get_db
from app.financial_engine import initiate_payment, run_simulator

def run_test():
    init_db(force_reseed=True)
    
    # 1. Initiate Flat 4B payment
    init = initiate_payment("INV-2026-004B")
    p = init["payment"]
    print("=== STEP 1: PAYMENT INITIATION ===")
    print("Payment ID:", p["id"])
    print("Status:", p["status"])
    print("Trace ID:", p["trace_id"])
    print(f"Amount: {p['amount_paise']} paise (Rs {p['amount_paise']/100:,.2f})")
    
    # 2. Simulate Success
    sim = run_simulator(p["id"], "SUCCESS")
    print("\n=== STEP 2: SIMULATE SUCCESS & CALLBACK ===")
    print("Action:", sim["action"])
    print("Payment Status:", sim["status"])
    print("Provider Ref:", sim["provider_ref"])
    
    # 3. Verify Balanced Ledger
    le = sim["ledger_entry"]
    print("\n=== STEP 3: DOUBLE-ENTRY BALANCED LEDGER ===")
    print("Ledger Entry ID:", le["entry_id"])
    print("Total Debits:", le["total_debit_paise"], "paise")
    print("Total Credits:", le["total_credit_paise"], "paise")
    balanced = le["total_debit_paise"] == le["total_credit_paise"]
    print("Debits == Credits:", balanced)
    for line in le["lines"]:
        print(f"  - {line['account_name']}: Dr {line['debit_paise']} paise | Cr {line['credit_paise']} paise")
        
    # 4. Check Invoice in DB
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT status FROM invoices WHERE id = ?", ("INV-2026-004B",))
        inv_status = c.fetchone()[0]
        print("\n=== STEP 4: INVOICE STATE ===")
        print("Invoice INV-2026-004B Status:", inv_status)
        
        c.execute("SELECT COUNT(*) FROM ledger_entries WHERE payment_id = ?", (p["id"],))
        ledger_count = c.fetchone()[0]
        print("Ledger Entries in DB for Payment:", ledger_count)
        
    assert p["status"] == "PENDING"
    assert sim["status"] == "SUCCESS"
    assert balanced is True
    assert inv_status == "PAID"
    assert ledger_count == 1
    print("\n*** ALL PHASE 2 EXIT CONDITIONS VERIFIED SUCCESSFULLY ***")

if __name__ == "__main__":
    run_test()
