from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# CONSUMER LIVING ENTITIES (MyGate-Inspired)
# ============================================================================

class FlatModel(BaseModel):
    id: str
    flat_no: str
    wing: str
    bhk_type: str
    owner_id: str
    owner_name: str
    owner_vpa: str
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    monthly_rent_paise: int
    is_occupied: bool = True

class SmartMeterModel(BaseModel):
    id: str
    flat_no: str
    meter_type: str # "ELECTRICITY" or "WATER"
    device_id: str
    current_reading: float
    unit_label: str # "kWh" or "kL"
    cycle_consumption: float
    rate_per_unit_paise: int
    calculated_bill_paise: int
    billing_period: str
    due_date: str
    last_synced_at: str
    status: str # "SYNCED_LIVE", "BILL_GENERATED", "PAID"

class BillModel(BaseModel):
    id: str
    flat_no: str
    bill_type: str # "RENT", "ELECTRICITY", "WATER", "MAINTENANCE"
    title: str
    amount_paise: int
    due_date: str
    payee_name: str
    payee_vpa: str
    status: str # "UNPAID", "PAID", "OVERDUE"
    created_at: str
    paid_at: Optional[str] = None
    is_automated_meter: bool = False
    meter_id: Optional[str] = None

class NotificationModel(BaseModel):
    id: str
    user_id: str
    flat_no: str
    title: str
    message: str
    notification_type: str # "RENT_DUE", "METER_SYNC", "SOCIETY_NOTICE", "PAYMENT_CONFIRMED"
    is_read: bool = False
    created_at: str

class InviteModel(BaseModel):
    id: str
    invite_code: str
    flat_no: str
    owner_id: str
    owner_name: str
    monthly_rent_paise: int
    status: str # "PENDING", "ACCEPTED", "EXPIRED"
    created_at: str
    invite_url: str

# ============================================================================
# API REQUEST & RESPONSE SCHEMAS
# ============================================================================

class SmartMeterSyncRequest(BaseModel):
    flat_no: str
    meter_type: str # "ELECTRICITY" or "WATER"
    simulated_increment: Optional[float] = None

class LandlordInviteCreateRequest(BaseModel):
    flat_no: str
    monthly_rent_rupees: float

class LandlordNudgeRequest(BaseModel):
    flat_no: str
    bill_id: str
    message: Optional[str] = None

class RedeemInviteRequest(BaseModel):
    invite_code: str
    resident_name: str
    resident_email: str
    resident_phone: str

class PayBillRequest(BaseModel):
    bill_id: str
    upi_app: Optional[str] = "GPAY"
    simulated_upi_pin: Optional[str] = "1234"

class ConsumerHomeFeed(BaseModel):
    active_flat: FlatModel
    user_name: str
    user_role: str
    bills: List[BillModel]
    total_unpaid_paise: int
    smart_meters: List[SmartMeterModel]
    monthly_expense_breakdown: Dict[str, int]
    recent_notifications: List[NotificationModel]
    unread_notifications_count: int

# ============================================================================
# UNDER-THE-HOOD SECURITY SCHEMAS (Preserved for Inspector Drawer)
# ============================================================================

class UnderTheHoodTelemetry(BaseModel):
    bis_qr_status: Dict[str, Any]
    knowledge_graph: Dict[str, Any]
    merkle_epoch: Dict[str, Any]
    dpdp_consent: Dict[str, Any]
    ledger_integrity: Dict[str, Any]

# ============================================================================
# COMPATIBILITY & ADMINISTRATIVE SCHEMAS
# ============================================================================

class DashboardStats(BaseModel):
    society_name: str
    trusted_vpa: str
    total_collections_paise: int
    outstanding_dues_paise: int
    total_invoices_count: int
    unpaid_invoices_count: int
    paid_invoices_count: int
    flagged_anomalies_count: int
    total_residents_count: int
    simulation_mode: bool = True

class InvoiceModel(BaseModel):
    id: str
    society_id: str
    user_id: str
    flat_no: str
    resident_name: str
    month: str
    amount_paise: int
    due_date: str
    status: str
    created_at: str

class InvoiceCreateRequest(BaseModel):
    user_id: str
    flat_no: str
    resident_name: str
    month: str
    amount_rupees: float
    due_date: str

class PaymentModel(BaseModel):
    id: str
    invoice_id: str
    user_id: str
    flat_no: str
    payer_name: str
    amount_paise: int
    target_vpa: str
    target_payee_name: str
    trace_id: str
    provider_ref: Optional[str] = None
    status: str
    is_fraud_scenario: bool = False
    flagged_reason: Optional[str] = None
    created_at: str
    updated_at: str

class PaymentInitiateRequest(BaseModel):
    invoice_id: str
    target_vpa: Optional[str] = None

class SimulatorExecuteRequest(BaseModel):
    payment_id: str
    scenario: str
    override_amount_paise: Optional[int] = None

class GatewayCallbackRequest(BaseModel):
    payment_id: str
    status: str
    provider_ref: str
    amount_paise: int
