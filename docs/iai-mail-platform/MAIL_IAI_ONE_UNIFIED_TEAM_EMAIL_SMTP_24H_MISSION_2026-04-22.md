# MAIL_IAI_ONE_UNIFIED_TEAM_EMAIL_SMTP_24H_MISSION_2026-04-22

Version: 1.0

Status: Active 24h Execution Lock

Date: 2026-04-22

Owner: Team Email SMTP

Scope: Gộp toàn bộ phần việc còn lại của Team Email và Team SMTP thành một lane vận hành duy nhất trong 24 giờ tới

## 0. Quyết định gộp team

Từ thời điểm này, lane email không còn tách riêng:

- Team Email
- Team SMTP

Cho phase hiện tại, hai nhóm này được gộp thành một đội duy nhất:

- `Team Email SMTP`

Mục tiêu của việc gộp:

- giảm handoff qua lại
- giảm tranh cãi ownership
- giảm chờ nhau giữa mailbox, sender, inbound, deliverability và proof
- dồn toàn bộ trách nhiệm live còn lại vào một lane duy nhất

## 1. Trạng thái hiện tại đã chốt

Public hostname blocker đã được close ở lớp:

- DNS
- TLS
- SAN certificate
- vhost
- public health proof cho `api.mail.iai.one`
- certificate/hostname proof cho `smtp.mail.iai.one`
- certificate/hostname proof cho `inbound.mail.iai.one`

Trạng thái hiện tại:

- `api.mail.iai.one`: PASS cho `/v1/health` và `/v1/health/dependencies`
- `smtp.mail.iai.one`: PASS certificate/hostname proof trên STARTTLS
- `inbound.mail.iai.one`: PASS certificate/hostname proof
- full public `/v1/send`: CHƯA MỞ

Điều này có nghĩa:

- không còn được claim blocker public hostname vẫn đang mở
- nhưng cũng không được claim full public send API đã cutover xong

## 2. Remaining blockers duy nhất của lane này

Từ giờ lane `Team Email SMTP` chỉ còn đúng 5 cụm blocker:

1. mailbox / alias truth
2. inbound routing truth
3. Gmail proof
4. Outlook proof
5. internal inbox proof

Và thêm một lớp gate vận hành bắt buộc:

6. evidence theo từng flow để close migration waves

## 3. Điều không được làm

Trong 24 giờ tới, `Team Email SMTP` không được:

- mở full public `/v1/send` khi chưa có packet cutover riêng
- tự claim `Wave 1 closed` nếu chưa có action thật theo từng flow
- dùng smoke nội bộ duy nhất để thay cho inbox proof
- yêu cầu Team Ops đổi thêm DNS/cert/vhost nếu không có incident mới
- đẩy blocker còn lại sang Team Web/Auth/Payments/Flow nếu chưa chốt xong lớp mail của mình

## 4. Các team còn lại được giảm việc như thế nào

### Team Web / Auth / Payments / Flow

Trong phase 24 giờ này:

- không nhận thêm nhiệm vụ mở public `/v1/send`
- không bị yêu cầu cutover mail public
- chỉ cần sẵn sàng cung cấp action thật khi `Team Email SMTP` gọi đến để chụp evidence từng flow

### Team Ops

Trong phase 24 giờ này:

- không đổi thêm DNS
- không đổi thêm cert
- không đổi thêm vhost
- chỉ hỗ trợ nếu `Team Email SMTP` cần:
  - rerun proof
  - lấy log
  - chuẩn bị packet cutover tiếp theo

### Team 1

Trong phase 24 giờ này:

- chỉ giữ vai trò review gate
- không cần điều phối chi tiết từng phần nhỏ
- chờ `Team Email SMTP` nộp packet đủ evidence

## 5. Nhiệm vụ 24 giờ tới cho Team Email SMTP

### Block A - Khóa mailbox và alias truth

Phải hoàn tất đủ cho toàn bộ sender bắt buộc:

- `hello@iai.one`
- `contact@iai.one`
- `support@iai.one`
- `noreply@iai.one`
- `security@iai.one`
- `alerts@iai.one`
- `notifications@iai.one`
- `automation@iai.one`
- `pay@iai.one`
- `billing@iai.one`
- `dmarc@iai.one`

Kết quả cần nộp:

- bảng sender -> mailbox/alias thật
- owner inbox của từng sender
- sender nào là mailbox thật, sender nào là alias

### Block B - Khóa inbound routing truth

Phải chốt rõ đường đi thật cho:

- reply
- bounce
- complaint
- support
- billing

Kết quả cần nộp:

- route nào đi đâu
- mailbox nào nhận
- ai chịu trách nhiệm xử lý
- signal nào là inbox thường, signal nào là complaint/bounce

### Block C - Chụp inbox proof thật

Phải có proof thật cho cả 3 lớp:

- Gmail
- Outlook
- internal inbox

Rule:

