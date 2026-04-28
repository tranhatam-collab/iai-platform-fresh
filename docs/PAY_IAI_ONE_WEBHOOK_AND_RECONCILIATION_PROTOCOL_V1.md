# PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1

Version 1.0

Status: Production Protocol Lock

Scope

Provider callbacks, event verification, event normalization, idempotent processing, payment confirmation truth, settlement verification, payout reconciliation, refund reconciliation, and exception handling for pay.iai.one

Owners

Platform / Payments / Backend / Security / Finance Ops / Treasury / Observability

Priority

Highest

⸻

0. Core statement

A payment is not true because a frontend redirect says success.
A payment is not true because one provider field says paid.
A payout is not complete because one operator claims it was sent.

Truth must be verified, normalized, reconciled, and preserved as evidence.

This protocol defines how external events become internal trusted financial state.

⸻

1. Purpose

This file defines the mandatory operating protocol for:

* inbound provider webhooks
* bank and QR verification events
* settlement matching
* payout execution reconciliation
* refund evidence confirmation
* duplicate event prevention
* exception handling
* evidence retention

⸻

2. Principles

2.1 Capture before mutate

Always capture raw event evidence before changing business state.

2.2 Verify before trust

Signature verification, authenticity checks, source validation, and reference validation are mandatory.

2.3 Normalize before business logic

Provider-specific field names must be converted into one internal event model.

2.4 Idempotency always

The same event may arrive multiple times.
The system must not create duplicate payment truth.

2.5 Reconciliation is mandatory

Webhook confirmation alone may not be enough for all rails.
Settlement and treasury confirmation must also be supported.

2.6 Evidence must remain inspectable

Finance ops and security must be able to inspect event chain, verification result, matching result, and final decision.

⸻

3. Supported event sources

The protocol must support events from:

* PayOS
* VietQR-related matching flows
* MoMo
* ZaloPay
* Stripe
* Payoneer
* manual bank import
* treasury manual verification
* future internal wallet events
* future crypto settlement events

Each source gets its own intake endpoint but must normalize internally.

⸻

4. Webhook intake pattern

Provider-specific routes should follow this family:

* /v1/webhooks/payos
* /v1/webhooks/vietqr
* /v1/webhooks/momo
* /v1/webhooks/zalopay
* /v1/webhooks/stripe
* /v1/webhooks/payoneer

Internal-only event routes may include:

* /v1/internal/bank-events/manual
* /v1/internal/settlement-events/import
* /v1/internal/payout-events/manual

⸻

5. Mandatory webhook handling sequence

For every inbound event, the system must perform these steps in order:

1. receive raw request
2. assign internal request id
3. store immutable raw payload snapshot or hash + secured raw storage reference
4. verify source authenticity
5. create normalized event shape
6. detect duplicate event
7. match to internal tenant, site, intent, session, order, payment, or payout
8. validate amount, currency, and reference consistency
9. decide event actionability
10. execute controlled state transition
11. write ledger only if event reaches trusted confirmation state
12. enqueue follow-up reconciliation or fulfillment tasks
13. preserve evidence and processing result

Do not skip steps.

⸻

6. Required normalized event model

Every external or imported event must normalize into at least these fields:

* internal_event_id
* source_type
* provider
* raw_event_id
* raw_event_timestamp
* received_at
* verification_status
* normalized_event_type
* normalized_status
* amount
* currency
* provider_reference
* external_payment_id
* order_reference
* payer_reference
* matched_payment_intent_id
* matched_payment_session_id
* matched_payment_id
* matched_payout_request_id
* actionability_status
* decision_reason
* evidence_hash

⸻

7. Verification model

7.1 Signature verification

If provider supports signature or MAC verification, it must be checked before event is trusted.

7.2 Authenticity fallback

If signature not available, use strongest available alternative:

* trusted origin validation
* bank statement import verification
* reference-bound amount consistency
* controlled operator confirmation

7.3 Verification result statuses

* verified
* partially_verified
* unverified
* failed_verification
* manual_verified

These statuses must be visible in ops.

⸻

8. Idempotency model

Webhook processing must be idempotent at two levels:

8.1 Event-level idempotency

Same provider event id must not be processed twice.

8.2 Outcome-level idempotency

If multiple different provider events refer to the same payment outcome, the system must not create duplicate payment confirmation or duplicate ledger posting.

