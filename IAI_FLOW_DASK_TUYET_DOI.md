# IAI_FLOW_DASK_TUYET_DOI
## Canonical absolute direction for `flow.iai.one` and `dash.iai.one`
## Version 2.0
## Status: DRAFT_FOR_FOUNDER_REVIEW_ONLY
## Effective only after explicit founder approval

---

## 0. Approval lock

File này được tinh chỉnh để phục vụ vòng duyệt cuối cùng của founder.

Hard rule:
- chưa được dùng làm lệnh triển khai cho team
- chưa được xem là execution directive đang có hiệu lực
- chưa được phép dùng để mở scope mới, đổi roadmap, hay phát lệnh release

Cho tới khi founder duyệt:
- các locked docs hiện hành vẫn là operational truth
- Team 1 chưa được cascade file này xuống các team
- không team nào được tự viện dẫn file này để claim GO

---

## 1. Định nghĩa tuyệt đối

### 1.1 `flow.iai.one`

`flow.iai.one` không phải workflow builder.

`flow.iai.one` là living execution surface của IAI Flow:
- nơi ý định được chuyển thành flow definition
- nơi flow được thiết kế, validate, preview, publish
- nơi hệ giải thích Flow là gì và vì sao nó khác workflow tooling
- nơi con người bước vào logic vận hành sống của hệ

### 1.2 `dash.iai.one`

`dash.iai.one` không phải dashboard mỏng.

`dash.iai.one` là living control system:
- application runtime surface chính thức của IAI Flow
- nơi user đăng nhập và đi vào workspace thật
- nơi user điều khiển, quan sát, phê duyệt, kiểm tra và tiến hóa các flow đang chạy thật
- nơi runtime truth, memory truth, proof truth và action truth được nhìn thấy lại

### 1.3 Quan hệ giữa hai bề mặt

`flow.iai.one` không thay thế `dash.iai.one`.
`dash.iai.one` cũng không nuốt vai trò của `flow.iai.one`.

Quan hệ chuẩn là:
- `flow.iai.one` = living execution surface
- `dash.iai.one` = living control system
- `api.flow.iai.one` = execution authority

`flow.iai.one` giúp định hình dòng chảy.
`dash.iai.one` giúp điều khiển dòng chảy đang sống.

---

## 2. Root rule

Từ gốc tới ngọn, hệ này phải giữ đúng một logic:

- Flow không được rơi về “workflow tool”
- Dash không được rơi về “logs dashboard”
- runtime không được bị che giấu sau UI
- UI không được bịa dữ liệu để trông có vẻ sống
- preview không được giả làm production
- marketing không được chảy vào app surface

Nếu hiểu sai phần này, team sẽ xây:
- một builder tốt hơn
- một runtime mạnh hơn
- một dashboard đẹp hơn

Nhưng vẫn chỉ là workflow software.

Nếu hiểu đúng, team mới xây được:
- living execution system
- living control system
- control plane có trí nhớ
- hạ tầng nơi con người, AI và hệ thống cùng vận hành trong một dòng chảy thống nhất

---

## 3. Đây không phải là gì

### 3.1 Không phải

- automation tool
- workflow builder
- low-code integration hub
- admin panel
- chart-only dashboard
- demo playground
- thin UI shell

### 3.2 Phải là

- living execution system
- living control system
- flow runtime
- flow control plane
- creative execution infrastructure
- human-AI orchestration substrate
- runtime truth system

---

## 4. Mục tiêu tối thượng

Mục tiêu của hệ không phải là “chạy được các bước”.

Mục tiêu là tổ chức:
- ý định
- ngữ cảnh
- quyết định
- hành động
- phản hồi
- ký ức
- tiến hóa

thành một vòng sống liên tục.

Vòng chuẩn của hệ là:

`Ý định -> Thiết kế -> Kiểm tra -> Preview -> Publish -> Thực thi -> Quan sát -> Quyết định -> Tiến hóa`

IAI Flow phải làm được:
- chạy flow bền vững
- chạy flow có trạng thái
- chạy flow có trí nhớ
- chạy flow chịu được lỗi
- chạy flow chờ được con người
- chạy flow phối hợp được với agent
- chạy flow giải thích được
- chạy flow mở rộng được thành control plane

---

## 5. Mô hình hệ thống chuẩn

### 5.1 Human

