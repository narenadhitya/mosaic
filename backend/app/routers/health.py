from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name, trusted_vpa FROM societies LIMIT 1")
            row = cursor.fetchone()
            society_name = row["name"] if row else "Unknown"
            trusted_vpa = row["trusted_vpa"] if row else "Unknown"
            
        return {
            "status": "healthy",
            "product": "Mosaic",
            "version": "1.0.0",
            "database": "sqlite_connected",
            "society": society_name,
            "trusted_vpa": trusted_vpa,
            "simulation_mode": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "product": "Mosaic",
            "error": str(e)
        }
