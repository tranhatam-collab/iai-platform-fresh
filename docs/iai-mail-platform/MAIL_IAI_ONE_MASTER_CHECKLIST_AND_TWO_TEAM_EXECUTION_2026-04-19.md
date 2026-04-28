# MAIL IAI ONE - MASTER CHECKLIST VÀ PHÂN CÔNG 2 TEAM - 2026-04-19

Ngày chốt: 2026-04-19

## 1. Mục tiêu thực tế

Mục tiêu của lane này không còn là "SMTP đã chạy" nữa, mà là:

1. Mọi web và app trong hệ `*.iai.one` gửi email thật qua runtime nội bộ đã được xác minh.
2. Mọi flow quan trọng đều có nội dung email song ngữ Việt/Anh, sender đúng, reply-to đúng, và route inbound đúng.
3. Mỗi flow chỉ được xem là live khi có đủ:
   - 1 action thật từ app/web
   - 1 `messageId` thật
   - DB evidence trong cả `messages`, `message_events`, `delivery_attempts`
4. Public submission Mailcow `587/465` vẫn giữ nguyên, không dùng cho migration app/API trong giai đoạn này.

## 2. Sự thật hiện tại

Những gì đã xanh:

- `mail-smtp` internal-first đã qua verify.
- `mail-smtp` đang chạy `remote` mode vào `mail-api`.
- Đã có smoke thật và DB evidence hợp lệ với `messageId`.
- Decision gate cho public submission vẫn đóng.

Những gì chưa xong:

- Chưa có bằng chứng rằng toàn bộ flow của từng web đã đi qua internal SMTP.
- Chưa có bằng chứng Gmail/Outlook deliverability cho từng sender stream chính.
- Chưa có inbound routing thật cho reply, bounce, complaint, support, billing.
- Chưa có một tracker tổng hợp duy nhất cho tất cả web/app đang dùng email.

## 3. Mô hình 2 team bắt buộc

Hệ email này chỉ chốt được khi 2 team giao đúng phần của mình.

### Team A: Codex / App Integration / Nội dung email

Team này do Codex chịu trách nhiệm.

Phải giao đủ:

- Mapping từng flow email theo từng web/app.
- Nội dung email song ngữ Việt/Anh cho từng flow.
- Subject, preview text, HTML, text version, CTA, footer, reply-to.
- Wiring contact form, support form, magic link, verify email, reset password, security notice, payment notice, workflow email.
- Auto-reply logic khi user gửi form hoặc khi flow yêu cầu phản hồi tự động.
- Update tracker với evidence thật sau mỗi lần migrate.
- Không close flow nếu chưa có `messageId` thật và DB evidence đủ 3 bảng.

Team này không sở hữu:

- DNS sending.
- Outbound relay/provider.
- Queue transport, mailbox hosting, inbound routing engine, DKIM/SPF/DMARC.

### Team B: SMTP Mail Runtime / Deliverability / Inbound

Team này do Team SMTP Mail sở hữu.

Phải giao đủ:

- `mail-api`, `mail-smtp`, `mail-worker` chạy thật ở runtime.
- 6 endpoint backend thật cho internal SMTP contract.
- Persistence thật vào `messages`, `message_events`, `delivery_attempts`.
- Queue transport thật, không còn stub.
- Primary outbound provider/relay thật để mail ra Gmail/Outlook.
- DNS deliverability pass: SPF, DKIM, DMARC, MX, rDNS, TLS, bounce/complaint route.
- Mailbox thật, alias thật, inbound route thật.
- Health, dependency check, rollback, token rotation, sanitized evidence.

Team này không sở hữu:

- Nội dung email của từng web.
- Quy tắc business cho contact/support/auth/payment/workflow.

## 4. Danh sách sender và mailbox bắt buộc

Bắt buộc có thật:

- `hello@iai.one`
- `contact@iai.one`
- `support@iai.one`
- `noreply@iai.one`
- `security@iai.one`
- `alerts@iai.one`
- `notifications@iai.one`
- `automation@iai.one`
- `pay@iai.one`
- `billing@iai.one`
- `dmarc@iai.one`

