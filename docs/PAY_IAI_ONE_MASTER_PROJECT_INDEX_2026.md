PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md

Version 1.0

Status: Master Project Lock

Scope

Master index, reading order, implementation order, ownership map, delivery phases, repo structure direction, and definition of done framework for pay.iai.one

Owners

Founder / Product / Platform / Payments / Backend / Frontend / Security / Finance Ops / Treasury / QA / Design / Support

Priority

Highest

⸻

Navigation note

[PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md) is the navigation shell for the full docs pack.

This file remains the actual highest operational and implementation entry point for the pay.iai.one lane.

Pack usage discipline for day-to-day work is governed by [PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md](./PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md).

⸻

0. Core statement

This file is the master entry point for the entire pay.iai.one build.

No team member, AI system, contractor, developer, designer, operator, or reviewer should start implementing pay.iai.one by jumping randomly between files.

The team must read, understand, and execute in the correct order.

pay.iai.one is not a simple checkout project.
It is a central internal financial control plane for the whole ecosystem.

That means the work must move in disciplined layers:

* architecture
* rules
* data
* services
* API
* async execution
* UI
* admin ops
* reconciliation
* testing
* go-live readiness

This master index defines that order.

⸻

1. Purpose

This file exists to:

* define the official reading order
* define the official implementation order
* map each file to responsible teams
* reduce implementation drift
* prevent premature feature jumping
* give AI and human builders one stable execution map
* define completion gates by layer

⸻

2. Non-negotiable rule

The team must not:

* start with wallet features before ledger and reconciliation are correct
* start with many providers before one rail is proven end to end
* treat checkout UI as the core before financial truth exists
* build payout automation before approval and reconciliation exist
* let individual sites own fragmented payment logic
* skip admin ops visibility
* skip evidence and audit design
* skip permission design
* skip test matrix before go-live

⸻

3. Master file registry

The following files are part of the locked pay.iai.one project foundation.

3.0 Docs pack navigation shell

0. PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md

3.1 Architecture and control plane

1. PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md

3.2 Data and API core

2. PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
3. PAY_IAI_ONE_API_SPEC_FULL_V1.md

3.3 Financial logic and payout logic

4. PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md

3.4 Webhook and reconciliation

5. PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md

3.5 Admin and UX surfaces

6. PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md
7. PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md

3.6 Backend orchestration and access control

8. PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
9. PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md

3.7 Copy and interface language

10. PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md

3.8 Async and operational execution

11. PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md

3.9 Exception handling and launch gate

12. PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md
13. PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

3.10 Governance and daily operating templates

14. PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md
15. PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md
16. PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md
17. PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md
18. PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
19. PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

This is the current locked foundation pack.

⸻

4. Required reading order

The team must read in this exact order.

Layer A — Understand what the system is

1. PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md

Purpose:
Understand what pay.iai.one is, what it is not, and why all sites must flow into one central financial system.

Layer B — Understand financial truth and data truth

2. PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
3. PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
4. PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md

Purpose:
Understand source of truth, ledger structure, allocation rules, payout rules, and how external payment signals become internal trusted state.

Layer C — Understand backend contracts and orchestration

5. PAY_IAI_ONE_API_SPEC_FULL_V1.md
6. PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
7. PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md

Purpose:
Understand how requests, services, jobs, outbox, retries, and execution sequencing must be built.

Layer D — Understand visibility, permissions, and operations

8. PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
9. PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md
10. PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md

Purpose:
Understand who can see and do what, how exceptions are handled, and how the control plane is operated day to day.

Layer E — Understand user-facing surfaces

11. PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md
12. PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md

Purpose:
Understand how customer-facing payment interaction must behave and speak.

Layer F — Understand launch criteria

13. PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

Purpose:
Understand what must be proven before controlled internal go-live.

⸻

5. Official implementation order

Reading order and build order are related, but not identical.

The team must implement in this order.

⸻

6. Phase 0 — Foundation and alignment

Deliverables

* confirm architecture direction
* confirm owners
* confirm repo structure
* confirm environment plan
* confirm first rail strategy
* confirm tenant/site/product model

Files required

* PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md
* this master index

Owners

* Founder
* Product
* Platform lead
* Payments lead

Exit condition

* no unresolved disagreement about system purpose
* first rollout scope locked
* first rails locked
* first source site locked

⸻

7. Phase 1 — Data and financial core

Deliverables

