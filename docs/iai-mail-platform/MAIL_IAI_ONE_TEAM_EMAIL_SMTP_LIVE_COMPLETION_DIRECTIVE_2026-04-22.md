# MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22

Version: 1.0

Status: Active Live Completion Directive

Date: 2026-04-22

Owners: Team Email / Team SMTP / Team B / Team D / Team 1

Scope: Toàn bộ phần việc cần hoàn tất để lane `mail.iai.one` và `smtp.mail.iai.one` được xem là live-ready cho app mail nội bộ và payment email handoff từ `pay.iai.one`

## 0. Core statement

Lane `mail.iai.one` hiện không còn thiếu nền tảng tài liệu hay contract repo-side.

Điểm còn thiếu để được claim `live` không nằm ở việc "viết thêm spec", mà nằm ở:

- chạy đúng flow thật theo từng wave
- chứng minh sender và inbox thật
- chứng minh deliverability thật
- chứng minh DB/runtime evidence thật theo cùng `message_id`
- khóa lại tracker theo trạng thái thực tế thay vì status cảm tính

Nói ngắn gọn:

- repo-side green: có
- internal-first verification: có
- payment outbound contract: có
- toàn bộ live completion cho Team Email + SMTP: chưa xong

## 0.1 Execution update đã chốt trong ngày 2026-04-22

Packet closeout hiện hành:

- `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md`

Những gì đã có evidence thật thêm trong ngày:

- Team SMTP đã rerun `mail-api /health`, `mail-smtp /health`, `mail-smtp /health/dependencies`
- Team SMTP đã chạy smoke internal-first có `message_id = msg_01cc5bfb-12b6-4188-be0f-3e1c92728868`
- Team SMTP đã chụp đủ evidence `messages`, `message_events`, `delivery_attempts` theo cùng `message_id`
- public DNS truth hiện có cho `mail.iai.one`, `MX`, `SPF`, `DKIM`, `DMARC`, `rDNS`, `TLS`

Những gì vẫn chưa được tự nâng trạng thái:

- chưa có mailbox hoặc alias truth cho toàn bộ sender bắt buộc
- chưa có inbox proof Gmail/Outlook hoặc mailbox nội bộ cho từng flow Wave 1
- chưa có action thật để đóng từng row Wave 1
- dev lane đã mở cho Wave 2 và Wave 3, nhưng chưa được claim `migrated/live`
- chưa được claim payment live outbound

Lưu ý bắt buộc:

- public hostname `api.mail.iai.one`, `smtp.mail.iai.one`, `inbound.mail.iai.one` đã có DNS truth ngày `2026-04-22`
- ngày `2026-04-22` da chot tiep tren VPS `89.167.116.167` theo stack that `mailcow + nginx-mailcow + acme-mailcow`
- `ADDITIONAL_SAN` da duoc cap nhat thanh:
  - `api.mail.iai.one`
  - `smtp.mail.iai.one`
  - `inbound.mail.iai.one`
- da them vhost cong khai cho:
  - `api.mail.iai.one`
  - `inbound.mail.iai.one`
- da recreate `acme-mailcow` va restart:
  - `nginx-mailcow`
  - `postfix-mailcow`
- 5 public hostname proof check da PASS:
  - `api-health`
  - `api-dependencies`
  - `api-cert`
  - `smtp-cert`
  - `inbound-cert`
- luu y:
  - public vhost `api.mail.iai.one` hien chi mo an toan cho:
    - `/v1/health`
    - `/v1/health/dependencies`
  - full public `/v1/send` cutover van la lane rieng
- public hostname blocker khong con nam o `DNS / TLS / SAN / vhost`
- phan chua duoc tu nang trang thai van la:
  - mailbox / alias truth
  - inbound route truth
  - inbox proof Gmail / Outlook / internal
  - action that theo tung flow de close migration waves

## 1. Source of truth bắt buộc

