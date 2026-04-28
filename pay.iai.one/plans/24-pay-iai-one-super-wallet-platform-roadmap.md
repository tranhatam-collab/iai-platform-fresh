# pay.iai.one super wallet platform roadmap

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-16

## Why this exists

`pay.iai.one` should stay private and internal-first while it is being completed. In this stage, it is the payment core and API layer for the websites already being developed in the system, not a public homepage product.

This roadmap gives the dev team one clear execution order so the platform can grow from a secure internal payment core into a broader wallet and treasury platform later, without breaking security, compliance, or operational control.

The concrete delivery backlog that follows from this roadmap now lives in `plans/25-pay-iai-one-technical-backlog-by-lane.md`.

## Current product boundary

Right now `pay.iai.one` should be treated as:

- private infrastructure
- checkout and payment orchestration API
- provider event verification and persistence layer
- receipt and payment-status evidence layer
- internal tenant and site auth layer
- future ledger and payout core

Not for this stage:

- public marketing homepage
- public self-serve wallet launch
- public merchant self-onboarding
- raw card capture
- autonomous payout execution without human approval

## North star

Build `pay.iai.one` into the internal financial operating layer for the whole system:

- one payment API for all sites and subdomains
- one internal event model
- one admin and evidence plane
- one ledger source of truth
- one route for VND first, USD next, then wider global rails later
- one future-ready architecture for wallet, treasury, and crypto integration

## Security stance

The team should aim for the highest practical security standard, but must not pretend that any payment system can honestly guarantee literal absolute security.

The correct operating standard is:

- zero-trust by default
- defense in depth
- smallest possible PCI scope
- strict auth and approval controls
- immutable audit trail
- no money movement without evidence

## Non-negotiable rules

1. `pay.iai.one` does not store raw PAN, CVV, or other card secrets.
2. Hosted provider checkout stays the default.
3. Provider secrets live only in runtime secrets, never in D1.
4. Every write route requires auth and idempotency.
5. Every provider webhook must be verified before state changes.
6. Every payment and payout action must create evidence.
7. Refunds and payouts stay human-approved until risk controls mature.
8. AI may assist with evidence and triage, but AI does not approve money movement.

## Product capabilities by stage

## Stage A internal payment core

- internal checkout session creation
- VND collection first
- provider routing
- webhook verification
- receipt pipeline
- payment evidence
- tenant and site API auth
- retry and reconciliation jobs

## Stage B internal ledger and wallet accounting

- wallet accounts per user or merchant
- multi-currency balance model
- pending, available, reserved, and settled states
- double-entry ledger
- internal transfer journal
- reconciliation dashboard

## Stage C controlled payout operations

- payout request API
- admin approval queue
- maker-checker flow
- bank or provider payout integration
- payout receipt and payout evidence

## Stage D broader platform operations

- merchant onboarding
- API key issuance
- webhook endpoint management
- site-level routing rules
- admin RBAC
- support and finance console

## Stage E global and crypto expansion

- USD acceptance
- Stripe and PayPal lanes
- cross-border payouts
- future crypto custody partner integration

## Recommended architecture

## Runtime

- Cloudflare Workers for public API and webhook ingress
- Cloudflare WAF, rate limiting, and Access
- HMAC signatures for internal traffic

## Data

Short-term:

- Cloudflare D1 for payment intents, attempts, provider events, email evidence, API keys, and audit support

Required before serious wallet balances:

- Postgres ledger core for stronger transactional money state
- append-only journal tables
- immutable accounting references

## Concurrency and async

- Durable Objects for serialized wallet or account mutations later
- Cloudflare Queues for retries, webhook replay, reconciliation, receipts, and payout jobs
- workflow orchestration for multi-step payout and settlement sequences

## Evidence and artifacts

- R2 for encrypted evidence packs, statements, and receipt artifacts

## Admin surface

- separate internal admin console behind Cloudflare Access
- no public homepage required until the core is complete

## Core data model

The platform should converge on these entities:

- tenants
- sites
- users
- merchants
- customer_profiles
- service_api_keys
- payment_intents
- payment_attempts
- checkout_sessions
- provider_accounts
- provider_events
- refunds
- payout_requests
- payout_approvals
- wallet_accounts
- wallet_balances
- ledger_accounts
- ledger_entries
- ledger_transfers
- settlements
- reconciliation_cases
- email_jobs
- audit_logs
- webhook_endpoints
- risk_reviews

## Provider strategy

## Domestic first

Recommended internal order:

1. `payOS`
2. `MoMo`
3. `ZaloPay`
4. `VNPay`

Why:

- fast VND launch
- strong QR and bank-transfer coverage
- lower first-step complexity than international expansion

## International second

Recommended later:

1. `Stripe`
2. `PayPal`

These stay phase-later providers, not the current launch gate.

## Crypto later

Do not self-custody first.

