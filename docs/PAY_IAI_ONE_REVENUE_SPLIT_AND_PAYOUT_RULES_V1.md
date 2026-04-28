# PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1

Version 1.0

Status: Production Rule Lock

Scope

Revenue allocation, internal ownership, payable creation, payout eligibility, payout approval, payout execution, reversal, and settlement rules for pay.iai.one

Owners

Founder / Product / Platform / Payments / Finance Ops / Treasury / Backend / Security

Priority

Highest

⸻

0. Core statement

One incoming payment does not automatically mean one party owns all of that money.

A confirmed payment must be translated into explicit internal economic ownership through revenue allocation rules.

That ownership must then become payable balances according to policy, timing, risk, reconciliation state, and approval rules.

Collection and payout are different systems.

The platform collects money first.
The platform allocates ownership second.
The platform makes balances eligible third.
The platform pays out fourth.

That separation is mandatory.

⸻

1. Purpose

This file defines how pay.iai.one must:

* split one confirmed payment into multiple internal allocations
* decide which part is platform revenue
* decide which part becomes payable to internal or external beneficiaries
* decide when an allocation becomes payout-eligible
* decide which payouts require approval
* prevent unsafe payout from unverified or reversible money
* reverse or compensate allocations during refund and settlement exceptions

⸻

2. Design principles

2.1 Allocation is explicit

No hidden sharing logic.
No spreadsheet-first split logic.
No hard-coded branching by random site code deep inside controllers.

2.2 Provider rails do not define ownership

Provider capability is not the truth of internal economics.

Even if a provider cannot natively split funds, the internal ledger and allocation engine still must determine ownership correctly.

2.3 Collection and payout must remain separated

Checkout success must not instantly trigger unrestricted payout.

2.4 Eligibility is policy-based

A beneficiary may be economically owed money but still not be eligible for payout yet.

2.5 Reversal behavior must be defined up front

Every rule must specify how partial refund, full refund, dispute, and reconciliation failure affect allocations and payable balances.

2.6 Ledger-backed only

Allocations and payout balances must be reconcilable with the ledger.
No shadow balances without accounting linkage.

⸻

3. Core concepts

3.1 Gross amount

Total amount collected from the payer.

3.2 Processing cost

Provider fee, treasury cost, FX cost, or operational charge linked to collection or payout.

3.3 Net collectible amount

Gross amount minus provider or rail cost where applicable.

3.4 Revenue allocation

Internal assignment of economic ownership across parties.

3.5 Beneficiary

The recipient of an internal allocation.

Possible beneficiary types:

* platform
* site
* operator
* partner
* affiliate
* project_pool
* reserve_pool
* contributor_pool
* merchant
* user_wallet
* treasury_hold

3.6 Payable balance

An amount owed to a beneficiary and potentially payable later.

3.7 Reserve hold

A portion temporarily withheld for risk, refund window, or treasury protection.

3.8 Payout eligible date

The earliest time a payable allocation may be considered for payout.

⸻

4. Revenue split lifecycle

The system must follow this sequence:

1. payment confirmed internally
2. payment ledger posted
3. revenue rule resolved
4. allocation lines generated
5. allocation ledger effect recorded if applicable
6. payable balances updated
7. eligibility clock applied
8. payout request created later by policy or operator action
9. payout reviewed, approved, executed, reconciled

Do not skip steps.
Do not combine them into a single uncontrolled mutation.

⸻

5. Minimum supported allocation types

The engine must support at least these allocation types in V1:

* platform_fee
* site_share
* operator_share
* partner_share
* affiliate_share
* reserve_hold
* treasury_hold
* project_pool
* contribution_pool
* payout_processing_fee
* adjustment
* refund_offset

⸻

6. Revenue rule model

A revenue rule is a reusable template that determines how one payment should be economically split.

Each revenue rule must define:

* rule id
* rule code
* rule name
* active status
* applicable tenant or site
* applicable product type or purpose
* priority
* allocation lines
* reserve logic
* payout eligibility timing
* refund behavior
* negative balance handling
* reconciliation dependency
* approval dependency

