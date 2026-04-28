PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md

Version 1.0

Status: Activation Operations Lock

Scope

Execution plan for Team D as the dedicated payments activation and treasury-operations lane for onboarding websites, legal owners, collection accounts, and payout accounts into pay.iai.one

Owners

Control Tower / Product / Payments / Backend / Finance Ops / Treasury / Security / Support

Priority

Highest

⸻

0. Core statement

Closing `pay.iai.one` and activating websites onto `pay.iai.one` are related, but they are not the same job.

The core payment lane must still be finished by the technical owner team.
But once the payment lane is usable, the work of onboarding real websites, owners, and accounts must run as a separate operational lane with its own discipline.

That lane is Team D.

Team D exists so the system does not get blocked by ad hoc spreadsheets, chat-only banking details, or inconsistent activation steps across websites.

⸻

1. Purpose

This file defines how Team D should operate as the dedicated activation lane for:

* Vietnam-first site onboarding
* international site onboarding
* collection account intake
* payout account intake
* treasury review
* finance ops review
* site-to-owner-to-account mapping
* activation readiness handoff into live operations

⸻

2. Team D role

Team D is the payments activation and treasury-operations lane.

Team D owns:

* intake of real site onboarding requests
* selection of the correct onboarding form
* collection of owner, site, collection-account, and payout-account data
* account verification evidence intake
* finance ops review
* treasury control review
* activation readiness tracking by site
* handoff to technical mapping and live activation

Team D does not own:

* payment runtime architecture
* provider adapter code
* webhook processing logic
* ledger logic
* payout service orchestration logic
* release gate authority

Those remain with the core technical pay lane and Team 1 authority chain.

⸻

3. Governing documents

Team D must use this plan together with:

* PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md
* PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md
* PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md
* PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md
* PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md
* PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md
* PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md
* PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md
* PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md
* PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md
* PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md
* PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md
* PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md
* PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md

If this file conflicts with the master project index on authority, release gating, or safety rules, the master project index wins.

⸻

4. Relationship to other teams

Team A

Team A should feed Team D the inventory of websites waiting for activation, including:

* domain
* business owner
* market
* launch urgency
* whether the site needs collection
* whether the site needs payout

Team B

Team B remains the technical owner of the `pay.iai.one` money lane and must support Team D when a site needs:

* technical account mapping
* provider-side configuration
* callback setup
* reconciliation mapping
* runtime readiness confirmation

Team C

Team C supports Team D on:

* permission safety
* audit requirements
* payout control review
* security review
* QA for activation and admin safety

Team 1

Team 1 remains:

* release authority
* gate authority
* final escalation point
* final decision owner for activation blockers that cross safety boundaries

⸻

5. Current source of truth and pay-lane constraints

As of `2026-04-22`, Team D should treat the active intake board as the live source of truth for row coverage.

The older candidate audit remains reference-only.
It does not control current intake scope anymore.

Current `pay.iai.one` constraints:

* `payOS-first`
* `VND-only`
* `one_time-only`
* mandatory `x-site-key`
* mandatory `x-idempotency-key`

Not yet safe to treat as live-ready for:

* recurring billing at production standard
* full subscription lifecycle orchestration
* broad downstream webhook fulfillment
* payment email migration without provider action, SMTP `messageId`, D1 evidence, and inbox proof

Do not allow a site to claim `READY_FOR_LIVE` while the pay gate still remains `LOCK_RETAINED`.

⸻

6. Inputs Team D must receive before starting a site

Before Team D starts onboarding a site, the intake row must at minimum identify:

* site code or temporary intake ID
* domain
* market type: Vietnam or international
* legal owner type: company or individual
* whether customer collection is required
* whether payouts are required
* target country
* target currency
* urgency or target live date if known

If those fields are missing, Team D may create a placeholder intake row, but the site must remain blocked until the missing identity inputs are supplied.

⸻

7. Team D operating flow

Step 1

Create one intake row per website or operating surface.

Step 2

Choose the correct onboarding form:

* Vietnam site -> PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md
* International site -> PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md

Step 3

Collect legal owner data, site data, collection-account data, and payout-account data if applicable.

Step 4

Attach evidence of account control or provider verification.

Step 5

Run finance ops review.

Step 6

Run treasury review.

Step 7

If the site introduces permission, fraud, sanctions, or payout-risk complexity, trigger security review.

Step 8

When the onboarding packet is operationally complete, hand off to Team B for technical mapping and runtime readiness checks.

