# MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_2026-04-15
## Status: NEXT LANE AFTER INTERNAL-FIRST VERIFICATION
## Date: 2026-04-15

## 1) Muc tieu

Sau khi lane `internal-first verification` da sach, buoc tiep theo la:
- chuyen cac luong auto-send cua app/API sang SMTP noi bo da verify
- khong dong vao public submission `587/465`
- ghi evidence theo tung luong that cua app

Lane nay la:
- migration lane cho app va API caller

Lane nay KHONG phai:
- public submission cutover
- Mailcow replacement

## 2) Nguon gui duoc phep dung

Trong giai doan nay, app/API chi duoc gui theo 1 trong 2 cach da khoa:
- SMTP noi bo private da verify
- internal mail control path da duoc team chot

Khong duoc:
- tu y noi truc tiep ra public `mail.iai.one:587`
- tu y doi DNS hoac submission path cua Mailcow

## 3) Thu tu migration bat buoc

### Wave 1: low-risk transactional
- support form
- contact form
- alert noi bo
- notification volume thap

### Wave 2: auth / user critical
- magic link login
- reset password
- email verification
- security notice

### Wave 3: payment / membership / workflow
- payment receipt
- checkout status
- renewal / failure notice
- workflow / automation email

Wave progression lock:
- Wave 2 KHONG duoc mo neu bat ky dong Wave 1 nao trong tracker chua `migrated`
- Wave 3 KHONG duoc mo neu bat ky dong Wave 2 nao trong tracker chua `migrated`

## 4) Viec team app/API phai lam

Moi app/API owner phai nop 1 bang thay doi nho gom:
- service ten gi
- route/email flow nao duoc chuyen
- env nao da doi
- runtime sender nao duoc dung
- rollback ve path cu the nao

Moi flow sau khi chuyen phai co:
- 1 action that tu app/API
- 1 `messageId`
- 1 DB evidence trong:
  - `messages`
  - `message_events`
  - `delivery_attempts`

## 5) Checklist tung flow

- [ ] Flow duoc route qua SMTP noi bo
- [ ] Gui that thanh cong
- [ ] Lay duoc `messageId`
- [ ] DB match dung `messageId`
- [ ] Log khong co auth loop / timeout loop
- [ ] Co rollback ro rang ve path cu

## 6) Team Auth gate bo sung (Wave 2 bat buoc)

Ap dung cho 4 flow:
- `magic_link_login`
- `reset_password`
- `email_verification`
- `security_notice`

Moi flow Wave 2 chi duoc danh dau `migrated` khi co du:
- [ ] route qua internal SMTP (khong di local inbox stub)
- [ ] template VI dung noi dung va CTA
- [ ] template EN dung noi dung va CTA
- [ ] subject dung theo flow
- [ ] sender dung theo flow
- [ ] `reply-to` dung theo flow
- [ ] link trong email la link that, click duoc, dung domain runtime
- [ ] link expiry dung policy auth (ghi ro TTL phut)
- [ ] test Gmail that co action + `messageId` + DB evidence 3 bang
- [ ] test Outlook that co action + `messageId` + DB evidence 3 bang
- [ ] cap nhat day du Team Auth matrix trong tracker
- [ ] pass prereq gate script:
  - `node ops/mail-internal-first/scripts/check-team-auth-prereqs.mjs --file ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json`

## 7) Evidence pack toi thieu cho moi flow

- ten flow
- app/service owner
- runtime/env change summary
- action da thuc hien
- `messageId`
- JSON/row snapshot cho `messages`
- JSON/row snapshot cho `message_events`
- JSON/row snapshot cho `delivery_attempts`
- rollback note

Bo sung bat buoc cho Wave 2 Team Auth:
- ket qua check VI (subject/body/link)
- ket qua check EN (subject/body/link)
- `reply-to` check result
- link TTL value + evidence
- Gmail: action, `messageId`, DB 3 bang
- Outlook: action, `messageId`, DB 3 bang

## 8) Done definition

Lane app/API migration duoc xem la done khi:
- cac flow uu tien cao da duoc chuyen sang SMTP noi bo
- moi flow co `messageId` that
- moi flow doi chieu duoc 3 bang DB
- khong co rollback su co trong cua so quan sat da chot

Dieu kien bo sung cho Team Auth:
- Wave 2 chi duoc mo sau khi Wave 1 xanh toan bo trong tracker
- moi flow auth co ket qua Gmail that + Outlook that
- moi ket qua Gmail/Outlook deu doi chieu duoc `messages`, `message_events`, `delivery_attempts`

## 9) Tin nhan gui team app/API

```text
Team App/API,

Internal-first SMTP verification is already clean. The next lane is application migration only.

You may now move auto-send flows to the verified internal SMTP path, but do not touch public Mailcow submission 587/465.

Execution order is locked:
1. low-risk transactional flows
2. auth-critical flows
3. payment / membership / workflow flows

Wave 2 can start only after all Wave 1 rows are fully migrated in tracker.

For Team Auth flows (magic link, reset password, email verification, security notice), each flow must include:
- VI and EN content checks
- real link + reply-to + sender + subject checks
- link TTL verification
- one real Gmail action with messageId + DB evidence (messages/message_events/delivery_attempts)
- one real Outlook action with messageId + DB evidence (messages/message_events/delivery_attempts)

No flow is considered migrated without messageId + DB evidence.
```

## 10) Tracker bat buoc

Team phai cap nhat tracker trung tam tai:
- `MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md`

Khong chap nhan report tu do neu chua dien tracker.
