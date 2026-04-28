# TEAM1_OWNER_PROVIDER_FOLLOWUP_2026-04-22
- Team phát hành: Team 1 Program Root / Gate Authority
- Team nhận: Owner provider hoặc owner hạ tầng live thanh toán
- Domain: `pay.iai.one` (`member.vetuonglai.com`)
- Trạng thái: `OPEN_WAITING_OWNER_ACK`
- Mục tiêu: chốt xác nhận lớp live để mở bước rerun gate cho Team 2

## 1) Ngữ cảnh bắt buộc

Team 1 giữ `release-claim = LOCK_RETAINED` cho đến khi nhận đủ xác nhận owner và thấy 4 tín hiệu production gate chuyển `PASS`.

## 2) Ba xác nhận owner phải trả lời

1. Merchant hoặc channel payOS của `member.vetuonglai.com` có đang bị dừng không.
2. Runtime production đã bind đủ:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`
3. Bản ghi `provider_accounts` canonical là bản ghi nào, và bản ghi còn lại có cần vô hiệu hóa không.

## 2.1) Xác nhận bổ sung cho contract probe nội bộ

- Team 2 probe ngày `2026-04-22` trả `401 API_KEY_REQUIRED`, vì vậy owner cần xác nhận key/header canonical để gọi `POST /internal/checkout-session` ở môi trường production.
- Mục tiêu: tránh rerun thiếu key hợp lệ làm sai kết luận gate production.

## 3) Bằng chứng owner phải gửi kèm

- Evidence trạng thái merchant/channel live.
- Evidence bind 3 secret production (cho phép che giá trị).
- Evidence canonical `provider_accounts` + kế hoạch thao tác record không canonical.

## 4) Điều kiện mở bước tiếp theo

Chỉ khi owner trả lời đủ 3 xác nhận:
1. Team 2 mới rerun probe/gate/test.
2. Team 1 mới ra verdict `LOCK_FLIPPED` hoặc `LOCK_RETAINED_WITH_REASON`.

## 5) Tài liệu tham chiếu

- `docs/reports/team1/TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-20.md`
- `docs/reports/team1/TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
