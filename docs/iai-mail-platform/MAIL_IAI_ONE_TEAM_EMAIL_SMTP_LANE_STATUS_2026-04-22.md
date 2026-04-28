# MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22

Status: PARTIAL CLOSEOUT, DEV LANE OPEN, LIVE CLAIM EVIDENCE-LOCKED

Date: 2026-04-22

Owners: Team Email + SMTP

AI Owner plan (cross-lane, read first cho mọi vòng tương tác từ 2026-04-26 trở đi):
- `../IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`

## 1. Team SMTP đã chốt được gì ngay bây giờ

### 1.1 Runtime health và dependency health

Health đã rerun thành công trên internal-first stack:

- `GET http://127.0.0.1:8787/health` -> `service = api.flow`, `status = ok`
- `GET http://127.0.0.1:9091/health` -> `app = mail-smtp`, `backendMode = remote`, `ok = true`
- `GET http://127.0.0.1:9091/health/dependencies` -> `database = ok`, `queue_transport = ok`, `worker_backend = ok`
- `GET http://127.0.0.1:8787/v1/health/dependencies` -> `mode = remote`, `ok = true`

### 1.2 Smoke internal-first có messageId thật

SMTP smoke đã accept với:

- `message_id = msg_01cc5bfb-12b6-4188-be0f-3e1c92728868`
- `workspace_id = ws_dev`
- `stream = transactional`
- `subject = IAI internal-first SMTP smoke`
- `smtp_session_id = smtp_7a388848-56ee-4deb-aeb1-f8ae1403e839`

Readback API theo đúng `message_id` hiện trả:

- `eventCount = 2`
- `lastEvent.eventType = provider_accepted`
- `deliveryAttempts[0].status = accepted`
- `deliveryAttempts[0].providerRouteId = transactional_primary`
- `deliveryAttempts[0].providerResponseCode = 202`

### 1.3 Evidence đủ 3 bảng theo cùng messageId

Snapshot readback:

- `messages`
  - `id = msg_01cc5bfb-12b6-4188-be0f-3e1c92728868`
  - `status = provider_accepted`
  - `provider_route_id = transactional_primary`
  - `queued_at = 2026-04-22T11:53:06.212Z`
  - `sent_at = 2026-04-22T11:53:06.215Z`
- `message_events`
  - `queued`
  - `provider_accepted`
- `delivery_attempts`
  - `attempt_number = 1`
  - `status = accepted`
  - `provider_route_id = transactional_primary`
  - `provider_type = selfhosted`
  - `provider_response_code = 202`

### 1.4 Route và rollback truth

Route truth đã có trong execution stack:

- primary route đang được consume thật: `transactional_primary`
- backup route đã được chốt trong runtime env: `transactional_backup`
- rollback path giữ theo runbook `ops/mail-internal-first/RUNBOOK_SMOKE_AND_ROLLBACK.md`
- observation window vẫn phải giữ ở mức flow-by-flow, chưa được dùng smoke cục bộ để close Wave

## 2. Public DNS và deliverability truth đã capture

### 2.1 DNS records đã xác minh

Từ DNS-over-HTTPS capture ngày `2026-04-22`:

- `mail.iai.one A = 89.167.116.167`
- `iai.one MX = 10 mail.iai.one`
- `iai.one TXT` có `v=spf1 mx a:mail.iai.one ~all`
- `dkim._domainkey.iai.one TXT` có `v=DKIM1`
- `_dmarc.iai.one TXT = v=DMARC1; p=quarantine; rua=mailto:dmarc@iai.one; fo=1`
- `89.167.116.167 PTR = mail.iai.one`

### 2.2 TLS và reachability

Public network check đang trả:

- `mail.iai.one:25` mở
- `mail.iai.one:587` mở
- STARTTLS trên `mail.iai.one:587` verify `ok`
- SMTPS trên `mail.iai.one:465` verify `ok`
- certificate subject `CN = mail.iai.one`
- issuer `Let's Encrypt R13`
- `Protocol = TLSv1.3`
- `Cipher = AEAD-AES256-GCM-SHA384`

### 2.3 Public hostname truth sau khi da cap nhat DNS va close TLS/vhost

Ngày `2026-04-22`, các record DNS sau đã được thêm vào zone `iai.one`:

- `api.mail.iai.one A = 89.167.116.167`
- `smtp.mail.iai.one A = 89.167.116.167`
- `inbound.mail.iai.one A = 89.167.116.167`

Kiểm tra lại qua `1.1.1.1` và `8.8.8.8` đều trả đúng IP `89.167.116.167`.

Ngay sau do da chot live tren VPS `89.167.116.167` theo stack that:

- `mailcow`
- `nginx-mailcow`
- `acme-mailcow`

Thay doi da ap dung:

- `mailcow.conf` da them `ADDITIONAL_SAN=api.mail.iai.one,smtp.mail.iai.one,inbound.mail.iai.one`
- da them file vhost `data/conf/nginx/iai-public-hostnames.conf`
- da noi `iai-mail-smtp-shadow` vao `mailcowdockerized_mailcow-network`
- da recreate `acme-mailcow`
- da restart `nginx-mailcow` va `postfix-mailcow`

Public proof truth hien tai:

- `api.mail.iai.one` da co public health proof
- `smtp.mail.iai.one` va `inbound.mail.iai.one` hien da co certificate / hostname proof theo hostname moi

- `https://api.mail.iai.one/v1/health` tra `200`
- `https://api.mail.iai.one/v1/health/dependencies` tra `200`
- certificate SAN da cover:
  - `DNS:api.mail.iai.one`
  - `DNS:smtp.mail.iai.one`
  - `DNS:inbound.mail.iai.one`