This means matching logic must consider:

* provider raw event id
* external payment id
* order reference
* session id
* amount
* currency
* already confirmed payment state

⸻

9. Matching model

The system must attempt matching using layered strategy:

1. matched session reference
2. matched internal order reference
3. matched provider reference
4. matched external payment id
5. matched amount + time window + receiving profile
6. manual exception queue if still unresolved

Matching must never silently fall through into confirmed state when ambiguity remains.

⸻

10. Amount and currency validation

Before business state changes, verify:

* expected amount equals actual amount when strict exact match required
* allowed tolerance only where rule explicitly permits it
* expected currency equals actual currency
* receiving profile matches intended collection rail
* reference prefix matches site or session when applicable

If mismatch exists:

* do not auto-confirm
* create reconciliation exception
* surface review item

⸻

11. Payment confirmation truth ladder

The system should classify payment truth by confidence tier.

Tier 1: soft signal

Examples:
Frontend redirect, provider browser return, user-uploaded proof only.

Action:
Do not finalize payment truth.
May mark awaiting_confirmation or pending_review.

Tier 2: verified provider event

Examples:
Signed webhook from trusted provider with exact match.

Action:
May confirm payment internally if rule allows.

Tier 3: reconciled settlement truth

Examples:
Provider event plus treasury settlement match or bank inflow match.

Action:
Highest confidence.
May mark settled and fully reconciled.

This ladder helps keep internal truth honest.

⸻

12. Recommended payment event transitions

12.1 Awaiting payment to awaiting confirmation

Trigger:
Soft signal or partial provider event.

12.2 Awaiting confirmation to confirmed

Trigger:
Verified provider callback with matching amount, currency, and reference.

12.3 Confirmed to settled

Trigger:
Settlement or treasury reconciliation completed if required by rail.

12.4 Any non-terminal state to failed

Trigger:
Verified provider failure, expiration, or confirmed unsuccessful outcome.

No transition should happen without event evidence.

⸻

13. Ledger write policy

Webhook processing must not write ledger on every inbound event.
Ledger posting is allowed only when confirmation trust level satisfies policy.

Recommended V1:

* signed card/provider event with strong match → ledger may post at confirmed
* bank transfer or manual treasury inflow → ledger posts only after internal verification or manual approval
* ambiguous or partial data → no ledger post yet

The protocol must clearly separate:

* event received
* event verified
* event matched
* payment confirmed
* ledger posted
* reconciliation settled

⸻

14. Reconciliation modes

The engine must support:

14.1 Real-time reconciliation

Immediate comparison between event and expected internal session.

14.2 Scheduled reconciliation

Batch matching of:

* provider settlement reports
* bank statement imports
* payout execution files
* refund reports

14.3 Manual reconciliation

Finance ops resolves exceptions with evidence.

⸻

15. Reconciliation domains

The protocol must cover at least these domains:

* inbound payment reconciliation
* settlement reconciliation
* payout reconciliation
* refund reconciliation
* ledger-to-provider reconciliation
* ledger-to-bank reconciliation

⸻

16. Inbound payment reconciliation rules

Check:

* one confirmed external event maps to one internal payment
* one internal payment maps to one expected commercial object
* expected amount equals actual received amount
* currency matches
* receiving rail/profile matches
* no duplicate confirmation exists
* ledger posting exists if payment is marked confirmed
* site callback status is visible

⸻

17. Settlement reconciliation rules

Check:

* provider payout or settlement report matches internal grouped payments
* expected settled amount equals actual provider transfer
* fees applied are explainable
* clearing accounts can be resolved
* unmatched items become exceptions

⸻

18. Payout reconciliation rules

Check:

* payout request approved
* payout execution reference exists
* execution file or provider confirmation exists
* beneficiary account matches approved account
* amount sent equals amount intended
* payout state matches evidence
* payable balances reduced correctly
* failed payout restores or preserves correct balance state

⸻

19. Refund reconciliation rules

Check:

* refund request approved
* provider refund event received or manual treasury evidence exists
* refund amount equals approved refund
* allocation reversal or offset performed
* receipt and audit evidence retained

⸻

20. Exception categories

The system must classify exceptions clearly.

Recommended categories:

* unmatched_event
* duplicate_event
* amount_mismatch
* currency_mismatch
* unknown_reference
* signature_failure
* stale_event
* duplicate_payment_truth
* payout_execution_missing
* settlement_missing
* refund_mismatch
* ledger_mismatch
* callback_delivery_failed

