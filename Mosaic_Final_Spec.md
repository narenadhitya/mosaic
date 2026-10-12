# Mosaic — Product Specification & Implementation Plan

**Product:** Mosaic  
**Inspiration:** Consumer community platforms (e.g. MyGate, Cred) with institutional-grade backend financial security  
**Target Market:** Indian Residential Housing Societies, Gated Communities, Apartment Homeowners & Residents  
**Core Design Philosophy:**  
> **"Consumer simplicity on the surface: mobile-first MyGate-style home living, smart automated utility meter tracking, and rent reminders. Institutional-grade financial intelligence under the hood: BIS IS 19671 QR security, Merkle audit trails, and DPDP consent accessible via an 'Under the Hood' inspector."**

---

## 1. Executive Summary & Vision

Mosaic is a consumer-first housing community and home living platform designed for:
1. **Residents (Tenants & Flat Dwellers):** Clean, minimal mobile-first app to track rent due dates, view automated smart-meter electricity and water bills, pay dues in one tap, and get timely notifications.
2. **Homeowners (Landlords):** Track rent clearance for their specific rented flats, monitor tenant utility liabilities, and dispatch digital flat invites to onboarding tenants.
3. **Society Administrators (RWA / Community Managers):** Full community directory, automated society maintenance invoicing, payment reminder broadcasts, and collection totals.

All high-end technical architectures (BIS IS 19671:2026 QR conformance, Merkle tree audit forest, and DPDP Act 2023 consent logging) operate **silently in the backend**, keeping the consumer interface minimal and clutter-free. For hackathon judges and technical evaluators, a discrete **"Security Shield"** pill in the header slides open an **"Under the Hood"** drawer showcasing the live security telemetry without distracting everyday users.

---

## 2. User Personas & Workflows

### 2.1 Resident Persona (e.g. Rohan Verma, Flat 4B)
- **Invite Onboarding:** Logs in and enters a flat invite code/link sent by their landlord or society manager.
- **Home Dashboard:**
  - "My Flat" card (Flat 4B, Sunrise Heights).
  - Quick glance: Rent status (e.g., ₹25,000 due in 4 days), Electricity bill (automated smart-meter sync), Water charges, Society maintenance.
  - "Pay Now" one-tap checkout.
- **Smart Automated Utilities:**
  - Automated IoT device reading simulation for Electricity (kWh consumed & tariff) and Water meters, removing tedious manual logging.
- **Expense Breakdown:**
  - Visual monthly spending chart (Rent, Electricity, Water, Maintenance).
- **Reminders & Notifications:**
  - In-app notification center for rent due dates, credit dues, and payment confirmations.

### 2.2 Landlord / Homeowner Persona (e.g. Vikram Malhotra, Owner of Flat 4B)
- **Property Portfolio:** View owned flats and tenant occupancy.
- **Tenant Invites:** Generate and share digital onboarding invites (`mosaic.app/join/FLAT4B`).
- **Rent Tracking:** Real-time visibility into whether the tenant has cleared monthly rent.
- **Utility Oversight:** Verify that automated electricity and water bills are cleared to protect against unpaid utility liabilities.
- **Payment Reminders:** One-tap friendly WhatsApp/SMS/In-app nudge to the tenant when rent is due.

### 2.3 Society Administrator Persona (e.g. RWA Secretary / Finance Desk)
- **Community Directory:** Bird's-eye view of all society wings, flats, owners, and active tenants.
- **Society Maintenance Invoicing:** Bulk generates monthly maintenance dues.
- **Collection Radar:** Live society collection totals vs. outstanding arrears.
- **Broadcast Reminders:** Dispatches bulk due date reminder alerts to all unpaid flats.

### 2.4 Technical Evaluator / Auditor ("Under the Hood" Inspector Drawer)
- Discrete header pill **"Security Shield"** opens a drawer detailing:
  - **BIS IS 19671:2026 QR Conformance:** Clause-by-clause evaluation of payment intents.
  - **Merkle Audit Forest:** Cryptographic batch inclusion proofs (IS/ISO 27001 Control A.8.15) and tamper test.
  - **DPDP Act 2023 Consent Guard:** Audit log of personal data access and PII minimisation.

---

## 3. UI/UX Design System: Mobile-First Responsive Layout

- **Form Factor:**
  - Mobile-first card structure inspired by **MyGate and Cred** (sleek, high-contrast dark theme `#0b0f19`, rounded cards, clean typography, vibrant accent pills).
  - Fully responsive on wide desktop monitors (structured multi-column grid with live feed preview).
- **Navigation:**
  - Bottom navigation bar on mobile / Clean sub-header tabs on desktop:
    - 🏠 **Home:** Dues, active bills, smart meters, quick pay.
    - ⚡ **Smart Meters:** IoT automated utility telemetry, live sync simulator.
    - 📊 **Expense Radar:** Month-by-month proportional breakdown, receipts.
    - 🏢 **My Community / Portfolio:** Directory, tenant invites, society maintenance tracker.
    - 🔔 **Reminders:** Alerts, due date countdowns, landlord/admin nudges.
    - 🛡️ **Under the Hood (Header Pill):** Opens judge/auditor security drawer.

---

## 4. Under-the-Hood Invisible Intelligence

1. **Automated IoT Smart Meter Simulator:**
   - Background telemetry service that simulates automated smart meters for Electricity (kWh, units, bill amount) and Water (liters, water board tariff), generating bills automatically without manual user entry.
2. **Invisible BIS IS 19671:2026 QR Guard:**
   - Every payment intent is parsed and verified against Clause 5.3 (Payee Authentication), Clause 6.1 (Currency INR & Amount integrity) before launching payment rails.
3. **Merkle Audit Forest:**
   - Cryptographically hashes and seals every 10 financial transactions into Merkle epochs for immutable logging.
4. **DPDP Act 2023 Consent Guard:**
   - Strips PII before any data processing and audits every data read in the consent ledger.
5. **Sarvam AI Multilingual Voice & Chat:**
   - Multilingual resident assistant in Tamil, Hindi, Telugu, Kannada, Bengali, and English for natural voice/text bill queries.

---

## 5. Implementation Roadmap

1. **Phase 1 — Consumer Living Foundation & Multi-Persona Workspace:**
   - Mobile-first responsive app shell with MyGate/Cred aesthetics.
   - Persona switcher: **Resident (Flat 4B)**, **Landlord (Flat 4B Owner)**, **Society Admin (RWA Desk)**.
   - "Under the Hood" drawer for technical reviewers.
   - Automated IoT smart meter telemetry and one-tap UPI payment modal.
2. **Phase 2 — Invites & Automated Smart Meter Utilities:**
   - Tenant invite generation & redemption workflow.
   - Landlord property portfolio oversight & Society Admin directory.
3. **Phase 3 — Consumer Rent & Utility Payments & Reminders:**
   - Transparent split routing (Rent to Landlord, Maintenance to RWA).
   - Proactive reminder notifications (countdown cards, landlord payment nudges).
4. **Phase 4 — Under-the-Hood BIS IS 19671 QR Engine:**
   - Silent validation layer integrated into checkout and visible in inspector drawer.
5. **Phase 5 — Under-the-Hood Merkle Forest & DPDP Privacy:**
   - Cryptographic proof generation and consent ledger.
6. **Phase 6 — Sarvam AI Multilingual Resident Assistant:**
   - In-app chatbot/voice assistant for home bill queries in Indian languages.
7. **Phase 7 — Bank Statement Reconciliation & Polish:**
   - Automated landlord & society statement matching.
   - Final mobile & web polish for live demonstration.
