# TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_2026-05-01
- Generated at: 2026-05-01T12:33:49.520Z
- Timezone: Asia/Ho_Chi_Minh
- Status: `REVIEW_BLOCKED_GATE_FAIL`

## Artifact checks
- PASS `bundle_markdown` — `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-05-01.md`
- PASS `bundle_json` — `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-05-01.json`
- PASS `runtime_probe_markdown` — `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.md`
- PASS `runtime_probe_json` — `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- PASS `shared_runtime_probe_markdown` — `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.md`
- PASS `shared_runtime_probe_json` — `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`
- PASS `team1_gate_markdown` — `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-05-01.md`
- PASS `team1_gate_json` — `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-05-01.json`

## Review checks
- PASS `bundle_preflight_ready` — bundle.status=RERUN_COMPLETED_GATE_FAIL
- FAIL `bundle_green` — bundle.status=RERUN_COMPLETED_GATE_FAIL
- FAIL `gate_overall_pass` — gateDecision=LOCK_RETAINED_WITH_REASON
- PASS `shared_health_contract_shared_runtime` — health_contract_shape=shared_runtime_contract

## Gate signals
- PASS `auth_key_present` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- FAIL `checkout_url_non_null` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- FAIL `payment_link_id_non_null` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- FAIL `no_214` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- FAIL `production_gate_green` — source: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- PASS `shared_read_model_ready_for_shared_only` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`
- PASS `shared_upstream_active_read_mode_shared_contract` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`
- PASS `shared_upstream_release_gate_ready` — source: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`

## Bundle summary
- bundle.status: `RERUN_COMPLETED_GATE_FAIL`
- preflight.ready: `PASS`
- bundle next actions: `Team Pay xác minh merchant/channel/package truth trên payOS dashboard. | Rerun one-shot canonical cho tới khi checkout_status=201 và link non-null. | Chỉ sau khi provider truth xanh, Team 2 mới chạy lại full rerun bundle chính thức.`

## Team 1 gate summary
- overallPass: `FAIL`
- gateDecision: `LOCK_RETAINED_WITH_REASON`
- unmetSignals: `checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green`

## Next actions
- Đóng các tín hiệu gate còn fail: checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green.

