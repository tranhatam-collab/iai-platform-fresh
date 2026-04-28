# PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026

Version 1.0

Status: Production Direction Lock

Scope: Internal payment control plane for all websites and internal services in the IAI ecosystem

Owners: Founder / Product / Platform / Payments / Backend / Security / Finance Ops

Priority: Highest

Applies to: All internal websites, apps, services, membership systems, digital products, contributions, internal settlement, revenue sharing, payout, and future wallet expansion

⸻

0. Core statement

pay.iai.one is not a simple payment page.
pay.iai.one is the central internal financial control plane for the whole ecosystem.

All websites and apps in the system must not independently own payment logic in fragmented ways.

All websites and apps must send payment intent, settlement intent, payout intent, and fulfillment signals into one central system.

That central system must be responsible for:

* payment orchestration
* QR generation
* payment link generation
* checkout session generation
* provider routing
* webhook verification
* transaction state management
* ledger write
* revenue split
* payout approval and execution
* reconciliation
* refund handling
* audit evidence

This architecture is intentionally designed for internal operation first, private rollout first, and controlled expansion later.

⸻

1. Primary goal

Build one internal payment backbone that can support:

* all internal websites
* all internal products
* all internal membership and subscription flows
* all internal contribution and fund flows
* all internal revenue sharing logic
* all internal operator and partner payouts
* all internal accounting evidence
* future multi-currency wallet balances
* future digital currency rails
* future public release if approved later

The system must work before public release.
The system must be stable before growth.
The system must be auditable before automation depth increases.

⸻

2. What this system is

This system is:

* a control plane
* an orchestration engine
* a ledger-backed transaction system
* a multi-site financial routing layer
* a payout and split engine
* a future wallet foundation

This system is not:

* a single-provider adapter only
* a static QR page only
* a checkout skin only
* a temporary integration script
* a site-specific payment plugin

⸻

3. Design principles

3.1 One source of financial truth

All transaction truth must converge into pay.iai.one.

3.2 Site apps do not own money logic

Site apps may initiate a commercial action, but they do not finalize financial truth.

3.3 Payment truth comes from verified system state

Do not trust only frontend redirect.
Do not trust only browser return.
Trust verified provider callback, verified reconciliation, and internal ledger state.

3.4 Every transaction must have a lifecycle

No floating transactions.
No undocumented states.
No hidden status mutations.

3.5 Every external payment must map to internal ledger truth

Provider success is not enough.
Provider event must become internal accounting evidence.

3.6 All allocation logic must be explicit

No hidden revenue share.
No manual spreadsheet dependency for core split logic.
No unclear payout ownership.

3.7 Internal first, public later

The system must first serve internal ecosystem needs in a controlled way before public exposure.

⸻

4. Ecosystem integration model

All ecosystem properties must connect to pay through one common pattern.

Examples include:

* iai.one
* flow.iai.one
* dash.iai.one
* life.iai.one
* vc.vetuonglai.com
* nguyenlananh.com
* omdalat.com
* any internal membership site
* any internal booking, contribution, or investment surface
* any admin-operated settlement workflow

Each source system is treated as a site or tenant-bound site.

Each source system may create commercial requests, but all financial control must flow through the pay layer.

⸻

5. High-level architecture

Source Website / App / Admin Tool
→ Payment Intent API
→ PAY.IAI.ONE Control Plane
   → Routing Engine
   → Session Engine
   → QR & Link Engine
   → Provider Adapter Layer
   → Webhook Verification Layer
   → Payment State Machine
   → Ledger Engine
   → Revenue Split Engine
   → Payout Engine
   → Reconciliation Engine
   → Notification Engine
→ Source Website receives result / unlock / fulfillment signal

⸻

6. Primary modules

The system must be split into the following core modules.

6.1 Tenant and site registry

Stores all internal ecosystem sites and their operational payment settings.

6.2 Product and commercial registry

Stores internal products, plans, services, memberships, contributions, and operational flags.

6.3 Payment intent engine

Receives all payment requests from source systems.

6.4 Payment session engine

Creates internal checkout sessions and binds all downstream attempts.

