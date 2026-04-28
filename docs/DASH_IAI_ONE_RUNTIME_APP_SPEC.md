# DASH_IAI_ONE_RUNTIME_APP_SPEC
## IAI Dash Runtime App Specification
## Version 1.0
## Status: LOCKED FOR DASH / FLOW / API.FLOW / PRODUCT / DESIGN / DEV
## Scope: dash.iai.one
## Date: 2026-04-15

---

## 0. Why This File Exists

`DASH_IAI_ONE_LIVING_CONTROL_SYSTEM_MANIFESTO_AND_MASTER_DIRECTION.md` khoa category va doctrine cho Dash.
File nay khoa phan app that:
- Dash phai co nhung surfaces nao
- tung surface phai doc truth nao
- tung surface phai cho phep hanh dong nao
- du lieu nao la bat buoc
- build order nao moi dung

Khong co file nay, Dash rat de roi ve:
- dashboard chi co chart
- operator console khong co memory
- logs viewer khong co decision support
- builder clone khong co control value

Dash khong phai chi can "nhieu trang hon".
Dash can dung mot runtime app co kha nang thay, hieu, quyet dinh, hanh dong, va hoc.

Chi tiet product / UX / system / route / module day du duoc khoa tiep tai:
- `docs/DASH_IAI_ONE_FULL_PLATFORM_SPEC.md`
- `docs/DASH_IAI_ONE_IMPLEMENTATION_BACKLOG_2026.md`

---

## 1. Current Repo Reality

Tai workspace hien tai:
- chua co mot app `dash.iai.one` standalone day du
- `dash.iai.one` van dang `NO-GO` trong control tower
- cac read model hien co moi chi la hat giong cho control plane

Foundation hien co dang ton tai o:
- alerts
- approvals
- billing
- proofs

Day la dau hieu tot, nhung chua du.
Nhung model nay phai duoc nang cap tu "dash data helpers" thanh app plane that.

Hard reality:
- Dash chua duoc xem la done neu chi co model builders
- Dash chua duoc xem la done neu chi doc duoc metrics
- Dash chi done khi con nguoi co the dung no de dinh huong, can thiep, xac nhan, giam sat va dua ra quyet dinh tot hon

---

## 2. Absolute Role

`dash.iai.one` la:

The Living Control System of IAI

Trong he Flow moi:
- `flow.iai.one` = product site / trust site / category site
- `api.flow.iai.one` = execution plane / runtime authority
- `dash.iai.one` = app that sau dang nhap, noi control tro thanh kha dung

Dash phai la noi:
- runtime truth duoc nhin thay
- operating pressure duoc nen lai
- action quan trong duoc dua len dung luc
- approvals, proofs, agent activity va queue state duoc dieu khien
- memory va decision history duoc giu lai de cac lan sau tot hon

---

## 3. Non-Negotiable Rules

### 3.1 Runtime truth only

Dash khong duoc dung fake runtime data de gia lap production truth.

### 3.2 Action before decoration

Moi man hinh phai giup nguoi dung:
- thay dieu quan trong
- hieu vi sao no quan trong
- lam duoc viec tiep theo

### 3.3 Object-aware, not page-aware

Dash phai giup user di qua:
- Flow
- Run
- Step
- Alert
- Approval
- Proof
- Agent
- Decision
- Workspace

Khong phai chi di qua cac page roi rac.

### 3.4 Proof-aware by default

Moi action quan trong deu phai co kha nang link toi:
- proof
- audit
- event
- decision history

### 3.5 Memory-aware by default

Dash khong chi hien tai.
Dash phai nho:
- cai gi lap lai
- cai gi dang xau di
- cai gi vua duoc cai thien
- ai da quyet dinh dieu gi

### 3.6 Decision support is mandatory

Neu Dash khong the dua ra next-best-action, no moi chi la quan sat.

---

## 4. Primary User Types

### 4.1 New user

Can:
- orientation
- 1 flow huu ich de bat dau
- 1 action ro rang
- khong bi ngop boi he thong

### 4.2 Operator

Can:
- live state
- failures
- queue pressure
- approvals
- logs summary
- rollback-safe interventions

### 4.3 Builder / Creator

Can:
- flow performance
- run health
- template leverage
- draft awareness
- proof of outcomes