Con người không chỉ bấm nút.
Con người đưa vào:
- ý định
- ngữ cảnh
- mục tiêu
- giới hạn
- phán đoán

### 5.2 Flow

Flow không chỉ là graph các bước.
Flow là cấu trúc vận hành đang sống giữa:
- con người
- AI
- dữ liệu
- công cụ
- thời gian
- trạng thái
- ý nghĩa

### 5.3 Runtime

Runtime không chỉ dispatch node.
Runtime phải:
- giữ trạng thái
- điều phối bước
- pause/resume
- retry
- persist output
- giữ audit và proof

### 5.4 Dash

Dash không chỉ hiển thị log.
Dash phải cho phép:
- hiểu điều gì đang xảy ra
- hành động đúng lúc
- phê duyệt đúng chỗ
- kiểm tra bằng chứng
- nhìn thấy chi phí, usage, health và risk

### 5.5 Memory

Memory không phải helper data.
Memory là một phần của hệ thực thi:
- flow nhớ các lần chạy trước
- agent nhớ quyết định và mẫu thành công/thất bại
- hệ tích lũy pattern để đề xuất và tối ưu

### 5.6 Evolution

Tiến hóa không phải “thêm tính năng sau”.
Tiến hóa là khả năng hệ học từ lịch sử và thay đổi chất lượng vận hành theo thời gian.

---

## 6. Kiến trúc lõi của Flow

### 6.1 Definition layer

Quản lý:
- flow definitions
- drafts
- versions
- publications
- templates
- node metadata
- ownership
- compatibility

Câu hỏi lớp này trả lời:
“Flow này là gì, đang ở phiên bản nào, ai sở hữu, có thể dùng ở đâu?”

### 6.2 Validation layer

Kiểm tra:
- graph validity
- node config schema
- edge validity
- required secrets
- role permissions
- policy safety
- prompt/tool guardrails

Câu hỏi lớp này trả lời:
“Flow này có hợp lệ và an toàn để preview, publish, run hay không?”

### 6.3 Execution layer

Thực hiện:
- compile definition thành execution plan
- tạo execution instance
- dispatch step
- chuyển state
- persist output
- complete/fail/cancel đúng luật

Câu hỏi lớp này trả lời:
“Flow này đang chạy ra sao, ở trạng thái nào, bước tiếp theo là gì?”

### 6.4 Coordination layer

Giữ sự sống của tiến trình:
- run ownership
- claim/release
- locks
- waiting approvals
- collaboration
- resume/cancel/retry orchestration

Câu hỏi lớp này trả lời:
“Ai đang giữ quyền điều phối, và có xung đột hay không?”

### 6.5 Node layer

Mỗi node phải là một thực thể kỹ thuật đầy đủ:
- identity
- config schema
- IO contract
- capability flags
- security scope
- executor mapping
- side-effect profile

Câu hỏi lớp này trả lời:
“Mỗi node thực sự làm được gì, cần gì, và tạo ra gì?”

### 6.6 Agent layer

Cho phép một số node hoạt động như tác nhân nhận thức:
- hiểu context
- dùng tool
- đọc memory
- gọi subflow
- gợi ý hoặc hành động có kiểm soát

Câu hỏi lớp này trả lời:
“Hệ có thể tự hiểu và tự điều phối tới mức nào mà vẫn an toàn, minh bạch và kiểm soát được?”

### 6.7 Memory layer

Quản lý:
- execution memory
- flow memory
- template memory
- agent decision memory
- historical patterns

Câu hỏi lớp này trả lời:
“Hệ nhớ gì, nhớ ở đâu, và trí nhớ đó tác động thế nào lên lần chạy sau?”

### 6.8 Observability layer

Cung cấp:
- execution logs
- step logs
- traces
- metrics
- inspector
- health signals
- audit signals

Câu hỏi lớp này trả lời:
“Điều gì đã xảy ra, đang xảy ra, vì sao xảy ra, và hệ có khỏe không?”

### 6.9 Commercial layer

Theo dõi:
- usage
- quotas
- credits
- seats
- billing events
- premium node usage
- entitlement checks

Câu hỏi lớp này trả lời:
“Ai đang dùng gì, dùng bao nhiêu, bị giới hạn ở đâu, và hệ được thương mại hóa thế nào?”

---

## 7. Kiến trúc tuyệt đối của Dash

