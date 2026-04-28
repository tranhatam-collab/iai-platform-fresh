# FLOW_ENGINE_MASTER_ARCHITECTURE
## Final Technical Architecture for IAI Flow as a Living Execution System
## Version 1.0
## Status: LOCKED FOR FLOW / DASH / API.FLOW / DEV
## Scope: flow.iai.one / dash.iai.one / api.flow.iai.one
## Date: 2026-04-15

---

## 1. Muc tieu toi thuong

IAI Flow khong duoc xay nhu mot "workflow executor" thong thuong.
No khong ton tai chi de chay cac buoc tuan tu, noi API, hay thay the thao tac tay bang keo tha.
Neu bi keo xuong muc do do, Flow se chi tro thanh mot san pham cung hang voi cac he automation pho bien, du co tinh vi hon den dau.

IAI Flow phai duoc xay nhu loi thuc thi cua mot he song.

Dieu do co nghia la:
- con nguoi khong chi bam nut, ma dua vao he y dinh, ngu canh, muc tieu va gioi han
- AI khong chi sinh van ban hay route lenh, ma tham gia vao nhan thuc, phan tich, goi y va dieu phoi
- he thong khong chi "chay flow", ma to chuc viec thuc thi thanh mot dong chay co trang thai, tri nho, kha nang quan sat, kha nang giai thich, kha nang phuc hoi va kha nang tien hoa
- moi execution deu co the duoc theo doi, kiem tra, giai thich, tam dung, tiep tuc, xac minh va hoc lai cho cac lan sau

Vi vay, muc tieu ky thuat cua Flow Engine khong phai la "chay duoc flow", ma la:
- chay flow ben vung
- chay flow co trang thai ro rang
- chay flow co tri nho
- chay flow chiu duoc loi
- chay flow cho duoc con nguoi
- chay flow phoi hop duoc voi agent
- chay flow giai thich duoc
- chay flow mo rong duoc thanh control plane cua toan he

IAI Flow phai la execution substrate cho:
- automation
- orchestration
- agent systems
- memory-driven decisions
- human-in-the-loop execution
- creative runtime composition
- living operational systems

---

## 2. Dinh nghia ky thuat

Flow Engine la mot he thong thuc thi nhieu lop, trong do moi lop co nhiem vu rieng, nhung tat ca phuc vu chung mot dong van hanh thong nhat.

### 2.1 Definition Layer

Day la lop quan ly dinh nghia cua he.
No luu va quan tri:
- flow definitions
- drafts
- versions
- publications
- templates
- node metadata
- bindings
- ownership
- compatibility information

Lop nay tra loi cau hoi:
"Flow nay la gi, dang o phien ban nao, ai so huu, co the dung o dau?"

### 2.2 Validation Layer

Day la lop kiem tra truoc khi cho phep preview, publish hoac run.

No dam bao:
- graph hop le
- node config dung schema
- edge hop le
- required secret da co
- role hien tai co quyen dung flow
- khong co cau hinh nguy hiem hoac thieu guard
- prompt, AI node, tool node khong vuot policy

Lop nay tra loi cau hoi:
"Flow nay co an toan va hop le de chay khong?"

### 2.3 Execution Layer

Day la loi truc tiep cua viec thuc thi.

No lam nhiem vu:
- chuyen flow definition thanh execution plan
- tao execution instance
- dispatch step
- chuyen trang thai
- persist output
- retry neu can
- pause neu can approval
- complete / fail / cancel dung luat

Lop nay tra loi cau hoi:
"Flow nay dang chay ra sao, o trang thai nao, buoc tiep theo la gi?"

### 2.4 Coordination Layer

Day la lop giu trang thai song cua toan bo tien trinh.

No quan ly:
- run ownership
- execution claim / release
- active state
- live locks
- approvals dang cho
- builder collaboration
- live session coordination
- resume / cancel / retry orchestration

Lop nay tra loi cau hoi:
"Ai dang giu quyen dieu phoi, trang thai song hien tai cua flow la gi, co xung dot hay khong?"

### 2.5 Node Layer

