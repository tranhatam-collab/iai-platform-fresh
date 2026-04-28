---

Team cần chốt live `mail-smtp` ngay theo các hạng mục dưới đây. Phạm vi chỉ là SMTP relay + API email backend, không lan sang UI/web.

**Mục tiêu**
Đưa `smtp.mail.iai.one` vào trạng thái live thật, để `mail-smtp` chạy `MAIL_SMTP_BACKEND_MODE=remote`, gọi backend thật, queue thật, audit thật, và smoke pass end-to-end.

**1. Team API Email phải giao**
- Live base URL nội bộ cho SMTP, ví dụ: `https://api.mail.iai.one/v1/internal/smtp/`
- Dựng đủ 6 endpoint `POST`:
  - `auth`
  - `mail-from`
  - `recipient`
  - `normalize`
  - `queue`
  - `audit`
- Expose `GET /health/dependencies`
- Contract response chấp nhận 1 trong 2 kiểu:
  - raw JSON đúng shape TypeScript seam
  - hoặc envelope `{ ok, data, error }`
- Khi reject phải trả rõ:
  - `message`
  - `smtpCode` nếu có
- `normalize` và `queue` phải nhận `rawMimeBase64`
- `queue` phải publish vào queue/worker thật, không stub
- `auth` phải trả đủ:
  - `credentialId`
  - `workspaceId`
  - `principal`
  - `defaultStream`
  - `allowedStreams`
  - `senderIdentityId` nếu có
- `mail-from` phải enforce sender/domain verify
- `recipient` phải enforce suppression/policy thật
- `audit` phải ghi được event runtime SMTP

**2. Team SMTP phải giao**
- Deploy `mail-smtp` trên host mở socket thật
- TLS cert đúng cho `smtp.mail.iai.one`
- STARTTLS trên port `587`
- Set env live:
  - `MAIL_SMTP_BACKEND_MODE=remote`
  - `MAIL_SMTP_REMOTE_BASE_URL=...`
  - `MAIL_SMTP_REMOTE_TOKEN=...` nếu backend cần auth
  - `MAIL_SMTP_REMOTE_AUTH_PATH=auth`
  - `MAIL_SMTP_REMOTE_MAIL_FROM_PATH=mail-from`
  - `MAIL_SMTP_REMOTE_RECIPIENT_PATH=recipient`
  - `MAIL_SMTP_REMOTE_NORMALIZE_PATH=normalize`
  - `MAIL_SMTP_REMOTE_QUEUE_PATH=queue`
  - `MAIL_SMTP_REMOTE_AUDIT_PATH=audit`
  - `MAIL_API_DEPENDENCIES_HEALTH_URL=...`
- Cấp 1 bộ smoke credential thật:
  - `SMTP_USER`
  - `SMTP_PASS`
  - 1 sender đã verify
  - 1 mailbox nhận test thật

**3. Deliverables phải gửi lại**
- Base URL backend thật
- Token/cách auth service-to-service
- Sample request/response thành công cho cả 6 endpoint
- Sample request/response lỗi cho `auth`, `mail-from`, `recipient`
- Kết quả `GET /health/dependencies`
- Kết quả smoke thật bằng `swaks` hoặc `pnpm --filter @iai/mail-smtp smoke`
- Log JSON có các event:
  - `smtp.auth.succeeded`
  - `smtp.mail_from.accepted`
  - `smtp.recipient.accepted`
  - `smtp.message.queued`

**4. Gate để chốt live**
- `pnpm typecheck` pass
- `pnpm build` pass
- `pnpm test` pass
- `/health/dependencies` trả `ok: true`
- Smoke SMTP thật queue được 1 mail và sinh `messageId`
- Audit log + telemetry JSON xuất hiện đúng

**5. Lưu ý**
- Không đổi contract một chiều.
- Không thêm shortcut bypass policy.
- Không để queue/audit còn stub khi báo live.
- Mọi reject phải có mã và lý do rõ để map về SMTP đúng.

Khi xong, gửi lại đầy đủ output và thông tin trên để tôi verify vòng cuối.

---
