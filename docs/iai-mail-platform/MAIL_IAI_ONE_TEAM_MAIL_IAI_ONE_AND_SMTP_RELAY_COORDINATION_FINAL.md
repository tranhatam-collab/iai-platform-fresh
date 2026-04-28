# MAIL_IAI_ONE_TEAM_MAIL_IAI_ONE_AND_SMTP_RELAY_COORDINATION_FINAL

IAI Mail Delivery & Automation Layer

mail.iai.one Team va Team SMTP RELAY mail Coordination Plan  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Tai lieu nay khoa cach phoi hop giua:
- team `mail.iai.one`
- Team SMTP RELAY mail

Muc tieu:
- khong de 2 team build trung viec
- khong de `mail.iai.one` block runtime SMTP
- khong de runtime SMTP tu y tao contract khac UI va control plane
- giu duoc mot duong giao nhan ro rang cho sender, credential, health, rollout

## 2. Nguyen tac lam viec chung

1. Runtime moi la nguon su that cho submit, queue, routing va policy.
2. `mail.iai.one` la consumer va control plane, khong la dependency blocking cho SMTP launch.
3. Moi contract giua 2 team phai duoc khoa thanh file hoac type chung.
4. SMTP runtime khong doi API/DB contract mot cach don phuong.
5. UI/Admin khong duoc yeu cau SMTP team them shortcut bypass policy.

## 3. Ownership chia ro

### Team `mail.iai.one`
Chiu trach nhiem:
- dashboard va control plane
- domain setup va sender onboarding UX
- credential lifecycle UX sau nay
- message log, route health, audit views
- onboarding guide cho app noi bo su dung SMTP hoac API

Khong chiu trach nhiem:
- SMTP session handling
- SMTP auth runtime
- queue handoff
- relay anti-abuse enforcement

### Team SMTP RELAY mail
Chiu trach nhiem:
- `apps/mail-smtp`
- SMTP auth, STARTTLS, reject codes
- sender/domain/stream enforcement o runtime
- normalize SMTP -> core send request
- queue handoff vao worker chung
- health, smoke, incident, credential rotation runbook

Khong chiu trach nhiem:
- dashboard UX
- sender/domain wizard UI
- admin permission UI
- product copy cho app `mail.iai.one`

## 4. Contract 2 team phai chot som

### Contract A - Sender va domain state
Team `mail.iai.one` cung cap:
- read model cho `domains`
- read model cho `sender_identities`
- trang thai verify ro rang

Team SMTP RELAY dung:
- `domains`
- `sender_identities`
- sender/domain verify state

Rule:
- runtime doc trang thai da khoa
- UI khong tu dinh nghia them trang thai rieng

### Contract B - SMTP credential lifecycle
Team SMTP RELAY chot:
- schema credential
- auth behavior
- revoke/disable rules
- audit requirements

Team `mail.iai.one` chot:
- trang quan ly credential
- luong tao/revoke/rotate theo contract backend
- UX canh bao va cutover guide

Rule:
- UI khong bao gio doc lai plain secret sau khi tao
- runtime khong cho 1 credential dung chung cho nhieu app neu khong duoc phep ro rang

### Contract C - Route health va operational visibility
Team SMTP RELAY chot:
- health endpoint
- metric/reason names
- reject taxonomy
- signal open relay suspicion

Team `mail.iai.one` chot:
- route health view
- auth failure/reject summary
- launch readiness view

### Contract D - Message trace
Hai team cung dung:
- `messages`
- `message_events`
- `delivery_attempts`

Rule:
- SMTP submit thanh cong phai co `message_id`
- `mail.iai.one` phai doc duoc timeline cua message den tu SMTP nhu message den tu API

## 5. Deliverables theo team

### Team `mail.iai.one` phai giao

#### Wave 1
- doc duoc danh sach domain va sender
- doc duoc message log
- doc duoc route health summary
- co onboarding page cho app noi bo

#### Wave 2
- credential management UI skeleton
- credential revoke/rotate actions theo contract backend
- view auth failure/reject by reason

### Team SMTP RELAY mail phai giao

#### Wave 1
- `apps/mail-smtp` scaffold dung repo structure
- env/config loader
- STARTTLS + AUTH skeleton
- sender/recipient policy seams
- queue handoff seam
- health endpoint
- runbooks

#### Wave 2
- credential backend that
- normalization that
- queue publish that
- integration tests
- onboarding packet cho app legacy

## 6. Working agreement tung ngay

### Daily sync
- 15 phut moi sang
- 1 owner moi team
- cap nhat 3 muc:
  - contract nao da khoa
  - blocker nao dang mo
  - thay doi nao co nguy co vo compatibility

### Blocker SLA
- blocker contract: phan hoi trong 2 gio lam viec
- blocker launch-risk: phan hoi ngay
- blocker UI-only: co the day vao wave sau neu khong chan runtime

### Change control
- thay doi schema/auth/reject code phai thong bao ca 2 team
- thay doi UI text thuong khong can runtime approve
- thay doi sender/credential lifecycle phai co review cheo

## 7. File va artifact 2 team phai tham chieu

Tai lieu nguon su that:
- `MAIL_IAI_ONE_TEAM_SMTP_RELAY_MAIL_EXECUTION_PLAN_FINAL.md`
- `MAIL_IAI_ONE_SMTP_SUBMISSION_SPEC_FINAL.md`
- `MAIL_IAI_ONE_API_SPEC_V1_FINAL.md`
- `MAIL_IAI_ONE_DATABASE_SCHEMA_FINAL.md`
- `MAIL_IAI_ONE_PROVIDER_ABSTRACTION_SPEC_FINAL.md`

Code skeleton SMTP runtime:
- `apps/mail-smtp`
- `packages/config`

Runbooks van hanh:
- `MAIL_IAI_ONE_SMTP_GO_LIVE_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_INCIDENT_RESPONSE_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_CREDENTIAL_ROTATION_RUNBOOK_FINAL.md`
- `MAIL_IAI_ONE_SMTP_SMOKE_TEST_RUNBOOK_FINAL.md`

## 8. Checklist accept phoi hop

- [ ] Team `mail.iai.one` biet ro nhung gi runtime SMTP da va chua support
- [ ] Team SMTP RELAY biet ro man hinh/flow nao `mail.iai.one` can doc du lieu
- [ ] 2 team thong nhat reject reason naming
- [ ] 2 team thong nhat credential lifecycle
- [ ] 2 team thong nhat health/readiness signals
- [ ] 2 team thong nhat message trace va audit path
- [ ] khong co task nao "nam giua 2 team" ma khong co owner ro rang

## 9. Thu tu phoi hop de nhanh nhat

1. Team SMTP RELAY chot runtime seams va env/config.
2. Team `mail.iai.one` map cac seam do vao dashboard/read model.
3. Hai team khoa credential lifecycle contract.
4. Team SMTP RELAY noi backend that.
5. Team `mail.iai.one` bat dau credential UI/readiness UI.
6. Hai team chay chung smoke va cutover rehearsal.

## 10. Quyet dinh chot

- Runtime SMTP duoc di truoc UI neu can.
- `mail.iai.one` khong duoc tao logic rieng cho sender/credential ma lech contract runtime.
- Team SMTP RELAY khong duoc mo them shortcut operational chi de UI de lam nhanh.
- Moi rollout app noi bo qua SMTP submission phai co ca 2 team cung nhin thay bang chung.
