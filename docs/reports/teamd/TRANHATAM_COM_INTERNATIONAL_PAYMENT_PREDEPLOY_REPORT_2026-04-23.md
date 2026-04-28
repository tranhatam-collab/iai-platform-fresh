# TRANHATAM_COM_INTERNATIONAL_PAYMENT_PREDEPLOY_REPORT_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Scope: `tranhatam.com` international payment lane in `pay.iai.one`
- Verdict: `REPO_TEST_GREEN__LIVE_CLAIM_BLOCKED`

## 1. What was updated

1. Runtime routing lock for `tranhatam.com` now explicitly documents dual-rail behavior:
   - VND lane:
     - `recv_vnd_personal_tranhatam_acb` (primary)
     - `recv_vnd_personal_tranhatam_vcb` (fallback)
   - USD lane:
     - `recv_usd_personal_tranhatam_paypal` (primary)
2. Team D packet/board wording now requires checkout-side `id_country` policy:
   - `VN-issued ID => VND`
   - `non-VN ID => USD`
3. Tranhatam evidence checker now validates international gateway lock fields.

## 2. Runtime behavior verification (repo-side)

New routing proofs for `tranhatam.com`:

1. VND enforced when `id_country=VN` even if request currency asks for `USD`.
2. USD enforced when `id_country` is non-VN even if request currency asks for `VND`.
3. Legacy country-based routing remains functional when `id_country` is absent.

## 3. Test results (rerun)

- `pnpm typecheck:pay` -> `PASS`
- `pnpm test:pay` -> `PASS (57/57)`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (6/6)`
- `node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=2026-04-23` -> `PASS` (live claim correctly blocked)
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23` -> `PASS`
- `pnpm report:pay-prod-gate -- --date=2026-04-23` -> `FAIL / LOCK_RETAINED_WITH_REASON`

## 4. Current deploy-sync readiness

Repo and test readiness for this scope: `GREEN`.

Production deploy claim readiness: `NOT_READY`.

Reason:

- Team 1 gate still `LOCK_RETAINED_WITH_REASON`.
- `tranhatam.com` evidence packet still `EXTERNAL_STEPS_PENDING`.

## 5. External blockers that still must be closed

1. Mailbox/alias truth:
   - `pay@tranhatam.com`
   - `billing@tranhatam.com`
   - `support@tranhatam.com`
   - `noreply@tranhatam.com`
2. Inbound routing truth + inbox proof.
3. Runtime bindings:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
4. At least one real or true-sandbox payment flow with aligned evidence:
   - provider ref
   - checkout/session ref
   - mail `messageId`
   - D1/canonical row
   - inbox proof

## 6. Gate-safe statement for team web

`tranhatam.com` international payment lane is now locked and tested at repo/runtime-contract level, but not yet claimable as live payment because production gate and external evidence are still incomplete.
