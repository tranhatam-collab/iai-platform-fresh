# pay.iai.one

## Tenant-scoped PayOS production credentials

Live PayOS checkout and webhook verification are fail-closed per tenant. A tenant can transact only when its `provider_accounts` row has:

- `provider_code = 'payos'`
- `status = 'active'`
- `live_mode = 1`
- a non-empty `merchant_reference`
- a validated uppercase `secret_binding_prefix`

For prefix `NLA_PAYOS`, provision Worker secrets `NLA_PAYOS_CLIENT_ID`, `NLA_PAYOS_API_KEY`, and `NLA_PAYOS_CHECKSUM_KEY` through the secure Cloudflare channel. `NLA_PAYOS_PARTNER_CODE` is optional. The checkout and webhook paths never fall back to global `PAYOS_*` credentials when tenant mapping is missing or incomplete.

Central payment orchestration service for the IAI ecosystem.

`pay.iai.one` is not an acquiring bank or a raw card vault. It is a private payment layer that gives every site in the system one API, one event model, one receipt pipeline, and one security baseline while routing transactions to licensed payment providers.

## What This Project Is For

- One shared checkout and payment API for all IAI websites and subdomains.
- Domestic Vietnam payments first: bank transfer, QR, wallet, domestic card rails, hosted checkout, webhook callbacks, and merchant API flows.
- International providers later without rebuilding every site.
- Unified receipts, audit logs, refund workflow, idempotency, and webhook verification.
- Strong security by design: do not store PAN, CVV, or raw card data.

## Launch Strategy

Phase 1 domestic-first provider order:

1. `payOS`
2. `MoMo`
3. `ZaloPay`
4. `VNPay`

Phase 2 international:

1. `PayPal`
2. `Stripe`

## Stack

- Cloudflare Workers for the API runtime
- Cloudflare D1 for transactional state
- Cloudflare Queues for async jobs and webhook retries
- Internal SMTP for payment mail
- Separate system-mail provider if needed
- Hosted checkout and provider tokenization to keep PCI scope small

## Project Layout

```txt
pay.iai.one/
  database/
    0001_init.sql
    0002_internal_smtp_evidence.sql
    0003_ledger_v1.sql
  docs/
    ARCHITECTURE.md
    EMAIL_DELIVERY_POLICY.md
    EXECUTION_PLAN.md
    ONBOARDING_CHECKLIST.md
    PROVIDER_RESEARCH.md
    SECURITY.md
  plans/
    23-pay-iai-one-internal-payment-contract.md
    24-pay-iai-one-super-wallet-platform-roadmap.md
    25-pay-iai-one-technical-backlog-by-lane.md
    26-pay-iai-one-epic-a-issue-checklist.md
    27-pay-iai-one-epic-a-linear-copy-ready.md
    28-pay-iai-one-epic-a-parent-linear.md
    29-pay-iai-one-a1-wrangler-copy-ready.md
    30-pay-iai-one-epic-b-issue-checklist.md
    31-pay-iai-one-epic-b-linear-copy-ready.md
    32-pay-iai-one-epic-b-parent-linear.md
    33-pay-iai-one-b1-ledger-schema-v1-migration-plan.md
  src/
    index.ts
    lib/
      http.ts
      providers.ts
  .dev.vars.example
  package.json
  tsconfig.json
  wrangler.jsonc
```

## Current Status

- Project scaffolded
- Architecture, provider research, security baseline, and rollout plan written
- Worker health and provider registry endpoints created
- D1 schema drafted for multi-tenant payment orchestration
- Ledger schema v1 migration scaffolded in `database/0003_ledger_v1.sql`
- `payOS` checkout adapter scaffolded with webhook verification helpers
- Về Tương Lai outbound member webhook dispatch is now wired to successful payOS capture events
- Internal contract doc now lives in `plans/23-pay-iai-one-internal-payment-contract.md`
- Internal platform roadmap now lives in `plans/24-pay-iai-one-super-wallet-platform-roadmap.md`
- Technical backlog by lane now lives in `plans/25-pay-iai-one-technical-backlog-by-lane.md`
- Epic A issue checklist now lives in `plans/26-pay-iai-one-epic-a-issue-checklist.md`
- Epic A Linear copy-ready issues now live in `plans/27-pay-iai-one-epic-a-linear-copy-ready.md`
- Epic A parent issue copy-ready now lives in `plans/28-pay-iai-one-epic-a-parent-linear.md`
- A1 wrangler copy-ready checklist now lives in `plans/29-pay-iai-one-a1-wrangler-copy-ready.md`
- Epic B issue checklist now lives in `plans/30-pay-iai-one-epic-b-issue-checklist.md`
- Epic B Linear copy-ready issues now live in `plans/31-pay-iai-one-epic-b-linear-copy-ready.md`
- Epic B parent issue copy-ready now lives in `plans/32-pay-iai-one-epic-b-parent-linear.md`
- B1 ledger schema v1 migration plan now lives in `plans/33-pay-iai-one-b1-ledger-schema-v1-migration-plan.md`
- Về Tương Lai Team 1 handoff now lives in `docs/VETUONGLAI_TEAM1_HANDOFF.md`
- `/docs`, `/openapi.json`, and `/internal/checkout-session` are now first-class routes
- `/api/v1/checkout/session` is now reserved for the Về Tương Lai checkout brief
- Ready for trusted internal consumers, with payOS-first/VND/one_time constraints and mandatory API-key auth clearly documented
- Nhà Chung's four-SKU catalog contract is locked in `config/nhachung-catalog.json` with a local gate, but live subscription checkout remains blocked until a subscription-capable rail is provisioned

## Local Development

```bash
cd '/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh/pay.iai.one'
npm install
npm run dev
```

Health endpoints:

- `GET /`
- `GET /health`
- `GET /v1/providers`
- `GET /docs`
- `GET /openapi.json`
- `POST /internal/checkout-session`
- `POST /api/v1/checkout/session`
- `GET /v1/security/baseline`
- `POST /v1/providers/payos/confirm-webhook`
- `GET /v1/providers/payos/payment-requests/:id`
- `POST /v1/providers/payos/payment-requests/:id/cancel`
- `POST /v1/webhooks/payos/:tenant_code`
- `GET /v1/payments/:internal_order_id`

Contract gates:

- `npm run check:nhachung-catalog`

## Security Principles

- Never collect or store raw card number or CVV on `pay.iai.one`.
- Use provider-hosted checkout or tokenized provider components.
- Verify every webhook signature before fulfillment.
- Use idempotency keys on write operations.
- Separate public site API keys from provider credentials.
- Keep provider secrets in runtime secrets, not in D1.

## Deploy Readiness

Before the first real dev link can go live on `pay.iai.one`, the production account that owns `iai.one` still needs:

- Cloudflare Workers and D1 access for the account that owns `iai.one`
- one D1 database bound as `PAYMENTS_DB`
- runtime secrets for `payOS` and email
- runtime secret for `PAY_IAI_ONE_WEBHOOK_SECRET`
- custom domain binding for `pay.iai.one`

The exact sequence now lives in `docs/CLOUDFLARE_DEPLOY_RUNBOOK.md`.

## Next Build Target

The next implementation target is a production-grade `payOS` adapter with:

- create checkout session
- return/cancel handling
- webhook verification
- member webhook dispatch for successful Về Tương Lai captures
- order reconciliation
- receipt dispatch
- tenant/site isolation

The first live adapter surface is now scaffolded for `payOS`.
