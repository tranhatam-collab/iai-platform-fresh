# MAIL_IAI_ONE_SMTP_CONTINUOUS_DEV_PLAN_FINAL

IAI Mail Delivery & Automation Layer

SMTP Continuous Dev Plan  
Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Tai lieu nay chot cach day `apps/mail-smtp` den muc san sang go-live theo tung phase lien tuc, dong thoi tach ro:
- phan team SMTP RELAY mail co the tu lam tiep
- phan can giao cho team `mail.iai.one`
- phan can backend chung hoac infra chung

## 2. Trang thai hien tai

Da xong:
- execution plan rieng cho Team SMTP RELAY mail
- 4 runbook van hanh
- file phoi hop giua team `mail.iai.one` va Team SMTP RELAY mail
- repo/workspace skeleton
- `apps/mail-smtp` runtime skeleton
- env/config loader
- local stub backend cho auth/policy/queue
- remote backend adapter contract va implementation mode `remote`
- health sidecar `/health` va `/health/dependencies`
- local smoke script cho operator
- local MIME normalization ra common message model
- queue/trace contract co `messageId`, `traceId`, `smtpSessionId`
- shared worker/timeline contract trong `packages/mail-core`
- `apps/mail-worker` skeleton cho route selection, provider adapter stub, va delivery attempt artifacts
- `mail-api` stub cho `GET /messages/{message_id}` va `GET /messages/{message_id}/events`
- `mail-api` stub cho `GET /messages` va `mail-web` messages page read model
- `mail-web` message detail/read-trace model dung chung contract
- `mail-api` stub cho `GET /provider-routes` va `mail-web` provider routes read model
- `mail-api` stub cho `GET /domains/{domain_id}/dns-health` va `mail-web` DNS health read model
- `mail-api` stub cho `GET /suppressions` va `mail-web` suppressions read model
- structured telemetry taxonomy cho runtime SMTP
- automated tests cho config, stub backend, va remote adapter contract

Chua xong:
- credential lookup that tu DB hoac auth service
- sender/domain/suppression read that tu schema chung
- queue transport that vao worker runtime
- read model that tu DB cho message trace API
- integration test voi SMTP client that
- dashboard/credential UI that trong `mail.iai.one`

## 3. Phase dev lien tuc

### Phase 1 - Runtime local hardening
Owner: Team SMTP RELAY mail

Task:
- [x] scaffold runtime
- [x] auth-before-TLS gate
- [x] sender/recipient policy seams
- [x] local stub backend
- [x] health sidecar
- [x] config loader
- [x] test config/stub behavior
- [x] local SMTP smoke script bang `swaks`
- [x] structured log taxonomy dung voi runbooks
- [x] metrics taxonomy cho auth/reject/queue/provider

### Phase 2 - Shared backend wiring
Owner: Team SMTP RELAY mail  
Support: team `mail.iai.one` neu can service/read model

Task:
- [ ] auth adapter doc credential that
- [ ] sender identity adapter doc `sender_identities`
- [ ] domain verify adapter doc `domains`
- [ ] suppression adapter doc `suppressions`
- [ ] audit adapter ghi `audit_logs`
- [ ] queue adapter day vao worker contract
- [ ] route adapter gan `provider_routes`

Deliverable:
- `MAIL_SMTP_BACKEND_MODE=remote` chay duoc that

### Phase 3 - Message normalization
Owner: Team SMTP RELAY mail

Task:
- [x] parse MIME multipart
- [x] parse text/html body
- [x] parse attachment metadata
- [x] parse `From`, `To`, `Cc`, `Bcc`, `Subject`
- [x] parse `X-IAI-Stream`
- [x] map ve common normalized payload
- [x] test invalid header override va invalid sender

Deliverable:
- SMTP va API cung map ve mot message model
- Scoped verification pass:
  - `pnpm --filter @iai/config build && pnpm --filter @iai/mail-smtp build`
  - `node --test tests/integration/mail-smtp-*.test.mjs`

### Phase 4 - Worker handoff va trace
Owner: Team SMTP RELAY mail  
Support: Team Runtime / `mail.iai.one` backend consumers

