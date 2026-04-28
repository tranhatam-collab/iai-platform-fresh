# MAIL_IAI_ONE_ONE_PAGE_HANDOFF_2026-04-22

Status: DEV OPEN, LIVE CLAIM REQUIRES EVIDENCE

## Quyết định chốt

- `mail.iai.one` là provider email chuẩn cho lane này.
- `Resend` không còn là canonical provider.
- Không team nào tiếp tục chờ `RESEND_API_KEY`.
- Gate chuẩn từ bây giờ là:
  - `MAIL_API_KEY`
  - `MAIL_API_WEBHOOK_SECRET`
  - `MAIL_API_BASE_URL`
  - sender binding
  - workspace binding
  - domain verification

## Dev mở hết ngay bây giờ

Tất cả Wave 1 / Wave 2 / Wave 3 được phép:

- làm dev
- nối runtime
- sync contract
- sync webhook
- chạy build
- chạy dry-run
- chuẩn bị packet evidence

Không còn khóa kiểu:

- `blocked_until_wave1_green` để ngăn bắt đầu dev
- chờ `RESEND_API_KEY`
- chờ Resend như outbound provider canonical

## Nhưng live chỉ được claim khi có evidence thật

Một flow chỉ được claim `migrated` hoặc `live` khi có đủ:

- action thật hoặc sandbox thật đúng flow
- `message_id`
- `messages`
- `message_events`
- `delivery_attempts`
- inbox proof

Riêng auth flow cần thêm:

- VI content
- EN content
- subject
- sender
- reply-to
- link live
- link TTL
- Gmail proof
- Outlook proof

Riêng payment flow cần thêm:

- `provider_ref`
- sender binding thật
- domain verified thật

## Runtime truth đã chốt

- `EMAIL_PROVIDER=mail_iai_one`
- `MAIL_API_BASE_URL=https://api.mail.iai.one/v1`
- webhook canonical: `/v1/email/webhook/mail-iai-one`
- webhook legacy alias tam thoi: `/v1/email/webhook/resend`

## Câu ngắn gửi tất cả team

```text
mail.iai.one là provider email chuẩn từ bây giờ.
Dev mở hết cho Wave 1 / Wave 2 / Wave 3; không còn team nào chờ RESEND_API_KEY.
Tuy nhiên không flow nào được claim migrated/live nếu thiếu action thật, message_id, messages, message_events, delivery_attempts và inbox proof.
Auth flow cần Gmail + Outlook proof.
Payment flow cần thêm provider_ref, sender binding, domain verification và inbox proof.
```
