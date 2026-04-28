# MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22

## Mốc chốt

- Commit khóa repo-side: `ee21e15`
- Commit message: `mail-api: add /v1/send payment outbound contract`

Commit này mở xong lane `mail-api` để nhận payment-style outbound payload từ `pay.iai.one` theo đường `POST /v1/send`.

## Những gì đã xong trong repo

- `mail-api` có `POST /v1/send`
- route này kiểm tra:
  - `Authorization: Bearer <MAIL_API_KEY>`
  - `X-Workspace-Id`
  - sender/domain binding
  - suppression
  - idempotency theo `workspace_id + message_idempotency_key`
- route trả:
  - `message_id`
  - `status`
  - `delivery_status`
  - `failure_code`
  - `provider_route`
- readback API cho message vừa persist thật:
  - `GET /v1/messages/{message_id}`
  - `GET /v1/messages/{message_id}/events`
- queue payload đã giữ được:
  - `metadata`
  - `tags`
- integration test đã pass cho:
  - payment payload hợp lệ
  - idempotent resend
  - persist đủ `messages`, `message_events`, `delivery_attempts`
  - readback detail/events đúng theo message vừa gửi
  - reject `SENDER_NOT_ALLOWED`

## Contract Team B phải dùng

Team B gọi:

`POST /v1/send`

Headers bắt buộc:

- `Authorization: Bearer <MAIL_API_KEY>`
- `X-Workspace-Id: <workspace_id>`
- `X-Request-Id: <trace_or_request_id>`

Payload tối thiểu kiểu payment:

```json
{
  "from": {
    "email": "pay@tranhatam.com",
    "name": "Tranhatam.com"
  },
  "to": [
    {
      "email": "customer@example.com",
      "name": "Nguyen Van A"
    }
  ],
  "reply_to": {
    "email": "support@tranhatam.com",
    "name": "Tranhatam.com Support"
  },
  "stream": "transactional",
  "subject": "Tranhatam.com | Payment receipt #order_123",
  "text": "Payment received for order_123.",
  "message_idempotency_key": "pay-tranhatam-order-123-payment_receipt",
  "metadata": {
    "order_id": "order_123",
    "payment_session_id": "ps_123",
    "provider_reference": "prov_123",
    "source_app": "pay.iai.one",
    "source_domain": "tranhatam.com",
    "template_id": "payment_receipt",
    "x_site_key": "site_tranhatam"
  },
  "tags": ["pay", "payment_receipt", "tranhatam.com"]
}
```

## Việc Team B phải làm tiếp ngay

- nối `payment-surface-registry` vào sender/domain packet
- nối `payment-email-templates` vào composer thật
- map đúng:
  - `from`
  - `reply_to`
  - `stream`
  - `template_id`
  - `source_domain`
  - `receiver_profile_id`
  - `provider_reference`
- gọi `POST /v1/send` thay vì giữ ở read surface/docs-only
- lưu lại response trả về:
  - `message_id`
  - `delivery_status`
  - `provider_route`

## Việc Team Email + SMTP phải làm tiếp ngay

- cấp `MAIL_API_KEY` thật cho runtime
- cấp sender binding thật cho từng workspace/domain
- xác nhận domain verified và sender identity verified
- chạy 1 action thật từ `pay.iai.one`
- lấy evidence:
  - `message_id`
  - response từ `GET /v1/messages/{message_id}`
  - response từ `GET /v1/messages/{message_id}/events`
  - row trong `messages`
  - row trong `message_events`
  - row trong `delivery_attempts`
  - inbox proof Gmail/Outlook/internal

## Gate được phép claim

Được claim:

- repo-side green
- build green
- integration test green

Chưa được claim:

- live outbound done
- payment email live
- Gmail/Outlook delivered

Cho tới khi có đủ:

- `MAIL_API_KEY` thật
- sender binding thật
- 1 `message_id` thật
- DB evidence đủ 3 bảng
- inbox proof thật

## Tin nhắn ngắn gửi team

`Team B`: commit `ee21e15` đã mở xong `POST /v1/send` cho payment outbound contract. Từ đây Team B phải bỏ read-surface-only và gọi route thật bằng packet domain/template/sender đã khóa. Không close lane nếu chưa có `message_id`.

`Team Email + SMTP`: repo-side lane đã xanh. Việc còn lại là inject `MAIL_API_KEY`, sender binding thật, chạy live action, và trả evidence đủ `messages`, `message_events`, `delivery_attempts` + inbox proof. Chưa được claim live chỉ dựa trên build/test.
