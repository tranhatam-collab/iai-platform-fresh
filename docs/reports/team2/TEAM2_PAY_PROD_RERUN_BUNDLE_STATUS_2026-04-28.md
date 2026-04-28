# TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-28
- Generated at: 2026-04-28T15:07:47.879Z
- Timezone: Asia/Ho_Chi_Minh
- Status: `BLOCKED_PRECHECK`
- Preflight only: `no`
- Skip tests: `no`

## Preflight
- `auth_key_present`: `FAIL` — Missing canonical pay gate key. Set TEAM2_PAY_GATE_* or PAY_IAI_ONE_GATE_* or TNO_PAY_GATE_* variables.
- `tenant_code_explicit`: `FAIL` — Missing TEAM2_PAY_GATE_TENANT_CODE.
- `site_code_explicit`: `FAIL` — Missing TEAM2_PAY_GATE_SITE_CODE.

## Commands
- no commands executed

## Artifact summaries
- Runtime probe artifact: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- Shared runtime probe artifact: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- Team 1 gate artifact: `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.json`

## Runtime probe summary
- `auth_key_present`: `FAIL`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- unmet: `auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready`

## Shared runtime summary
- health contract shape: `legacy_or_unknown`
- `shared_read_model_ready_for_shared_only`: `FAIL`
- `shared_upstream_active_read_mode_shared_contract`: `FAIL`
- `shared_upstream_release_gate_ready`: `FAIL`
- unmet: `health_contract_exposes_shared_read_model, health_contract_exposes_shared_upstream_runtime, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready`

## Team 1 gate summary
- overall: `FAIL`
- decision: `LOCK_RETAINED_WITH_REASON`
- unmet: `auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready`

## Next actions
- Cấp key canonical cho probe nội bộ (`TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`).
- Khóa `TEAM2_PAY_GATE_TENANT_CODE` cho site/domain đang rerun.
- Khóa `TEAM2_PAY_GATE_SITE_CODE` cho site/domain đang rerun.
- Rerun checkout probe chỉ sau khi key/header canonical đã được owner xác nhận đúng contract.
- Đồng bộ deploy/runtime production để `/health` expose `shared_read_model` và `shared_upstream_runtime` đúng contract.
- Đóng các tín hiệu gate còn fail: auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready.

