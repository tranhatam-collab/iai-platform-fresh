# pay.iai.one epic A issue checklist

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## Purpose

This file expands Epic A from `plans/25-pay-iai-one-technical-backlog-by-lane.md` into concrete issues that the team can create and execute immediately.

For the short copy-ready Linear version, use `plans/27-pay-iai-one-epic-a-linear-copy-ready.md`.

Epic A scope:

- internal payment core
- provider runtime truth
- checkout stability
- webhook truth and persistence
- payment email evidence chain

## Execution order

Default order:

1. A1
2. A2
3. A3
4. A4
5. A5

Safe overlap:

- `A3` and `A4` may overlap after `A2` is stable
- `A5` should not be closed before `A4` is proven and payment provider is actually ready

## A1: `PAYMENTS_DB` bind and schema proof

Suggested title:

`A1: Bind PAYMENTS_DB and prove production schema readiness`

Goal:

- move from "DB binding may exist" to "schema is definitely applied and queryable"

Depends on:

- production Cloudflare account access
- D1 database ids already created

Blocks:

- A2
- A3
- A4
- A5

Checklist:

- [ ] bind `PAYMENTS_DB` in production worker config
- [ ] bind preview or staging database for non-production runtime
- [ ] apply `database/0001_init.sql`
- [ ] apply `database/0002_internal_smtp_evidence.sql`
- [ ] verify expected tables exist in remote D1:
  - `payment_intents`
  - `payment_attempts`
  - `provider_events`
  - `service_api_keys`
  - `email_receipts`
  - `email_delivery_evidence`
  - `idempotency_keys`
- [ ] extend `/health` or adjacent proof route so runtime can prove:
  - `db_bound`
  - `db_ready`
  - `schema_ready`
  - optional table or migration proof
- [ ] redeploy worker with updated D1 binding
- [ ] capture health JSON after deploy

Technical notes:

- current `health` only proves binding presence and mission metadata
- team should add real schema proof, not just `Boolean(env.PAYMENTS_DB)`
- remote D1 verification must be done against the live account database, not local-only

Acceptance criteria:

- `GET /health` proves DB binding and schema readiness
- remote D1 query confirms required tables exist
- worker is redeployed with correct production binding

Evidence to attach to the issue:

- `wrangler.jsonc` binding snippet
- output of remote table query
- production `GET /health` JSON

Out of scope:

- provider secrets
- checkout testing
- email flow proof

## A2: `payOS` secrets and provider health truth

Suggested title:

`A2: Set payOS runtime secrets and make provider readiness truthful`

Goal:

- make runtime provider status reflect real `payOS` readiness instead of placeholder configuration

Depends on:

- A1 completed

Blocks:

- A3
- A4
- A5

Checklist:

- [ ] set `PAYOS_CLIENT_ID`
- [ ] set `PAYOS_API_KEY`
- [ ] set `PAYOS_CHECKSUM_KEY`
- [ ] confirm `PAY_ENV`
- [ ] confirm `PAY_API_BASE_URL`
- [ ] verify no placeholder or stale `payOS` values remain in runtime
- [ ] ensure `/v1/providers` and any readiness response do not imply `ready` when env is missing
- [ ] run one provider connectivity check that proves runtime can call `payOS`
- [ ] verify failure mode is clean if provider rejects payload or credentials
- [ ] capture provider readiness evidence

Technical notes:

- truth matters more than optimistic status labels
- if credentials are missing or invalid, the runtime should say so clearly
- do not claim provider ready until real request path is validated

Acceptance criteria:

- `payOS` credentials exist in runtime
- provider route returns real runtime truth
- one real connectivity check against `payOS` succeeds or fails with a meaningful provider-derived error

Evidence to attach to the issue:

- redacted secret inventory proof
- `/v1/providers` response
- one connectivity or dry-run result with timestamp

Out of scope:

- webhook capture flow
- email proof

## A3: internal checkout hardening

Suggested title:

`A3: Harden internal checkout routes and idempotent payment creation`

Goal:

- make internal checkout creation stable, authenticated, idempotent, and traceable

Depends on:

- A1 completed
- A2 completed

Blocks:

- A4 partly
- A5

Checklist:

- [ ] harden `POST /internal/checkout-session`
- [ ] harden `POST /api/v1/checkout/session`
- [ ] enforce required auth header and scope on internal write routes
- [ ] enforce `x-idempotency-key` on all relevant create flows
- [ ] persist request result in idempotency store
- [ ] ensure duplicate idempotent requests return stable response
- [ ] normalize provider-facing validation errors into stable internal error codes
- [ ] persist:
  - `payment_intent`
  - `payment_attempt`
  - provider order reference
  - checkout URL if returned
- [ ] preserve tenant, site, locale, success, cancel, and retry context
- [ ] verify `GET /v1/payments/:internal_order_id` can inspect created payment state

Technical notes:

- create flow must be safe under retries
- response shape should stay stable for internal consumers
- this issue should not rely on manual DB patching for normal success paths

Acceptance criteria:

- one internal consumer can create a checkout session successfully
- repeating the same request with the same idempotency key does not duplicate money intent state
- created payment is queryable by internal order id

Evidence to attach to the issue:

- request and response pair for successful checkout creation
- duplicate idempotency replay proof
- DB evidence for `payment_intents` and `payment_attempts`

Out of scope:

- provider webhook processing
- payment email delivery proof

## A4: webhook verification and persistence

Suggested title:

`A4: Verify payOS webhook and persist normalized provider events`

Goal:

- make provider webhook intake trustworthy, replay-safe, and visible in persistence

Depends on:

- A1 completed
- A2 completed
- A3 mostly complete

Blocks:

- A5

Checklist:

- [ ] verify `payOS` webhook signature using runtime secret
- [ ] reject invalid signature or malformed payload cleanly
- [ ] persist raw provider event in `provider_events`
- [ ] persist normalized event fields needed for internal processing
- [ ] update related `payment_attempt` and `payment_intent` state
- [ ] protect against duplicate webhook event processing
- [ ] make webhook handling retry-safe
- [ ] make successful event traceable from:
  - provider event id
  - provider order id
  - internal order id
- [ ] provide replay or inspection path for failed webhook processing

Technical notes:

- provider event should be written before downstream side effects
- duplicate webhook should not duplicate fulfillment or email
- webhook pass means real verified signature, not simulated console success

Acceptance criteria:

- one real or sandbox `payOS` webhook is verified successfully
- event is written to `provider_events`
- payment status updates correctly from webhook truth
- duplicate webhook does not produce duplicate state transitions

Evidence to attach to the issue:

- provider webhook payload reference
- signature verification proof
- DB row from `provider_events`
- DB state change in `payment_intents` or `payment_attempts`

Out of scope:

- final payment receipt delivery proof

## A5: receipt evidence chain

Suggested title:

`A5: Deliver payment email through internal SMTP with full evidence chain`

Goal:

- close the loop from real payment state to real payment email evidence

Depends on:

- A1 completed
- A2 completed
- A3 completed
- A4 completed
- internal SMTP runtime available

Checklist:

- [ ] route payment mail flows through internal SMTP:
  - `payment_receipt`
  - `checkout_status_update`
  - `renewal_or_failure_notice`
- [ ] use allowed sender only:
  - `pay@iai.one` or
  - `billing@iai.one`
- [ ] capture SMTP `messageId`
- [ ] write D1 evidence row for email receipt
- [ ] write D1 delivery evidence row for transport result
- [ ] verify inbox delivery with real inbox proof
- [ ] ensure payment email is not marked migrated if:
  - provider is not ready
  - email is only queued
  - there is no inbox proof
- [ ] attach payment reference and email evidence to the same payment trail

Technical notes:

- console log is not proof
- queued mail is not proof
- this issue is not done until inbox confirmation exists

Acceptance criteria:

- one real or sandbox payment action produces one real payment email
- email has SMTP `messageId`
- D1 evidence exists
- inbox proof exists

Evidence to attach to the issue:

- payment intent id
- provider payment reference
- `messageId`
- `email_receipts` row proof
- `email_delivery_evidence` row proof
- inbox screenshot or equivalent confirmation

Out of scope:

- public marketing email
- non-payment transactional mail

## Epic A close criteria

Epic A is done only when all of the following are true:

- A1 through A5 are individually done
- one internal website passes end-to-end payment flow
- checkout, webhook, DB evidence, and payment email all line up under one traceable payment record
- runtime truth does not overstate readiness

## Suggested first move today

Create and assign the issues in this order:

1. A1
2. A2
3. A3
4. A4
5. A5

Start implementation immediately with A1 and do not open A3 as "in progress" until A2 is materially real.