- STARTTLS tren `smtp.mail.iai.one:587` da PASS theo hostname moi
- `api.mail.iai.one` hien chi expose public health surface, chua mo full public `/v1/send`

Ket luan:

- public hostname blocker da duoc close o lop `DNS / TLS / SAN / vhost`, kem `api` public health proof va `smtp/inbound` certificate-hostname proof
- tu sau packet nay, khong duoc tiep tuc claim blocker public hostname con mo
- khong duoc tu dong claim `api.mail.iai.one` la full public send API da mo chi vi health proof da pass
- blocker con lai cua lane chung chi con:
  - mailbox / alias truth
  - inbound truth
  - inbox proof
  - migration evidence theo tung flow

## 2.4 Runtime sync truth từ `tranhatam.com`

Theo runtime sync packet ngày `2026-04-22` ở repo `WEB-TRANHATAM.COM`:

- `EMAIL_PROVIDER = mail_iai_one`
- `MAIL_API_BASE_URL = https://api.mail.iai.one/v1`
- secret bundle chuẩn đã được chốt là:
  - `MAIL_API_KEY`
  - `MAIL_API_WEBHOOK_SECRET`
- payment sender runtime đang map:
  - `pay@tranhatam.com`
  - `billing@tranhatam.com`
  - `support@tranhatam.com`
- webhook canonical là `/v1/email/webhook/mail-iai-one`
- `/v1/email/webhook/resend` chỉ còn là alias legacy tạm thời
- `wrangler deploy --dry-run --config wrangler.jsonc`
- `wrangler deploy --dry-run --config wrangler.jsonc --env sandbox`

Hai dry-run trên đã build được với `mail.iai.one` config.
Điều này có nghĩa dev lane cho payment email runtime đã mở, dù live secret bundle va live action proof van chua du.

## 3. Team Email repo-side truth đã có và chưa có

### 3.1 Những artifact nội dung đã tìm thấy

Wave 1 hiện có artifact song ngữ trong repo cho:

- `contact_form_submission`
- `support_form_submission`
- `life_contact_briefing_request`

Nguồn hiện hành:

- `packages/mail-core/src/wave1-intake.ts`

Các artifact này đã có:

- subject VI/EN
- body VI/EN
- reply-to behavior
- sender mailbox mapping theo payload config

Payment wave hiện có artifact song ngữ khóa trong repo cho:

- `payment_receipt`
- `checkout_status_update`
- `payment_failed_notice`
- `refund_notice`

Nguồn hiện hành:

- `apps/pay/src/payment-email-templates.ts`

Các artifact payment đã có:

- subject VI/EN
- preview text VI/EN
- text body VI/EN
- footer song ngữ
- sender policy
- `replyTo`

### 3.2 Những phần Team Email vẫn chưa có evidence để close

Chưa có evidence vận hành thật cho:

- mailbox hoặc alias truth của toàn bộ sender bắt buộc:
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
- inbound route truth cho `reply`, `bounce`, `complaint`, `support`, `billing`
- inbox proof thật trên Gmail
- inbox proof thật trên Outlook
- inbox proof thật trên mailbox nội bộ

Ngoài ra chưa tìm thấy artifact nội dung repo-side rõ ràng cho:

- `low_risk_internal_alert`
- `low_volume_notification`

Nên hai flow này vẫn chưa được xem là đã qua bilingual content review.

## 4. Trạng thái wave sau quyết định dev-open

### 4.1 Wave 1

Wave 1 chưa được close.

Không row nào được tự nâng sang `migrated` chỉ từ smoke SMTP, vì tracker yêu cầu từng flow phải có:

- action thật từ app hoặc web
- `message_id` riêng của flow đó
- `messages_ok = yes`
- `message_events_ok = yes`
- `delivery_attempts_ok = yes`
- inbox proof

### 4.2 Wave 2

Wave 2 da mo cho dev va wiring.

Nhung chua duoc claim `migrated/live` vi:

- Wave 1 chua xanh that o muc evidence
- chua co Gmail proof
- chua co Outlook proof
- chua co link live va TTL evidence theo tung flow auth

### 4.3 Wave 3 payment

Payment repo-side da xanh o lop contract va dev lane da mo, nhung Wave 3 chua duoc close vi:

- Team B chưa gửi action thật từ pay lane qua `POST /v1/send`
- chưa có `provider_ref`
- chưa có inbox proof payment theo domain hoặc site
- chưa có sender binding thật cho payment sender package

## 5. Kết luận cho các team đang chờ

### Team SMTP

Được phép báo:

- runtime internal-first pass
- health pass
- dependency health pass
- smoke có `message_id` thật
- DB evidence đủ `messages`, `message_events`, `delivery_attempts`
- public DNS/TLS cho `mail.iai.one` đã có truth

Chưa được phép báo:

- Gmail hoặc Outlook accept proof
- full public hostname readiness cho `api.mail.iai.one` hoặc `smtp.mail.iai.one`
- Wave 1 closed

### Team Email

Được phép báo:

- content artifact repo-side đã có cho một phần Wave 1
- payment content pack song ngữ đã khóa trong repo cho lane `tranhatam.com`

Chưa được phép báo:

- sender mailbox truth đã khóa đủ
- inbound truth đã khóa đủ
- Wave 1 bilingual content review hoàn tất cho toàn bộ flow
- inbox proof thật

### Team Email + SMTP

Kết luận lane chung:

- không flow nào được gắn `migrated` chỉ dựa trên build hoặc smoke cục bộ
- Wave 1 phải đóng bằng action thật trước
- Wave 2 dev đã mở, nhưng claim live vẫn khóa bởi evidence
- Wave 3 payment dev đã mở, nhưng chưa được claim live outbound
