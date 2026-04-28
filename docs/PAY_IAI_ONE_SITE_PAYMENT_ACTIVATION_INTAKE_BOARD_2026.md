PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md

Version 1.0

Status: Live Intake Board

AI Owner plan (cross-lane, read first cho mọi vòng tương tác từ 2026-04-26 trở đi):
- `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`

Scope

Working intake board for onboarding websites, legal owners, collection accounts, payout accounts, sender packages, and activation readiness into pay.iai.one

Owners

Team D Payments Activation / Finance Ops / Treasury / Product / Control Tower

Priority

Highest

⸻

0. Core statement

This board is the live operating surface for site-by-site payment activation.

Its job is to answer, at any moment:

* which websites are waiting for onboarding
* which form each website must use
* what banking, provider, or sender-package data is still missing
* who is blocking activation
* which sites are ready for staging
* which sites are ready for live

If a site is not on this board, it is not in controlled activation.

⸻

1. Governing files

Use this board together with:

* PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md
* PAY_IAI_ONE_TEAM_D_DAILY_OPS_TEMPLATE_2026.md
* PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md
* PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md
* PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md
* PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md
* PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md
* PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md

⸻

2. Current source of truth rule

As of `2026-04-22`, the explicit Team D directive for activation intake is the source of truth for scope and row coverage.

This means:

* this intake board is the live source of truth for Team D execution
* the 17 active intake rows below define current operational scope
* `PAY_TEAM_D_SITE_ACTIVATION_CANDIDATE_AUDIT_2026-04-22.md` remains useful as a reference snapshot, but it is no longer the scope-setting document for Team D intake

⸻

2A. AI Owner snapshot 2026-04-26

Audit pass by AI Owner on `2026-04-26` against the 17 active intake rows in section 10:

* zero rows in `READY_FOR_LIVE`
* zero rows in `READY_FOR_STAGING`
* ten rows in `FORM_IN_PROGRESS`: SITE-INTAKE-100, 101, 102, 103, 104, 105, 108, 109, 110, 111
* four rows in `FORM_SELECTION_REQUIRED`: SITE-INTAKE-106, 107, 113, 114
* one row in `NEW_INTAKE`: SITE-INTAKE-112
* two rows in `BLOCKED` queue (section 13): SITE-INTAKE-115, 116
* five rows have founder-locked active assignment per section 9A: `tranhatam.com`, `omdalat.com`, `vc.vetuonglai.com`, `invest.vetuonglai.com`, `life.vetuonglai.com`
* receiver registry truth landed for VND rail (`recv_vnd_thailam_acb`, `recv_vnd_thanhtamphat_acb`) and USD rail (`recv_usd_angeledutam_foundation_relay_thread`) — wired into rows 100, 104, 108, 109, 110

Repo-side state tied to rows (not equivalent to live):

* `apps/pay/src/payment-routing.ts` and `apps/pay/src/site-activation-registry.ts` cover routing and registry
* `apps/pay/src/payment-email-templates.ts` and `apps/pay/src/team-d-payment-email-profiles.ts` cover content
* `apps/pay/src/payment-email-outbound-adapter.ts` covers the pay-to-mail bridge
* outbound payment-completion webhook sender shipped commits `b69292a` + `6cb0705`
* `tests/integration/pay-surface.test.mjs` covers contract assertions

What no row may yet claim, per section 9 evidence rule:

* one real provider action or true sandbox action — none captured for any row
* one real `checkout_url` or provider reference — none captured for any row
* one SMTP `messageId` from a real payment-driven send — none captured
* one D1 evidence record — none captured
* one inbox proof — none captured

`pay.iai.one` production gate remains `LOCK_RETAINED`. AI Owner will not flip any row to `READY_FOR_LIVE` until Team D + Team B + Team Email + Team SMTP nộp evidence theo quy ước trong `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md §3.4`.

