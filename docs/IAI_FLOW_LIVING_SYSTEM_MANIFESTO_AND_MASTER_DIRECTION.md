# IAI_FLOW_LIVING_SYSTEM_MANIFESTO_AND_MASTER_DIRECTION

# IAI Flow - Living System Manifesto and Master Direction
## Version 1.0
## Status: LOCKED FOR FLOW / DASH / API.FLOW / PRODUCT / DESIGN / CONTENT
## Scope: flow.iai.one / dash.iai.one / api.flow.iai.one
## Date: 2026-04-15

---

## 1. Tuyen ngon cot loi

IAI Flow khong duoc sinh ra de tro thanh mot cong cu keo tha, mot phan mem automation, hay mot ban sao tot hon cua nhom workflow tools hien co.

IAI Flow duoc sinh ra de tro thanh mot ha tang song cho hanh dong:
- noi hanh dong khong chi duoc xu ly, ma duoc to chuc thanh dong chay co y nghia
- noi con nguoi khong bi ep phai tu duy nhu may
- noi AI khong chi la bo tang toc cho thao tac cu
- noi du lieu, ngu canh, quyet dinh, ky uc va sang tao noi vao nhau thanh mot he van hanh dang song

Neu workflow cu la so do cua nhung gi da biet truoc, thi Flow la truong van dong cua nhung gi dang dien ra.
Neu workflow cu la cach con nguoi day may lap lai, thi Flow la cach con nguoi, AI va he thong cung hoc cach thich nghi.

Vi vay, IAI Flow khong duoc mo ta la:
- "mot cach moi de lam automation"

IAI Flow phai duoc mo ta la:
- "mot cach moi de to chuc su song cua hanh dong"

---

## 2. Dinh nghia tuyet doi

IAI Flow la mot nen tang van hanh song, noi moi hanh dong, du lieu, tri tue, ky uc va sang tao duoc to chuc thanh cac dong chay co the:
- quan sat
- dieu phoi
- mo rong
- ghi nho
- tien hoa theo thoi gian thuc

IAI Flow dong thoi la:
- mot Flow Engine de chay cac dong van hanh
- mot Flow Builder de thiet ke cac dong van hanh
- mot Flow Runtime de dieu phoi cac dong van hanh
- mot Flow Memory de tich luy va tai su dung tri nho van hanh
- mot Flow Control Plane de quan tri toan bo he
- mot Flow Ecosystem de nhieu con nguoi, nhieu agent, nhieu to chuc cung sang tao trong do

---

## 3. Su khac biet can ban voi the gioi hien tai

Nhieu workflow platforms hien tai van dua tren 4 gia dinh cu:
- quy trinh phai duoc dinh nghia co dinh tu dau
- moi node chi la mot hanh dong cuc bo, it tri tue
- he thong chi manh khi nguoi dung cau hinh chi tiet moi thu
- gia tri nam o so luong integration va toc do automation

IAI Flow di theo gia dinh nguoc lai:
- dong van hanh co the doi theo ngu canh
- moi node co the la mot tac nhan nhan thuc, khong chi la mot hanh dong ky thuat
- y dinh di truoc cau hinh
- gia tri lon nhat nam o kha nang to chuc tri tue song thanh hanh dong co chat luong cao

Vi vay:
- workflow tools thuoc logic cong nghiep cua quy trinh
- IAI Flow thuoc logic hau cong nghiep cua he song

---

## 4. Ban chat triet hoc cua "Flow"

"Workflow" noi ve cong viec duoc sap xep.
"Flow" noi ve su song duoc van hanh.

Flow khong phai duong di tu A den B.
Flow la kha nang cua mot he thong duy tri su lien tuc giua:
- muc tieu
- ngu canh
- phan hoi
- thay doi

Trong mot Flow dung nghia:
- moi dau vao mang theo lich su
- moi quyet dinh tao ra he qua
- moi ket qua de lai ky uc
- moi ky uc thay doi nhung lan chay sau

Vi vay, Flow khong chi la chuoi buoc.
Flow la truong tuong tac giua:
- con nguoi
- AI
- du lieu
- cong cu
- thoi gian
- trang thai
- y nghia

---

## 5. Tam nhin cong nghe cap cao

IAI Flow phai duoc xay thanh he nhieu lop, nhung moi lop phai phuc vu mot dong chay thong nhat.

### 5.1 Nhan thuc

Noi he hieu:
- muc tieu
- boi canh
- loai cong viec dang dien ra

Bao gom:
- agent nodes
- classifiers
- planners
- semantic search
- memory
- recommendation

### 5.2 Dieu phoi

Noi he quyet dinh:
- thu gi chay truoc
- thu gi cho
- thu gi can phe duyet
- thu gi can retry
- thu gi tach sang queue
- thu gi trigger sang subflow

Bao gom:
- workflow runtime
- queue orchestration
- durable execution
- state machine
- coordination objects

### 5.3 Hanh dong

Noi node thuc su thuc thi:
- goi API
- luu du lieu
- gui tin hieu
- tao artifact
- ghi logs
- cap nhat records
- kich hoat webhooks