- không dùng local-only inbox để thay cho Gmail/Outlook
- không dùng `queued` để thay cho inbox proof
- không dùng screenshot rời rạc không map về `message_id`
- chỉ tính proof khi mail được phát từ sender hệ thống thật trên `iai.one` qua `mailcow/mail-api`
- sender hợp lệ cho proof là các sender hệ thống như `pay@iai.one`, `contact@iai.one`, `support@iai.one`, `billing@iai.one`, `noreply@iai.one`
- không dùng founder/personal mailbox làm sender proof
- gate bật `BCC` toàn hệ vẫn phải giữ `OFF` cho tới khi đã có packet proof hệ thống thật tới cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`

Kết quả cần nộp cho mỗi proof:

- flow name
- sender
- recipient
- `message_id`
- log/queue proof map đúng về cùng `message_id`
- inbox proof

### Block D - Đóng Wave 1 theo từng flow thật

Wave 1 phải được xử lý theo từng row:

- `support_form_submission`
- `contact_form_submission`
- `life_contact_briefing_request`
- `low_risk_internal_alert`
- `low_volume_notification`

Mỗi flow chỉ được close khi có đủ:

- action thật
- `message_id` thật
- `messages_ok = yes`
- `message_events_ok = yes`
- `delivery_attempts_ok = yes`
- inbox proof

### Block E - Chuẩn bị mở Wave 2 và Wave 3, nhưng không overclaim

Được phép dev và wiring tiếp:

- Wave 2 auth
- Wave 3 payment/workflow

Nhưng không được claim `migrated/live` nếu thiếu evidence thật.

Đặc biệt với Wave 3 payment:

- chưa được coi là xong nếu Team B chưa gửi action thật qua lane mail
- chưa được coi là xong nếu thiếu `provider_ref`
- chưa được coi là xong nếu thiếu inbox proof

## 6. Thứ tự chạy nhanh nhất trong 24 giờ

1. chốt toàn bộ mailbox / alias truth
2. chốt toàn bộ inbound routing truth
3. chạy 3 inbox proofs mẫu: Gmail / Outlook / internal
4. đóng đủ evidence cho từng flow Wave 1
5. cập nhật migration tracker
6. chỉ sau đó mới nộp packet review cho Team 1

## 7. Định nghĩa hoàn thành trong 24 giờ

`Team Email SMTP` chỉ được báo hoàn thành nhiệm vụ 24 giờ này khi:

1. đã có mailbox / alias truth cho toàn bộ sender bắt buộc
2. đã có inbound routing truth cho `reply`, `bounce`, `complaint`, `support`, `billing`
3. đã có Gmail proof
4. đã có Outlook proof
5. đã có internal inbox proof
6. đã đóng được ít nhất các row Wave 1 bằng evidence thật
7. migration tracker đã được update đúng trạng thái
8. không có claim nào dựa trên assumption hoặc smoke nội bộ duy nhất

## 8. Tin nhắn chuẩn để copy-paste gửi team

```text
Team Email SMTP,

Từ bây giờ lane email được gộp thành một team duy nhất. Không còn tách Team Email và Team SMTP trong phase hiện tại.

Public hostname blocker đã close ở lớp:
- DNS
- TLS
- SAN certificate
- vhost
- public health proof cho api host
- certificate/hostname proof cho smtp và inbound

Trạng thái hiện tại:
- api.mail.iai.one: PASS cho /v1/health và /v1/health/dependencies
- smtp.mail.iai.one: PASS certificate/hostname proof trên STARTTLS
- inbound.mail.iai.one: PASS certificate/hostname proof
- full public /v1/send: CHƯA MỞ

Việc còn lại duy nhất của team là:
1. khóa mailbox / alias truth
2. khóa inbound routing truth
3. lấy Gmail proof
4. lấy Outlook proof
5. lấy internal inbox proof
6. đóng evidence theo từng flow để close migration waves

Operational lock:
- tiếp tục giữ public /v1/send đóng cho đến khi có packet cutover riêng
- chỉ close từng flow khi có đủ action thật + messageId thật + DB evidence + inbox proof
- không dùng founder/personal mailbox làm sender proof ở bất kỳ flow nào
- giữ `BCC` toàn hệ ở trạng thái `OFF` cho tới khi có system-sender proof thật qua `mailcow/mail-api` tới cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`
- không đẩy blocker này sang team khác

Thứ tự chạy trong 24 giờ tới:
1. mailbox / alias truth
2. inbound routing truth
3. Gmail / Outlook / internal inbox proof
4. close Wave 1 bằng evidence thật
5. update migration tracker
6. nộp packet cho Team 1
```

## 9. Source of truth cho file này

File này phải được dùng cùng với:

- `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md`
- `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22.md`
- `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`

Nếu có mâu thuẫn:

1. lane status packet
2. live completion directive
3. migration tracker
4. file 24h mission này
