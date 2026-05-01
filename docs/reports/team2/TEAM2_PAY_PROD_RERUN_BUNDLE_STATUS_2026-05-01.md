# TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-05-01
- Generated at: 2026-05-01T12:29:30.000Z
- Timezone: Asia/Ho_Chi_Minh
- Status: `RERUN_COMPLETED_GATE_FAIL`
- Preflight only: `no`
- Skip tests: `yes`

## Preflight
- `auth_key_present`: `PASS` — Using `x-api-key` from `TEAM2_PAY_GATE_API_KEY` in the operator shell.
- `tenant_code_explicit`: `PASS` — `tenant=vetuonglai` (canonical locked target)
- `site_code_explicit`: `PASS` — `site=vetuonglai-member` (canonical locked target)

## Commands
- `node scripts/team2-pay-prod-runtime-probe.mjs --date=2026-05-01`: `PASS` (executed in operator shell)
- `node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-05-01`: `PASS` (executed in operator shell)
- `pnpm report:pay-prod-gate -- --date=2026-05-01`: `PASS` (executed in operator shell)

## Artifact summaries
- Runtime probe artifact: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- Shared runtime probe artifact: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`
- Team 1 gate artifact: `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-05-01.json`

## Runtime probe summary
- `auth_key_present`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- unmet: `checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green`

## Shared runtime summary
- health contract shape: `shared_runtime_contract`
- `shared_read_model_ready_for_shared_only`: `PASS`
- `shared_upstream_active_read_mode_shared_contract`: `PASS`
- `shared_upstream_release_gate_ready`: `PASS`
- unmet: `none`

## Team 1 gate summary
- overall: `FAIL`
- decision: `LOCK_RETAINED_WITH_REASON`
- unmet: `checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green`

## Next actions
- Team Pay xác minh merchant/channel/package truth trên payOS dashboard.
- Rerun one-shot canonical cho tới khi `checkout_status=201` và link non-null.
- Chỉ sau khi provider truth xanh, Team 2 mới chạy lại full rerun bundle chính thức.
