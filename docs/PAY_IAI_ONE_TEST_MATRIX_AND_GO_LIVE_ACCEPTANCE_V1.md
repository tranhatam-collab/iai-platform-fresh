# PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1

Version 1.0

Status: Production QA Lock

Scope

Test matrix, environment validation, pre-live checklist, acceptance criteria, regression coverage, role-based verification, financial integrity checks, and internal go-live readiness for pay.iai.one V1

Owners

QA / Platform / Payments / Backend / Frontend / Finance Ops / Treasury / Security / Product

Priority

Highest

⸻

0. Core statement

A payment system is not ready because pages render, endpoints return 200, or demo flows look good.

pay.iai.one is only ready when the team can prove, repeatedly, that money state, payout state, reconciliation state, callback state, permissions, and evidence all behave correctly under real and messy conditions.

⸻

1. Purpose

This file defines:

* the minimum test matrix for V1
* required environment checks
* critical flow tests
* negative and recovery tests
* role permission tests
* reconciliation tests
* go-live gate criteria
* production readiness evidence pack

⸻

2. Environment model

Minimum environments:

* local development
* shared staging
* pre-live production verification
* live production

The team must never rely only on local success.

⸻

3. Test categories

Required categories:

* infrastructure checks
* schema and migration checks
* API contract checks
* service orchestration checks
* UI flow checks
* role permission checks
* provider simulation checks
* ledger integrity checks
* reconciliation tests
* payout tests
* refund tests
* failure and retry tests
* observability checks
* go-live smoke tests

⸻

4. Infrastructure checks

Verify:

* all secrets present in environment
* queue bindings present
* D1 bindings correct
* R2 bindings if used correct
* webhook URLs reachable
* callback URL config valid in staging
* TLS/domain valid
* logging and metrics visible

Acceptance:

* no missing required binding
* no fallback-to-null secret behavior
* no silent environment mismatch

⸻

5. Migration and schema checks

Verify:

* migrations apply cleanly from zero
* migrations apply cleanly on staging clone
* indexes created
* seed records present
* required rule templates present
* required admin roles seeded
* required provider and payment methods seeded

Acceptance:

* fresh environment bootstrap works
* no schema drift between app assumptions and DB

⸻

6. API contract checks

For each major endpoint, verify:

* success path shape matches spec
* validation errors stable
* idempotency errors stable
* auth errors stable
* unauthorized access blocked
* pagination shape works
* timestamps and references returned correctly

Critical endpoint families:

* auth
* wallet
* deposits
* payouts
* transfers
* admin deposit review
* admin payout review
* webhook endpoints
* reconciliation endpoints
* audit export endpoints

⸻

7. Hosted checkout UI checks

Verify:

* session page loads
* order summary correct
* method selector correct
* QR renders when expected
* bank instructions render cleanly
* countdown works
* awaiting confirmation state works
* confirmed state works
* expired state works
* failed state works
* bilingual copy mapping works
* no misleading success message before confirmation

⸻

8. Deposit flow test matrix

Scenario A

Create manual deposit intent

Expected:

* payment_intent created
* deposit created
* session or instruction output correct
* audit record present

Scenario B

Upload deposit proof

Expected:

* deposit status moves correctly
* proof metadata stored
* approval request created if required

Scenario C

Approve manual deposit

Expected:

* ledger post occurs exactly once
* wallet balance updates
* intent marked succeeded
* audit record present
* callback outbox item created if linked product order

Scenario D

Reject manual deposit

Expected:

* no ledger posting
* state rejected
* audit record present

Scenario E

Duplicate approval attempt

Expected:

* second attempt blocked or idempotent replay
* no duplicate ledger

⸻

9. Verified provider payment test matrix

Scenario A

Valid webhook confirms payment

Expected:

* webhook captured
* signature verified
* event normalized
* payment confirmed
* ledger posted
* allocations created
* callback enqueued

Scenario B

Duplicate webhook

