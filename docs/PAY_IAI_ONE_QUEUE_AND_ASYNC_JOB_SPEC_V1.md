# PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1

Version 1.0

Status: Production Async Lock

Scope

Queue architecture, async job classes, retry policy, dead-letter handling, scheduling model, outbox processing, reconciliation jobs, payout execution jobs, notification jobs, and operational observability for pay.iai.one

Owners

Platform / Backend / Payments / Finance Ops / Treasury / Security / Product

Priority

Highest

⸻

0. Core statement

Not every important payment operation should happen inline in the request cycle.

But anything moved out of the request cycle must still remain controlled, idempotent, auditable, observable, and retry-safe.

Queues are not a place to hide broken logic.
Queues are the controlled execution layer for work that should happen asynchronously.

⸻

1. Purpose

This file defines:

* which jobs should run asynchronously
* which flows must remain synchronous
* queue classes and job types
* retry behavior
* dead-letter behavior
* job idempotency
* scheduling logic
* monitoring and alerting
* ownership boundaries between services and workers

⸻

2. Async design principles

2.1 Keep user-critical truth synchronous where needed

The following should remain synchronous when possible:

* payment intent creation
* payment session creation
* direct internal transfer completion
* manual deposit approval final mutation
* manual payout completion final mutation

2.2 Move secondary or delayed work to queue

Examples:

* callback delivery
* notification delivery
* payout execution after approval
* reconciliation batches
* stale session expiration
* provider retry sync
* report generation
* receipt generation if not needed instantly

2.3 Async jobs must be idempotent

A retried job must not duplicate money movement, callback effects, or audit truth.

2.4 Queue is not the source of truth

Queue payload is instruction context.
Persistent system state remains in DB and ledger.

⸻

3. Recommended queue domains

V1 should define at least these job domains:

* fulfillment_outbox
* notifications
* payout_execution
* reconciliation
* stale_session_maintenance
* provider_retry_or_sync
* receipt_generation
* audit_export
* reserve_release
* callback_retry

These may be separate queues or one queue with explicit routing keys, but operational isolation is preferred.

⸻

4. Required job classes

4.1 Fulfillment callback job

Purpose:
Notify source site after internal confirmation.

4.2 Notification job

Purpose:
Send operational or customer-safe notifications.

4.3 Payout execution job

Purpose:
Execute approved payout or move payout into execution attempt handling.

4.4 Reconciliation batch job

Purpose:
Run batch matching or settlement checks.

4.5 Stale session expiration job

Purpose:
Expire sessions that timed out without confirmed payment.

4.6 Receipt generation job

Purpose:
Create or render receipt artifacts or receipt references.

4.7 Reserve release job

Purpose:
Release payout hold after refund window or policy delay passes.

4.8 Audit export job

Purpose:
Generate export bundles for approved audit ranges.

⸻

5. Job payload design rules

Each job payload must include at minimum:

* job_type
* job_id
* created_at
* request_id if source request exists
* actor_type and actor_id if human-triggered
* entity_type
* entity_id
* tenant_id if applicable
* site_id if applicable
* idempotency_key or orchestration key if needed
* attempt_count
* trace metadata

Do not put unnecessary sensitive raw data in queue payload.

Use entity references, not full truth blobs, whenever possible.

⸻

6. Queue message size rule

Queue payloads should remain minimal.

Recommended pattern:

* include stable identifiers
* load current truth from DB inside worker
* include small immutable summary only if necessary
* avoid embedding raw provider payloads or full customer snapshots

⸻

7. Job idempotency model

Every async handler must implement one of these idempotency guards:

* outbox row state lock
* execution record uniqueness
* reconciliation run uniqueness
* job execution token or compare-and-set state transition
* final response or completion marker check

Examples:

* callback job must not deliver the same confirmed payment twice without tracking delivery attempts
* payout execution job must not execute same payout twice
* reserve release job must not release the same held allocation twice

⸻

8. Retry policy principles

Not all jobs should retry the same way.

Retry-friendly jobs

* callback delivery
* transient notification delivery
* provider timeout sync
* receipt generation
* audit export generation

Controlled retry jobs

* payout execution
* reconciliation import
* webhook follow-up processing

No blind retry without investigation

* ledger mismatch repair
* payout marked completed but settlement missing
* conflicting duplicate confirmation states

⸻

9. Recommended retry policy by job class

9.1 Fulfillment callback jobs

Retry:

* immediate first retry
* then spaced retries
* max 5 to 8 attempts
* after max attempts → callback failure queue / exception surface

9.2 Notification jobs

Retry:

* 3 to 5 attempts
* after max attempts → mark failed, do not block financial truth

9.3 Payout execution jobs

Retry:

* only for transient execution states
* do not blindly retry if provider may have already processed
* require execution reference check before retry
* escalate to treasury review on ambiguity

9.4 Reconciliation jobs

Retry:

* safe to rerun by run id or window if idempotent
* prevent duplicate reconciliation items for same run

9.5 Session expiration jobs

Retry:

* safe if state check ensures only active expired sessions mutate

⸻

10. Dead-letter model

A dead-letter path must exist for jobs that fail repeatedly or reach ambiguous terminal condition.

Dead-letter queue or dead-letter state must store:

* original job payload
* last error summary
* attempt count
* first attempted at
* last attempted at
* escalation severity
* linked entity id

Dead-letter items must appear in ops dashboard.

⸻

11. Async job state model

Recommended job states:

* queued
* picked_up
* processing
* succeeded
* retry_scheduled
* failed_terminal
* dead_lettered
* cancelled

This may be represented explicitly in job tables or inferred through logs and queue integration, but explicit persistence is strongly preferred for critical jobs.

