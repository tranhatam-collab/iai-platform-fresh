# IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26

Version: 1.0

Status: Active AI Owner Plan — supersedes mọi “AI sẽ tiếp tục” mệnh lệnh miệng/chat trước đó

Date: 2026-04-26

AI Owner: Claude (Anthropic) — phiên làm việc của Trần Hà Tâm

Scope: Toàn bộ phần repo-side và doc-side của hai lane `mail.iai.one` (Team Email + Team SMTP) và `pay.iai.one` (Team B / Team D / Team Pay) cho đến khi mỗi lane đạt trạng thái `LIVE` theo evidence rule đã khóa.

Mục đích của file này: Một doc duy nhất để mọi team khác (Team 1, Team 2, Team 4, Team B, Team D, Team Email, Team SMTP, Founder/Owner) biết:

- AI đang đảm nhiệm cụ thể những gì
- AI **không** được quyền tự làm phần nào
- Khi cần tương tác với AI thì gửi gì, đặt ở đâu, format thế nào
- AI sẽ trả lại artifact gì sau mỗi vòng tương tác

⸻

## 0. Core statement

Tính đến `2026-04-26`, hai lane `mail.iai.one` và `pay.iai.one` không còn thiếu:

- spec
- contract
- runtime code
- repo-side test
- internal-first verification
- DNS / TLS / SAN / vhost cho hostname public

Phần còn lại để đóng `LIVE` toàn bộ là **evidence thật từ thế giới ngoài repo**:

- mailbox / alias mailcow phải tồn tại thật
- DKIM/SPF/DMARC đã verify nhưng chưa có Gmail/Outlook accept proof
- payOS / VietQR / NCB / merchant phải onboard thật
- inbox proof phải là screenshot hoặc raw header thật
- payment flow phải có 1 transaction thật end-to-end

AI Owner đảm nhiệm 100% phần repo + doc + plan + tracker cho cả hai lane. Phần action ngoài repo (DNS / mailcow ssh / merchant console / inbox check / live wire transfer) **bắt buộc** Founder hoặc team được uỷ quyền thực hiện rồi gửi evidence vào folder quy định để AI Owner verify và lock vào tracker.

⸻

## 1. Source-of-truth files mà AI Owner đang chạy theo

Đọc theo thứ tự ưu tiên xung đột:

