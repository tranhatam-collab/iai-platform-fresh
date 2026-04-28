PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md

Version 1.0

Status: Accelerated Execution Lock

Scope

Compressed three-team execution overlay for completing the pay.iai.one lane as fast as safely possible, with one control-tower coordination lane supervising delivery, reporting, risk, and release control

Owners

Control Tower / Product / Platform / Payments / Backend / Frontend / Finance Ops / Treasury / QA / Security

Priority

Highest

⸻

0. Core statement

To finish pay.iai.one quickly, the team must not run the entire system as too many loosely coupled workstreams.

For today-level accelerated delivery, the work should be compressed into:

* 3 execution teams for actual implementation
* 1 control-tower lane for coordination, reporting, risk tracking, release proof, and cross-team supervision

This plan does not replace the master project index.
It does not replace the canonical docs index.
It does not replace the team starter map.

It is an execution compression overlay so the lane can move fast without losing control.

⸻

1. Purpose

This file exists to:

* divide current delivery into 3 clear execution teams
* define one control-tower lane for oversight and coordination
* map the new 3-team overlay to the existing 5-team work already near completion
* prevent duplicated effort and role confusion
* define what must be finished today
* define handoff order and unblock rules

⸻

2. Governing documents

This plan must be used together with:

* PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md
* PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md
* PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md
* PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md
* PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md
* PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md
* PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md
* PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md
* PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md

If this plan conflicts with the master project index on build order or safety gates, the master project index wins.

⸻

3. Delivery objective for today

The accelerated objective for today is not “build everything vaguely.”

The objective is to finish the highest-value, highest-risk proof path of the control plane in one coordinated push:

* one end-to-end collection path
* one truthful hosted checkout path
* one manual-safe payout path
* one callback outbox path
* one reconciliation and exception visibility path
* one permission-safe admin path
* one evidence-backed release-readiness picture by end of day

If a lower-priority task does not help achieve these outcomes, it should not interrupt the critical path.

⸻

4. Team model

The accelerated model is:

Team A — Core Money and Control Plane

Team B — Checkout, Admin Surfaces, and Source-Site Integration

Team C — QA, Ops Validation, Exception Safety, and Release Hardening

Control Tower — Coordination, reporting, risk, decision hygiene, release packaging, and cross-team supervision

Only Teams A, B, and C are delivery teams.
Control Tower is not a fourth implementation team.
Control Tower is the coordination lane.

⸻

5. Non-negotiable execution rules

Rule 1

No team may bypass ledger-backed truth.

Rule 2

No team may bypass idempotency, audit, permission, or reconciliation safety because of deadline pressure.

Rule 3

No team may build UI success assumptions before backend confirmation truth exists.

Rule 4

No team may start payout automation before manual-safe approval, completion, and ambiguity handling exist.

Rule 5

If a task belongs to another team, hand it off through the execution board rather than silently duplicating it.

Rule 6

High or critical risks must appear in the risk register the same day they are discovered.

Rule 7

Control Tower may reorder work and escalate blockers, but must not silently rewrite ownership without trace.

⸻

6. Team A — Core Money and Control Plane

Purpose

Team A owns the backend payment truth and all critical money-moving orchestration required for today’s proof path.

Primary domains

* payment intent
* payment session
* provider confirmation path
* webhook intake normalization
* ledger posting path
* revenue allocation engine
* payout request and manual completion path
* callback outbox enqueue
* reconciliation runtime primitives
* queue-safe service orchestration

Primary governing files

* PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
* PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
* PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md
* PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md
* PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

Today’s required outputs

1. One stable payment intent creation path
2. One stable payment session creation path
3. One verified payment confirmation path through controlled service orchestration
4. One balanced ledger-backed confirmation path
5. One payout request to manual completion path with duplicate protection
6. One callback outbox enqueue path
7. One reconciliation exception creation path for mismatches or unmatched events

Must finish before end-of-day acceptance

* no duplicate ledger effect on duplicate confirmation or duplicate payout completion
* typed error handling for critical service paths
* audit events for critical money and payout actions
* visible blocker note if DB/API dependencies remain pending and any implementation is provisional

Must not do

* start multi-provider expansion
* invent alternate DB or API truth because pending dependencies are still not materialized
* shift payout ambiguity into blind retries

⸻

7. Team B — Checkout, Admin Surfaces, and Source-Site Integration

Purpose

Team B owns the human-facing surfaces and integration-facing surfaces that must align tightly with Team A truth.

Primary domains

* hosted checkout
* payment status UX
* QR and transfer instruction rendering
* receipt path
* admin payment detail surface
* admin payout and reconciliation visibility shells
* source-site callback status visibility
* callback receiving-side integration surface
* site handoff and return-flow behavior

Primary governing files

* PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md
* PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md
* PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md
* PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
* PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

Today’s required outputs

1. Hosted checkout route and status rendering tied to real backend state
2. Awaiting confirmation, confirmed, failed, and expired surfaces behaving truthfully
3. Copy registry wired by key rather than hard-coded text
4. Payment detail and callback-status admin surface sufficient for ops use
5. Source-site integration bridge aligned to callback outbox model
6. No false-success path after provider redirect or soft return

Must finish before end-of-day acceptance

* UI can show the real state progression for one end-to-end payment path
* admin surface exposes enough evidence for Team C validation
* masked or scoped visibility respects permission boundaries

Must not do

* invent customer-visible success before Team A confirmation
* hide ambiguity under generic optimistic copy
* bypass permission rules to make ops screens “faster”

⸻

