# TEAM1_PAY_PROD_GATE_STATUS_2026-04-24
- Generated at: 2026-04-24T05:47:08.723Z
- Timezone: Asia/Ho_Chi_Minh
- Source present: FAIL
- Runtime probe source present: PASS
- Shared runtime probe source present: FAIL
- Shared runtime signals required from: 2026-04-22
- Overall: FAIL
- Gate decision: LOCK_RETAINED_WITH_REASON
- Gate reason: Chua du dieu kien production gate: team1_manual_note_present, auth_key_present, checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green, shared_read_model_ready_for_shared_only, shared_upstream_active_read_mode_shared_contract, shared_upstream_release_gate_ready.

## Required signals
- auth_key_present
- attempt_after_2026_04_19
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green
- shared_read_model_ready_for_shared_only
- shared_upstream_active_read_mode_shared_contract
- shared_upstream_release_gate_ready

## Source checks
- team1_manual_note_present: FAIL (present=FAIL, value=MISSING, source=docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-24.md, docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-24.md)
- team2_runtime_probe_present: PASS (present=PASS, value=PRESENT, source=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json, docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.md)

## Signal checks
- auth_key_present: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- attempt_after_2026_04_19: PASS (present=PASS, value=PASS, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- checkout_url_non_null: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- payment_link_id_non_null: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- no_214: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- production_gate_green: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- shared_read_model_ready_for_shared_only: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- shared_upstream_active_read_mode_shared_contract: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)
- shared_upstream_release_gate_ready: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json)

## Unmet signals
- team1_manual_note_present
- auth_key_present
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green
- shared_read_model_ready_for_shared_only
- shared_upstream_active_read_mode_shared_contract
- shared_upstream_release_gate_ready

## Source
- docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-24.md
- docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-24.md
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.json
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-24.md
- docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-24.json
- docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-24.md