⸻

7. Revenue rule line model

Each revenue rule line must define:

* line id
* allocation_type
* beneficiary_type
* beneficiary_id or resolver
* fixed amount or percentage
* calculation base
* minimum threshold
* maximum threshold if needed
* rounding rule
* payout eligible delay
* holdback behavior
* reversal priority

⸻

8. Calculation bases

Each line must calculate against one of these bases:

* gross_amount
* net_after_provider_fee
* net_after_platform_fee
* residual_after_prior_lines
* fixed_amount

The engine must never guess the base.

⸻

9. Rounding and residual policy

To avoid accounting drift, the engine must define one platform-wide rounding policy.

Recommended V1 policy:

* calculate all line amounts in minor units
* round down percentage-derived lines
* send final remainder to a designated residual line, usually platform_fee or site_share depending on rule

Residual ownership must be explicit.

⸻

10. Default rule templates

10.1 Standard digital sale

Use case:
Document sale, digital product, private material, one-time paid content.

Recommended structure:

* provider fee: operational cost line
* platform fee: fixed percentage
* site share: main beneficiary
* reserve hold: optional if refund window exists

10.2 Membership sale

Use case:
Membership access, subscription-like enrollment, community access.

Recommended structure:

* provider fee
* platform fee
* site share
* support or operations reserve
* delayed payout eligibility until refund window passes

10.3 Affiliate sale

Use case:
One party refers buyer, another owns product.

Recommended structure:

* provider fee
* platform fee
* site share
* affiliate share
* optional reserve hold

10.4 Partner share sale

Use case:
Joint delivery between site owner and named partner.

Recommended structure:

* provider fee
* platform fee
* primary operator share
* partner share
* reserve hold

10.5 Contribution pool

Use case:
Non-public support, internal contribution, designated fund flow.

Recommended structure:

* provider fee
* platform operations fee if policy applies
* project_pool allocation
* reserve hold if governance requires

10.6 Wallet top-up

Use case:
User deposits into internal balance.

Recommended structure:

* no economic sale split in the usual sense
* amount becomes wallet liability
* processing fee may be treated separately
* not a site revenue rule in the normal commercial sense

⸻

11. Beneficiary resolution

A rule line may reference a direct beneficiary or a resolver strategy.

Supported resolver patterns:

* fixed platform beneficiary
* source site owner
* product owner
* operator assigned to site
* affiliate from order metadata
* partner attached to product
* designated pool account
* customer wallet

The system must persist resolved beneficiary identity into the allocation record.
Do not only keep it virtual in memory.

⸻

12. Eligibility timing model

An allocation may be economically assigned immediately but payable later.

Supported V1 eligibility policies:

* immediate
* after N days
* after refund window expires
* after reconciliation success
* after manual finance approval
* after KYC completion
* after minimum threshold reached
* after dispute window passes

Each allocation record must store:

* payout_eligible_at
* eligibility_status
* block_reason if blocked

⸻

13. Reserve hold model

The system must support temporary holdbacks.

Reserve hold use cases:

* refund risk window
* chargeback-like risk
* new payee protection
* treasury liquidity protection
* compliance review
* manual finance reserve

Reserve hold is not lost money.
It is a controlled temporary allocation state.

It must be visible in dashboards.

⸻

14. Payable balance categories

For each beneficiary and currency, the system should track conceptually:

* pending_allocated
* reserve_held
* eligible_payable
* queued_for_payout
* executing_payout
* paid_out
* reversed_or_offset
* blocked

These may be derived from ledger plus allocation state or persisted in helper tables, but truth must remain reconcilable.

⸻

15. Threshold rules

Payout should not fire for tiny fragmented amounts unless explicitly allowed.

The engine must support:

* minimum payout threshold by currency
* minimum payout threshold by beneficiary type
* site-specific payout threshold
* batched payout threshold
* manual override threshold

Example:

* VND payout threshold: 500000
* USD payout threshold: 25.00
* new partner threshold may require higher minimum and manual review

⸻

16. Payout request creation rules

A payout request may only be created if all of the following are true:

* beneficiary has active payout account
* beneficiary balance is eligible
* KYC or business verification status satisfies policy
* refund hold window has passed if required
* no blocking risk flag exists
* no unresolved reconciliation issue blocks funds
* amount meets threshold
* no duplicate payout request exists for same allocatable balance window

⸻

17. Payout approval policy

V1 must support policy-driven approval.

Example approval rules:

* below threshold: auto-approve if all controls pass
* above threshold: manual approval required
* first payout to a payee: manual approval required
* large affiliate payout: manual approval required
* payout to changed bank account: manual approval required
* negative site net position: block
* unresolved refund exposure: block
* unresolved risk flag: block

Approval rules must be centrally configurable, not hidden inside one controller.

⸻

18. Payout execution rules

Execution must occur after approval, not before.

Execution modes:

* manual treasury execution
* batch payout execution
* provider/API execution
* internal wallet credit
* future automated cross-rail payout

Every execution attempt must have:

* execution reference
* payout rail
* requested amount
* fee estimate if any
* operator or system actor
* timestamp
* final outcome
* reconciliation evidence

⸻

19. Duplicate prevention

The engine must prevent:

* duplicate allocation generation for one payment
* duplicate payout request for same eligible balance block
* duplicate payout execution on retry
* duplicate approval transitions

Required controls:

* idempotency keys
* stable allocation fingerprint
* payout_request uniqueness rules
* execution reference uniqueness
* state-machine guarded transitions

⸻

20. Refund interaction rules

Refund must not be treated as just a provider action.
It must affect internal economics.

20.1 Full refund before payout

If payment fully refunded before any payout:

* reverse or offset all eligible allocations
* release or remove reserve holds accordingly
* mark payable amounts no longer payable
* write compensating ledger effect if needed

20.2 Partial refund before payout

If payment partially refunded:

* reduce allocations proportionally unless rule defines priority reversal
* update payable balances
* update reserve hold
* persist refund offset records

20.3 Refund after payout completed

If funds already paid out:

* create negative payable balance
* offset against future earnings
* or create manual recovery workflow
* surface high-priority finance exception

This must be explicit in admin ops.

⸻

21. Reconciliation interaction rules

Allocation eligibility and payout execution may depend on reconciliation state.

Examples:

* provider says paid but bank settlement not matched yet → allocation may exist, payout blocked
* bank inflow matched cleanly → payout eligibility may unlock
* payout execution submitted but no settlement evidence yet → payout remains executing
* settlement mismatch discovered later → block future payouts for beneficiary until resolved

⸻

22. Negative balance policy

A beneficiary may enter negative net position due to:

* post-payout refund
* manual correction
* dispute
* reconciliation reversal
* overpayment recovery

The system must support:

* negative payable carry-forward
* auto-offset from future allocations
* block payout while negative
* manual adjustment records

Do not hide negative balances.

⸻

23. Manual adjustment rules

Finance ops may need adjustments in limited cases.

Allowed examples:

* correction of allocation beneficiary
* correction of fixed amount due to configuration error
* treasury reconciliation correction
* reserve release correction
* payout reversal compensation

Every manual adjustment must require:

* reason
* before and after values
* actor identity
* linked evidence
* audit log
* optional secondary approval depending on amount

⸻

24. Recommended payout frequencies

V1 should support configurable schedules:

* on-demand manual
* daily batch
* weekly batch
* monthly batch
* threshold-triggered

Default recommendation for private rollout:

* no fully automatic same-day external payout
* batch payout with finance review
* more frequent only for proven internal-safe scenarios

⸻

25. Currency handling rules

V1 focus currencies:

* VND
* USD

Rules:

* do not mix allocation currencies silently
* store each allocation in original payment currency unless explicit FX engine exists
* do not simulate FX with hidden rates
* if future FX supported, use separate conversion records and treasury policy

⸻

26. Internal ledger direction

At conceptual level, confirmed payment should generate:

* asset increase to treasury or bank
* liability or revenue impact according to business model
* allocation-related internal payable or revenue classification
* reserve and payable states tracked consistently