6.5 Provider routing engine

Selects which rail or provider should be used.

6.6 QR and link generation engine

Creates dynamic QR, session URLs, direct payment links, deeplinks, and payment instructions.

6.7 Provider adapter layer

Normalizes PayOS, VietQR, MoMo, ZaloPay, Stripe, Payoneer, internal wallet, and future rails.

6.8 Webhook intake and verification engine

Receives and verifies callbacks and provider events.

6.9 Payment state machine

Moves transaction states in a controlled way.

6.10 Ledger engine

Writes double-entry accounting records.

6.11 Revenue split engine

Allocates internal economic ownership.

6.12 Payout engine

Processes payouts, batch settlements, approvals, and execution.

6.13 Reconciliation engine

Matches external money movement to internal records.

6.14 Refund engine

Handles refund workflows and accounting rollback policies.

6.15 Notification and fulfillment bridge

Notifies source systems when payment truth is confirmed.

6.16 Audit and evidence engine

Stores immutable operational evidence.

⸻

7. Internal actors

7.1 Customer

The end user or member making a payment.

7.2 Source site

The website or app creating the request.

7.3 Merchant operator

Internal operator responsible for a site or business unit.

7.4 Treasury operator

Internal team managing settlement accounts and payouts.

7.5 Finance ops

Internal reconciliation and financial verification team.

7.6 Admin approver

Authorized role for approval of certain payouts, refunds, or high-risk transactions.

7.7 System

Automated orchestration and ledger logic.

⸻

8. Required object model

The following top-level object model must exist.

8.1 Tenant

Top-level organizational owner.

8.2 Site

A payment-enabled surface or application.

8.3 Product

A purchasable or payable entity.

8.4 Order

Commercial object representing what is being bought, contributed, deposited, or settled.

8.5 Payment Intent

Internal request to collect funds.

8.6 Payment Session

Concrete payment attempt session presented to the payer.

8.7 Provider Attempt

A specific call to one payment rail or provider.

8.8 Payment

Confirmed successful or partially successful money event.

8.9 Ledger Account

Internal financial account.

8.10 Ledger Entry

Atomic accounting record.

8.11 Revenue Rule

Split logic template.

8.12 Revenue Allocation

Specific allocation generated from one payment.

8.13 Payout Account

Where funds may later be disbursed.

8.14 Payout Request

Instruction to move funds out.

8.15 Webhook Event

External provider callback captured by the system.

8.16 Reconciliation Record

Matching and evidence object for settlement truth.

8.17 Refund

Money return event.

8.18 Receipt

Customer-facing proof.

8.19 Audit Log

Operational and security trace.

⸻

9. Core flows supported

The system must support the following flow classes.

9.1 One-time payment

Digital product, membership upgrade, document sale, event payment, service fee, booking payment.

9.2 Contribution or donation-like flow

Contribution to a fund, community support, non-public internal support flow.

9.3 Deposit or wallet top-up

User deposits into internal balance.

9.4 Internal settlement

One internal unit settles with another.

9.5 Revenue-sharing sale

One purchase automatically creates multi-party internal allocation.

9.6 Scheduled payout

Revenue owed to internal or external operator is paid out later.

9.7 Refund flow

Money is partially or fully returned.

9.8 Manual finance-reviewed flow

Large or sensitive transactions require manual approval.

⸻

10. State model

10.1 Payment intent states

* created
* validated
* rejected
* session_created
* expired
* cancelled

10.2 Payment session states

* created
* active
* awaiting_payment
* awaiting_confirmation
* paid
* failed
* expired
* cancelled

10.3 Provider attempt states

* created
* sent
* pending
* callback_received
* confirmed
* failed
* timed_out
* ignored

10.4 Payment states

* initiated
* pending
* confirmed
* partially_settled
* settled
* refunded_partial
* refunded_full
* disputed
* voided

10.5 Payout states

* created
* queued
* awaiting_approval
* approved
* executing
* completed
* failed
* reversed
* blocked

Every transition must be controlled by the state machine.
No direct arbitrary status mutation.

⸻

11. Site integration contract

