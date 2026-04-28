PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

Version 1.0

Status: Governance Template Lock

Scope

Project and operational risk register template for pay.iai.one covering delivery risk, financial integrity risk, security risk, payout risk, reconciliation risk, release risk, and operational exposure

Owners

Founder / Product / Platform / Payments / Backend / Frontend / Security / Finance Ops / Treasury / QA

Priority

Highest

⸻

0. Core statement

A financial control plane should never pretend risk does not exist.

The correct discipline is not to eliminate all risk language.
The correct discipline is to identify, classify, track, mitigate, and revisit risk before it becomes an incident.

For pay.iai.one, risk must be tracked continuously because the project touches:

* money truth
* payout truth
* access truth
* reconciliation truth
* internal operational trust

⸻

1. Purpose

This template exists to standardize how the team records and tracks meaningful risks for pay.iai.one so that:

* critical risks are visible early
* mitigations are assigned
* owners are clear
* release decisions are informed by actual exposure
* known risks are not forgotten between weeks

⸻

2. Risk register principles

2.1 Risk must be specific

Do not write vague entries like:

* system may be unstable
* payment could fail
* provider issues possible

Write the specific failure mode.

2.2 Risk must have an owner

Every active risk must have one accountable owner.

2.3 Risk must have a mitigation path

If no mitigation exists yet, that itself must be stated clearly.

2.4 Risk status must stay current

A stale risk register is false comfort.

2.5 Risks and incidents are different

A risk is a potential harmful condition.
An incident is harm already happening.

The risk register tracks exposure before or beyond incidents.

⸻

3. Required risk categories

Use these categories unless a new one is clearly needed:

* delivery
* architecture
* financial_integrity
* payout
* reconciliation
* provider
* security
* permissions
* operational_visibility
* compliance_policy
* release
* support_fulfillment
* treasury
* performance_scale

⸻

4. Required severity model

Use four levels:

* low
* medium
* high
* critical

Severity guidance

Low

Unlikely to harm current milestone or financial truth directly.

Medium

Can slow work or create operational confusion if ignored.

High

Can affect correctness, payout safety, reconciliation quality, or release readiness.

Critical

Can lead to incorrect money movement, duplicated financial effect, severe access leak, or unsafe launch.

⸻

5. Required likelihood model

Use four levels:

* unlikely
* possible
* likely
* very_likely

This helps prioritize beyond severity alone.

⸻

6. Required status model

Use these statuses:

* open
* watching
* mitigating
* blocked
* accepted_temporarily
* resolved
* closed
* escalated

Notes

* accepted_temporarily means the team knows the risk and is explicitly carrying it for a limited time
* closed means no longer relevant
* resolved means mitigation materially removed the risk

⸻

7. Standard risk entry template

RISK REGISTER ENTRY

* Risk ID:
* Title:
* Category:
* Severity:
* Likelihood:
* Status:
* Owner:
* Date opened:
* Last reviewed:
* Review cadence:

Risk statement

Describe the specific exposure.

Why this matters

Explain the impact if the risk materializes.

Trigger or early warning signs

State what signals may indicate the risk is growing.

Current mitigation

State what is already being done.

Next mitigation step

State the next concrete action.

Dependency or linked area

List linked phases, modules, or files.

Release impact

State whether this blocks current release, threatens next release, or is being carried temporarily.

Evidence or notes

Include links to traces, reports, screenshots, PRs, or incident references.

⸻

8. Recommended register table format

PAY.IAI.ONE RISK REGISTER

Risk ID	Title	Category	Severity	Likelihood	Status	Owner	Opened	Last Reviewed	Release Impact	Notes
RISK-001	Duplicate payout completion may post ledger twice	payout	critical	possible	mitigating	Backend lead	2026-04-21	2026-04-21	blocks payout enablement	idempotency guard in progress
RISK-002	Webhook signature validation not yet proven on staging	security	high	likely	open	Payments lead	2026-04-21	2026-04-21	blocks provider go-live	staging verification pending
RISK-003	Site admin view may leak cross-site records	permissions	critical	possible	open	Security lead	2026-04-21	2026-04-21	blocks admin rollout	permission tests not complete

⸻

9. Required fields explained

Risk ID

Stable identifier, e.g. RISK-001

Title

One-line concise statement of the actual risk

Category

Use controlled list from section 3

Severity

Business or system impact if it happens

Likelihood

How plausible it is under current conditions

Status

Current control state

Owner

Person accountable for movement

Date opened

When risk entered register

Last reviewed

Last real review date

Release impact

Examples:

* blocks current release
* threatens next milestone
* no immediate release impact
* temporarily accepted for internal pilot only

⸻

10. Types of risks that must always be logged

The following must never be kept only in chat or memory.

Financial integrity risks

Examples:

* duplicate ledger posting
* helper balance diverges from ledger
* confirmed payment without evidence chain

Payout risks

Examples:

* payout completion ambiguity
* held funds not restoring on failure
* payee account change not strongly reviewed

Reconciliation risks

Examples:

* unmatched inflows unresolved
* settlement mismatch visibility weak
* callback failures hiding entitlement gap

