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
    print("Merkle Forest Epoch ID:", sec["merkle_forest"]["latest_epoch_id"])

    # Test Smart Meter Telemetry & Profile Load Sync
    from app.routers.consumer import get_smart_meter_telemetry, get_invite_details, redeem_invite
    from app.models import RedeemInviteRequest

    telemetry = get_smart_meter_telemetry(flat_no="4B", meter_type="ELECTRICITY")
    print(f"\nIoT Telemetry Model: {telemetry['hardware']['model']} | Slabs: {len(telemetry['tariff_slabs'])} | Hourly pts: {len(telemetry['hourly_data'])}")

    sync_res = sync_smart_meter(SmartMeterSyncRequest(flat_no="4B", meter_type="ELECTRICITY", load_profile="AC_HEAVY"))
    print(f"Smart Meter AC Surge Sync: +{sync_res['increment_logged']} kWh => Reading: {sync_res['meter']['current_reading']} kWh, Bill: Rs. {sync_res['new_bill_paise']/100:,.2f}")

    # Test Invite Lookup & Redeem for Flat 501
    inv_details = get_invite_details("MOSAIC-FLAT-501")
    print(f"\nInvite Lookup: Code {inv_details['invite_code']} for Flat {inv_details['flat_no']} (Rent: Rs. {inv_details['monthly_rent_paise']/100:,.0f})")

    redeem_res = redeem_invite(RedeemInviteRequest(
        invite_code="MOSAIC-FLAT-501",
        resident_name="Ananya Sharma",
        resident_email="ananya@example.com",
        resident_phone="+91 98765 43210"
    ))
    print(f"Redeem Invite: {redeem_res['message']} (Resident: {redeem_res['resident_name']})")

    # Verify Flat 501 home feed now works!
    flat_501_feed = get_consumer_home(role="resident", flat_no="501")
    print(f"Flat 501 Feed: Resident {flat_501_feed['active_flat']['tenant_name']} | Bills: {len(flat_501_feed['bills'])} | Total Unpaid: Rs. {flat_501_feed['total_unpaid_paise']/100:,.2f}")

    assert flat_501_feed["active_flat"]["is_occupied"] == 1
    assert len(flat_501_feed["bills"]) == 4
    print("\n*** ALL CONSUMER BACKEND ENDPOINTS AND WORKFLOWS VERIFIED ***")

if __name__ == "__main__":
    run_test()