Day la lop cung cap contract va executor cho tung node.

Node khong duoc xem chi la "khoi UI".
Moi node phai la mot thuc the ky thuat day du, co:
- identity
- config schema
- IO contract
- capability flags
- security scope
- executor mapping
- side-effect profile

Lop nay tra loi cau hoi:
"Moi khoi trong flow thuc su co the lam gi, can gi, va tao ra gi?"

### 2.6 Agent Layer

Day la lop cho phep mot so node hoat dong nhu tac nhan nhan thuc.

O lop nay, node co the:
- hieu context
- dung tool
- doc memory
- quyet dinh buoc tiep theo
- goi subflow
- dua ra goi y hoac hanh dong co kiem soat

Lop nay tra loi cau hoi:
"He co the tu hieu va tu dieu phoi o muc nao ma van con an toan, minh bach va kiem soat duoc?"

### 2.7 Observability Layer

Day la lop quan sat.

No cung cap:
- execution logs
- step logs
- traces
- metrics
- runtime inspector
- dashboard aggregates
- health signals
- audit signals

Lop nay tra loi cau hoi:
"Dieu gi da xay ra, dang xay ra, vi sao xay ra, va he co khoe khong?"

### 2.8 Commercial Layer

Day la lop thuong mai hoa.

No theo doi:
- usage
- quotas
- credits
- seats
- billing events
- premium node usage
- token usage
- storage usage
- API key usage

Lop nay tra loi cau hoi:
"Flow dang tieu ton gi, tao ra gia tri gi, va thuong mai hoa nhu the nao?"

---

## 3. Nguyen tac kien truc

### 3.1 Runtime truth first

Moi UI chi la cua so nhin vao runtime truth.
Khong co runtime truth thi khong duoc gia lap thanh product truth.

Dieu nay nghia la:
- Dash khong duoc dung chart dep bang fake data
- Builder khong duoc "preview" bang mo phong rom neu runtime that khac
- Product site khong duoc noi he da lam duoc dieu ma execution plane chua lam duoc

### 3.2 Workspace isolation by default

Moi tai nguyen phai mang `workspace_id` lam truc chinh.

Khong co:
- flow
- draft
- version
- execution
- template install
- approval
- lock
- usage record

nao duoc ton tai ngoai workspace scope.

Day la quy tac nen cho auth, ownership, billing, security va collaboration.

### 3.3 Durable execution by design

Execution phai chiu duoc:
- network failures
- worker restarts
- runtime crash
- delayed resume
- approval waits
- scheduled wake-ups
- retry windows
- queue backlog

Flow khong duoc gia dinh rang moi thu luon chay lien mach trong mot request ngan.

### 3.4 State is explicit

Moi execution deu phai co state machine ro rang.
Khong de trang thai ngam chi nam trong memory tam hay trong mot promise chain khong the kiem tra lai.

### 3.5 Nodes are contracts, not UI blocks

Node khong phai la o vuong trong canvas.
Node la contract ky thuat co the duoc runtime hieu, validator kiem tra, billing ghi usage, dashboard quan sat, va security kiem soat.

### 3.6 Preview is not production run

Preview va production run phai tach ro.
- Preview co the dung runtime that
- Nhung preview khong duoc side-effect nhu production neu khong cho phep ro rang
- Logs preview phai duoc danh dau rieng
- Billing preview phai theo rule rieng

### 3.7 Observability is first-class

Logs, traces, metrics, node inspector va dashboard aggregates khong duoc xem la phan phu lam sau.
Chung la phan loi cua Flow.

Khong co observability -> khong co runtime truth.
Khong co runtime truth -> khong co Flow dung nghia.

### 3.8 Flow is open-ended

Kien truc phai cho phep them:
- node moi
- tool moi
- agent moi
- template moi
- execution mode moi
- pricing model moi
- approval model moi
- observability layer sau hon

Khong duoc khoa minh vao mot mo hinh hep nhu "workflow builder cho vai use case cu".

---

## 4. Kien truc phan tang

### 4.1 Plane A - Definition Plane

Day la noi quan ly cac thuc the tinh hoac ban tinh.

