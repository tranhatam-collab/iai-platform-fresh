# MAIL_IAI_ONE_PRODUCT_REQUIREMENTS_FINAL

IAI Mail Delivery & Automation Layer

Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Product summary

IAI xay dung mot nen tang mail doc lap de phuc vu toan he sinh thai `*.iai.one`, gom gui mail giao dich, thong bao he thong, marketing, inbound routing, template, automation, suppression, analytics va provider routing.

San pham nay khong nham thay the SendGrid/SES ngay lap tuc o tang ha tang chuyen phat. San pham nham so huu:
- API
- policy
- routing
- automation
- template
- logs
- analytics
- deliverability control

## 2. Van de can giai quyet

Hien trang thong thuong:
- App gui mail truc tiep vao provider
- SMTP relay va DNS setup phan tan
- Khong co stream separation
- Khong co suppression toan cuc
- Khong co event model thong nhat
- Khong co control plane du manh cho team ops

He qua:
- de spam
- kho thay provider
- kho audit
- kho phat trien automation email
- kho scale cho nhieu app va nhieu workspace

## 3. Muc tieu san pham

San pham phai lam duoc 8 nhom viec:
1. Gui email giao dich on dinh cho toan he
2. Nhan email vao va route dung mailbox hoac workflow
3. Tu dong gui email theo trigger tu app, CRM, billing, workflow engine
4. Quan ly template, version, bien noi dung, da ngon ngu
5. Tach stream reputational ro rang
6. Quan ly suppression, bounce, complaint, unsubscribe
7. Co analytics va event explorer
8. Co routing engine de doi outbound backend ma app khong doi code

## 4. Doi tuong su dung

- Backend developers
- Frontend/admin developers
- Infra/deliverability operators
- Product operators
- Internal app teams trong `*.iai.one`

## 5. Functional requirements

### 5.1 Sending
- Gui mail don
- Gui theo template
- Gui bulk co queue
- Idempotency bat buoc
- Attachment policy
- Stream-based routing

### 5.2 Receiving
- Nhan mail inbound
- Parse raw message
- Route vao mailbox hoac webhook
- Store attachment metadata
- Support automation trigger tu inbound

### 5.3 Template and localization
- Template key on dinh
- Versioning an toan
- Multi-locale
- Preview/Test send
- Variable validation

### 5.4 Automation
- Event ingest
- Event-driven actions
- Delay schedule
- Run history
- Pause/Resume
- Idempotent event ingestion

### 5.5 Deliverability
- DNS wizard
- SPF/DKIM/DMARC checks
- rDNS checklist
- bounce/complaint classification
- unsubscribe bat buoc cho marketing
- stream separation

### 5.6 Admin and analytics
- Dashboard tong quan
- Message lookup
- Event timeline
- Queue health
- Provider health
- Suppression center
- Domain health

## 6. Non-functional requirements

- Multi-workspace isolation
- Secure credential storage
- Audit log cho thao tac admin
- Retry/backoff/failover cho outbound
- Horizontal scale cho worker
- API latency nhanh cho thao tac queue
- Khong de UI tro thanh dependency bat buoc cho runtime

## 7. Scope v1

### Trong scope
- Send API
- Template send
- Bulk queue
- Webhook ingest
- Event ingest
- Domain health
- Provider routes
- Suppression
- Bounce/complaint handling co ban
- SMTP submission
- Inbound parse va route co ban

### Ngoai scope ngay dau
- seed inbox monitoring cao cap
- campaign builder phuc tap
- A/B testing
- ISP feedback loops day du cho moi provider
- advanced segmentation
- customer-facing multi-tenant billing

## 8. Thanh cong cua MVP

MVP dat khi:
- Tat ca service trong `*.iai.one` gui mail qua `api.mail.iai.one/v1`
- Domain stream co SPF/DKIM/DMARC hop le
- Team ops xem duoc message, event, bounce, suppression trong dashboard
- Automation trigger co the gui welcome flow co ban
- Provider co the doi tu `SendGrid` sang `SES` ma app phia tren khong doi request format

## 9. Success metrics

### Ky thuat
- 100% app moi gui qua mail API
- 0 duplicate send neu trung idempotency key
- 100% hard bounce va complaint vao suppression
- >99% webhook ingest duoc normalize thanh cong

### Van hanh
- Co dashboard doc duoc domain health
- Co provider failover test qua thanh cong
- Team dev co repo structure va execution board ro rang

## 10. Ranh gioi voi `mail.iai.one` dang dev

Quyet dinh san pham:
- `mail.iai.one` hien tai khong bi dung lai.
- Neu da co UI hoac auth san, co the tai su dung.
- Moi chuc nang runtime va policy phai di qua architecture moi.
- Muc tieu la bo sung mot project doc lap ma van co duong hop nhat voi phan dang phat trien.

## 11. Phase delivery

### Phase 0 - hom nay
- khoa architecture
- khoa repo structure
- khoa API spec
- khoa DB schema
- khoa DNS/deliverability policy
- khoa execution board

### Phase 1 - 24 den 72 gio
- send API
- template engine
- queue/retry
- webhook ingest
- provider adapters
- domain health

### Phase 2 - 7 den 14 ngay
- inbound parser
- automation builder
- suppression center day du
- open/click optional
- analytics nang hon

### Phase 3 - 30 ngay
- multi-tenant productization
- policy engine nang cao
- provider marketplace
- seed tests
- quota va billing

## 12. Definition of Done

PRD nay duoc xem la khoa khi team dev, ops va product cung thong nhat:
- ten du an
- muc tieu
- pham vi
- phase build
- tieu chi dat MVP
- nguyen tac khong gui provider truc tiep
