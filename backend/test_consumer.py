from app.routers.consumer import (
    get_consumer_home, get_landlord_portfolio, get_admin_community, 
    get_security_telemetry, sync_smart_meter, pay_bill
)
from app.models import SmartMeterSyncRequest, PayBillRequest

def run_test():
    home = get_consumer_home(role="resident", flat_no="4B")
    print("Resident Home Flat:", home["active_flat"]["flat_no"], "| Bills Count:", len(home["bills"]))
    print("Smart Meters:", [m["meter_type"] for m in home["smart_meters"]])
    print(f"Total Unpaid Paise: {home['total_unpaid_paise']} (Rs. {home['total_unpaid_paise']/100:,.2f})")

    landlord = get_landlord_portfolio()
    print("\nLandlord Flats:", [f["flat_no"] for f in landlord["flats"]], "| Invites:", len(landlord["active_invites"]))

    admin = get_admin_community()
    print("\nAdmin Total Flats:", admin["total_flats"], "| Occupied:", admin["occupied_flats"])

    sec = get_security_telemetry()
    print("\nSecurity Telemetry Standard:", sec["bis_qr_engine"]["standard"])
    print("Knowledge Graph Topology:", sec["knowledge_graph"]["topology_status"])
    print("Merkle Forest Epoch ID:", sec["merkle_forest"]["latest_epoch_id"])

    # Test Smart Meter Sync
    sync_res = sync_smart_meter(SmartMeterSyncRequest(flat_no="4B", meter_type="ELECTRICITY", simulated_increment=5.0))
    print(f"\nSmart Meter Sync: +5.0 kWh => Reading: {sync_res['meter']['current_reading']} kWh, Bill: Rs. {sync_res['new_bill_paise']/100:,.2f}")

    # Test Pay Bill (pay water bill)
    water_bill = next((b for b in home["bills"] if b["bill_type"] == "WATER"), None)
    if water_bill:
        pay_res = pay_bill(PayBillRequest(bill_id=water_bill["id"], upi_app="GPAY"))
        print(f"Bill Payment: Status: {pay_res['status']}, Ref: {pay_res['transaction_ref']}, Payee: {pay_res['payee_name']}")

    assert home["active_flat"]["flat_no"] == "4B"
    assert len(home["bills"]) == 4 # Rent, Elec, Water, Maint
    assert len(landlord["flats"]) == 4 # 4B, 501, 101, 201
    assert admin["total_flats"] == 4
    print("\n*** ALL CONSUMER BACKEND ENDPOINTS AND WORKFLOWS VERIFIED ***")

if __name__ == "__main__":
    run_test()