Permission risks

Examples:

* cross-site access leakage
* support role seeing sensitive payout detail
* override action missing audit

Security risks

Examples:

* webhook signature validation incomplete
* raw secret exposure path
* missing audit coverage on sensitive actions

Release risks

Examples:

* no evidence packet yet
* no rollback plan
* QA coverage not complete

⸻

11. Review cadence recommendations

Critical

Review at least twice per week or whenever related release decision approaches

High

Review weekly

Medium

Review biweekly or whenever active phase touches it

Low

Review monthly or when relevant phase begins

⸻

12. Risk scoring guidance

If the team wants a numeric score, use a simple matrix:

* Severity: low=1, medium=2, high=3, critical=4
* Likelihood: unlikely=1, possible=2, likely=3, very_likely=4
* Score = severity × likelihood

Suggested interpretation:

* 1 to 3: monitor
* 4 to 6: active mitigation
* 8 to 12: leadership attention required
* 16: critical escalation

Numeric score is optional.
Clarity of statement matters more.

⸻

13. Example risk entries

Example 1

* Risk ID: RISK-004
* Title: Verified provider callback may arrive after session expiry and be misclassified
* Category: reconciliation
* Severity: high
* Likelihood: possible
* Status: mitigating
* Owner: Payments lead
* Date opened: 2026-04-21
* Last reviewed: 2026-04-21
* Review cadence: weekly

Risk statement

A legitimate payment may be received after session expiry and incorrectly handled as failed or unmatched if late-payment reconciliation is not implemented correctly.

Why this matters

Can create customer confusion, manual finance burden, or incorrect payment truth.

Trigger or early warning signs

Expired sessions with later provider or bank events.

Current mitigation

Webhook protocol and exception queue defined.

Next mitigation step

Implement late-payment reconciliation rule and test matrix case.

Dependency or linked area

* PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md
* PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

Release impact

Threatens collection-rail rollout if not tested.

⸻

Example 2

* Risk ID: RISK-005
* Title: Treasury operators may complete payout manually without enough evidence discipline
* Category: treasury
* Severity: critical
* Likelihood: possible
* Status: open
* Owner: Treasury lead
* Date opened: 2026-04-21
* Last reviewed: 2026-04-21
* Review cadence: weekly

Risk statement

Manual payout completion may be marked in system without adequate execution evidence if admin surface and process are too loose.

Why this matters

Could create false treasury truth and incorrect beneficiary balances.

Current mitigation

Payout completion flow requires execution reference in spec.

Next mitigation step

Lock admin UI requirement for execution reference and audit reason before completion allowed.

Release impact

Blocks payout enablement.

⸻

14. Relationship to weekly reporting

Every weekly status report should include:

* new risks opened
* risks resolved
* risks escalated
* biggest current risk

The weekly report should summarize.
The risk register should preserve the full record.

⸻

15. Relationship to decision log

When a major decision changes risk profile, the decision log entry should reference the relevant risk IDs.

Examples:

* choosing one provider over another
* delaying payout automation
* carrying manual reconciliation temporarily
* narrowing rollout scope to reduce exposure

⸻

16. Relationship to release packet

Every release packet should cite:

* which open risks remain
* which risks are accepted temporarily
* which risks block release
* what mitigations exist for carried risk

A release packet without risk register alignment is incomplete.

⸻

17. Red-flag conditions that require escalation

Immediately escalate if any of the following appear:

* possible duplicate ledger posting
* possible duplicate payout
* payment confirmed with no evidence chain
* payout completed with no settlement evidence
* unresolved cross-site permission leakage
* missing webhook authenticity guarantee
* treasury mismatch beyond acceptable threshold
* known critical risk carried without explicit approval

These should move to escalated status and appear in leadership view.

⸻

18. Suggested working sections in the live register

To keep the live register usable, group active entries by:

* critical open risks
* current-phase risks
* release-blocking risks
* temporarily accepted risks
* resolved recently
* closed archive

This makes the register a working tool instead of a graveyard.

⸻

19. Definition of resolved

A risk should be marked resolved only if:

* the mitigation is actually implemented
* evidence exists that the exposure materially dropped
* related owners agree the current release is no longer blocked by that risk

Do not mark resolved because someone is “working on it”.

⸻

20. Definition of accepted temporarily

Use accepted_temporarily only if:

* the risk is understood
* scope is intentionally constrained
* the right owners explicitly accept carrying it for a limited window
* the acceptance is noted in weekly report and release packet if relevant

This status is not permission to forget the risk.

⸻

21. Minimum acceptance criteria

The risk register is being used correctly only when:

1. critical risks are actually listed
2. every open high or critical risk has an owner
3. release-blocking risks are explicitly marked
4. risks are reviewed regularly
5. resolved risks show real mitigation evidence
6. weekly reports and release packets reference the register
7. temporarily accepted risks are clearly justified
8. escalation conditions are not hidden

⸻

22. Final direction

A strong risk register keeps the team honest before production forces honesty on them.

For pay.iai.one, that matters because this system sits at the point where technical mistakes become financial mistakes.

The register should therefore remain live, specific, and operationally useful at all times.
