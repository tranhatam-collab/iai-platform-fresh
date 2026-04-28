# PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1

Version 1.0

Status: Production Ops Playbook Lock

Scope

Operational playbooks for payment mismatches, webhook failures, payout ambiguity, refund mismatches, ledger inconsistencies, site callback failures, and exception triage in pay.iai.one

Owners

Finance Ops / Treasury / Payments Ops / Security / Support / Platform

Priority

Highest

⸻

0. Core statement

Exceptions are not edge cases to ignore.
Exceptions are where financial trust is either preserved or destroyed.

pay.iai.one must have a repeatable operational playbook so that different team members do not improvise inconsistent fixes under pressure.

⸻

1. Purpose

This file defines how the team must triage and resolve the most important exception classes in the system.

The goal is to ensure:

* no silent loss of truth
* no duplicate financial correction
* no emotional panic handling
* no undocumented manual workaround
* no payout from unresolved money state

⸻

2. General triage principles

2.1 Freeze unsafe automation before fixing

If an exception could lead to wrong payout, wrong refund, or duplicate settlement, block the downstream action first.

2.2 Investigate using evidence chain

Always inspect:

* payment intent
* session
* webhook events
* provider attempts
* payment record
* ledger record
* reconciliation item
* audit trail
* callback status
* payout or refund linkage if relevant

2.3 Do not patch by editing tables directly

Use approved admin actions or controlled service-layer recovery flows.

2.4 Preserve timeline

Never overwrite original event truth.
Always add resolution notes and linked actions.

⸻

3. Severity levels

Low

No financial side effect yet.
Example:
duplicate ignored webhook event.

Medium

Needs review but no money-out risk yet.
Example:
payment reference mismatch awaiting finance check.

High

Can affect customer access, settlement truth, or allocation timing.
Example:
provider event says paid but order match ambiguous.

Critical

Can cause wrong treasury action, wrong payout, or accounting corruption.
Example:
payout marked completed without settlement evidence.

⸻

4. Standard triage workflow

For every exception:

1. classify domain
2. classify severity
3. assign owner
4. apply immediate protection if needed
5. inspect evidence
6. determine safe resolution path
7. execute controlled resolution
8. audit and document outcome
9. monitor for recurrence pattern

⸻

5. Exception domains

Primary domains:

* unmatched inbound payment
* duplicate webhook
* amount mismatch
* currency mismatch
* provider signature failure
* stale awaiting confirmation
* callback delivery failure
* payout execution ambiguity
* payout completed without evidence
* payout failed after funds reserved
* refund mismatch
* allocation mismatch after refund
* ledger mismatch
* treasury settlement mismatch
* site callback entitlement mismatch

⸻

6. Playbook: unmatched inbound payment

Definition

An external payment event or bank inflow exists but no clean internal payment match is found.

Likely causes

* missing or incorrect transfer reference
* late event arrival after session expiry
* source site generated order incorrectly
* wrong amount or wrong currency
* duplicate session use

Immediate action

* do not auto-confirm payment
* do not auto-refund immediately unless policy says so
* move to reconciliation exception queue

Investigation steps

1. search by provider reference
2. search by order reference variants
3. search by amount and time window
4. search by receiving account profile
5. inspect nearby expired sessions
6. inspect customer-reported evidence if available

Safe resolutions

* manual match to correct session and confirm if evidence is strong
* mark as unidentified inflow pending customer claim
* refund or return path only after treasury policy confirms

Prohibited action

Do not create arbitrary fake order to absorb money silently.

⸻

7. Playbook: duplicate webhook

Definition

Same external event or equivalent outcome arrives more than once.

Immediate action

* ensure idempotency guard prevents second financial effect

Investigation steps

1. compare raw event id
2. compare external payment id
3. confirm whether first event already posted ledger
4. confirm duplicate detection status

Safe resolution

* mark later event as ignored duplicate
* preserve evidence record
* no further action if first outcome already correct

Escalation

If duplicate event caused duplicate state or duplicate ledger attempt, escalate to critical incident and use controlled correction flow.

⸻

8. Playbook: amount mismatch

Definition

Expected amount and actual amount differ.

Immediate action

* block automatic confirmation
* block payout if related downstream flow already exists

