# TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28
- Nhóm: Team 2 Runtime and Platform Core
- Generated at: 2026-04-28T15:07:47.447Z
- Timezone: Asia/Ho_Chi_Minh
- Target: `https://pay.iai.one/internal/checkout-session`
- Key header: `none`
- Key source: `none`
- Key provided: `FAIL`

## Kết quả runtime attempt
- HTTP status checkout: `401`
- Checkout code: `API_KEY_REQUIRED`
- Checkout message: `x-api-key is required on the internal checkout contract. Legacy x-site-key is still accepted.`
- checkout_url: `null`
- payment_link_id: `null`
- provider numeric codes: `none`
- shared_read_model.rolloutReadyForSharedOnly: `FAIL`
- shared_upstream_runtime.activeReadMode = shared_contract: `FAIL`
- shared_upstream_runtime.releaseGate.ready: `FAIL`
- shared_upstream_runtime.releaseGate.reasons: `none`

## Tín hiệu máy đọc
- `auth_key_present`: `FAIL`
- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- `shared_read_model_ready_for_shared_only`: `FAIL`
- `shared_upstream_active_read_mode_shared_contract`: `FAIL`
- `shared_upstream_release_gate_ready`: `FAIL`

## Unmet signals
- auth_key_present
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green
- shared_read_model_ready_for_shared_only
- shared_upstream_active_read_mode_shared_contract
- shared_upstream_release_gate_ready

## Nguồn JSON
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-28.json