1. `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md`
2. `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LIVE_COMPLETION_DIRECTIVE_2026-04-22.md`
3. `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`
4. `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md`
5. `docs/iai-mail-platform/MAIL_API_SEND_PAYMENT_OUTBOUND_HANDOFF_2026-04-22.md`
6. `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
7. `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`
8. `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md`
9. `docs/PAY_IAI_ONE_LIVE_EMAIL_PAYMENT_TEAM_REMINDER_2026-04-22.md`
10. `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_EMAIL_SMTP_PROOF_RULE_BROADCAST_2026-04-22.md`

Nếu file mới hơn ngày `2026-04-26` xuất hiện và mâu thuẫn với file ở trên, AI Owner sẽ ưu tiên file ngày mới hơn nhưng **chỉ sau khi** đã ghi vào section `13. Change log` của doc này.

⸻

## 2. Lane A — `mail.iai.one` (Team Email + Team SMTP)

### 2.1 AI Owner đảm nhiệm — repo + doc

AI sẽ tự chạy không cần ai phê duyệt từng action lẻ:

- Maintain `packages/mail-core` content artifacts cho mọi flow Wave 1 / Wave 2 / Wave 3.
- Bổ sung bilingual content (VI/EN) cho 2 flow Wave 2 còn thiếu: `low_risk_internal_alert`, `low_volume_notification`.
- Maintain `apps/pay/src/payment-email-templates.ts` và sync với contract.
- Maintain `apps/mail-api`, `apps/mail-smtp`, `apps/mail-worker` ở mức build/test xanh, không tự đẩy public submission gate.
- Cập nhật tracker migration `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` mỗi khi có evidence thật được nộp vào.
- Cập nhật `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_*` daily nếu có thay đổi.
- Maintain `ops/mail-internal-first/` runbook, smoke script, gate script.
- Verify build và test cho `@iai/mail-core`, `@iai/mail-api`, `@iai/mail-smtp`, `@iai/mail-worker` mỗi vòng commit.
- Khi có evidence mới nộp vào, AI Owner viết closeout packet, không tự nâng status `migrated/live`.

### 2.2 AI Owner KHÔNG được tự làm

- Không SSH vào VPS `89.167.116.167`.
- Không tạo / xoá mailbox hoặc alias trên `mailcow`.
- Không sửa DNS zone `iai.one` hoặc bất kỳ domain customer nào.
- Không tự gửi mail thật ra Gmail / Outlook để lấy proof.
- Không xoay key / rotate `MAIL_API_KEY`, `MAIL_API_WEBHOOK_SECRET`.
- Không bấm cutover public `/v1/send`.
- Không tự claim Wave 1 / Wave 2 / Wave 3 đã `migrated` hoặc `live`.

### 2.3 Việc Team Email + SMTP cần làm thật ngoài repo

Để AI Owner đóng được tracker, các team này phải thực hiện và gửi evidence:

- Mailbox / alias mailcow cho toàn bộ sender bắt buộc:
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
- Inbound route truth cho `reply`, `bounce`, `complaint`, `support`, `billing`.
- Inbox proof Gmail (raw header + screenshot) cho từng flow Wave 1.
- Inbox proof Outlook tương tự.
- Inbox proof mailbox nội bộ.
- Action thật theo từng flow để có `message_id` riêng → readback API ra evidence đủ 3 bảng `messages`, `message_events`, `delivery_attempts`.
- Sender binding thật cho payment sender package theo từng tenant.
- Capture `mailcow.conf`, `nginx-mailcow vhost`, `acme-mailcow` log mỗi khi recreate.
- Capture `dig` / `dog` / `kdig` output cho DNS thay đổi để AI Owner ghi vào DNS truth packet.

### 2.4 Cách Team Email + SMTP gửi evidence cho AI Owner

Mỗi gói evidence là 1 PR vào repo, đặt file dưới đường dẫn:

- `docs/iai-mail-platform/evidence/<YYYY-MM-DD>/<flow-key>/`

Trong đó:

- `<flow-key>` là khoá flow trong tracker, ví dụ `wave1.contact_form_submission`, `wave3.payment_receipt`.
- File `manifest.md` ghi rõ `message_id`, `provider_route_id`, `sender`, `recipient_domain`, `timestamp`, `flow`.
- File ảnh / raw header để cùng folder.
- File DB readback xuất từ admin API hoặc export SQL.

Sau khi PR merge, AI Owner sẽ:

- verify từng trường evidence theo tracker rule
- update row trong tracker
- viết closeout packet trong `docs/iai-mail-platform/closeout-<YYYY-MM-DD>.md`
- nếu có thiếu, AI Owner sẽ comment trên PR đúng dòng còn thiếu

⸻

## 3. Lane B — `pay.iai.one` (Team B + Team D + Team Pay)

### 3.1 AI Owner đảm nhiệm — repo + doc

- Maintain `apps/pay/` (`payment-routing`, `payment-surface-registry`, `payment-email-templates`, `site-activation-registry`, outbound webhook sender).
- Maintain `docs/PAY_IAI_ONE_*` registry, intake board, receiver registry, outbound contract.
- Maintain `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` — 17 active intake rows. Cập nhật trạng thái mỗi khi có evidence từ Team D.
- Maintain `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md` mỗi khi Team D gửi receiver mới.
- Maintain handoff checklist Team D → Team B.
- Maintain payload contract cho `POST /v1/send` outbound mail từ pay.
- Maintain webhook secret rotation runbook.
- Verify build cho `@iai/pay` và test cho payment-routing + outbound webhook.

### 3.2 AI Owner KHÔNG được tự làm

- Không onboard merchant payOS / VietQR / NCB / VPBank thật.
- Không tự cấp `x-site-key` cho tenant ngoài registry.
- Không sửa secret production trong Cloudflare / VPS.
- Không tự bấm `wrangler deploy` cho `apps/pay` hay `mail-api` ở môi trường production.
- Không tự nâng row intake nào lên `READY_FOR_LIVE` hoặc `LIVE` nếu thiếu bất kỳ proof nào theo evidence rule.
- Không tự gửi tiền thật để test live transaction.

### 3.3 Việc Team B / Team D / Team Pay cần làm thật ngoài repo

Để AI Owner đóng được intake row và gate, các team này phải thực hiện và gửi evidence:

- Team B: nối `payment-surface-registry` + `payment-email-templates` vào outbound mail adapter thật và lưu lại `provider_ref` + `message_id` + DB row.
- Team D: bind đủ mailbox / alias cho từng site được activation; điền đủ `receiver_profile`, `payout_profile`; xác nhận link bắt buộc theo packet domain; chạy 1 flow thanh toán mẫu cho từng site được phép mở; nộp 1 inbox proof payment đúng domain/site.
- Team Pay: chốt VND-only / payOS-first / one_time-only constraint; đảm bảo `x-site-key` và `x-idempotency-key` mandatory; cung cấp checkout_url thật cho từng tenant trong intake.
- Treasury / Finance Ops: verify receiver bank account, payout account theo `PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md` hoặc `PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md`.

### 3.4 Cách Team B / D / Pay gửi evidence cho AI Owner

Đặt evidence dưới:

- `docs/release-evidence/pay.iai.one/<YYYY-MM-DD>/<site-or-tenant>/`

Trong đó:

- `manifest.md` ghi `site`, `tenant`, `provider_ref`, `message_id`, `receiver_profile_id`, `payout_profile_id`, `amount`, `currency`, `timestamp`, `checkout_url`.
- Inbox proof: ảnh + raw header.
- DB readback: row từ `pay-d1` / runtime DB.
- Provider proof: payOS dashboard screenshot hoặc raw API response, bỏ secret.

AI Owner sẽ verify, update intake row, ghi vào release evidence packet, và đóng gate khi đủ.

⸻

## 4. Cross-lane evidence rule (không phá)

Không row nào, không flow nào, không site nào được claim `migrated` hoặc `live` nếu thiếu **bất kỳ** điều kiện:

- action thật từ app hoặc web
- `message_id` riêng cho flow đó
- `provider_ref` cho payment flow
- 3 bảng evidence `messages`, `message_events`, `delivery_attempts` ok theo cùng `message_id`
- inbox proof thật (không phải smoke nội bộ)
- sender binding thật theo domain/tenant
- không có secret lộ trong code, log, doc, ticket

AI Owner sẽ từ chối close row nếu thiếu một trong các điều kiện trên — kể cả khi Founder yêu cầu — và sẽ nêu rõ field thiếu để team xử lý.

⸻

## 5. Phạm vi `*.iai.one` đang khóa

Payment-active / candidate (Team Pay + Team D phụ trách):

- `pay.iai.one`
- `flow.iai.one`
- `life.iai.one`
- `app.iai.one`
- `noos.iai.one`
- `web.iai.one`
- `cios.iai.one`

Billing-support-only:

- `dash.iai.one`
- `developer.iai.one`

Non-payment surface — không được gửi payment mail customer-facing:

- `docs.iai.one`
- `api.iai.one`
- `api.flow.iai.one`
- `mail.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