Every site must send payment requests to one central API.

Minimal required request fields:

* tenant_id
* site_id
* order_id
* product_id or purpose
* amount
* currency
* customer identity or guest metadata
* preferred methods
* success_url
* cancel_url

Optional but recommended:

* locale
* country
* customer type
* affiliate_id
* campaign_id
* entitlement_type
* metadata
* revenue_rule_override
* payout_rule_override

The site does not decide final provider truth.
The site only expresses preference.

⸻

12. Session response contract

The pay control plane should return a normalized response to source sites.

Example response fields:

* payment_intent_id
* payment_session_id
* session_url
* checkout_url
* qr_image_url
* qr_payload
* deep_link_url
* external_payment_id
* provider
* payment_methods_available
* expires_at
* amount
* currency
* order_reference
* display_instructions

This lets any source site render:

* a full embedded payment block
* or redirect to pay-hosted checkout
* or display QR directly
* or open a mobile deep link

⸻

13. QR generation model

The system must support both static and dynamic QR modes, but dynamic QR should be the default for real collection.

13.1 Static QR

Used only for limited fallback or internal treasury operations.

13.2 Dynamic QR

Used for actual order-bound collection:

* amount bound
* reference bound
* site bound
* session bound
* expiration bound

Every generated QR must be tied to:

* one session
* one order reference
* one expected amount
* one receiving account or rail profile
* one reconciliation strategy

QR must not be generated as isolated image logic outside the control plane.

⸻

14. QR profile registry

A central registry must exist for QR and receiving configuration.

Each site should point to a profile or use default profile inheritance.

Example settings conceptually include:

* default receiving account
* default bank
* default QR provider
* default statement prefix
* default expiration time
* default amount rule
* supported currencies
* supported local payment methods
* fallback provider order

This avoids every site configuring financial collection differently.

⸻

15. Provider routing rules

Routing must be rule-based and centrally managed.

Routing dimensions may include:

* currency
* country
* site
* product type
* user type
* amount threshold
* provider health
* provider cost
* payout requirement
* compliance requirement
* manual approval requirement

Example routing logic:

* VND + local customer → VietQR first
* VND + wallet preference → MoMo or ZaloPay
* non-VND + international card → Stripe
* marketplace or B2B payout-heavy flow → Payoneer
* internal credit balance available → internal wallet first
* high-risk transaction → manual review before rail creation

Routing must be observable and auditable.

⸻

16. Receiving account model

Do not let every site freely own separate bank accounts from day one.

Phase 1 should use controlled central receiving accounts with internal ledger allocation.

This means:

* money may physically arrive into one master account
* but internally the ledger allocates economic ownership across sites and parties

This is the most stable internal-first operating model.

Later phases may support:

* dedicated receiving account per site
* sub-merchant patterns
* region-specific settlement accounts
* segregated treasury accounts
* digital asset treasury accounts

⸻

17. Internal ledger model

A double-entry ledger is mandatory.

Do not build a payment platform on top of a single transaction table only.

Minimum ledger design:

* assets
* liabilities
* revenue
* reserve
* payable
* receivable
* treasury clearing
* refund liability
* payout holding
* platform fee

Every confirmed payment should generate ledger entries.
Every refund should generate reversing or compensating entries.
Every payout should reduce payable balances correctly.

No money logic should exist only in application memory or frontend summary tables.

⸻

18. Revenue split engine

The split engine must convert one incoming payment into internal allocations.

Examples:

* site owner share
* platform fee
* referrer share
* partner share
* reserve holdback
* operations fee
* future liability or escrow hold

The split engine must not directly depend on provider capability.
It must work even if provider does not support native split.

This means:

* incoming settlement is one real money movement
* internal ownership is determined by ledger allocation
* payout happens later according to policy

This is safer and more flexible.

⸻

19. Revenue rule templates

Revenue rules must be explicit objects.

Examples:

* standard digital sale
* membership sale
* affiliate sale
* partner share sale
* internal contribution pool
* project pool allocation
* operator commission flow

A revenue rule should define:

* percentage or fixed allocations
* priority
* minimum thresholds
* reserve rules
* payout eligibility timing
* reversal behavior on refund

⸻

20. Payout engine design

Payout is a separate engine from collection.

Do not entangle payout execution with checkout success.

The payout engine must support:

* manual payout request
* automatic scheduled payout
* threshold-based payout
* batched payout
* payout approval workflow
* payout account validation
* duplicate prevention
* retry strategy
* reversal and failure handling

Payout should run off eligible balances, not directly from unverified provider callback.

⸻

21. Payout approval rules

The system must support policy such as:

* auto payout below threshold
* manual approval above threshold
* additional review for new payee
* block payout if KYC not complete
* block payout if refund window not passed
* block payout if negative balance risk exists
* block payout if reconciliation incomplete

This protects treasury operations.

⸻

22. Webhook design

Every provider callback must land in a provider-specific endpoint but be normalized internally.

Example pattern:

* /v1/webhooks/payos
* /v1/webhooks/vietqr
* /v1/webhooks/momo
* /v1/webhooks/stripe
* /v1/webhooks/payoneer

Webhook handling steps:

1. capture raw request
2. verify signature or authenticity
3. log immutable copy
4. normalize fields
5. match to intent/session/order
6. check amount/currency/reference consistency
7. apply idempotency protection
8. move state machine
9. write ledger if confirmed
10. trigger fulfillment or source-site callback

No webhook should directly write business entitlements without verification and idempotency.

⸻

23. Reconciliation engine

Reconciliation is mandatory even for internal-first launch.

Reconciliation must verify:

* expected amount vs actual amount
* expected reference vs actual reference
* one provider event vs one internal payment truth
* bank settlement vs internal ledger
* payout execution vs payable reduction
* refund execution vs refund records

Reconciliation modes:

* real-time confirmation
* scheduled batch reconciliation
* manual exception review

Reconciliation exceptions must be visible in ops dashboards.

⸻

24. Source-site callback and fulfillment bridge

Once a payment is confirmed internally, the system must notify the originating site or service.

Possible actions:

* unlock document
* activate membership
* change plan tier
* grant access entitlement
* mark order paid
* send onboarding email
* start downstream workflow

The source site must not grant final entitlements before confirmed callback or verified status polling.

⸻

25. Internal API surface

Minimum internal API groups:

25.1 Registry APIs

* tenants
* sites
* products
* revenue rules
* payout accounts

25.2 Payment APIs

* create payment intent
* create payment session
* list session methods
* retrieve payment status
* expire session
* cancel session

25.3 Checkout APIs

* get checkout session
* get QR
* get hosted page
* get instructions
* retry attempt

25.4 Webhook APIs

* provider inbound endpoints

25.5 Ledger APIs

* retrieve balances
* retrieve entries
* retrieve allocations

25.6 Payout APIs

* create payout request
* approve payout
* execute payout
* reconcile payout
* retry payout

25.7 Refund APIs

* create refund
* approve refund
* execute refund
* reconcile refund

25.8 Evidence APIs

* retrieve audit trail
* retrieve receipts
* retrieve webhook evidence
* retrieve reconciliation evidence

⸻

26. Internal hosted payment page

Even if providers offer their own hosted pages, pay.iai.one must own an internal hosted payment page.

Pattern:

* https://pay.iai.one/checkout/{payment_session_id}

This page may display:

* order summary
* amount
* currency
* customer info
* QR code
* deep links
* card button
* wallet button
* bank transfer instructions
* internal balance option if available
* status refresh
* expiration countdown

This gives one consistent user-facing payment layer for all websites.

⸻

27. Link strategy

Centralize all payment links.

Required link families:

* checkout session page
* provider redirect URL
* QR image URL
* payment deeplink
* success page
* cancel page
* receipt page
* status page
* admin payment detail
* admin payout detail

Do not let every site invent its own payment URL semantics.

⸻

28. Security requirements

28.1 Secret management

All provider secrets must be runtime-managed and never stored in frontend code.

28.2 Signature verification

Every webhook must verify authenticity.

28.3 Idempotency

Create-payment and webhook processing must be idempotent.

