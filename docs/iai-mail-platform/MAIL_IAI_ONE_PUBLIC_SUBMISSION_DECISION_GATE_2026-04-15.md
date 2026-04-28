# MAIL_IAI_ONE_PUBLIC_SUBMISSION_DECISION_GATE_2026-04-15
## Status: DO NOT OPEN YET
## Date: 2026-04-15

## 1) Muc tieu

Tai lieu nay khoa ro:
- public Mailcow submission `587/465` chua duoc dong vao
- moi thay doi lien quan den public submission la 1 decision gate rieng

## 2) Tinh trang hien tai

Da xong:
- internal-first verification
- remote mode verification
- SMTP smoke + `messageId`
- DB evidence du 3 bang

Chua xong:
- migration day du cho app/API
- observation window sau migration tren nhieu flow that
- danh gia deliverability/risk neu thay doi public submission

## 3) Dieu kien toi thieu truoc khi mo gate nay

Tat ca muc sau phai PASS:
- [ ] wave 1 app/API migration xong
- [ ] wave 2 auth-critical migration xong
- [ ] khong co auth bypass, relay issue, timeout loop
- [ ] deliverability/abuse review da du
- [ ] rollback path cho public submission da duoc dien tap
- [ ] nguoi phe duyet infra ky ten mo gate

## 4) Neu mo gate sau nay, can tra loi du 5 cau hoi

1. Co loi ich ro rang nao khi doi public submission khoi Mailcow?
2. App/API da thuc su can public submission hay SMTP noi bo da du?
3. Neu cutover public, ai la owner rollback?
4. Co bang chung deliverability du tot de mo rong scope khong?
5. Co app/client nao se bi anh huong neu thay doi `587/465`?

Neu chua tra loi du 5 cau hoi, gate nay van dong.

## 5) Quyet dinh hien tai

Quyet dinh co hieu luc:
- GIU NGUYEN Mailcow public submission `587/465`
- KHONG doi route public
- KHONG doi DNS chi de phuc vu app auto-send
- tiep tuc dung internal-first cho app/API

## 6) Tin nhan gui infra/ops

```text
Public submission decision gate remains closed.

Do not change Mailcow public submission 587/465.
Do not repoint public SMTP DNS for application migration needs.
Continue with internal-only SMTP for app/API senders until application migration waves and post-migration observation are complete.
Any public submission change must be treated as a separate infra decision with explicit approval and rollback ownership.
```
