PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md

Version 1.0

Status: Governance Template Lock

Scope

Decision logging for architecture, provider strategy, ledger rules, payout policy, permission model, rollout scope, and operational policy across pay.iai.one

Owners

Founder / Product / Platform / Payments / Finance Ops / Treasury / Security / QA

Priority

Highest

⸻

0. Core statement

A financial control plane cannot rely on memory, chat fragments, or assumptions about why something was chosen.

Major decisions must be written down clearly enough that the team can later answer:

* what was decided
* why it was decided
* what alternatives were considered
* what changed because of it
* who approved it
* what the downstream consequences are

⸻

1. Purpose

This decision log template exists to preserve architectural and operational clarity over time.

It should be used whenever a decision materially affects:

* payment truth
* ledger structure
* provider choice
* payout policy
* reconciliation policy
* permission model
* data model
* UX truthfulness
* rollout scope
* go-live readiness

⸻

2. When a decision log entry is required

A formal decision entry is required when the team changes or locks any of the following:

* first rail selection
* provider routing policy
* ledger account model
* revenue split logic
* payout approval thresholds
* refund policy
* role/permission boundaries
* source-site integration contract
* hosted checkout state language
* queue strategy for sensitive flows
* reconciliation rule or tolerance policy
* scope of first internal go-live
* release-blocking risk acceptance

If the decision changes future code or operations materially, log it.

⸻

3. Decision entry template

PAY.IAI.ONE DECISION LOG ENTRY

1. Decision metadata

* Decision ID:
* Decision title:
* Date:
* Status:
* Decision type:
* Owner:
* Contributors:
* Approvers:

Allowed status values

* proposed
* approved
* superseded
* rejected
* deprecated

Common decision types

* architecture
* provider strategy
* data model
* ledger/accounting
* payout policy
* reconciliation policy
* permission/security
* UI/UX truth model
* rollout scope
* operational policy

⸻

2. Decision summary

State the decision in 2 to 5 lines.

Example:

The team will use one domestic QR-capable rail and one global card-capable rail for the first controlled internal rollout. All other rails remain out of scope until one full end-to-end proof path is stable.

⸻

3. Problem or context

Explain the situation that required the decision.

Template:

* Background:
* Current problem:
* Why this matters now:
* What would happen if we do not decide now:

⸻

4. Options considered

List the real options considered.

Option A

* Description:
* Advantages:
* Risks:
* Why not chosen or why chosen:

Option B

* Description:
* Advantages:
* Risks:
* Why not chosen or why chosen:

Option C

* Description:
* Advantages:
* Risks:
* Why not chosen or why chosen:

Do not pretend only one option existed if multiple options were actually evaluated.

⸻

5. Final decision

Write the final chosen direction clearly.

Template:

* Chosen option:
* Final statement:
* Effective date:
* Applies to:
* Explicit exclusions:

⸻

6. Rationale

Explain why this decision is the best current choice.

Use plain language and include:

* operational reasoning
* technical reasoning
* financial control reasoning
* rollout safety reasoning
* future scaling reasoning

⸻

7. Impacted files and modules

List the files, services, and modules that are affected.

Template:

Impacted locked files

* File 1:
* File 2:
* File 3:

Impacted modules

* Module 1:
* Module 2:
* Module 3:

Impacted teams

* Team 1:
* Team 2:
* Team 3:

⸻

8. Required implementation follow-up

List the work now required because of the decision.

Template:

* Follow-up task 1:
* Follow-up task 2:
* Follow-up task 3:
* Follow-up task 4:

⸻

9. Risks introduced by this decision

Every decision creates risk, not just benefit.

Template:

* Risk 1:
* Risk 2:
* Risk 3:

For each risk, note the mitigation if known.

⸻

10. What this decision does not change

This section prevents confusion.

Template:

This decision does not change:

* item 1
* item 2
* item 3

Example:
This decision does not change the requirement for ledger-backed truth, payout approval flow, or reconciliation visibility.

⸻

11. Revisit conditions

State what conditions would cause this decision to be revisited.

Template:

This decision should be revisited if:

* condition 1
* condition 2
* condition 3

Example:
This provider selection decision should be revisited after one internal source site completes a stable end-to-end low-volume rollout for 30 days.

⸻

12. Approval and sign-off

* Decision owner:
* Product sign-off:
* Platform sign-off:
* Finance/Treasury sign-off:
* Security sign-off if applicable:
* Founder sign-off if required:

⸻

4. Example decision titles

Examples the team may actually use:

* Use one domestic QR rail and one global card rail for first rollout
* Delay multi-currency wallet release until reconciliation layer is proven
* Require manual approval for all payouts above threshold
* Treat frontend return as soft signal only, never payment truth
* Keep provider secrets out of admin UI entirely
* Use callback outbox instead of inline entitlement trigger
* Freeze payout if refund mismatch remains unresolved
* Keep first release limited to one source site

⸻

5. Decision log index format

In addition to individual entries, keep a running decision index.

PAY.IAI.ONE DECISION INDEX

Decision ID	Title	Date	Type	Status	Owner	Notes
DEC-001	First rail strategy	2026-04-21	provider strategy	approved	Payments lead	Phase 1 rollout
DEC-002	Ledger is sole financial truth	2026-04-21	ledger/accounting	approved	Platform lead	Non-negotiable
DEC-003	Manual approval for high-value payout	2026-04-21	payout policy	approved	Treasury lead	Threshold policy

⸻

6. Final direction

A project like pay.iai.one will accumulate many decisions that feel obvious in the moment and become confusing later.

The decision log exists so the team can keep moving without rewriting history or breaking alignment.
