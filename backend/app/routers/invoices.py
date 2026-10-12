from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database import get_db
from app.models import InvoiceModel, InvoiceCreateRequest
from app.financial_engine import create_invoice

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceModel])
def get_invoices(status: Optional[str] = None, user_id: Optional[str] = Query(None, description="Filter invoices by resident user ID")):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM invoices WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        query += " ORDER BY flat_no ASC"
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        return [InvoiceModel(**dict(row)) for row in rows]

@router.post("", response_model=InvoiceModel)
def api_create_invoice(req: InvoiceCreateRequest):
    try:
        inv = create_invoice(
            user_id=req.user_id,
            flat_no=req.flat_no,
            resident_name=req.resident_name,
            month=req.month,
            amount_rupees=req.amount_rupees,
            due_date=req.due_date
        )
        return InvoiceModel(**inv)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{invoice_id}", response_model=InvoiceModel)
def get_invoice(invoice_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return InvoiceModel(**dict(row))

