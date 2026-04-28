# PAY_IAI_ONE_TEST_AND_PAYMENT_INTAKE_STATUS_2026-04-22
- Team: Codex / Team 1 support
- Date: 2026-04-22
- Scope: pay runtime verification + Team D intake verification + payment information intake standard + receiver registry and routing API
- Status: `PARTIAL_PASS`

## 1. Summary

At checkpoint `2026-04-22`, the repository-side `pay.iai.one` lane remains green, the Team D intake board now includes `tranhatam.com` as an explicit controlled activation row, the payment-information intake standard includes an explicit activation-routing and sender-package packet, and `apps/pay` now exposes a centralized receiver registry plus a payment-routing API for domain-based receiver resolution.

The only remaining failed layer in this batch is still the external production gate.

## 2. Commands rerun

- `pnpm test:pay`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-22 --no-write`
- `pnpm report:pay-prod-gate -- --date=2026-04-22`

## 3. Results

### PASS

- `pnpm test:pay` -> `PASS (29/29)`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS`
- `pnpm typecheck:pay` -> `PASS`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-22 --no-write` -> `PASS`

Team D validator confirms:

- all 17 locked intake rows are present
- required columns are complete
- status vocabulary is locked
- priority vocabulary is locked
- market/form alignment is correct
- no row claims `READY_FOR_LIVE` or `LIVE` while pay gate remains locked

The controlled activation scope now reflects the only domain already carrying a founder-approved receiver assignment:

- `tranhatam.com` is explicitly tracked in the Team D intake board
- primary activation scope is locked as `VN / VND / one_time`
- repo-side routing remains centralized through `pay.iai.one` instead of page-level account hard-coding
- payment sender package is now locked as:
  - `pay@tranhatam.com` for receipts
  - `billing@tranhatam.com` for billing, failed-payment, and refund mail
  - `support@tranhatam.com` as the only reply-to
  - `noreply@tranhatam.com` excluded from payment sending

Pay runtime tests now also confirm:

- `/api/receiver-registry` exposes the centralized receiver registry and domain assignment map
- `/api/payment-routing` resolves `tranhatam.com` to:
  - VND primary ACB + VND fallback Vietcombank
  - USD PayPal target as the founder-locked international receiver
- `/api/payment-email-templates` exposes the locked bilingual template registry for `tranhatam.com` as a read-only runtime surface
  - `payment_receipt`
  - `checkout_status_update`
  - `payment_failed_notice`
  - `refund_notice`
- `/payment-block` renders the founder-locked `tranhatam.com` payment surface from centralized routing instead of hard-coded account details
- VND routing builds dynamic VietQR quick links per amount
- every resolved payment route carries the required notification triplet:
  - `pay@domain`
  - `billing@domain`
  - `support@domain`
- unassigned domains remain blocked with `NOT_ASSIGNED_YET`

### FAIL

- `pnpm report:pay-prod-gate -- --date=2026-04-22` -> `FAIL`

The report command itself now completes and writes artifacts successfully.
The failure is the real gate verdict, not a report-generation error.

Current failed machine signals:

- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`
- `shared_read_model_ready_for_shared_only`
- `shared_upstream_active_read_mode_shared_contract`
- `shared_upstream_release_gate_ready`

Generated gate artifacts:

- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.json`

This remains an external production-truth blocker, not a repository-side implementation blocker.

Important implementation boundary:

- the template registry is now present in repo and exposed through `apps/pay`
- but there is still no evidence inside `apps/pay` that the actual outbound delivery path already consumes this registry to send real payment email
- the required pay-to-mail bridge is now locked in:
  - `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
- therefore this batch should be read as `repo + runtime read surface + ops docs locked`, not `payment email delivery path fully integrated`

For `tranhatam.com` specifically, payment email must still remain non-live until these external actions are complete:

1. bind the four mailbox or alias targets
2. set runtime SMTP or `MAIL_API`
3. connect the live site payment surface to `/api/payment-routing`
4. run one real or true sandbox checkout
5. store provider reference, SMTP `messageId`, D1 row, and inbox proof

Canonical checklist:

- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md`

## 4. Payment information intake fix applied

The onboarding packet had a real gap before this checkpoint:

- the intake board and Team D handoff required sender-package and activation-routing truth
- but the VN and international onboarding forms did not yet contain a dedicated block for that packet

This has now been fixed.

Updated files:

- `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md`
- `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
- `docs/PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md`
- `docs/PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md`
- `docs/PAY_IAI_ONE_TEAM_D_HANDOFF_TO_TEAM_B_CHECKLIST_2026.md`
- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md`
- `apps/pay/src/payment-routing.ts`
- `apps/pay/src/payment-email-templates.ts`
- `apps/pay/src/server.ts`
- `tests/integration/pay-team-d-intake-board.test.mjs`
- `tests/integration/pay-surface.test.mjs`

The standard intake packet now explicitly includes:

- provider or merchant mapping reference
- checkout return URL
- checkout cancel URL
- callback endpoint
- `x_site_key` reference path
- idempotency-key strategy
- `EMAIL_FROM_PAY`
- `EMAIL_FROM_BILLING`
- `EMAIL_REPLY_TO_SUPPORT`
- pay, billing, support, and noreply inbox addresses
- temporary sender handling and inbox owner

The centralized receiver/routing layer now explicitly includes:

- master receiver registry
- domain assignment map
- VND dynamic VietQR quick-link generation
- domain-level transaction notification triplet
- honest `NOT_ASSIGNED_YET` blocking for unassigned domains
- a founder-locked controlled activation path for `tranhatam.com`

## 5. Operational meaning

As of this checkpoint:

- Team B no longer needs to infer sender-package or routing truth from chat
- Team D can collect payment activation data in one controlled packet
- handoff to Team B is cleaner because routing truth is now part of the mandatory intake packet
- pay-facing websites can resolve receiver config from one API layer instead of hard-coded account details
- `tranhatam.com` is honestly tracked as `FORM_IN_PROGRESS`, not overstated as live-ready
- production release is still blocked by live env, provider truth, and deployed health contract

## 6. References

- `docs/reports/team1/PAY_IAI_ONE_REPO_RUNTIME_READY_STATUS_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_IMMEDIATE_PRODUCTION_ACTIVATION_CHECKLIST_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/teamd/PAY_TEAM_D_INTAKE_BOARD_STATUS_2026-04-22.md`
- `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md`
- `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`

## 7. Final statement

The pay lane is now stronger in three separate ways:

1. repository-side runtime is verified green
2. payment-information intake is standardized enough for Team D to collect live activation truth cleanly
3. receiver resolution is centralized through registry + routing API instead of page-level hard-code

The remaining red state is still the external production gate, not missing repo-side code or missing payment-intake structure.