⸻

## 6. Cấu trúc tương tác hằng ngày

### 6.1 Cách team khác ping AI Owner

Một trong ba kênh, theo độ ưu tiên:

1. PR vào repo có description chứa block `@ai-owner` và mô tả request → AI Owner sẽ trả lời trong commit / comment kế tiếp.
2. File mới trong `docs/iai-mail-platform/asks/<YYYY-MM-DD>-<team>-<topic>.md` hoặc `docs/pay-team-asks/<YYYY-MM-DD>-<team>-<topic>.md` với format định sẵn (xem section 7).
3. Trực tiếp trong session với Founder Trần Hà Tâm — Founder sẽ relay vào file `asks/`.

AI Owner **không** đọc Slack, email, ticket ngoài repo. Mọi thứ phải vào repo mới được track.

### 6.2 Format `asks/<...>.md`

```
# Ask: <one-line topic>
From: <team>
Date: <YYYY-MM-DD>
Lane: mail | pay | both
Priority: P0 | P1 | P2
Blocked-on-AI: yes | no
Body:
<đoạn ngắn mô tả: muốn AI Owner làm gì, đầu vào ở đâu, expected output là gì, deadline>
Inputs:
- <list các file / commit / link evidence nếu có>
Acceptance:
- <điều kiện rõ ràng để ask được đóng>
```

