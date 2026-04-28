# MAIL_IAI_ONE_EXECUTION_BOARD_TODAY_FINAL

IAI Mail Delivery & Automation Layer

Execution Board - Today  
Version: 1.0 - Production Lock

## 1. Muc tieu trong ngay

Hom nay khong hua "deliverability production mature". Hom nay khoa duoc:
- architecture
- repo structure
- API contract
- database schema
- provider routing
- DNS policy
- execution order

Va neu du manpower:
- scaffold API
- scaffold worker
- tao migration dau tien
- tao route provider mau

## 2. Team split

### Team A - Mail Runtime
Phu trach:
- `apps/mail-api`
- `apps/mail-worker`
- `packages/mail-core`
- provider adapters

Deliverables hom nay:
- `POST /send`
- `POST /send-template`
- webhook ingest skeleton
- event ingest skeleton
- queue contract
- provider SDK interface

### Team B - Mail UI/Admin
Phu trach:
- `apps/mail-web`
- `packages/ui`

Deliverables hom nay:
- dashboard shell
- domains page
- templates page
- messages page
- provider routes page

### Team C - Deliverability/Infra
Phu trach:
- DNS wizard
- DKIM/rDNS checklist
- migrations
- secrets
- queue infra
- health checks

Deliverables hom nay:
- migration order
- env matrix
- DNS checklist
- provider credential onboarding guide

### Team D - Integration/Product
Phu trach:
- template inventory
- automation inventory
- internal app integration list
- event naming convention

Deliverables hom nay:
- first event contracts
- welcome flow
- password reset flow
- invoice flow

## 3. Thu tu thuc hien trong ngay

### Block 1 - 0h den 2h
- chot architecture
- chot repo structure
- chot API va DB schema

### Block 2 - 2h den 5h
- tao migration core
- scaffold API va worker
- scaffold UI navigation
- scaffold provider adapter interface

### Block 3 - 5h den 8h
- implement `send` va `send-template`
- implement domain health skeleton
- implement message status lookup
- implement provider route CRUD skeleton

### Block 4 - 8h den cuoi ngay
- wiring queue
- wiring webhook ingest
- test route provider
- tao smoke flow voi template welcome

## 4. Dependency map

- Team A can DB schema tu Team C
- Team B can API contract tu Team A
- Team D can template engine contract tu Team A
- Team C can provider config shape tu Team A

Neu ket qua can song song:
- khoa spec truoc
- scaffold sau

## 5. Definition of Done trong ngay

### Muc toi thieu
- co du 12 file spec khoa tay
- team nao cung ro ownership
- co route primary/backup logic ro rang
- co stream separation policy ro rang
- co plan tan dung `mail.iai.one` dang co

### Muc nen co
- co migration core tao duoc bang chinh
- co API stub cho `send`
- co dashboard shell doc duoc data fake

## 6. Acceptance checklist

- [ ] Tat ca app moi chi gui qua `api.mail.iai.one/v1`
- [ ] Team da thong nhat ten stream
- [ ] Team da thong nhat domain plan
- [ ] Team da thong nhat provider primary va backup
- [ ] Team da thong nhat migration order
- [ ] Team da thong nhat event naming
- [ ] Team da thong nhat sender policy

## 7. Quyet dinh van hanh ngay dau

- Dung `SendGrid` hoac `SES` lam outbound primary sau lop abstraction
- Khong dua direct-to-MX len production route chinh ngay dau
- Khong de marketing di chung stream voi transactional
- Khong de `mail.iai.one` UI block runtime launch

## 8. Rui ro va cach giam

### Rui ro 1
UI hien tai va runtime moi lech nhau.  
Giam: coi UI la consumer cua API moi, khong coi UI la nguon su that.

### Rui ro 2
Team dev lao vao code truoc khi chot event/schema.  
Giam: schema va API spec khoa truoc.

### Rui ro 3
Direct self-hosted outbound bi spam.  
Giam: day 1 route qua SES/SendGrid sau lop adapter.

## 9. Ket qua can ban giao cuoi ngay

- spec pack da khoa
- task ownership theo team
- route launch recommendation
- danh sach endpoint MVP
- danh sach migration core
- danh sach flow email uu tien