### 7.1 Mục tiêu

Dash là nơi con người:
- bước vào workspace sống
- tạo flow
- mở builder
- preview
- publish
- run runtime thật
- theo dõi execution
- xem logs, metrics, agents, usage, settings
- quản trị workspace

### 7.2 Vai trò sản phẩm

Dash phải là:
- app thật sau đăng nhập
- runtime application surface chính thức
- execution command center
- workspace operating environment

Dash không được là:
- landing page
- brochure
- docs page
- mini preview shell
- bề mặt marketing trá hình

### 7.3 Trục sản phẩm cốt lõi

Dash xoay quanh 6 trục:
- Flows
- Runtime
- Intelligence
- Collaboration
- Governance
- Commercial

### 7.4 Route families bắt buộc

Dash phải tối thiểu có các route families sau:
- `/dashboard`
- `/flows`
- `/flows/:flowId/builder`
- `/flows/:flowId/versions`
- `/flows/:flowId/drafts`
- `/flows/:flowId/publish`
- `/runtime`
- `/runtime/executions`
- `/logs`
- `/nodes`
- `/templates`
- `/workspace`
- `/billing`

### 7.5 Global shell

Dash shell chuẩn gồm:
- left navigation
- top command bar
- main view
- optional right inspector
- optional bottom console

### 7.6 UX rules không được phá

Dash phải giữ:
- app-first
- runtime truth first
- workspace-first
- flow-first
- human-centered intelligence

Điều này có nghĩa là:
- không fake live data
- không marketing logic
- không jargon vô ích
- không dark pattern
- không ẩn state quan trọng khỏi user

### 7.7 Dash hard rules

Mọi route trong Dash phải:
- có auth guard
- dùng session thật
- resolve workspace thật
- check role thật
- render theo permission thật

Mọi request từ frontend phải:
- đi qua `https://api.flow.iai.one`
- dùng `credentials: "include"`
- dùng error handling tập trung

Dash không được:
- suy session từ localStorage nếu hệ chuẩn là HttpOnly cookie
- lộ secret ra frontend
- hiển thị data giả như data thật

---

## 8. Truth contract giữa Flow và Dash

### 8.1 Runtime truth

Dash phải đọc runtime truth từ backend authority.
Dash không được tự bịa:
- execution status
- queue state
- retry history
- health status

### 8.2 Memory truth

Dash chỉ được nói về memory khi memory thật đã tồn tại.
Không được render “AI intelligence” như một lớp trang trí nếu chưa có memory boundary thật.

### 8.3 Proof truth

Mọi publish, run, approval, cancel, retry, secret operation, API key operation phải để lại proof:
- audit log
- execution record
- policy outcome
- known issue nếu có

### 8.4 Action truth

Nếu Dash cho phép user:
- publish
- run
- retry
- cancel
- approve

thì backend phải có action authority thật đằng sau.

Không được để:
- nút bấm có mà hành động giả
- view runtime có mà runtime không thật
- billing chart có mà entitlement không thật

---

## 9. Kiến trúc công nghệ chốt

Stack nên được tổ chức như sau:
- Cloudflare Workflows = durable execution core
- Durable Objects = coordination core
- Queues = asynchronous distribution
- D1 = metadata and system records
- R2 = artifacts and large objects
- Vectorize = semantic retrieval layer
- OpenAI Agents/tool layer = agent orchestration
- Stripe = billing and entitlements
- OpenTelemetry conventions = observability standard

Nguyên tắc quan trọng hơn công nghệ:
- không công nghệ nào là trung tâm
- Flow mới là trung tâm
- stack chỉ là vật liệu để làm Flow sống được

---

## 10. Product surface map liên quan

### 10.1 `flow.iai.one`

Vai trò:
- product entry
- explanation surface
- living execution surface

Không được trở thành:
- generic automation marketing page
- thin builder demo

### 10.2 `dash.iai.one`

Vai trò:
- official app
- living control system
- runtime command center

Không được trở thành:
- dashboard mỏng
- chart wall
- fake admin shell

### 10.3 `api.flow.iai.one`

Vai trò:
- execution authority
- flow lifecycle authority
- runtime truth authority
- billing/entitlement authority cho Flow

### 10.4 `developer.iai.one`

Vai trò:
- build layer
- API docs
- SDK/integration guides
- auth/session contracts