Investigation steps

1. compare payment intent expected amount
2. inspect actual provider/bank amount
3. inspect site pricing or order bug possibility
4. inspect partial payment policy if any
5. inspect whether customer made wrong payment manually

Safe resolution

* manual confirm only if policy allows and order can accept partial/overpayment handling
* otherwise keep exception open and trigger support or treasury review
* create refund difference handling if needed

Prohibited action

Do not silently round or ignore amount mismatch for convenience.

⸻

9. Playbook: currency mismatch

Definition

Actual payment currency differs from expected session currency.

Immediate action

* block confirmation
* mark high severity unless explicit FX rule exists

Safe resolution

* manual treasury review only
* no payout or allocation based on assumption

⸻

10. Playbook: provider signature failure

Definition

Webhook authenticity check failed.

Immediate action

* do not trust event
* flag as high or critical depending on pattern
* notify security_admin if repeated

Investigation steps

1. inspect header/signature
2. inspect secret rotation timing
3. inspect endpoint misconfiguration
4. inspect replay pattern

Safe resolution

* only accept through manual evidence if alternative strong verification exists
* otherwise ignore and keep watching for valid retry

Prohibited action

Never mark payment paid based only on failed-signature event.

⸻

11. Playbook: stale awaiting confirmation

Definition

Session or payment remains awaiting confirmation beyond normal window.

Immediate action

* surface to ops queue
* do not let user-facing state drift indefinitely without note

Investigation steps

1. inspect provider attempts
2. inspect webhook arrival
3. inspect bank import
4. inspect callback delivery
5. inspect whether payment arrived late after expiry

Safe resolution

* confirm if evidence now sufficient
* expire if no payment truth exists
* send support-safe update if customer-facing impact exists

⸻

12. Playbook: callback delivery failure

Definition

Payment confirmed internally but source-site callback not delivered.

Immediate action

* financial truth remains valid
* entitlement may still be pending
* keep outbox retry alive

Investigation steps

1. inspect callback URL
2. inspect response codes
3. inspect signing or shared secret mismatch
4. inspect source-site downtime

Safe resolution

* retry through callback outbox
* allow source site to poll status
* manually resend after source fix

Prohibited action

Do not alter payment truth because callback failed.

⸻

13. Playbook: payout execution ambiguity

Definition

Payout was attempted but final external success or failure is unclear.

Immediate action

* freeze duplicate retry
* mark payout as executing_pending_reconciliation or equivalent
* block second payout execution

Investigation steps

1. inspect execution reference
2. inspect provider response
3. inspect treasury manual proof
4. inspect beneficiary receipt evidence if allowed
5. inspect bank or settlement export

Safe resolution

* reconcile and then mark completed
* or mark failed and release held balance only when strong evidence shows no money left treasury

Prohibited action

Do not both retry and mark completed without resolving ambiguity.

⸻

14. Playbook: payout completed without evidence

Definition

System shows payout complete but no reliable settlement evidence exists.

Severity

Critical

Immediate action

* freeze beneficiary further payouts
* escalate to treasury_admin and super_admin
* inspect whether ledger was posted incorrectly

Investigation steps

1. inspect audit trail of completion action
2. inspect execution reference
3. inspect treasury logs
4. inspect provider evidence
5. inspect beneficiary account and history

Safe resolution

* if truly paid, attach evidence retroactively and close with incident note
* if not paid, controlled payout reversal or correction flow
* if uncertain, keep blocked pending final treasury determination

⸻

15. Playbook: payout failed after funds reserved

Definition

Payout request reserved balance but external execution failed.

Immediate action

* verify no money left treasury
* restore eligible balance if safe
* clear executing hold

Investigation steps

1. inspect failure code
2. inspect provider execution reference
3. confirm treasury non-settlement
4. inspect retry safety

Safe resolution

* mark failed
* release funds back to eligible
* require beneficiary account correction if issue was payee-side

⸻

16. Playbook: refund mismatch

Definition

Approved refund amount and external refund evidence do not match.

Immediate action

* block related payout if necessary
* classify high severity

Investigation steps

1. inspect approved refund amount
2. inspect provider refund result
3. inspect prior partial refunds
4. inspect allocation reversal effect

Safe resolution

