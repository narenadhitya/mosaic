# Mosaic — Product Specification

**Hackathon:** Fintech · 8-Hour Build  
**Target Market:** Indian Residential Housing Societies  
**Compliance Anchors:** BIS IS 19671:2026 · DPDP Act 2023 · IS/ISO/IEC 27001:2022 · IS/ISO/IEC 42001:2023

---

## What This Document Is

This document explains what Mosaic is, why it exists, what it does for its users, and how it is structured as a product. It is written for two audiences equally: a human reader who wants to understand the product idea, and an AI tool that will use this as context to build or extend the system. You do not need to know how any piece of technology works internally to understand this document. The goal is to convey intent, not implementation.

---

## The Problem It Solves

Most Indian residential housing societies — apartment complexes, gated communities, cooperative housing — manage their finances across a patchwork of disconnected tools. Maintenance invoices might be sent via WhatsApp. Payments come in through UPI and are manually confirmed by the treasurer. Bank statements are downloaded as CSV files and reconciled by hand in Excel. When something goes wrong — a payment shows as debited from a resident's account but the society ledger still says unpaid, or a QR code shared in the building WhatsApp group turns out to belong to an attacker's account — there is no single system to trace what happened, why, or where things went wrong.

The consequences are real. Residents get wrongly marked as defaulters. Duplicate payments go undetected. Fraudulent QR codes redirect society collections to unknown accounts. Finance staff have no way to explain discrepancies quickly. Audits are painful because there is no trail.

Mosaic brings all of this into one place and adds intelligence that no existing society management tool provides.

---

## What Mosaic Is

Mosaic is a financial operations and transaction intelligence platform for Indian housing societies. It covers the complete journey of a maintenance payment — from the moment an invoice is raised, through the resident paying it, to the treasurer confirming it in the accounts and reconciling it against the bank statement — as a single, traceable workflow.

Beyond the workflow, it adds four capabilities that do not exist in any current product for this market:

1. **A Payment Knowledge Graph** that maps who is paying whom, and detects suspicious patterns in how money is flowing through the society's payment network.
2. **A BIS IS 19671 QR Compliance Engine** that checks whether a UPI payment QR code is safe to use, validated against India's own national standard for code-scanning payment security.
3. **A Merkle Audit Forest** that makes the audit trail mathematically verifiable — any transaction can be proven to have been recorded, and any tampering with the record becomes detectable.
4. **A DPDP Act 2023 Consent Ledger** that tracks every time a resident's personal data is accessed, for what purpose, and whether it was shared with an AI — giving residents visibility into their own data and keeping the society compliant with India's new data protection law.

On top of all this, the Sarvam AI assistant can explain flagged transactions, answer finance questions, and do it all in Tamil, Hindi, Telugu, or other Indian languages.

---

## The Central Design Principle

> **Deterministic code controls all financial decisions. AI investigates and explains. AI never authorises.**

This is the most important idea in the product. Every financial action — recording a payment, posting to the accounts, matching a bank statement row — is done by predictable, rule-based logic. The AI assistant is only ever used to explain what happened after the fact, in plain language. It can tell a treasurer why a payment was flagged and what they should do next. It cannot approve, reject, reverse, or create any financial record on its own.

This matters because it makes the system trustworthy. If a payment is blocked, there is an exact reason code. If the AI is unavailable, the system still works. If the AI produces an odd explanation, no money has moved because of it.

---

## Who Uses It

### Resident

A flat owner or tenant. They can see their own invoices, pay them in demo mode, and track the status of their payments. They can also see a log of every time their personal data was accessed by the system — a right granted by the DPDP Act 2023. They cannot see other residents' information.

### Accountant or Treasurer

The society's finance person. They can see all invoices, payments, and collection totals for the society. They import bank statements, run reconciliation, review flagged transactions, and use the AI assistant to understand exceptions. They are the primary user of the investigation and reconciliation tools.

### Society Administrator

Has all the accountant's access, plus the ability to raise new invoices, configure trusted payment addresses, and view the compliance dashboard showing how the system maps to relevant Indian standards.

### Auditor

A read-only role. Can view all records, traces, decisions, and logs — including the Merkle proof trail and DPDP access log — but cannot create, modify, or take any action on any record. This role is designed for internal audit reviews or external compliance checks.

---

## The Four Innovations — Explained Simply

