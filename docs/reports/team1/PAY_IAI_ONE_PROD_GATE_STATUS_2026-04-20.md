# PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-20
- Team: Team 1 Program Root / Gate Authority
- Domain: `pay.iai.one`
- Check date: 2026-04-20
- Source type: production verification note
- Current gate: `LOCK_RETAINED`

## 1) Kết luận ngắn

- `LOCK_RETAINED`: giữ nguyên.
- Chưa đủ điều kiện flip gate.
- Chưa đủ điều kiện synchronized live.

## 2) Bằng chứng production hiện tại

- Team 2 đã thực hiện probe runtime mới lúc `12:13` ngày `2026-04-20` (UTC), tương đương `19:13` ICT:
  - Endpoint: `POST https://pay.iai.one/internal/checkout-session`
  - HTTP: `201`
  - `code = 214`
  - `message = "Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác"`
  - `checkout_url = null`
  - `payment_link_id = null`
- Trạng thái D1 production tại checkpoint này:
  - `provider_accounts_total = 2`
  - đã có bản ghi live cho tenant `vetuonglai`, nhưng kết quả probe vẫn giữ `214`.
- Tham chiếu evidence:
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.md`
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-20.json`

## 3) Diễn giải trạng thái kỹ thuật

- Tín hiệu `attempt_after_2026_04_19` đã đạt.
- Request đã qua lớp contract auth (`HTTP 201`).
- Blocker còn lại nằm ở lớp provider live (`214`) vì chưa sinh link checkout thật.
- `checkout_url` và `payment_link_id` vẫn `null`.

## 4) Ownership tại checkpoint này

- Owner provider / hạ tầng thanh toán: owner chính của lỗi `214` và lớp merchant/channel/secret live.
- Team 2: owner của vòng rerun probe, rerun gate, và nộp lại evidence ngay sau khi cấu hình live được sửa sạch.
- Team 1: owner của `production_gate_green`, `release-claim`, và quyết định giữ/mở `LOCK_RETAINED`.

## 5) Điều kiện còn thiếu để Team 1 flip gate

1. `checkout_url_non_null` = PASS
2. `payment_link_id_non_null` = PASS
3. `no_214` = PASS
4. `production_gate_green` = PASS

## 6) Tín hiệu máy đọc (checkpoint 2026-04-20)

- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
