# PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-19
- Team: Team 1 Program Root / Gate Authority
- Domain: `pay.iai.one`
- Check date: 2026-04-19
- Source type: production verification note
- Current gate: `LOCK_RETAINED`

## 1) Kết luận ngắn

- `LOCK_RETAINED`: đúng.
- Trạng thái chờ gate liên team: đúng.
- Không thể gọi lane production là “xanh” ở thời điểm hiện tại.

## 2) Bằng chứng production hiện tại

- Team 2 đã thực hiện probe runtime mới lúc `17:09` ngày `2026-04-19` (ICT):
  - Endpoint: `POST https://pay.iai.one/internal/checkout-session`
  - HTTP: `401`
  - `code = API_KEY_REQUIRED`
  - `message = "x-api-key is required on the internal checkout contract. Legacy x-site-key is still accepted."`
  - `checkout_url = null`
  - `payment_link_id = null`
- Tham chiếu evidence:
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19.md`
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19.json`

## 3) Diễn giải trạng thái kỹ thuật

- Đã có attempt mới sau mốc checkpoint, nên tín hiệu `attempt_after_2026_04_19` đạt.
- Hiện tại request còn chặn ở lớp contract auth (`API_KEY_REQUIRED`), chưa đi qua bước tạo link provider.
- Vì chưa có checkout session thành công, chưa có căn cứ xác nhận “không còn `214`” ở lớp provider.
- Production checkout vẫn chưa tạo được link thật (`checkout_url`, `payment_link_id` đều `null`).

## 4) Điều kiện để Team 1 chấp nhận gọi “xanh” cho production

1. Có ít nhất 1 attempt production mới sau ngày 2026-04-19.
2. `checkout_url` khác `null`.
3. `payment_link_id` khác `null`.
4. Không còn `214`.

## 5) Quyết định Team 1 tại checkpoint này

- Giữ `LOCK_RETAINED`.
- Không flip `release_claim` cho đến khi 4 điều kiện ở mục 4 được đáp ứng và có evidence đi kèm.

## 6) Tín hiệu máy đọc (checkpoint 2026-04-19)

- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
