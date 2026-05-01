# TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01
- Nhóm: Team 2 Runtime and Platform Core
- Generated at: 2026-05-01T12:29:00.070Z
- Timezone: Asia/Ho_Chi_Minh
- Target: `https://pay.iai.one/internal/checkout-session`
- Key header: `x-api-key`
- Key source: `TEAM2_PAY_GATE_API_KEY`
- Key provided: `PASS`

## Kết quả runtime attempt
- HTTP status checkout: `502`
- Checkout code: `214`
- Checkout message: `Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`
- checkout_url: `null`
- payment_link_id: `null`
- provider numeric codes: `214,4812473095110,214`
- shared_read_model.rolloutReadyForSharedOnly: `PASS`
- shared_upstream_runtime.activeReadMode = shared_contract: `PASS`
- shared_upstream_runtime.releaseGate.ready: `PASS`
- shared_upstream_runtime.releaseGate.reasons: `none`

## Tín hiệu máy đọc
- `auth_key_present`: `PASS`
- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- `shared_read_model_ready_for_shared_only`: `PASS`
- `shared_upstream_active_read_mode_shared_contract`: `PASS`
- `shared_upstream_release_gate_ready`: `PASS`

## Unmet signals
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green

## Nguồn JSON
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json

