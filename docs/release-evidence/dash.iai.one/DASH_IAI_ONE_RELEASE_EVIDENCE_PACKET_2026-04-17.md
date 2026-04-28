# DASH_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-17
## Release evidence packet for `dash.iai.one`
## Version 1.1
## Status: READY_FOR_TEAM1_REVIEW
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## Metadata

- Domain: `dash.iai.one`
- Owner team: Team 2 Runtime and Platform Core
- Named owner: Team 2 Runtime Lead
- Release date: 2026-04-17
- Commit / branch: working tree checkpoint on `main`
- Target environment: local runtime/test lane
- Approver: Team 1 Program Root (pending)
- Rollback owner: Team 2 Runtime Lead
- Related release gate file:
  - `docs/DASH_IAI_ONE_RELEASE_GATE_2026.md`

---

## 1. Scope shipped

- Routes shipped:
  - `/login`
  - `/dashboard`
  - `/actions`
  - `/audit`
  - `/flows`
  - `/flows/:flowId`
  - `/flows/:flowId/builder`
  - `/flows/:flowId/versions`
  - `/flows/:flowId/drafts`
  - `/flows/:flowId/publish`
  - `/runtime`
  - `/runtime/executions`
  - `/runtime/executions/:executionId`
- Command routes shipped:
  - `POST /flows/:flowId/builder/save`
  - `POST /flows/:flowId/builder/validate`
  - `POST /flows/:flowId/publish/preview`
  - `POST /flows/:flowId/publish/confirm`
- Modules shipped:
  - auth/session guard
  - workspace resolution
  - locale-aware render shell (`vi` default, `en` explicit)
  - flow inventory/detail read layer
  - builder action lane (save + validate command execution)
  - publish action lane (preview + confirm command execution)
  - action result feedback panel on builder/publish surfaces
  - audit timeline surface for sensitive actions
  - flow versions/drafts/publish-readiness read layer
  - runtime executions list/detail read layer
- APIs/contracts integrated:
  - `GET /v1/flow/source-of-truth`
  - `GET /v1/flow/flows`
  - `GET /v1/flow/flows/:flowId`
  - `GET /v1/flow/flows/:flowId/versions`
  - `GET /v1/flow/flows/:flowId/drafts`
  - `GET /v1/flow/flows/:flowId/publish`
  - `POST /v1/flow/flows/:flowId/builder/save`
  - `POST /v1/flow/flows/:flowId/builder/validate`
  - `POST /v1/flow/flows/:flowId/publish/preview`
  - `POST /v1/flow/flows/:flowId/publish/confirm`
  - `GET /v1/flow/audit`
  - `GET /v1/flow/runtime/executions`
  - `GET /v1/flow/runtime/executions/:executionId`
- Out of scope in this packet:
  - manual screenshot attachment pack (this packet is test-evidence-first)

---

## 2. Route evidence

| Route | Expected behavior | Actual behavior | Pass / Fail | Notes |
|---|---|---|---|---|
| `/login` | localized login shell behind shared auth boundary | test asserts VI default and EN explicit render | PASS | `tests/integration/dash-app-phase0.test.mjs` |
| `/dashboard` | runtime summary tied to `api.flow` + workspace id | test asserts summary labels and `x-workspace-id` forwarding | PASS | no fake runtime state |
| `/flows` | show flow inventory from Team 2 source of truth | test asserts inventory labels and flow cards | PASS | reads `/v1/flow/flows` |
| `/flows/:flowId` | show flow detail + recent executions | test asserts builder-readiness section and execution link | PASS | reads `/v1/flow/flows/:flowId` |
| `/flows/:flowId/builder` | show builder state + action feedback | test asserts builder shell and action feedback after POST save | PASS | command redirect feedback asserted |
| `POST /flows/:flowId/builder/save` | execute save command and redirect with outcome | test asserts `action=builder.save` and `outcome=succeeded` | PASS | writes to flow command lane |
| `POST /flows/:flowId/builder/validate` | execute validate command and redirect with outcome | test asserts failed outcome path for blocked flow | PASS | failure path stays explicit |
| `/flows/:flowId/publish` | show publish readiness + action feedback | test asserts publish lane plus action feedback after POST confirm | PASS | includes preview/checklist refs |
| `POST /flows/:flowId/publish/preview` | execute preview command and redirect with outcome | command route asserted in integration test | PASS | preview packet generation path active |
| `POST /flows/:flowId/publish/confirm` | execute publish command and redirect with outcome | test asserts `action=publish.confirm` and `outcome=succeeded` | PASS | publish confirmation path active |
| `/audit` | show latest audit timeline for sensitive actions | test asserts timeline render and `publish.confirm` entry | PASS | reads `/v1/flow/audit` |
| `/runtime/executions` | show execution inventory from Team 2 runtime lane | test asserts execution cards and route proof | PASS | reads `/v1/flow/runtime/executions` |
| `/runtime/executions/:executionId` | show execution detail, pressure refs, step timeline | test asserts alert/step evidence | PASS | reads `/v1/flow/runtime/executions/:executionId` |

