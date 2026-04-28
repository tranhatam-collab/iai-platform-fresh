# TEAM_B_PAYMENT_OUTBOUND_DETAILED_REPORT_2026-04-22

- Team: Team B (payment outbound integration consumer)
- Date: 2026-04-22
- Scope: `pay.iai.one -> mail-api /v1/send` payment outbound lane
- Status summary: `REPO_SIDE_DONE / LIVE_ACTION_PENDING`

## 1. Mốc chốt đã khóa

- Kỹ thuật nền: `ee21e15` — `mail-api: add /v1/send payment outbound contract`
- Handoff vận hành: `54947cd` — `docs: handoff payment outbound send contract`
- Tài liệu handoff chính:
  - `docs/iai-mail-platform/MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22.md`

## 2. Xác minh repo-side trong vòng này

### 2.1 Commit scope

- `ee21e15` gồm:
  - `apps/mail-api/src/smtp-internal.ts`
  - `packages/mail-core/src/mail-queue.ts`
  - `tests/integration/flow-mail-api-send.test.mjs`
- `54947cd` gồm:
  - `docs/iai-mail-platform/MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22.md`

### 2.2 Build và test re-check (đã chạy lại)

- `pnpm --filter @iai/mail-core build` -> `PASS`
- `pnpm --filter @iai/mail-api build` -> `PASS`
- `node --test tests/integration/flow-mail-api-send.test.mjs` -> `PASS (2/2)`
  - case 1: accept payment payload + idempotent resend + persist evidence
  - case 2: reject sender sai binding với `SENDER_NOT_ALLOWED`

## 3. Contract Team B phải gọi

- Endpoint: `POST /v1/send`
- Header bắt buộc:
  - `Authorization: Bearer <MAIL_API_KEY>`
  - `X-Workspace-Id: <workspace_id>`
  - `X-Request-Id: <trace_or_request_id>`
- Payload payment chuẩn đã khóa trong handoff:
  - `from`, `to`, `reply_to`
  - `stream=transactional`
  - `message_idempotency_key`
  - `metadata` (`order_id`, `payment_session_id`, `provider_reference`, `template_id`, `source_domain`, `x_site_key`)
  - `tags`

## 4. Báo cáo Team B: đã xong vs còn lại

### 4.1 Đã xong

- Repo contract `/v1/send` đã sẵn sàng gọi thật.
- Idempotency theo `workspace_id + message_idempotency_key` đã có.
- Queue giữ được `metadata` và `tags`.
- Persist evidence logic đã có cho:
  - `messages`
  - `message_events`
  - `delivery_attempts`

### 4.2 Còn lại (ngoài repo, bắt buộc để close lane)

- Team B:
  - nối payment surface/template mapping thật vào call site
  - gọi `POST /v1/send` bằng payload live
  - lưu lại response thật: `message_id`, `delivery_status`, `provider_route`
- Team Email + SMTP:
  - cấp `MAIL_API_KEY` thật
  - cấp sender binding/domain verification thật
  - phối hợp chạy live action 1 lần
  - xuất evidence thật:
    - 1 row `messages`
    - 1+ row `message_events`
    - 1+ row `delivery_attempts`
    - inbox proof (Gmail/Outlook/internal)

## 5. Gate claim rõ ràng

- Được claim ngay:
  - `repo-side green`
  - `build green`
  - `integration-test green`
- Chưa được claim:
  - `live outbound done`
  - `payment email live delivered`
- Điều kiện để claim live:
  - có `MAIL_API_KEY` thật
  - có sender binding thật
  - có `message_id` thật
  - có DB evidence đủ 3 bảng
  - có inbox proof thật

## 6. Kết luận điều hành

Team B đã hoàn tất phần “dev/repo contract acceptance” cho lane payment outbound send. Lane chỉ còn bước live action phối hợp liên team để đổi trạng thái từ `REPO_SIDE_DONE` sang `LIVE_DONE`.