When crypto is introduced, use a regulated custody or MPC partner before exposing deposit or withdrawal flows. Crypto should be treated as a separate regulated lane, not a quick extension of the existing fiat checkout path.

## Phase roadmap

## Phase 0 boundary lock and security blueprint

Target: 1 to 2 weeks

Goal:

- lock the core boundary so the team builds private infrastructure first

Deliverables:

- security baseline finalized
- access-control matrix
- provider-credential matrix
- payout approval policy
- incident and key-rotation runbook
- compliance risk register for wallet and crypto future lanes

Done when:

- the team knows exactly who can issue keys, rotate secrets, approve refunds, and approve payouts

## Phase 1 internal payment core MVP

Target: 2 to 4 weeks

Goal:

- stable private payment core for system websites

Scope:

- `payOS` live route
- checkout session API
- provider event persistence
- webhook verification
- success, cancel, retry normalization
- internal SMTP payment receipts
- DB evidence plus inbox proof
- private docs and OpenAPI for internal teams

Done when:

- at least one internal site can create a real checkout
- webhook verification is real
- receipt evidence includes DB row, provider reference, SMTP `messageId`, and inbox proof

## Phase 2 ledger foundation

Target: 4 to 6 weeks

Goal:

- make ledger the money source of truth instead of raw provider state

Scope:

- double-entry journal schema
- balance-state engine
- internal wallet account model for VND and USD
- reconciliation dashboard
- settlement import and review

Done when:

- every payment and refund produces journaled entries
- finance can trace a balance from summary to raw evidence

## Phase 3 controlled payout lane

Target: 4 to 8 weeks

Goal:

- allow outbound money movement under admin control

Scope:

- payout request API
- admin approval queue
- maker-checker enforcement
- payout evidence store
- provider or bank payout adapter
- reconciliation and retry jobs

Rules:

- no autonomous payout
- no production payout without human approval

Done when:

- a payout can be requested, approved, executed, and evidenced end to end

## Phase 4 internal platformization

Target: 4 to 8 weeks

Goal:

- onboard new internal sites without rebuilding the payment core

Scope:

- tenant and site provisioning
- site-level API keys
- webhook endpoint registration
- routing policy
- admin RBAC
- support console

Done when:

- a new internal website can be connected through configuration plus credentials, not custom code surgery

## Phase 5 international rails

Target: 6 to 10 weeks

Goal:

- add USD and global acceptance safely

Scope:

- `Stripe`
- `PayPal`
- USD product catalog
- dispute and chargeback workflow
- cross-border settlement fields

Done when:

- at least one USD checkout and one international payment route work with reconciliation and evidence

## Phase 6 wallet operations with partner-backed model

Target: partner and compliance dependent

Goal:

- expose wallet-like balance operations safely

Scope:

- named balances
- top-up and withdrawal rules
- reserve and freeze controls
- KYC and KYB hooks
- partner-backed settlement model

Important:

- do not expose true stored-value behavior publicly until the legal and provider model is ready

## Phase 7 crypto rails

Target: later, after custody and compliance readiness

Goal:

- enable crypto support through regulated infrastructure

Scope:

- custody partner integration
- deposit address orchestration
- withdrawal approval
- sanctions and chain analytics
- travel-rule workflow where needed

Done when:

- crypto inflow and outflow are screened, auditable, and partner-backed

## Team lanes

The dev team should split the work like this:

1. platform API lane
2. provider integration lane
3. ledger and reconciliation lane
4. admin and operations UI lane
5. security and SRE lane
6. finance evidence lane
7. AI tooling lane

## AI and dev collaboration model

AI should actively support:

- contract drafting
- migration drafting
- integration scaffolding
- replay and smoke-test packs
- receipt evidence packaging
- dashboard scaffolding
- log and incident triage

Human-only approvals:

- production secret entry
- provider contract signing
- payout approval
- policy changes for refund and treasury
- compliance decisions

## Immediate backlog for the current internal-only stage

1. finish `payOS` production runtime and proof checkout
2. finish D1 persistence for intents, attempts, provider events, and email evidence
3. finish internal SMTP evidence chain for payment emails
4. add ledger v1 schema draft now, even before wallet UI is live
5. add payout request and approval schema, still disabled for live execution
6. add admin evidence view for receipts, webhooks, and replay
7. add queue-based reconciliation worker
8. define wallet account API draft for internal use
9. define future provider adapter contracts for `MoMo`, `ZaloPay`, `VNPay`, `Stripe`, and `PayPal`
10. keep public homepage deferred until the core is stable

## What the team should say internally

`pay.iai.one` is currently a private payment core for the websites already under development. It is not yet a public payment product homepage. The immediate mission is to make the internal payment API, provider verification, evidence chain, and future ledger foundation stable. Public-facing wallet positioning comes only after the core, controls, and proof paths are complete.