Bao gom:
- users
- workspaces
- workspace members
- flows
- flow versions
- flow drafts
- flow publications
- templates
- template installs
- node catalog metadata
- secret metadata
- billing metadata
- API key metadata

Storage chinh
- D1

Trach nhiem
- dam bao data integrity
- ownership
- query / filter / search
- drafts / versioning / publishing
- lifecycle ro rang cua flow definitions

Definition Plane la noi noi len flow la gi truoc khi flow duoc chay.

### 4.2 Plane B - Builder Plane

Day la lop phuc vu UI editor.

Bao gom:
- builder state
- canvas state
- selected node
- open inspector
- validation result
- preview request
- collaboration lock
- live presence sau nay
- publish readiness

Storage chinh
- D1 cho builder state lau dai
- Durable Objects cho lock / presence / live coordination

Trach nhiem
- builder khong mat trang thai
- nguoi dung khong ghi de nhau
- validation phan hoi du nhanh
- publish khong cho di ra flow loi
- collaboration co quyen va lock ro

Builder Plane khong phai execution plane.
No la moi truong sang tao co kiem soat.

### 4.3 Plane C - Execution Plane

Day la loi thuc thi.

Bao gom:
- execution coordinator
- workflow runtime
- queue dispatcher
- step runner
- retry engine
- state machine
- waiting / approval handling
- cancel / resume / re-run control

Storage chinh
- Cloudflare Workflows cho durable execution
- Durable Objects cho active coordination state
- Queues cho async dispatch / fanout / spikes
- D1 cho execution metadata, execution logs, step logs
- R2 cho artifacts lon neu can

Trach nhiem
- nhan run request
- tao execution
- dispatch tung step
- cap nhat trang thai
- xu ly cho approval / event
- retry theo policy
- hoan tat dung lifecycle

Execution Plane la noi Flow chung minh minh la he song that, khong phai so do keo tha.

### 4.4 Plane D - Intelligence Plane

Day la noi Flow vuot khoi automation cu.

Bao gom:
- prompt nodes
- agent nodes
- tool router
- semantic retrieval
- memory interface
- recommendation system
- planner / supervisor sau nay

Storage chinh
- D1 cho metadata
- vector layer cho semantic search / retrieval
- external model APIs / agent runtime
- memory summaries trong metadata store phu hop

Trach nhiem
- doc context
- hieu muc tieu
- chon tool hop ly
- de xuat flow / template / node
- ho tro con nguoi xay nhanh hon
- giup runtime thich nghi tot hon

Intelligence Plane khong duoc lam mo execution truth.
No phai tang tri tue cho he, khong pha kha nang quan sat.

### 4.5 Plane E - Observability Plane

Day la noi he tu nhin lai chinh minh.

Bao gom:
- execution logs
- step logs
- trace events
- metrics
- inspector views
- queue health
- runtime health
- dashboard aggregates
- proof relation signals

Storage chinh
- D1 cho structured records
- DO cho live state snapshots neu can
- queue-based ingestion cho metrics / traces khi scale lon
- R2 cho log archives / artifacts neu can

Trach nhiem
- cho user thay dieu gi da chay
- cho operator debug
- cho Dash hieu he dang khoe hay vo
- cho billing thay usage that
- cho proof layer bam duoc execution lineage

---

## 5. Thuc the du lieu cot loi

### 5.1 Identity
- User
- Session
- Workspace
- WorkspaceMember

### 5.2 Flow lifecycle
- Flow
- FlowVersion
- FlowDraft
- FlowPublication
- BuilderState

### 5.3 Execution
- ExecutionLog
- ExecutionStepLog
- ExecutionEvent
- RetryRecord
- ApprovalWaitRecord
- RunArtifact

### 5.4 Catalog
- NodeDefinition
- NodeCapability
- TemplateDefinition
- TemplateInstallRecord

### 5.5 Security & governance
- AuditLog
- SecretMetadata
- ApiKey
- PolicyReference
- UsageLedger

### 5.6 Intelligence & memory
- MemorySummary
- RecommendationRecord
- AgentRunRecord
- ToolCallRecord

