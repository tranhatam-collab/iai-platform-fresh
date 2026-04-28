# MAIL_IAI_ONE_REPO_AND_MONOREPO_STRUCTURE_FINAL

IAI Mail Delivery & Automation Layer

Version: 1.0 - Production Lock  
Date: 2026-04-14

## 1. Muc tieu

Tai lieu nay khoa cau truc du an doc lap de team dev build nhanh, ownership ro rang, it conflict, va van giu duoc duong tich hop voi `mail.iai.one` da dang dev.

## 2. Nguyen tac to chuc repo

1. UI, API, SMTP, inbound la cac app rieng.
2. Logic dung chung nam trong `packages`.
3. Provider adapter la package rieng.
4. Schema, event contract, template render, deliverability la package doc lap.
5. Khong de app nao import truc tiep secrets provider.

## 3. Repo de xuat

```text
iai-mail-platform/
  apps/
    mail-web/
    mail-api/
    mail-smtp/
    mail-inbound/
    mail-worker/
  packages/
    mail-core/
    event-schema/
    template-engine/
    deliverability/
    provider-sdk/
    provider-selfhosted/
    provider-smtp/
    provider-ses/
    provider-sendgrid/
    authz/
    observability/
    config/
    ui/
  infra/
    docker/
    kubernetes/
    terraform/
    scripts/
  db/
    migrations/
    seeds/
  docs/
    decisions/
    runbooks/
    api/
  tests/
    integration/
    e2e/
```

## 4. Mapping voi `mail.iai.one` dang co

### Lua chon uu tien
- Neu `mail.iai.one` hien tai da la admin/dashboard hop ly: map vao `apps/mail-web`.
- Neu `mail.iai.one` hien tai chi la mot web app don: giu nguyen, sau do ket noi vao `mail-api` moi.
- Khong doi code runtime phia duoi chi de phuc vu viec migrate UI.

### Quy tac
- Runtime moi la nguon su that.
- UI cu co the dung tam de goi API moi.
- Moi feature moi khong duoc bypass `mail-api`.

## 5. Chuc nang tung app

### `apps/mail-web`
- admin dashboard
- domain setup
- sender management
- template editor
- automation UI
- logs va analytics

### `apps/mail-api`
- REST API v1
- auth
- idempotency
- message orchestration entrypoint
- webhook ingest
- event ingest

### `apps/mail-smtp`
- SMTP submission server
- SMTP auth
- normalize SMTP -> common send request
- policy enforcement

### `apps/mail-inbound`
- inbound receiver
- parse raw mail
- inbound routing
- attachment metadata

### `apps/mail-worker`
- queue consumers
- provider delivery
- retry/backoff
- scheduled automation actions
- cleanup jobs

## 6. Chuc nang tung package

### `packages/mail-core`
- message models
- sender policy
- stream rules
- validation

### `packages/event-schema`
- normalized events
- webhook normalization contracts
- event typing

### `packages/template-engine`
- render subject/html/text
- locale fallback
- variable validation

### `packages/deliverability`
- SPF/DKIM/DMARC policy
- bounce classification
- complaint and unsubscribe logic
- warmup rules

### `packages/provider-sdk`
- common adapter interface
- route selection models
- provider health contracts

### Provider packages
- `provider-selfhosted`
- `provider-smtp`
- `provider-ses`
- `provider-sendgrid`

Tat ca cung implement mot interface chung.

### `packages/authz`
- workspace isolation
- RBAC cho dashboard

### `packages/observability`
- logs
- metrics
- tracing
- health models

### `packages/config`
- env schema
- config loading
- secret references

### `packages/ui`
- shared UI components cho dashboard

## 7. Thu tu build ky thuat

1. `db/migrations`
2. `packages/event-schema`
3. `packages/mail-core`
4. `packages/template-engine`
5. `packages/provider-sdk`
6. provider packages
7. `packages/deliverability`
8. `apps/mail-api`
9. `apps/mail-worker`
10. `apps/mail-smtp`
11. `apps/mail-inbound`
12. `apps/mail-web`

## 8. Moi truong va secret

### Bat buoc
- `.env.example` cho moi app
- secret references qua manager, khong commit secret that
- provider credentials chi load trong worker/api can thiet

### Bien ten goi khuyen nghi
- `MAIL_DB_URL`
- `MAIL_REDIS_URL` hoac queue equivalent
- `MAIL_OBJECT_STORAGE_BUCKET`
- `MAIL_SIGNING_SECRET`
- `MAIL_PROVIDER_DEFAULT`
- `SENDGRID_API_KEY`
- `AWS_SES_REGION`
- `AWS_SES_SMTP_USER`
- `AWS_SES_SMTP_PASS`

## 9. Ownership theo team

- Team A: `apps/mail-api`, `apps/mail-worker`, `packages/mail-core`, provider packages
- Team B: `apps/mail-web`, `packages/ui`
- Team C: `packages/deliverability`, `infra/`, `db/migrations`, runbooks
- Team D: template packs, automation flows, internal integrations, sample clients

## 10. Conventions

- Moi API contract phai co type chung trong `packages/event-schema`
- Khong import ngang giua app; chia se qua package
- Khong hardcode provider-specific fields vao core model
- Test integration dat o `tests/integration`

## 11. Definition of Done

Repo structure nay duoc xem la khoa khi:
- Team biet ro app nao so huu trach nhiem nao
- `mail.iai.one` dang co co duong map ro rang
- Provider adapters co cho rieng
- UI, API, SMTP, inbound va worker khong chen logic vao nhau