### Innovation 1: Payment Knowledge Graph

The idea here is to treat the society's payment activity not as a list of transactions, but as a network. In this network, residents are connected to their payments, and payments are connected to the UPI address (VPA) that received them. When you look at this network visually, patterns become obvious that would be invisible in a spreadsheet.

A normal, healthy network looks like a star: all payment paths lead to the society's one registered payment address. A fraud scenario looks different — multiple residents' payments suddenly fan out to an unknown address. That structural change is what the system detects automatically. This is called graph intelligence: the shape of the network tells you something that the individual records do not.

The frontend renders this as a live, interactive diagram. Nodes are colour-coded by type. Suspicious nodes glow red. Clicking any payment node opens its full trace. The diagram updates automatically as new payments come in.

### Innovation 2: BIS IS 19671 QR Compliance Engine

IS 19671:2026 is the Indian standard published by the Bureau of Indian Standards (BIS) that defines how QR-based payments should be secured. It is India's adoption of the international ISO 5201:2024 standard. This product is the first hackathon project — and likely the first society finance tool — to implement a real validation layer against this standard.

When a QR code is scanned or pasted into the system, the compliance engine breaks it apart and checks every field against what the standard requires: Is the payment address the one the society registered? Does the amount match the invoice? Is the currency INR? Is there a transaction reference that links back to a specific invoice? Each finding references the exact clause of the standard it is checking.

The output is a field-by-field compliance report with a clear overall verdict: PASS, WARN, or BLOCK_REVIEW. The point is not just to say "this QR is suspicious" — it is to say exactly which field failed and which clause of which standard it violates.

### Innovation 3: Merkle Audit Forest

The problem with most audit logs is that they can be tampered with. If someone with database access changes a record, the log entry changes too. A hash chain is an improvement — each record's fingerprint incorporates the previous one — but it can still be rewritten if someone controls the full chain.

A Merkle tree goes further. It groups a batch of audit events into a tree structure, where each leaf is the fingerprint of one event and each branch is the fingerprint of the branches below it. The root — a single hash — represents the entire batch. Crucially, you can prove that any single event was part of the batch using only a small number of sibling hashes, without revealing any other event in the batch.

In the product, this is called a Merkle Audit Forest. Every ten transaction events, the system closes an epoch and builds one Merkle tree. A user can click "Prove This Happened" on any transaction and see the mathematical proof path from their event to the epoch's root. A "Tamper Test" button shows what happens if even one character of the event is changed — the proof breaks. This satisfies a specific control under IS/ISO/IEC 27001:2022 (logging protection) with mathematical rigour, not just access controls.

### Innovation 4: DPDP Act 2023 Consent Ledger

India's Digital Personal Data Protection Act 2023 is now law. It requires that personal data be processed only for specified, lawful purposes, and gives individuals the right to know how their data is being used. For a society finance platform, this means every time a resident's invoice amount, payment status, or unit number is accessed — especially if it is sent to an AI — there should be a record of it.

The consent ledger does exactly this. Every data access is logged with: who accessed it, whose data it was, what the stated purpose was (billing, audit, AI investigation, etc.), which fields were accessed, whether an AI received the data, and in what language the AI responded. Before any data is sent to the AI, a minimisation step strips out everything not strictly necessary — no names, no contact information, nothing beyond what the AI needs to explain the specific anomaly.

Residents can view their own data access log in the app. The auditor can view the full log across the society. This is a compliance feature, but it is also a trust feature — it shows residents that the platform treats their data with care.

---

## How the System Is Structured

The product has three layers that work together.

**The frontend** is what users see and interact with. It is a web application with a sidebar navigation linking to all the major areas: Dashboard, Invoices, Transactions, Payment Graph, QR Guard, Audit Trail, Reconciliation, Copilot, DPDP Panel, and BIS Compliance. Every page shows a banner confirming that the system is in simulation mode and no real money is moving.

**The backend** is where all rules are enforced, all financial records are created, and all decisions are made. It exposes an API that the frontend calls. The backend is the source of truth for everything financial. The AI assistant is called from the backend — never from the frontend directly — so there is no risk of API keys leaking to users, and data minimisation happens before any data leaves the backend.

**The database** holds all records. Financial records (invoices, payments, ledger entries) are treated with the strictest integrity rules: all money is stored as integer paise (not decimal rupees) to avoid rounding errors, and ledger entries are validated to balance before being saved. Graph snapshots, Merkle epochs, and DPDP access logs live alongside the financial records in the same database.