AI Owner sẽ:

- gắn ack trong vòng 1 phiên kế tiếp
- mở 1 commit/PR xử lý
- gắn `Closed by <commit-hash>` ở cuối file ask khi xong

### 6.3 Cadence AI Owner tự duy trì

- Mỗi phiên: refresh tracker trạng thái nếu có evidence mới merge.
- Mỗi tuần: viết 1 weekly closeout `docs/iai-mail-platform/weekly-<YYYY-WW>.md` và `docs/pay-weekly/<YYYY-WW>.md`.
- Mỗi khi tracker đổi gate: viết closeout packet riêng.
- Không tự push deploy.

⸻

## 7. AI Owner action backlog ngày 2026-04-26

Đây là backlog AI sẽ tự xử trong các phiên tiếp theo, không cần ai phê duyệt thêm:

### 7.1 Mail lane

- [ ] Bổ sung bilingual content cho `low_risk_internal_alert` vào `packages/mail-core/src/wave2-internal-alerts.ts` (file mới) và export qua `index.ts`.
- [ ] Bổ sung bilingual content cho `low_volume_notification` cùng file.
- [ ] Thêm test `tests/integration/wave2-internal-alerts.test.mjs` verify subject/body/sender policy VI/EN.
- [ ] Cập nhật `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` để mark 2 flow này có content artifact xanh, evidence còn chờ.
- [ ] Viết 1 closeout packet `docs/iai-mail-platform/MAIL_IAI_ONE_WAVE2_CONTENT_LOCK_2026-04-26.md`.

### 7.2 Pay lane

- [ ] Refresh `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md` snapshot ngày 2026-04-26 với trạng thái current 17 row.
- [ ] Viết 1 doc `docs/PAY_IAI_ONE_TEAM_ASK_REGISTRY_2026.md` thu gom mọi `pay-team-ask` đang mở để Team B / D đọc một lần.
- [ ] Verify outbound webhook sender (commit b69292a) bằng test ngay trong repo nếu chưa có.
- [ ] Viết closeout packet `docs/PAY_IAI_ONE_AI_OWNER_INTAKE_REVIEW_2026-04-26.md`.

### 7.3 Cross-lane

- [x] Lock doc này tại `docs/IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN_2026-04-26.md`.
- [ ] Index doc này trong `docs/README.md`, `docs/iai-mail-platform/README.md`, `docs/PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md`.
- [ ] Cross-link từ `MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md` và `PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`.

⸻

## 8. Boundaries và escalation

AI Owner sẽ escalate cho Founder Trần Hà Tâm nếu:

