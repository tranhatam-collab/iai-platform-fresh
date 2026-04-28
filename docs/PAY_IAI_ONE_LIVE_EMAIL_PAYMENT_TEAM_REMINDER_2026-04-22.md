# PAY_IAI_ONE_LIVE_EMAIL_PAYMENT_TEAM_REMINDER_2026-04-22

## Trạng thái chốt hiện tại

- `apps/pay` đã xanh ở mức `registry + runtime read surface + contract + test`.
- `payment-surface-registry` đã khóa packet cho từng surface `*.iai.one`.
- `payment-email-templates` hiện vẫn là read surface, chưa phải evidence gửi mail live.
- Gate production thật vẫn còn đỏ ở lớp outbound delivery / activation, không còn là lỗi repo-side.
- Checklist live hiện hành cho lane mail dùng chung nằm ở `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22.md`.
- `mail.iai.one` là provider email chuẩn cho lane này; không team nào được tiếp tục chờ `RESEND_API_KEY`.

## Team B / Runtime Pay

Team B nhận phần nối `pay runtime` sang đường gửi mail thật.

Phải làm ngay:
- tiêu thụ `payment-surface-registry` theo `domain`
- tiêu thụ `payment-email-templates` theo `requiredTemplateIds`
- dựng `receiver packet lookup` để lấy đúng `receiver_profile_id`, `payout_profile_id`, link bắt buộc, sender policy
- gọi outbound adapter của `mail.iai.one` bằng payload chuẩn hóa, không tự gửi mail trực tiếp ngoài contract
- lưu lại `provider_ref`, `message_id`, `site/domain`, `template_id`, `locale`, `receiver_profile_id`

Chỉ được claim xong khi có đủ:
- 1 action thanh toán thật hoặc sandbox thật
- 1 `provider_ref`
- 1 `message_id`
- 1 bản ghi D1/runtime tương ứng
- 1 inbox proof đúng domain/site

## Team Email + SMTP / mail.iai.one

Team Email + SMTP nhận phần delivery path thật.

Phải làm ngay:
- nhận payload outbound chuẩn từ `pay.iai.one`
- resolve đúng sender theo `senderPolicy` của từng domain
- gửi qua internal-first SMTP hiện hành, không mở public submission gate
- trả lại `message_id`, `delivery_status`, `failure_code` nếu có
- bảo đảm inbox proof cho Gmail/Outlook/internal mailbox
- lưu evidence trong `messages`, `message_events`, `delivery_attempts`

Gate đóng lane này:
- có `message_id`
- có DB evidence đủ 3 bảng
- có inbox proof
- không lộ secret trong code, log, doc, ticket

## Team D / Payments Activation

Team D nhận phần kích hoạt từng site/domain.

Phải làm ngay:
- bind đủ mailbox hoặc alias gửi/nhận cho từng site
- điền đủ `receiver_profile`, `payout_profile`, merchant/receiver mapping
- xác nhận link bắt buộc theo packet domain
- chạy 1 flow thanh toán mẫu cho từng site được phép mở
- lưu evidence activation theo site

Không được tự nâng trạng thái `LIVE` nếu thiếu bất kỳ thứ nào sau:
- sender binding thật
- `provider_ref`
- `message_id`
- DB/runtime row
- inbox proof

## Phạm vi `*.iai.one` đang khóa

Payment-active hoặc candidate:
- `pay.iai.one`
- `flow.iai.one`
- `life.iai.one`
- `app.iai.one`
- `noos.iai.one`
- `web.iai.one`
- `cios.iai.one`

Billing-support-only:
- `dash.iai.one`
- `developer.iai.one`

Non-payment surface, không được gửi payment mail customer-facing:
- `docs.iai.one`
- `api.iai.one`
- `api.flow.iai.one`
- `mail.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

## Tin nhắn ngắn để giao việc

`Team B`: Repo-side cho `*.iai.one` đã xanh ở mức registry/runtime/test. Việc còn lại của Team B là nối `payment-surface-registry` + `payment-email-templates` vào outbound adapter thật, lưu `provider_ref + message_id + runtime row`, và chỉ claim xong khi có inbox proof.

`Team Email + SMTP`: Không đổi public submission gate. Tiếp tục internal-first. Team phải nhận payload từ `pay.iai.one`, gửi thật theo sender policy từng domain, trả `message_id`, và lưu evidence đủ `messages`, `message_events`, `delivery_attempts` kèm inbox proof.

`Team D`: Không nâng site nào lên `LIVE` nếu chưa có sender binding thật, `provider_ref`, `message_id`, DB/runtime row và inbox proof. Kích hoạt lần lượt theo site packet đã khóa trong registry.
