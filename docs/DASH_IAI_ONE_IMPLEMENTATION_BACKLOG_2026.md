# DASH_IAI_ONE_IMPLEMENTATION_BACKLOG_2026
## Execution backlog and implementation order for `dash.iai.one`
## Version 1.0
## Status: LOCKED FOR TEAM 2 / TEAM 1 / DASH DELIVERY
## Scope: dash.iai.one
## Date: 2026-04-15

---

## 1. Muc tieu

File nay bien cac file:
- `DASH_IAI_ONE_LIVING_CONTROL_SYSTEM_MANIFESTO_AND_MASTER_DIRECTION.md`
- `DASH_IAI_ONE_RUNTIME_APP_SPEC.md`
- `DASH_IAI_ONE_FULL_PLATFORM_SPEC.md`

thanh backlog build that theo:
- tuan
- module
- route
- dependency
- evidence

Day la file de dev bat dau ship, khong con dung o muc manifesto/spec.

---

## 2. Current repo reality

Hien tai workspace chua co `dash.iai.one` app package doc lap dung muc runtime app truth.
Nhung da co 4 read models nen:
- alerts
- approvals
- billing
- proofs

Foundation nay la hat giong, nhung khong du de goi la Dash.

Hard rule:
- khong duoc nhay vao polish UI truoc khi co auth/runtime truth
- khong duoc build "fake dashboard" de lam thay control plane

---

## 3. Package and ownership decision

### Recommended package path

- `apps/dash`

### Owner

- Primary: Team 2
- Governance / gate: Team 1

### Dependencies

- `api.flow.iai.one` runtime contracts
- auth/session contracts
- locale/SEO governance cho public edge cases neu co

---

## 4. Global build rules

- app-first, no marketing
- runtime truth first
- workspace-first
- no fake live state
- no side-effect preview confusion
- every phase phai attach evidence packet

Evidence packet template:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 5. Phase 0 - Foundation and scaffold

### Muc tieu

Dung skeleton dung cho `dash.iai.one` de team co the build that.

### Bat buoc ship

- scaffold `apps/dash`
- package scripts: `build`, `dev`, `typecheck`
- route shell co auth guard
- workspace resolution layer
- base API client for `https://api.flow.iai.one`
- error boundary and session boundary

### Routes P0

- `/`
- `/dashboard`
- `/login`
- `/logout`

### Dependencies

- Team 2 auth/session contract
- env/bindings truth:
  - `docs/IAI_ENV_BINDINGS_AND_SECRETS_SOURCE_OF_TRUTH_2026.md`

### Evidence required

- auth redirect behavior
- session-required behavior
- workspace resolution proof
- rollback note

---

## 6. Phase 1 - App shell and control home

### Muc tieu

Ship duoc control home dung nghia "living control system" thay vi chi la chart wall.

### Bat buoc ship

- left navigation
- top command bar
- workspace switcher
- control home layout
- living metrics placeholders chi khi labeled clearly
- recent runs panel
- alerts / approvals / proofs / billing summary cards
- next-best-action panel v0 (rule-based is acceptable, fake AI is not)

### Routes

- `/dashboard`
- `/actions` (v0 stub co true action rows)

### Dependencies

- existing read models
- Team 2 runtime summary endpoints

### Evidence required

- screenshot control home
- summary API proof
- no fake loading default
- empty state proof

---

## 7. Phase 2 - Flow inventory and detail

### Muc tieu

Cho user thay flow inventory va flow lifecycle object-aware.

### Bat buoc ship

- flow list
- flow detail overview
- tabs scaffold
- recent run summary per flow
- deep-link vao builder/runtime

### Routes

- `/flows`
- `/flows/:flowId`
- `/flows/:flowId/versions`
- `/flows/:flowId/drafts`
- `/flows/:flowId/publish`

### Dependencies

- flow list/detail contracts
- version/draft/publication contracts

### Evidence required

- flow list proof
- flow detail proof
- empty state / not found / permission denied proof

---

## 8. Phase 3 - Builder foundation

### Muc tieu

Mo builder that, khong phai builder mock.

### Bat buoc ship

- builder shell
- node palette
- canvas foundation
- right inspector
- bottom validation rail
- draft autosave status
- lock state indicator

### Routes

- `/flows/:flowId/builder`

### Dependencies

- draft contract
- lock / collaboration contract
- node catalog metadata

### Do not ship yet

- fancy collaboration visuals neu lock model chua that
- AI suggestions neu node/runtime truth chua on

### Evidence required

- open builder proof
- autosave proof
- read-only / locked mode proof
- invalid draft proof

---

