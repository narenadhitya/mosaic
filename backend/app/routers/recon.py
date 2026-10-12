from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/recon", tags=["Reconciliation"])

@router.get("/statement")
def get_statement_rows():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bank_statements ORDER BY transaction_date ASC")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
