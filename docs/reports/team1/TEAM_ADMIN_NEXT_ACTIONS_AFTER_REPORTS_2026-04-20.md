# TEAM ADMIN NEXT ACTIONS AFTER REPORTS 2026-04-20
## Bước tiếp theo sau khi Team 1, Team 2, Team 5 đã nộp báo cáo

---

## 1. Kết luận điều hành

Bốn điểm đã khóa xong:
- Team 1 đã đóng cụm `owner sign-off` NO-GO.
- Team 2 đã đi hết phần lane kỹ thuật trong vòng hiện tại.
- Team 3 đã nộp đủ daily/report checkpoint `2026-04-20` để control loop không còn hold vì thiếu báo cáo.
- Team 5 đã giữ live-sync packet và readiness đúng vai trò.

Ba điểm chưa được phép làm:
- chưa deploy synchronized live
- chưa flip `release-claim`
- chưa mở scope mới cho `pay.iai.one`

Blocker còn lại chỉ còn một cụm:
- lớp provider live của `pay.iai.one`

---

## 2. Việc phải làm ngay

### Việc 1 — Team 1 gọi owner provider

Team 1 phải làm ngay:
- xác nhận merchant hoặc channel live thực tế của `payOS`
- xác nhận secret binding production đúng môi trường
- xác nhận mapping tenant/site đang trỏ đúng provider account live
- xác nhận bản ghi `provider_accounts` canonical và việc vô hiệu hóa bản ghi không canonical (nếu có)

Trạng thái hiện tại:
- `DISPATCHED_WAITING_OWNER_ACK` (Team 1 đã gửi packet điều tra chính thức)
- Packet: `docs/reports/team1/TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-20.md`

Output bắt buộc:
- một note xác nhận cấu hình live đã đúng
hoặc
- một note chỉ rõ phần cấu hình nào còn sai

Nếu chưa có note này:
- không chuyển bước

### Việc 2 — Owner provider sửa sạch lỗi `214`

Owner provider hoặc owner hạ tầng thanh toán phải xử lý:
- lỗi `214`
- `checkout_url = null`
- `payment_link_id = null`

Đây là blocker gốc.

### Việc 3 — Team 2 rerun vòng production gate

Ngay sau khi provider xác nhận đã sửa:
- rerun probe production
- rerun `pnpm report:pay-prod-gate`
- rerun `pnpm test:pay`
- rerun `pnpm test:dash`
- cập nhật evidence packet và report ngắn

Mục tiêu:
- chuyển đủ 4 tín hiệu còn thiếu sang `PASS`

### Việc 4 — Team 1 flip gate

Chỉ khi Team 2 nộp evidence mới và cả 4 tín hiệu đều xanh:
- Team 1 rerun pay gate checker
- Team 1 rerun control tower
- Team 1 quyết định bỏ `LOCK_RETAINED`
- Team 1 flip `release-claim`

Nếu chỉ một tín hiệu còn `FAIL`:
- giữ nguyên `LOCK_RETAINED`

### Việc 5 — Team 5 rerun readiness cuối

Chỉ sau khi Team 1 flip gate:
- Team 5 rerun readiness
- Team 5 rerun final live-sync packet
- Team 5 xác nhận lại trạng thái synchronized live

---

## 3. Team nào không được mở thêm việc

### Team 3
- không mở lane mới
- không sửa theo cảm giác
- chỉ chờ delta thực sự từ Team 1 hoặc Team 2

### Team 4
- không mở scope mới
- giữ packet và ops wording ổn định
- chờ cùng điều kiện gate như Team 5

### Team 5
- không claim synchronized live sớm
- không tự xử lý blocker `pay`
- chỉ giữ checkpoint loop xanh

---

## 4. Điều kiện để được nói tới deploy live

Chỉ được nói tới deploy live đồng bộ khi đủ đồng thời:
- 4 owner sign-off NO-GO đã xong
- `pay` production gate hết `FAIL`
- `release-claim` không còn `LOCK_RETAINED`
- Team 5 readiness cuối cùng chuyển sang trạng thái sẵn sàng live

Nếu thiếu một trong bốn điều kiện trên:
- chưa deploy synchronized live

---

## 5. Điều kiện để được deploy riêng `web.iai.one`

Nếu muốn deploy riêng `web.iai.one` trước synchronized live, vẫn phải có:
- quyết định tường minh của Team 1
- rollback note riêng cho web
- xác nhận không vi phạm shared release claim toàn hệ

Nếu chưa có quyết định tường minh này:
- chưa deploy web riêng

---

## 6. Ước lượng thời gian còn lại

Sau khi owner provider sửa xong live config:
- Team 2: `15–30 phút`
- Team 1: `15–30 phút`
- Team 5: `10–15 phút`

Tổng:
- khoảng `30–60 phút`

Nếu `214` chưa được gỡ:
- chưa được hứa giờ live

---

## 7. Câu chốt điều hành

Việc tiếp theo không phải build thêm.

Việc tiếp theo là:
- sửa đúng lớp provider live
- rerun đúng gate
- flip đúng authority
- rồi mới nói tới live

---

## 8. Snapshot kiểm tra Team 1 (2026-04-20, 13:52 ICT)

- `TEAM1_NO_GO_PACKET_STATUS_2026-04-20`: `PASS` (4 owner sign-off NO-GO đã hoàn tất)
- `TEAM1_PAY_PROD_GATE_STATUS_2026-04-20`: `FAIL` (còn 4 tín hiệu thiếu)
  - `checkout_url_non_null`
  - `payment_link_id_non_null`
  - `no_214`
  - `production_gate_green`
- `LANE_STATUS_SNAPSHOT_2026-04-20`: `PASS`
- `CONTROL_TOWER_AUTOMATION_STATUS_2026-04-20`: `READY / PASS`
- `release-claim state`: `LOCK_RETAINED`

Kết luận xác nhận:
- Team 1 chưa có căn cứ để flip `release-claim`.
- `ESC-H2` đã đóng.
- Chưa đủ điều kiện synchronized live vì blocker còn lại chỉ còn ở `pay` production gate.