### 4.4 Decision-maker

Can:
- system pressure
- trust health
- unresolved bottlenecks
- next actions co gia tri cao

### 4.5 Future organization admin

Can:
- workspace-level control
- role-aware views
- proof-backed system state
- khong bi bien thanh surveillance cockpit

---

## 5. Core Object Model Dash Phai Hieu

Dash phai duoc xay quanh object graph sau:
- User
- Workspace
- Flow
- FlowVersion
- Run
- Step
- Queue
- Alert
- Approval
- Proof
- Agent
- Decision
- Action
- Artifact
- BillingRecord
- UsageWindow
- AuditEvent

Rule:
- moi screen phai ro object trung tam la gi
- moi object phai co status, timestamps, workspace ownership va related actions
- moi object quan trong phai co deep-link tu object khac

---

## 6. Surface Map Chinh Thuc

Dash V1+ phai co toi thieu 12 zones sau.

### 6.1 `/` - Control Home

Day la man hinh quan trong nhat.
No khong phai home page marketing.
No la control home.

No phai hien:
- 4 living metrics: Clarity, Stability, Value, Legacy
- top alerts dang mo
- top approvals dang tac
- queue pressure
- runtime health summary
- proof health summary
- next-best-actions
- recent meaningful runs

### 6.2 `/actions` - Action Center

No phai gom:
- urgent actions
- stabilizing actions
- proof-required actions
- approval actions
- recovery actions
- recommended actions

Moi action phai co:
- reason
- impact
- confidence
- source object
- safe action / escalate path

### 6.3 `/runs`

No phai hien:
- latest runs
- failed runs
- waiting runs
- long-running runs
- retryable runs
- filter theo workspace / flow / status / time

Run detail phai co:
- state timeline
- related steps
- related alerts
- related proofs
- related approvals
- related artifacts

### 6.4 `/queues`

No phai hien:
- queue depth
- retries
- dead-letter pressure
- blocked dispatches
- waiting workloads
- load trends

Khong duoc hien queue nhu mot metric vo nghia.
Phai cho thay operating pressure.

### 6.5 `/alerts`

No phai gom:
- critical open alerts
- human-required alerts
- by severity
- by scope
- by status
- ack / resolve / escalate actions

### 6.6 `/approvals`

No phai gom:
- pending approvals
- overdue approvals
- human-required queue
- approval history
- approve / reject / reassign / expire actions

### 6.7 `/proofs`

No phai gom:
- proof status
- failed proofs
- low-confidence proofs
- verification rate
- proof lineage
- re-verify / inspect / escalate actions

### 6.8 `/agents`

No phai gom:
- agent activity
- agent role
- waiting agents
- tool calls
- reasoning trace summary
- guardrails hit
- human takeover path

### 6.9 `/flows`

No phai la Flow builder clone.
No phai la control-facing view cua flow inventory.

No phai gom:
- active flows
- unhealthy flows
- high-value flows
- drifted flows
- latest publication
- usage and proof summary per flow

### 6.10 `/billing`

No phai gom:
- outstanding usage
- collection risk
- overdue invoices
- entitlements / plan window
- seat / quota pressure
- payment and contract blockers co anh huong runtime

### 6.11 `/workspaces`

No phai gom:
- workspace health
- member roles
- active incidents
- pending approvals
- usage pressure
- locale / policy / environment summary

### 6.12 `/audit`

No phai gom:
- sensitive actions
- decision history
- publish / unpublish history
- force cancel / retry history
- lock takeover history
- security-relevant events

---

## 7. The Five Living Layers Mapped Into UI

### 7.1 Life Layer

Dash phai hien 4 living metrics:
- Clarity
- Stability
- Value
- Legacy

Rules:
- khong duoc la vanity scores
- phai co signal sources ro rang
- phai co trend
- phai co "what changed"

### 7.2 Execution Layer

Dash phai hien:
- running
- failed
- waiting
- blocked
- retrying
- degraded

Execution layer phai noi duoc he dang co ap luc o dau.

### 7.3 Agent Layer

Dash phai hien:
- agent dang lam gi
- agent dang doi gi
- agent da tac dong gi
- agent co can nguoi can thiep khong

### 7.4 Proof Layer