---

## Build Phases

The product is built in nine phases. Each phase adds a complete, demonstrable layer of functionality. A phase is only considered complete when its exit condition is met — a specific, observable outcome that proves the phase works. If time pressure forces cuts, later phases are deferred before earlier ones are compromised.

---

### Phase 1 — Foundation

**What gets built:** The skeleton of the application. The database is set up and populated with demo data. The backend starts and returns a health check. The frontend loads and shows the dashboard with real numbers from the database.

**The demo data seeded in this phase includes:**
- One housing society (Sunrise Housing Society) with a registered trusted payment address.
- Twelve resident users across different flats and one each of accountant, admin, and auditor.
- Ten unpaid invoices and two completed paid invoices.
- Six payment records in which residents paid the wrong VPA (used for the graph fraud scenario in Phase 3).
- A bank statement CSV with three rows — two that will match internal payments and one that will not.
- Four QR scenario payloads — one valid, one with a wrong payee, one with the wrong currency, one with a mismatched amount.
- Enough transaction events to close one Merkle epoch (used in Phase 5).

**Why this phase matters first:** Nothing can be built or demonstrated if the system does not start cleanly with realistic data. Seeding the fraud and compliance scenarios upfront means the demo moments are ready as soon as the relevant features are built.

**Exit condition:** The application starts with two terminal commands. The dashboard shows real collection figures from the seeded data.

---

### Phase 2 — Core Financial Engine

**What gets built:** The full invoice-to-payment-to-ledger workflow. This is the financial heart of the product.

**Invoice management** allows admins to create invoices and residents to view their own. Each invoice has a status that changes as it moves through the payment lifecycle.

**Payment initiation** is a careful, multi-step process. Before a payment is created, the system checks that the invoice is payable, that the amount matches exactly, and that a duplicate request is not being submitted. Each payment gets a unique trace ID that follows it through every subsequent step.

**The payment simulator** replaces a real payment gateway for the demo. It can produce any outcome on demand: success, failure, a timeout, a duplicate callback, an amount mismatch, or an invalid event. This allows the demo to show every scenario without needing a live bank connection.

**Callback processing** handles the event that comes back from the payment provider (or simulator). The system checks whether the callback is a duplicate (if so, it is logged and ignored — no double-posting), verifies the amount matches, and transitions the payment to its new status.

**The double-entry ledger** posts a balanced accounting entry for every successful payment. A balanced entry means the total of all debit amounts exactly equals the total of all credit amounts, to the last paise. This is enforced as a rule before the entry is saved — an unbalanced entry is rejected. Once posted, ledger lines are never edited; corrections use reversal entries.

**Payment states** follow a strict sequence: a payment can move from Created to Pending, from Pending to Success or Failed. No other transitions are allowed. A browser redirect or a provider delay never causes the system to assume a payment succeeded.

**Exit condition:** Initiating a payment, simulating a success, and verifying that a balanced ledger entry exists in the database.

---

### Phase 3 — Payment Knowledge Graph

**What gets built:** A live, interactive diagram of how payments are flowing through the society, with automatic detection of suspicious patterns.

The system builds a network (graph) from all payment records. In this network, each resident, each payment, and each UPI payment address is a node. Arrows connect them in the direction money flows: resident initiates a payment, payment goes to a VPA.

Five anomaly patterns are detected automatically every time the graph is rebuilt:

- **VPA Degree Anomaly:** Three or more residents routing payments to an unregistered payment address. This is the primary fraud indicator — it looks like payee substitution at scale.
- **Untrusted VPA:** Any payment address that is not the society's registered one receiving money, even just one payment.
- **Isolated New Node:** A payment address appearing for the first time and immediately receiving a significant amount — a cold-start risk indicator.
- **Same-Amount Duplicate Route:** Two payments of identical amounts going to the same unregistered address but citing different invoice references, within 48 hours.
- **Star Collapse:** A large number of payment edges converging on a single unregistered address, regardless of how many residents initiated them.

The frontend renders the graph as a force-directed diagram. Normal nodes are colour-coded by type (residents in blue, payments in orange, trusted VPA in green). Any node involved in an anomaly turns red. An anomaly panel below the graph lists each finding with a description and risk level. Clicking a payment node navigates to the full transaction trace for that payment.