Team Email + SMTP phải đọc theo thứ tự này:

1. `MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md`
2. `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`
3. `MAIL_IAI_ONE_SMTP_GO_LIVE_RUNBOOK_FINAL.md`
4. `MAIL_IAI_ONE_TEMP_HEALTH_ENDPOINT_AND_CUTOVER_CHECKLIST_2026-04-15.md`
5. `MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22.md`
6. `PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
7. `PAY_IAI_ONE_LIVE_EMAIL_PAYMENT_TEAM_REMINDER_2026-04-22.md`

Nếu có mâu thuẫn về câu chữ, ưu tiên:

1. tracker migration
2. live runbook / cutover checklist
3. payment outbound handoff contract
4. nhắc việc hoặc báo cáo team-local

## 2. Những gì đã kiểm tra và đã xong tính đến 2026-04-22

### 2.1 Repo-side đã xanh thật

Đã kiểm tra trực tiếp trong workspace:

- `pnpm --filter @iai/mail-core build`
- `pnpm --filter @iai/mail-api build`
- `pnpm --filter @iai/mail-smtp build`
- `pnpm --filter @iai/mail-worker build`
- `node --test tests/integration/flow-mail-api-send.test.mjs tests/integration/flow-smtp-internal-backend.test.mjs tests/integration/mail-worker-runtime.test.mjs tests/integration/mail-smtp-config.test.mjs tests/integration/mail-smtp-stub-backend.test.mjs tests/integration/mail-smtp-worker-contract.test.mjs tests/integration/mail-smtp-remote-backend.test.mjs`

Kết quả hiện tại:

- build pass cho `mail-core`, `mail-api`, `mail-smtp`, `mail-worker`
- test pass `23/23`

### 2.2 Những lớp đã có thật trong repo

- `mail-api` đã có `POST /v1/send` cho payment-style outbound payload
- route này đã kiểm tra:
  - `Authorization: Bearer <MAIL_API_KEY>`
  - `X-Workspace-Id`
  - sender/domain binding
  - suppression
  - idempotency
- readback API đã có:
  - `GET /v1/messages/{message_id}`
  - `GET /v1/messages/{message_id}/events`
- integration test đã chứng minh persist đủ:
  - `messages`
  - `message_events`
  - `delivery_attempts`
- payment sender policy reject đã có test thật cho `SENDER_NOT_ALLOWED`
- remote backend contract cho `auth`, `mail-from`, `recipient`, `normalize`, `queue`, `audit` đã có test
- internal-first verification lane đã được close ở mức:
  - smoke thật trả `messageId`
  - DB evidence đúng cùng `messageId`
  - rollback stop-check pass
  - public submission Mailcow chưa bị cut

## 3. Những gì chưa xong nên chưa được claim live

### 3.1 Chưa xong ở cấp toàn lane

Theo `MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md`, các thiếu hụt vẫn còn mở:

- chưa có bằng chứng toàn bộ flow của từng web đã đi qua internal SMTP
- chưa có bằng chứng Gmail/Outlook deliverability cho từng sender stream chính
- chưa có inbound routing thật cho `reply`, `bounce`, `complaint`, `support`, `billing`
- chưa có tracker tổng hợp được update xanh thật cho tất cả flow

### 3.2 Chưa xong ở migration tracker

Theo `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`:

- toàn bộ Wave 1 vẫn đang `pending`
  - `support_form_submission`
  - `contact_form_submission`
  - `life_contact_briefing_request`
  - `low_risk_internal_alert`
  - `low_volume_notification`
- toàn bộ Wave 2 hiện phai duoc xem la `pending_dev_open`, khong con la provider gate blocker
  - `magic_link_login`
  - `reset_password`
  - `email_verification`
  - `security_notice`
- toàn bộ Wave 3 vẫn `pending`
  - `payment_receipt`
  - `checkout_status_update`
  - `renewal_or_failure_notice`
  - `workflow_automation_email`
  - `checkout_success_handoff_notice`

Lệch trước đây giữa master checklist và migration tracker đã được sửa trong packet này:

- `life_contact_briefing_request` đã được bổ sung vào migration tracker

Tracker hiện đã bao phủ đúng hơn cho toàn bộ flow live đang được theo dõi.

### 3.3 Chưa xong ở payment email live

Theo contract pay hiện tại:

- `pay.iai.one` đã có template registry và runtime read surface
- nhưng chưa có bằng chứng live outbound delivery path đã dùng contract đó để gửi mail thật
- chưa được claim `payment email live` nếu thiếu:
  - `MAIL_API_KEY` thật
  - sender binding thật
  - `message_id` thật
  - DB evidence đủ 3 bảng
  - inbox proof thật

### 3.4 Chưa xong ở site activation cụ thể

Cho `tranhatam.com`, checklist hiện vẫn là `EXTERNAL_STEPS_PENDING` vì còn thiếu:

- mailbox hoặc alias truth cho `pay@`, `billing@`, `support@`, `noreply@`
- runtime SMTP hoặc `MAIL_API` binding cho sender path
- live payment surface nối vào `/api/payment-routing`
- một flow thanh toán thật hoặc sandbox thật
- evidence gồm:
  - provider reference
  - SMTP `messageId`
  - D1/runtime row
  - inbox proof

## 4. Giao việc bắt buộc cho Team Email

Team Email chịu trách nhiệm lớp sender, mailbox, nội dung, inbox và quy tắc sử dụng thực tế.

Phải hoàn tất ngay:

1. Khóa mailbox hoặc alias thật cho toàn bộ sender bắt buộc:
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
2. Khóa inbound route thật cho:
   - reply
   - bounce
   - complaint
   - support
   - billing
3. Xác minh sender policy theo flow:
   - auth chỉ dùng `noreply@iai.one` hoặc `security@iai.one`
   - payment chỉ dùng `pay@iai.one` hoặc `billing@iai.one`
   - system alert chỉ dùng `alerts@iai.one`
   - automation chỉ dùng `automation@iai.one`
4. Hoàn tất bilingual content check cho các flow Wave 1 trước:
   - subject
   - preview text
   - body VI
   - body EN
   - CTA
   - footer
   - reply-to
5. Hoàn tất bilingual content check cho Wave 3 payment:
   - `payment_receipt`
   - `checkout_status_update`
   - `renewal_or_failure_notice`
6. Chạy inbox proof thực cho ít nhất:
   - Gmail
   - Outlook
   - mailbox nội bộ
7. Chỉ dùng sender hệ thống thật trên `iai.one` cho proof live:
   - `pay@iai.one`
   - `contact@iai.one`
   - `support@iai.one`
   - `billing@iai.one`
   - `noreply@iai.one`
8. Không dùng founder/personal mailbox làm sender proof
9. Lưu evidence delivery theo cùng `message_id`, không chụp màn hình rời rạc không đối chiếu được

Team Email chưa được claim xong nếu chưa có đủ:

- sender truth
- inbox truth
- bilingual content thật theo flow
- inbox proof thật
- sender proof thật qua sender hệ thống, không phải founder/personal mailbox

## 5. Giao việc bắt buộc cho Team SMTP

Team SMTP chịu trách nhiệm runtime, deliverability, health, queue, provider route và cutover nội bộ.

Phải hoàn tất ngay:

1. Xác minh runtime private/internal đang chạy đúng lane:
   - không đụng public submission Mailcow `587/465`
   - `mail-smtp` chạy `remote` mode
   - `/health` xanh
   - `/health/dependencies` xanh
2. Xác minh 6 endpoint backend sống đúng contract:
   - `auth`
   - `mail-from`
   - `recipient`
   - `normalize`
   - `queue`
   - `audit`
3. Bỏ mọi read path còn là stub trên live lane nếu chúng đang chặn:
   - auth principal lookup
   - sender/domain policy lookup
   - suppression lookup
   - trace/audit readback
4. Chốt outbound provider thật cho Gmail/Outlook:
   - primary route
   - backup route
   - failover evidence
5. Chốt DNS và deliverability:
   - SPF
   - DKIM
   - DMARC
   - MX
   - rDNS
   - TLS
6. Chạy smoke thật có `messageId` từ sender hệ thống trên `iai.one`, không dùng founder/personal mailbox
7. Chứng minh DB/runtime evidence theo cùng `messageId`:
   - `messages`
   - `message_events`
   - `delivery_attempts`
8. Chụp log/queue proof map đúng về cùng `messageId`
9. Giữ `BCC` toàn hệ ở trạng thái `OFF` cho tới khi system-sender proof thật đã tới cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`
10. Chuẩn bị rollback path và observation window
11. Không để secret thô xuất hiện trong doc, chat, artifact