### 5.4 Ky uc

Noi he tich luy hieu biet ve:
- flows
- templates
- nodes
- lich su run
- agent decisions
- pattern thanh cong / that bai

Day khong chi la storage.
Day la memory architecture cua nen tang.

### 5.5 Quan sat

Noi moi thu duoc nhin thay lai:
- dashboard
- traces
- execution timelines
- node inspector
- audit
- billing
- health
- reliability

### 5.6 Tien hoa

Noi he khong chi chay nhu cu ma hoc tu lich su de:
- de xuat template
- toi uu config
- phat hien diem nghen
- tang chat luong execution
- tang suc sang tao cua nguoi dung

---

## 6. Kien truc san pham can chot

### 6.1 Product Plane - `flow.iai.one`

`flow.iai.one` phai la:
- product site
- trust site
- onboarding site
- thought platform cua category moi

No KHONG phai:
- app production that
- dashboard dang nhap
- noi mang du am marketing SaaS re tien

No phai noi ro:
- IAI Flow la gi
- IAI Flow khac gi
- IAI Flow danh cho ai
- vi sao day la buoc chuyen tu automation sang living orchestration

### 6.2 App Plane - `dash.iai.one`

`dash.iai.one` la noi user buoc vao dong chay that.
No la app production that.

No phai co:
- session that
- workspace that
- state that
- logs that
- runtime truth

No khong duoc mang:
- du am marketing
- hero language
- promises giong landing page

`dash.iai.one` phai duoc thiet ke nhu:
- Flow Control Plane
- Flow Runtime App
- noi thay, dieu khien, phe duyet, retry, inspect, audit

### 6.3 Execution Plane - `api.flow.iai.one`

`api.flow.iai.one` la mat phang dieu phoi va thuc thi.
No la execution plane va control plane authority.

No phai gom mot nguon su that thong nhat cho:
- auth
- session
- flows
- drafts
- versions
- templates
- executions
- queues
- nodes
- logs
- traces
- billing

---

## 7. Stack cong nghe chot

Cong nghe duoc chon vi phuc vu Flow, khong phai vi ban than chung la trung tam.

- Cloudflare Workflows: durable execution core
- Durable Objects: coordination core cho live sessions, locks, presence, run state
- Queues: phan phoi bat dong bo va dam bao giao viec
- D1: metadata store
- R2: artifact / object storage
- Vectorize: semantic layer
- OpenAI Agents SDK: agent orchestration layer
- Stripe: billing
- OpenTelemetry conventions: observability standard

Khong cong nghe nao duoc phep tro thanh "product center".
Trung tam cua he la:
- Flow

Cong nghe chi la vat lieu de Flow song duoc.

---

## 8. He con nguoi trong IAI Flow

IAI Flow khong duoc day con nguoi xuong vai tro "nguoi bam nut".

IAI Flow phai lam con nguoi:
- manh hon
- sau hon
- sang tao hon

Dieu nay nghia la:
- nguoi dung khong bi buoc phai tu duy nhu may
- nguoi dung khong phai cau hinh qua chi tiet de he moi chay
- nguoi dung co the bat dau tu y dinh, cau hoi, boi canh, nhu cau song
- he thong se cung ho to chuc nhung y dinh do thanh dong van hanh co the thuc thi

IAI Flow la ha tang lam tang tri tue song cua con nguoi.
No khong phai he thong bien con nguoi thanh thao tac vien cua automation.

---

## 9. Sang tao la ha tang, khong phai tinh nang phu

IAI Flow khong xem sang tao la mot tinh nang.
Sang tao phai la ban chat cua nen tang.

Nen tang phai cho phep:
- mot ca nhan tao flow rieng cua minh
- mot nhom tao he van hanh rieng
- mot doanh nghiep tao logic rieng
- mot cong dong tao pattern song rieng
- mot agent hoc tu nhung dieu do va de xuat huong di moi

Vi vay, IAI Flow khong chi can builder.
No can creative substrate:
- lop nen de con nguoi thiet ke
- sua doi
- thi nghiem
- tien hoa dong van hanh cua chinh minh

---

## 10. Tang so huu tri tue va khac biet khong de sao chep

Doi thu co the sao chep UI.
Ho co the sao chep node catalog.
Ho co the sao chep ten mot vai tinh nang.

Nhung ho kho sao chep 3 thu neu IAI Flow khoa dung tu dau:

### 10.1 Triet ly nen
- Flow nhu mot he van hanh song
- khong phai workflow tool cai tien

### 10.2 Kien truc nhan thuc
- con nguoi
- AI
- memory
- execution
- observability
- evolution

Tat ca nam trong mot he thong duy nhat.

### 10.3 Ngon ngu he thong

Cach goi ten, mo ta, to chuc va van hanh IAI Flow phai duoc thong nhat nhu mot he van minh van hanh moi.

Cac cum tu phai duoc dung thong nhat:
- IAI Flow
- Living Flow Architecture
- Flow Control Plane
- Flow Runtime
- Flow Memory
- Flow Evolution Layer
- Creative Execution Infrastructure
- Human-AI Flow Orchestration

