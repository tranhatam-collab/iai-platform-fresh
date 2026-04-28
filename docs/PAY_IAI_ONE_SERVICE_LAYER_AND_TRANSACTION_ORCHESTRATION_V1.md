# PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1

Version 1.0

Status: Production Service Lock

Scope

Application services, transaction orchestration, state mutation rules, queue handoff, idempotency behavior, ledger posting sequence, webhook processing sequence, reconciliation jobs, and fulfillment outbox behavior for pay.iai.one

Owners

Platform / Payments / Backend / Finance Ops / Treasury / Security / Product

Priority

Highest

⸻

0. Core statement

Controllers must not own money logic.

Routes may validate input and authenticate actors, but all financial truth, state transitions, ledger writes, and payout consequences must run through dedicated services.

If the team puts payment truth into route handlers, webhook handlers, or frontend assumptions, the system will drift, duplicate, and break.

pay.iai.one must therefore be implemented as a service-layer-driven control plane with strict orchestration.

⸻

1. Purpose

This file defines:

* required backend service boundaries
* which service owns which state mutation
* how money-moving flows must be orchestrated
* how idempotency must behave
* how ledger posting must be sequenced
* how callbacks and fulfillment must be delivered
* how queues and async jobs must be used
* how retries and failures must be contained

⸻

2. Design principles

2.1 Routes are thin

Routes should only do:

* auth
* permission check
* input validation
* request context creation
* service call
* response mapping

Routes must not perform complex financial mutations directly.

2.2 Service layer owns business truth

Every important mutation must go through a named service method.

2.3 One orchestrator per critical flow

Critical flows such as deposit approval, payout paid, transfer completion, and webhook settlement must run through orchestration methods, not ad hoc repository calls.

2.4 State change before and after must be inspectable

Every orchestrated flow must make it possible to understand:

* starting state
* requested action
* validation result
* mutation steps
* ledger impact
* downstream notifications
* final state

2.5 Idempotency and retries are first-class

The system must survive duplicate requests and retries without duplicating financial truth.

⸻

3. Recommended service map

The backend should be organized around these service domains:

* AuthService
* SessionService
* TenantRegistryService
* SiteRegistryService
* ProductRegistryService
* OrderService
* PaymentIntentService
* PaymentSessionService
* CheckoutService
* QrService
* ProviderRoutingService
* ProviderAdapterService
* WebhookIntakeService
* PaymentConfirmationService
* LedgerService
* RevenueAllocationService
* PayoutAccountService
* PayoutRequestService
* PayoutExecutionService
* RefundService
* ReconciliationService
* FulfillmentOutboxService
* NotificationService
* RiskService
* AuditService
* IdempotencyService
* TreasuryService
* ReceiptService

⸻

4. Core repository map

Repositories should remain focused on persistence, not business workflow.

Recommended repositories:

* UsersRepo
* SessionsRepo
* TenantsRepo
* SitesRepo
* ProductsRepo
* OrdersRepo
* PaymentIntentsRepo
* PaymentSessionsRepo
* ProviderAttemptsRepo
* ProviderWebhookEventsRepo
* PaymentsRepo
* LedgerAccountsRepo
* LedgerTransactionsRepo
* LedgerEntriesRepo
* RevenueRulesRepo
* RevenueAllocationsRepo
* PayoutAccountsRepo
* PayoutRequestsRepo
* RefundsRepo
* ReconciliationRunsRepo
* ReconciliationItemsRepo
* AuditLogsRepo
* NotificationsRepo
* EntitlementsOutboxRepo
* IdempotencyKeysRepo
* RiskFlagsRepo

Repositories must not embed cross-entity business orchestration.

⸻

5. Request context model

Every service call should receive a normalized request context object containing:

* request_id
* actor_type
* actor_id
* actor_roles
* tenant_scope
* site_scope if applicable
* ip_address
* user_agent
* idempotency_key if present
* current_timestamp
* trace metadata

This makes audit and permission handling consistent.

