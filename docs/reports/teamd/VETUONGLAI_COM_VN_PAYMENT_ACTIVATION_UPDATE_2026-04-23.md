# VETUONGLAI_COM_PAYMENT_ACTIVATION_UPDATE_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Scope: `vc.vetuonglai.com`, `invest.vetuonglai.com`, `life.vetuonglai.com`
- Verdict: `DUAL_RAIL_ASSIGNMENT_ACTIVE_BUT_LIVE_CLAIM_BLOCKED`

## Locked Assignment

- Legal owner (VND rail): `Công ty TNHH ĐTTM Thanh Tam Phat`
- Primary VND receiver: `recv_vnd_thanhtamphat_acb`
- Primary USD receiver: `recv_usd_angeledutam_foundation_relay_thread`
- USD receiving entity: `Angel Edu Tam Foundation Inc` (Relay/Thread Bank)
- Checkout scope in current lane: `one_time`
- Currency policy in checkout runtime:
  - `VN-issued ID -> VND`
  - `non-VN ID -> USD`

## Runtime and Board Changes

- `apps/pay/src/payment-routing.ts`
  - founder-locked dual-rail assignments active for:
    - `vc.vetuonglai.com`
    - `invest.vetuonglai.com`
    - `life.vetuonglai.com`
  - VND rail: `recv_vnd_thanhtamphat_acb`
  - USD rail: `recv_usd_angeledutam_foundation_relay_thread`
  - new query support: `id_country` / `id_territory`
  - enforced policy: VN ID forces VND; non-VN ID forces USD
- `apps/pay/src/server.ts`
  - `/api/payment-routing` now accepts `id_country`
  - `/payment-block` now accepts `id_country`
- `apps/pay/src/site-activation-registry.ts`
  - `SITE-INTAKE-108`, `SITE-INTAKE-109`, `SITE-INTAKE-110` keep `paymentAssignmentState=ACTIVE_NOW`
  - notes now lock dual-rail + ID-country policy wording
- `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
  - rows `108/109/110` lock dual-rail receivers and policy wording
  - next-action remains external proof path, not live claim
- `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md`
  - receiver `recv_usd_angeledutam_foundation_relay_thread` now marked `ACTIVE_DOMAIN_DEFAULT`
  - defaults locked to `vc/invest/life.vetuonglai.com`

## Test Evidence (Rerun 2026-04-23)

- `pnpm typecheck:pay` -> `PASS`
- `pnpm test:pay` -> `PASS (55/55)`
- `node --test tests/integration/pay-team-d-intake-board.test.mjs` -> `PASS (6/6)`
- `node scripts/pay-team-d-intake-board-check.mjs --date=2026-04-23 --no-write` -> `PASS`
- `pnpm report:pay-prod-gate -- --date=2026-04-23` -> `FAIL / LOCK_RETAINED_WITH_REASON`

## Remaining Gates Before Any Live Claim

1. Mailbox/alias truth for each active domain:
   - `pay@`
   - `billing@`
   - `support@`
   - `noreply@`
2. Inbound routing truth and inbox proof per sender package.
3. Runtime mail bindings:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
4. Real payment action (sandbox/live true provider path) on each active surface.
5. Unified evidence from the same flow:
   - provider ref
   - mail `messageId`
   - D1/canonical row
   - inbox proof
6. Team 1 gate remains red until signals pass:
   - `auth_key_present`
   - `checkout_url_non_null`
   - `payment_link_id_non_null`
   - `no_214`
   - `shared_read_model_ready_for_shared_only`
   - `shared_upstream_active_read_mode_shared_contract`
   - `shared_upstream_release_gate_ready`

## Control Rule

No row in this cluster may be marked `READY_FOR_LIVE` while pay gate is `LOCK_RETAINED_WITH_REASON` or while proof fields above are incomplete.
