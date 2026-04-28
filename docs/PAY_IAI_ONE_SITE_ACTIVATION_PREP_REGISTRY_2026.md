PAY_IAI_ONE_SITE_ACTIVATION_PREP_REGISTRY_2026.md

Version 1.0

Status: Locked Prep Registry

Scope

Cross-site preparation registry for every website currently present in the Team D intake board, with payment assignment deferred until founder instruction unless a domain is already founder-locked.

Purpose

This file exists so the team can complete the prep packet for every in-scope website now without guessing or prematurely attaching payment receivers.

Core rule

As of `2026-04-23`:

* all `17` Team D intake sites must have a prep packet
* prep packet completion is allowed before receiver assignment
* receiver assignment stays deferred until founder instruction
* the current active-assignment exceptions are `tranhatam.com`, `omdalat.com`, `vc.vetuonglai.com`, `invest.vetuonglai.com`, and `life.vetuonglai.com`

This means:

* sender package can be reserved now
* locale and link packet can be prepared now
* onboarding form selection can be prepared now
* Team D and Team B can work from one site packet truth now
* no one may guess `receiver_profile_id`, `payout_profile_id`, or public payment targets

Do not confuse:

* `prep packet ready`

with:

* `payment assignment approved`
* `provider proof complete`
* `payment email live`
* `READY_FOR_LIVE`

Machine-readable surface

The canonical machine-readable registry for this file is exposed from:

* `apps/pay/src/site-activation-registry.ts`
* `GET /api/site-activation-registry`

Assignment states

Use only:

* `ACTIVE_NOW`
* `DEFERRED_UNTIL_FOUNDER_INSTRUCTION`

Current counts

* `ACTIVE_NOW`: `5`
* `DEFERRED_UNTIL_FOUNDER_INSTRUCTION`: `12`

Current active assignment

* `tranhatam.com`
* `omdalat.com`
* `vc.vetuonglai.com`
* `invest.vetuonglai.com`
* `life.vetuonglai.com`

Deferred list

* `nguyenlananh.com`
* `omdala.com`
* `app.omdala.com`
* `app.omdalat.com`
* `flow.iai.one`
* `life.iai.one`
* `aiaccountingloop.com`
* `tramsaigon.com`
* `app.iai.one`
* `noos.iai.one`
* `cios.iai.one`
* `lamviec.muonnoi.org`

Minimum prep packet per site

Each site packet must already reserve or define:

* `intake_id`
* `site_code`
* `domain`
* `priority`
* `market_type`
* `onboarding_form` or explicit `FORM_SELECTION_REQUIRED`
* sender package:
  * `pay@domain`
  * `billing@domain`
  * `support@domain`
  * `noreply@domain`
* sender policy:
  * `EMAIL_FROM_PAY`
  * `EMAIL_FROM_BILLING`
  * `EMAIL_REPLY_TO_SUPPORT`
* required link keys:
  * `checkout_base_url`
  * `success_url`
  * `cancel_url`
  * `retry_url`
  * `support_url`
* deferred payment assignment note

Hard rule

Until founder instruction exists, do not attach:

* `receiver_profile_id`
* `payout_profile_id`
* `provider receiver`
* bank account target
* PayPal target
* QR image target

Those remain deferred even when prep packet work is complete.

Operational use

Use this registry together with:

* `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
* `PAY_IAI_ONE_TEAM_D_PAYMENTS_ACTIVATION_AND_TREASURY_OPS_EXECUTION_PLAN_2026.md`
* `PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md`
* `PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md`
* `PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`

Direction

This registry is the correct way to prepare all websites first and attach payment assignment only when founder instruction arrives later.
