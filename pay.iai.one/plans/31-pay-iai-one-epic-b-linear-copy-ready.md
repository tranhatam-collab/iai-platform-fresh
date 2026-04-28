# pay.iai.one epic B linear copy-ready issues

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## How to use

Copy one issue block at a time into Linear.

Use this file when the team needs short issue text.

Use `plans/30-pay-iai-one-epic-b-issue-checklist.md` when the team needs the longer implementation checklist.

---

## B1

Title:

`B1: Define ledger schema v1 and foundational account tables`

Description:

Create the ledger foundation so money state has a durable source of truth independent from raw provider callback state.

Checklist:

- create migrations for `ledger_accounts`, `ledger_entries`, `ledger_transfers`
- create migrations for `wallet_accounts` and `wallet_balances`
- define immutable journal model
- define account types and balance directions
- add links back to payment and provider evidence
- add required indexes
- document ledger invariants

Done when:

- ledger tables exist
- schema supports journaled payment movements
- schema supports future wallet balances without redesign

Evidence:

- migration diff
- remote table list
- short schema note covering invariants

---

## B2

Title:

`B2: Map successful payments into ledger posting rules`

Description:

Turn successful payment state into journaled ledger movements.

Checklist:

- define payment posting events for capture or paid state
- map normalized payment state to posting triggers
- write posting logic for successful payment entries
- attach payment intent id and provider evidence references
- ensure duplicate signals do not duplicate ledger entries
- add inspection helper for payment journals

Done when:

- one successful payment creates traceable ledger rows
- duplicate payment signals do not create duplicate journal entries
- finance can trace payment intent to ledger entry and provider evidence

Evidence:

- sample payment intent id
- related ledger rows
- provider event or payment attempt reference

---

## B3

Title:

`B3: Map refunds and reversals into ledger-safe journal flows`

Description:

Handle refunds and reversals through explicit journal logic instead of mutable correction.

Checklist:

- define refund posting rules
- define reversal posting rules
- link original and reversal entries
- link refund rows to payment intent and provider refund evidence
- ensure balance states move correctly after refund or reversal
- provide one refund ledger trace

Done when:

- one refund produces auditable ledger updates
- reversal path is explicit and queryable
- finance can trace original payment and refund movements

Evidence:

- sample original payment rows
- sample refund or reversal rows
- linked provider refund evidence

---

## B4

Title:

`B4: Add reconciliation case model and finance inspection reads`

Description:

Surface mismatches between payment state, provider state, and ledger state as explicit cases instead of silent drift.

Checklist:

- create `reconciliation_cases`
- define case statuses and severity
- define mismatch triggers between payment, provider, and ledger records
- create finance inspection read model or query helper
- link cases to payment intent, payment attempt, provider event, and ledger rows
- provide one example mismatch case

Done when:

- mismatches can be recorded and queried
- finance or ops can inspect one case end to end
- case links show enough evidence to investigate without raw table hunting

Evidence:

- schema or migration proof
- sample reconciliation case
- sample inspection output
