# MAIL_IAI_ONE_ALL_WEB_EMAIL_SYNC_AUDIT_2026-04-22

Status: CODE SYNC VERIFIED, PUBLIC HOSTNAME BLOCKER CLOSED, LIVE CLAIM STILL EVIDENCE-LOCKED

Date: 2026-04-22

Owner: Codex

## 1. Mục tiêu rà soát

Rà soát lại toàn bộ lane web/email trong repo trung tâm để xác nhận 4 điểm:

- `mail.iai.one` đã là email provider chuẩn thay cho gate kiểu `RESEND_API_KEY`
- code web không còn lệch với lane `mail-api` và `mail-smtp`
- packet payment email không còn chỉ khóa cho riêng `tranhatam.com`
- báo cáo lane `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md` còn đúng hay đã lệch so với runtime/code hiện hành

## 2. Kết quả chốt

### 2.1 Quyết định provider đã đồng bộ

Trong repo trung tâm, lane email hiện đã đồng bộ theo hướng:

- `mail.iai.one` là provider chuẩn
- `MAIL_API_KEY` là credential chuẩn
- `MAIL_API_BASE_URL = https://api.mail.iai.one/v1` là base URL chuẩn
- `Resend` không còn được xem là gate runtime chuẩn cho app/site nội bộ

Các file directive/handoff đang phản ánh đúng quyết định này:

- `docs/iai-mail-platform/MAIL_IAI_ONE_REPLACES_RESEND_DIRECTIVE_2026-04-22.md`
- `docs/iai-mail-platform/MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22.md`
- `docs/PAY_IAI_ONE_LIVE_EMAIL_PAYMENT_TEAM_REMINDER_2026-04-22.md`
- `docs/iai-mail-platform/README.md`

### 2.2 Đồng bộ code payment email cho toàn bộ `*.iai.one`

Trước lượt rà soát này, `apps/pay/src/payment-surface-registry.ts` đã có snapshot đầy đủ cho các surface `*.iai.one`, nhưng `apps/pay/src/payment-email-templates.ts` mới khóa template thực tế cho đúng một domain là `tranhatam.com`.

Điểm lệch này đã được xử lý.

Hiện tại `apps/pay/src/payment-email-templates.ts` đã hỗ trợ:

- `tranhatam.com` với bộ template riêng đã khóa trước đó
- `flow.iai.one` theo `PACK_A`
- `life.iai.one` theo `PACK_A`
- `app.iai.one` theo `PACK_A`
- `noos.iai.one` theo `PACK_A`
- `web.iai.one` theo `PACK_A`
- `cios.iai.one` theo `PACK_C`
- `dash.iai.one` theo `PACK_B`
- `developer.iai.one` theo `PACK_B`
- `pay.iai.one` theo `PACK_D`

Các surface `NON_PAYMENT_SURFACE` vẫn giữ đúng rule là không được trả packet customer-facing payment email:

- `docs.iai.one`
- `api.iai.one`
- `api.flow.iai.one`
- `mail.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

### 2.3 Kết quả test đã chạy lại

Đã verify lại thành công:

- `node --test tests/integration/flow-mail-api-send.test.mjs tests/integration/flow-smtp-internal-backend.test.mjs`
- `pnpm test:pay`
- `pnpm test:flow`
- `pnpm test:web`
- `pnpm test:dash`

Kết quả:

- `mail-api /v1/send`: pass
- `smtp internal backend`: pass
- `pay surface + payment email templates`: pass `39/39`
- `flow`: pass `23/23`
- `web`: pass `3/3`
- `dash`: pass `11/11`

Lưu ý vận hành:

- lượt `dash` đầu tiên fail trong sandbox chỉ vì `EPERM` lúc ghi vào `apps/dash/dist`
- rerun ngoài sandbox đã pass sạch
- đây là lỗi quyền ghi của môi trường kiểm tra, không phải regression code

## 3. Kiểm tra lại báo cáo lane status

### 3.1 Phần báo cáo vẫn đúng

Rà soát lại cho thấy packet trạng thái hiện hành vẫn đúng ở các ý quan trọng:

- Team SMTP đã có smoke internal-first với `message_id` thật
- evidence 3 bảng `messages`, `message_events`, `delivery_attempts` đã có thật
- lane chung vẫn chưa được phép claim `Wave 1 closed`
- chưa được phép claim Gmail proof, Outlook proof, inbound proof hay mailbox truth chỉ từ smoke nội bộ

### 3.2 DNS/public hostname da mo va public service truth da close o lop TLS/vhost

Đã cập nhật DNS thật trong zone `iai.one` ngày `2026-04-22`:

- `api.mail.iai.one A = 89.167.116.167`
- `smtp.mail.iai.one A = 89.167.116.167`
- `inbound.mail.iai.one A = 89.167.116.167`

Đã kiểm tra lại qua `1.1.1.1` và `8.8.8.8`, cả ba hostname đều resolve đúng về `89.167.116.167`.

Ngay sau do da chot live tren stack that cua may:

- `mailcow + nginx-mailcow + acme-mailcow`

Phan da ap dung that:

- `ADDITIONAL_SAN` da them:
  - `api.mail.iai.one`
  - `smtp.mail.iai.one`
  - `inbound.mail.iai.one`
- da them vhost `api.mail.iai.one` va `inbound.mail.iai.one`
- da recreate `acme-mailcow`
- da restart `nginx-mailcow` va `postfix-mailcow`

Ket qua public service truth:

- `https://api.mail.iai.one/v1/health` tra `200`
- `https://api.mail.iai.one/v1/health/dependencies` tra `200`
- STARTTLS `smtp.mail.iai.one:587` tra cert co SAN dung hostname moi
- cert HTTPS cho `api.mail.iai.one` va `inbound.mail.iai.one` da PASS
- `api.mail.iai.one` hien chi mo public health surface, chua mo full public `/v1/send`