Expected:

* no duplicate payment confirmation
* no duplicate ledger
* event recorded as duplicate or ignored

Scenario C

Webhook with amount mismatch

Expected:

* no auto-confirm
* reconciliation exception created

Scenario D

Webhook with invalid signature

Expected:

* no confirmation
* security-visible exception

⸻

10. Payout test matrix

Scenario A

Create payout request from eligible balance

Expected:

* payout_request created
* approval state correct
* held balance updated if policy requires

Scenario B

Approve payout

Expected:

* state approved or queued
* no treasury asset reduction yet unless execution bundled

Scenario C

Mark payout executing

Expected:

* execution reference stored
* state updated

Scenario D

Complete payout successfully

Expected:

* ledger posted once
* payout completed
* eligible balance reduced correctly
* audit record present

Scenario E

Payout failure before settlement

Expected:

* no payout-completion ledger
* held funds released correctly
* state failed

Scenario F

Duplicate payout completion attempt

Expected:

* no duplicate ledger
* second attempt blocked or replayed safely

Scenario G

Ambiguous payout result

Expected:

* no blind retry without review
* state held in safe execution-pending form

⸻

11. Transfer test matrix

Scenario A

Internal transfer success

Expected:

* transfer record created
* ledger posted exactly once
* both wallet projections updated

Scenario B

Insufficient balance

Expected:

* blocked cleanly
* no partial mutation

Scenario C

Duplicate request same idempotency key

Expected:

* same response returned
* no duplicate transfer

⸻

12. Refund test matrix

Scenario A

Create refund request

Expected:

* refund object created
* approval workflow correct

Scenario B

Approve and execute refund

Expected:

* refund evidence recorded
* payment refund state updated
* allocation reversal or offset correct
* payable balances adjusted

Scenario C

Partial refund

Expected:

* proportional or policy-defined allocation adjustment
* no over-refund

Scenario D

Refund after payout already made

Expected:

* negative carry-forward or recovery path visible
* payout block if required

⸻

13. Reconciliation test matrix

Scenario A

Matched inbound payment

Expected:

* reconciliation item matched
* no open exception

Scenario B

Unmatched inbound payment

Expected:

* exception queue item created
* no auto-confirm

Scenario C

Settlement mismatch

Expected:

* treasury-visible exception
* payout caution signal

Scenario D

Payout settlement matched

Expected:

* payout state can move to reconciled-complete if model supports it

Scenario E

Ledger projection mismatch

Expected:

* alert and exception created
* projector repair path available

⸻

14. Callback and fulfillment test matrix

Scenario A

Confirmed payment triggers source-site callback success

Expected:

* outbox created
* delivery success logged
* source status updated if integrated

Scenario B

Callback fails first time, succeeds on retry

Expected:

* retry schedule works
* no duplicate financial effect

Scenario C

Callback permanently fails

Expected:

* dead-letter or exception visible
* payment truth remains correct

⸻

15. Role and permission test matrix

support_admin

* can view customer-safe payment detail
* cannot approve payout
* cannot see full payout account

site_admin

* can see only own site
* cannot access another site by direct URL or search

finance_admin

* can approve deposit and resolve reconciliation
* cannot view raw provider secrets

treasury_admin

* can execute payout
* cannot edit revenue rules unless separately granted

security_admin

* can inspect signature failure evidence
* cannot routinely approve payout

read_only_auditor

* can export authorized reports
* cannot mutate anything

⸻

16. Security test matrix

Verify:

* webhook signature validation enforced
* missing/invalid secret blocks provider trust
* raw secret never returned through API
* PII masked in UI where expected
* audit logs created for all sensitive actions
* permission denials occur correctly
* manual override requires reason
* replay attempts do not duplicate outcome

⸻

17. Async and queue test matrix

Scenario A

Callback outbox retry

Expected:

* retry attempts recorded
* eventual success or dead-letter

Scenario B

