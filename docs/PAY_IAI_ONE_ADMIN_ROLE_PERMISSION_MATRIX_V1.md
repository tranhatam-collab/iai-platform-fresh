# PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1

Version 1.0

Status: Production Access Lock

Scope

Role model, permission boundaries, data visibility scope, action permissions, approval authority, evidence access, and override controls for pay.iai.one admin and internal operations

Owners

Founder / Product / Security / Platform / Payments / Finance Ops / Treasury / Support

Priority

Highest

⸻

0. Core statement

Financial systems fail when too many people can see too much, change too much, or override too much without trace.

pay.iai.one must therefore use a scoped admin model where each role has only the visibility and action authority required for its job.

This is not only a security requirement.
It is an operational clarity requirement.

⸻

1. Purpose

This file defines:

* all initial admin roles
* what each role can view
* what each role can mutate
* which actions require dual control or elevated approval
* which sensitive fields must remain restricted
* how site scope and tenant scope must apply

⸻

2. Permission design principles

2.1 Least privilege

Every role gets the minimum necessary access.

2.2 Separate review from execution

Whenever possible, the person approving payout should not be the same person initiating execution for sensitive flows.

2.3 Scoped data visibility

Not every role should see cross-site, cross-tenant, or treasury-wide information.

2.4 Sensitive field minimization

Full bank account details, raw webhook payloads, secret states, and identity documents must be tightly restricted.

2.5 All overrides audited

Manual overrides must always be logged with reason and actor.

⸻

3. Core roles

Minimum V1 roles:

* super_admin
* finance_admin
* treasury_admin
* payments_ops
* support_admin
* site_admin
* security_admin
* read_only_auditor

Optional later roles:

* refunds_admin
* risk_admin
* compliance_admin
* partner_ops

⸻

4. Scope model

Permissions may be granted with scope:

* global
* tenant-scoped
* site-scoped
* feature-scoped
* read-only
* action-specific

A site_admin for one site must not automatically access another site.

⸻

5. Resource groups

Permissions should be mapped against these resource groups:

* tenants
* sites
* products
* orders
* payment_intents
* payment_sessions
* payments
* provider_attempts
* webhook_events
* revenue_rules
* revenue_allocations
* payout_accounts
* payout_requests
* refunds
* reconciliation_runs
* reconciliation_items
* audit_logs
* treasury_summary
* risk_flags
* callback_outbox
* provider_health
* receipts
* user_wallets
* kyc_profiles

⸻

6. Action categories

Standard actions:

* view
* list
* create
* update
* cancel
* expire
* approve
* reject
* execute
* resolve
* export
* resend
* override
* assign
* freeze
* unlock

Not every role should get all categories.

⸻

7. Sensitive data classes

Class A

Public-safe internal metadata
Examples:
site code, status, timestamps, non-sensitive references

Class B

Operationally sensitive
Examples:
customer email, masked bank info, revenue allocations, callback status

Class C

Highly sensitive
Examples:
full payout account details, raw KYC docs, treasury totals, raw webhook payloads, internal reconciliation evidence, security incident traces

Class D

Restricted secrets
Examples:
provider secrets, raw API secret values, encryption materials

Class D must never be visible in admin UI.

⸻

8. Role definitions

⸻

9. super_admin

Purpose

Platform-wide emergency and governance authority.

Can view

All resource groups across all scopes, including Class C data where policy permits.

Can act

All actions, including:

* configure tenants and sites
* configure products and payment methods
* manage routing and QR profiles
* approve or reject any payout
* resolve reconciliation exceptions
* manage admin roles
* freeze wallets or payouts
* perform audited manual overrides

Restrictions

Should be used sparingly.
Not for routine daily ops when a lower role is sufficient.

⸻

10. finance_admin

Purpose

Payment review, allocation review, refund review, reconciliation handling.

Can view

* payment intents
* payment sessions
* payments
* revenue allocations
* refunds
* reconciliation runs and items
* masked payout data
* audit logs relevant to finance
* limited treasury summaries if granted

Can act

* approve or reject manual deposits
* approve or reject refunds
* resolve reconciliation exceptions
* inspect allocation details
* request payout block
* assign finance notes
* export finance-safe reports

Cannot

* execute payouts directly unless combined with treasury role
* edit provider secrets
* view raw secret values
* broadly manage admin roles

⸻

11. treasury_admin

Purpose

Money-out operations and treasury control.

Can view

