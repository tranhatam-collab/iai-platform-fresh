# IAI_ENV_BINDINGS_AND_SECRETS_SOURCE_OF_TRUTH_2026
## Canonical environment, bindings, and secrets source of truth for `*.iai.one`
## Nguồn sự thật chuẩn cho environment, bindings và secrets của `*.iai.one`
## Version 2.1
## Status: LOCKED FOR TEAM 1 / TEAM 2 / OPS / RELEASE
## Scope: core `*.iai.one` deploy environments
## Date: 2026-04-18

---

## 1. Mục tiêu

File này tồn tại để khóa:
- `domain -> project / worker -> environment mapping`
- `binding groups`
- `secret groups`
- preview / production mapping
- GitHub Actions environment mapping
- release blocker nếu environment truth không khớp

Đây là file để tránh:
- bind sai `D1 / KV / R2 / Queue / DO`
- dùng nhầm preview hoặc production
- route đúng code nhưng sai hạ tầng
- owner team deploy vào sai account hoặc sai project

Raw secret values không được lưu trong repo.
File này chỉ lưu:
- aliases
- groups
- ownership
- required status
- release rules

---

## 2. Related source-of-truth files

- `docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
- `docs/IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md`
- `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md`
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

Nếu file này mâu thuẫn với release tooling hoặc ops vault:
- release auto-block

---

## 3. Hard rules

- Không dùng preview binding cho production deploy.
- Không dùng production secret trong local nếu chưa có ops approval rõ ràng.
- Không được map production domain sang preview `GHA environment`.
- Không domain nào được release nếu packet không ghi rõ `target environment + binding groups + secret groups`.
- Binding alias trong file này là `environment truth`; alias không khớp release tooling = hard stop.
- File này là source of truth cho Team 1 gate review về `environment / bindings / secrets`.

---

## 4. Canonical environment model

### 4.1 Environment classes

- `local`
- `preview`
- `production`

### 4.2 Environment intent

- `local`
  - dùng cho dev, mock, smoke, contract checks
  - không được chạm production secrets theo mặc định
- `preview`
  - dùng cho review-ready packet, QA, stakeholder preview
  - không được trỏ vào production data plane
- `production`
  - dùng cho release đã qua Team 1 gate
  - mọi mismatch về binding, secret, account = hard stop

---

## 5. Account alias model

- `cf_acc_platform_primary`
- `cf_acc_product_core`
- `cf_acc_growth_primary`

Raw numeric account ID chỉ tồn tại trong secured ops vault và release tooling.

---

## 6. Binding alias registry

### 6.1 D1 aliases

- `D1_RUNTIME_PRIMARY`
- `D1_COMMERCE_PRIMARY`
- `D1_ANALYTICS_PRIMARY`

### 6.2 KV aliases

- `KV_EDGE_CONFIG`
- `KV_PUBLIC_CACHE`

### 6.3 R2 aliases

- `R2_PUBLIC_ASSETS`
- `R2_PROTECTED_ASSETS`
- `R2_ARTIFACTS`

### 6.4 Durable Objects / Queue / Workflow aliases

- `DO_RUNTIME_COORDINATOR`
- `DO_COLLAB_LOCKS`
- `QUEUE_RUNTIME_DISPATCH`
- `QUEUE_EVENTS_INGEST`
- `WORKFLOW_ENGINE`

### 6.5 Secret group aliases

- `SECRETS_PLATFORM_PUBLIC`
- `SECRETS_RUNTIME_CORE`
- `SECRETS_COMMERCE_CORE`
- `SECRETS_GROWTH_PUBLIC`
- `SECRETS_MAIL_RUNTIME`
- `SECRETS_AI_RUNTIME`
- `SECRETS_PARTNER_SYNC`
- `SECRETS_PAYMENT_CORE`

### 6.6 GitHub Actions environment aliases

- `GHA_PLATFORM_PREVIEW`
- `GHA_PLATFORM_PROD`
- `GHA_PRODUCT_PREVIEW`
- `GHA_PRODUCT_PROD`
- `GHA_GROWTH_PREVIEW`
- `GHA_GROWTH_PROD`

---

## 7. Domain environment mapping

| Domain | Project / Worker | Account alias | Runtime class | Required bindings | Required secrets | Preview mapping | Production mapping | Current release class | Owner |
|---|---|---|---|---|---|---|---|---|---|
| `iai.one` | `apps/root (Pages: iai-root)` | `cf_acc_platform_primary` | static portal | `KV_EDGE_CONFIG` optional | `SECRETS_PLATFORM_PUBLIC` minimal | `GHA_PLATFORM_PREVIEW` | `GHA_PLATFORM_PROD` | public | Team A |
| `home.iai.one` | `apps/home (Pages: iai-home)` | `cf_acc_platform_primary` | static portal | `KV_EDGE_CONFIG` optional | `SECRETS_PLATFORM_PUBLIC` minimal | `GHA_PLATFORM_PREVIEW` | `GHA_PLATFORM_PROD` | public | Team A |
| `docs.iai.one` | `Pages: iai-docs` | `cf_acc_platform_primary` | static docs | `KV_EDGE_CONFIG` optional | `SECRETS_PLATFORM_PUBLIC` minimal | `GHA_PLATFORM_PREVIEW` | `GHA_PLATFORM_PROD` | public | Team A |
| `developer.iai.one` | `Pages: iai-developer` | `cf_acc_platform_primary` | static docs / portal | `KV_EDGE_CONFIG` optional | `SECRETS_PLATFORM_PUBLIC` minimal | `GHA_PLATFORM_PREVIEW` | `GHA_PLATFORM_PROD` | blocked until packet | Team A |
| `app.iai.one` | `Worker/Pages: iai-app` | `cf_acc_product_core` | auth-gated app | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `R2_PUBLIC_ASSETS` | `SECRETS_RUNTIME_CORE` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | product | Team B |
| `flow.iai.one` | `Pages: iai-flow` | `cf_acc_product_core` | product surface | `KV_EDGE_CONFIG` | `SECRETS_PLATFORM_PUBLIC`, `SECRETS_AI_RUNTIME` nếu có public model-backed feature | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | public / product | Team B |
| `dash.iai.one` | `Pages/Worker: iai-dash` | `cf_acc_product_core` | runtime app | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `R2_ARTIFACTS`, `DO_RUNTIME_COORDINATOR`, `DO_COLLAB_LOCKS`, `QUEUE_RUNTIME_DISPATCH`, `WORKFLOW_ENGINE` | `SECRETS_RUNTIME_CORE`, `SECRETS_AI_RUNTIME` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | accepted-go / monitor-only | Team B |
| `api.iai.one` | `Worker: iai-api` | `cf_acc_product_core` | browser-facing authority | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `QUEUE_EVENTS_INGEST` | `SECRETS_RUNTIME_CORE` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | internal/runtime | Team B |
| `api.flow.iai.one` | `Worker route group: flow-api` | `cf_acc_product_core` | runtime authority | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `R2_ARTIFACTS`, `DO_RUNTIME_COORDINATOR`, `QUEUE_RUNTIME_DISPATCH`, `QUEUE_EVENTS_INGEST`, `WORKFLOW_ENGINE` | `SECRETS_RUNTIME_CORE`, `SECRETS_AI_RUNTIME`, `SECRETS_COMMERCE_CORE` nếu runtime dùng billing | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | internal/runtime | Team B |
| `web.iai.one` | `Pages: iai-web` | `cf_acc_growth_primary` | growth product | `KV_EDGE_CONFIG` trực tiếp, backend authority qua API | `SECRETS_GROWTH_PUBLIC` | `GHA_GROWTH_PREVIEW` | `GHA_GROWTH_PROD` | preview reopen / monitor-only | Team C |
| `cios.iai.one` | `Pages/Worker: iai-cios` | `cf_acc_growth_primary` | B2B product | `D1_ANALYTICS_PRIMARY` nếu có direct runtime, `KV_EDGE_CONFIG` | `SECRETS_GROWTH_PUBLIC`, `SECRETS_RUNTIME_CORE` nếu shared auth/billing áp dụng | `GHA_GROWTH_PREVIEW` | `GHA_GROWTH_PROD` | blocked until packet | Team C |
| `noos.iai.one` | `Pages: noos-iai-one` | `cf_acc_growth_primary` | commerce/content surface | `D1_COMMERCE_PRIMARY`, `KV_EDGE_CONFIG`, `R2_PROTECTED_ASSETS`, `R2_PUBLIC_ASSETS` | `SECRETS_COMMERCE_CORE` | `GHA_GROWTH_PREVIEW` | `GHA_GROWTH_PROD` | stable / monitor-only patch mode | Team C with Team A approval |
| `nft.iai.one` | `Pages/Worker: iai-nft` | `cf_acc_product_core` | auth-gated secure asset surface | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `R2_PROTECTED_ASSETS`, `R2_ARTIFACTS`, `DO_RUNTIME_COORDINATOR`, `QUEUE_EVENTS_INGEST` | `SECRETS_RUNTIME_CORE`, `SECRETS_COMMERCE_CORE`, `SECRETS_PARTNER_SYNC` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | GO with pair-review deltas | Team B with Team A approval |
| `pay.iai.one` | `Pages/Worker: iai-pay` | `cf_acc_product_core` | secure payments / wallet surface | `D1_COMMERCE_PRIMARY`, `KV_EDGE_CONFIG`, `R2_ARTIFACTS`, `DO_RUNTIME_COORDINATOR`, `QUEUE_EVENTS_INGEST` | `SECRETS_RUNTIME_CORE`, `SECRETS_COMMERCE_CORE`, `SECRETS_PAYMENT_CORE` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | prep-only / release-claim locked | Team B with Team A / Team 1 approval |
| `mail.iai.one` | `mail-api + mail-smtp + mail-worker` | `cf_acc_product_core` | mail runtime | `D1_RUNTIME_PRIMARY`, `KV_EDGE_CONFIG`, `QUEUE_EVENTS_INGEST`, `R2_ARTIFACTS` | `SECRETS_MAIL_RUNTIME`, `SECRETS_RUNTIME_CORE` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | internal/runtime | Team B |
| `cdn.iai.one` | `zone-level asset rules` | `cf_acc_platform_primary` | infra | `R2_PUBLIC_ASSETS` | none in repo-defined surface | `GHA_PLATFORM_PREVIEW` | `GHA_PLATFORM_PROD` | blocked until packet | Team B |
| `flows.iai.one` | `internal automation runtime` | `cf_acc_product_core` | internal automation | `D1_RUNTIME_PRIMARY`, `QUEUE_RUNTIME_DISPATCH`, `QUEUE_EVENTS_INGEST` | `SECRETS_RUNTIME_CORE` | `GHA_PRODUCT_PREVIEW` | `GHA_PRODUCT_PROD` | blocked until packet | Team B |

---

## 8. Secret handling rules

- Repo chỉ được nhắc alias, không nhắc raw secret value.
- Raw values nằm trong secured ops vault và release tooling.
- Secret groups phải tách theo role, không dump một loạt cho mọi surface.
- Mỗi release packet phải nói rõ secret groups đã được inject ở target environment.
- Secret group không nằm trong domain row -> domain packet mặc định `BLOCKED`.
- Mỗi secret rotation phải cập nhật:
  - ops vault
  - release tooling
  - file này nếu alias hoặc group đổi
  - Team 1 release note nếu rotation ảnh hưởng deploy gate

---

## 9. Preview / production protection rules

- Preview data không được trỏ nhầm vào production `D1 / R2 / Queue / DO namespace`.
- Production release packet phải xác nhận lại target bindings.
- Preview environment không được dùng production webhook callback theo mặc định.
- Nếu có nghi ngờ binding mismatch -> hard stop.
- Nếu domain đang `prep-only` hoặc `blocked until packet`, production mapping được giữ ở trạng thái not releasable cho tới khi Team 1 cho phép.

---

## 10. GitHub Actions environment usage

### Platform class

- `GHA_PLATFORM_PREVIEW`
  - `iai.one`
  - `home.iai.one`
  - `docs.iai.one`
  - `developer.iai.one`

- `GHA_PLATFORM_PROD`
  - các domain trên khi đã qua Team 1 gate

### Product class

- `GHA_PRODUCT_PREVIEW`
  - `app.iai.one`
  - `flow.iai.one`
  - `dash.iai.one`
  - `api.iai.one`
  - `api.flow.iai.one`
  - `nft.iai.one`
  - `pay.iai.one`
  - `mail.iai.one`
  - `flows.iai.one`

- `GHA_PRODUCT_PROD`
  - các domain trên chỉ khi gate cho phép

### Growth class

- `GHA_GROWTH_PREVIEW`
  - `web.iai.one`
  - `cios.iai.one`
  - `noos.iai.one`

- `GHA_GROWTH_PROD`
  - các domain trên chỉ khi gate cho phép

---

## 11. Release verification checklist

Trước mỗi release:
1. đối chiếu domain row trong owner matrix
2. đối chiếu environment row trong file này
3. xác nhận `GHA environment` đúng target
4. xác nhận account alias đúng owner
5. xác nhận binding groups đúng surface
6. xác nhận secret groups đúng surface
7. xác nhận preview/prod mapping không bị đảo
8. ghi lại kết quả vào release evidence packet

---

## 12. No-release conditions

Tự động `BLOCKED` nếu có một trong các trường hợp:
- domain không có row trong file này
- domain row mâu thuẫn với owner matrix
- packet không ghi `target environment`
- packet không ghi `binding groups / secret groups`
- account alias không khớp release tooling
- preview mapping trỏ vào production resource class
- production packet deploy bằng preview `GHA environment`
- owner team không đúng với row đã khóa

---

## 13. Update rule

Chỉ được update file này khi:
- có domain mới
- có binding alias mới
- có secret group mới
- có đổi owner, account alias hoặc project alias
- có đổi release class của domain

Mỗi update phải do:
- Team 2 hoặc ops owner đề xuất
- Team 1 review
- đính kèm note nếu ảnh hưởng release gate

---

## 14. Definition of done

File này chỉ có giá trị khi:
- mọi domain có row rõ ràng
- binding groups và secret groups không mơ hồ
- preview / production mapping được xác định
- release class của từng domain được ghi rõ
- Team 1 có thể block release nếu environment truth không khớp
