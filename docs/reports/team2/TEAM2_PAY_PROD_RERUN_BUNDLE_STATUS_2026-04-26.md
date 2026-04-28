# TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-26
- Generated at: 2026-04-25T18:07:00.024Z
- Timezone: Asia/Ho_Chi_Minh
- Status: `BLOCKED_PRECHECK`
- Preflight only: `yes`
- Skip tests: `no`

## Preflight
- `auth_key_present`: `FAIL` — Missing TEAM2_PAY_GATE_API_KEY or TEAM2_PAY_GATE_SITE_KEY.
- `tenant_code_explicit`: `FAIL` — Missing TEAM2_PAY_GATE_TENANT_CODE.
- `site_code_explicit`: `FAIL` — Missing TEAM2_PAY_GATE_SITE_CODE.

## Commands
- no commands executed

## Artifact summaries
- Runtime probe artifact: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-26.json`
- Shared runtime probe artifact: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-26.json`
- Team 1 gate artifact: `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-26.json`

## Runtime probe summary
- runtime probe artifact not available

## Shared runtime summary
- shared runtime probe artifact not available

## Team 1 gate summary
- overall: `FAIL`
- decision: `LOCK_RETAINED_WITH_REASON`
- unmet: `team1_manual_note_present, team2_runtime_probe_present, auth_key_present, attempt_after_2026_04_19, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready`

## Next actions
- Cấp key canonical cho probe nội bộ (`TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`).
- Khóa `TEAM2_PAY_GATE_TENANT_CODE` cho site/domain đang rerun.
- Khóa `TEAM2_PAY_GATE_SITE_CODE` cho site/domain đang rerun.
- Đóng các tín hiệu gate còn fail: team1_manual_note_present, team2_runtime_probe_present, auth_key_present, attempt_after_2026_04_19, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready.