* payout queues
* payout accounts in masked form
* treasury summary
* payout execution evidence
* payout-related reconciliation items
* beneficiary balances
* payout holds and blocks

Can act

* approve eligible payouts if policy allows
* execute payouts
* mark payout executing
* mark payout completed or failed
* export payout batch files
* block payout for treasury reasons
* manage treasury notes

Cannot

* alter revenue rules
* approve refunds unless separately granted
* manage provider secrets
* access unrelated KYC docs beyond payout-necessary view

⸻

12. payments_ops

Purpose

General payment flow monitoring and operational triage.

Can view

* payment intents
* sessions
* payment detail summaries
* webhook processing status
* provider attempts
* callback delivery status
* limited reconciliation status
* masked customer detail

Can act

* expire session
* cancel session if policy allows
* resend callback
* assign issue
* move case into manual review
* inspect safe evidence summaries

Cannot

* approve payout
* post ledger manually
* override settled payment state
* access full treasury summary
* access sensitive bank or KYC raw data

⸻

13. support_admin

Purpose

Customer support and payment status assistance.

Can view

* customer-safe payment status
* session status
* receipt status
* callback completion status
* masked customer identity
* masked payout info only if needed for support context

Can act

* resend customer-safe receipt
* open support note
* escalate to finance or treasury
* resend status callback if policy allows
* view help diagnostics

Cannot

* approve financial actions
* resolve reconciliation
* see raw webhook payloads
* see treasury totals
* see full payout account details
* perform overrides

⸻

14. site_admin

Purpose

Operator for one site or site group.

Scope

Site-scoped only.

Can view

* payment intents for assigned site
* payment sessions for assigned site
* payment statuses for assigned site
* revenue allocations affecting assigned site
* callback and fulfillment status for assigned site
* product payment configuration for assigned site

Can act

* create or update site-scoped product payment settings if allowed
* inspect site-specific payment issues
* request refund review
* request payout creation if business policy allows
* export site-scoped payment reports

Cannot

* access other sites
* view global treasury
* approve payout at platform level
* manage global revenue rules unless explicitly delegated
* access provider secret details

⸻

15. security_admin

Purpose

Fraud, access anomaly, webhook signature, audit integrity, and security event oversight.

Can view

* audit logs
* suspicious webhook activity
* signature failure events
* admin override events
* security-related risk flags
* selected payout and payment records for investigation
* raw payload access only if policy allows and strictly logged

Can act

* flag suspicious events
* freeze wallet or payout through controlled action
* require manual review
* review admin action history
* export investigation evidence

Cannot

* routinely approve payouts
* edit commercial configuration
* see provider secrets in raw form

⸻

16. read_only_auditor

Purpose

Audit and oversight without mutation.

Can view

Role-scoped read-only access to selected domains, usually:

* payments
* allocations
* payouts
* reconciliation summaries
* audit logs
* treasury summaries if granted

Can act

* export approved reports only

Cannot

* mutate anything
* approve, reject, execute, or override

⸻

17. Permission matrix summary

Below is the operational summary matrix.

17.1 Registry and configuration

Resource	super_admin	finance_admin	treasury_admin	payments_ops	support_admin	site_admin	security_admin	read_only_auditor
Tenants	full	view	no	no	no	no	limited view	read
Sites	full	view	no	view	no	scoped view/update limited	limited view	read
Products	full	view	no	view	no	scoped view/update limited	no	read
Revenue rules	full	view	view	no	no	scoped view only if assigned	no	read

17.2 Payments and sessions

Resource	super_admin	finance_admin	treasury_admin	payments_ops	support_admin	site_admin	security_admin	read_only_auditor
Payment intents	full	view	view	view/manage limited	view safe	scoped view	limited view	read
Payment sessions	full	view	view	view/manage limited	view safe	scoped view	limited view	read
Payments	full	view/approve deposit-linked	view	view	view safe	scoped view	limited investigation view	read
Provider attempts	full	view	view	view	no	scoped limited	view	read
Webhook events	full	view	view limited	view summary	no	no	view strong	read summary

17.3 Allocations, payouts, refunds

Resource	super_admin	finance_admin	treasury_admin	payments_ops	support_admin	site_admin	security_admin	read_only_auditor
Revenue allocations	full	view	view	limited view	no	scoped view	limited view	read
Payout requests	full	view	full	view	no	scoped request/view if allowed	limited investigation view	read
Refunds	full	approve/view	view	limited view	view status only	scoped request/view	limited view	read
Treasury summary	full	limited view	full	no	no	no	limited investigation view	read if granted