Task:
- [ ] team `mail.iai.one` boc backend that cho `POST /normalize` va `POST /queue`
- [ ] team `mail.iai.one` persist queue acceptance vao `messages`, `message_events`, `delivery_attempts`
- [x] repo nay co worker runtime skeleton dung shared contract
- [x] repo nay co mail-api read endpoint doc message detail va event timeline tu shared artifact contract
- [x] repo nay co message list endpoint va mail-web messages page dung chung contract
- [x] repo nay co mail-web message detail/read-trace model dung cung contract
- [x] repo nay co provider-routes endpoint va provider routes read model de hien route health
- [ ] repo nay handoff worker that sang backend remote
- [x] repo nay map event timeline SMTP -> message timeline dung contract chung
- [ ] publish `queued` message vao queue transport that
- [x] expose trace id/message id nhat quan
- [ ] xac nhan `mail.iai.one` doc duoc trace

### Phase 5 - Go-live rehearsal
Owner: Team SMTP RELAY mail  
Support: team `mail.iai.one`, Infra

Task:
- [ ] chay smoke test runbook bang runtime that
- [ ] chay anonymous relay reject
- [ ] chay invalid sender reject
- [ ] chay suppressed recipient reject
- [ ] chay credential rotation rehearsal
- [ ] chay incident drill nho

## 4. Viec team SMTP RELAY mail tiep tuc tu lam duoc

- hoan thien `apps/mail-smtp`
- viet test cho config, policy, normalization
- viet log/metrics naming
- viet adapters va interface cho backend wiring
- viet smoke script va local dev guide
- viet reject mapping ro rang

## 5. Viec nen giao cho team `mail.iai.one`

Nhung viec sau can giao cho team `mail.iai.one` hoac team dung control-plane chung:

1. UI/read model:
- message trace view cho mail den tu SMTP
- route health view
- auth failure/reject summary view
- credential management UI

2. Backend/read-side can co cho SMTP runtime dung:
- endpoint hoac service tra credential active/revoked
- endpoint hoac service tra sender/domain verify state
- endpoint hoac service tra suppression state
- endpoint hoac service ghi audit log neu khong cho doc DB truc tiep

3. Onboarding flow:
- huong dan app internal doi secret
- UX cho sender/domain/credential lifecycle
- read model cho launch readiness

## 6. Hand-off contract can chot voi team `mail.iai.one`

- credential read contract
- sender/domain verification read contract
- suppression read contract
- audit write contract
- message trace contract
- route health contract

Neu mot contract chua co:
- Team SMTP RELAY mail giu stub/local adapter
- team `mail.iai.one` nhan task mo contract do

## 7. Tieu chi de danh dau "xong"

`apps/mail-smtp` duoc xem la dat muc handoff production khi:
- auth/TLS/runtime behavior da khoa
- sender/domain/suppression/stream duoc enforce that
- queue handoff that
- message trace that
- tests pass
- smoke/go-live/incident/rotation runbook chay duoc tren runtime that
- team `mail.iai.one` doc duoc health, trace, audit, va credential state

## 8. Quyet dinh thuc thi ngay

- Team SMTP RELAY mail tiep tuc day Phase 2 va Phase 3.
- Team `mail.iai.one` duoc giao som cac contract read/write can cho runtime that.
- Neu contract chung chua san, khong block viec hoan thien logic local va test cua `mail-smtp`.

## 9. Phan chua the hoan tat mot minh va can giao ngay cho team `mail.iai.one`

Phan nay phai giao ngay cho team `mail.iai.one` dung theo remote contract moi:
- implement remote endpoint `auth`
- implement remote endpoint `mail-from`
- implement remote endpoint `recipient`
- implement remote endpoint `normalize`
- implement remote endpoint `queue`
- implement remote endpoint `audit`
- expose `MAIL_API_DEPENDENCIES_HEALTH_URL`
- cap S2S token neu can
- noi read/write that vao `domains`, `sender_identities`, `suppressions`, `audit_logs`, `queue/worker`
- sau do bat `MAIL_SMTP_BACKEND_MODE=remote`

## 10. Gioi han moi truong hien tai

Moi truong nay co mot han che van hanh ro rang:
- khong the boot listener that de mo port local
- sandbox chan `listen()` voi loi `EPERM`

Vi vay trang thai dung hien tai la:
- build/test pass
- contract remote da khoa
- runtime local va runbook da san
- chua the go-live listener that ngay trong moi truong sandbox nay

Buoc tiep theo tren may chay that:
1. team `mail.iai.one` giao xong cac endpoint trong remote contract
2. cap token va health URL neu can
3. bat `MAIL_SMTP_BACKEND_MODE=remote`
4. chay smoke test va go-live runbook tren runtime that