Nhung cum nay phai di vao:
- website
- docs
- API docs
- whitepaper
- pitch deck
- UI copy
- product language

---

## 11. Tuyen bo ban quyen va quyen tac gia

IAI Flow can duoc dinh nghia la he thong cong nghe, triet ly van hanh va mo hinh to chuc tri tue do nha sang lap Tran Ha Tam xay dung.

Phan bao ho khong chi nam o code, ma nam o:
- ten goi
- ngon ngu mo ta
- framework triet hoc
- kien truc dieu phoi
- logic phan tang
- template system
- node semantics
- flow lifecycle model
- agent-flow interaction model

Noi cach khac, IP khong chi la "phan mem".
No la mo hinh van hanh song cua nen tang.

---

## 12. Kien truc trai nghiem nguoi dung cuoi

### 12.1 Nguoi moi

Bat dau tu:
- y dinh
- template
- preview dau tien
- output dau tien

Khong bat dau tu so do ky thuat.

### 12.2 Nguoi van hanh

Can:
- dashboard
- logs
- retries
- approvals
- schedules
- status
- health
- permissions

### 12.3 Nguoi sang tao

Can:
- builder
- drafts
- versions
- preview
- template cloning
- memory-aware suggestions
- node catalog
- smart defaults

### 12.4 Developer

Can:
- docs ro
- API ro
- schemas ro
- webhooks ro
- node contracts ro
- auth/session ro
- examples ro
- changelog ro

---

## 13. Cau truc san pham cuoi cung

### `flow.iai.one`
- product site
- trust site
- onboarding site
- thought platform

### `developer.iai.one`
- developer portal cho toan he `*.iai.one`

### `dash.iai.one`
- app that
- runtime that
- builder that
- logs that

### `api.flow.iai.one`
- backend execution plane
- control plane authority

---

## 14. Lo trinh cong nghe nhieu lop

### Phase 1 - Foundation Truth
- auth that
- session that
- workspace that
- flows that
- executions that
- logs that
- templates that

### Phase 2 - Builder Truth
- drafts
- versions
- publish
- preview
- node catalog
- template install
- builder facade
- collaboration lock

### Phase 3 - Runtime Truth
- durable execution
- queues
- coordinator DO
- state machine
- retries
- inspector
- dashboard

### Phase 4 - Agent Truth
- prompt nodes
- agent nodes
- tool system
- memory
- reasoning traces
- agent dashboard

### Phase 5 - Commercial Truth
- Stripe
- usage
- credits
- seats
- billing dashboard
- API keys
- limits

### Phase 6 - Evolution Truth
- recommendations
- auto-suggestions
- semantic template search
- pattern learning
- optimization insights

---

## 15. Tieu chi "khong co doi thu"

Khong co doi thu khong co nghia la khong ai lam AI hay automation.
No co nghia la category cua IAI Flow khac han.

De giu dieu do, phai khoa 3 dieu:
- khong tu mo ta minh nhu workflow tool
- khong tu keo san pham xuong thanh low-code automation
- khong de product language roi vao ngon ngu cua doi thu hien tai

Thay vao do, phai luon giu cach noi:
- living flow
- control plane
- runtime truth
- creative execution
- human-AI orchestration
- evolving system
- flow memory
- flow intelligence

---

## 16. Cau chot cuoi cung

IAI Flow khong phai phan mem de con nguoi lam viec nhanh hon.
IAI Flow la ha tang de con nguoi, AI va he thong cung buoc vao mot dong chay van hanh:
- co y nghia hon
- sang tao hon
- sau hon
- va co kha nang tien hoa hon

Khi hieu dung nhu vay, moi quyet dinh ve:
- code
- UI
- runtime
- agent
- docs
- domain
- billing
- auth
- execution

se tu dong di dung huong.

---

## 17. Chi dao cho Team Flow va Team Dash

Team `flow.iai.one` phai giu category language.

Team `dash.iai.one` phai giu runtime truth.

Moi nang cap moi cua Dash phai duoc do theo 4 cau hoi:
- no co lam ro hon control plane khong?
- no co tang kha nang quan sat va dieu phoi khong?
- no co phuc vu living orchestration thay vi chi them feature khong?
- no co giu dung ngon ngu he thong cua IAI Flow khong?

Neu cau tra loi la khong, nang cap do khong dung huong.

---

## 18. File nen viet tiep ngay

Da khoa:
- `FLOW_ENGINE_MASTER_ARCHITECTURE.md`
- `DASH_IAI_ONE_LIVING_CONTROL_SYSTEM_MANIFESTO_AND_MASTER_DIRECTION.md`
- `DASH_IAI_ONE_RUNTIME_APP_SPEC.md`
- `DASH_IAI_ONE_FULL_PLATFORM_SPEC.md`

Hai file nen duoc khoa tiep ngay:
- `RUNTIME_ENGINE_DEEP_SPEC.md`
- `FLOW_BUILDER_DEEP_SPEC.md`

Mot file de khoa graph model + builder model + drafts / versions / publish.
Mot file de khoa Workflows + DO + Queues + retries + approvals + orchestration.