Alias nên khóa ngay:

- `life@iai.one` -> `contact@iai.one`
- `team@life.iai.one` -> inbox life hoặc `contact@iai.one`
- `billing+inbound@iai.one` -> billing workflow
- `help@iai.one` -> `support@iai.one`

Quy tắc sender:

- Auth chỉ gửi bằng `noreply@iai.one` hoặc `security@iai.one`
- Payment chỉ gửi bằng `pay@iai.one` hoặc `billing@iai.one`
- Alert hệ thống chỉ gửi bằng `alerts@iai.one`
- Automation chỉ gửi bằng `automation@iai.one`
- Form công khai chỉ gửi bằng `hello@iai.one`, `contact@iai.one`, `support@iai.one`

## 5. Ma trận web/app -> flow email

### Wave 1: transactional rủi ro thấp

1. `iai.one` / `home.iai.one`
   - Flow: `contact_form_submission`
   - Sender: `hello@iai.one`
   - Owner app side: Team Web
   - Trạng thái: pending

2. `life.iai.one`
   - Flow: `life_contact_briefing_request`
   - Sender: `contact@iai.one`
   - Reply-to: `contact@iai.one`
   - Owner app side: Team Web
   - Trạng thái: pending
   - Ghi chú: surface hiện đã trỏ về `contact@iai.one`, cần nối vào internal SMTP và auto-reply song ngữ

3. `app.iai.one`
   - Flow: `support_form_submission`
   - Sender: `support@iai.one`
   - Owner app side: Team App/API
   - Trạng thái: pending

4. `api.iai.one`
   - Flow: `low_risk_internal_alert`
   - Sender: `alerts@iai.one`
   - Owner app side: Team Flow/Ops
   - Trạng thái: pending

5. `app.iai.one`
   - Flow: `low_volume_notification`
   - Sender: `notifications@iai.one`
   - Owner app side: Team App/API
   - Trạng thái: pending

### Wave 2: xác thực trọng yếu

Dev lane đã mở ngay khi provider được chốt sang `mail.iai.one`.
Chỉ phần claim `migrated/live` mới còn bị khóa theo evidence.

1. `app.iai.one`
   - `magic_link_login`
   - Sender: `noreply@iai.one`
   - Trạng thái: pending_dev_open

2. `app.iai.one`
   - `reset_password`
   - Sender: `security@iai.one`
   - Trạng thái: pending_dev_open

3. `app.iai.one`
   - `email_verification`
   - Sender: `noreply@iai.one`
   - Trạng thái: pending_dev_open

4. `app.iai.one`
   - `security_notice`
   - Sender: `security@iai.one`
   - Trạng thái: pending_dev_open

### Wave 3: payment và workflow

Dev lane đã mở ngay.
Không flow nào của Wave 3 được claim live nếu thiếu packet evidence thật từ `mail.iai.one`.

1. `pay.iai.one` / `api.iai.one`
   - `payment_receipt`
   - Sender: `pay@iai.one`
   - Trạng thái: pending

2. `pay.iai.one` / `api.iai.one`
   - `checkout_status_update`
   - Sender: `pay@iai.one`
   - Trạng thái: pending

3. `pay.iai.one`
   - `renewal_or_failure_notice`
   - Sender: `billing@iai.one`
   - Trạng thái: pending

4. `flow.iai.one` / `api.flow.iai.one`
   - `workflow_automation_email`
   - Sender: `automation@iai.one`
   - Trạng thái: pending

5. `noos.iai.one`
   - `checkout_success_handoff_notice`
   - Sender: `noreply@iai.one`
   - Trạng thái: pending

### Surface cần theo dõi tiếp nhưng chưa mở gate

- `dash.iai.one`
- `docs.iai.one`
- `developer.iai.one`
- `cios.iai.one`
- `mail.iai.one`

## 6. Điều kiện close một flow

Một flow không được đánh dấu `migrated` nếu thiếu bất kỳ mục nào sau đây:

1. Trigger/action thật từ app hoặc web.
2. `messageId` thật từ runtime.
3. `messages` có bản ghi đúng `messageId`.
4. `message_events` có event đúng `messageId`.
5. `delivery_attempts` có attempt đúng `messageId`.
6. Nội dung email đúng locale yêu cầu.
7. Sender và reply-to đúng contract.

## 7. Những gì Team SMTP phải giao ngay cho Codex

Không gửi secret thô trong chat. Chỉ inject vào runtime và gửi output đã làm sạch.

Bắt buộc giao:

1. Runtime target thật của `mail-api`, `mail-smtp`, `mail-worker`
2. `/health` và `/health/dependencies` xanh
3. 1 bộ smoke credential cho testing nội bộ
4. 1 outbound provider/relay thật để thử Gmail và Outlook
5. Bằng chứng DKIM/SPF/DMARC pass cho sending identity chính
6. Mailbox/alias/inbound route thật cho `contact`, `support`, `billing`, `alerts`
7. 1 outbound test vào Gmail
8. 1 outbound test vào Outlook
9. 1 inbound test từ ngoài vào mailbox hệ thống

Lệnh Ops có thể chạy ngay:

```bash
docker compose -f ops/mail-internal-first/docker-compose.prod.yml ps
curl -sS http://127.0.0.1:19091/health
curl -sS http://127.0.0.1:19091/health/dependencies
pnpm --filter @iai/mail-smtp smoke
sqlite3 ops/mail-internal-first/runtime-state/iai-mail-flow.sqlite "SELECT id, status FROM messages ORDER BY created_at DESC LIMIT 5;"
sqlite3 ops/mail-internal-first/runtime-state/iai-mail-flow.sqlite "SELECT message_id, event_type FROM message_events ORDER BY created_at DESC LIMIT 10;"
sqlite3 ops/mail-internal-first/runtime-state/iai-mail-flow.sqlite "SELECT message_id, provider_status FROM delivery_attempts ORDER BY created_at DESC LIMIT 10;"
```

## 8. Những gì Codex sẽ giao

1. Bộ nội dung email song ngữ Việt/Anh cho từng flow đang mở
2. Mapping sender, reply-to, CTA, footer, auto-reply
3. Wiring email cho web/app có sẵn
4. Update tracker runtime theo từng flow
5. Chỉ close khi đủ evidence

## 9. Thứ tự thực thi bắt buộc

1. Team SMTP chốt nền tảng gửi/nhận thật
2. Codex chot Wave 1
3. Team Auth + Codex chot Wave 2
4. Team Payments + Flow/Ops + Codex chot Wave 3
5. Team SMTP + Codex chốt inbound reply automation
6. Lúc đó mới được nói "toàn hệ email đã live"

## 10. Giao việc rất ngắn theo từng team

### Team Web

- Nối `iai.one`, `home.iai.one`, `life.iai.one` vào internal SMTP runtime
- Kích hoạt contact form thật + auto-reply song ngữ
- Giao 1 action thật + 1 `messageId` + DB evidence cho mỗi flow

### Team Auth

- Chuẩn bị 4 flow: magic link, reset password, verify email, security notice
- Chưa được mở trước khi Wave 1 xanh
- Khi mở, mỗi flow phải có subject/body VI-EN, TTL, CTA đúng, Gmail/Outlook check

### Team Payments

- Chốt `pay@iai.one`, `billing@iai.one`
- Kích hoạt receipt, checkout status, renewal/failure notice
- Mỗi flow payment phải có message evidence riêng, không gộp chung

### Team Flow/Ops

- Kích hoạt `alerts@iai.one`, `automation@iai.one`
- Nối workflow cảnh báo, workflow email, inbound support/billing/alert
- Giao bằng chứng queue, retry, rollback, health xanh

## 11. Thông điệp chốt gửi cả 2 team

Thông điệp vận hành ngắn:

> Hệ email `mail.iai.one` chưa được xem là live toàn bộ chỉ vì SMTP runtime đã xanh. Chỉ được close từng flow khi có action thật, `messageId` thật, và DB evidence đủ 3 bảng. Team SMTP giao delivery/inbound/deliverability thật. Codex giao nội dung song ngữ, wiring từng web/app, auto-reply, và migration evidence theo tracker.