* database schema
* migrations
* seed data
* ledger account strategy
* revenue rule seed strategy
* payout rule seed strategy

Files required

* PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
* PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md

Owners

* Backend
* Platform
* Payments
* Finance ops

Exit condition

* migrations run cleanly
* ledger model accepted
* rule templates agreed
* DB bootstrap reproducible

⸻

8. Phase 2 — API and service orchestration core

Deliverables

* route skeletons
* service skeletons
* repository skeletons
* idempotency layer
* state guard layer
* ledger posting service
* outbox primitives

Files required

* PAY_IAI_ONE_API_SPEC_FULL_V1.md
* PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md

Owners

* Backend
* Platform

Exit condition

* critical routes stubbed with stable contracts
* orchestration pattern agreed
* money logic not trapped in controllers

⸻

9. Phase 3 — One working collection rail

Deliverables

* payment intent creation
* payment session creation
* hosted checkout session retrieval
* dynamic QR generation
* one domestic collection rail
* one verified confirmation path
* one ledger-backed confirmation path

Files required

* PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md
* PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md
* PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md

Owners

* Frontend
* Backend
* Payments
* Design

Exit condition

* one real or controlled payment can go end to end
* no false success in UI
* ledger posts correctly
* callback can be queued

⸻

10. Phase 4 — Revenue allocation and callback bridge

Deliverables

* revenue rule engine
* allocation generation
* beneficiary balance projection
* source-site callback outbox
* callback retry logic

Files required

* PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
* PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md

Owners

* Backend
* Payments
* Platform
* Finance ops

Exit condition

* one payment creates allocations correctly
* one source site receives confirmed callback
* retry-safe callback flow exists

⸻

11. Phase 5 — Admin operations and permission control

Deliverables

* admin auth and role guard
* payment monitors
* payment detail view
* webhook evidence view
* allocation explorer
* permission enforcement
* audit explorer base

Files required

* PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
* PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md

Owners

* Frontend
* Backend
* Security
* Product

Exit condition

* admin surfaces usable
* roles enforced
* cross-site leakage blocked
* evidence visible

⸻

12. Phase 6 — Payout request and manual treasury flow

Deliverables

* payout account management
* payout request creation
* approval flow
* execution tracking
* manual completion path
* payout ledger posting
* payout failure and ambiguity handling

Files required

* PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
* PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
* PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md

Owners

* Treasury
* Backend
* Finance ops
* Security

Exit condition

* one payout can go request → approve → complete safely
* duplicate completion blocked
* ambiguity path visible

⸻

13. Phase 7 — Reconciliation, exception handling, and async hardening

Deliverables

* reconciliation runs
* reconciliation items
* exception queues
* dead-letter visibility
* reserve release job
* stale session jobs
* retry policies
* operator playbooks

Files required

* PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md
* PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md
* PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md

Owners

* Finance ops
* Platform
* Backend
* Treasury

Exit condition

* exception lifecycle visible
* reconciliation runs usable
* async failures observable
* no blind retries on payout ambiguity

⸻

14. Phase 8 — QA, evidence pack, and controlled internal go-live

Deliverables

* test execution
* dry run
* smoke test scripts
* go-live evidence packet
* owner sign-offs
* rollout plan for first source site

Files required

* PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md

Owners

* QA
* Product
* Platform
* Payments
* Treasury
* Security
* Finance ops

Exit condition

* go-live gate passes
* evidence packet complete
* owners sign off
* controlled internal rollout approved

⸻

15. Team ownership map

Founder

* architecture intent
* ecosystem scope
* risk tolerance
* rollout priority

Product

* flow completeness
* admin usability
* checkout behavior
* source-site integration contract

Platform

* runtime infrastructure
* queue and job infrastructure
* environment and deployment discipline
* observability foundation

Backend

* schema implementation
* APIs
* service layer
* idempotency
* orchestration
* outbox
* reconciliation core

Frontend

* hosted checkout
* admin UI
* operator dashboards
* copy implementation
* status visibility

Payments

* provider routing
* provider adapters
* webhook interpretation
* rail strategy

Finance Ops

* reconciliation policy
* revenue rule validation
* refund policy validation
* exception handling

Treasury

* payout approval and execution policy
* treasury explainability
* settlement handling

Security

* roles and permissions
* secrets handling
* audit coverage
* incident escalation
* signature validation oversight

QA

* matrix execution
* regression tracking
* go-live evidence collection

Support

