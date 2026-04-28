PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md

Version 1.0

Status: Governance Template Lock

Scope

Daily and weekly execution board template for implementation tracking across pay.iai.one

Owners

Founder / Product / Platform / Payments / Backend / Frontend / Security / Finance Ops / Treasury / QA / Support

Priority

Highest

⸻

0. Core statement

A project board is not a dumping ground for tasks.

For pay.iai.one, the execution board must be a live operating surface that answers, at any moment:

* what layer is being built now
* what work is actually in motion
* what is blocked
* what is unsafe to proceed
* what evidence exists
* what must be finished before the next layer begins

The board must reflect the real implementation order of the control plane.
It must not become a random backlog swamp.

⸻

1. Purpose

This template exists to standardize how the team tracks active work for pay.iai.one so that:

* all tasks map back to the locked project files
* all work maps to the correct implementation phase
* no one starts downstream features before upstream truth is ready
* blockers and risks remain visible
* status changes mean something operationally real

⸻

2. Board design principles

2.1 Board must reflect implementation layers

Tasks should not be mixed without phase awareness.

Every task must belong to one of these layer groups:

* foundation and alignment
* data and financial core
* API and orchestration
* one working collection rail
* revenue allocation and callback bridge
* admin and permissions
* payout flow
* reconciliation and async hardening
* QA and go-live readiness

2.2 Task status must be strict

Do not use vague states like:

* almost done
* ongoing
* polishing
* revisiting a bit

Use controlled board columns only.

2.3 No task without owner

Every active item must have one directly responsible owner.

2.4 No task without governing file

Every task must reference the locked file that governs it.

2.5 No “done” without evidence

A task is not done because someone says so.
It is done when the required evidence exists.

⸻

3. Recommended board columns

The board should use the following columns in order.

3.1 Backlog Locked

Work accepted into scope, not yet ready to start.

3.2 Ready Next

Work approved to begin as soon as current in-flight dependency clears.

3.3 In Progress

Work actively being implemented.

3.4 Waiting Review

Implementation finished enough for technical, product, or operations review.

3.5 Waiting Evidence

Logic appears complete but missing proof, tests, screenshots, traces, or sign-off evidence.

3.6 Blocked

Cannot proceed due to dependency, unresolved decision, or critical defect.

3.7 Done Verified

Completed with evidence and accepted for current phase.

3.8 Deferred

Explicitly pushed out of current scope.

These columns should not be casually renamed.

⸻

4. Required fields for every board card

Every card must contain these fields.

* Card ID
* Title
* Phase
* Workstream
* Governing file
* Owner
* Secondary owner or reviewer if relevant
* Priority
* Current status
* Description
* Acceptance criteria
* Evidence required
* Dependencies
* Blockers
* Risk note
* Target review date
* Notes

Optional but recommended:

* linked PR
* linked issue
* linked decision log entry
* linked release packet section
* linked risk register item

⸻

5. Standard card template

EXECUTION BOARD CARD

* Card ID:
* Title:
* Phase:
* Workstream:
* Governing file:
* Owner:
* Reviewer:
* Priority:
* Status:

Description

State the actual work in plain language.

Why this matters now

Explain why this belongs in the current layer.

Acceptance criteria

* criterion 1
* criterion 2
* criterion 3

Evidence required

* evidence 1
* evidence 2
* evidence 3

Dependencies

* dependency 1
* dependency 2

Blockers

* blocker 1
* blocker 2

Risk note

State any meaningful risk if this work is wrong or incomplete.

Linked items

* PR:
* Issue:
* Decision log:
* Risk register:
* Release packet:

Notes

Freeform implementation note.

⸻

6. Required phase values

Use only these phase labels.

* Phase 0 — Foundation and alignment
* Phase 1 — Data and financial core
* Phase 2 — API and service orchestration core
* Phase 3 — One working collection rail
* Phase 4 — Revenue allocation and callback bridge
* Phase 5 — Admin operations and permission control
* Phase 6 — Payout request and manual treasury flow
* Phase 7 — Reconciliation, exception handling, and async hardening
* Phase 8 — QA, evidence pack, and controlled internal go-live

Do not invent alternate phase names without updating master docs.

⸻

7. Required workstream values

Suggested controlled workstreams:

* docs-governance
* schema-ledger
* api-core
* service-orchestration
* checkout-ui
* provider-integration
* webhook-processing
* revenue-allocation
* payout-control
* reconciliation
* admin-ops
* permissions-security
* queues-async
* qa-evidence
* release-readiness

These help sort execution without destroying clarity.

⸻

8. Priority model

Use only these priorities:

* P0 — Must be solved now, blocks current phase or risks truth
* P1 — Required for current milestone
* P2 — Important but can follow after current milestone
* P3 — Useful later, not current critical path