---

## 11. Những điều tuyệt đối không được phép

- biến builder thành nơi giữ logic runtime
- để Dash bịa runtime truth
- cho preview và production dùng chung uncontrolled side effects
- để route viết SQL khắp nơi mãi mãi
- trộn template sources không có registry
- trộn node metadata với node executors hỗn loạn
- thêm AI trước khi có observability và guardrails
- để product site trở thành app shell
- để app shell mang marketing logic
- nói về intelligence khi chưa có memory truth
- nói về billing truth khi entitlement backend chưa thật

---

## 12. Build order chuẩn sau khi được duyệt

### Phase 1 — Foundation Truth

- auth thật
- session thật
- workspace thật
- flows CRUD thật
- executions thật

### Phase 2 — Builder Truth

- drafts
- versions
- publish
- preview
- node catalog
- templates
- builder facade
- collaboration lock cơ bản

### Phase 3 — Runtime Truth

- durable execution
- queues
- coordinator
- waiting states
- retries
- inspector
- dashboard runtime thật

### Phase 4 — Agent Truth

- prompt nodes
- agent nodes
- tool system
- memory boundary
- reasoning traces
- agent observability

### Phase 5 — Commercial Truth

- Stripe
- usage ledger
- quotas
- credits
- seats
- billing dashboard
- API keys
- entitlement checks

### Phase 6 — Evolution Truth

- recommendations
- semantic template search
- pattern learning
- config suggestions
- optimization insights

Hard rule:
- không nhảy phase
- không build Tier C trước khi core truth đủ
- không release lớp trên khi lớp dưới còn giả

---

## 13. Release discipline

### 13.1 Không được release Flow nếu

- auth/session/workspace chưa thật
- execution truth chưa thật
- preview/publish/run chưa thật
- logs/inspector chưa thật
- route chính chưa pass validator, smoke test và rollback readiness

### 13.2 Không được release Dash nếu

- route chưa được guard bởi auth/session thật
- runtime view còn dùng fake data
- actions chưa có backend authority thật
- workspace isolation chưa thật
- permission rendering chưa thật
- logs/approvals/usage là giả hoặc nửa thật

### 13.3 Mọi release phải có

- evidence packet
- rollback note
- owner signoff
- known issues rõ
- gate authority rõ

---

## 14. Tài liệu vận hành bắt buộc sau khi duyệt

Sau khi file này được founder duyệt, các file dưới đây là lớp operationalization bắt buộc:
- `docs/FLOW_ENGINE_MASTER_ARCHITECTURE.md`
- `docs/DASH_IAI_ONE_FULL_PLATFORM_SPEC.md`
- `docs/DASH_IAI_ONE_IMPLEMENTATION_BACKLOG_2026.md`
- `docs/FLOW_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/DASH_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

File này là canonical direction.
Các file kia là execution documents.

---

## 15. Activation rule sau khi duyệt

Chỉ sau khi founder duyệt:
- Team 1 mới được chuyển file này thành active direction
- Team 1 mới được update execution board tương ứng
- Team 1 mới được phát lệnh xuống Team 2, Team 3, Team 4, Team 5

Trước khi founder duyệt:
- không rollout
- không cascade
- không dùng file này để ép team đổi lane

---

## 16. Câu chốt cuối cùng

`flow.iai.one` không được xây như:

một workflow executor có thêm vài node AI

`flow.iai.one` phải được xây như:

một living execution system

`dash.iai.one` không được nhìn Flow như:

một backend logs engine

`dash.iai.one` phải tiến hóa thành:

một living control system

Flow là nơi execution sống.
Dash là nơi con người điều khiển sự sống đó.

Nếu hai bề mặt này giữ đúng vai:
- hệ sẽ khác category
- runtime sẽ có ý nghĩa
- app sẽ có chiều sâu
- control plane sẽ có giá trị thật

Nếu một trong hai bề mặt rơi về tool logic:
- toàn hệ sẽ trượt về workflow product

---

## 17. Final review statement

Đây là bản tinh chỉnh hoàn thiện cuối cùng ở trạng thái:

`DRAFT_FOR_FOUNDER_REVIEW_ONLY`

Nó chưa phải lệnh triển khai.
Nó là bản để founder duyệt lần cuối trước khi Team 1 chuyển hóa thành execution directive cho toàn team.