Closeout chi tiết của vòng audit này: `PAY_IAI_ONE_AI_OWNER_INTAKE_REVIEW_2026-04-26.md`.

⸻

3. Current pay lane constraints

At this checkpoint, `pay.iai.one` is only considered suitable for:

* `payOS-first`
* `VND-only`
* `one_time-only`
* mandatory `x-site-key`
* mandatory `x-idempotency-key`

`pay.iai.one` is not yet considered live-ready for:

* recurring billing at production standard
* full subscription lifecycle orchestration
* large-scale downstream webhook fulfillment
* payment email migration without:
  * real provider action
  * SMTP `messageId`
  * D1 evidence
  * inbox proof

No row may be marked `READY_FOR_LIVE` if:

* `pay.iai.one` production gate still shows `LOCK_RETAINED`
* no real `checkout_url` exists
* no provider proof exists
* no payment email evidence exists

⸻

4. Required status values

Use only these statuses:

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

⸻

5. Required priority values

Use only these priorities:

* `P0`
* `P1`
* `P2`
* `P3`

Priority meaning:

* `P0` = website is waiting to go live and only payment activation is holding it back
* `P1` = website should be activated in the current wave
* `P2` = important, but not immediate
* `P3` = later wave or not yet launch-critical

⸻

6. Required columns

Every row must contain:

* `intake_id`
* `site_code`
* `domain`
* `priority`
* `market_type`
* `onboarding_form`
* `owner_type`
* `legal_owner`
* `collection_required`
* `payout_required`
* `collection_country_currency`
* `payout_country_currency`
* `assigned_owner`
* `current_status`
* `blocker`
* `next_action`
* `next_action_owner`
* `target_staging_date`
* `target_live_date`
* `evidence_refs`
* `notes`

⸻

7. Form selection rule

Use:

* `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` when `market_type = VN`
* `PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` when `market_type = INTERNATIONAL`

If market type or settlement model is not yet locked:

* keep `current_status = FORM_SELECTION_REQUIRED`

Do not mix VN and international account truth into one onboarding record.

⸻

8. Mandatory sender package per collection site

Every site with collection enabled must lock at minimum:

* `pay@domain`
* `billing@domain`
* `support@domain`
* `noreply@domain`

If a temporary shared sender is used, the intake row must explicitly record:

* temporary sender brand
* actual reply-to
* inbox owner

Payment mail must keep explicit sender policy:

* `EMAIL_FROM_PAY`
* `EMAIL_FROM_BILLING`
* `EMAIL_REPLY_TO_SUPPORT`

Locked payment sender behavior:

* payment receipt must use `EMAIL_FROM_PAY`
* billing, failed-payment, and refund mail must use `EMAIL_FROM_BILLING`
* reply-to must always use `EMAIL_REPLY_TO_SUPPORT`
* `noreply@domain` must not be used as a payment sender

Do not reuse a generic auth sender for payment flows.

⸻

9. Payment evidence required before claiming activation complete

A site must not be treated as payment-activation complete without:

1. one real provider action or true sandbox action
2. one real `checkout_url` or provider reference
3. one SMTP `messageId`
4. one D1 evidence record
5. one inbox proof

⸻

9A. Deferred payment assignment rule

As of `2026-04-22`, Team D must prepare the packet for every site in scope even when payment assignment is not yet attached.

This means:

* sender package prep must still be completed
* locale and link packet prep must still be completed
* onboarding form prep must still be completed
* the site remains on the intake board even if receiver assignment is intentionally deferred

Allowed assignment states for current prep wave:

* `ACTIVE_NOW`
* `DEFERRED_UNTIL_FOUNDER_INSTRUCTION`

Current rule:

* founder-locked active assignments are: `tranhatam.com`, `omdalat.com`, `vc.vetuonglai.com`, `invest.vetuonglai.com`, and `life.vetuonglai.com`
* all remaining intake rows are prepared first and receive assignment later only when founder instructs

Deferred assignment is not a rejection.
It is a controlled waiting state.

