# pay.iai.one epic B issue checklist

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## Purpose

This file expands Epic B from `plans/25-pay-iai-one-technical-backlog-by-lane.md` into concrete issues that the team can create and execute after Epic A is materially stable.

For the short copy-ready Linear version, use `plans/31-pay-iai-one-epic-b-linear-copy-ready.md`.

Epic B scope:

- ledger schema foundation
- payment posting rules
- refund and reversal posting rules
- reconciliation case model
- finance inspection readiness

## Execution order

Default order:

1. B1
2. B2
3. B3
4. B4

Safe overlap:

- `B3` and `B4` may overlap after `B2` is stable
- Epic B should not begin active implementation until Epic A has real checkout, webhook truth, and payment evidence

## B1: ledger schema v1

Suggested title:

`B1: Define ledger schema v1 and foundational account tables`

Detailed migration plan for B1 now lives in `plans/33-pay-iai-one-b1-ledger-schema-v1-migration-plan.md`.

Goal:

- create the ledger foundation so money state has a durable source of truth independent from raw provider callback state

Depends on:

- Epic A materially stable

Blocks:

- B2
- B3
- B4

Checklist:

- [ ] create migration for `ledger_accounts`
- [ ] create migration for `ledger_entries`
- [ ] create migration for `ledger_transfers`
- [ ] create migration for `wallet_accounts`
- [ ] create migration for `wallet_balances`
- [ ] define immutable journal model
- [ ] define account types and balance directions
- [ ] define linking fields back to payment and provider evidence
- [ ] add required indexes for payment and finance lookups
- [ ] document ledger invariants and posting assumptions

Technical notes:

- finalized entries must never be mutated in place
- corrections should create new entries or explicit reversals
- schema should support VND first and USD next without redesign

Acceptance criteria:

- ledger tables exist
- schema supports journaled payment movements
- schema supports wallet-like balances later without another full redesign

Evidence to attach to the issue:

- migration diff
- remote table list after apply
- short schema note covering invariants

Out of scope:

- actual payment posting logic
- refund logic
- payout logic

## B2: payment posting rules

Suggested title:

`B2: Map successful payments into ledger posting rules`

Goal:

- turn successful payment state into journaled ledger movements

Depends on:

- B1 completed

Blocks:

- B3
- B4 partly

Checklist:

- [ ] define payment posting events for capture or paid state
- [ ] map provider and internal payment state to ledger posting triggers
- [ ] write posting logic for successful payment entries
- [ ] attach payment intent id and provider evidence references
- [ ] ensure duplicate provider events do not duplicate ledger entries
- [ ] add read query or inspection helper for posted payment journals
- [ ] add at least one end-to-end proof from payment intent to ledger rows

Technical notes:

- posting should happen from trusted normalized payment state, not raw provider payload alone
- idempotency must hold at ledger posting layer too

Acceptance criteria:

- one successful payment creates traceable ledger rows
- duplicate payment signals do not create duplicate journal entries
- finance can trace payment intent to ledger entry and provider evidence

Evidence to attach to the issue:

- sample payment intent id
- related ledger rows
- provider event or payment attempt reference

Out of scope:

- refund and reversal postings
- payout postings

## B3: refund and reversal posting rules

Suggested title:

`B3: Map refunds and reversals into ledger-safe journal flows`

Goal:

- make refunds and reversals affect ledger state through explicit journal logic instead of mutable correction

Depends on:

- B1 completed
- B2 completed

Blocks:

- none directly, but required before payout and finance confidence

Checklist:

- [ ] define refund posting rules
- [ ] define reversal posting rules
- [ ] ensure original and reversal entries remain linked
- [ ] ensure refund rows connect to payment intent and provider refund evidence
- [ ] ensure balance states move correctly after refund or reversal
- [ ] provide one proof flow for refund ledger trace

Technical notes:

- no silent overwrite of prior successful payment entries
- reversal and refund must remain auditable against original movement

Acceptance criteria:

- one refund produces auditable ledger updates
- reversal path is explicit and queryable
- finance can trace original payment and corresponding refund movements

Evidence to attach to the issue:

- sample original payment rows
- sample refund or reversal rows
- linked provider refund evidence

Out of scope:

- payout reversal

## B4: reconciliation case model

Suggested title:

`B4: Add reconciliation case model and finance inspection reads`

Goal:

- surface mismatches between payment state, provider state, and ledger state as explicit cases instead of silent drift

Depends on:

- B1 completed
- B2 completed

Blocks:

- future payout confidence
- finance operations scale

Checklist:

- [ ] create `reconciliation_cases`
- [ ] define case statuses and severity
- [ ] define mismatch triggers between payment, provider, and ledger records
- [ ] create finance inspection read model or query helper
- [ ] support case links to:
  - payment intent
  - payment attempt
  - provider event
  - ledger rows
- [ ] provide one example mismatch case

Technical notes:

- mismatches should create a case, not an invisible correction
- case model should work before a full admin UI exists

Acceptance criteria:

- mismatches can be recorded and queried
- finance or ops can inspect one case end to end
- case links show enough evidence to investigate without raw table hunting

Evidence to attach to the issue:

- schema or migration proof
- sample reconciliation case
- sample inspection output

Out of scope:

- full admin UI
- automated case resolution

## Epic B close criteria

Epic B is done only when all of the following are true:

- B1 through B4 are individually done
- successful payments create journaled entries
- refunds or reversals create auditable ledger movements
- reconciliation mismatches can be recorded and queried
- finance can trace one payment from provider evidence to ledger rows

## Suggested first move when Epic A is stable

Create and assign the issues in this order:

1. B1
2. B2
3. B3
4. B4

Do not start B2 before B1 is materially merged, and do not close Epic B from schema alone without real posting evidence.
