# pay.iai.one epic A linear copy-ready issues

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## How to use

Copy one issue block at a time into Linear.

Use this file when the team needs short issue text.

Use `plans/26-pay-iai-one-epic-a-issue-checklist.md` when the team needs the longer implementation checklist.

---

## A1

Title:

`A1: Bind PAYMENTS_DB and prove production schema readiness`

Description:

Bind `PAYMENTS_DB` in production, apply D1 schema, and make runtime prove real schema readiness instead of only proving that a binding exists.

Checklist:

- bind `PAYMENTS_DB` in production and preview
- apply `database/0001_init.sql`
- apply `database/0002_internal_smtp_evidence.sql`
- verify remote D1 contains required tables
- extend `GET /health` or adjacent proof route with schema truth
- redeploy worker
- capture post-deploy health JSON

Done when:

- production runtime proves `db_bound` and `schema_ready`
- remote D1 query confirms required tables exist
- worker is redeployed with the correct D1 binding

Evidence:

- binding snippet
- remote D1 table query output
- production `GET /health` JSON

---

## A2

Title:

`A2: Set payOS runtime secrets and make provider readiness truthful`

Description:

Set `payOS` runtime secrets and make provider status reflect real runtime truth, not placeholder configuration.

Checklist:

- set `PAYOS_CLIENT_ID`
- set `PAYOS_API_KEY`
- set `PAYOS_CHECKSUM_KEY`
- confirm `PAY_ENV`
- confirm `PAY_API_BASE_URL`
- verify runtime does not overstate provider readiness
- run one real provider connectivity check
- capture provider readiness evidence

Done when:

- `payOS` secrets exist in runtime
- provider readiness response is truthful
- one real connectivity check succeeds or fails with a meaningful provider-derived error

Evidence:

- redacted secret inventory proof
- `/v1/providers` response
- connectivity or dry-run result with timestamp

---

## A3

Title:

`A3: Harden internal checkout routes and idempotent payment creation`

Description:

Harden internal checkout creation so requests are authenticated, idempotent, traceable, and safe under retries.

Checklist:

- harden `POST /internal/checkout-session`
- harden `POST /api/v1/checkout/session`
- require auth and scope on internal write routes
- require `x-idempotency-key`
- persist idempotency results
- ensure duplicate requests do not duplicate payment state
- normalize provider validation errors
- persist `payment_intent` and `payment_attempt`
- preserve tenant, site, locale, success, cancel, and retry context
- verify `GET /v1/payments/:internal_order_id`

Done when:

- one internal consumer can create checkout successfully
- same idempotency key does not create duplicate money intent state
- created payment is queryable by internal order id

Evidence:

- successful checkout request and response
- duplicate replay proof
- DB evidence for `payment_intents` and `payment_attempts`

---

## A4

Title:

`A4: Verify payOS webhook and persist normalized provider events`

Description:

Verify `payOS` webhook signatures, persist raw and normalized provider events, and update payment state safely under duplicate and retry conditions.

Checklist:

- verify webhook signature with runtime secret
- reject invalid signature cleanly
- persist raw event in `provider_events`
- persist normalized event fields
- update `payment_attempt` and `payment_intent`
- protect against duplicate event processing
- make webhook flow retry-safe
- provide replay or inspection path for failures

Done when:

- one real or sandbox webhook is verified successfully
- event is written to `provider_events`
- payment state updates from webhook truth
- duplicate webhook does not duplicate state transitions

Evidence:

- webhook payload reference
- signature verification proof
- `provider_events` row
- related payment state change

---

## A5

Title:

`A5: Deliver payment email through internal SMTP with full evidence chain`

Description:

Close the payment loop by sending payment mail through internal SMTP and capturing full evidence: `messageId`, DB rows, and inbox proof.

Checklist:

- route `payment_receipt` through internal SMTP
- route `checkout_status_update` through internal SMTP
- route `renewal_or_failure_notice` through internal SMTP
- use sender `pay@iai.one` or `billing@iai.one`
- capture SMTP `messageId`
- write `email_receipts` evidence
- write `email_delivery_evidence`
- verify inbox delivery with real proof
- do not mark migrated if provider is not ready or email only queued

Done when:

- one real or sandbox payment action produces one real payment email
- email has SMTP `messageId`
- D1 evidence exists
- inbox proof exists

Evidence:

- payment intent id
- provider payment reference
- `messageId`
- `email_receipts` row proof
- `email_delivery_evidence` row proof
- inbox screenshot or equivalent confirmation