⸻

6. Transaction boundary model

Not every request is one database transaction in the literal SQL sense, especially on serverless infrastructure, but every flow must behave like one controlled logical transaction.

Each orchestrated flow should separate:

Phase A

Pre-validation and state read

Phase B

Guard checks and idempotency claim

Phase C

Core state mutation and ledger mutation

Phase D

Outbox and async enqueue

Phase E

Response materialization and audit completion

If Phase C fails, Phase D must not run.
If Phase D fails after Phase C succeeds, the outbox/retry system must recover.

⸻

7. Idempotency service contract

IdempotencyService must support:

* claim key
* verify request hash
* return prior response if identical replay
* reject conflicting replay
* persist final response snapshot
* expire stale keys according to policy

Required for:

* create payment intent when it moves money or commercial truth
* create deposit
* create payout request
* create transfer
* approve deposit
* approve payout
* mark payout paid
* refund execution
* payment order creation from external app
* selected webhook processing paths

Idempotency must sit above money mutation, not after it.

⸻

8. Service method direction

Below is the required method direction for the most important flows.

⸻

9. Payment intent creation flow

Route

POST /v1/payments/orders or POST /v1/deposits

Primary orchestrator

PaymentIntentService.createIntent()

Required steps

1. validate tenant, site, product, order, amount, currency
2. resolve revenue rule or purpose policy
3. check idempotency if endpoint requires it
4. create or link order object
5. create payment_intent
6. create initial audit event
7. return normalized intent output

Must not do yet

* ledger post
* payout creation
* final entitlement

⸻

10. Payment session creation flow

Route

POST /v1/payment-sessions

Primary orchestrator

PaymentSessionService.createSession()

Required steps

1. load payment intent
2. verify intent state allows session creation
3. resolve routing preferences
4. create payment_session
5. call routing service for method ordering
6. generate QR or redirect URL if needed
7. write provider_attempt placeholder if applicable
8. mark session active
9. return checkout payload

Output

* payment_session_id
* hosted checkout URL
* method set
* QR details if relevant
* expiration

⸻

11. Hosted checkout read flow

Route

GET /checkout/{payment_session_id}

Primary orchestrator

CheckoutService.getHostedSessionView()

Required steps

1. load session and intent
2. verify session still renderable
3. assemble order summary
4. assemble active method panel data
5. assemble current status model
6. assemble help model
7. return UI view payload

This service must not mutate financial state except safe view metrics if explicitly designed.

⸻

12. Deposit proof submission flow

Route

POST /v1/deposits/{deposit_id}/proof

Primary orchestrator

PaymentConfirmationService.submitDepositProof()

Required steps

1. load deposit and related intent
2. verify deposit state allows proof submission
3. attach proof metadata
4. move deposit to proof_uploaded or awaiting_review
5. create approval request if required
6. write audit log
7. return updated state

No ledger post here.

⸻

13. Admin deposit approval flow

Route

POST /v1/admin/deposits/{deposit_id}/approve

Primary orchestrator

PaymentConfirmationService.approveManualDeposit()

This is one of the most important service methods in the system.

Required sequence

1. load deposit, intent, wallet, and review state
2. enforce admin permission
3. check idempotency key
4. verify deposit is reviewable and not already settled
5. verify received amount and currency
6. build ledger posting plan
7. create ledger transaction object
8. create balanced ledger entries
9. post ledger transaction
10. update deposit state to settled
11. update payment_intent to succeeded
12. update wallet cached balance
13. create revenue allocation only if this flow requires it
14. enqueue fulfillment outbox if linked to commercial order
15. write audit log
16. persist idempotency result
17. return stable response

Failure rule

If ledger post fails, deposit must not become settled.

⸻

14. Verified provider payment confirmation flow

Trigger

Webhook or verified internal event

Primary orchestrator

PaymentConfirmationService.confirmProviderPayment()

Required sequence

