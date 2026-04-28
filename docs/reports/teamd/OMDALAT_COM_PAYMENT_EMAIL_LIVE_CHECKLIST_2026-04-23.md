# OMDALAT_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-23
- Team: Team D + Team Email + Team SMTP + Team B
- Date: 2026-04-23
- Scope: external activation gate for `omdalat.com` payment and interaction email readiness
- Status: `EXTERNAL_STEPS_PENDING`

## 1. Sender package đã khóa

Gói sender cho `omdalat.com` đã khóa:

- `pay@omdalat.com`
- `billing@omdalat.com`
- `support@omdalat.com`
- `noreply@omdalat.com`

## 2. Sender policy đã khóa

- biên nhận thanh toán dùng `pay@omdalat.com`
- email chờ xác nhận, thất bại, hoàn tiền dùng `billing@omdalat.com`
- `reply-to` luôn dùng `support@omdalat.com`
- `noreply@omdalat.com` không được dùng làm sender cho payment mail

## 3. Form + template + handoff smoke (repo-side)

Đã có smoke script để xác nhận tuyến form/template/handoff cho domain:

- lệnh:
  - `pnpm --filter @iai/pay build`
  - `node scripts/pay-team-d-email-flow-smoke.mjs --domain=omdalat.com --date=2026-04-23`
- script:
  - `scripts/pay-team-d-email-flow-smoke.mjs`
- flow được kiểm:
  - `payment_receipt`
  - `checkout_status_update`
  - `payment_failed_notice`
  - `refund_notice`
  - `contact_request_received`
  - `support_request_received`
  - `join_request_received`
- điều kiện pass:
  - template route trả `200`
  - đủ template bắt buộc
  - `POST /internal/payment-email/send` trả `202` cho toàn bộ flow
  - handoff đi đúng `https://api.mail.iai.one/v1/send`
  - có đủ `Authorization`, `X-Workspace-Id`, `message_id`

Artifact smoke được lưu tại:

- `docs/reports/teamd/PAY_TEAM_D_OMDALAT_COM_EMAIL_FLOW_SMOKE_2026-04-23.md`

## 4. Các bước external bắt buộc trước khi claim live

1. xác nhận runtime bindings production:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
2. nối live surface `omdalat.com` vào `/api/payment-routing` và trigger event sang `POST /internal/payment-email/send`
3. chạy 1 giao dịch thật hoặc sandbox thật
4. lưu bằng chứng đồng bộ:
   - provider reference
   - checkout/session reference
   - mail `messageId`
   - D1/canonical row
   - inbox proof

## 5. Trạng thái hiện tại

Đã hoàn thành trong lane hiện tại:

- mailbox/alias + inbound routing proof đã có:
  - `docs/iai-mail-platform/OMDALAT_COM_TEAM_EMAIL_SMTP_MAILBOX_INBOUND_PROOF_2026-04-23.md`
- evidence checker đang pass đúng trạng thái gate:
  - `docs/reports/teamd/OMDALAT_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-23.md`

Còn thiếu để mở live:

- runtime bindings production vẫn `PENDING`
- payment proof vẫn `PENDING`
- pay gate vẫn `LOCK_RETAINED_WITH_REASON`

## 6. Hard rule

`omdalat.com payment email live` không được claim cho đến khi đủ 4 bước external ở mục 4, đồng thời pay gate đã mở từ `LOCK_RETAINED_WITH_REASON`.
