# pay.iai.one technical backlog by lane

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## Why this exists

`24-pay-iai-one-super-wallet-platform-roadmap.md` defines direction.

This file turns that direction into a technical execution backlog for the internal-only stage of `pay.iai.one`, with ordered lanes, dependencies, and delivery gates.

## Scope lock for this backlog

This backlog is only for the private core needed by the system websites already in development.

In scope:

- internal payment API
- provider integration
- persistence and evidence
- ledger foundation
- payout foundation under admin control
- admin operations surface
- security controls
- AI-assisted dev and ops tooling

Out of scope for this backlog:

- public homepage
- public self-serve merchant onboarding
- public consumer wallet launch
- crypto custody implementation
- autonomous payout approval

## Delivery logic

The work must move in this order:

1. core API and provider truth
2. evidence and persistence completeness
3. ledger foundation
4. admin evidence surface
5. payout foundation under approval
6. security hardening and release gates
7. AI ops automation around the real system

If a later lane depends on a weaker earlier lane, earlier lane wins.

## Lane map

### Lane 1: core API

Mission:

- make `pay.iai.one` a reliable internal payment entrypoint

Priority order:

1. bind `PAYMENTS_DB` and confirm schema is applied, not only binding present
2. finish `payOS` runtime secrets and live or sandbox-ready provider connectivity
3. harden `POST /internal/checkout-session`
4. harden `POST /api/v1/checkout/session`
5. complete `payOS` checkout create, status fetch, cancel, return normalization, and webhook verification
6. persist normalized payment status transitions
7. add internal replay and idempotency diagnostics
8. finalize one stable consumer contract for internal sites

Technical backlog:

- add schema-version or table-query proof to health output
- ensure idempotency storage rejects duplicate writes cleanly
- require site auth on every internal write route
- normalize provider errors into stable internal error codes
- persist raw provider payload plus normalized event
- add retry-safe webhook processing
- ensure success, cancel, and retry URLs preserve tenant and locale context
- add traceable internal order lookup

Definition of done:

- one internal site can create checkout, return, receive webhook, and see persisted evidence end to end

### Lane 2: ledger

Mission:

- stop using provider state as the only money truth

Priority order:

1. define ledger v1 schema
2. define balance-state model
3. map payment capture to ledger entries
4. map refund and reversal to ledger entries
5. add settlement and reconciliation state
6. prepare wallet-account abstraction for VND and USD

Technical backlog:

- create `ledger_accounts`
- create `ledger_entries`
- create `ledger_transfers`
- create `wallet_accounts`
- create `wallet_balances`
- create posting rules for `pending`, `available`, `reserved`, `settled`
- create immutable reversal model instead of mutable correction
- attach provider evidence ids to journaled movements
- add reconciliation case table for mismatches
- add read model for finance inspection

Definition of done:

- every successful payment and refund creates journaled entries that finance can trace back to provider evidence

### Lane 3: payout

Mission:

- prepare outbound money movement safely without enabling uncontrolled automation

Priority order:

1. add payout request schema
2. add approval schema
3. add maker-checker policy
4. add payout evidence storage
5. add disabled execution adapter interface
6. only then enable one real payout route under admin approval

Technical backlog:

- create `payout_requests`
- create `payout_approvals`
- create payout status machine: `requested`, `under_review`, `approved`, `rejected`, `processing`, `paid`, `failed`, `reversed`
- require approval metadata and actor evidence
- support payout destination model for bank or provider account
- log every approval and execution step in audit trail
- block direct payout execution from public or site routes
- add reconciliation retry workflow for payout callbacks

Definition of done:

- a payout can be requested, approved, executed, and evidenced, with no path that bypasses human approval

### Lane 4: admin

Mission:

- give operations, support, and finance one internal control surface

Priority order:

1. evidence read view
2. payment search and order drilldown
3. webhook replay and event inspection
4. payout review queue
5. merchant and site configuration UI
6. role-based access control

Technical backlog:

- build internal dashboard behind Cloudflare Access
- create payment timeline view from intent, attempts, provider events, and email evidence
- create search by `internal_order_id`, email, site, provider ref, and `messageId`
- create webhook replay and dead-letter inspection
- create payout approval queue
- create site configuration view for keys, callback URLs, routing, and sender settings
- add admin RBAC roles: ops, finance, support, security admin
- add audit view for sensitive actions

Definition of done:

- ops can investigate one payment or payout entirely from the admin surface without querying raw tables manually

### Lane 5: security

Mission:

- make the internal platform hard to misuse before it grows

Priority order:

1. secrets discipline
2. auth and key scope enforcement
3. webhook verification and replay protection
4. rate limiting and abuse control
5. admin access lockdown
6. auditability and release gates

Technical backlog:

- rotate any secret that ever appeared in chat or logs
- keep provider secrets only in runtime secrets
- hash all internal API keys
- support key scope and tenant/site binding
- enforce timestamp window and replay protection for signed traffic where used
- enable WAF and rate limiting on public write routes
- put admin routes behind Cloudflare Access
- add incident and key-rotation runbook checks
- export logs and error events to retained monitoring
- create production release checklist for payment changes

Definition of done:

- no money-moving route is reachable without auth, idempotency, logging, and a reviewable audit trail

### Lane 6: AI ops

Mission:

- use AI to speed build, verification, and operations without handing AI money authority

Priority order:

1. smoke-test pack generation
2. evidence pack generation
3. log triage and anomaly summary
4. replay script generation
5. backlog and contract maintenance

Technical backlog:

- generate curl replay packs for webhooks and checkout flows
- generate evidence summary from D1 plus email and provider state
- generate release verification checklist from live contract surface
- generate incident summaries from logs and webhook failures
- generate docs deltas when contract changes
- build AI-assisted reconciliation summaries for finance review
- keep AI outputs advisory-only for refunds and payouts

Definition of done:

- AI can reduce investigation and release time, but cannot change balances or approve funds without human action

## Ordered execution plan

### Wave 0: unblock the core

Must finish first:

1. `PAYMENTS_DB` bind
2. schema applied proof
3. `payOS` runtime secrets present
4. email runtime path present
5. health and providers reflect truth

### Wave 1: first live internal payment path

Must finish second:

1. checkout create works
2. webhook verification works
3. payment evidence persists
4. receipt pipeline emits `messageId`
5. one internal site passes end-to-end checkout

### Wave 2: ledger and admin evidence

Must finish third:

1. ledger v1 schema
2. payment-to-ledger posting rules
3. admin evidence search
4. replay tooling

### Wave 3: payout foundation

Must finish fourth:

1. payout schema
2. approval queue
3. maker-checker enforcement
4. disabled execution adapter
5. one approved live payout test only after prior waves are stable

### Wave 4: platformization

Must finish fifth:

1. site onboarding flow
2. scoped key issuance
3. site config and callback management
4. provider routing policy

## Cross-lane dependencies

- lane 2 depends on lane 1 event and evidence truth
- lane 3 depends on lane 2 ledger truth and lane 4 admin queue
- lane 4 depends on lane 1 persistence completeness
- lane 5 applies to every lane and can block release at any time
- lane 6 depends on real data from lanes 1 through 5

## Suggested issue split

### Epic A: internal payment core

- A1 `PAYMENTS_DB` bind and schema proof
- A2 `payOS` secrets and provider health truth
- A3 internal checkout hardening
- A4 webhook verification and persistence
- A5 receipt evidence chain

Detailed issue checklist for Epic A now lives in `plans/26-pay-iai-one-epic-a-issue-checklist.md`.

### Epic B: ledger foundation

- B1 ledger schema v1
- B2 payment posting rules
- B3 refund and reversal posting rules
- B4 reconciliation case model

Detailed issue checklist for Epic B now lives in `plans/30-pay-iai-one-epic-b-issue-checklist.md`.

### Epic C: admin operations

- C1 payment evidence explorer
- C2 webhook replay and dead-letter tools
- C3 site config and key management
- C4 payout review queue

### Epic D: payout foundation

- D1 payout schema and state machine
- D2 approval workflow
- D3 execution adapter contract
- D4 payout reconciliation

### Epic E: security hardening

- E1 secret rotation and inventory
- E2 auth scope enforcement
- E3 rate limiting and admin lockdown
- E4 audit and release gates

### Epic F: AI ops

- F1 webhook replay generator
- F2 evidence pack generator
- F3 incident summary assistant
- F4 release verification assistant

## Release gates by wave

### Gate for wave 1

- real checkout URL returned
- real webhook verified
- real DB evidence written
- real payment email delivered with inbox proof

### Gate for wave 2

- payment and refund posting rules verified
- balance read model queryable
- finance drilldown works

### Gate for wave 3

- payout approval requires maker-checker
- payout execution fully audited
- failed payout is reversible in platform state

## What to do next

The next engineering move should be:

1. open issues for Epic A
2. complete wave 0
3. complete wave 1
4. only then begin ledger wave 2

This keeps the project narrow, live, and safe while still moving toward the longer wallet and treasury vision.
