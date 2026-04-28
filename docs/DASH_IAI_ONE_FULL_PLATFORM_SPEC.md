# DASH_IAI_ONE_FULL_PLATFORM_SPEC
## Final product, UX, system and execution specification for dash.iai.one
## Version 1.0
## Status: LOCKED FOR DASH / FLOW / API.FLOW / PRODUCT / DESIGN / DEV
## Scope: dash.iai.one
## Date: 2026-04-15

---

## 1. Dinh nghia tuyet doi

`dash.iai.one` khong phai la "trang lam viec".
`dash.iai.one` la:

- application runtime surface chinh thuc cua IAI Flow
- living control system
- workspace operating environment
- execution command center
- noi con nguoi buoc vao, dieu khien, quan sat va tien hoa dong chay van hanh that

Neu `flow.iai.one` la noi giai thich Flow la gi,
thi `dash.iai.one` la noi Flow thuc su song.

Dash phai la:
- noi user dang nhap
- noi user tao flow
- noi user mo builder
- noi user preview
- noi user publish
- noi user chay runtime that
- noi user theo doi execution
- noi user xem logs, metrics, agents, usage, settings
- noi user quan tri workspace

Dash khong phai la:
- landing page
- brochure
- docs page
- demo playground
- mini preview site

---

## 2. Muc tieu toi thuong

Muc tieu cua Dash khong chi la cho nguoi dung "su dung phan mem".
Muc tieu la cho nguoi dung:

- buoc vao mot workspace song
- tao ra cac dong van hanh cua rieng ho
- thay he thong cua ho dang chay that
- hieu dieu gi dang xay ra
- dieu chinh he theo y dinh
- cong tac voi nguoi khac
- phoi hop voi AI
- quan sat gia tri, chi phi, hieu qua va huong tien hoa

Dash phai la noi bien:

y dinh -> thiet ke -> thuc thi -> quan sat -> toi uu -> tien hoa

thanh mot vong khep kin.

---

## 3. Tuyen ngon UX

### 3.1 App-first

Dash khong duoc mang bat ky logic marketing nao.
Moi pixel phai phuc vu:
- clarity
- speed
- trust
- control
- continuity

### 3.2 Runtime truth first

Dash khong duoc hien thi du lieu gia de "trong co ve song".
Neu chua co data that:
- hien thi empty state tot
- hoac seeded sample state co ghi ro
- tuyet doi khong gia lam live system

### 3.3 Workspace-first

Nguoi dung khong vao "mot tai khoan".
Nguoi dung buoc vao "mot workspace song".

### 3.4 Flow-first

Moi core experience deu xoay quanh:
- flow
- execution
- runtime
- logs
- agents
- settings
- value creation

### 3.5 Human-centered intelligence

Dash phai lam cho con nguoi manh hon.
Khong duoc khien user bi chim trong panel phuc tap hoac jargon ky thuat.

---

## 4. Truc san pham cot loi

Dash phai xoay quanh 6 truc:

### 4.1 Flows

Tao, chinh sua, quan tri vong doi flow.

### 4.2 Runtime

Xem nhung gi dang chay, da chay, dang cho, dang loi, dang retry.

### 4.3 Intelligence

Agents, prompts, tool usage, memory, recommendations.

### 4.4 Collaboration

Workspace, members, locks, roles, shared assets.

### 4.5 Governance

Permissions, audit, secrets, API keys, safety.

### 4.6 Commercial

Usage, credits, billing, plans, entitlements.

---

## 5. Routing chuan toan he Dash

### 5.1 Auth
- `/login`
- `/logout`
- `/auth/callback/google`
- `/auth/callback/github`
- `/invite/accept`
- `/reset-password`
- `/magic-link`

### 5.2 App root
- `/`
- `/dashboard`

### 5.3 Flow lifecycle
- `/flows`
- `/flows/new`
- `/flows/:flowId`
- `/flows/:flowId/builder`
- `/flows/:flowId/versions`
- `/flows/:flowId/drafts`
- `/flows/:flowId/publish`
- `/flows/:flowId/import-export`