A "Trigger Fraud Scenario" button (visible in demo mode) applies the seeded fraud payments to the graph, causing the attacker's VPA to appear in red.

**Exit condition:** The clean graph shows a star topology. Triggering the fraud scenario makes the attacker VPA node appear in red with the VPA_DEGREE_ANOMALY finding listed.

---

### Phase 4 — BIS IS 19671 QR Compliance Engine

**What gets built:** A field-by-field validator for UPI payment QR codes, checked against India's BIS IS 19671:2026 standard. Each field check cites the specific clause it is enforcing.

A UPI QR code encodes a payment intent — it carries the payee's address, their name, the amount, the currency, a transaction note, and a reference. The compliance engine parses all of these fields and checks each one independently.

The checks, in plain terms:

- **Payee address (pa):** Must be present, must follow the valid UPI format, and must match the society's registered trusted address exactly. If it does not match, the verdict is BLOCK_REVIEW citing Clause 5.3 of IS 19671 — Payee Authentication.
- **Payee name (pn):** Must be present and must match the society's registered name. A mismatch is a warning, not a block — the name field is easier to spoof but less critical than the address.
- **Currency (cu):** Must be INR. Any other currency is an immediate block citing Clause 6.1 — Currency Constraint.
- **Amount (am):** If present, must match the invoice amount exactly, to the paise. A mismatch is a block citing Clause 6.1 — Amount Integrity.
- **Transaction note (tn):** Should be present. Absent is a warning.
- **Transaction reference (tr):** Should match the invoice ID so the payment can be traced back to its originating record. Mismatch or absence is a warning.
- **Merchant category code (mc):** Should be present and should match the types of businesses a housing society falls under. Absence is a warning.
- **Terminal ID (tid):** If present (optional), noted as unverifiable in this prototype.

The overall verdict is the most severe individual finding: any BLOCK_REVIEW field makes the overall verdict BLOCK_REVIEW; otherwise WARN if any warnings; otherwise PASS.

The frontend shows a results table with one row per field, the clause reference, the status badge, and the message. The overall verdict appears as a large badge at the top. A permanent disclaimer clarifies this is a prototype compliance check, not a certified conformance tool.

**Exit condition:** Wrong-payee QR scenario shows BLOCK_REVIEW with Clause 5.3 cited. Wrong-currency scenario shows BLOCK_REVIEW with Clause 6.1 cited.

---

### Phase 5 — Merkle Audit Forest

**What gets built:** A mathematically verifiable audit trail where any transaction event can be proven to have been recorded in a specific batch, and any modification to the record becomes detectable.

