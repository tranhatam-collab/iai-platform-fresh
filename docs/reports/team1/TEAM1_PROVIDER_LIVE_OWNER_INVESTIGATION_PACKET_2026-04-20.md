# TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-20
- Team phát hành: Team 1 Program Root / Gate Authority
- Team nhận: Owner provider hoặc owner hạ tầng live thanh toán
- Domain: `pay.iai.one` (`member.vetuonglai.com`)
- Trạng thái: `DISPATCHED_WAITING_OWNER_ACK`
- Mốc phát hành: 2026-04-20 (ICT)

---

## 1. Mục tiêu packet

Team 1 gửi packet điều tra chính thức để khóa trách nhiệm lớp live provider của blocker production payOS (`code=214`), làm điều kiện bắt buộc trước khi Team 2 được rerun gate.

---

## 2. Ba xác nhận bắt buộc từ owner provider

Owner provider phải xác nhận đầy đủ, tường minh, không bỏ sót:

1. Merchant hoặc channel payOS của `member.vetuonglai.com` có đang bị dừng hay không.
2. Runtime production có bind đủ cả ba secret:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`
3. Bản ghi `provider_accounts` nào là canonical; các bản ghi còn lại có cần vô hiệu hóa hay không.

---

## 3. Bằng chứng phải nộp kèm

Owner provider nộp kèm tối thiểu:
- Bằng chứng trạng thái merchant/channel live (không dừng) cho `member.vetuonglai.com`.
- Bằng chứng đã bind đủ 3 secret ở production (được phép che giá trị, chỉ giữ key-name + trạng thái hiện diện).
- Bảng đối chiếu `provider_accounts` hiện hành:
  - id canonical
  - lý do chọn canonical
  - danh sách record cần vô hiệu hóa (nếu có)
  - bằng chứng thao tác vô hiệu hóa hoặc giữ nguyên có giải trình.

---

## 4. Tiêu chí Team 1 chấp nhận packet phản hồi

Phản hồi chỉ được xem là hợp lệ khi:
- trả lời đủ cả 3 xác nhận bắt buộc;
- có đủ bằng chứng kỹ thuật tương ứng;
- nêu rõ trạng thái cuối cùng: `READY_FOR_TEAM2_RERUN` hoặc `BLOCKED_WITH_REASON`.

Nếu thiếu một mục:
- Team 1 giữ nguyên `LOCK_RETAINED`.

---

## 5. Chuỗi hành động sau khi owner provider xác nhận đã sửa

1. Team 2 rerun theo đúng thứ tự:
   - `pnpm report:team2-pay-prod-probe`
   - `pnpm report:pay-prod-gate`
   - `pnpm test:pay`
   - `pnpm test:dash`
2. Team 2 nộp lại evidence packet + report ngắn.
3. Team 1 rerun:
   - `pnpm report:lane`
   - `pnpm report:control-tower`
4. Team 1 chỉ flip `release-claim` khi đồng thời `PASS`:
   - `checkout_url_non_null`
   - `payment_link_id_non_null`
   - `no_214`
   - `production_gate_green`

---

## 6. Escalation nếu owner provider chưa đóng vòng

- Nếu chưa có phản hồi đạt chuẩn trong checkpoint hiện tại:
  - giữ `pay.iai.one` ở `prep-only`;
  - giữ `release-claim = LOCK_RETAINED`;
  - không mở synchronized live.

---

## 7. Tham chiếu điều hành

- `docs/reports/team1/PAY_PROVIDER_LIVE_CONFIG_INVESTIGATION_2026-04-20.md`
- `docs/reports/team1/TEAM_ADMIN_PAY_GATE_OWNERSHIP_MATRIX_2026-04-19.md`
- `docs/reports/team1/TEAM_ADMIN_NEXT_ACTIONS_AFTER_REPORTS_2026-04-20.md`