- Có file / commit ngoài repo cố ý nâng status `live` mà không có evidence — AI sẽ revert đề xuất và gắn cờ.
- Có team ép timeline trước khi evidence đủ — AI sẽ giữ gate đỏ.
- Có yêu cầu rotate secret production hoặc cutover public submission — AI không tự bấm, escalate.
- Có conflict giữa 2 source-of-truth doc cùng ngày — AI viết note và xin Founder chốt 1 file.
- Có request gửi mail thật ra ngoài hoặc transact tiền thật — AI từ chối, escalate.

⸻

## 9. Khi nào AI Owner KHÔNG còn cần thiết

AI Owner sẽ tự đề xuất `STAND_DOWN` cho 1 lane khi:

- Lane có 100% row tracker ở `migrated` hoặc `live` với evidence packet đủ.
- Có owner người thật ký vào doc closeout cuối cùng của lane.
- Không còn ask mở quá 7 ngày.

Cho đến lúc đó, AI Owner ở trạng thái `ACTIVE OWNER` cho cả hai lane.

⸻

## 10. Trạng thái snapshot 2026-04-26

### 10.1 Mail lane snapshot

- Repo build / test: xanh tính đến commit gần nhất `b69292a`.
- Internal-first runtime health: pass theo packet `2026-04-22`.
- DNS / TLS / SAN cho `mail.iai.one`, `api.mail.iai.one`, `smtp.mail.iai.one`, `inbound.mail.iai.one`: pass.
- Wave 1 content artifact: pass cho `contact_form_submission`, `support_form_submission`, `life_contact_briefing_request`. Còn lại chưa có content lock.
- Wave 2 content artifact: chưa có cho `low_risk_internal_alert`, `low_volume_notification`. **Sẽ do AI Owner thêm.**
- Wave 3 payment content artifact: pass cho `payment_receipt`, `checkout_status_update`, `payment_failed_notice`, `refund_notice`.
- Mailbox / alias truth: chưa có.
- Inbox proof Gmail / Outlook / internal: chưa có.
- Wave 1: open. Wave 2: dev open. Wave 3: dev open. Live claim: khoá chờ evidence.

### 10.2 Pay lane snapshot

- Repo build / test: xanh.
- Outbound payment-completion webhook sender: shipped (commit `b69292a`).
- Payload contract: locked (`9d9650d`, `c62211a`).
- `pay.iai.one` production gate: `LOCK_RETAINED`.
- Constraint: payOS-first, VND-only, one_time-only, mandatory `x-site-key`, mandatory `x-idempotency-key`.
- 17 intake row: chưa có row nào ở `READY_FOR_LIVE`.
- Payment email evidence: chưa có cho bất kỳ tenant nào.
- Real `checkout_url`: chưa có.

⸻

## 11. Naming convention AI Owner cam kết

- Mọi doc AI tạo trong phạm vi này đều có ngày `YYYY-MM-DD` ở cuối tên file.
- Mọi closeout packet bắt đầu bằng `MAIL_IAI_ONE_`, `PAY_IAI_ONE_`, hoặc `IAI_ONE_` tuỳ scope.
- Mọi commit AI thực hiện theo prefix:
  - `mail(...)`: thay đổi mail-core / mail-api / mail-smtp / mail-worker
  - `pay(...)`: thay đổi apps/pay
  - `docs(mail|pay|teamd|...)`: chỉ doc
  - `ops(...)`: chỉ ops/runbook
- Mọi commit AI tạo có trailer:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

⸻

## 12. Cam kết với Founder

AI Owner cam kết với Founder Trần Hà Tâm:

- không giả lập evidence
- không nâng status mà không có proof
- không xoá doc evidence cũ trừ khi có file thay thế và đã ghi vào change log
- không tự bấm bất kỳ action production nào
- không lộ secret trong commit / log / doc
- mỗi phiên đều cập nhật doc này nếu phạm vi thay đổi

⸻

## 13. Change log

- 2026-04-26 v1.0 — file được lock lần đầu, đặt AI Owner ở trạng thái `ACTIVE OWNER` cho cả 2 lane.