Dash phai hien:
- proof da verified chua
- low confidence o dau
- proof gap o dau
- object nao dang thieu proof

### 7.5 Decision Layer

Moi man hinh quan trong phai co kha nang dua ra:
- most urgent action
- most valuable action
- most stabilizing action
- safest next action

---

## 8. Feature Specification Chi Tiet

### 8.1 Control Home widgets bat buoc

- LivingStateHeader
- NextBestActionPanel
- RuntimePressureMap
- RecentRunsPanel
- AlertsSummaryCard
- ApprovalsQueueCard
- ProofHealthCard
- QueuePressureCard
- AgentActivityCard
- WorkspaceHealthCard

### 8.2 Run detail bat buoc

- status timeline
- steps list
- step inspector
- related alerts
- related approvals
- related proofs
- retry / cancel / resume controls
- artifact links
- billing / usage impact summary

### 8.3 Alert management bat buoc

- open / acked / resolved views
- severity filter
- scope filter
- requires-human filter
- deep link toi related run / flow / proof

### 8.4 Approval control bat buoc

- queue sorted theo SLA
- approve / reject / assign
- overdue highlighting
- impact statement truoc khi approve
- proof link truoc khi finalize

### 8.5 Proof control bat buoc

- verification status
- confidence score
- lineage
- source object
- captured time
- inspect and re-verify path

### 8.6 Agent control bat buoc

- active agents list
- role and scope
- last tool calls
- last decision summary
- waiting state
- stop / escalate / handoff actions

### 8.7 Billing and usage bat buoc

- outstanding
- overdue
- collection risk
- seat / quota pressure
- premium capability gates
- runtime-affecting commercial blockers

---

## 9. Read Models Dash Can Bat Dau Tu Dau

Foundation hien co cho Dash V1 trong workspace nay:
- alerts
- approvals
- billing
- proofs

Day la 4 read models bat dau duoc.
Nhung Dash day du phai co them:
- runs summary read model
- queue pressure read model
- agent activity read model
- decision recommendation read model
- living metrics read model
- workspace health read model
- audit digest read model

Rule:
- read model nao khong co runtime truth thi khong duoc dua len surface quan trong
- aggregate nao dung cho UI phai duoc dinh nghia ro thay vi query raw khap noi

---

## 10. Contracts Bat Buoc Tu `api.flow.iai.one`

Dash can toi thieu cac contract sau:

### 10.1 Session and workspace
- session validate
- workspace resolution
- role / entitlement resolution

### 10.2 Runtime state
- runs list
- run detail
- step detail
- queue status
- runtime health

### 10.3 Governance
- alerts
- approvals
- proofs
- audit events
- decision history

### 10.4 Intelligence
- agent activity
- tool call summary
- recommendation / next-best-action
- memory summaries

### 10.5 Commercial
- billing status
- usage summary
- quota / seats / plan entitlements

Hard rule:
- Dash chi doc contract chinh thuc
- khong duoc de tung screen tu viet SQL truc tiep khap runtime

---

## 11. Next-Best-Action Model

Day la capability dinh nghia Dash.

Moi action de xuat phai co:
- `action_id`
- `workspace_id`
- `category`
- `priority`
- `confidence`
- `reason`
- `source_objects`
- `expected_outcome`
- `safety_level`
- `human_required`

Categories toi thieu:
- stabilize
- approve
- verify
- recover
- reduce_load
- investigate
- optimize

Action engine phai uu tien:
1. action tranh ton hai ngay
2. action go blocker
3. action tang trust
4. action tang gia tri

Dash khong duoc bien next-best-action thanh AI chat chung chung.
No phai la operating intelligence co object, co ly do, co safety.

---

## 12. Memory and History Requirements

Dash phai nho:
- repeated failures
- repeated approval bottlenecks
- repeated proof gaps
- repeated queue spikes
- repeated agent escalations
- recent successful recoveries
- decision history

Dash phai co kha nang hien:
- what changed
- what repeated
- what degraded
- what improved

Neu khong co lop nay, Dash chi phan ung.
Neu co lop nay, Dash bat dau thich nghi.

---

## 13. Auth, Security, and Permissions

Dash la auth-gated app.