Exact account mapping may vary by ledger account design, but rule engine outputs must always map cleanly into accounting truth.

⸻

27. Core payout states

Payout request states must remain controlled:

* created
* queued
* awaiting_approval
* approved
* executing
* completed
* failed
* reversed
* blocked

No arbitrary jump between states.

⸻

28. Allocation states

Recommended allocation states:

* created
* pending_eligibility
* eligible
* queued_for_payout
* partially_paid
* paid
* held_in_reserve
* reversed
* offset
* blocked

This makes ops and treasury work clear.

⸻

29. Recommended core tables

In addition to main schema already discussed, payout and split rule layer should use or extend:

* revenue_rules
* revenue_rule_lines
* revenue_allocations
* beneficiary_balances
* payout_accounts
* payout_requests
* payout_batches
* payout_executions
* refunds
* refund_allocations
* adjustment_records
* allocation_events
* approval_requests
* audit_logs

⸻

30. Minimum field direction

30.1 revenue_rules

* id
* tenant_id
* site_id
* rule_code
* rule_name
* purpose
* status
* priority
* eligibility_policy_json
* refund_policy_json
* payout_policy_json
* created_at
* updated_at

30.2 revenue_rule_lines

* id
* revenue_rule_id
* line_order
* allocation_type
* beneficiary_type
* beneficiary_resolver
* beneficiary_id
* calc_mode
* calc_value
* calc_base
* min_amount
* max_amount
* reserve_mode
* payout_delay_days
* reversal_priority
* active

30.3 revenue_allocations

* id
* payment_id
* revenue_rule_id
* line_id
* allocation_type
* beneficiary_type
* beneficiary_id
* amount
* currency
* status
* reserve_amount
* payout_eligible_at
* paid_amount
* reversed_amount
* blocked_reason
* created_at
* updated_at

30.4 payout_requests

* id
* beneficiary_type
* beneficiary_id
* payout_account_id
* currency
* amount
* source_balance_snapshot_json
* state
* approval_state
* queue_batch_id
* execution_reference
* failure_reason
* requested_at
* approved_at
* completed_at

⸻

31. Example rule templates

31.1 Standard site sale

For a 1,000,000 VND payment:

* provider fee: actual external cost tracked separately
* platform fee: 10 percent
* site share: 80 percent
* reserve hold: 10 percent for 7 days

If no refund event after hold window:

* reserve may convert to site share or designated pool depending on rule

31.2 Membership sale

For a membership product:

* platform fee: 15 percent
* site/operator share: 70 percent
* support operations reserve: 15 percent
* payout eligible only after 14 days

31.3 Affiliate sale

For one sale with affiliate:

* platform fee: 10 percent
* site share: 65 percent
* affiliate share: 15 percent
* reserve hold: 10 percent

31.4 Contribution pool

For a support flow:

* provider fee if any
* operations fee if governance allows
* project pool: 100 percent residual
* no personal payout unless downstream governance explicitly defines it

⸻

32. Acceptance criteria

This rule engine is not ready until:

1. one confirmed payment can generate stable allocation lines
2. the same payment cannot generate duplicate allocations
3. payout eligible timing works correctly
4. reserve hold works correctly
5. a payout request can be built from eligible balances only
6. approval thresholds block unsafe payout
7. full refund updates allocations correctly
8. partial refund updates allocations correctly
9. completed payout reduces payable balances correctly
10. audit evidence exists for each allocation and payout transition

⸻

33. Definition of done

The split and payout rule layer is production-ready only when:

* rule templates exist and are versioned
* allocation outputs are deterministic
* beneficiary resolution is explicit
* reserve and eligibility logic are visible
* payout approval policy is enforced
* refund reversal behavior is defined
* reconciliation dependency is enforced where required
* negative balance handling exists
* admin override is controlled and logged
* dashboards can explain why money is or is not payable

⸻

34. Final direction

One payment must become many clear truths:

* payment truth
* accounting truth
* ownership truth
* payout truth

If these are mixed together carelessly, the system will lose control.

pay.iai.one must therefore treat revenue split and payout rules as a first-class control system, not a convenience feature.