Payout execution job duplicate delivery

Expected:

* no double execution

Scenario C

Reserve release cron

Expected:

* only matured holds released
* blocked holds remain blocked

Scenario D

Stale session expiration

Expected:

* active expired sessions close cleanly
* late payment still reconcilable

⸻

18. Observability checks

Verify dashboards or logs expose:

* webhook failures
* duplicate events
* payout failures
* reconciliation backlog
* callback dead-letter count
* provider health degradation
* oldest queue age
* treasury mismatch alerts

Acceptance:
Team must be able to detect problems without reading raw DB manually.

⸻

19. Financial integrity checks

These are mandatory go-live checks.

Check 1

Every successful deposit path posts balanced ledger entries.

Check 2

Every successful payout path posts balanced ledger entries.

Check 3

Duplicate requests do not create duplicate ledger effect.

Check 4

Helper balances can be reconciled against ledger.

Check 5

Refunds affect allocations and payable balances correctly.

Check 6

No terminal payment state exists without explainable evidence chain.

⸻

20. Pre-live dry run script

Before live, run a full end-to-end dry run in staging:

1. create product and site config
2. create payment intent
3. create hosted session
4. simulate or execute real low-value payment
5. verify confirmation path
6. verify ledger write
7. verify allocation generation
8. verify callback delivery
9. create payout request from eligible balance
10. approve payout
11. simulate payout execution completion
12. verify payout ledger
13. generate receipt
14. run reconciliation batch
15. review admin dashboards and audit trail

This dry run must be recorded as evidence.

⸻

21. Production smoke test after deploy

Immediately after production deploy, run safe low-risk smoke tests:

* health endpoints
* config sanity
* create one controlled internal payment intent
* create one hosted session
* verify one webhook path can be received in safe test mode if supported
* verify queues processing
* verify dashboard visibility
* verify no permission regression

Do not perform uncontrolled high-value live testing first.

⸻

22. Go-live blocking conditions

Live launch must be blocked if any of the following remain true:

* webhook signature verification not proven
* duplicate webhook creates duplicate financial effect
* payout completion can duplicate ledger posting
* role scope leaks cross-site data
* reconciliation queue not visible
* callback outbox not retrying
* ledger mismatch unresolved
* treasury totals not explainable
* critical secrets misconfigured
* admin overrides not audited

⸻

23. Required evidence packet for go-live

The team must collect:

* environment config checklist
* migration success proof
* sample successful payment trace
* sample duplicate webhook proof
* sample payout completion trace
* sample reconciliation exception trace
* permission test results
* dashboard screenshots or summaries
* audit trail sample
* rollback and incident owner list

This becomes the go-live evidence packet.

⸻

24. Role-specific acceptance sign-off

Backend lead signs off

* service orchestration
* idempotency
* queue safety
* webhook correctness

Frontend lead signs off

* checkout truthfulness
* state UX
* copy implementation
* no false success messaging

Finance ops signs off

* allocation visibility
* reconciliation queue
* refund handling
* treasury explainability

Treasury signs off

* payout approval and execution controls
* hold and release behavior
* ambiguity handling

Security signs off

* secrets handling
* permission boundaries
* audit coverage
* signature validation

Product signs off

* flow completeness
* admin usability
* source-site integration readiness

⸻

25. Definition of done for internal go-live

pay.iai.one is ready for controlled internal go-live only when:

* one internal source site can run end to end
* hosted checkout is truthful and stable
* one real or controlled payment can confirm correctly
* ledger writes are balanced and inspectable
* revenue allocation works
* payout queue works
* callback outbox works
* reconciliation queue works
* roles are enforced
* dashboards expose operational truth
* evidence packet exists
* all owners have signed off

⸻

26. Final direction

The right standard is not “it seems to work.”

The right standard is:
the team can prove the system behaves correctly under success, failure, duplication, delay, mismatch, retry, and review.

That is the minimum bar for a payment control plane.
