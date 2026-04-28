# PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1

Version 1.0

Status: Production Ops Lock

Scope

Internal admin and operations dashboards for payment monitoring, finance review, treasury control, payout approval, reconciliation, evidence, and site-level financial oversight in pay.iai.one

Owners

Founder / Product / Platform / Payments / Finance Ops / Treasury / Support / Security / Design

Priority

Highest

⸻

0. Core statement

Admin surfaces are not decorative.
They are the operating cockpit of the control plane.

If the team cannot see payment truth, webhook health, payout risk, reconciliation status, and evidence clearly, the control plane is not actually under control.

⸻

1. Purpose

This file defines the minimum internal dashboard and admin surface requirements for pay.iai.one V1.

The goal is to give operators one place to:

* monitor financial flow health
* review and resolve payment issues
* approve and execute payouts
* inspect ledger and allocation truth
* review webhook and reconciliation evidence
* manage site-level payment configuration
* investigate exceptions safely

⸻

2. Principles

2.1 Truth first

The dashboard must reflect controlled internal truth, not only provider optimism.

2.2 Actionable visibility

Every important queue must support next action, not just passive display.

2.3 Scoped access

Not every operator sees everything.
Finance, treasury, support, and site admins must have scoped visibility.

2.4 Evidence on demand

Every mutation and exception must be inspectable.

2.5 Operational calm

Interface must reduce panic, not create it.
Clear status, clear queues, clear reason, clear next step.

⸻

3. Required admin roles

At minimum:

* super_admin
* finance_admin
* treasury_admin
* payments_ops
* support_admin
* site_admin
* security_admin
* read_only_auditor

Each role needs scoped capability, not all-powerful broad access.

⸻

4. Primary admin surfaces

The V1 admin system must include these surfaces:

1. Overview dashboard
2. Payment intents monitor
3. Payment sessions monitor
4. Payment detail view
5. Webhook evidence view
6. Reconciliation exceptions queue
7. Revenue allocation explorer
8. Payout queue
9. Payout approval view
10. Refund queue
11. Site and registry configuration
12. Audit log explorer
13. Provider health monitor
14. Treasury summary
15. Risk and hold queue

⸻

5. Overview dashboard

Purpose:
Immediate health view of the control plane.

Must show:

* payments today
* payments last 7 days
* payment success rate
* active sessions
* awaiting confirmation count
* pending manual review count
* unmatched webhook count
* reconciliation exception count
* payout queue count
* payout failed count
* refunds pending
* treasury balance summary
* provider health status
* per-site top-line summary

Recommended widgets:

* live payment activity feed
* provider health cards
* exception summary cards
* payout status summary
* financial trend charts
* recent high-risk items

⸻

6. Payment intents monitor

Purpose:
Track internal requests created by source sites.

Filters:

* tenant
* site
* product
* purpose
* currency
* status
* created_at range
* high-value only
* source order id

Columns:

* payment_intent_id
* tenant
* site
* order_reference
* product or purpose
* amount
* currency
* status
* preferred methods
* revenue_rule
* created_at
* updated_at

Actions:

* open detail
* expire intent
* cancel intent
* inspect source metadata
* inspect linked sessions

⸻

7. Payment sessions monitor

Purpose:
Track actual payment attempt sessions.

Filters:

* site
* provider selected
* state
* expires soon
* expired
* paid
* failed
* QR-based
* checkout hosted

Columns:

* payment_session_id
* linked intent
* provider_selected
* amount
* currency
* state
* session_url
* expires_at
* created_at

Actions:

* open hosted checkout
* copy session URL
* inspect QR payload
* retry attempt
* inspect provider attempts

⸻

8. Payment detail view

Purpose:
Single pane of truth for one payment flow.

Must show:

* tenant and site
* customer snapshot
* order reference
* payment intent status
* payment session state
* provider attempts timeline
* webhook event timeline
* normalized event details
* amount expected vs amount received
* ledger posting status
* revenue allocation lines
* fulfillment callback status
* reconciliation status
* audit trail

Actions:

* mark for manual review
* attach note
* inspect evidence
* re-send callback
* escalate to finance
* open related payout or refund if any

⸻

9. Webhook evidence view

Purpose:
Inspect provider event truth and processing history.

Must show:

* provider
* raw event id
* verification result
* normalized status
* matched session and payment
* amount and currency
* duplicate flag
* action taken
* final processing status
* payload hash
* received_at
* processed_at

Actions:

* open related payment
* mark false duplicate if allowed
* push to exception queue
* compare repeated events
* export evidence summary

Do not show sensitive raw payload widely unless permission allows.

⸻

10. Reconciliation exceptions queue

Purpose:
Central finance queue for mismatches and unresolved events.

Filters:

* domain
* provider
* severity
* exception type
* age
* tenant
* site
* unresolved only

Columns:

* exception id
* domain
* provider
* internal reference
* external reference
* amount mismatch flag
* currency mismatch flag
* severity
* age
* status
* assigned_to

Actions:

* open detail
* assign
* resolve
* rematch
* escalate
* block payout
* request ledger review

This queue is one of the most important surfaces.

⸻

11. Revenue allocation explorer

Purpose:
Explain where money went internally after payment confirmation.

Must show per payment:

* payment id
* revenue rule used
* allocation lines
* beneficiary
* amount
* reserve amount
* eligible date
* current allocation state
* paid amount
* blocked reason

Filters:

* beneficiary
* site
* product
* allocation type
* currency
* payout eligibility status

Actions:

* inspect rule
* inspect beneficiary balance
* inspect payout links
* open refund impact

⸻

12. Payout queue

Purpose:
Treasury and finance control for outbound money.

Tabs:

* awaiting approval
* approved
* queued
* executing
* completed
* failed
* blocked
* reversed

Columns:

* payout_request_id
* beneficiary
* payout account summary
* amount
* currency
* source eligible balance
* approval status
* risk status
* requested_at
* execution_reference
* failure reason if any

Actions:

* approve
* reject
* mark executing
* mark completed
* mark failed
* export batch
* inspect beneficiary history
* inspect source allocations

⸻

13. Payout approval view

Purpose:
Detailed review screen before money leaves treasury.

Must show:

* beneficiary identity
* KYC status
* payout account summary
* first payout or repeated payout indicator
* available eligible balance
* blocked balance
* unresolved refunds
* reconciliation holds
* risk flags
* payout history
* amount requested
* threshold rule triggered
* approval notes history

Actions:

* approve
* reject
* request more review
* block beneficiary
* add note
* open linked evidence

⸻

14. Refund queue

Purpose:
Control refund requests and refund evidence.

Must show:

* refund id
* payment id
* site
* amount requested
* currency
* reason
* approval state
* provider execution state
* reconciliation state
* allocation offset state

Actions:

* approve refund
* reject refund
* execute manual refund
* inspect provider refund evidence
* inspect allocation reversal impact

⸻

15. Site and registry configuration

Purpose:
Configure ecosystem surfaces safely.

Subsections:

* tenants
* sites
* products
* payment methods per site
* QR profile registry
* routing rules
* revenue rules
* payout policy
* callback endpoints
* secret presence status only, not raw secret display

Actions:

* create site
* edit product payment settings
* assign rule
* activate or deactivate methods
* set default receiving profile
* configure callback endpoint
* preview configuration inheritance

⸻

16. Audit log explorer

Purpose:
Allow trace of all important financial and admin actions.

Filters:

* actor type
* actor id
* action type
* entity type
* entity id
* date range
* site
* high-risk only

Must show:

* actor
* action
* entity
* before/after summary
* request id
* IP if relevant
* timestamp

Actions:

* open related entity
* export filtered log
* compare state changes

⸻

17. Provider health monitor

Purpose:
Real operational health of rails.

Must show per provider:

* availability
* last event time
* verification failure rate
* callback failure rate
* payment success rate
* average confirmation latency
* timeout rate
* recent incidents
* fallback activation state

Actions:

* open provider detail
* pause routing if permitted
* inspect failed attempts
* inspect recent webhook evidence

⸻

18. Treasury summary

Purpose:
Visibility into controlled money state.

Must show:

* treasury by currency
* pending inflow
* settled inflow
* pending payout
* executing payout
* reserve held
* refund liability
* reconciliation mismatch count
* site-level payable totals
* payout obligations due soon

This should be finance- and treasury-visible only.

⸻

19. Risk and hold queue

Purpose:
Surface anything blocking financial automation.

Must show:

* risk flags
* reserve holds nearing release
* payout blocks
* unresolved negative beneficiary balances
* verification-expired payees
* suspicious repeated payout changes

Actions:

* open evidence
* resolve risk
* extend hold
* release hold if allowed
* freeze payout
* assign investigation

⸻

20. Required UX states

Every surface must support:

* empty state
* loading state
* permission denied state
* partial failure state
* stale data banner if relevant
* retry affordance
* exported evidence state
* timeline state for entity history

⸻

21. Recommended navigation structure

* Overview
* Payments
    * Intents
    * Sessions
    * Payments
* Webhooks
* Reconciliation
* Revenue
    * Rules
    * Allocations
* Payouts
* Refunds
* Treasury
* Registry
    * Tenants
    * Sites
    * Products
    * QR Profiles
    * Routing
* Risk
* Audit
* Provider Health

⸻

22. Detail view design rule

Every critical entity detail page should have this structure:

1. top summary bar
2. current state and next action
3. timeline of events
4. financial section
5. evidence section
6. related entities
7. notes and audit trail

This creates consistent ops behavior.

⸻

23. Search requirements

Global admin search should support:

* order reference
* payment intent id
* session id
* payment id
* provider reference
* payout id
* refund id
* customer email
* site code
* beneficiary id

Search must be fast and exact enough for live ops.

⸻

24. Permissions model direction

Examples:

support_admin

May view payment status, session status, callback status, customer-safe detail.
May not approve payout or see full payout account secrets.

finance_admin

May resolve reconciliation issues, inspect allocations, approve refunds.

treasury_admin

May manage payout queue, treasury summary, payout execution evidence.

site_admin

May view site-specific payments and allocations only.
May not access full platform treasury.

security_admin

May inspect suspicious audit patterns and webhook signature failures.

⸻

25. Metrics and alerts

Admin dashboard should support alert thresholds for:

* provider signature failure spike
* unmatched webhook spike
* payment success rate drop
* payout failure spike
* reconciliation backlog spike
* high-value transaction awaiting review
* callback delivery failure backlog
* treasury mismatch detected

⸻

26. Exports

V1 should support safe exports for:

* payments by range
* payouts by range
* reconciliation exceptions
* revenue allocations
* audit logs
* provider webhook evidence summaries

Do not make CSV export the primary truth.
It is an operational convenience only.

⸻

27. Minimum acceptance criteria

Admin ops dashboard is not ready until:

1. ops can see live payment flow by site
2. finance can resolve unmatched webhook case
3. treasury can process payout queue end to end
4. one payment detail page shows full event and ledger chain
5. allocation explorer explains payment ownership split
6. refund queue reflects refund and reversal state
7. audit log explorer can trace an admin approval
8. provider health screen shows at least one real signal
9. permissions block unauthorized data access
10. high-risk or blocked items are visible without hidden manual digging

⸻

28. Final direction

If the payment control plane is the financial brain, the admin ops dashboard is the nervous system that lets the team see, decide, and act without losing control.

It must be calm, scoped, evidence-based, and operationally serious.
