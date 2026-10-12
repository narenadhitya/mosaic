from fastapi import APIRouter, Query
from typing import Optional
import json
from app.database import get_db

router = APIRouter(prefix="/api/dpdp", tags=["DPDP Consent Ledger"])

@router.get("/logs")
def get_dpdp_logs(user_id: Optional[str] = Query(None, description="Filter for resident self-service 'My Data' view")):
    with get_db() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute("SELECT * FROM dpdp_logs WHERE target_user_id = ? ORDER BY timestamp DESC", (user_id,))
        else:
            cursor.execute("SELECT * FROM dpdp_logs ORDER BY timestamp DESC")
            
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "actor_id": r["actor_id"],
                "actor_role": r["actor_role"],
                "target_user_id": r["target_user_id"],
                "purpose": r["purpose"],
                "fields_accessed": json.loads(r["fields_accessed_json"]),
                "ai_involved": bool(r["ai_involved"]),
                "ai_language": r["ai_language"],
                "timestamp": r["timestamp"]
            }
            for r in rows
        ]