### 5.4 Runtime
- `/runtime`
- `/runtime/executions`
- `/runtime/executions/:executionId`
- `/runtime/executions/:executionId/steps/:nodeId`
- `/runtime/queue`
- `/runtime/health`

### 5.5 Nodes & templates
- `/nodes`
- `/nodes/:nodeType`
- `/templates`
- `/templates/:templateId`
- `/templates/:templateId/install`

### 5.6 Workspace
- `/workspace`
- `/workspace/members`
- `/workspace/roles`
- `/workspace/secrets`
- `/workspace/apikeys`
- `/workspace/audit`

### 5.7 User
- `/profile`
- `/preferences`
- `/notifications`

### 5.8 Billing
- `/billing`
- `/billing/usage`
- `/billing/plans`
- `/billing/invoices`

### 5.9 Future
- `/agents`
- `/agents/runs`
- `/memory`
- `/insights`
- `/recommendations`

---

## 6. Global shell architecture

### 6.1 Layout tong the

[Left Navigation] [Top Command Bar]  
[Main View]  
[Optional Right Inspector / Bottom Console]

### Cac lop layout
- App shell
- Global command bar
- Context navigation
- View container
- Optional detail rail
- Toast / modal / command palette layer

### 6.2 Left navigation

Sections bat buoc:
- Dashboard
- Flows
- Runtime
- Logs
- Nodes
- Templates
- Workspace
- Settings

Sections tuong lai:
- Agents
- Billing
- Insights

Footer navigation:
- Workspace switcher
- User menu
- Logout

### 6.3 Top command bar

Phai co:
- global search
- workspace identity
- quick actions
- notifications
- current status badge
- command palette trigger

Quick actions:
- new flow
- install template
- preview current flow
- run current flow

---

## 7. Authentication va entry flow

### 7.1 Login requirements

Ho tro:
- email / password
- magic link
- OAuth (Google / GitHub)
- invite acceptance
- workspace join

### 7.2 Root behavior

Neu co session:
- redirect `/dashboard`

Neu khong co session:
- redirect `/login`

### 7.3 App guard

Moi route trong Dash phai co auth guard.
Khong co ngoai le cho:
- builder
- runtime
- logs
- nodes
- settings
- workspace

### 7.4 Post-login landing

Sau login, user khong nen bi nem vao builder trong ngay.
Luong toi uu:
- dashboard tong quan
- neu workspace moi hoan toan -> onboarding card noi bat
- neu chua co flow -> CTA "Create your first flow"
- neu da co flow -> recent flows + recent runs

---

## 8. Dashboard module

### 8.1 Muc tieu

Dashboard la overview + action surface.
Khong phai danh sach tat ca moi thu.

### 8.2 Thanh phan bat buoc

- recent flows
- recent runs
- success / fail summary
- active runtime summary
- workspace activity
- quick actions
- onboarding state

### 8.3 KPI cards toi thieu

- total runs last 7 / 30 days
- success rate
- average duration
- active flows
- current plan / usage summary

### 8.4 Empty state

Neu user moi:
- create flow
- install template
- open docs
- invite teammate

---

## 9. Flow list module

### 9.1 Muc tieu

Cho user nhin thay toan bo flow cua workspace va hanh dong nhanh.

### 9.2 Table / List columns

- name
- status
- last updated
- last run
- latest run status
- version
- owner / creator
- actions

### 9.3 Actions

- open
- builder
- preview
- run
- duplicate
- archive
- delete
- export

### 9.4 Filters

- draft
- published
- archived
- recently updated
- by owner
- by template source

---

## 10. Flow detail module

### 10.1 Muc tieu

Cho user thay flow nhu mot thuc the song:
- definition
- lifecycle
- versions
- drafts
- runs
- settings

### 10.2 Tabs

- Overview
- Builder
- Runs
- Drafts
- Versions
- Publish
- Settings
- Audit

---

## 11. Builder module

### 11.1 Muc tieu

