PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md

Version 1.0

Status: Production Documentation Protocol Lock

Scope

Usage protocol for all pay.iai.one documentation across architecture, implementation, governance, execution, risk tracking, release review, and AI-assisted delivery

Owners

Founder / Product / Platform / Payments / Backend / Frontend / Security / Finance Ops / Treasury / QA / Support / AI Systems

Priority

Highest

⸻

0. Core statement

A strong docs pack only works if people use it correctly.

Without a clear usage protocol, even well-written documents quickly become:

* read out of order
* partially applied
* contradicted by newer ad hoc notes
* replaced by chat memory
* ignored under deadline pressure
* misused by AI systems that invent missing structure

This protocol exists to prevent that.

For pay.iai.one, documentation is not a passive reference library.
It is part of the operating system of the project.

⸻

1. Purpose

This file defines how the team and any AI system must use the pay.iai.one docs pack in day-to-day work.

The goal is to ensure:

* everyone starts from the same entry point
* documents are read in the correct order
* implementation follows the locked direction
* updates go into the correct file
* decisions do not get lost across chats and PRs
* reporting and release review use the correct templates
* no one silently creates alternate truth systems

⸻

2. Applies to

This protocol applies to:

* engineers
* designers
* QA
* product managers
* finance ops
* treasury operators
* security reviewers
* support operators
* contractors
* AI coding assistants
* AI documentation assistants
* any person or system making decisions, writing code, or changing docs for pay.iai.one

⸻

3. Required top-level docs set

The working docs pack for pay.iai.one consists of:

Navigation and entry

* PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md
* PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md

Core reading pack

* PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md

Team onboarding

* PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md

Repo integration checklist

* PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md

Governance templates

* PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md
* PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md
* PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md

Daily execution templates

* PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

Pending locked dependencies

* PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
* PAY_IAI_ONE_API_SPEC_FULL_V1.md

This protocol assumes these files exist or are explicitly tracked as pending.

⸻

4. Entry rule

No one should begin work on pay.iai.one by opening a random file first.

The mandatory starting sequence is:

Step 1

Open:
PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md

Purpose:
Understand the whole pack and know what each file is for.

Step 2

Open:
PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md

Purpose:
Understand the actual lane entry point, phase order, reading order, ownership model, and build order.

Step 3

Open:
PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md

Purpose:
Understand the downstream detailed reading pack.

Step 4

Open:
PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md

Purpose:
Only after the first three documents are understood, use the starter map to enter implementation by role.

This is the non-negotiable read order.

⸻

5. Role of each file in practice

5.1 Docs pack index final

Use for:

* pack onboarding
* knowing what documents exist
* checking what is pending
* navigating the full docs system

Do not use it as the source of implementation truth.

5.2 Master project index

Use for:

* deciding what phase comes next
* deciding implementation order
* checking official ownership and phase scope
* deciding what “done” means by layer

This is the operational truth spine.

5.3 Canonical docs index

Use for:

* detailed reading order
* implementation reading pack
* locating detailed docs after master context is clear

Do not use it to override the master project index.

5.4 Team dev starter map

Use for:

* team-specific onboarding
* mapping current work to responsible roles
* team entry once current phase is known

Do not use it without phase awareness.

5.5 Governance templates

Use when:

* reporting weekly status
* locking major decisions
* preparing release evidence

5.6 Execution board and risk register

Use when:

* managing live execution
* tracking blockers
* tracking exposure
* reviewing what is moving now versus what is dangerous now

5.7 Pending dependencies

Use as:

* references for what must still be materialized
* locked direction, not improv invitation

⸻

6. Required usage sequence by work type

Different kinds of work should enter the docs pack differently.

⸻

7. If starting new implementation work

Must read, in order:

1. PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md
2. PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md
3. PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026.md
4. relevant implementation docs for the current phase
5. PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026.md

Before starting, the implementer must know:

* current phase
* current milestone
* current release scope
* governing files for the active work
* known blockers
* whether any pending dependency is unresolved

⸻

8. If updating governance or process

Must read:

1. docs pack index final
2. master project index
3. the specific governance template being used
4. risk register and weekly report if the change affects real project control

If the change affects repo docs navigation, pack wiring, or AI grounding for the repo-facing docs shell, must also:

