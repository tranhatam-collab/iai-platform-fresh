# TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-04-28
- Generated at: 2026-04-28T15:07:47.996Z
- Timezone: Asia/Ho_Chi_Minh
- Status: `REVIEW_BLOCKED_PRECHECK`

## Artifact checks
- PASS `bundle_markdown` — `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-28.md`
- PASS `bundle_json` — `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-28.json`
- PASS `runtime_probe_markdown` — `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.md`
- PASS `runtime_probe_json` — `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- PASS `shared_runtime_probe_markdown` — `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.md`
- PASS `shared_runtime_probe_json` — `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- PASS `team1_gate_markdown` — `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.md`
- PASS `team1_gate_json` — `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-28.json`

## Review checks
- FAIL `bundle_preflight_ready` — bundle.status=BLOCKED_PRECHECK
- FAIL `bundle_green` — bundle.status=BLOCKED_PRECHECK
- FAIL `gate_overall_pass` — gateDecision=LOCK_RETAINED_WITH_REASON
- FAIL `shared_health_contract_shared_runtime` — health_contract_shape=legacy_or_unknown

## Gate signals
- FAIL `auth_key_present` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- FAIL `checkout_url_non_null` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- FAIL `payment_link_id_non_null` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- FAIL `no_214` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- FAIL `production_gate_green` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json`
- FAIL `shared_read_model_ready_for_shared_only` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- FAIL `shared_upstream_active_read_mode_shared_contract` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`
- FAIL `shared_upstream_release_gate_ready` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-28.json`

## Bundle summary
- bundle.status: `BLOCKED_PRECHECK`
- preflight.ready: `FAIL`
- bundle next actions: `Cấp key canonical cho probe nội bộ (`TEAM2_PAY_GATE_API_KEY` hoặc `TEAM2_PAY_GATE_SITE_KEY`). | Khóa `TEAM2_PAY_GATE_TENANT_CODE` cho site/domain đang rerun. | Khóa `TEAM2_PAY_GATE_SITE_CODE` cho site/domain đang rerun. | Rerun checkout probe chỉ sau khi key/header canonical đã được owner xác nhận đúng contract. | Đồng bộ deploy/runtime production để `/health` expose `shared_read_model` và `shared_upstream_runtime` đúng contract. | Đóng các tín hiệu gate còn fail: auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready.`

## Team 1 gate summary
- overallPass: `FAIL`
- gateDecision: `LOCK_RETAINED_WITH_REASON`
- unmetSignals: `auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready`

## Next actions
- Giải quyết precheck canonical env trước khi xin Team 1 review flip.
- Đóng các tín hiệu gate còn fail: auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready.
- Deploy production `/health` đúng shared runtime contract trước khi xin flip.