---

## 6. Execution lifecycle chuan

Moi execution phai di qua state machine sau.

### 6.1 States
- `created`
- `queued`
- `running`
- `waiting`
- `retrying`
- `completed`
- `failed`
- `cancelled`

### 6.2 Lifecycle flow
1. user hoac system trigger run
2. auth + workspace + ownership duoc kiem tra
3. definition duoc normalize
4. definition duoc validate
5. execution row duoc tao trong D1
6. execution vao queue hoac workflow instance
7. coordinator claim execution
8. runtime lay step dau tien
9. node runner chay step
10. output duoc persist
11. neu can approval / event -> waiting
12. neu loi retryable -> retrying
13. neu xong -> completed
14. neu fail khong recoverable -> failed
15. neu bi huy -> cancelled

### 6.3 Preview lifecycle

Preview di cung logic runtime nhung co co ro:
- `mode = preview`
- side-effect policy khac
- logs danh dau preview
- billing rieng hoac khong tinh
- artifacts preview tach rieng production

---

## 7. Runtime engine chi tiet

### 7.1 Workflow normalizer

Nhiem vu:
- chuan hoa raw flow definition
- fill default values
- normalize edges
- resolve entry node
- merge node defaults
- chuan hoa runtime flags

### 7.2 Workflow validator

Nhiem vu:
- kiem tra graph connectivity
- kiem tra node types hop le
- kiem tra config required
- kiem tra secret requirements
- kiem tra policy compatibility
- kiem tra role compatibility
- kiem tra prompt / tool guard

Output:
- errors
- warnings
- publish blockers
- preview blockers

### 7.3 Node runner

Nhiem vu:
- nhan node + context + input
- resolve executor
- chay executor
- tra output / error / metadata

Node runner la dispatcher chung, khong om business logic tung node.

### 7.4 Workflow runtime

Nhiem vu:
- quyet dinh thu tu step
- xu ly branch / switch / loop
- truyen payload giua cac node
- quan ly waiting state
- build step logs
- quyet dinh buoc tiep theo

Workflow runtime la "bo nao thuc thi" cua tung run instance.

### 7.5 Flow engine

Nhiem vu:
- orchestrate toan bo lifecycle
- noi runtime voi persistence
- goi coordinator
- ho tro preview / run / retry / resume
- phat execution events cho observability va billing

Flow engine la facade cap cao nhat cua execution plane.

### 7.6 Execution coordinator

Nhiem vu:
- claim / release runs
- ngan double execution
- giu active run state
- xu ly cancel / retry / resume
- giu coordination cho waiting approvals / events

Execution coordinator nen dung Durable Object.

### 7.7 Queue / dispatcher

Nhiem vu:
- tach ingestion khoi processing
- fanout tasks
- absorb spike
- enable retry scheduling
- route heavy async work

### 7.8 Retry policy

Nhiem vu:
- xac dinh loi retryable
- max attempts
- backoff
- jitter
- dead-letter handling
- escalation thresholds

Retry khong phai chap va.
No phai la contract.

---

## 8. Node system chuan

### 8.1 Node catalog

Node catalog la nguon su that cho:
- display name
- category
- config schema
- input / output contracts
- roles allowed
- experimental / stable status
- secret scope
- runtime traits
- side-effect level

### 8.2 Node contracts

Moi node phai khai bao:
- `type`
- `displayName`
- `category`
- `configSchema`
- `inputShape`
- `outputShape`
- `securityProfile`
- `rolesAllowed`
- `stable`
- `sideEffectLevel`
- `supportsPreview`
- `requiresApproval`

### 8.3 Node executors

Node executor phai tach khoi catalog metadata.

Nhom node toi thieu:
- `trigger.manual`
- `trigger.webhook`
- `action.transform`
- `action.http`
- `action.delay`
- `logic.if`
- `logic.switch`
- `output.response`
- `data.write`
- `ai.prompt`
- `ai.router`
- `ai.agent` sau nay

### 8.4 Secret scopes