---

## 3. API and contract evidence

| Contract / API | Verification method | Result | Notes |
|---|---|---|---|
| `GET /v1/flow/source-of-truth` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | snapshot includes flows + runtimeExecutions + audit events |
| `GET /v1/flow/flows` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | attention-filtered inventory asserted |
| `GET /v1/flow/flows/:flowId` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | flow detail and recent execution link asserted |
| `GET /v1/flow/flows/:flowId/versions` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | version history and publish trail asserted |
| `GET /v1/flow/flows/:flowId/drafts` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | draft queue and open issue count asserted |
| `GET /v1/flow/flows/:flowId/publish` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | publish blockers/checklist readiness asserted |
| `POST /v1/flow/flows/:flowId/builder/save` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | returns `result.action=builder.save`, `outcome=succeeded` |
| `POST /v1/flow/flows/:flowId/builder/validate` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | returns explicit failed outcome for blocked flow |
| `POST /v1/flow/flows/:flowId/publish/preview` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | preview result contract asserted |
| `POST /v1/flow/flows/:flowId/publish/confirm` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | publish confirm result contract asserted |
| `GET /v1/flow/audit` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | filter by `action` + `flow_id` asserted |
| `GET /v1/flow/runtime/executions` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | runtime list status filter asserted |
| `GET /v1/flow/runtime/executions/:executionId` | `tests/integration/flow-api-source-of-truth.test.mjs` | PASS | execution detail step timeline asserted |
| workspace contract guard | `flow-api-source-of-truth` + `dash-app-phase0` | PASS | Dash forwards `x-workspace-id` for all runtime and command calls |

---

## 4. UI evidence

| Screen / route | Evidence path | State covered | Notes |
|---|---|---|---|
| login shell | `tests/integration/dash-app-phase0.test.mjs` | auth boundary, EN/VI render | shared-auth handoff only |
| dashboard | `tests/integration/dash-app-phase0.test.mjs` | runtime summary, next action, workspace forwarding | runtime truth first |
| flow inventory/detail | `tests/integration/dash-app-phase0.test.mjs` | inventory render + detail readiness/execution refs | no fake placeholders |
| builder lane | `tests/integration/dash-app-phase0.test.mjs` | save/validate action forms + feedback state | includes success and failure outcomes |
| publish lane | `tests/integration/dash-app-phase0.test.mjs` | preview/confirm action forms + feedback state | includes publish confirm success proof |
| audit timeline | `tests/integration/dash-app-phase0.test.mjs` | audit cards with action/actor/outcome/timestamp | `publish.confirm` evidence present |
| runtime execution list/detail | `tests/integration/dash-app-phase0.test.mjs` | status chips, alert refs, step timeline | operator-facing runtime detail |

---

## 5. Build and smoke tests

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @iai/mail-core build` | PASS | core flow command and audit types compile |
| `pnpm --filter @iai/mail-api build` | PASS | flow command and audit routes compile |
| `pnpm --filter @iai/dash build` | PASS | dash action + audit surfaces compile |
| `pnpm test:flow` | PASS | flow source and flow-api contracts green |
| `pnpm test:dash` | PASS | dash integration pack green (`11/11`) |

---

## 6. Edge cases

- unauthenticated session redirects to localized `/login`
- explicit English query keeps English rendering on login
- missing route stays explicit and noindexed
- flow/runtime list pages show error state if `api.flow` envelope degrades
- action routes always redirect with explicit `action`, `outcome`, `message`
- audit timeline remains workspace-scoped and filterable from API layer

---

## 7. Rollback note

- Rollback path:
  - revert `packages/mail-core/src/index.ts`
  - revert `apps/mail-api/src/server.ts`
  - revert `apps/dash/*`
  - revert `tests/integration/flow-source-of-truth.test.mjs`
  - revert `tests/integration/flow-api-source-of-truth.test.mjs`
  - revert `tests/integration/dash-app-phase0.test.mjs`
- Rollback owner:
  - Team 2 Runtime Lead
- Rollback risk:
  - medium, because Dash route contracts and backing `api.flow` command contracts move together

---

## 8. Known issues

| Issue | Impact | Workaround | Owner | Status |
|---|---|---|---|---|
| screenshot artifact paths not attached yet | packet currently uses integration evidence without image capture artifacts | keep test-evidence-first mode; attach screenshots in Team 1 review cycle if required | Team 2 | OPEN |

---

## 9. Final sign-off

- Team 2 owner sign-off: `Y`
- Team 1 review result: `PENDING`
- Final status: `READY_FOR_TEAM1_REVIEW`
