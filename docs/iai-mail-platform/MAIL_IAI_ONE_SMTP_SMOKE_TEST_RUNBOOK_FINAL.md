# MAIL_IAI_ONE_SMTP_SMOKE_TEST_RUNBOOK_FINAL

IAI Mail Delivery & Automation Layer

SMTP Smoke Test Runbook  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Runbook nay dung cho:
- truoc go-live
- sau deploy
- sau thay doi credential/policy
- sau incident

Muc tieu la xac nhan nhanh rang SMTP submission van an toan va gui duoc.

Decision lock:
- smoke trong giai doan nay phai di vao `mail-smtp` private/internal o remote mode
- khong duoc dung smoke nay de cat public submission `587/465` cua Mailcow
- PASS chi duoc cong nhan khi co `messageId` va co bang chung DB trong `messages`, `message_events`, `delivery_attempts`

## 2. Test prerequisites

Can co:
- 1 credential hop le
- 1 sender hop le
- 1 recipient test thanh cong
- 1 recipient dang suppress hoac invalid de test reject
- access log/runtime de doi chieu message ID
- quyen xem bang chung DB cho `messages`, `message_events`, `delivery_attempts`

## 3. Test matrix toi thieu

### Test 1 - TLS handshake

```bash
openssl s_client -starttls smtp -connect smtp.mail.iai.one:587 -servername smtp.mail.iai.one
```

PASS:
- ket noi thanh cong
- cert hop le
- khong co dau hieu fail TLS

### Test 2 - Auth happy path

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from no-reply@tx.iai.one --to you@example.com \
  --header 'Subject: SMTP smoke happy path' \
  --body 'smtp smoke test'
```

PASS:
- auth success
- server tra `250`
- co `message_id`
- log/DB co event `queued`
- co DB evidence cho `messages`, `message_events`, `delivery_attempts`

### Test 3 - Anonymous relay reject

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --from evil@example.com --to you@example.com \
  --header 'Subject: anonymous relay probe' --body 'must fail'
```

PASS:
- reject
- khong co message moi duoc tao

### Test 4 - Invalid sender reject

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from fake@not-verified.com --to you@example.com \
  --header 'Subject: invalid sender probe' --body 'must fail'
```

PASS:
- reject vi sender/domain policy

### Test 5 - Suppressed recipient reject

```bash
swaks --server smtp.mail.iai.one --port 587 --tls \
  --auth LOGIN --auth-user <SMTP_USER> --auth-password '<SMTP_PASS>' \
  --from no-reply@tx.iai.one --to blocked@example.com \
  --header 'Subject: suppressed recipient probe' --body 'must fail'
```

PASS:
- reject hoac suppress dung policy
- co ly do ro trong log

## 4. Test route verification

Sau happy path, verify them:
- route nao duoc chon
- event co `provider_selected`
- worker tao `delivery_attempt`
- provider accepted hoac delivered theo luong chuan

## 5. Test bang chung can luu

- TLS command output
- swaks output happy path
- swaks output reject path
- `message_id` test thanh cong
- DB row snapshot cho `messages`
- DB row snapshot cho `message_events`
- DB row snapshot cho `delivery_attempts`
- event timeline cua test thanh cong
- provider route duoc chon

## 6. Tieu chi PASS tong

Smoke test PASS khi:
- TLS tot
- auth happy path pass
- anonymous relay bi chan
- invalid sender bi chan
- suppressed recipient bi chan
- happy path tao message va event dung
- happy path doi chieu duoc `messageId` vao ca 3 bang DB

## 7. Tieu chi FAIL tong

FAIL neu co mot trong cac dau hieu sau:
- anonymous relay pass
- auth truoc TLS pass
- happy path khong tao duoc message
- reject path tao queue sai
- route/event khong duoc ghi nhan

## 8. Tan suat chay

Bat buoc chay:
- truoc go-live
- sau moi deploy SMTP runtime
- sau moi thay doi route/provider config lon
- sau moi incident SEV-1/SEV-2
- dinh ky hang ngay trong giai doan launch ban dau

## 9. Definition of Done

Smoke test duoc xem la hoan tat khi:
- co ket qua PASS/FAIL ro rang
- co evidence luu lai
- neu FAIL da mo incident hoac block go-live dung quy trinh
