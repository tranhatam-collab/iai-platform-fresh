# MAIL_IAI_ONE_WAVE2_CONTENT_LOCK_2026-04-26

Version: 1.0

Status: Content artifact lock — evidence still pending

Date: 2026-04-26

Owners: AI Owner (Claude) — closeout for Team Email + SMTP

Scope: Đóng phần repo-side content artifact cho hai flow `low_risk_internal_alert` và `low_volume_notification` mà `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md §3.2` đã gắn cờ "chưa có artifact nội dung repo-side rõ ràng".

Liên quan: `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md §7.1`.

⸻

## 1. Cái gì đã được lock

Commit `93ef8c2` `mail(wave2): lock low_risk_internal_alert + low_volume_notification bilingual content` đã chốt:

- File mới `packages/mail-core/src/wave2-internal-alerts.ts` xuất `buildWave2InternalAlertPayload(kind, locale, input, config)`.
- Hai flow kind:
  - `low_risk_internal_alert`
  - `low_volume_notification`
- Bilingual VI/EN trên cả ba mặt:
  - `subject` (prefix VI và EN ghép theo locale)
  - `text` (banner VI + banner EN, summary VI + summary EN, label song ngữ)
  - `html` (hai section bilingual + pre block escape an toàn)
- Header truyền tải truth nội bộ:
  - `x-iai-alert-id`
  - `x-iai-alert-scope`
  - `x-iai-alert-severity`
  - `x-iai-flow-kind`
- `messageIdempotencyKey` cố định theo `${alertId}:${kind}` để loại trùng lặp khi cùng cảnh báo phát ra cả hai kind.
- `messageId` và `traceId` random theo flow để evidence không bị nhầm lẫn.
- HTML escape đã pass kiểm thử (không injection từ field `title` / `message`).
- Validation từ chối:
  - `recipients` rỗng
  - bất kỳ field bắt buộc nào trống/whitespace (`alertId`, `title`, `message`, `scope`, `recordedAt`)
- Wired qua `packages/mail-core/src/index.ts` (1 dòng `export *`).

Kèm test `tests/integration/wave2-internal-alerts.test.mjs` — 4 case, pass 4/4 trên dist build:

- bilingual lock cho `low_risk_internal_alert` (locale VI)
- bilingual lock cho `low_volume_notification` (locale EN-first)
- HTML escape + reject empty recipient + reject blank field
- idempotency key tách hai kind, message/trace id không trùng

Tracker `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` đã cập nhật cột `notes` của hai dòng tương ứng để ghi lại file path content artifact.

⸻

## 2. Cái gì vẫn chưa được phép claim

Theo evidence rule trong `IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md §4`, hai dòng này vẫn ở `status = pending` trong tracker vì còn thiếu:

- action thật từ `api.iai.one` (cho `low_risk_internal_alert`) hoặc `app.iai.one` (cho `low_volume_notification`)
- `message_id` thật chạy qua `POST /v1/internal/smtp/queue`
- bằng chứng `messages_ok = yes`
- bằng chứng `message_events_ok = yes`
- bằng chứng `delivery_attempts_ok = yes`
- mailbox/alias thật `alerts@iai.one` và `notifications@iai.one` đã bind trên mailcow
- inbox proof tới mailbox nội bộ

Không dòng nào được tự nâng sang `migrated` chỉ vì content artifact đã lock.

⸻

## 3. Phân loại Wave (làm rõ để không nhầm)

Tracker master phân hai flow này là **Wave 1**, không phải Wave 2:

- cột `wave` trong tracker = `1`
- Wave 1 dev đã mở từ trước
- Wave 1 chỉ được claim green khi tất cả dòng Wave 1 trong tracker = `migrated`

Tên file `wave2-internal-alerts.ts` là lựa chọn tổ chức code để tách khỏi `wave1-intake.ts` (intake form) do hai loại flow có domain khác nhau (intake form từ user vs cảnh báo nội bộ từ runtime). Không phải đề xuất đổi wave classification.

Nếu Founder muốn rename file để khớp wave label, có thể đổi sang `wave1-internal-alerts.ts` trong commit follow-up — nhưng không bắt buộc cho closeout này.

⸻

## 4. Cái gì các team khác cần làm tiếp

### Team Email + SMTP

- Tạo mailbox `alerts@iai.one` và `notifications@iai.one` thật trên mailcow.
- Bind sender identity tương ứng để `senderIdentityId` (nếu config truyền) khớp với mailbox.
- Capture inbox proof ops mailbox sau action thật và đặt vào `docs/iai-mail-platform/evidence/<YYYY-MM-DD>/wave1.low_risk_internal_alert/` và `wave1.low_volume_notification/`.

### Team App/API + Team Ops

- Wire `buildWave2InternalAlertPayload` vào pipeline phát alert thật của `api.iai.one` (cho `low_risk_internal_alert`) và `app.iai.one` (cho `low_volume_notification`).
- Gửi 1 cảnh báo thật theo từng kind, lấy `messageId` từ response queue.
- Gửi readback API `messages` / `message_events` / `delivery_attempts` theo cùng `messageId` vào folder evidence.

### AI Owner

- Sau khi evidence đủ trong folder, AI Owner sẽ flip cờ `messages_ok / message_events_ok / delivery_attempts_ok` trong tracker và viết closeout cho từng flow.
- AI Owner không tự gửi cảnh báo thật, không tự bind mailbox.

⸻

## 5. Acceptance criteria của closeout này

Đã đạt:

- [x] Có artifact code repo-side cho cả `low_risk_internal_alert` và `low_volume_notification`
- [x] Bilingual VI + EN trên subject + text + html
- [x] Test integration pass 4/4 trên dist build
- [x] Tracker `notes` cập nhật để gắn file path
- [x] Closeout packet này (file đang đọc) lock dấu mốc 2026-04-26
- [x] Cập nhật tracker không vi phạm evidence rule (không tự nâng status thành migrated)

Chưa đạt — cần action ngoài repo, không phải scope closeout này:

- [ ] mailbox/alias thật `alerts@iai.one` + `notifications@iai.one`
- [ ] action thật để có `message_id`
- [ ] readback evidence 3 bảng
- [ ] inbox proof

⸻

## 6. Change log

- 2026-04-26 v1.0 — closeout đầu tiên, lock content artifact 2 flow Wave 1 internal alert.