Builder la noi user thiet ke dong chay song.

### 11.2 Layout

- left node palette
- center canvas
- right inspector
- bottom console / validation rail

### 11.3 Left palette

- categories
- search
- favorites
- suggested nodes
- recent nodes

### 11.4 Canvas

- graph
- zoom / pan
- node placement
- edge connection
- branch labels
- selected state
- mini map optional

### 11.5 Inspector

- node description
- config form
- capability info
- secret needs
- IO schema
- examples
- warnings / errors

### 11.6 Bottom rail

- draft status
- validation status
- preview output
- publish readiness
- collaboration lock status

### 11.7 Actions

- autosave
- validate
- preview
- publish
- install template into canvas
- create version snapshot

### 11.8 Builder modes

- design mode
- preview mode
- read-only mode
- locked mode

---

## 12. Drafts module

### 12.1 Vai tro

Draft la working memory cua Flow Builder.

### 12.2 UX bat buoc

- autosave status ro
- manual save snapshot neu can
- restore draft
- delete draft
- compare with published sau nay

### 12.3 States

- saved
- saving
- unsaved
- invalid
- conflict
- restore-ready

---

## 13. Versions module

### 13.1 Vai tro

Versions la history co the quay lai.

### 13.2 UX bat buoc

- version list
- created time
- creator
- status
- restore action
- publish marker

### 13.3 Future

- visual diff
- draft vs version compare
- published vs restored compare

---

## 14. Publish module

### 14.1 Muc tieu

Publish la mot hanh dong nghiem tuc, khong phai nut bam qua loa.

### 14.2 Preconditions

- validation pass
- required secrets exist
- role du quyen
- lock hop le neu can
- no blocking runtime guard

### 14.3 Publish result

- status = published
- version increment
- audit log
- publication record
- builder state sync

### 14.4 UI

- publish summary
- checklist
- errors / warnings
- confirmation
- success state ro

---

## 15. Runtime module

### 15.1 Muc tieu

Runtime la trung tam nhin vao dong chay dang song.

### 15.2 Views

- execution list
- execution detail
- waiting approvals
- retries
- failed runs
- active queue
- runtime health

### 15.3 Execution list columns

- execution id
- flow
- status
- mode
- duration
- startedAt
- updatedAt
- user
- actions

### 15.4 Execution detail

- summary
- timeline
- step list
- node status
- step inspector
- final output
- error summary
- retry history
- related logs

---

## 16. Logs module

### 16.1 Muc tieu

Logs la noi debug va kiem chung.

### 16.2 Types

- execution logs
- step logs
- system logs
- audit logs
- future agent traces

### 16.3 Filters

- workspace
- flow
- execution
- node
- status
- time range
- mode (preview / run)

### 16.4 UX

- searchable
- copyable
- structured
- raw JSON mode
- formatted mode

---

## 17. Node catalog module

### 17.1 Muc tieu

Node catalog la thu vien kha nang that cua he.

### 17.2 Noi dung

- node categories
- node detail
- schema
- preview support
- secret requirements
- examples
- stable / experimental

### 17.3 UI actions

- add to builder
- view docs
- view examples

---

## 18. Templates module

### 18.1 Muc tieu

Template la cach nhanh nhat de di tu y dinh den runtime.

### 18.2 Noi dung

- template list
- category
- description
- preview
- install
- recommended templates

### 18.3 Install flow

- choose template
- choose name
- install into workspace
- open builder immediately

---

## 19. Workspace module

### 19.1 Muc tieu

Workspace la don vi song cua toan bo he.

### 19.2 Noi dung

- workspace info
- members
- roles
- invitations
- secrets
- API keys
- audit

### 19.3 Role surfaces

- owner
- admin
- builder
- operator
- viewer

---

## 20. Settings module

### 20.1 User settings

- display name
- avatar
- language
- timezone
- notifications

### 20.2 Workspace settings

- workspace name
- default runtime settings
- environment settings
- integrations later

---

## 21. Billing module

### 21.1 Muc tieu