17.4 Risk, audit, security

Resource	super_admin	finance_admin	treasury_admin	payments_ops	support_admin	site_admin	security_admin	read_only_auditor
Reconciliation items	full	full	view payout-related	limited view	no	scoped summary	view	read
Audit logs	full	finance-related	payout-related	limited view	no	site-scoped summary	full security view	read
Risk flags	full	finance-related	payout-related	limited view	no	no	full security/risk view	read
KYC profiles	full	limited finance view	payout-necessary limited	no	no	no	investigation-only limited	no

⸻

18. Dual-control requirements

The following actions should require stronger control in V1:

* high-value payout approval
* payout to newly changed bank account
* manual completion of payout without provider evidence
* manual ledger adjustment
* reversal of settled payment
* raw payload access for highly sensitive event
* reopening terminal refund state
* changing routing for active production rails

Recommended mechanism:

* primary actor + secondary approver
* or explicit super_admin override with elevated audit reason

⸻

19. Override rules

Manual override actions are allowed only for:

* state recovery after verified operational failure
* reconciliation correction
* beneficiary correction with evidence
* payout reversal with evidence
* emergency freeze or unblock

Every override must record:

* actor
* reason
* linked evidence
* before and after state
* timestamp
* optional second approval if amount exceeds threshold

⸻

20. Sensitive field display rules

Full bank account number

Visible to:

* treasury_admin only when necessary
* super_admin if needed
    Not visible to support_admin, site_admin, or read-only general roles

Raw webhook payload

Visible to:

* security_admin
* super_admin
* finance_admin only where policy allows
    Prefer masked or summarized view for others

KYC document details

Visible to:

* finance_admin limited
* treasury_admin limited
* security_admin for investigation if approved
    Never broadly exposed

API secret values and provider secrets

Visible to:

* no admin dashboard role in raw form
    Managed via secret systems only

⸻

21. Site-scoped access rules

A site_admin or scoped operator must only access:

* their site's intents
* their site's sessions
* their site's payments
* their site's callbacks
* their site's allocation summary
* their site's product/payment settings where allowed

They must not infer or browse other sites via search leakage, shared references, or global exports.

⸻

22. Export permissions

Exports must also be scoped.

Allowed examples

* finance_admin: reconciliation and allocation export
* treasury_admin: payout export
* site_admin: site payment export
* read_only_auditor: approved oversight export

Not allowed

* global export by low-scope role
* raw secret material
* raw KYC document export without dedicated compliance workflow

⸻

23. Audit requirements for permissioned actions

All admin actions beyond pure safe view should generate audit.

At minimum audit for:

* approve
* reject
* execute
* resolve
* override
* freeze
* unlock
* export sensitive report
* access highly sensitive evidence where policy requires logging

⸻

24. Permission check implementation direction

Use a centralized policy layer such as:

* PermissionService.can(actor, action, resource, scope)
* PermissionService.require(...)

Do not scatter permission logic manually across controllers.

Inputs should include:

* actor roles
* actor scope
* target resource type
* target tenant or site
* sensitivity class
* action type

⸻

25. Recommended permission keys

Examples:

* tenants:view
* sites:update
* payments:view
* sessions:expire
* deposits:approve
* refunds:approve
* payouts:view
* payouts:approve
* payouts:execute
* payouts:block
* reconciliations:resolve
* audit:export
* webhook_evidence:view_sensitive
* treasury:view
* risk:freeze
* roles:manage

This permission-key model will scale better than only role-name if the system grows.

⸻

26. Minimum acceptance criteria

The permission model is not ready until:

1. support cannot approve payout
2. site_admin cannot access another site's payment detail
3. treasury can execute payout but not edit provider secret
4. finance can resolve reconciliation but not broadly expose sensitive payout data
5. security can inspect suspicious event chain without gaining routine payout powers
6. read_only_auditor cannot mutate anything
7. dual-control actions are enforced where configured
8. sensitive raw fields are masked by default
9. permission denial is logged where relevant
10. role evaluation is centralized and testable

⸻

27. Final direction

Permission design is not bureaucracy.
It is how the control plane remains safe under growth, pressure, staff changes, and inevitable operational mistakes.

Each role should see what it needs, act only where it is responsible, and leave a trace for every meaningful decision.

That is the correct access foundation for pay.iai.one.
