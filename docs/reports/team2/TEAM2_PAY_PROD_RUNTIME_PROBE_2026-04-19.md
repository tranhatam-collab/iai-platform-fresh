# TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19
- Nhóm: Team 2 Runtime and Platform Core
- Generated at: 2026-04-19T10:09:34.713Z
- Timezone: Asia/Ho_Chi_Minh
- Target: `https://pay.iai.one/internal/checkout-session`
- Key header: `none`
- Key provided: `FAIL`

## Kết quả runtime attempt
- HTTP status checkout: `401`
- Checkout code: `API_KEY_REQUIRED`
- Checkout message: `x-api-key is required on the internal checkout contract. Legacy x-site-key is still accepted.`
- checkout_url: `null`
- payment_link_id: `null`
- provider numeric codes: `none`

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
- docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19.json

