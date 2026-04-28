# pay.iai.one epic A parent issue for Linear

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

Title:

`Epic A: Internal payment core`

Description:

Build and prove the private payment core for `pay.iai.one` so internal system websites can create checkout sessions, persist payment state, verify provider webhooks, and produce real payment email evidence.

This epic is the first production lane for `pay.iai.one`. It is intentionally narrow: private runtime only, no public homepage, no public wallet launch, no autonomous payout execution.

Scope:

- production D1 bind and schema proof
- `payOS` runtime truth
- internal checkout hardening
- webhook verification and persistence
- internal SMTP payment evidence chain

Child issues:

- `A1: Bind PAYMENTS_DB and prove production schema readiness`
- `A2: Set payOS runtime secrets and make provider readiness truthful`
- `A3: Harden internal checkout routes and idempotent payment creation`
- `A4: Verify payOS webhook and persist normalized provider events`
- `A5: Deliver payment email through internal SMTP with full evidence chain`

Execution order:

1. A1
2. A2
3. A3
4. A4
5. A5

Safe overlap:

- A3 and A4 may overlap after A2 is materially real
- A5 must remain blocked until A4 is proven and provider readiness is true

Non-goals:

- public homepage
- public self-serve merchant onboarding
- public wallet launch
- crypto support
- automated payout approval

Dependencies:

- Cloudflare production account access
- live or sandbox `payOS` credentials
- internal SMTP runtime
- verified sender mailboxes for `pay@iai.one` and/or `billing@iai.one`

Done when:

- one internal website passes end-to-end payment flow
- checkout creation is authenticated and idempotent
- webhook verification is real and persisted
- payment DB evidence is queryable
- payment email is delivered through internal SMTP with `messageId`, D1 evidence, and inbox proof
- runtime truth does not overstate readiness

Evidence pack required before closing epic:

- production `GET /health` JSON
- `/v1/providers` runtime truth
- one successful checkout request and response
- one verified provider webhook trace
- DB evidence for `payment_intents`, `payment_attempts`, and `provider_events`
- email evidence for `email_receipts` and `email_delivery_evidence`
- inbox proof for one payment email

Notes:

- do not mark Epic A done if provider is still `not ready`
- do not mark Epic A done if email only reached `queued`
- do not mark Epic A done from console logs alone

Linked docs:

- `plans/25-pay-iai-one-technical-backlog-by-lane.md`
- `plans/26-pay-iai-one-epic-a-issue-checklist.md`
- `plans/27-pay-iai-one-epic-a-linear-copy-ready.md`