Every ten transaction events recorded in the system, the system closes an "audit epoch." It takes the ten events, represents each one as a unique fingerprint (a hash of the event's key fields), arranges them into a binary tree structure, and computes a single root fingerprint that represents the entire batch. This root is stored as the epoch record.

Later, if anyone needs to verify that a specific event was recorded, the system provides a "proof path" — a small set of companion fingerprints from the tree that allows anyone to recompute the root from just that one event. If the recomputed root matches the stored epoch root, the event was definitely in the batch. If even one character of the event record was changed after the epoch was closed, the recomputed root will not match.

The frontend makes this tangible. On the transaction detail view, a "Prove This Happened" button shows the Merkle tree as a diagram, with the relevant event highlighted at the bottom and the verified path illuminated up to the root. A "Tamper Test" button artificially corrupts the event fingerprint in the browser and re-runs the local check — the diagram turns red, showing the proof break. No server-side data is changed by this test.

This feature maps directly to IS/ISO/IEC 27001:2022 Control A.8.15, which requires that audit logs be protected against tampering. The Merkle proof addresses this with mathematical certainty rather than just database access restrictions.

**Exit condition:** "Prove This Happened" on any seeded payment event shows a green verified diagram. Tamper Test makes it turn red.

---

### Phase 6 — DPDP Act 2023 Consent Ledger

**What gets built:** A complete record of every access to resident personal data, with data minimisation enforced before any information reaches the AI.

Under India's Digital Personal Data Protection Act 2023, organisations processing personal data must be able to demonstrate that they accessed it only for specified, lawful purposes. Residents have the right to know what data was collected about them and how it was used.

Every time any part of the system reads a resident's financial information, a log entry is created automatically recording: who initiated the access, whose data it was, what the stated purpose was, what fields were included, whether an AI model received the data, and — if the AI was involved — which language it responded in.

Before any data reaches the Sarvam AI assistant, a minimisation step runs. It removes the resident's name, contact details, unit number, and any other identifying information that is not strictly needed to explain the financial anomaly at hand. The AI only ever sees the payment amounts, status codes, reason codes, and timestamps necessary for the explanation.

The auditor-facing DPDP panel shows the full access log for the society with filters by purpose, actor, and date. Clicking any entry that involved the AI shows exactly what data was sent to Sarvam. The resident-facing My Data page shows only the entries that concern that resident, fulfilling the access right under the DPDP Act.

**Exit condition:** After any AI investigation call, the DPDP panel shows a new log entry with AI context flagged. The evidence bundle view shows no names or contact details. The resident's own My Data page shows the entry.

---

### Phase 7 — Sarvam AI Multilingual Integration

**What gets built:** An AI-powered investigation assistant that can explain flagged transactions in English, Tamil, Hindi, Telugu, Kannada, and Bengali, while going through the DPDP consent process for every call.

The Copilot page lets any authorised user select a payment, choose a language, type a question in that language, and receive an explanation grounded in the actual evidence from that payment's record. The AI is explicitly instructed not to invent facts, not to approve or reject anything, and to respond only from the supplied evidence.

The system handles unavailability gracefully. If Sarvam times out (after 4 seconds), returns an unrecognisable response, or is disabled in configuration, the system automatically generates a plain-English explanation from the reason codes in the decision record. This fallback is always labelled clearly as "Rules-based explanation" so the user knows it did not come from the AI. The financial workflow continues regardless — the AI is never in the critical path for a payment decision.

The Copilot page shows the explanation, the recommended next step, whether human review is needed, the list of evidence items used, and the source label (Sarvam AI or rules-based fallback). There are no buttons on this page that perform a financial action. The page is explicitly for understanding, not for acting.

**Exit condition:** Tamil selected, Tamil question typed, Tamil answer returned. DPDP log shows a new entry with Tamil language code.

---

### Phase 8 — Reconciliation and BIS Compliance Dashboard

**What gets built:** Bank statement import and matching, and a live dashboard showing how the system maps to the relevant BIS and ISO standards.

**Reconciliation** lets the accountant upload a bank statement CSV file. The system validates the file format, converts all amounts from decimal rupees to integer paise, and stores each row with a batch ID. It then attempts to match each credit row to an internal payment by comparing the external reference exactly against the provider reference stored in the payment record, and checking the amount matches to the paise. Rows that match are marked MATCHED. Rows where no match is found are UNMATCHED. Rows where more than one candidate matches are AMBIGUOUS. The accountant sees a three-tab view of the results and can mark unmatched rows as reviewed.

The important design distinction here: a bank statement match does not change the payment's accounting record. Matching confirms that a bank debit is aligned with an internal record. It is a verification step, not a posting step.

**BIS Compliance Dashboard** is a live read of the system's own controls, showing how each one maps to a standard. It computes actual figures from the running system — number of QR validations performed, number of Merkle epochs closed, number of DPDP log entries created, number of unbalanced ledger entries (which should always be zero). Each row shows the standard clause, the control name, the current status, and the evidence sentence. A permanent disclaimer at the bottom clarifies that this is a standards-informed prototype, not a certified system.

**Exit condition:** Seeded CSV produces 2 matched and 1 unmatched row. BIS dashboard shows all controls with live evidence figures.

---

### Phase 9 — Polish and Demo Readiness

**What gets built:** Visual completeness across all pages, and a frozen, reliable demo that runs end-to-end in under three minutes.

Every page must have: a SIMULATION MODE banner, proper number formatting in Indian style (lakhs, not thousands), colour-coded status badges, loading skeletons while data is fetching, empty state messages when tables are empty, and error cards with retry buttons when API calls fail.

The Transaction Explorer — the single-payment detail view — is the most important page for the demo. It shows a vertical timeline of every event in the payment's lifecycle, from creation through provider confirmation, ledger posting, and reconciliation. Below the timeline are three separate status indicators: Payment Status, Ledger Status, and Reconciliation Status. These are always shown independently because the system treats them as separate states. A payment can be provider-confirmed but not yet reconciled. That distinction is meaningful and visible.

The navigation adapts by role. Residents only see their own areas. The auditor sees everything but all action buttons are hidden.

Ten specific demo scenarios must run without errors: successful payment, duplicate callback rejection, graph fraud scenario, two QR failure scenarios, Merkle proof, Tamper Test, Tamil AI query, DPDP log visibility, reconciliation match, and BIS compliance dashboard. All ten are validated before the demo is frozen.

**Exit condition:** All ten scenarios run cleanly, back to back, in under three minutes.

---

## What Is Out of Scope

The following features are explicitly not part of this build. They are listed here so that anyone extending this system — human or AI — does not mistake their absence for an oversight.

- Fuzzy bank reconciliation (matching by approximate amount and date when the reference does not match exactly).
- A full reviewer resolution workflow with notes, history, and multi-step approval.
- Real payment gateway integration — the simulator is the only provider.
- Visitor management, amenity booking, community notices, vendor procurement, or any other society management feature.
- Multi-society administration or separate login per society.
- Machine learning models or predictive fraud scoring — all anomaly detection is rule-based and graph-structural.
- Production deployment infrastructure — no Docker, no Kubernetes, no CI/CD pipeline.
- Claims of BIS certification or full regulatory compliance.

---

## The Demo Flow — Three Minutes

This is the intended sequence for the live demonstration. Each beat corresponds to one of the four innovations, preceded by a context-setting introduction.

**0:00–0:25 — The Problem and the Dashboard**  
Open the dashboard. Show the collection summary, outstanding dues, pending payments, and flagged anomalies. Narrate that Indian housing societies manage crores across disconnected workflows with no common source of truth. Introduce Mosaic as India's first BIS IS 19671-aligned society payment intelligence platform.

**0:25–0:55 — Normal Payment Flow**  
Open Flat 4B's unpaid invoice. Initiate a payment. Simulate a success. Show the double-entry ledger posting — debits equal credits to the paise. Open the transaction trace and show the timeline from initiation to posted. Narrate: deterministic code controls the financial record. The AI never touched this.

**0:55–1:25 — Payment Knowledge Graph**  
Navigate to the Payment Graph. Show the clean star topology — all residents routing to the society's registered VPA. Press the fraud scenario button. Six residents' payments reroute to the attacker address. The graph reconfigures. The attacker node turns red. The anomaly panel shows the finding: six payers, unregistered VPA, structural anomaly detected. Narrate: this is not a rule that fired. This is the shape of the network changing.

**1:25–1:50 — BIS IS 19671 QR Validation**  
Navigate to QR Guard. Select the wrong-payee scenario. Show the compliance panel: payee address check fails, Clause 5.3 — Payee Authentication cited, overall verdict BLOCK_REVIEW. Switch to wrong-currency scenario: Clause 6.1 fires. Narrate: IS 19671:2026 is India's standard for code-scanning payment security. We do not guess. We cite.

**1:50–2:15 — Merkle Proof**  
Go to the transaction trace for the earlier successful payment. Click "Prove This Happened." The Merkle tree renders — leaf node, sibling hashes, path to root, all in green. Press Tamper Test. The tree turns red. Narrate: this proves the record existed in this exact form at the time of the epoch. Any change breaks the proof. This satisfies IS/ISO/IEC 27001 Control A.8.15 with mathematics.

**2:15–2:40 — Multilingual AI and DPDP**  
Open the Copilot. Select Tamil. Ask why the payment was flagged. Sarvam responds in Tamil. Switch to the DPDP Panel. Show the access log entry: AI context included, Tamil language code, fields accessed listed, no PII in the evidence bundle. Switch to the resident's My Data page — they can see the same entry. Narrate: every data access is logged under the DPDP Act 2023. The AI sees only what it needs. The resident sees what you did.

**2:40–3:00 — Close**  
Return to the dashboard. Narrate: Mosaic shows where money went, proves it got there, catches manipulation in the network, validates every QR against a published standard, and does all of this in the user's own language — while keeping every resident's data protected under Indian law. The financial record is deterministic. The intelligence is explainable. The audit is mathematical.

---

## Closing Statement

> *"Mosaic is the only platform today that cites a BIS standard by clause number, proves a payment happened with a Merkle path, detects fraud as a graph structural anomaly, and explains it to you in Tamil — while keeping every resident's data protected under the DPDP Act 2023."*
