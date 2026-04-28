# MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15
## Status: VERIFIED AND CLEAN FOR INTERNAL-FIRST VERIFICATION
## Date: 2026-04-15

## 1) Phạm vi đã đóng

Lane này chỉ đóng cho:
- xác minh `mail-smtp` chạy ở `remote` mode
- xác minh `mail-api` internal backend nhận đúng token cùng giá trị
- xác minh smoke SMTP thật trả `messageId`
- xác minh DB ghi đủ `messages`, `message_events`, `delivery_attempts`
- xác minh rollback stop-check và observation window không lỗi

Lane này KHÔNG đồng nghĩa:
- đã cut public submission `587/465`
- đã thay đổi Mailcow public path
- đã close toàn bộ production rollout cho mọi app

## 2) Kết quả chốt

Đã đạt đủ điều kiện xác minh nội bộ:
- `MAIL_SMTP_BACKEND_MODE=remote`
- `MAIL_SMTP_REMOTE_BASE_URL` đã set
- `MAIL_SMTP_REMOTE_TOKEN` đã rotate và evidence chỉ lưu hash
- smoke SMTP thật trả:
  - `messageId = msg_ed490a75-f3f1-4b24-a98d-cf09a65d25c3`
- DB evidence đúng theo `messageId`:
  - `messages = 1`
  - `message_events = 2`
  - `delivery_attempts = 1`
  - `status = provider_accepted`
- observation window:
  - `observation_failures = 0`
- rollback stop-check:
  - `api_alive_after_stop = no`
  - `smtp_alive_after_stop = no`

## 3) Bảo mật

Đã xác nhận bundle evidence hiện tại không chứa:
- token thô
- header `Authorization: Bearer ...`
- secret runtime value có thể reuse trực tiếp

Token rotation evidence chỉ lưu:
- `old_token_sha256`
- `new_token_sha256`
- `rotated=true`

## 4) Quyết định gửi team

Có thể close lane:
- `internal-first verification`

Chưa được tự suy diễn thành:
- `public submission go-live`
- `mail.iai.one public cutover`

## 5) Tin nhắn cuối gửi team

```text
Team,

Lane internal-first verification for mail-smtp is now clean and can be closed.

Verified scope completed:
- mail-smtp runs in remote mode against mail-api internal backend
- shared remote token was rotated and evidence is sanitized (hash-only, no raw secret)
- real SMTP smoke succeeded with messageId:
  msg_ed490a75-f3f1-4b24-a98d-cf09a65d25c3
- DB evidence matched the same messageId across:
  messages = 1
  message_events = 2
  delivery_attempts = 1
  status = provider_accepted
- observation window completed with 0 failures
- rollback stop-check passed

This closes the internal-first verification lane only.
It does not mean public Mailcow submission 587/465 has been cut over.
Any public submission change remains a separate decision gate.
```

## 6) Evidence nguồn

Evidence bundle:
- `ops/mail-internal-first/evidence/internal-first-hardening-20260415-101806/`

Các file tối thiểu:
- `summary.txt`
- `token-rotation.txt`
- `smtp-health.json`
- `smtp-health-dependencies.json`
- `app-api-smtp-flow.out`
- `msg-id.txt`
- `db-evidence.json`
- `observation-summary.txt`
- `rollback-stop-check.txt`