Tuc la blocker `DNS / TLS / vhost / certificate mismatch` da duoc close.

### 3.3 DNS mot minh van khong du, nhung packet nay da di them den muc proof PASS

Theo packet lane status moi:

- `mail.iai.one:587` TLS pass
- `smtp.mail.iai.one:587` STARTTLS hostname proof pass
- `api.mail.iai.one` HTTPS health va cert proof pass
- `inbound.mail.iai.one` cert proof pass

Điều này có nghĩa:

- khong duoc dung DNS-only de claim live
- nhung sau packet nay, phan proof TLS/vhost/certificate da du va da pass
- lane public hostname chi con phu thuoc vao mailbox truth, inbound truth, va inbox proof theo flow

## 4. Chuyen trang thai that sau khi DNS va TLS/vhost da duoc chot

Tính đến cập nhật mới nhất ngày `2026-04-22`:

- `api.mail.iai.one` đã có DNS thật
- `smtp.mail.iai.one` đã có DNS thật
- `inbound.mail.iai.one` đã có DNS thật

Ket luan moi:

- blocker public hostname khong con nam o DNS
- blocker public hostname cung khong con nam o TLS, SAN certificate, hay vhost/reverse-proxy truth
- Team SMTP da close xong phan public hostname lane
- phan con lai cua lane chung la:
  - mailbox / alias truth
  - inbound routing truth
  - Gmail / Outlook / internal inbox proof
  - migration evidence theo tung flow
  - public `/v1/send` cutover neu muon mo hostname canonical cho app

## 5. Kết luận vận hành

### 5.1 Những gì đã mở khóa

- code payment email cho `*.iai.one` đã được đồng bộ với payment surface registry
- lane `mail-api` và `smtp` contract không bị vỡ sau thay đổi
- các web/app chính đã được retest và đang xanh ở lớp code/runtime test
- repo trung tâm hiện không còn chặn bởi tư duy `Resend là provider chuẩn`

### 5.2 Nhung gi van dang khoa live that

- mailbox / alias truth cho toàn bộ sender bắt buộc
- inbound truth cho `reply`, `bounce`, `complaint`, `support`, `billing`
- Gmail proof
- Outlook proof
- inbox proof nội bộ
- action thật theo từng flow để close Wave 1 / Wave 2 / Wave 3

## 6. Việc phải làm ngay sau packet này

1. Team Email + SMTP phải chốt:

- mailbox truth
- inbound truth
- inbox proof Gmail/Outlook/internal

2. Team B / pay lane chỉ được claim payment live outbound khi có đủ:

- action thật
- `provider_ref`
- `message_id`
- DB evidence
- inbox proof

## 6.1 Checklist 5 lenh cuoi cho Team SMTP

File dung de copy-run:

- `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_SMTP_FINAL_5_COMMAND_CHECKLIST_2026-04-22.md`

Script proof dung tren VPS:

- `ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh`

5 lenh cuoi da duoc rerun va PASS trong packet nay:

```bash
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-health
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-dependencies
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh api-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh smtp-cert
TARGET_IP=89.167.116.167 bash ops/mail-internal-first/scripts/team-smtp-public-hostname-proof.sh inbound-cert
```

5 lenh deu PASS, nen blocker public hostname cua Team SMTP da duoc close o lop TLS/vhost/certificate/API-health.

## 7. Chốt ngắn cho team

`Code/web cua lane email trung tam hien da dong bo lai theo mail.iai.one va da retest xanh tren pay, flow, web, dash, mail-api, smtp-internal backend. Public hostname blocker da duoc close tren VPS that. Diem con chan live khong nam o DNS/TLS/vhost nua ma nam o mailbox truth, inbound truth, inbox proof, va migration evidence theo tung flow.`
