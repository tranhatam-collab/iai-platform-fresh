# MAIL_IAI_ONE_REPLACES_RESEND_DIRECTIVE_2026-04-22

## Quyết định khóa

Kể từ ngày `2026-04-22`, `mail.iai.one` là email delivery provider chuẩn cho các lane payment email và transactional email nội bộ đang chạy theo kiến trúc `iai.one`.

Điều này có nghĩa:

- không team nào được chờ `RESEND_API_KEY` để mở gate email cho site nội bộ
- `MAIL_API_KEY` của `mail.iai.one` mới là credential chuẩn
- sender binding, workspace binding, domain verification, inbox proof đều phải đi qua lane `mail.iai.one`
- mọi claim `email live` chỉ hợp lệ khi có evidence từ `mail.iai.one`

## Team nào bị ảnh hưởng ngay

### Team B

- bỏ giả định `Resend` là outbound provider
- dùng `POST /v1/send` của `mail-api`
- dùng `Authorization: Bearer <MAIL_API_KEY>`
- dùng `X-Workspace-Id`

### Team Email + SMTP

- chịu trách nhiệm cấp:
  - `MAIL_API_KEY`
  - sender binding
  - domain verification
  - workspace mapping
- chịu trách nhiệm trả evidence:
  - `message_id`
  - `messages`
  - `message_events`
  - `delivery_attempts`
  - inbox proof

### Team D / Site activation

- không mở site payment email theo checklist cũ kiểu `RESEND_API_KEY`
- chỉ mở khi đã có packet `mail.iai.one` thật

### Team 2 runtime của từng site

- với các site như `tranhatam.com`, route webhook/email docs phải chuyển sang `mail.iai.one`
- `Resend` chỉ được nhắc như alias legacy tạm thời trong giai đoạn cắt chuyển, không còn là canonical provider

## Chuẩn secret và binding mới

Secret chuẩn:

- `MAIL_API_KEY`
- `MAIL_API_WEBHOOK_SECRET`

Var chuẩn:

- `EMAIL_PROVIDER=mail_iai_one`
- `MAIL_API_BASE_URL=https://api.mail.iai.one/v1`

Không còn dùng làm gate chuẩn:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`

## Tiêu chí đóng lane

Không được nói `email live` nếu thiếu một trong các mục sau:

- `MAIL_API_KEY` thật
- sender binding thật
- domain verified thật
- `message_id` thật
- DB evidence trong `messages`, `message_events`, `delivery_attempts`
- inbox proof thật

## Tin nhắn ngắn gửi team

`Từ bây giờ mail.iai.one là provider email chuẩn. Không team nào tiếp tục chờ RESEND_API_KEY để mở gate email. Team B gọi POST /v1/send bằng MAIL_API_KEY. Team Email + SMTP cấp sender binding + workspace binding + evidence thật. Team D chỉ kích hoạt site khi có message_id + DB evidence + inbox proof từ mail.iai.one.`