Bat buoc:
- HttpOnly session
- workspace-scoped routing
- role-aware views
- object-level authorization
- audit cho moi action nhay cam

Actions can han che dac biet:
- force retry
- force cancel
- publish-adjacent actions
- lock takeover
- billing-sensitive actions
- proof override
- agent stop / takeover

Moi action nhu vay phai co:
- permission check
- audit event
- success / failure evidence

---

## 14. Locale and Language Rules

Dash khong phai SEO surface chinh.
Nhung Dash phai locale-ready ngay tu dau.

Lock rule:
- English-first cho global default
- Vietnamese la first-class locale
- copy phai co the mo rong sang ngon ngu khac sau nay

Khong duoc:
- hardcode text chi cho 1 ngon ngu
- xem locale la patch sau nay
- tron giua marketing copy va operator copy

Ngon ngu Dash phai uu tien:
- living state
- runtime truth
- proof status
- action path
- decision history
- queue pressure
- next best action

Tranh:
- vanity metrics
- growth hacks
- generic dashboard analytics language

---

## 15. Design Rules

Dash phai:
- calm
- sparse
- high-signal
- khong dashboard theater
- khong dopamine junk
- khong panel clutter

Moi screen phai tra loi duoc 3 cau:
1. dieu gi dang xay ra
2. vi sao no quan trong
3. dieu gi nen xay ra tiep theo

---

## 16. Telemetry and Observability

Dash phai tu quan sat chinh no.

Can co:
- route-level load health
- slow query / slow contract detection
- failed action telemetry
- recommendation acceptance / rejection tracking
- alert resolution latency
- approval completion latency
- proof verification latency

Khong optimize cho:
- clicks
- session time
- dashboard engagement

Optimize cho:
- reduced confusion
- action completion
- reduced drift
- improved trust
- faster recovery

---

## 17. Release Gates Cho Dash

`dash.iai.one` chi duoc reopen GO khi co day du:
- session that
- workspace resolution that
- runtime read models that
- alert / approval / proof / billing views that
- run detail and inspector that
- at least one next-best-action surface that
- audit evidence cho actions nhay cam
- test evidence khong skip
- rollback note ro rang

Neu thieu mot trong cac muc tren:
- khong duoc goi la control plane
- khong duoc mo release

---

## 18. Build Order Dung

### Stage 1 - Control Home Truth
- control home
- living metrics
- alerts / approvals / proofs / billing cards
- recent runs

### Stage 2 - Runtime Truth
- runs list
- run detail
- step inspector
- queue pressure
- runtime health

### Stage 3 - Control Actions
- action center
- approvals actions
- retry / cancel / resume
- alert ack / resolve / escalate

### Stage 4 - Proof and Audit Truth
- proof detail
- lineage
- audit timeline
- decision history

### Stage 5 - Agent and Memory Truth
- agent panel
- tool call summaries
- memory summaries
- recommendation layer

### Stage 6 - Adaptive Control
- role-aware dashboards
- workspace pressure views
- safer automation suggestions
- optimization insights

---

## 19. Immediate Execution Order For This Workspace

### Priority P0
- khoa spec nay
- map current read models vao Dash foundation
- quyet dinh app package / module ownership cho `dash.iai.one`
- khoa runtime contracts bat buoc tu `api.flow.iai.one`

### Priority P1
- scaffold `dash.iai.one` app surface trong monorepo
- build control home
- build runs / alerts / approvals / proofs / billing surfaces
- attach test evidence

### Priority P2
- them decision layer
- them memory layer
- them agent control layer
- them adaptive workspace views

---

## 20. Definition Of Done

Dash chi duoc xem la dung huong khi:
- no khong con la chart dashboard
- no doc runtime truth that
- no cho phep can thiep an toan
- no cho phep user thay pressure va uu tien
- no ket noi duoc proofs, approvals, alerts, runs va billing
- no bat dau dua ra next-best-action
- no giu dung ngon ngu `Living Control System`

---

## 21. Final Directive

Moi quyet dinh cua team Dash phai qua cau hoi nay:

Dieu nay co lam Dash tro thanh mot living control system hon khong,
hay no keo Dash tro lai thanh mot dashboard thu dong?

Neu no keo Dash tro lai thanh dashboard thu dong,
khong build.
