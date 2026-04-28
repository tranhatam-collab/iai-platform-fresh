# MAIL_IAI_ONE_SMTP_REMOTE_HANDOFF_NOW_FINAL

IAI Mail Delivery & Automation Layer

SMTP Remote Handoff Now  
Version: 1.0 - Production Lock  
Updated: 2026-04-14 17:52 ICT

## 1. Muc tieu

Tai lieu nay khoa danh sach cong viec chinh xac phai giao ngay cho team `mail.iai.one` de dua `mail-smtp` tu contract lock sang remote mode that.

Decision lock ngay luc nay:
- internal-first cutover la bat buoc
- KHONG dung vao public submission `587/465` cua Mailcow o giai doan nay
- `mail-smtp` chi duoc deploy private/internal trong remote mode
- app auto-send phai duoc chuyen sang internal SMTP truoc
- release chi duoc mo sau khi co 1 smoke that tra ve `messageId` va co bang chung DB trong `messages`, `message_events`, `delivery_attempts`

## 2. Viec dung phai giao cho team `mail.iai.one` bay gio

### 0. Thay read model stub bang backend that

Team `mail.iai.one` phai thay cac source stub hien tai bang read model that tu DB cho cac buoc:
- auth principal lookup
- sender/domain policy lookup
- recipient/suppression lookup
- trace/audit readback

Read model that phai doc duoc tu cac nguon chung:
- `domains`
- `sender_identities`
- `suppressions`
- cac bang audit/trace lien quan

### A. Dung 6 endpoint backend

Team `mail.iai.one` phai dung du 6 endpoint sau theo contract da khoa:
- `auth`
- `mail-from`
- `recipient`
- `normalize`
- `queue`
- `audit`

Nguon su that cho contract:
- `MAIL_IAI_ONE_SMTP_REMOTE_BACKEND_ADAPTER_CONTRACT_FINAL.md`

### B. Cap bien moi truong cho runtime

Team `mail.iai.one` phai cap:
- `MAIL_SMTP_REMOTE_BASE_URL`
- `MAIL_SMTP_REMOTE_TOKEN` neu can
- `MAIL_API_DEPENDENCIES_HEALTH_URL`

### C. Bat remote mode

Sau khi 6 endpoint va env da san sang:
- bat `MAIL_SMTP_BACKEND_MODE=remote`

### D. Chay smoke that tren may co quyen mo port

Khong chay smoke cuoi cung trong sandbox nay.

Phai chay tren may local that hoac VPS co quyen mo port:

```bash
pnpm --filter @iai/mail-smtp smoke
```

## 3. Definition of Done cho handoff nay

Handoff duoc xem la xong khi:
- source stub da duoc thay bang DB read model that
- 6 endpoint da live va dung contract
- runtime co du env can thiet
- `MAIL_SMTP_BACKEND_MODE=remote` da bat
- smoke command pass tren may/VPS co quyen `listen()`
- auth, sender, recipient, normalize, queue, audit deu di qua backend that

## 4. Gioi han moi truong hien tai

Moi truong hien tai khong the boot listener that de mo port local vi sandbox chan `listen()` voi loi `EPERM`.

Vi vay, trang thai dung hien tai la:
- build/test pass
- contract da khoa
- remote handoff da ro
- chua xac nhan duoc full smoke listener ngay trong sandbox nay

## 5. Trang thai Phase 3 va buoc tiep theo

Phase 3 da duoc hoan tat trong workspace nay:
- da chuan hoa MIME parsing + normalized message model
- da parse duoc multipart, text/html, attachment metadata, encoded headers, va `X-IAI-Stream`
- da verify bang scoped build/test cho `@iai/config` va `@iai/mail-smtp`

Buoc tiep theo hop ly nhat la:
- Phase 4: worker handoff va trace that

Muc tieu cua Phase 4:
- team `mail.iai.one` thay source stub bang read model that tu DB
- team `mail.iai.one` boc backend that cho `POST /normalize` va `POST /queue`
- team `mail.iai.one` persist vao `messages`, `message_events`, `delivery_attempts` de doc duoc timeline trace
- team `mail.iai.one` noi queue transport that tu SMTP sang worker/backend
- repo nay handoff worker that va map event timeline SMTP theo message timeline chung
- publish `queued` message vao queue that
- xac nhan `mail.iai.one` doc duoc trace that