Priority interpretation

P0

Examples:

* duplicate ledger posting bug
* payout completion ambiguity
* missing webhook verification
* admin scope leak

P1

Examples:

* payment session creation path
* callback outbox retry
* one payout queue surface

P2

Examples:

* richer dashboard filtering
* improved receipt generation
* extra export

P3

Examples:

* future wallet preparation UI
* additional analytics niceties

⸻

9. Status transition rules

A card may only move forward when the current state is truly satisfied.

Backlog Locked → Ready Next

Only if scope is confirmed and dependencies are understood.

Ready Next → In Progress

Only if owner is assigned and upstream blockers are cleared.

In Progress → Waiting Review

Only if implementation is materially complete.

Waiting Review → Waiting Evidence

Use only if reviewers accept logic direction but evidence is missing.

Waiting Review → Done Verified

Only if acceptance criteria and evidence are both satisfied.

Any state → Blocked

If progress cannot continue safely.

Blocked → Ready Next or In Progress

Only after blocker is actually cleared.

Any non-done state → Deferred

Only with explicit scope decision.

⸻

10. Board swimlane recommendation

The board should be grouped by current phase or by workstream, depending on team size.

Recommended for smaller team

Group by phase.

Recommended for larger team

Group by workstream with phase visible on each card.

Do not let tasks lose phase identity.

⸻

11. Example cards

Example 1

* Card ID: PAY-EB-001
* Title: Create payment intent service and route
* Phase: Phase 2 — API and service orchestration core
* Workstream: api-core
* Governing file: PAY_IAI_ONE_API_SPEC_FULL_V1.md
* Owner: Backend
* Reviewer: Platform
* Priority: P1
* Status: In Progress

Acceptance criteria

* POST /v1/payments/orders implemented in staging
* request validation matches spec
* idempotency path exists
* audit event written
* response shape matches locked spec

Evidence required

* API response sample
* test output
* audit log sample

⸻

Example 2

* Card ID: PAY-EB-014
* Title: Prevent duplicate payout completion ledger posting
* Phase: Phase 6 — Payout request and manual treasury flow
* Workstream: payout-control
* Governing file: PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
* Owner: Backend
* Reviewer: Treasury
* Priority: P0
* Status: Blocked

Risk note

If incorrect, same payout may be recorded twice and treasury truth breaks.

⸻

12. Daily operating rhythm

The execution board should be reviewed briefly every working day.

Daily review should answer:

* what moved from yesterday
* what is now blocked
* what new evidence was produced
* what current phase item is at risk
* what cannot start yet despite pressure

This is not a long meeting.
It is a control check.

⸻

13. Weekly operating rhythm

At least once per week, the board should be reconciled against:

* weekly status report
* decision log changes
* risk register
* release readiness for current milestone

The board, weekly report, and risk register must not tell different stories.

⸻

14. Evidence rules for Done Verified

A card may enter Done Verified only if all required evidence exists.

Examples of acceptable evidence:

* migration output
* passing integration test
* webhook trace
* staging screenshot
* payout trace
* audit log sample
* reconciliation queue screenshot
* permission denial proof
* callback retry trace

If evidence is missing, use Waiting Evidence instead.

⸻

15. Blocked card rules

Every blocked card must show:

* exact blocker
* blocker owner
* whether blocker is internal or external
* risk severity
* next unblock action

A blocked card without clear blocker note is not acceptable.

⸻

16. Definition of done at card level

A board card is only done when:

* the implementation exists
* the acceptance criteria are met
* the required evidence exists
* the reviewer accepted it
* no hidden blocker remains on that card’s scope

⸻

17. Definition of done at phase level

A phase should not be marked complete unless:

* all required P0 and P1 cards for that phase are Done Verified
* open P2 or P3 items do not endanger downstream truth
* blockers affecting next phase are cleared or explicitly accepted
* evidence exists for phase transition

⸻

18. Relationship to other governance files

This execution board must be used together with:

* PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md
* PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md
* PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md
* PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

The board tracks active work.
It does not replace the weekly report, decision log, release packet, or risk register.

⸻

19. Minimum acceptance criteria

The execution board is being used correctly only when:

1. every active card has an owner
2. every active card references a governing file
3. no “done” card lacks evidence
4. blockers are visible, not hidden in comments
5. work is grouped by real phase, not random urgency alone
6. the board reflects current reality within the same week
7. high-risk items are visible as P0 or blocked
8. the board and weekly report tell the same story

⸻

20. Final direction

The execution board should function like a live control surface for delivery.

It should help the team move in order, see truth quickly, and prevent chaotic work from entering a financial system that depends on disciplined sequencing.

That is the correct execution board standard for pay.iai.one.
