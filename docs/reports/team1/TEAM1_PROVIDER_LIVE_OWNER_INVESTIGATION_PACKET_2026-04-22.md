# TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-22
- Team phát hành: Team 1 Program Root / Gate Authority
- Team nhận: Owner provider hoặc owner hạ tầng live thanh toán
- Domain: `pay.iai.one` (`member.vetuonglai.com`)
- Ngày: 2026-04-22
- Trạng thái: `OPEN_REQUIRES_OWNER_ACK`

## 1) Mục tiêu

Khóa lại điều tra lớp live/provider để Team 2 có thể rerun production gate với tín hiệu hợp lệ, tránh lặp lại probe không đủ điều kiện (`401 API_KEY_REQUIRED`).

## 2) Owner bắt buộc xác nhận

1. Merchant hoặc channel payOS của `member.vetuonglai.com` có đang bị dừng hay bị giới hạn không.
2. Runtime production đã bind đủ và đúng môi trường:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`
3. Bản ghi `provider_accounts` canonical là bản ghi nào; bản ghi còn lại có cần vô hiệu hóa không.
4. Key/header canonical để gọi `POST /internal/checkout-session` trong production:
   - header chính thức (`x-api-key` hoặc key tương thích được chấp nhận),
   - nguồn secret binding tương ứng,
   - xác nhận Team 2 có thể dùng an toàn cho rerun probe.

## 3) Bằng chứng owner phải gửi kèm

- Ảnh chụp hoặc log thể hiện trạng thái merchant/channel payOS.
- Ảnh chụp hoặc log bind secret production (được phép che giá trị).
- Ảnh chụp hoặc query output cho `provider_accounts` canonical.
- Bằng chứng key/header contract cho internal checkout probe.

## 4) Điều kiện mở bước rerun gate

Chỉ mở rerun khi Team 1 nhận đủ xác nhận và bằng chứng ở mục 2, mục 3.

Sau đó thực thi chuỗi authority:
1. Team 2 rerun `probe production -> report:pay-prod-gate -> test:pay -> test:dash`.
2. Team 1 đánh giá lại `TEAM1_PAY_PROD_GATE_STATUS_2026-04-22`.
3. Team 1 ra verdict:
   - `LOCK_FLIPPED` nếu mọi tín hiệu bắt buộc `PASS`,
   - hoặc `LOCK_RETAINED_WITH_REASON` nếu còn tín hiệu `FAIL`.

## 5) Tín hiệu gate đang mở tại thời điểm phát hành packet

- `auth_key_present`: FAIL
- `checkout_url_non_null`: FAIL
- `payment_link_id_non_null`: FAIL
- `no_214`: FAIL
- `production_gate_green`: FAIL
- `shared_read_model_ready_for_shared_only`: FAIL
- `shared_upstream_active_read_mode_shared_contract`: FAIL
- `shared_upstream_release_gate_ready`: FAIL

## 6) Tài liệu tham chiếu

- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
