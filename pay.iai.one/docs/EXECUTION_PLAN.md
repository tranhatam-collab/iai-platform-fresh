# pay.iai.one Execution Plan

## Target

Build a private payment platform for all IAI websites under `pay.iai.one`, launching domestic Vietnam payment support first.

For the broader internal-only wallet and treasury direction, see `plans/24-pay-iai-one-super-wallet-platform-roadmap.md`.
For the ordered implementation backlog by lane, see `plans/25-pay-iai-one-technical-backlog-by-lane.md`.

## Phase 0 Foundation

- scaffold project
- define schema
- define provider catalog
- define tenant and site model
- define security baseline
- prepare Cloudflare deployment layout

## Phase 1 Core API

- health route
- provider registry
- tenant auth model
- checkout session contract
- idempotency storage
- audit log writer
- receipt queue contract

## Phase 2 Domestic Launch Adapter 1

`payOS`

- create checkout session
- return and cancel normalization
- webhook verification
- query status fallback
- receipt trigger
- admin replay tooling
- confirm webhook URL against payOS
- cancel payment link support

## Phase 3 Domestic Expansion

`MoMo`, `ZaloPay`, `VNPay`

- adapter contract per provider
- unified refund interface
- failed webhook retry queue
- reconciliation job for missed callbacks

## Phase 4 Internal Platform Integration

- API key issuance per site
- webhook callbacks to first-party sites
- shared receipt templates
- central payment dashboard
- site-level payment policy

## Phase 5 International

- PayPal
- Stripe
- multi-currency policy
- cross-border receipt templates

## Fastest Useful Delivery Path

If speed is the main priority, the fastest practical path is:

1. finish core API
2. implement `payOS`
3. deploy `pay.iai.one`
4. onboard one live tenant
5. add MoMo second

That path gives real domestic payment capability early instead of waiting for every provider to be finished.