1. receive normalized verified event from WebhookIntakeService
2. load payment_session and intent
3. verify session not already terminal in conflicting state
4. verify amount, currency, and reference consistency
5. create payment record or update existing pending payment
6. build ledger posting plan if policy allows confirm-now posting
7. post ledger
8. update payment state to confirmed or settled according to rail policy
9. update payment_session and payment_intent states
10. trigger revenue allocation engine
11. enqueue fulfillment outbox
12. write audit log and event linkage
13. schedule reconciliation job if settlement confirmation still needed

⸻

15. Revenue allocation flow

Trigger

Confirmed payment with split-bearing commercial rule

Primary orchestrator

RevenueAllocationService.allocateForPayment()

Required sequence

1. load payment and revenue rule
2. verify allocation not already generated
3. calculate lines in minor units
4. resolve beneficiaries
5. apply rounding and residual rule
6. create allocation records
7. create payable or reserve state effects as required
8. write allocation event audit
9. return allocation summary

This method must be deterministic.
The same payment must never produce different results unless formal versioned adjustment path is used.

⸻

16. Payout request creation flow

Route

POST /v1/payouts

Primary orchestrator

PayoutRequestService.createPayoutRequest()

Required sequence

1. load beneficiary or wallet
2. verify payout account active
3. check available eligible balance
4. enforce threshold and policy rules
5. create or update holds on balance if needed
6. create payout_request
7. create approval request if policy requires
8. write audit log
9. persist idempotency result
10. return stable response

Must not do yet

* final money-out ledger posting
* final payout completion mark

⸻

17. Payout approval flow

Route

POST /v1/admin/payouts/{payout_id}/approve

Primary orchestrator

PayoutRequestService.approvePayoutRequest()

Required sequence

1. load payout request, beneficiary state, payout account, risk flags
2. verify admin role
3. check payout still approvable
4. verify no blocking unresolved condition
5. move state to approved or queued
6. optionally enqueue payout execution job
7. write audit log
8. persist idempotency result if used
9. return response

Approval alone must not reduce treasury asset balance yet.

⸻

18. Payout execution flow

Trigger

Admin action or queue job

Primary orchestrator

PayoutExecutionService.executeApprovedPayout()

Required sequence

1. load payout request and payout account
2. verify approved state
3. acquire execution lock or serialized control
4. create execution attempt record
5. if manual mode, record execution reference and move to executing
6. if provider/API mode, call adapter and store attempt result
7. on success confirmation:
    * create ledger plan
    * post payout ledger transaction
    * reduce eligible/held balance correctly
    * mark payout completed
8. on pending external execution:
    * leave in executing and await reconciliation
9. on failure:
    * mark failed
    * release held funds if appropriate
10. write audit log
11. enqueue payout reconciliation if needed

Important rule

Ledger posting for payout must only occur when payout truth is sufficiently confirmed by policy.

⸻

19. Mark payout paid flow

Route

POST /v1/admin/payouts/{payout_id}/paid

Primary orchestrator

PayoutExecutionService.markManualPayoutCompleted()

Required sequence

1. verify payout in executing or approved manual path
2. check idempotency
3. record treasury execution reference
4. build ledger transaction
5. post ledger
6. update payout state to completed
7. update related balances
8. write audit log
9. enqueue receipt or beneficiary notification if policy requires
10. persist idempotency result

⸻

20. Internal transfer flow

Route

POST /v1/transfers

Primary orchestrator

TreasuryService.transferBetweenWallets() or PaymentConfirmationService.transferBetweenWallets()

Required sequence

1. load source and destination wallets
2. verify source balance
3. check idempotency
4. create transfer record
5. build double-entry ledger plan
6. post ledger
7. update cached balances
8. mark transfer completed
9. audit log
10. persist idempotency result

This can be synchronous if controls are strong.

⸻

21. Refund request flow

Route

POST /v1/refunds

Primary orchestrator

RefundService.createRefundRequest()

Required sequence

1. load payment and refund policy
2. verify refundable state
3. verify amount limits
4. create refund object
5. create approval request if needed
6. audit log
7. return response