28.4 Auditability

Every financial mutation must be logged.

28.5 Access control

Finance ops, support ops, treasury ops, and site admins must have scoped access only.

28.6 PII protection

Sensitive customer and payout data must be minimized and protected.

28.7 Manual override control

All overrides must require logged authorization and evidence.

28.8 Immutable evidence retention

Webhook payload hash, timestamps, and internal event chain should be retained.

⸻

29. Operational dashboards

The platform must provide internal dashboards for:

* payment session activity
* provider health
* webhook health
* QR usage
* payment success and failure rates
* pending manual review
* revenue allocations
* payout queue
* payout failures
* reconciliation exceptions
* refund queue
* treasury balances
* per-site financial summary

This is required for control, not just convenience.

⸻

30. Recommended storage model

Minimum core persistence layers:

* relational database for operational state and ledger
* queue for async processing
* durable state when needed for payment session orchestration
* object storage for evidence snapshots if required
* log pipeline for observability

In Cloudflare-first terms this likely maps to:

* D1 for relational state
* Queues for async work
* Durable Objects only where strict serialized session mutation is needed
* R2 for evidence exports or artifacts if later required

But the architecture must remain implementation-agnostic at the principle level.

⸻

31. Core tables

Recommended minimum table list:

* tenants
* sites
* products
* customers
* orders
* payment_intents
* payment_sessions
* provider_attempts
* provider_webhook_events
* payments
* ledger_accounts
* ledger_journals
* ledger_entries
* revenue_rules
* revenue_rule_lines
* revenue_allocations
* payout_accounts
* payout_requests
* payout_batches
* refunds
* receipts
* reconciliation_runs
* reconciliation_items
* audit_logs
* notifications
* entitlements_outbox

⸻

32. Minimum field direction

32.1 payment_intents

* id
* tenant_id
* site_id
* order_id
* product_id
* purpose
* amount
* currency
* status
* preferred_methods_json
* revenue_rule_id
* customer_snapshot_json
* success_url
* cancel_url
* metadata_json
* created_at
* updated_at

32.2 payment_sessions

* id
* payment_intent_id
* state
* provider_selected
* session_url
* checkout_url
* qr_payload
* qr_image_url
* deep_link_url
* expires_at
* created_at
* updated_at

32.3 provider_attempts

* id
* payment_session_id
* provider
* provider_reference
* external_payment_id
* request_payload_hash
* response_snapshot_json
* state
* error_code
* error_message
* created_at
* updated_at

32.4 payments

* id
* payment_session_id
* provider
* external_payment_id
* order_reference
* amount_expected
* amount_received
* currency
* paid_at
* confirmed_at
* state
* receipt_id
* reconciliation_status

32.5 revenue_allocations

* id
* payment_id
* allocation_type
* beneficiary_type
* beneficiary_id
* amount
* currency
* payout_eligible_at
* status

32.6 payout_requests

* id
* beneficiary_type
* beneficiary_id
* payout_account_id
* amount
* currency
* state
* approval_state
* execution_reference
* requested_at
* approved_at
* completed_at

⸻

33. Internal naming strategy

All public or external-facing identifiers should be stable and human-debuggable.

Recommended reference format:

* PAYINT_...
* PAYSES_...
* ORD_...
* PAY_...
* ALLOC_...
* POREQ_...
* RFND_...

Human-readable order or statement prefixes may include:

* site code
* date component
* serial number

Example:
VTL-20260421-0001

This helps bank transfer matching and manual operations.

⸻

34. Provider normalization model

All providers must normalize into a common schema.

Normalized fields should include:

* provider
* external_payment_id
* provider_reference
* amount
* currency
* status
* payer reference
* callback timestamp
* raw event id
* raw verification status
* matched session id
* matched order reference
* confirmed truth status

Never let business logic directly depend on provider-specific field names deep inside product flows.

⸻

35. Internal-first rollout phases

Phase 1: controlled private operation

* internal websites only
* one or two collection rails
* hosted pay page
* dynamic QR
* manual payout
* manual reconciliation support
* ledger live
* evidence live

