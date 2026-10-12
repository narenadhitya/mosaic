from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.models import PaymentInitiateRequest, SimulatorExecuteRequest, GatewayCallbackRequest
from app.financial_engine import (
    initiate_payment, 
    process_gateway_callback, 
    run_simulator, 
    FinancialEngineError
)
from app.database import get_db

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/initiate")
def api_initiate_payment(req: PaymentInitiateRequest):
    try:
        return initiate_payment(invoice_id=req.invoice_id, target_vpa=req.target_vpa)
    except FinancialEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.post("/simulate")
def api_simulate_payment(req: SimulatorExecuteRequest):
    try:
        return run_simulator(
            payment_id=req.payment_id,
            scenario=req.scenario,
            override_amount_paise=req.override_amount_paise
        )
    except FinancialEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.post("/callback")
def api_gateway_callback(req: GatewayCallbackRequest):
    try:
        return process_gateway_callback(
            payment_id=req.payment_id,
            status=req.status,
            provider_ref=req.provider_ref,
            callback_amount_paise=req.amount_paise
        )
    except FinancialEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Callback error: {str(e)}")

@router.get("/{payment_id}/ledger")
def get_payment_ledger(payment_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ledger_entries WHERE payment_id = ?", (payment_id,))
        entry = cursor.fetchone()
        if not entry:
            raise HTTPException(status_code=404, detail="No ledger entry found for this payment.")
            
        entry_dict = dict(entry)
        cursor.execute("SELECT * FROM ledger_lines WHERE entry_id = ?", (entry_dict["id"],))
        lines = [dict(l) for l in cursor.fetchall()]
        entry_dict["lines"] = lines
        return entry_dict