5. PAY_IAI_ONE_REPO_DOCS_INTEGRATION_CHECKLIST_2026.md
6. run `pnpm report:pay-docs-integration -- --date=YYYY-MM-DD` to capture a dated integration snapshot

Examples:

* weekly reporting change
* decision log usage change
* release evidence requirement change

Do not edit governance templates casually without understanding how they connect.

⸻

9. If preparing a release

Must read:

1. docs pack index final
2. master project index
3. release evidence packet template
4. test matrix and go-live acceptance file
5. risk register
6. weekly status report
7. relevant decision log entries

No release should be reviewed using ad hoc notes alone.

⸻

10. If investigating a problem or exception

Must read:

1. relevant implementation docs for affected domain
2. reconciliation exception playbook
3. risk register
4. execution board
5. recent weekly report if needed

Examples:

* payout ambiguity
* unmatched inbound payment
* callback delivery failure
* permission leakage concern

Do not solve exceptions from memory alone.

⸻

11. If using AI to assist implementation

The AI system must be instructed to:

1. read the docs pack index final first
2. read the master project index before suggesting build order
3. treat the canonical docs index as downstream reading pack only
4. use governance templates when asked for reporting, release, or decision artifacts
5. not invent missing DB or API truth casually
6. not bypass execution board and risk register when asked about current status or active risk
7. not replace locked docs with chat-only assumptions

If the AI has not been grounded in this pack, its suggestions must be treated as provisional.

⸻

12. Update protocol: which file should be changed

One of the biggest sources of documentation drift is writing the right content into the wrong file.

Use this update protocol.

12.1 Update the docs pack index final when

* the pack structure changes
* a new major pack file is added
* a file changes pack-level role
* pending dependency status changes materially

Do not put implementation details here.

12.2 Update the master project index when

* official reading order changes
* official build order changes
* official phase structure changes
* owner responsibilities change
* definition of done by layer changes

Do not use it for weekly progress notes.

12.3 Update the canonical docs index when

* downstream reading order changes
* detailed pack composition changes
* navigation inside the implementation pack changes

Do not let it become a duplicate of the master index.

12.4 Update the team dev starter map when

* team onboarding path changes
* team entry conditions change
* role-based start points change

Do not use it to redefine lane strategy.

12.5 Use the weekly status template when

* reporting what happened this week
* describing real progress
* showing evidence, blockers, risks, and next moves

Do not use it to lock architecture.

12.6 Use the decision log template when

* a major decision is being made or formalized
* provider strategy changes
* payout policy changes
* rollout scope changes
* permission model changes

Do not bury major decisions inside weekly reports only.

12.7 Use the release evidence packet when

* requesting release approval
* proving environment readiness
* proving flow correctness
* presenting carry risks and sign-offs

Do not treat the PR description as a substitute.

12.8 Use the execution board when

* tracking live work
* moving cards between states
* exposing blockers
* showing what is currently in motion

Do not use it as long-term architecture memory.

12.9 Use the risk register when

* opening a meaningful risk
* updating a live risk
* changing risk severity or status
* linking risk to release impact

Do not leave release-blocking risks only in chat.

12.10 Use the repo docs integration checklist when

* wiring the pack into the repository
* auditing docs hierarchy
* verifying that entrypoints and navigation still behave correctly
* checking file presence and path integrity after docs changes

Do not assume repo docs integration is still correct after structural changes without checking it.

⸻

13. Prohibited usage patterns

The following behaviors are not allowed.

13.1 Random entry

Starting implementation from a random doc without reading the pack index and master index first.

13.2 Master bypass

Using canonical docs index or starter map as if they override master project index.

13.3 Chat-only truth

Treating chat history as canonical if a locked doc already exists.

13.4 Silent fork

Creating alternate local versions of schema, API, payout, or governance truth without linking back to official docs.

13.5 Placeholder drift

Inventing fake “temporary” DB or API truth and allowing it to behave like canonical direction without explicit marking.

13.6 Governance misuse

Putting weekly progress into architecture docs, or putting architecture decisions into weekly reports only.

13.7 Risk invisibility

Keeping known high or critical risks out of the risk register.

13.8 Release without packet

Trying to approve meaningful release motion without a release evidence packet.

⸻

14. Pending dependency usage rule

Some files may be referenced as locked dependencies but not yet materialized in the repo cycle.

For example:

* PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
* PAY_IAI_ONE_API_SPEC_FULL_V1.md

Rules for pending dependencies:

Rule 1

Their absence must be visible and explicitly acknowledged.

Rule 2

The team must not pretend they do not matter.

Rule 3

The team must not silently replace them with untracked local truth.

Rule 4

If temporary implementation proceeds before those files materialize, that work must be explicitly marked provisional and mapped back to the locked direction.

This prevents missing-file chaos from turning into shadow architecture.

⸻

15. Documentation update discipline

All doc changes should follow this pattern:

1. identify the correct file owner or owner group
2. confirm whether change is pack-level, strategy-level, execution-level, reporting-level, or risk-level
3. update the correct file only
4. add cross-reference if the change affects another layer
5. avoid duplicating the same truth in too many places
6. note major changes in weekly report or decision log if relevant

The goal is coherence, not document volume.

⸻

16. Cross-reference rules

Cross-references are required when:

* a decision changes phase order or release conditions
* a risk blocks current milestone
* a release packet depends on a recent decision
* a weekly report refers to a new blocker or accepted risk
* a new pack file changes navigation logic

Recommended cross-links:

* weekly report ↔ risk register
* weekly report ↔ execution board
* decision log ↔ release packet
* decision log ↔ master project index if the decision changes official flow
* risk register ↔ release packet
* execution board ↔ governing file

⸻

17. Required minimum documentation behavior by role

Founder

Must use:

* docs pack index final
* master project index
* decision log
* release packet for approvals

Product

Must use:

* master project index
* canonical docs index
* weekly status template
* decision log
* release packet

Backend

Must use:

* master project index
* canonical docs index
* starter map
* execution board
* risk register when implementation risk appears

Frontend

Must use:

* master project index
* canonical docs index
* starter map
* hosted checkout docs
* execution board

Finance Ops

Must use:

* master project index
* reconciliation-related docs
* weekly status template
* risk register
* release packet

Treasury

Must use:

* master project index
* payout and reconciliation docs
* risk register
* release packet

Security

Must use:

* master project index
* permission and audit-related docs
* risk register
* decision log where policy changes
* release packet

QA

Must use:

* master project index
* test matrix and go-live acceptance
* execution board
* weekly status template
* release packet

AI systems

Must use:

* docs pack index final
* master project index
* canonical docs index
* relevant locked docs for the current task

⸻

18. Working cadence rules

Daily

Use:

* execution board
* risk register if new exposure appears

Weekly

Use:

* weekly status template
* execution board reconciliation
* risk register review

At major decisions

Use:

* decision log

At release boundary

Use:

* release evidence packet
* risk register
* weekly status
* relevant decision log entries

This creates operational rhythm.

⸻

19. Quality check before using docs as truth

Before treating any doc as the source of truth, ask:

* is this the right layer of document?
* is this file upstream or downstream?
* has it been superseded?
* is the current phase aligned with it?
* is there a decision log entry changing this?
* is a pending dependency still unresolved?

This avoids blind obedience to stale or lower-level docs.

⸻

20. Signs the docs protocol is being violated

These are warning signs:

* team members quote different entry points
* implementation starts from starter map without phase awareness
* weekly report and execution board tell different stories
* high-risk issue exists but no risk register entry exists
* release review happens without evidence packet
* DB/API truth is being improvised because pending dependencies are ignored
* canonical docs index is treated as stronger than master project index
* changes are made to governance without decision trace

If these signs appear, the docs system is already drifting.

⸻

21. Minimum acceptance criteria

This protocol is being followed correctly only when:

1. new team members are onboarded through the pack index and master index
2. master project index remains the lane execution spine
3. downstream docs are not misused as upstream truth
4. reporting uses the weekly status template
5. major decisions use the decision log
6. release readiness uses the release packet
7. daily work is visible in the execution board
8. meaningful risks are tracked in the risk register
9. pending dependencies are treated honestly
10. AI systems are explicitly grounded in the pack before being trusted

⸻

22. Final direction

The pay.iai.one docs pack is only valuable if the team uses it as one connected operating system.

This protocol exists so the pack remains:

* readable
* hierarchical
* non-contradictory
* operationally useful
* safe under pressure
* usable by both humans and AI

That is the correct documentation usage discipline for pay.iai.one.

⸻