* customer-safe payment status handling
* callback and entitlement symptom reporting
* escalation into payments or finance

⸻

16. Suggested repo structure direction

This is the recommended top-level structure for implementation.

pay.iai.one/
  apps/
    web/
    worker/
    admin/
  docs/
    PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md
    PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md
    PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md
    PAY_IAI_ONE_API_SPEC_FULL_V1.md
    PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
    PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md
    PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md
    PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md
    PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
    PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
    PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md
    PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md
    PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md
    PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md
  packages/
    shared-types/
    shared-validation/
    shared-content/
    shared-permissions/
    shared-ledger/
  migrations/
  scripts/
  tests/
    integration/
    e2e/
    regression/

This may vary slightly by stack, but the modular logic should remain.

⸻

17. First release scope recommendation

The first controlled internal release should prove only the essential architecture.

Include

* one source site
* one product or payment purpose
* one hosted session flow
* one QR-capable domestic rail
* one confirmed payment path
* one callback success path
* one revenue allocation rule
* one manual payout flow
* one reconciliation run
* one admin ops cockpit

Exclude from first release

* too many providers
* public multi-merchant complexity
* wallet-first complexity
* crypto
* FX
* complex subscription billing
* broad public exposure

This keeps proof small and real.

⸻

18. Build discipline rules

Rule 1

No frontend success assumption before backend confirmation state exists.

Rule 2

No payout automation before approval and execution trace exist.

Rule 3

No revenue split hard-coded in controller or frontend.

Rule 4

No provider-specific deep logic leaking into product-specific modules.

Rule 5

No site-specific shadow payment logic outside pay.iai.one.

Rule 6

No direct DB edits for operational fixes outside controlled repair workflows.

Rule 7

No release to broader internal usage without evidence packet.

⸻

19. AI implementation discipline

Any AI assistant or code-generation workflow working on this repo must be instructed to:

* read this index first
* follow the file order
* not invent alternate financial truth models
* not bypass the ledger
* not hard-code copy
* not collapse service layer into controllers
* not bypass permission matrix
* not remove audit requirements
* not simplify reconciliation away

AI must help implement the system, not redesign it ad hoc.

⸻

20. Definition of done by layer

Architecture layer done when

* purpose and scope are aligned
* first rollout scope locked

Data layer done when

* schema and seeds stable
* ledger accepted
* revenue rules understood

Service layer done when

* orchestration methods exist
* idempotency exists
* controller thinness preserved

Payment layer done when

* one payment can confirm correctly
* ledger posts once
* callback path exists

Payout layer done when

* request, approve, execute, and reconcile path exists
* ambiguity does not duplicate payout

Ops layer done when

* dashboards usable
* queues visible
* exceptions visible
* roles enforced

QA layer done when

* critical flows tested
* evidence packet assembled
* sign-offs completed

⸻

21. Controlled rollout model

Recommended rollout:

Stage 1

Internal dev-only sandbox

Stage 2

Staging with one controlled site integration

Stage 3

Production shadow or low-risk internal traffic

Stage 4

Controlled internal live usage with limited volume

Stage 5

Expanded internal ecosystem adoption

Do not jump from prototype to broad rollout.

⸻

22. Required weekly reporting for team

Each weekly report should answer:

* what layer is currently in progress
* what file(s) govern that work
* what is already implemented
* what is blocked
* what evidence was produced
* what risks remain
* what is the next gated milestone

This prevents drift and false confidence.
Weekly report, execution board, and risk register must not tell different stories.

⸻

23. Release evidence expectations

Before any meaningful rollout milestone, collect evidence for:

* environment readiness
* successful migrations
* successful payment trace
* duplicate protection
* payout trace
* reconciliation trace
* permission enforcement
* dashboard visibility
* queue health
* audit coverage

This should be stored as a release evidence packet.

⸻

24. Required governance companion files

After the master index, the governance operating pack that keeps execution aligned is:

1. PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md
2. PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md
3. PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md
4. PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
5. PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

These files keep weekly reporting, decision preservation, release proof, execution tracking, and risk tracking aligned while implementation continues.

⸻

25. Final direction

pay.iai.one must be built like a financial operating layer, not like a quick checkout feature.

That means the team must move in order, preserve truth, and make each layer provable before building the next.

This master index is the project spine that keeps the whole build coherent.

If the team follows it, the system can grow without losing control.
If the team skips it, the system will fragment early and become expensive to repair.