* adjust remaining refundable balance correctly
* create manual finance note and controlled correction if provider partial behavior differs
* do not silently zero out refund state

⸻

17. Playbook: allocation mismatch after refund

Definition

Refund processed but allocations/payables not properly reversed or offset.

Immediate action

* freeze downstream payout from affected beneficiary if exposure exists

Investigation steps

1. inspect payment allocations
2. inspect refund amount
3. inspect refund policy
4. inspect offset/reversal records
5. inspect beneficiary balance projection

Safe resolution

* run controlled allocation correction flow
* adjust payable balance
* create negative carry-forward if payout already happened
* audit every correction

⸻

18. Playbook: ledger mismatch

Definition

Cached balance, payment state, or projection does not reconcile with ledger truth.

Severity

High or critical depending on impact

Immediate action

* treat ledger as primary truth
* freeze affected automation if mismatch impacts payout or wallet operations

Investigation steps

1. identify affected entity
2. compare ledger transactions and entries
3. inspect projector updates
4. inspect duplicate or failed mutation attempt
5. inspect idempotency logs

Safe resolution

* rerun projector or controlled repair process
* never hand-edit helper balances without trace
* if ledger itself is wrong, escalate to controlled accounting correction flow

⸻

19. Playbook: treasury settlement mismatch

Definition

Provider or bank settlement totals do not match internal expected settlement.

Immediate action

* high visibility to treasury and finance
* block payout expansion if liquidity view may be wrong

Investigation steps

1. compare run totals
2. inspect provider fees
3. inspect missing payments
4. inspect timing windows
5. inspect multi-day carryover effect

Safe resolution

* create reconciliation items
* isolate unmatched portion
* only clear matched amounts as settled

⸻

20. Playbook: site entitlement mismatch

Definition

Payment confirmed internally but source site did not grant access or granted wrong access.

Immediate action

* payment truth remains
* treat fulfillment issue separately

Investigation steps

1. inspect callback outbox
2. inspect callback payload and signature
3. inspect source site response
4. inspect entitlement mapping configuration

Safe resolution

* resend callback
* let source site poll status
* manual entitlement grant only with audit trail if needed

⸻

21. Manual resolution rules

Any manual resolution must record:

* resolver identity
* time
* evidence reviewed
* chosen resolution path
* reason
* related entities
* whether any payout block or refund block was applied
* follow-up action required

⸻

22. Escalation map

Support-admin escalation

Customer-facing status confusion or callback issue

Payments-ops escalation

Session, provider attempt, webhook, or status ambiguity

Finance-admin escalation

Amount mismatch, refund mismatch, reconciliation exception

Treasury-admin escalation

Payout ambiguity, settlement mismatch, treasury risk

Security-admin escalation

Signature failure spike, suspicious duplicate pattern, admin override anomaly

Super-admin escalation

Critical incident, ledger correction necessity, major payout or settlement uncertainty

⸻

23. Incident threshold guidance

Escalate to incident mode if:

* duplicate ledger post occurred
* payout may have been executed twice
* provider signature failures spike unexpectedly
* treasury mismatch exceeds threshold
* multiple source sites report confirmed-payment entitlement failures
* reconciliation backlog passes risk threshold
* large unmatched inflow appears

⸻

24. Required dashboards and queues for playbook use

The playbook assumes these admin surfaces exist:

* payment detail
* webhook evidence view
* reconciliation exception queue
* payout queue
* refund queue
* audit explorer
* provider health
* treasury summary
* callback outbox status

Without these surfaces, the playbook cannot be executed safely.

⸻

25. Minimum acceptance criteria

This playbook is not operational until:

1. each major exception class has a named owner
2. queues can classify severity
3. operators can freeze unsafe downstream actions
4. evidence chain can be inspected end to end
5. manual resolutions are auditable
6. callback failures do not corrupt payment truth
7. payout ambiguity blocks duplicate payout
8. refund mismatch blocks unsafe payable release
9. ledger mismatch has controlled repair path
10. escalation thresholds are visible to team

⸻

26. Final direction

The control plane will be judged not by how it handles perfect cases, but by how it handles messy cases without losing truth, money, or trust.

This playbook is the discipline that keeps that from unraveling.