⸻

10. Active intake board

| intake_id | site_code | domain | priority | market_type | onboarding_form | owner_type | legal_owner | collection_required | payout_required | collection_country_currency | payout_country_currency | assigned_owner | current_status | blocker | next_action | next_action_owner | target_staging_date | target_live_date | evidence_refs | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `SITE-INTAKE-100` | `TRANHATAM-WEB` | `tranhatam.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `individual` | `Trần Hà Tâm` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `public hostname blocker, repo-side pay-to-mail outbound adapter, guarded internal handoff route, and international USD receiver mapping are closed in repo, but mailbox binding truth, inbound routing truth, MAIL_API runtime binding, live surface routing, id_country enforcement on live checkout path, and evidence-backed payment mail flow are still incomplete` | `enforce id_country policy in checkout path (VN-issued ID => VND, non-VN ID => USD), bind pay/billing/support/noreply mailboxes, set MAIL_API_BASE_URL plus MAIL_API_KEY plus MAIL_API_WORKSPACE_ID plus PAY_EMAIL_ADAPTER_INTERNAL_KEY, connect tranhatam.com live surface and payment event trigger to the pay runtime, run one real or sandbox checkout, and capture provider ref + mail messageId + D1 row + inbox proof` | `Team D + Team Email + Team SMTP + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md + PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md + PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md + PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md + PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/payment-routing.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/payment-email-outbound-adapter.ts + apps/pay/src/server.ts + tests/integration/pay-surface.test.mjs + docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md` | `Locked sender package: pay@tranhatam.com for receipts, billing@tranhatam.com for billing or failed or refund mail, support@tranhatam.com as the only reply-to, and noreply@tranhatam.com must never be used as a payment sender. Current launch scope is one-time dual-rail: VN VND local rail plus international USD PayPal rail. ID-country policy is mandatory when id_country is available: VN-issued ID must pay VND and non-VN ID must pay USD.` |
| `SITE-INTAKE-101` | `NLA-WEB` | `nguyenlananh.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `individual_or_company_TBD` | `TBD` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `site voice, sender package, and Team D core payment email packet are locked in repo, but legal owner truth, collection rail, callback URLs, and mailbox or provider evidence are still missing` | `lock legal owner, payOS merchant mapping, callback URLs, mailbox ownership, and support contact truth; keep receiver assignment deferred until founder instruction` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + nguyenlananh production host inventory` | `Phù hợp high-priority vì có nhu cầu payment và email giao dịch sớm.` |
| `SITE-INTAKE-102` | `OMDALA-WEB` | `omdala.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company_or_individual_TBD` | `TBD` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `site voice, sender package, and Team D core payment email packet are locked in repo, but collection model, legal owner truth, return or cancel URLs, and callback truth are not locked` | `confirm one-time VND launch scope, legal owner, sender mailbox ownership, and return or cancel or callback URLs; keep receiver assignment deferred until founder instruction` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Cho phép onboard sớm nếu chỉ thu one-time VND.` |
| `SITE-INTAKE-103` | `OMDALA-APP` | `app.omdala.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company_or_individual_TBD` | `TBD` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `workspace-oriented sender package and Team D core payment email packet are locked in repo, but legal owner truth and whether app.omdala.com is the actual collection surface remain unresolved` | `confirm app.omdala.com checkout role, legal owner, callback URLs, and mailbox ownership; keep receiver assignment deferred until founder instruction` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Nếu app là surface thanh toán chính thì ưu tiên P0.` |
| `SITE-INTAKE-104` | `OMDALAT-WEB` | `omdalat.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company` | `Công ty TNHH SX - TM - DV Thai Lam` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `legal owner and primary VND receiver are now locked to Thai Lam / recv_vnd_thailam_acb, but sender mailbox truth, inbound routing truth, MAIL_API runtime binding, callback URLs, live payment action, and evidence-backed payment mail flow are still incomplete` | `bind pay/billing/support/noreply mailboxes, set MAIL_API_BASE_URL plus MAIL_API_KEY plus MAIL_API_WORKSPACE_ID plus PAY_EMAIL_ADAPTER_INTERNAL_KEY, connect omdalat.com live surface and payment event trigger to the pay runtime, run one real or sandbox checkout, and capture provider ref + mail messageId + D1 row + inbox proof` | `Team D + Team Email + Team SMTP + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md + apps/pay/src/payment-routing.ts + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/payment-email-outbound-adapter.ts + apps/pay/src/server.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory + omdalat email smoke evidence + docs/reports/teamd/OMDALAT_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md` | `Primary launch scope is VN one-time VND. Payment receiver assignment is active for omdalat.com only; app.omdalat.com remains deferred until app checkout role is confirmed.` |
| `SITE-INTAKE-105` | `OMDALAT-APP` | `app.omdalat.com` | `P0` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company_or_individual_TBD` | `TBD` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `workspace-oriented sender package and Team D core payment email packet are locked in repo, but collection ownership, app checkout role, and mailbox or callback truth are not locked` | `confirm whether app.omdalat.com initiates checkout or only consumes post-purchase state, then lock mailbox ownership and callback URLs; keep receiver assignment deferred until founder instruction` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare active custom domain status` | `Giữ cùng wave với omdalat.com.` |
| `SITE-INTAKE-106` | `FLOW` | `flow.iai.one` | `P1` | `VN_or_INTERNATIONAL_TBD` | `TBD` | `TBD` | `TBD` | `yes` | `no` | `TBD` | `not_applicable` | `Team D` | `FORM_SELECTION_REQUIRED` | `site voice, sender package, and Team D core payment email packet are locked in repo, but market type and commercial model are not locked` | `confirm whether flow sells credits, plans, or service packages and what currency rail is needed before selecting the formal onboarding packet` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Chỉ đưa sang staging nếu model còn trong giới hạn one-time VND.` |
| `SITE-INTAKE-107` | `LIFE-IAI` | `life.iai.one` | `P1` | `VN_or_INTERNATIONAL_TBD` | `TBD` | `TBD` | `TBD` | `yes` | `no_or_yes_TBD` | `TBD` | `TBD` | `Team D` | `FORM_SELECTION_REQUIRED` | `site voice, sender package, and Team D core payment email packet are locked in repo, but commercial model, owner truth, and payout need remain unresolved` | `lock product model, owner truth, payout need, and market type before selecting the formal onboarding packet` | `Team D + Product + Team C` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Không cho live nếu lấn sang recurring/subscription trước khi pay lane mở rộng.` |
| `SITE-INTAKE-108` | `VC` | `vc.vetuonglai.com` | `P1` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company` | `Công ty TNHH ĐTTM Thanh Tam Phat` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `legal owner and dual-rail receivers are now locked to Thành Tâm Phát (VND recv_vnd_thanhtamphat_acb) plus Angel Edu Tam Foundation Inc via Relay/Thread (USD recv_usd_angeledutam_foundation_relay_thread), but sender mailbox truth, inbound routing truth, MAIL_API runtime binding, callback endpoint truth, id_country policy wiring in checkout, live payment action, and evidence-backed payment mail flow are still incomplete` | `enforce id_country policy in checkout path (VN-issued ID => VND, non-VN ID => USD), bind pay/billing/support/noreply mailboxes, set MAIL_API_BASE_URL plus MAIL_API_KEY plus MAIL_API_WORKSPACE_ID plus PAY_EMAIL_ADAPTER_INTERNAL_KEY, connect vc.vetuonglai.com live surface and payment event trigger to the pay runtime, run one real or sandbox checkout, and capture provider ref + mail messageId + D1 row + inbox proof` | `Team D + Team Email + Team SMTP + Team B + Product` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md + apps/pay/src/payment-routing.ts + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/payment-email-outbound-adapter.ts + apps/pay/src/server.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory + Về Tương Lai contract docs` | `Primary launch scope is one-time dual-rail (VND + USD). ID-country policy is mandatory: VN-issued ID must pay VND and non-VN ID must pay USD.` |
| `SITE-INTAKE-109` | `INVEST` | `invest.vetuonglai.com` | `P1` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company` | `Công ty TNHH ĐTTM Thanh Tam Phat` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `legal owner and dual-rail receivers are now locked to Thành Tâm Phát (VND recv_vnd_thanhtamphat_acb) plus Angel Edu Tam Foundation Inc via Relay/Thread (USD recv_usd_angeledutam_foundation_relay_thread), but risk review closure, sender mailbox truth, inbound routing truth, MAIL_API runtime binding, callback truth, id_country policy wiring in checkout, live payment action, and evidence-backed payment mail flow are still incomplete` | `run product plus finance plus risk alignment, enforce id_country policy in checkout path (VN-issued ID => VND, non-VN ID => USD), bind pay/billing/support/noreply mailboxes, set MAIL_API_BASE_URL plus MAIL_API_KEY plus MAIL_API_WORKSPACE_ID plus PAY_EMAIL_ADAPTER_INTERNAL_KEY, connect invest.vetuonglai.com live surface and payment event trigger to the pay runtime, run one real or sandbox checkout, and capture provider ref + mail messageId + D1 row + inbox proof` | `Team D + Team C + Product + Team Email + Team SMTP + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md + apps/pay/src/payment-routing.ts + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/payment-email-outbound-adapter.ts + apps/pay/src/server.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Primary launch scope is one-time dual-rail (VND + USD). ID-country policy is mandatory and live claim still depends on risk and evidence gates.` |
| `SITE-INTAKE-110` | `LIFE-VTL` | `life.vetuonglai.com` | `P1` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company` | `Công ty TNHH ĐTTM Thanh Tam Phat` | `yes` | `no` | `VN_VND` | `not_applicable` | `Team D` | `FORM_IN_PROGRESS` | `legal owner and dual-rail receivers are now locked to Thành Tâm Phát (VND recv_vnd_thanhtamphat_acb) plus Angel Edu Tam Foundation Inc via Relay/Thread (USD recv_usd_angeledutam_foundation_relay_thread), but collection-role confirmation, sender mailbox truth, inbound routing truth, MAIL_API runtime binding, callback URLs, id_country policy wiring in checkout, live payment action, and evidence-backed payment mail flow are still incomplete` | `confirm life.vetuonglai.com collection role for this phase, enforce id_country policy in checkout path (VN-issued ID => VND, non-VN ID => USD), bind pay/billing/support/noreply mailboxes, set MAIL_API_BASE_URL plus MAIL_API_KEY plus MAIL_API_WORKSPACE_ID plus PAY_EMAIL_ADAPTER_INTERNAL_KEY, connect life.vetuonglai.com live surface and payment event trigger to the pay runtime, run one real or sandbox checkout, and capture provider ref + mail messageId + D1 row + inbox proof` | `Team D + Product + Team Email + Team SMTP + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md + apps/pay/src/payment-routing.ts + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/payment-email-outbound-adapter.ts + apps/pay/src/server.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Primary launch scope is one-time dual-rail (VND + USD). ID-country policy is mandatory; this does not imply subscription.` |
| `SITE-INTAKE-111` | `AAL` | `aiaccountingloop.com` | `P1` | `INTERNATIONAL` | `PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company_TBD` | `TBD` | `yes` | `yes_or_no_TBD` | `TBD` | `TBD` | `Team D` | `FORM_IN_PROGRESS` | `site voice, sender package, and Team D core payment email packet are locked in repo, but legal owner truth, collection-versus-payout truth, and live callback or mailbox evidence are not locked` | `run international onboarding intake, lock legal owner and collection-only versus collection-plus-payout scope, then confirm callback URLs and mailbox ownership; keep receiver assignment deferred until founder instruction` | `Team D + Product + Treasury` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory + governance docs` | `Không ép vào VN form.` |
| `SITE-INTAKE-112` | `TRAMSAIGON` | `tramsaigon.com` | `P2` | `VN` | `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` | `company_or_individual_TBD` | `TBD` | `yes` | `yes_or_no_TBD` | `VN_VND` | `TBD` | `Team D` | `FORM_IN_PROGRESS` | `repo-side packet locked (sender package, Team D core 4-template email registry, VN onboarding form bound, status promoted from NEW_INTAKE on 2026-04-28); founder still needs to lock paid offers, owner truth, payment model, and receiver assignment before live activation` | `founder lock paid offers + owner truth (company vs individual) + payment model + VND/USD receiver assignment, then progress to the operational packet` | `Team D + Product` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + apps/pay/src/site-activation-registry.ts + tests/integration/pay-surface.test.mjs + docs/reports/pay-email-agent/TRAMSAIGON_COM_PAY_EMAIL_REPO_CLOSEOUT_2026-04-28.md + Cloudflare worker custom domain live status` | `Chuẩn bị sớm nhưng chưa nên chen lên trước P0/P1.` |
| `SITE-INTAKE-113` | `APP` | `app.iai.one` | `P2` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `no` | `TBD` | `not_applicable` | `Team D` | `FORM_SELECTION_REQUIRED` | `site voice, sender package, and Team D core payment email packet are locked in repo, but commercial role is not explicit and collection need is still unconfirmed` | `confirm whether app.iai.one is a direct collection surface or only a downstream account surface before selecting the formal onboarding packet` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare worker domain inventory` | `Không ưu tiên trước các site có collection need rõ ràng.` |
| `SITE-INTAKE-114` | `NOOS` | `noos.iai.one` | `P2` | `TBD` | `TBD` | `TBD` | `TBD` | `yes` | `TBD` | `TBD` | `TBD` | `Team D` | `FORM_SELECTION_REQUIRED` | `site voice, sender package, and Team D core payment email packet are locked in repo, but owner truth and settlement model are not locked` | `lock the first commercial wave and payment model before selecting the formal onboarding packet` | `Team D + Product + Team B` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Cloudflare live domain inventory` | `Chỉ intake placeholder ở giai đoạn này.` |
| `SITE-INTAKE-115` | `CIOS` | `cios.iai.one` | `P3` | `TBD` | `TBD` | `TBD` | `TBD` | `yes_or_no_TBD` | `no` | `TBD` | `not_applicable` | `Team D` | `BLOCKED` | `enterprise packet and Team D core payment email packet are locked in repo, but product review and business scope are still closed` | `wait for product and policy closure before onboarding or Team B mapping resumes` | `Team C + Product + Team D` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + Control tower review chain` | `Không được đẩy sang mapping kỹ thuật lúc này.` |
| `SITE-INTAKE-116` | `LAMVIECMUONNOI` | `lamviec.muonnoi.org` | `P3` | `VN_or_INTERNATIONAL_TBD` | `TBD` | `TBD` | `TBD` | `yes` | `TBD` | `TBD` | `TBD` | `Team D` | `BLOCKED` | `migration packet and Team D core payment email packet are locked in repo, but current live requirements may exceed the pay.iai.one one_time VND contract` | `do not migrate until recurring or subscription compatibility and target payment model are explicitly approved` | `Team 1 + Team B + Product` | `TBD` | `TBD` | `PAY_IAI_ONE_SITE_PAYMENT_EMAIL_RESEARCH_2026-04-22.md + apps/pay/src/team-d-payment-email-profiles.ts + apps/pay/src/payment-email-templates.ts + tests/integration/pay-surface.test.mjs + internal payment contract notes` | `Không được xem là safe swap trong wave hiện tại.` |

