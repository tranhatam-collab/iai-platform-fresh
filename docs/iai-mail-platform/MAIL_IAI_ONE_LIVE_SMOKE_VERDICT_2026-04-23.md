# MAIL_IAI_ONE_LIVE_SMOKE_VERDICT_2026-04-23

Trạng thái: PARTIAL LIVE PROOF, NOT LIVE-CLOSED

Ngày: 2026-04-23

## 1. Những gì đã được xác minh thật

Live smoke packet do Team Email SMTP cung cấp:

- `message-id = <mail-iai-one-smoke-1776880073-3580487@mail.iai.one>`
- `SendGrid queue id = DbjUiln9SCyNtsN34kOm4Q`
- Postfix đã trả `status=sent` tới:
  - `tranhatam66@gmail.com`
  - `tranhatam@gmail.com`

Đọc trực tiếp từ Gmail connector đã xác minh:

- message tồn tại thật trong Gmail theo đúng `rfc822msgid`
- message hiện nằm trong label:
  - `INBOX`
  - `CATEGORY_PERSONAL`
- metadata hiện thấy:
  - `from = IAI Payments pay@mail.iai.one`
  - `to = tranhatam66@gmail.com, tranhatam@gmail.com`
  - `bcc = []`
  - `subject = [IAI mail.iai.one Smoke] 2026-04-22T17:47:53Z`

## 2. Những gì packet này cho phép kết luận

Được phép kết luận:

- outbound relay thật của `mail.iai.one` hiện đã gửi ra ngoài thành công
- ít nhất một Gmail inbox proof thật đã có
- system `BCC` hiện vẫn đang `OFF` trong smoke này vì message không có `bcc`
- bản auth cũ treo không còn là blocker của sample smoke hiện tại

## 3. Những gì vẫn chưa được phép overclaim

Packet này CHƯA đủ để claim `Team Email SMTP live-close`.

Các lý do còn mở:

1. Mới xác minh trực tiếp được Gmail inbox proof của `tranhatam@gmail.com`
2. Chưa có inbox proof độc lập được đọc trực tiếp cho `tranhatam66@gmail.com`
3. Chưa có Outlook proof
4. Chưa có internal inbox proof
5. Chưa có mailbox/alias truth đã khóa đủ cho toàn bộ sender bắt buộc
6. Chưa có inbound routing truth đã khóa đủ cho `reply`, `bounce`, `complaint`, `support`, `billing`
7. Chưa có Wave 1 action thật theo từng flow với:
   - `message_id`
   - `messages`
   - `message_events`
   - `delivery_attempts`
   - inbox proof

## 4. Canonical sender mismatch cần chốt

Điểm quan trọng nhất của smoke hiện tại:

- Gmail đang thấy `from = pay@mail.iai.one`

Trong khi rule hiện hành của lane mail đang khóa system sender proof ở các sender kiểu:

- `pay@iai.one`
- `contact@iai.one`
- `support@iai.one`
- `billing@iai.one`
- `noreply@iai.one`

Kết luận bắt buộc:

- smoke này chứng minh relay live và inbox placement một phần
- nhưng CHƯA chứng minh sạch canonical sender package theo rule đang khóa trong repo
- nếu `pay@mail.iai.one` là alias thật được vận hành chấp nhận, lane phải chốt rõ alias truth
- nếu `pay@mail.iai.one` không phải canonical sender của payment lane, smoke tiếp theo phải dùng `pay@iai.one` hoặc `billing@iai.one`

## 5. Verdict hiện tại

- `Outbound relay live`: PASS
- `Gmail inbox proof`: PASS cho `tranhatam@gmail.com`
- `Second Gmail inbox proof`: NOT VERIFIED DIRECTLY
- `Canonical sender proof`: NOT CLEAN
- `BCC gate`: MUST REMAIN OFF
- `Public /v1/send`: STILL NOT PUBLIC
- `Team Email SMTP live-close`: NO

## 6. Thứ tự làm tiếp

1. Xác minh inbox proof độc lập cho `tranhatam66@gmail.com`
2. Chốt canonical sender cho payment smoke:
   - hoặc hợp thức hóa `pay@mail.iai.one`
   - hoặc chuyển sang `pay@iai.one` / `billing@iai.one`
3. Khóa mailbox/alias truth cho toàn bộ sender bắt buộc
4. Khóa inbound routing truth
5. Lấy Outlook proof
6. Lấy internal inbox proof
7. Chỉ sau đó mới close Wave 1 theo từng flow thật

## 7. Câu ngắn gửi team

```text
Live smoke 2026-04-23 xác nhận outbound relay của mail.iai.one đã gửi thật ra Gmail và ít nhất một inbox proof đã vào INBOX. Tuy nhiên lane Team Email SMTP chưa được live-close. Message hiện đang hiện from=pay@mail.iai.one, nên canonical sender package vẫn chưa sạch theo rule repo đang khóa ở pay@iai.one/billing@iai.one. BCC tiếp tục OFF. Việc còn lại là xác minh inbox độc lập cho tranhatam66@gmail.com, chốt sender canonical hoặc alias truth, rồi hoàn tất mailbox/alias truth, inbound truth, Outlook proof, internal proof và Wave 1 evidence.
```