## 9. Phase 4 - Validate, preview, publish

### Muc tieu

Dong workflow:
design -> validate -> preview -> publish

### Bat buoc ship

- validate action
- preview action
- publish checklist
- publish confirmation
- publish result state

### Routes

- `/flows/:flowId/publish`

### Dependencies

- validation contract
- preview contract
- publish contract
- required secrets readiness contract

### Evidence required

- validate pass/fail proof
- preview proof
- publish proof
- audit event proof

---

## 10. Phase 5 - Runtime truth

### Muc tieu

Dash phai thay duoc he dang chay that.

### Bat buoc ship

- executions list
- execution detail
- step inspector
- waiting / failed / retry states
- queue health
- runtime health

### Routes

- `/runtime`
- `/runtime/executions`
- `/runtime/executions/:executionId`
- `/runtime/executions/:executionId/steps/:nodeId`
- `/runtime/queue`
- `/runtime/health`

### Dependencies

- execution contracts
- step log contracts
- queue status contracts
- runtime health contracts

### Evidence required

- list proof
- detail proof
- failed run proof
- waiting state proof
- queue degraded proof if available

---

## 11. Phase 6 - Control actions

### Muc tieu

Cho user can thiep an toan.

### Bat buoc ship

- retry action
- cancel action
- approval action surface
- alert ack / resolve / escalate
- proof inspect / re-verify path

### Routes

- `/approvals`
- `/alerts`
- `/proofs`

### Dependencies

- action permissions
- audit logging
- approvals / alerts / proofs contracts

### Evidence required

- permission-aware rendering
- success / fail action proof
- audit proof

---

## 12. Phase 7 - Workspace and governance

### Muc tieu

Ship du phan workspace de Dash la operating environment that.

### Bat buoc ship

- workspace info
- members
- roles
- secrets overview
- API keys overview
- audit view

### Routes

- `/workspace`
- `/workspace/members`
- `/workspace/roles`
- `/workspace/secrets`
- `/workspace/apikeys`
- `/workspace/audit`

### Dependencies

- role / member / secret / audit contracts

### Evidence required

- workspace resolution proof
- role guard proof
- audit list proof

---

## 13. Phase 8 - Billing and usage surface

### Muc tieu

Mo surface billing sau khi runtime truth da du.

### Bat buoc ship

- billing summary
- usage summary
- plan view
- invoices view
- runtime-affecting commercial blockers

### Routes

- `/billing`
- `/billing/usage`
- `/billing/plans`
- `/billing/invoices`

### Dependencies

- Team 2 billing/usage contracts
- future:
  - `BILLING_AND_USAGE_SYSTEM_SPEC.md`

### Evidence required

- usage summary proof
- overdue / blocker state proof
- permission and locale behavior proof neu co

---

## 14. Phase 9 - Agent and memory surfaces

### Muc tieu

Them intelligence layer sau khi runtime/control da on.

### Bat buoc ship truoc khi claim ready

- agent activity list
- tool call summary
- memory summaries
- recommendation panel grounded in real objects

### Routes

- `/agents`
- `/agents/runs`
- `/memory`
- `/insights`
- `/recommendations`

### Hard rule

Khong ship AI theater.
Neu khong co trace / object / reason / action path that -> khong dua vao Dash.

---

## 15. Route-by-route minimum order

1. `/login`
2. `/dashboard`
3. `/flows`
4. `/flows/:flowId`
5. `/flows/:flowId/builder`
6. `/flows/:flowId/publish`
7. `/runtime/executions`
8. `/runtime/executions/:executionId`
9. `/approvals`
10. `/proofs`
11. `/workspace`
12. `/billing`

Khong nen mo `/billing` truoc `/runtime/executions`.

---

## 16. Four-week execution order

### Week 1

- Phase 0
- Phase 1

### Week 2

- Phase 2
- Phase 3

### Week 3

- Phase 4
- Phase 5

### Week 4

- Phase 6
- Phase 7

Billing va agent surfaces chi mo khi Week 1-4 xanh duoc evidence.

---

## 17. Release blocking conditions

`dash.iai.one` van la NO-GO neu thieu mot trong cac muc sau:
- auth/session proof
- runtime executions proof
- builder open/save/validate proof
- publish proof
- audit proof cho action nhay cam
- rollback note
- release evidence packet day du

---

## 18. Definition of done

Backlog nay duoc xem la dat khi:
- dev co the ship theo phase ma khong tranh cai thu tu
- Team 1 co the review phase-by-phase
- Team 2 biet ro phase nao duoc build truoc
- Dash khong bi keo lai thanh dashboard mong