Node nao can secret phai khai ro:
- `none`
- `api_key`
- `oauth_token`
- `db_connection`
- `webhook_signature`
- `provider_token`

Builder phai doc duoc metadata nay de huong user cau hinh dung.

---

## 9. Agent architecture chuan

### 9.1 Agent khong phai lop trang tri

Agent chi duoc dua vao khi co du:
- tool system
- permission boundary
- execution trace
- cost control
- rate limit
- memory boundary
- observability

### 9.2 Agent node classes

Giai doan dau:
- `ai.prompt`
- `ai.router`
- `ai.agent`

Giai doan sau:
- `ai.planner`
- `ai.memory`
- `ai.search`
- `ai.supervisor`

### 9.3 Agent loop model

Chu ky chuan:
1. nhan input
2. doc context
3. chon tool / hanh dong
4. nhan tool result
5. quyet dinh tiep
6. dung khi du dieu kien hoac toi `maxSteps`

### 9.4 Tool system

Moi tool co:
- `toolName`
- `inputSchema`
- `permissionScope`
- `sideEffectLevel`
- `executor`

Tool toi thieu:
- `http.call`
- `flow.run`
- `d1.query`
- `log.write`

Agent khong duoc tu do vo han.
Agent phai bi rang buoc boi tool system va runtime contract.

---

## 10. Builder architecture chuan

### 10.1 Builder state

Builder state gom:
- canvas viewport
- selected node
- open panels
- transient UI state
- last validation result
- unsaved indicator

Builder state khong thay the flow definition.

### 10.2 Draft model

Builder luon lam viec voi draft truoc.
Publish moi tao `FlowVersion` / `FlowPublication`.

Khong cho builder sua truc tiep publication hien hanh theo kieu ngam.

### 10.3 Collaboration

Neu nhieu nguoi cung mo builder:
- D1 giu state lau dai
- DO giu live lock / presence
- lock co TTL
- owner / admin co quyen force takeover
- moi conflict phai duoc audit

### 10.4 Preview

Preview phai:
- dung runtime that
- chay trong sandbox mode
- khong side-effect hoac side-effect co kiem soat
- tach artifact / log voi production

---

## 11. Observability architecture

### 11.1 Execution logs

Giu:
- execution id
- flow id
- workspace id
- mode
- status
- timestamps
- output summary
- error summary

### 11.2 Step logs

Giu:
- node id
- node type
- node name
- input
- output
- error
- duration
- sequence order

### 11.3 Dashboard aggregates

Dash khong query thang tu raw step logs cho moi thu.
Phai co aggregate layer:
- total runs
- success rate
- fail rate
- average duration
- top error classes
- usage trends
- action pressure
- queue backlog

### 11.4 Node inspector

Node inspector phai hien thi:
- input
- output
- errors
- timing
- related proof / artifact neu co

---

## 12. Security architecture

### 12.1 Auth

Auth phai gom:
- session validate endpoint
- HttpOnly cookie
- credentials include tu frontend
- logout chuan
- session expiry
- workspace resolution

### 12.2 Authorization

Moi API phai:
- resolve identity
- resolve workspace
- check role
- check ownership
- check feature entitlement neu co billing tier

### 12.3 Runtime guard

Moi flow truoc preview / publish / run / import phai qua:
- validator
- node capability check
- prompt / content guard
- secret scope resolution
- preview safety check

### 12.4 Audit

Moi action nhay cam phai co audit log:
- login / logout
- create / update / delete flow
- publish / unpublish
- import / export
- template install
- secret operations
- API key operations
- lock takeover
- force cancel / force retry

---

## 13. Billing and usage architecture

### 13.1 Usage units

Phai dinh nghia ngay tu dau:
- run count
- step count
- execution duration
- agent tool calls
- AI token usage
- storage usage
- seats
- premium node usage

### 13.2 Usage capture points

Usage duoc ghi tai:
- flow start
- step complete
- agent call
- template install neu can
- API key usage
- premium action trigger

### 13.3 Ledger

Khong tinh billing truc tiep tu dashboard query.
Phai co:
- usage ledger
- aggregated usage table
- billing events
- invoice shadow model neu can

