PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md

Version 1.0

Status: Governance Template Lock

Scope

Weekly status reporting template for all teams working on pay.iai.one

Owners

Founder / Product / Platform / Payments / Backend / Frontend / Security / Finance Ops / Treasury / QA / Support

Priority

Highest

⸻

0. Core statement

A weekly report is not a celebration document.

It is a control document that tells leadership and the team:

* what layer is actually moving
* what is truly done
* what is blocked
* what risks are growing
* what evidence exists
* what must happen next

The goal is clarity, not performance.

⸻

1. Purpose

This template exists to standardize weekly reporting across all teams working on pay.iai.one so that:

* no one reports vaguely
* no one hides risk behind optimistic language
* no one confuses partial progress with completion
* all updates map back to the locked project files and implementation layers

⸻

2. Reporting rules

2.1 Required cadence

* one weekly report per week for the overall project
* one module-specific report if a workstream is complex enough to justify it
* one special report if a critical incident or release blocker appears

2.2 Required tone

Reports must be:

* factual
* calm
* specific
* evidence-based
* non-defensive
* non-marketing

2.3 Prohibited reporting habits

Do not write:

* “almost done” without measurable definition
* “working fine” without evidence
* “minor issue” if it blocks release or financial truth
* “we can fix later” for ledger, payout, reconciliation, or permission problems

2.4 Required linking

Every weekly report must reference:

* current implementation phase
* governing file(s)
* evidence produced
* blocking issues
* decision needed if any

⸻

3. Weekly status template

PAY.IAI.ONE WEEKLY STATUS REPORT

1. Reporting window

* Week:
* Reporting date:
* Prepared by:
* Reviewed by:
* Current project phase:
* Current rollout stage:

⸻

2. Executive summary

Provide a plain summary in 5 to 10 lines covering:

* what moved this week
* what is now working
* what remains blocked
* whether current layer is on track
* whether any issue threatens the next milestone

Example format:

This week the team completed payment intent creation, hosted session creation, and the first QR session rendering path in staging. One domestic rail is now partially integrated. Ledger posting for confirmed manual deposit is working in staging. Callback outbox delivery is implemented but retry behavior is still incomplete. The largest current risk is unresolved webhook normalization for one provider and incomplete permission checks in admin surfaces.

⸻

3. Current layer and governing files

List the exact project layer currently being implemented.

* Current layer:
* Layer objective:
* Governing file 1:
* Governing file 2:
* Governing file 3:
* Why this is the active layer now:

Example:

* Current layer: Phase 3 — One working collection rail
* Layer objective: prove one real end-to-end payment path with hosted checkout, QR, confirmation, and ledger truth
* Governing file 1: PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md
* Governing file 2: PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md
* Governing file 3: PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md

⸻

4. What was completed this week

List only work that is actually completed and evidence-backed.

For each completed item include:

* item
* owner
* environment
* evidence
* completion note

Template:

Completed item 1

* Item:
* Owner:
* Environment:
* Evidence:
* Completion note:

Completed item 2

* Item:
* Owner:
* Environment:
* Evidence:
* Completion note:

Completed item 3

* Item:
* Owner:
* Environment:
* Evidence:
* Completion note:

Examples of acceptable evidence:

* endpoint tested and response captured
* staging UI working with screenshots
* migration applied successfully
* ledger entries verified
* queue retries verified
* permission tests passed
* reconciliation exception appeared correctly in dashboard

⸻

5. What is partially complete

List work in progress that is not done yet.

For each partial item include:

* item
* current state
* what is missing
* blocker if any
* estimated readiness category

Readiness categories:

* early
* mid
* near-complete but not accepted
* awaiting review
* blocked

Template:

Partial item 1

* Item:
* Current state:
* What is missing:
* Blocker:
* Readiness category:

⸻

6. What is blocked

Only list real blockers.

For each blocker include:

* blocker name
* affected layer
* affected file or module
* severity
* owner
* unblock action needed
* whether leadership decision is required

Severity levels:

* low
* medium
* high
* critical

Template:

Blocker 1

* Blocker:
* Affected layer:
* Affected file/module:
* Severity:
* Owner:
* Unblock action needed:
* Leadership decision required: yes or no

⸻

7. Evidence produced this week

List the artifacts that prove progress.

Examples:

* migration run logs
* API test results
* staging screenshots
* webhook evidence traces
* payout trace screenshots
* reconciliation item screenshots
* audit log samples
* QA run summary

Template:

* Evidence 1:
* Evidence 2:
* Evidence 3:
* Evidence 4:

⸻

8. Financial truth and risk summary

This section is mandatory because pay.iai.one is a financial control plane.

Answer clearly:

* Did any ledger-affecting flow change this week?
* Did payout logic change this week?
* Did reconciliation logic change this week?
* Did any permission boundary change this week?
* Is there any known unresolved issue that could cause incorrect payment truth, payout truth, or reconciliation truth?

Template:

* Ledger-affecting changes:
* Payout-affecting changes:
* Reconciliation-affecting changes:
* Permission-affecting changes:
* Current financial integrity risks:

⸻

9. Admin and operations visibility summary

State whether operators can clearly see and act on the current layer.

Template:

* Payment monitor status:
* Webhook evidence visibility:
* Reconciliation queue visibility:
* Payout queue visibility:
* Audit trace visibility:
* Missing ops visibility:

⸻

10. QA and verification summary

Template:

* Tests added this week:
* Tests passed this week:
* Tests failed this week:
* Untested critical path:
* Go-live blockers discovered by QA:

⸻

11. Next week plan

List only the next layer-appropriate steps.

Template:

Priority 1

* Item:
* Why it is next:
* Governing file:
* Owner:

Priority 2

* Item:
* Why it is next:
* Governing file:
* Owner:

Priority 3

* Item:
* Why it is next:
* Governing file:
* Owner:

⸻

12. Decisions needed

List any decisions that leadership or cross-functional owners must make.

Template:

Decision needed 1

* Topic:
* Why decision is needed:
* Options:
* Recommended option:
* Deadline:

⸻

13. Overall health status

Choose one:

* green
* yellow
* orange
* red

Definitions:

* green: layer progressing cleanly with no major risk to next milestone
* yellow: progress is real but one or two issues need close tracking
* orange: milestone at risk unless blockers are cleared
* red: major truth, payout, reconciliation, or access risk prevents safe continuation

Template:

* Overall status:
* Reason:
* Immediate focus:

⸻

14. Sign-off

* Prepared by:
* Functional lead sign-off:
* Product sign-off:
* Finance/Treasury sign-off if applicable:
* Security sign-off if applicable:

⸻

4. Short version template for busy weeks

If the team needs a shorter report, use this minimum format.

PAY.IAI.ONE WEEKLY STATUS — SHORT FORM

* Current phase:
* What was completed:
* What is still partial:
* What is blocked:
* Biggest risk:
* Evidence produced:
* Next priority:
* Decision needed:
* Health status:

This short form is acceptable only if it still contains real evidence and real blockers.

⸻

5. Final direction

A good weekly report should make it easy for someone outside the daily implementation details to know:

* where the project really is
* whether the current layer is stable
* what is dangerous
* what should happen next

That is the reporting standard for pay.iai.one.
