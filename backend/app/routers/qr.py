from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api/qr", tags=["QR Guard"])

@router.get("/scenarios")
def get_qr_scenarios():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM qr_scenarios")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