⸻

22. Refund execution flow

Trigger

Admin action or provider callback path

Primary orchestrator

RefundService.executeApprovedRefund()

Required sequence

1. load payment, allocations, prior refunds
2. verify approval state
3. call provider or record manual treasury refund
4. on sufficient confirmation:
    * record refund event
    * create refund ledger effect
    * reverse or offset revenue allocations
    * update payable balances
    * update payment refund state
5. audit log
6. enqueue refund reconciliation if needed

⸻

23. Webhook intake flow

Route

Provider-specific webhook route

Primary orchestrator

WebhookIntakeService.handleInboundEvent()

Required sequence

1. capture raw request and headers
2. compute payload hash
3. verify signature or authenticity
4. normalize event
5. detect duplicate
6. persist provider webhook event record
7. dispatch to domain-specific confirmation or reconciliation handler
8. return safe provider response

Webhook intake itself should not directly contain deep business logic beyond dispatch and evidence handling.

⸻

24. Webhook domain dispatch

After normalization, dispatch based on normalized event type:

* payment_succeeded → PaymentConfirmationService.confirmProviderPayment
* payment_failed → PaymentConfirmationService.failProviderPayment
* payout_completed → PayoutExecutionService.reconcilePayoutSuccess
* payout_failed → PayoutExecutionService.reconcilePayoutFailure
* refund_completed → RefundService.reconcileRefundSuccess
* unknown_or_unmatched → ReconciliationService.createException

⸻

25. Reconciliation run flow

Trigger

Scheduled job or manual admin action

Primary orchestrator

ReconciliationService.runReconciliation()

Required sequence

1. determine reconciliation domain and window
2. fetch external dataset or pending internal records
3. compare expected vs actual
4. create reconciliation_run
5. create reconciliation_items
6. resolve auto-match cases
7. escalate mismatches to exception queue
8. generate summary metrics
9. audit log and system event

⸻

26. Fulfillment outbox flow

Trigger

Confirmed commercial payment

Primary orchestrator

FulfillmentOutboxService.enqueueFulfillment()

Required sequence

1. load source-site callback configuration
2. create outbox item with signed payload
3. enqueue background delivery
4. store retry schedule
5. on callback success, mark delivered
6. on failure, retry according to policy
7. expose callback status in admin ops

No direct synchronous best-effort callback without outbox tracking.

⸻

27. Notification flow

Primary orchestrator

NotificationService

Supported initial notification types:

* payment awaiting confirmation
* payment confirmed
* payout requested
* payout approved
* payout failed
* refund confirmed
* callback delivery failed for internal ops

Notification must not become the source of truth.

⸻

28. Audit service requirements

AuditService.record() must be callable from every critical orchestration step.

At minimum audit events should be written for:

* payment intent creation
* session creation
* deposit proof submission
* deposit approval or rejection
* verified payment confirmation
* revenue allocation generation
* payout request creation
* payout approval
* payout execution attempt
* payout completion or failure
* refund approval and execution
* reconciliation exception resolution
* manual override
* callback resend

Audit must capture before/after summary where relevant.

⸻

29. Risk service interaction

RiskService may be invoked during:

* payout request creation
* deposit review
* provider payment confirmation
* beneficiary account change
* large transfer or unusual behavior
* repeated failure patterns

Risk service may:

* create risk flags
* recommend block
* force manual review
* freeze payout eligibility

Risk service must not directly finalize money movement without approval path.

⸻

30. Queue usage model

Queues are recommended for:

* fulfillment callback delivery
* notification delivery
* reconciliation batch jobs
* payout execution jobs
* report generation
* stale session cleanup
* retry of provider timeout flows

Do not use queue-driven eventual processing for the exact step that the user-facing response must immediately rely on, unless that response is explicitly pending and safe.

⸻

31. Durable serialization guidance

Where strict serialized mutation is required, such as hot payment session mutation or payout execution lock, use one of:

* Durable Object based serialization
* DB compare-and-set style guarded state transition
* execution lock table or mutex strategy

At minimum, these flows need serialized protection:

* provider event confirmation for same session
* payout execution for same payout request
* duplicate admin approval on same deposit
* duplicate refund execution on same refund

⸻

32. State transition guard service

A dedicated helper such as StateMachineGuardService or embedded guarded methods should enforce valid transitions.

Examples:

* payment_session cannot go from expired to paid without explicit late-payment reconciliation path
* payout cannot go from failed to completed without new execution path
* deposit cannot go from rejected to settled without controlled reopen path
* refund cannot exceed remaining refundable amount

⸻

33. Error handling model

Services must return typed domain errors, not only generic exceptions.

Recommended categories:

* ValidationError
* PermissionError
* StateTransitionError
* IdempotencyConflictError
* LedgerPostingError
* ProviderAdapterError
* ReconciliationMismatchError
* RiskBlockedError
* NotFoundError

Routes then map these to stable API responses.

⸻

34. Response persistence for idempotent endpoints

For idempotent endpoints, final normalized response should be stored by IdempotencyService after successful orchestration.

If replay occurs with same key and hash:

* return stored response

If same key but different request:

* return conflict error

⸻

35. Sample service call graph for deposit approval

AdminDepositsRoute.approve
→ PaymentConfirmationService.approveManualDeposit
→ IdempotencyService.claimOrReplay
→ DepositsRepo.getById
→ StateMachineGuard.checkDepositReviewable
→ LedgerService.postDepositEntries
→ WalletBalanceProjector.applyLedgerImpact
→ PaymentIntentsRepo.markSucceeded
→ FulfillmentOutboxService.enqueueFulfillment
→ AuditService.record
→ IdempotencyService.persistResponse

This is the level of explicitness the team should follow.

⸻

36. Sample service call graph for payout completion

AdminPayoutsRoute.markPaid
→ PayoutExecutionService.markManualPayoutCompleted
→ IdempotencyService.claimOrReplay
→ PayoutRequestsRepo.getById
→ StateMachineGuard.checkPayoutCompletable
→ LedgerService.postCompletedPayoutEntries
→ BeneficiaryBalanceProjector.applyPayoutImpact
→ PayoutRequestsRepo.markCompleted
→ AuditService.record
→ NotificationService.enqueuePayoutCompletedNotice
→ IdempotencyService.persistResponse

⸻

37. Projector pattern recommendation

For performance helper tables such as cached wallet balances or beneficiary balances, use projector-style update methods after ledger success.

Examples:

* WalletBalanceProjector
* BeneficiaryBalanceProjector
* TreasurySummaryProjector

These projectors must never become the primary accounting truth.

⸻

38. Scheduled jobs

Recommended cron-backed jobs:

Every 5 minutes

* expire stale sessions
* retry callback outbox
* retry failed notification delivery
* detect stuck payout executions

Every hour

* reconciliation mini-run for new external events
* provider health rollup
* stale awaiting-confirmation review

Daily

* full reconciliation summary
* treasury balance summary
* negative balance scan
* reserve release scan
* payout eligibility materialization
* audit evidence export

⸻

39. Minimum acceptance criteria

The service layer is not ready until:

1. no money-moving controller contains direct financial mutation logic
2. deposit approval goes through one orchestrator
3. payout completion goes through one orchestrator
4. webhook confirmation goes through one normalized intake path
5. duplicate request replay does not duplicate financial effect
6. ledger posts only from guarded service methods
7. fulfillment callbacks use outbox delivery
8. failed async work is retryable and visible
9. state transition violations are blocked centrally
10. audit coverage exists for every critical flow

⸻

40. Final direction

The service layer is where pay.iai.one stops being a collection of endpoints and becomes a real control plane.

Controllers receive requests.
Services decide truth.
Ledger records it.
Outbox propagates it.
Audit preserves it.

That separation is what makes the system safe enough to scale.
