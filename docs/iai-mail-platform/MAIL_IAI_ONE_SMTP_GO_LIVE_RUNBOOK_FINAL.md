# MAIL_IAI_ONE_SMTP_GO_LIVE_RUNBOOK_FINAL

IAI Mail Delivery & Automation Layer

SMTP Go-Live Runbook  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Runbook nay dung cho ngay dua `smtp.mail.iai.one` vao hoat dong that cho app noi bo.

Muc tieu:
- launch SMTP submission an toan
- khong tao open relay
- khong bypass sender/suppression/provider routing
- co duong rollback ro rang neu phat sinh su co
- internal-first cutover: giu Mailcow public submission nhu hien tai, chi deploy `mail-smtp` private/internal truoc

## 2. Owner va vai tro

- Launch owner: Lead SMTP Runtime
- Runtime executor: Engineer A va Engineer B
- Relay verification: Engineer C
- QA va evidence log: Engineer D
- Infra approver: Team Deliverability/Infra lead

Khong go-live neu thieu launch owner hoac infra approver.

## 3. Tieu chi gate truoc go-live

Tat ca muc sau phai PASS:
- [ ] Mailcow public submission `587/465` van GIU NGUYEN
- [ ] `smtp.mail.iai.one` resolve dung DNS
- [ ] TLS certificate hop le tren `587` STARTTLS
- [ ] SMTP auth chi hoat dong sau TLS
- [ ] khong relay anonymous
- [ ] sender identity test da pass
- [ ] domain verify state doc duoc tu runtime chung
- [ ] suppression check da pass
- [ ] queue handoff da pass
- [ ] provider route primary da pass
- [ ] provider route backup da pass
- [ ] healthcheck co ket qua xanh
- [ ] incident contact da san sang
- [ ] co smoke that tra ve `messageId`
- [ ] co bang chung DB trong `messages`, `message_events`, `delivery_attempts`

## 4. Moi truong va thong so can khoa

- SMTP host: `smtp.mail.iai.one`
- Submission port chinh: `587`
- Optional compatibility port: `465`
- Public cutover: CHUA duoc lam o giai doan nay
- Primary relay/backend: `SendGrid` hoac `SES`
- Backup relay/backend: route du phong da duoc test truoc
- Submission mode: authenticated only
- TLS mode: STARTTLS required

## 5. Preflight checklist ky thuat

### DNS va certificate
- [ ] A/AAAA record tro dung host runtime
- [ ] TLS cert dung cho `smtp.mail.iai.one`
- [ ] cert chua het han
- [ ] chain hop le

### Runtime va queue
- [ ] `mail-smtp` dang deploy private/internal, khong thay the Mailcow public submission
- [ ] `apps/mail-smtp` dang chay dung build version
- [ ] queue writable
- [ ] `mail-worker` dang chay
- [ ] DB writable cho `messages`, `message_events`, `delivery_attempts`

### Policy
- [ ] sender test thuoc domain da verify
- [ ] stream mapping dung
- [ ] hard bounce test recipient bi chan dung
- [ ] size limit dang bat
- [ ] recipient limit dang bat

### Relay
- [ ] route primary healthy
- [ ] route backup healthy
- [ ] failover test da luu bang chung

## 6. Smoke commands truoc cutover

### TLS handshake

```bash
openssl s_client -starttls smtp -connect smtp.mail.iai.one:587 -servername smtp.mail.iai.one
```

PASS khi:
- ket noi thanh cong
- cert hop le
- server support SMTP after STARTTLS

### SMTP auth + send happy path

Preferred tool:

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from no-reply@tx.iai.one --to you@example.com \
  --header 'Subject: SMTP Go Live Test' \
  --body 'SMTP submission test from IAI'
```

PASS khi:
- auth thanh cong
- server tra `250`
- message xuat hien trong logs va DB
- message co event `queued`
- worker gui ra route primary thanh cong

### Anonymous relay rejection

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --from evil@example.com --to you@example.com \
  --header 'Subject: Anonymous relay test' --body 'must fail'
```

PASS khi:
- server tu choi
- khong tao message trong queue

### Invalid sender rejection

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from fake@unknown-domain.com --to you@example.com \
  --header 'Subject: Invalid sender test' --body 'must fail'
```

PASS khi:
- server reject voi ly do sender/domain khong hop le

## 7. Trinh tu go-live

### Step 1 - Freeze thay doi
- dong bang thay doi config SMTP, route va sender trong 30 phut launch window
- chot commit/build version dang chay

### Step 2 - Deploy runtime
- deploy `apps/mail-smtp` private/internal o remote mode
- verify process, health va logs
- verify queue connectivity
- khong doi public submission Mailcow

### Step 3 - Chay smoke tests
- TLS test
- auth happy path
- anonymous relay reject
- invalid sender reject
- suppressed recipient reject
- xac nhan smoke happy path tra ve `messageId`
- xac nhan DB co bang chung trong `messages`, `message_events`, `delivery_attempts`

Chi tiep tuc neu tat ca PASS.

### Step 4 - Mo wave 1
- onboard 1-2 app noi bo volume thap
- chi transactional
- theo doi 30-60 phut

### Step 5 - Mo wave 2
- them OTP/reset/login/system mail
- tiep tuc theo doi auth failure, reject rate, queue depth, provider latency

### Step 6 - Ban giao van hanh
- luu evidence launch
- cap nhat dashboard/tracker
- thong bao trang thai cho cac team lien quan

## 8. Evidence bat buoc phai luu

- ket qua TLS handshake
- ket qua swaks happy path
- ket qua anonymous relay reject
- ket qua invalid sender reject
- message ID cua test thanh cong
- DB row snapshot cho `messages`
- DB row snapshot cho `message_events`
- DB row snapshot cho `delivery_attempts`
- event timeline cua test thanh cong
- provider route duoc chon
- thoi diem launch
- build/version dang chay

## 9. Tieu chi PASS de duoc mo wave tiep

- auth failure rate khong tang dot bien
- queue accept on dinh
- provider primary on dinh
- khong co dau hieu open relay
- message test delivered hoac provider accepted dung quy trinh
- `messageId` doi chieu duoc toi ca 3 bang DB
- reject reasons hien ro, khong fail mo ho

## 10. Dieu kien rollback ngay

Rollback ngay neu co mot trong cac dau hieu sau:
- anonymous relay thanh cong
- auth co the bypass TLS
- queue fail lien tuc
- provider route gui sai stream
- sender/domain validation bi bypass
- tang dot bien reject khong giai thich duoc o app hop le

## 11. Cach rollback

1. dung nhan traffic moi vao `smtp.mail.iai.one`
2. disable credential vua onboard neu can
3. tra app ve route cu da chot san
4. giu queue va worker tiep tuc xu ly message da accept
5. khoa launch window
6. mo incident ticket va chuyen sang incident runbook

## 12. Post-launch monitoring 2 gio dau

Theo doi lien tuc:
- auth success/failure
- reject by reason
- queue depth
- submit latency
- provider timeout
- delivered/bounced/deferred trend
- CPU/RAM/connections cua SMTP runtime

## 13. Definition of Done

Go-live duoc xem la xong khi:
- wave 1 da chay on dinh
- khong co open relay
- happy path va reject path deu pass
- co evidence day du
- co cutover va rollback duoc ghi nhan ro rang
