# pay.iai.one Architecture

## Core Positioning

`pay.iai.one` is a central payment orchestration service for all IAI sites and subdomains. It should expose one internal API to the ecosystem while adapting to many external payment providers.

This service must be private infrastructure, not a marketing site. The product surface is:

- hosted checkout session creation
- payment link creation
- provider redirect and return handling
- webhook verification and event reconciliation
- refunds
- receipts and payment email
- audit logs
- tenant and site isolation

## Hard Boundary

Do not build a self-hosted card vault.

The safe architecture is:

1. `pay.iai.one` owns the orchestration, order state, receipt state, tenant mapping, and provider abstraction.
2. Licensed PSPs own card collection, wallet authorization, banking rails, and PCI-heavy flows.
3. `pay.iai.one` never stores raw PAN, CVV, or full sensitive authentication data.

## Runtime Shape

- `pay.iai.one` API: Cloudflare Worker on `pay.iai.one`
- transactional state: Cloudflare D1
- async dispatch: Cloudflare Queues
- payment mail for receipt and checkout status: internal SMTP
- non-payment system mail can remain on a separate provider if needed
- admin access later: Cloudflare Access or a separate internal console

## Multi-Tenant Model

One tenant can own many websites:

- `iai.one`
- `app.iai.one`
- `docs.iai.one`
- `nguyenlananh.com`
- future brand sites

Each site gets:

- `site_code`
- `allowed_origin`
- return and cancel URLs
- a hashed site API key
- optional site-level webhook secret

## Recommended API Shape

Public internal endpoints for the ecosystem:

- `POST /v1/checkout/sessions`
- `GET /v1/payments/:payment_intent_id`
- `POST /v1/refunds`
- `POST /v1/payment-links`
- `GET /v1/providers`
- `GET /health`
- `GET /v1/payments/:internal_order_id`

Provider-facing endpoints:

- `POST /v1/webhooks/payos/:tenant_code`
- `POST /v1/webhooks/momo/:tenant_code`
- `POST /v1/webhooks/zalopay/:tenant_code`
- `POST /v1/webhooks/vnpay/:tenant_code`

## Payment Lifecycle

1. Calling site creates a checkout session on `pay.iai.one`.
2. `pay.iai.one` validates tenant, site, amount, currency, return URLs, and idempotency.
3. Adapter creates provider checkout.
4. Provider sends buyer through hosted payment flow.
5. Buyer returns to site return URL.
6. Provider webhook hits `pay.iai.one`.
7. `pay.iai.one` verifies signature, records event, reconciles order state, and emits internal event.
8. Receipt and downstream fulfillment are queued asynchronously.
9. Payment mail is only considered migrated after provider action logs, SMTP `messageId`, D1 evidence, and inbox proof exist.

## Storage Model

D1 stores:

- tenants
- merchant sites
- provider account metadata
- hashed internal API keys
- customers
- payment intents
- payment attempts
- provider events
- refunds
- email receipts
- idempotency keys
- audit logs

Secrets do not belong in D1. Provider credentials must live in runtime secrets.

## Security Model

- site calls authenticated with internal API key or signed server request
- idempotency required on all write routes
- webhook signatures verified before state transition
- manual review default for refunds and chargeback-sensitive actions
- no inline raw-card capture in phase 1
- queue-based retries for email and reconciliation jobs

## Domestic Launch Order

1. `payOS` for the fastest bank-transfer and QR launch
2. `MoMo` for wallet and recurring depth
3. `ZaloPay` for local wallet reach
4. `VNPay` for broad domestic banking and QR coverage

## International Later

`PayPal` and `Stripe` should be plugged in after domestic launch is stable, not before.