Cho user thay ro:
- minh dang dung gi
- ton gi
- plan nao
- gioi han nao

### 21.2 Noi dung

- plan
- seats
- runs
- usage summary
- token usage
- premium nodes
- invoices
- alerts

---

## 22. AI / Agent module

### 22.1 Giai doan dau

Khong bat buoc la page rieng, nhung Dash phai chuan bi panel de:
- xem agent nodes
- xem tool calls
- xem preview output
- xem reasoning summary sau nay

### 22.2 Giai doan sau

Co the mo:
- `/agents`
- `/agents/runs`
- `/memory`
- `/insights`

---

## 23. Collaboration module

### 23.1 Locking

- acquire lock
- renew lock
- release lock
- force takeover (owner / admin)

### 23.2 Presence sau nay

- ai dang online
- ai dang edit
- ai vua publish

### 23.3 Read-only behavior

Neu khong giu lock:
- builder mo read-only
- van inspect duoc
- khong duoc sua

---

## 24. Search and command system

### 24.1 Global search

Phai tim duoc:
- flows
- executions
- templates
- nodes
- docs links sau nay

### 24.2 Command palette

Phai cho phep:
- create flow
- install template
- preview flow
- run flow
- open runtime
- open logs

---

## 25. Notifications and system feedback

### 25.1 Toasts

- save success
- publish success
- preview failed
- run failed
- lock conflict
- session expired

### 25.2 Alert banners

- runtime degraded
- queue lag
- billing threshold reached
- auth / session issue

---

## 26. Empty states

Khong duoc dung loading gia dai han.
Moi man hinh phai co empty state thong minh.

### Vi du

- no flows -> create flow / install template
- no runs -> run your first flow
- no logs -> preview or run to see execution truth
- no node selected -> chon node de cau hinh

---

## 27. Error model

Dash phai phan biet ro:
- auth errors
- permission errors
- validation errors
- runtime errors
- network errors
- billing / quota errors

Error copy phai:
- ngan
- ro
- actionable

---

## 28. Data contract with backend

Dash phai goi duy nhat:
- `https://api.flow.iai.one`

Moi request:
- `credentials: "include"`
- JSON
- error handling centralized

Dash khong tu suy ra session tu `localStorage` neu session chuan la `HttpOnly cookie`.

---

## 29. Observability in Dash

Dash phai la noi nhin thay:
- runtime summary
- run detail
- step detail
- queue health
- dashboard metrics
- node-level inspection

Dash khong duoc noi ve "runtime" neu khong co runtime truth that sau lung.

---

## 30. Performance principles

- shell load nhanh
- module lazy load
- builder khong load neu user chua mo
- cache catalog / templates
- debounce save / search / validate
- optimistic UI chi dung khi an toan

---

## 31. Security principles

- auth guard toan app
- no secret in frontend
- workspace isolation
- permission-aware rendering
- audit for sensitive actions
- clear logout path

---

## 32. Accessibility and multilingual

- keyboard navigable
- readable error states
- mobile responsive du dung
- VI / EN consistent
- obey `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- English-first default, Vietnamese first-class

---

## 33. Definition of done

Dash phase 1 chi duoc coi la hoan chinh khi:
1. user login thanh cong
2. dashboard load session that
3. flow list doc du lieu that
4. mo builder that
5. save draft that
6. validate that
7. preview that
8. publish that
9. run that
10. runtime view execution that
11. logs view step logs that
12. lock hoat dong dung
13. no fake loading as default
14. no marketing in dash

---

## 34. Cau chot cho DEV

`dash.iai.one` khong phai dashboard dep hon.
No la runtime application surface chinh thuc cua IAI Flow.
Moi quyet dinh ve UI, route, state, API, permissions va modules deu phai xoay quanh dieu do.

---

## 35. Implementation lock

Execution order cho dev duoc khoa tai:
- `docs/DASH_IAI_ONE_IMPLEMENTATION_BACKLOG_2026.md`
- `docs/DASH_IAI_ONE_RELEASE_GATE_2026.md`