Phase 2: stronger automation

* multi-provider routing
* automatic split allocation
* batched payout
* richer dashboards
* source-site fulfillment callbacks
* improved reconciliation rules

Phase 3: wallet layer

* internal balances
* multi-currency support
* payable and receivable accounts per user or partner
* internal transfer logic
* stronger treasury controls

Phase 4: digital asset expansion

* crypto or tokenized balance support if later approved
* enhanced compliance and treasury segregation
* cross-rail routing rules

⸻

36. What should not be done

Do not:

* let each website implement its own provider logic
* let frontend success redirect mark a transaction as paid
* store only provider response and skip ledger
* mix payout execution into checkout controller directly
* use manual spreadsheets as primary truth
* hard-code revenue share logic in frontend or random backend branches
* allow silent admin state changes without audit trail
* let QR creation happen outside central stateful session control
* release public flows before internal operational evidence is stable

⸻

37. Minimum acceptance criteria for internal go-live

The control plane is not considered operational until all of the following are true:

1. at least one source site can create a payment intent successfully
2. the system can create one hosted internal session URL
3. the system can generate one dynamic QR tied to a session
4. a real payment can be matched back to one session and order
5. payment confirmation writes ledger entries successfully
6. one source site receives a fulfillment callback successfully
7. one revenue allocation rule executes correctly
8. one payout request can be created from eligible balance
9. audit evidence exists for payment and payout lifecycle
10. reconciliation can detect matched and unmatched events

⸻

38. Definition of done for production-grade internal readiness

The system is only ready for broader internal adoption when:

* payment control is centralized
* provider abstraction exists
* session truth is state-machine controlled
* ledger truth exists
* revenue split logic exists
* payout logic exists
* reconciliation exists
* audit trail exists
* source-site integration contract is stable
* admin roles and permissions are defined
* provider secrets are properly managed
* failure handling is observable

⸻

39. Build order

The correct build order is:

Step 1

Tenant registry, site registry, product registry, order model

Step 2

Payment intent API and payment session API

Step 3

Internal hosted checkout page

Step 4

QR generation engine and one collection rail

Step 5

Webhook verification and payment state machine

Step 6

Ledger journals and payment accounting write

Step 7

Revenue rule engine and allocation write

Step 8

Source-site callback and fulfillment outbox

Step 9

Payout request engine and approval workflow

Step 10

Reconciliation engine and exception dashboard

Step 11

Additional payment rails and routing engine

Step 12

Wallet and multi-currency foundation

Do not reverse this order.
Do not try to jump to wallet before ledger and reconciliation are correct.

⸻

40. Recommended first rail strategy

For internal-first rollout, choose the minimum rails needed to prove the control plane:

* one domestic collection rail with QR capability
* one global checkout-capable rail
* one internal payout workflow
* one manual treasury reconciliation path

That is enough to prove the architecture.
Do not integrate too many providers before the internal core is stable.

⸻

41. Recommended admin surfaces

At minimum, build these internal surfaces:

* site configuration
* product configuration
* payment intent monitor
* payment session monitor
* payment detail view
* webhook evidence view
* revenue allocation view
* payout queue
* payout approval
* reconciliation exceptions
* refund queue
* audit log view

These are operational requirements, not optional add-ons.

⸻

42. Future wallet foundation

When the system expands into internal balances or digital value layers, the existing ledger and payout design becomes the foundation.

Future capabilities may include:

* user wallet balances
* merchant wallet balances
* reserve wallets
* settlement wallets
* internal transfers
* multi-currency holding
* digital asset holding
* treasury routing
* programmable release rules

That future is only safe if the present control plane is built correctly now.

⸻

43. Final direction

pay.iai.one must be built as one central internal financial operating layer for the whole ecosystem.

Every website may initiate value exchange.
Only the control plane should own financial truth.

All incoming payment rails, generated QR, provider callbacks, split logic, payout logic, and evidence must converge into one central system with one consistent state model and one ledger-backed truth layer.

This is the correct long-term architecture for a private internal ecosystem that plans to expand later without losing control.

⸻

44. Immediate next files for team