⸻

21. Exception severity

Recommended severity levels:

* low
* medium
* high
* critical

Examples:

* duplicate low-confidence event ignored → low
* amount mismatch on high-value payment → high
* payout marked completed without settlement evidence → critical
* signature failure from provider endpoint → high

⸻

22. Required evidence retention

For each processed event, retain at minimum:

* request timestamp
* request headers snapshot or signed subset
* raw payload hash
* raw payload storage reference if saved
* verification result
* normalized event data
* matching result
* action taken
* actor or system processor id
* final state change reference
* linked payment or payout object id

⸻

23. Source-site callback protocol

Once internal payment truth is confirmed, the control plane may notify the originating site.

Notification rules:

* notify only after trusted confirmation threshold reached
* retries must be idempotent
* callback payload must include signed verification token or shared secret validation
* callback result must be logged
* failed callbacks must retry or remain visible in outbox queue

Source-site actions may include:

* unlock access
* mark order paid
* activate membership
* issue receipt
* trigger onboarding
* create entitlement

⸻

24. Callback outbox pattern

Use an outbox rather than direct inline fire-and-forget.

Each callback item should store:

* target site
* target URL
* event type
* payload hash
* retry count
* last attempt timestamp
* delivery state
* response status
* response body hash or summary

This protects reliability.

⸻

25. Admin review workflow for exceptions

Finance ops must have an exception queue with these actions:

* inspect evidence
* rematch entity
* approve manual confirmation
* reject event
* mark false duplicate
* escalate to treasury
* request payout freeze
* request ledger adjustment
* close resolved exception

No manual resolution should happen without audit trail.

⸻

26. Recommended tables

This protocol relies on or extends:

* provider_webhook_events
* payment_sessions
* provider_attempts
* payments
* payout_requests
* refunds
* reconciliation_runs
* reconciliation_items
* entitlements_outbox
* notifications
* audit_logs
* risk_flags
* system_events

⸻

27. Reconciliation run model

Each reconciliation run should store:

* run id
* run type
* source
* started_at
* completed_at
* status
* filter window
* summary counts
* operator or system actor
* artifact reference if imported file used

Run types may include:

* inbound_payment_batch
* provider_settlement_batch
* bank_statement_batch
* payout_batch
* refund_batch
* ledger_balance_check

⸻

28. Reconciliation item model

Each item should store:

* reconciliation_run_id
* domain
* external_reference
* internal_reference
* amount_expected
* amount_actual
* currency_expected
* currency_actual
* match_status
* exception_category
* severity
* decision_status
* resolved_by
* resolved_at
* evidence_json

⸻

29. Observability requirements

Ops dashboards must show:

* webhook throughput by provider
* verification success rate
* duplicate rate
* signature failure rate
* unmatched event count
* confirmation latency
* settlement latency
* payout reconciliation failure count
* refund mismatch count
* callback delivery success rate

This is not optional.

⸻

30. Security rules

30.1 Provider secrets

Managed only through runtime secrets.

30.2 Raw payload protection

Sensitive payloads must be retained safely.
Do not expose raw payload broadly in UI.

30.3 Replay protection

Use event-level dedupe and timestamp tolerance where provider supports it.

30.4 Manual verification control

Manual verification must require explicit operator identity and notes.

30.5 Immutable evidence chain

Never silently overwrite original webhook truth.

⸻

31. Minimum acceptance criteria

The protocol is not ready until:

1. one provider event can be captured and verified
2. duplicate webhook does not duplicate payment confirmation
3. unmatched webhook appears in exception queue
4. matched webhook can confirm payment and write ledger if policy allows
5. source-site callback can be sent from confirmed payment
6. payout execution evidence can be matched to payout request
7. bank or settlement reconciliation can produce matched and unmatched items
8. refund event can produce correct refund reconciliation record
9. all manual resolutions are auditable
10. dashboard exposes exception counts and provider health

⸻

32. Final direction

Webhook handling is not an integration detail.
Reconciliation is not a later finance convenience.

Together they are the truth-conversion layer between external money signals and internal financial state.

If this protocol is weak, the system will falsely believe money arrived, left, or matched when it did not.

pay.iai.one must therefore treat webhook and reconciliation protocol as core infrastructure.