⸻

11. Ready for staging queue

Use this section for rows that have complete intake packets and are waiting only for staging activation.

| intake_id | site_code | domain | market_type | current_status | staging blocker | next_action | owner | evidence_refs |
|---|---|---|---|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | `READY_FOR_STAGING` | `none / explicit blocker` | `TBD` | `Team D / Team B` | `TBD` |

⸻

12. Ready for live queue

Use this section for rows that have completed intake, review, and technical mapping.

| intake_id | site_code | domain | market_type | current_status | live blocker | next_action | owner | evidence_refs |
|---|---|---|---|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | `READY_FOR_LIVE` | `none / explicit blocker` | `TBD` | `Team D / Team B / Team 1 if needed` | `TBD` |

⸻

13. Blocked queue

Every blocked row must state the real blocker, not a vague summary.

| intake_id | site_code | domain | market_type | blocker_type | blocker_detail | blocker_owner | next_unblock_action | target_resolution_date |
|---|---|---|---|---|---|---|---|---|
| `SITE-INTAKE-115` | `CIOS` | `cios.iai.one` | `TBD` | `product_scope / review_gate` | `review and domain/business scope not closed` | `Team C + Product + Team D` | `wait for product/policy closure before onboarding` | `TBD` |
| `SITE-INTAKE-116` | `LAMVIECMUONNOI` | `lamviec.muonnoi.org` | `VN_or_INTERNATIONAL_TBD` | `contract_scope / recurring_compatibility` | `current live requirements may exceed pay.iai.one current one_time VND contract` | `Team 1 + Team B + Product` | `approve or reject recurring/subscription compatibility path` | `TBD` |

