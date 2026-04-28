# TEAM2_PAY_PROD_BLOCKER_2026-04-19
- Nhóm: Team 2 Runtime and Platform Core
- Domain: `pay.iai.one`
- Ngày cập nhật: 2026-04-19
- Trạng thái gate: `LOCK_RETAINED`

## 1) Trạng thái hiện tại

- Team 1 đã chốt verdict packet: `ACCEPTED_PACKET_LOCK_RETAINED`.
- Lane kỹ thuật nội bộ của Team 2 giữ ổn định.
- Production lane của `pay` chưa đạt điều kiện gọi là xanh.

## 2) Blocker production đang mở

Theo probe runtime mới nhất của Team 2 (17:09, 2026-04-19 ICT):
- `http_status = 401`
- `code = API_KEY_REQUIRED`
- `message = "x-api-key is required on the internal checkout contract. Legacy x-site-key is still accepted."`
- `checkout_url = null`
- `payment_link_id = null`
- Evidence:
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19.md`
  - `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-19.json`

## 3) 5 tín hiệu production gate cần đóng dứt điểm

| Tín hiệu | Trạng thái hiện tại |
|---|---|
| `attempt_after_2026_04_19` | PASS |
| `checkout_url_non_null` | FAIL |
| `payment_link_id_non_null` | FAIL |
| `no_214` | FAIL |
| `production_gate_green` | FAIL |

## 4) Điều kiện gỡ blocker theo Team 1

1. Có ít nhất 1 attempt production mới sau 2026-04-19.
2. `checkout_url` khác `null`.
3. `payment_link_id` khác `null`.
4. Không còn `214` ở attempt đã đi qua lớp provider.

## 5) Hành động của Team 2

- Giữ `pay` ở prep-only, không claim release.
- Chỉ mở delta nhỏ khi Team 1 phát review note mới.
- Chốt theo dõi blocker thực tế: đã qua 1/5 tín hiệu, còn 4/5 tín hiệu chưa đạt vì thiếu API key hợp lệ để tạo link thật.
- Mỗi delta bắt buộc retest:
  - `pnpm test:pay`
  - `pnpm test:dash`
- Theo dõi tracker máy đọc:
  - `pnpm report:pay-prod-gate -- --date=2026-04-19`