8. Team C — QA, Ops Validation, Exception Safety, and Release Hardening

Purpose

Team C owns validation, exception safety, permission verification, risk surfacing, and release-readiness proof.

Primary domains

* test matrix execution
* role and permission verification
* reconciliation exception validation
* payout ambiguity and refund mismatch safety checks
* queue/retry/dead-letter verification
* release evidence assembly support
* staging dry-run proof collection

Primary governing files

* PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md
* PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md
* PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
* PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md
* PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

Today’s required outputs

1. Critical-path test execution for payment, payout, callback, reconciliation, and permission flows
2. Visible risk register entries for any high or critical issue
3. Clear blocker notes for any release-gating issue
4. One draft release evidence packet with real traces and known gaps
5. Validation that callback failure does not corrupt payment truth
6. Validation that payout duplicate prevention and ambiguity handling are visible

Must finish before end-of-day acceptance

* no critical path is marked done without evidence
* release blockers are named explicitly
* permission leakage concerns are either cleared or escalated

Must not do

* call a milestone ready because pages render
* bury high-risk findings in chat only
* treat a missing proof packet as acceptable if the system “looks fine”

⸻

9. Control Tower — Coordination and Oversight Lane

Purpose

Control Tower is the coordination lane responsible for keeping the three execution teams and the five near-finished legacy workstreams synchronized.

This lane is the team-following, reporting, supervising, and coordination function.

Primary responsibilities

* maintain the execution board as the live operating surface
* maintain the risk register as the live exposure surface
* maintain weekly status truth if reporting cadence requires update
* maintain decision-log hygiene for major scope or safety decisions
* assemble or supervise the release evidence packet
* track blockers across Teams A, B, and C
* track crossovers from the existing Team 1-5 structure
* stop unsafe downstream work when upstream truth is not ready
* escalate unresolved critical risk quickly

Control Tower may also perform

* docs integration work
* cross-team dependency clarification
* evidence-gap closure coordination
* limited unblock patches or wiring tasks when needed to keep the lane moving

Control Tower must not become

* a silent shadow owner of all engineering work
* a place where unresolved risk is hidden
* a replacement for team accountability

⸻

10. Mapping from the existing 5-team model

The existing starter map still matters.
This accelerated 3-team model compresses it as follows:

Existing Team 1 output maps into:

* Control Tower for governance, release gate, sign-off logic, reopen criteria
* Team C for validation, blocker clarity, and release proof

Existing Team 2 output maps into:

* Team A almost directly

Existing Team 3 output maps into:

* Team B almost directly

Existing Team 4 output maps into:

* Team C for exception handling, finance ops, payout ops, reconciliation review
* Team A where runtime support is required

Existing Team 5 output maps into:

* Team B for source-site integration and callback receiving-side work
* Team A where service contracts are required

This mapping is meant to harvest near-finished work, not ignore it.

⸻

11. Handoff order for the accelerated push

The teams should hand off in this order:

Stage 1

Team A locks the backend proof path boundaries:

* payment intent
* payment session
* confirmation state model
* payout manual-safe path
* callback outbox contract

Stage 2

Team B binds surfaces and integration edges to those boundaries:

* checkout states
* admin visibility shells
* callback and source-site status surfaces

Stage 3

Team C validates:

* correctness
* permission safety
* exception visibility
* release evidence

Stage 4

Control Tower reconciles:

* board state
* blocker state
* risk state
* release packet state

No team should wait for “everything” before handing off.
Handoffs should happen as soon as a stable boundary exists.

⸻

12. Critical-path priorities for today

Priority 1

* end-to-end payment confirmation with ledger truth

Priority 2

* truthful hosted checkout and admin visibility

Priority 3

* manual-safe payout completion and duplicate prevention

Priority 4

* callback retry/outbox visibility and reconciliation exception visibility

Priority 5

* release evidence packet and risk closure picture

Anything outside these priorities should be treated as secondary unless it unblocks one of them.

⸻

13. Board and reporting rules for the accelerated model

Every active work item must state:

* which of the 3 teams owns it
* which governing file controls it
* what evidence is needed
* what blocker exists if it is blocked

Control Tower must keep these artifacts aligned:

* execution board
* risk register
* weekly status report
* release evidence packet

These artifacts must not tell different stories.

⸻

14. Escalation rules

Escalate to Control Tower immediately if:

* duplicate ledger effect is possible
* payout may complete twice
* UI claims success before confirmation
* callback truth and payment truth diverge
* high or critical permission leakage appears
* a pending dependency is forcing provisional implementation in a critical area
* any team starts building outside the critical path without approval

Escalate to decision log if:

* a scope tradeoff is needed
* a safety gate must change
* a release blocker is being carried temporarily

⸻

15. End-of-day acceptance picture

Today’s accelerated push is only successful if the lane can show all of the following:

1. one payment path can move from creation to confirmation truthfully
2. hosted checkout reflects that truth without false success
3. one manual payout path is safe from duplicate completion
4. callback outbox or equivalent async path is visible
5. one reconciliation or exception path is visible for mismatch cases
6. major permission boundaries are validated
7. risk register shows real open risks
8. release evidence packet draft exists

If these conditions are not met, the lane is not “done for today,” even if many separate tasks moved.

⸻

16. Final direction

The point of this 3-team model is not to simplify the system.
It is to simplify coordination while keeping the system disciplined.

Three delivery teams build.
One control tower keeps truth synchronized.
The existing five-team work is harvested, not discarded.

That is the fastest safe execution model for completing pay.iai.one in a compressed window.

⸻
