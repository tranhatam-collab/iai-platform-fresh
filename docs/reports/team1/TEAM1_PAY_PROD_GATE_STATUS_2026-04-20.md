# TEAM1_PAY_PROD_GATE_STATUS_2026-04-20
- Generated at: 2026-04-21T17:50:38.382Z
- Timezone: Asia/Ho_Chi_Minh
- Source present: PASS
- Runtime probe source present: PASS
- Shared runtime signals required from: 2026-04-22
- Overall: FAIL
- Gate decision: LOCK_RETAINED_WITH_REASON
- Gate reason: Chua du dieu kien production gate: checkout_url_non_null, payment_link_id_non_null, no_214, production_gate_green.

## Required signals
- attempt_after_2026_04_19
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green

## Source checks
- team1_manual_note_present: PASS (present=PASS, value=PRESENT, source=docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-20.md)
- team2_runtime_probe_present: PASS (present=PASS, value=PRESENT, source=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json, docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.md)

## Signal checks
- attempt_after_2026_04_19: PASS (present=PASS, value=PASS, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json)
- checkout_url_non_null: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json)
- payment_link_id_non_null: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json)
- no_214: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json)
- production_gate_green: FAIL (present=PASS, value=FAIL, source=team2_probe_json, sourcePath=docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json)

## Unmet signals
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green

## Source
- docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-20.md
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.md