Step 9

Mark the site:

* `READY_FOR_STAGING`
* or `READY_FOR_LIVE`
* or `BLOCKED`

based on actual evidence, not optimism.

⸻

8. Team D status vocabulary

Use only these statuses in the intake board:

* `NEW_INTAKE`
* `FORM_SELECTION_REQUIRED`
* `FORM_IN_PROGRESS`
* `OWNER_VERIFICATION_PENDING`
* `FINANCE_OPS_REVIEW`
* `TREASURY_REVIEW`
* `SECURITY_REVIEW`
* `TEAM_B_MAPPING_PENDING`
* `READY_FOR_STAGING`
* `READY_FOR_LIVE`
* `LIVE`
* `BLOCKED`
* `REJECTED`

Do not invent soft states like:

* almost ready
* nearly done
* waiting a bit
* pending some small details

⸻

9. Current site priority order

The current locked priority order is:

1. `tranhatam.com`
2. `nguyenlananh.com`
3. `omdala.com`
4. `app.omdala.com`
5. `omdalat.com`
6. `app.omdalat.com`
7. `vc.vetuonglai.com`
8. `invest.vetuonglai.com`
9. `life.vetuonglai.com`
10. `flow.iai.one`
11. `life.iai.one`
12. `aiaccountingloop.com`
13. `tramsaigon.com`

The following remain lower priority placeholders or blocked rows unless Control Tower changes scope:

* `app.iai.one`
* `noos.iai.one`
* `cios.iai.one`
* `lamviec.muonnoi.org`

⸻

10. Priority order

Team D should execute in this order unless Control Tower explicitly changes the sequence:

1. Vietnam-first sites that are blocked only by account onboarding
2. Vietnam-first sites needing collection-only activation
3. Vietnam-first sites needing both collection and payout
4. International sites needing collection-only activation
5. International sites needing both collection and payout

Do not start with the most complex international payout case if simpler Vietnam-first sites are already waiting to go live.

⸻

11. Required evidence per site

A site should not move to `READY_FOR_LIVE` unless the intake packet includes:

* legal owner truth
* site truth
* collection account or collection rail truth
* payout account truth if payouts are enabled
* activation routing truth
* evidence of account control
* finance ops review result
* treasury review result
* technical mapping request or confirmation
* sender package
* blocker notes if anything remains open

⸻

12. What Team D must not do

Team D must not:

* store passwords, OTPs, PINs, card CVVs, or raw banking secrets in docs
* bypass treasury review for payout-enabled sites
* bypass security review when high-risk conditions exist
* declare a site live only because forms look complete
* create a local shadow truth different from the canonical forms
* change runtime payment logic directly instead of handing off to Team B
* treat redirect UI alone as payment truth
* treat queued email alone as delivered payment evidence
* migrate recurring or subscription behavior into the current one-time-only pay lane by assumption

⸻

13. Definition of done for one site

A site activation is only done when:

* the correct onboarding form is complete
* collection setup is complete if required
* payout setup is complete if required
* evidence of control exists
* sender package is complete
* finance ops review is complete
* treasury review is complete
* technical mapping is complete or explicitly confirmed not required
* the intake board row is updated to `READY_FOR_LIVE` or `LIVE`
* no unresolved blocker remains hidden

⸻

14. Daily operating rhythm

Every working day, Team D should review:

* new intake rows
* blocked rows
* rows waiting for finance ops
* rows waiting for treasury
* rows waiting for Team B mapping
* rows ready to move into staging or live

The intake board, weekly status, and risk register must tell the same story.

Use the daily template:

* PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md

Use the validator before closing the daily update:

* `node scripts/pay-team-d-intake-board-check.mjs --date=YYYY-MM-DD`

⸻

15. Immediate start instruction

Team D should begin immediately with:

1. aligning the live intake board to the full 17-row scope
2. selecting the correct onboarding form for each row
3. collecting owner, account, and sender-package truth
4. collecting activation-routing truth
5. pushing incomplete or risky rows into explicit `BLOCKED` or `FORM_SELECTION_REQUIRED`
6. using the handoff checklist before any Team B mapping request

⸻

16. Final direction

Team D should function as the bridge between payment-system readiness and real operational activation.

That means Team D is not a side task.
It is the lane that turns payment infrastructure into live websites with real owners, real accounts, and real treasury control.

That is the correct execution standard for Team D inside pay.iai.one.

⸻
