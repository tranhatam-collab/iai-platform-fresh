# pay.iai.one epic B parent issue for Linear

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

Title:

`Epic B: Ledger foundation`

Description:

Build the ledger foundation for `pay.iai.one` so payment state is journaled, refunds are auditable, and reconciliation can detect drift between provider, payment, and ledger truth.

This epic should begin only after Epic A is materially stable. The goal is not a public wallet launch yet. The goal is to make money state trustworthy before payout and broader wallet operations begin.

Scope:

- ledger schema v1
- payment posting rules
- refund and reversal posting rules
- reconciliation case model
- finance inspection readiness

Child issues:

- `B1: Define ledger schema v1 and foundational account tables`
- `B2: Map successful payments into ledger posting rules`
- `B3: Map refunds and reversals into ledger-safe journal flows`
- `B4: Add reconciliation case model and finance inspection reads`

Execution order:

1. B1
2. B2
3. B3
4. B4

Safe overlap:

- B3 and B4 may overlap after B2 is stable

Non-goals:

- public wallet balances
- payout execution
- crypto support
- FX engine
- public user wallet UI

Dependencies:

- Epic A materially stable
- real payment evidence already available
- webhook truth already available
- finance trace from payment intent to provider evidence already possible

Done when:

- successful payments create journaled entries
- refunds or reversals create auditable ledger movements
- reconciliation mismatches can be recorded and queried
- finance can trace one payment from provider evidence to ledger rows

Evidence pack required before closing epic:

- applied ledger migration proof
- one payment posting example
- one refund or reversal posting example
- one reconciliation case example
- finance inspection query or read-model output

Notes:

- do not mark Epic B done from schema creation alone
- do not allow mutable correction of finalized money entries
- ledger truth must stay idempotent under duplicate provider events

Linked docs:

- `plans/25-pay-iai-one-technical-backlog-by-lane.md`
- `plans/30-pay-iai-one-epic-b-issue-checklist.md`
- `plans/31-pay-iai-one-epic-b-linear-copy-ready.md`
- `plans/32-pay-iai-one-epic-b-parent-linear.md`