---

## 14. Repo architecture mapping

### flow.iai.one repo

Chiu trach nhiem:
- flow.iai.one
- developer.iai.one
- dash.iai.one frontend surfaces neu dang cung codebase

### iai-flow-engine repo

Chiu trach nhiem:
- auth / session
- runtime truth
- flow lifecycle
- execution
- queues
- durable coordination
- observability
- billing backend
- node runtime
- agent / tool systems

Neu khong tach repo ngay, van phai tach module boundary nhu the da la hai repo khac nhau.

---

## 15. Anti-patterns phai tranh

Khong duoc:
- bien builder thanh noi giu logic runtime
- de route truc tiep viet SQL khap noi mai mai
- tron template source o nhieu cho khong co registry
- tron node metadata voi node executor hon loan
- cho preview va production dung chung side effects
- dung fake data lau dai o Dash
- de product site tro thanh app shell
- them AI truoc khi co observability va guardrails

---

## 16. Roadmap ky thuat dung

### Phase 1 - Foundation Truth
- migrations chuan
- auth / session that
- workspace scope that
- flows CRUD that
- executions that

### Phase 2 - Builder Truth
- drafts
- versions
- publish
- preview
- node catalog
- templates
- builder facade
- collaboration lock co ban

### Phase 3 - Runtime Truth
- step logs that
- dashboard that
- inspector that
- durable coordinator
- queue integration
- waiting states co ban

### Phase 4 - Agent Truth
- prompt nodes
- agent nodes
- tool system
- reasoning traces
- memory boundary
- agent observability

### Phase 5 - Commercial Truth
- Stripe
- usage ledger
- quota
- credits
- seats
- billing dashboard
- API keys
- entitlement checks

### Phase 6 - Evolution Truth
- recommendations
- semantic template search
- pattern learning
- config suggestions
- optimization insights

---

## 17. Lien he truc tiep voi Dash

Vi `dash.iai.one` la app that sau dang nhap, team Dash phai hieu:
- Dash khong duoc bia runtime
- Dash phai doc tu runtime truth
- Dash la noi con nguoi hieu, quyet dinh, kiem soat va xac nhan nhung gi Flow dang van hanh
- moi nang cap Decision Layer cua Dash deu phai dua tren 4 truth nen:
- execution truth
- memory truth
- proof truth
- action truth

Flow la noi chay.
Dash la noi dieu khien su song cua nhung thu dang chay.

---

## 18. Cau chot cho DEV

Flow Engine khong duoc xay nhu:

mot workflow executor co them vai node AI

Flow Engine phai duoc xay nhu:

mot living execution system co kha nang dieu phoi, ghi nho, quan sat, phuc hoi, giai thich va tien hoa theo thoi gian

---

## 19. Cau chot cho team Dash

Dash khong duoc nhin Flow nhu mot backend logs engine.
Dash phai nhin Flow nhu mot living execution fabric.

Va vi vay, Dash phai tien hoa tuong ung thanh:

living control system

---

## 20. Ket luan cuoi cung

Neu hieu sai phan nay, team se xay:
- mot builder tot hon
- mot runtime manh hon
- mot dashboard dep hon

Nhung van chi la mot workflow product.

Neu hieu dung phan nay, team co the xay:
- mot ha tang song cho hanh dong
- mot lop thuc thi co tri nho
- mot lop dieu khien co y nghia
- mot nen tang noi con nguoi, AI va he thong cung van hanh trong mot dong chay thong nhat

Va do moi la thu lam cho `flow.iai.one` khac han phan con lai cua thi truong.

---

Neu di tiep dung nhip, 2 phan nen viet ngay sau day la:

1. `RUNTIME_ENGINE_DEEP_SPEC.md`

Khoa:
- Workflows
- Durable Objects
- Queues
- retries
- waiting states
- approvals
- coordinator model

2. `FLOW_BUILDER_DEEP_SPEC.md`

Khoa:
- graph model
- drafts
- versions
- publish lifecycle
- template system
- preview architecture
- collaboration model
