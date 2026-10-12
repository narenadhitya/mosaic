from fastapi import APIRouter
from app.database import get_db, init_db
from app.models import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Society details
        cursor.execute("SELECT name, trusted_vpa FROM societies LIMIT 1")
        soc = cursor.fetchone()
        society_name = soc["name"] if soc else "Sunrise Housing Society"
        trusted_vpa = soc["trusted_vpa"] if soc else "sunrise.society@hdfcbank"
        
        # Invoices stats
        cursor.execute("SELECT COUNT(*), SUM(amount_paise) FROM invoices")
        total_invoices_count, total_invoiced_paise = cursor.fetchone()
        total_invoiced_paise = total_invoiced_paise or 0
        
        cursor.execute("SELECT COUNT(*), SUM(amount_paise) FROM invoices WHERE status = 'UNPAID'")
        unpaid_count, unpaid_paise = cursor.fetchone()
        unpaid_paise = unpaid_paise or 0
        
        cursor.execute("SELECT COUNT(*) FROM invoices WHERE status = 'PAID'")
        paid_count = cursor.fetchone()[0]
        
        # Payments stats (Collections)
        cursor.execute("SELECT SUM(amount_paise) FROM payments WHERE status = 'SUCCESS'")
        total_collections_paise = cursor.fetchone()[0] or 0
        
        # Flagged anomalies (fraud records or anomalies detected)
        cursor.execute("SELECT COUNT(*) FROM payments WHERE is_fraud_scenario = 1 OR flagged_reason IS NOT NULL")
        flagged_anomalies_count = cursor.fetchone()[0]
        
        # Residents count
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'resident'")
        residents_count = cursor.fetchone()[0]
        
    return DashboardStats(
        society_name=society_name,
        trusted_vpa=trusted_vpa,
        total_collections_paise=total_collections_paise,
        outstanding_dues_paise=unpaid_paise,
        total_invoices_count=total_invoices_count,
        unpaid_invoices_count=unpaid_count,
        paid_invoices_count=paid_count,
        flagged_anomalies_count=flagged_anomalies_count,
        total_residents_count=residents_count,
        simulation_mode=True
    )

@router.post("/reset")
def reset_demo_data():
    init_db(force_reseed=True)
    return {"status": "ok", "message": "Demo data successfully reset to clean Phase 1 seed."}