⸻

12. Recommended async tables

In addition to queue provider itself, persist job tracking in DB.

Recommended tables:

* async_jobs
* async_job_attempts
* dead_letter_jobs
* callback_outbox
* notification_outbox
* payout_execution_attempts
* reconciliation_runs
* reconciliation_items
* receipt_jobs
* reserve_release_jobs

⸻

13. Fulfillment outbox processing flow

Trigger

Confirmed internal payment

Steps

1. create callback_outbox row
2. enqueue fulfillment callback job
3. worker loads outbox item
4. worker signs callback payload
5. deliver to source site
6. record response status
7. mark delivered or schedule retry
8. after repeated failure, surface exception

This outbox is the source of delivery workflow truth, not the queue alone.

⸻

14. Notification processing flow

Trigger examples

* payment confirmed
* payout approved
* payout failed
* refund confirmed

Steps

1. create notification_outbox row
2. enqueue notification job
3. resolve delivery channel
4. send
5. record delivery attempt
6. mark delivered or retry
7. if terminal failure, mark failed without impacting core payment truth

⸻

15. Payout execution queue flow

Trigger

Payout approved and routed to async execution

Steps

1. enqueue payout execution job with payout_request_id
2. worker loads payout and confirms still executable
3. acquire execution lock
4. create payout_execution_attempt
5. call provider or mark manual execution task
6. persist result
7. if confirmed completion, invoke payout completion service
8. if ambiguous, move to executing_pending_reconciliation
9. if failure, mark failed or retry-safe pending state
10. audit and alert if needed

⸻

16. Reconciliation batch flow

Trigger

Cron or manual admin request

Steps

1. create reconciliation_run row
2. enqueue domain-specific reconciliation job
3. worker loads pending external/internal records
4. compare
5. create reconciliation_items
6. auto-resolve safe matches
7. mark exceptions
8. publish summary metrics
9. complete run

⸻

17. Stale session expiration flow

Trigger

Cron every few minutes

Steps

1. query payment_sessions where active and expires_at < now
2. for each eligible session, enqueue expiration job or batch update through service
3. worker/service checks no confirmed payment already linked
4. mark expired
5. audit state change
6. preserve late-payment reconciliation path if payment later appears

Do not hard-delete sessions.

⸻

18. Reserve release flow

Trigger

Cron daily or hourly depending on volume

Steps

1. query allocations or held balances where hold policy has matured
2. verify no blocking refund, dispute, reconciliation, or risk flag
3. move allocation from held_in_reserve to eligible
4. update beneficiary balances
5. create audit event
6. optionally enqueue payout eligibility notification

⸻

19. Receipt generation flow

Trigger

Payment confirmed or settled

Steps

1. enqueue receipt generation job
2. load payment and receipt template data
3. generate receipt object or renderable artifact
4. persist receipt reference
5. link receipt to payment
6. notify or expose to UI

This can be synchronous later if simple enough, but async is safer for extensibility.

⸻

20. Audit export flow

Trigger

Scheduled daily export or manual authorized request

Steps

1. create export job
2. load audit window
3. produce export artifact
4. store artifact reference
5. make download available to authorized role
6. log export access

⸻

21. Queue ownership rules

Each queue domain must have clear owner.

Recommended owner mapping:

* fulfillment_outbox → platform/payments
* payout_execution → treasury/payments
* reconciliation → finance ops/platform
* notifications → platform/support
* reserve_release → finance ops/platform
* audit_export → security/platform

Ownership means who triages failures.

⸻

22. Monitoring requirements

For every queue domain, monitor:

* queued job count
* processing latency
* success rate
* retry rate
* dead-letter count
* oldest queued age
* average processing duration
* terminal failure count

These metrics must appear in internal dashboards or alerts.

⸻

23. Alert thresholds

Recommended initial alerts:

* callback dead-letter count above threshold
* payout execution queue backlog older than threshold
* reconciliation queue stalled
* receipt job failures spike
* stale sessions not being expired
* reserve release job not running for expected interval
* dead-letter growth over time

⸻

24. Concurrency and lock guidance

For sensitive async jobs, use lock discipline.

Required lock-sensitive domains:

* payout execution per payout_request_id
* reserve release per allocation id
* callback delivery per outbox item
* reconciliation run per run id
* receipt generation per payment id if one receipt per payment

⸻

25. Error taxonomy for async workers

Recommended categories:

* transient_network_error
* provider_timeout
* provider_ambiguous_result
* state_conflict
* idempotency_conflict
* missing_entity
* permission_misconfiguration
* data_integrity_error
* ledger_dependency_error
* callback_endpoint_failure
* serialization_lock_failed

This taxonomy helps dashboards and triage.

⸻

26. Worker response rule

Queue workers should never assume success unless DB state persisted successfully.

Preferred order:

1. load truth
2. validate state
3. mutate persistent state
4. persist result
5. mark job success

If step 3 or 4 fails, do not treat job as completed.

⸻

27. Minimum acceptance criteria

The async layer is not ready until:

1. callback outbox retries safely
2. payout execution job cannot double-execute same payout
3. stale sessions expire without harming confirmed payments
4. reconciliation batches can run and surface exceptions
5. reserve release works only for matured eligible holds
6. dead-letter path exists and is visible
7. queue metrics are observable
8. failed notification does not corrupt financial state
9. audit export jobs are permissioned and tracked
10. all sensitive async mutations are idempotent

⸻

28. Final direction

Async infrastructure is the operational muscle of the control plane.

It should move background work forward without ever creating silent duplicates, hidden failures, or invisible financial side effects.

That is the correct queue foundation for pay.iai.one.
