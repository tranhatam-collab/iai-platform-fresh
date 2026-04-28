# TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20
- Nhóm: Team 2 Runtime and Platform Core
- Generated at: 2026-04-20T07:44:14.188Z
- Timezone: Asia/Ho_Chi_Minh
- Target: `https://pay.iai.one/internal/checkout-session`
- Key header: `x-api-key`
- Key provided: `PASS`

## Kết quả runtime attempt
- HTTP status checkout: `201`
- Checkout code: `214`
- Checkout message: `Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`
- checkout_url: `null`
- payment_link_id: `null`
- provider numeric codes: `214`

## Tín hiệu máy đọc
- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`

## Unmet signals
- checkout_url_non_null
- payment_link_id_non_null
- no_214
- production_gate_green

## Nguồn JSON
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json