⸻

14. Intake checklist per site

Before a row may move to `READY_FOR_STAGING`, confirm:

* correct onboarding form is selected
* legal owner identity is present
* site form is complete
* collection account or collection rail data is present if required
* payout account data is present if required
* activation routing truth is present
* evidence of account control exists
* sender package is locked
* finance ops review is complete
* treasury review is complete if payouts are enabled
* blockers are explicit

Before a row may move to `READY_FOR_LIVE`, confirm:

* technical mapping is complete
* callback and reconciliation mapping are known if required
* permissions and approval rules are clear for payout-enabled setups
* payment evidence exists:
  * provider action
  * checkout URL or provider reference
  * SMTP `messageId`
  * D1 evidence
  * inbox proof
* live blocker is empty or explicitly accepted by authority

⸻

15. Daily operating rules

Every day, Team D must update only the allowed daily-moving fields:

* `current_status`
* `blocker`
* `next_action`
* `next_action_owner`
* `evidence_refs`
* target dates if they changed

Do not silently change:

* `market_type`
* `onboarding_form`
* `owner_type`
* `legal_owner`
* collection or payout need

without an explicit decision trace.

A row may not stay vague for multiple days.

If a site is blocked, it must be in the blocked queue with a named blocker owner.

⸻

16. Handoff rules

Handoff to Team B happens only when:

* intake packet is operationally complete
* correct form is complete
* legal owner truth exists
* collection truth exists
* payout truth exists if applicable
* evidence of account control exists
* sender package exists
* finance ops review is complete
* treasury review is complete if payouts are enabled
* blockers are no longer ops blockers

Use `PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md` before moving a row to `TEAM_B_MAPPING_PENDING`.

Escalation to Team C happens when:

* payout controls are sensitive
* permission review is required
* security or audit exposure exists
* product or disclosure risk appears

Escalation to Team 1 happens when:

* activation is blocked by release authority
* a policy decision is required
* a blocker crosses team boundaries and cannot be resolved inside Team D

⸻

17. Final direction

This board should be treated as the live intake queue for payments activation.

It is where Team D turns “website waiting for payment” into a controlled sequence:

* form selected
* truth collected
* sender package locked
* evidence attached
* review completed
* technical mapping handed off
* site ready for staging
* site ready for live

That is the correct intake board standard for Team D inside pay.iai.one.

⸻
