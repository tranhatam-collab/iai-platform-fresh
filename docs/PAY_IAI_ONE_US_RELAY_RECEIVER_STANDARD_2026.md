PAY_IAI_ONE_US_RELAY_RECEIVER_STANDARD_2026.md

Version 1.0

Status: Locked Working Standard

Scope: United States USD receiving account for pay.iai.one

Owner: Founder / Team D / Team B Pay Runtime / Team Email SMTP

Receiver entity: Angel Edu Tam Foundation Inc

Provider surface: Relay Financial

Partner bank: Thread Bank

⸻

0. Purpose

This file locks the United States USD receiver standard for pay.iai.one.

It exists so Team D, Team B, and all website teams know:

* which US organization receiver exists
* what rails are allowed
* what details may be shared with trusted payers
* what must not be inferred
* when the receiver may be attached to a website
* why this receiver must stay unassigned until Founder maps it to a domain

⸻

1. Receiver identity

receiver_id: recv_usd_angeledutam_foundation_relay_thread

entity_type: organization

legal_payee_name: Angel Edu Tam Foundation Inc

currency: USD

country: US

bank_provider: Relay Financial

partner_bank_name: Thread Bank

account_number: 200001161269

routing_number: 064209588

bank_address: 210 E Main St, Rogersville, TN 37857

status: ACTIVE_CONFIRMED

assignment_status: HOLD_NOT_ASSIGNED

public_render_status: INTERNAL_ONLY_UNTIL_FOUNDER_ASSIGNMENT

⸻

2. Source basis

Founder-provided source:

* Relay account screenshot from app.relayfi.com
* Payee Name: Angel Edu Tam Foundation Inc
* Account Number: 200001161269
* Routing Number: 064209588
* Bank Name: Thread Bank
* Bank Address: 210 E Main St, Rogersville TN 37857

Relay documentation checked:

* Relay account/routing instructions:
  * https://support.relayfi.com/hc/en-us/articles/360038418412-Viewing-Your-Account-and-Routing-Numbers
* Relay ACH receiving instructions:
  * https://support.relayfi.com/hc/en-us/articles/38047976512532-Receiving-an-ACH
* Relay domestic wire receiving instructions:
  * https://support.relayfi.com/hc/en-us/articles/11638732752020-Receiving-a-domestic-wire
* Relay international wire receiving instructions:
  * https://support.relayfi.com/hc/en-us/articles/38047992667412-Receiving-an-international-wire
* Relay Thread Bank address:
  * https://support.relayfi.com/hc/en-us/articles/11628613627668-What-is-Thread-Bank-s-address

Operational interpretation:

* account and routing numbers are valid receiver details only for the relevant Relay account
* payer name must match the business name, beneficial owner, or accepted DBA shown in Relay
* bank name/address must use Thread Bank when payer requires bank details
* international wire details must be copied from the Relay International Wires screen and cannot be inferred from the ACH routing number

⸻

3. Supported receiving rails

3.1 US ACH

Allowed after domain assignment.

Required payer details:

* Payee / beneficiary: Angel Edu Tam Foundation Inc
* Account number: 200001161269
* Routing number: 064209588
* Bank name if required: Thread Bank
* Bank address if required: 210 E Main St, Rogersville, TN 37857
* Payment memo/reference: site code, invoice id, package code, or order id

Use for:

* US domestic bank transfers
* invoice settlement
* organization payments
* non-card manual payment fallback

3.2 US domestic wire

Allowed after domain assignment.

Required payer details:

* Payee / beneficiary: Angel Edu Tam Foundation Inc
* Account number: 200001161269
* Routing number: 064209588
* Bank name: Thread Bank
* Bank address: 210 E Main St, Rogersville, TN 37857
* Payment memo/reference: site code, invoice id, package code, or order id

Use for:

* larger organization payments
* urgent USD transfers inside the United States
* payer workflows that require wire transfer instead of ACH

3.3 International wire

Not fully enabled by this file.

Rule:

Do not use ACH routing details as international wire details.

Required before live use:

* Relay international wire receiving must be enabled for the account
* exact USD SWIFT receiving details must be copied from Relay dashboard
* beneficiary address must be confirmed
* SWIFT/BIC and any intermediary bank details must be recorded
* Team D must update the receiver evidence packet

Status:

INTERNATIONAL_WIRE_DETAILS_PENDING

3.4 Check deposit or other Relay receiving methods

Not customer-facing by default.

May be documented later if Founder approves a site-specific use case.

⸻

4. Assignment rule

This receiver is not assigned to any website yet.

Current state:

* default_for_domains: none
* domain assignment: HOLD_NOT_ASSIGNED
* public render: forbidden

Founder must assign:

domain
→ currency
→ receiver_id
→ rail
→ priority

Example future assignment format:

```text
domain: example.com
currency: USD
primary_usd_receiver: recv_usd_angeledutam_foundation_relay_thread
allowed_rails:
- US_ACH
- US_DOMESTIC_WIRE
fallback_usd_receiver: TBD
```

⸻

5. Render rule

Before assignment:

* do not render public account details
* do not show account number
* do not show routing number
* do not show bank transfer block
* keep receiver visible only in internal registry docs and admin/operator context

After assignment:

Public payment block must show:

* Pay in USD by US bank transfer
* Payee name
* Bank name
* Account number
* Routing number
* Bank address if required
* Payment memo/reference instruction
* support contact

Do not show:

* internal source notes
* founder comments
* screenshot references
* unconfirmed SWIFT information

⸻

6. Security and compliance guardrails

Do not:

* hard-code this account into any website component
* expose this receiver in public UI before domain assignment
* use it for VND payments
* use it as a replacement for PayPal Checkout or provider checkout
* infer SWIFT/BIC from routing number
* use it for international wire unless Relay provides exact details
* assign it to a domain without Founder instruction

Must:

* use centralized receiver registry
* use domain assignment map
* require payment reference for reconciliation
* notify payment events to domain email triplet after activation
* keep Team D evidence updated

⸻

7. Current pay.iai.one implementation state

Runtime registry status:

* receiver exists in pay runtime registry
* receiver count includes this receiver
* assignment status is HOLD_NOT_ASSIGNED
* public registry snapshot redacts sensitive account and routing details while unassigned
* no domain currently resolves to this receiver

Operational status:

* receiver is ready for internal assignment planning
* receiver is not ready for public website render
* receiver is not live for any website yet

⸻

8. Team instructions

Team D:

* keep this receiver in intake planning for future USD organization assignments
* do not move any site to READY_FOR_LIVE using this receiver until Founder maps it
* collect site-specific memo/reference requirements when assignment happens

Team B Pay Runtime:

* keep receiver in centralized registry
* keep unassigned receiver details redacted from public registry snapshot
* only expose full target through resolved payment routing after Founder assignment

Team Email SMTP:

* no immediate action until a domain is assigned
* when assigned, prepare `pay@domain`, `billing@domain`, and `support@domain` notification path

Team 1:

* treat this as receiver registry update only
* do not treat it as production payment gate completion

⸻

9. Final statement

Angel Edu Tam Foundation Inc now has a locked United States USD receiver standard for pay.iai.one.

It is available for future website assignment, but no website may use it publicly until Founder assigns the domain and Team D completes activation evidence.