Team SMTP chưa được claim xong nếu thiếu bất kỳ mục nào sau:

- `messageId` thật
- DB evidence đủ 3 bảng
- log/queue evidence đúng cùng `messageId`
- Gmail/Outlook accept proof
- system-sender proof thật tới cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`
- health/dependencies pass
- rollback readiness

## 6. Giao việc bắt buộc cho Team Email + SMTP cùng nhau

Hai team phải phối hợp và đóng các mục sau như một lane chung:

1. Update migration tracker theo flow thật, không ghi `migrated` nếu chưa có action thật + `message_id`
2. Dev có thể triển khai Wave 1 / Wave 2 / Wave 3 song song từ bây giờ
3. Không dùng founder/personal mailbox làm sender proof ở bất kỳ flow nào
4. Claim `migrated/live` cho Wave 2 chỉ khi Team Auth có:
   - VI content
   - EN content
   - subject
   - sender
   - reply-to
   - link live
   - link TTL
   - Gmail proof
   - Outlook proof
5. Claim `migrated/live` cho Wave 3 payment chỉ khi có đủ:
   - action thanh toán thật hoặc sandbox thật
   - `provider_ref`
   - `message_id`
   - DB/runtime row
   - inbox proof
6. Giữ `BCC` toàn hệ ở trạng thái `OFF` cho tới khi system-sender proof thật qua `mailcow/mail-api` đã có đủ `message_id`, `messages`, `message_events`, `delivery_attempts`, log/queue proof, và inbox proof tại cả `tranhatam66@gmail.com` lẫn `tranhatam@gmail.com`

## 7. Dependencies ngoài lane mà Team Email + SMTP phải chờ nhưng không được mơ hồ

### Team B

Team B phải bỏ trạng thái `read-surface-only` và gọi `POST /v1/send` thật từ pay lane.

Team Email + SMTP cần nhận lại từ Team B:

- payload chuẩn hóa
- `X-Workspace-Id`
- `X-Request-Id`
- `message_idempotency_key`
- `template_id`
- `source_domain`
- `provider_reference`

Nếu Team B chưa gọi thật, Team Email + SMTP chưa thể claim `payment email live`.

### Team D

Team D phải khóa sender package theo site và activation evidence.

Team Email + SMTP cần Team D giao:

- sender package truth
- mailbox/alias truth
- site activation owner
- payment surface owner
- evidence refs theo site

Nếu Team D chưa khóa sender truth cho site, Team Email + SMTP không được tự đoán sender live.

## 8. Việc phải làm ngay hôm nay theo thứ tự nhanh nhất

### Block 1 - xác minh live runtime

1. Team SMTP rerun:
   - `/health`
   - `/health/dependencies`
   - smoke internal-first có `messageId`
2. Team SMTP chụp evidence 3 bảng DB theo cùng `messageId`
3. Team Email xác minh sender + inbox mapping đang dùng thật

### Block 2 - đóng Wave 1

1. `support_form_submission`
2. `contact_form_submission`
3. `low_risk_internal_alert`
4. `low_volume_notification`

Mỗi flow phải có:

- action thật
- `message_id`
- `messages_ok = yes`
- `message_events_ok = yes`
- `delivery_attempts_ok = yes`
- sender phải là sender hệ thống thật trên `iai.one`
- inbox proof

### Block 3 - triển khai Wave 2 ngay, nhưng chỉ claim live khi đủ evidence

1. `magic_link_login`
2. `reset_password`
3. `email_verification`
4. `security_notice`

Mỗi flow phải có thêm:

- VI content ok
- EN content ok
- link live ok
- link TTL ok
- Gmail proof
- Outlook proof

### Block 4 - triển khai Wave 3 payment/workflow ngay, nhưng chỉ claim live khi đủ packet

1. `payment_receipt`
2. `checkout_status_update`
3. `renewal_or_failure_notice`
4. `workflow_automation_email`
5. `checkout_success_handoff_notice`

Riêng 3 flow payment phải gắn với:

- pay lane action thật
- `provider_ref`
- `message_id`
- inbox proof theo domain/site

## 9. Artifact bắt buộc phải nộp sau mỗi flow live

Mỗi flow phải nộp đúng một bundle gồm:

1. `flow_name`
2. `source_app`
3. `sender`
4. `recipient`
5. `message_id`
6. `provider_route`
7. `provider_ref` nếu có
8. snapshot `messages`
9. snapshot `message_events`
10. snapshot `delivery_attempts`
11. log/queue proof map về cùng `message_id`
12. inbox proof
13. nếu fail: `failure_code` và reject reason

## 10. Definition of done cho Team Email + SMTP

Team Email + SMTP chỉ được xem là xong lane live khi:

1. tất cả Wave 1 đã `migrated`
2. nếu mở Wave 2 thì tất cả flow auth đã `migrated` đúng rule Gmail/Outlook
3. nếu mở Wave 3 thì các flow payment/workflow đã có action thật + `message_id` + DB evidence + inbox proof
4. không có sender nào đang live nhưng chưa có mailbox/alias truth
5. không có claim nào chỉ dựa trên build/test mà thiếu evidence live
6. không flow nào dùng founder/personal mailbox làm sender proof
7. `BCC` toàn hệ vẫn `OFF` nếu chưa có system-sender proof thật tới cả `tranhatam66@gmail.com` và `tranhatam@gmail.com`
8. không có secret thô trong evidence

## 11. Câu giao việc ngắn gửi ngay cho team

```text
Team Email + SMTP:

Repo-side cho lane mail hiện đã xanh, nhưng lane live chưa được xem là done.
Việc còn lại không phải viết thêm spec mà là đóng flow thật theo wave và theo evidence.

Ngay bây giờ phải làm theo thứ tự:
1. xác minh runtime /health + /health/dependencies + smoke thật có messageId
2. chụp đủ evidence 3 bảng DB theo cùng messageId
3. khóa sender + mailbox + inbound truth
4. triển khai dev cho Wave 1 / Wave 2 / Wave 3 song song theo mail.iai.one
5. chỉ claim migrated/live cho Wave 2 khi đủ Gmail + Outlook + DB evidence
6. chỉ claim migrated/live cho Wave 3 payment khi Team B gọi /v1/send thật và có provider_ref + message_id + inbox proof

Không flow nào được báo migrated nếu thiếu action thật, message_id, messages, message_events, delivery_attempts.
Không site payment nào được báo live nếu thiếu sender truth, provider_ref, message_id và inbox proof.
Founder/personal mailbox không được dùng làm sender proof; chỉ system sender qua mailcow/mail-api mới hợp lệ.
BCC toàn hệ tiếp tục OFF cho tới khi có system-sender proof thật tới cả tranhatam66@gmail.com và tranhatam@gmail.com.
```
