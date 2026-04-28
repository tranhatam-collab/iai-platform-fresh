# DEVELOPER_IAI_ONE_PLATFORM_SPEC
## Final platform, IA, contract and builder-surface specification for developer.iai.one
## Version 1.0
## Status: LOCKED FOR TEAM A / TEAM 1 / TEAM 2 / DEVREL / PLATFORM
## Scope: developer.iai.one
## Date: 2026-04-15

---

## 1. Định nghĩa tuyệt đối

`developer.iai.one` không phải:
- một sales page
- một support forum
- một docs mirror chung chung
- một bài viết marketing về AI

`developer.iai.one` là:
- developer onboarding and integration surface chính thức của toàn hệ `*.iai.one`
- builder portal cho API, SDK, auth, webhooks, nodes và runtime contracts
- nơi để platform trở thành teachable và extensible

Nếu `docs.iai.one` dạy hệ thống,
thì `developer.iai.one` dạy cách kết nối, xây, tích hợp và mở rộng hệ thống.

---

## 2. Mục tiêu tối thượng

Mục tiêu của `developer.iai.one` là giúp builder:
- hiểu hệ cần tích hợp ở đâu
- bắt đầu nhanh mà không đoán
- gọi đúng API
- xử lý auth/session đúng contract
- nhận webhook đúng logic
- phát triển node / tool / extension đúng chuẩn
- tích hợp với `app.iai.one`, `flow.iai.one`, `dash.iai.one`, `api.iai.one`, `api.flow.iai.one`

Mục tiêu của surface này không phải là "có nhiều tài liệu".
Mục tiêu là:
- reduce time-to-first-success
- giảm drift contract giữa các team
- biến platform thành builder-ready

---

## 3. Vai trò trong hệ `*.iai.one`

`developer.iai.one` phải giữ đúng vai trò:
- developer onboarding
- integration contracts
- SDK direction
- auth/session docs
- API references
- webhook references
- node development guidance
- app/dash/flow integration references
- changelog developer-facing

Không được giữ vai trò:
- product marketing
- enterprise demand gen
- public support backlog
- personal blog

---

## 4. Phân biệt với `docs.iai.one`

### `docs.iai.one`

Dùng để giải thích:
- architecture
- concepts
- standards
- governance
- product models
- billing/policy docs cấp hệ thống

### `developer.iai.one`

Dùng để giải thích:
- how to authenticate
- how to call the APIs
- how to verify sessions
- how to receive webhooks
- how to develop nodes
- how to use SDKs
- how to integrate with app / flow / dash / runtime

Hard rule:
- `developer.iai.one` không được copy nguyên `docs.iai.one`
- `docs.iai.one` không được nuốt mất phần onboarding builder của `developer.iai.one`

---

## 5. Đối tượng sử dụng chính

### 5.1 App integrator

Cần:
- auth/session contract
- browser-to-backend contract
- workspace resolution
- example requests

### 5.2 Flow builder / runtime integrator

Cần:
- flow/run/execution APIs
- webhook events
- runtime state models
- approval / retry / queue contracts

### 5.3 Node developer

Cần:
- node contract
- IO schema expectations
- secret scopes
- preview / side-effect rules

### 5.4 SDK consumer

Cần:
- SDK installation
- examples
- typed helpers
- release changelog

### 5.5 Internal platform team

Cần:
- contract source of truth
- deprecation rules
- versioning rules
- error code matrix

---

## 6. Product doctrine

### 6.1 Builder-first

Mỗi page phải giúp builder làm được việc.

### 6.2 Contract-first

Không được viết theo kiểu:
"API của chúng tôi rất mạnh."

Phải viết theo kiểu:
- endpoint nào
- input nào
- auth gì
- response gì
- errors nào
- idempotency / retry rule nào

### 6.3 Example-first

Mỗi phần quan trọng phải có:
- curl
- JSON example
- request / response shape
- environment notes nếu cần

### 6.4 Source-of-truth first

Nếu contract thay đổi:
- `developer.iai.one` phải cập nhật
- changelog phải cập nhật
- không cho docs stale lâu dài

### 6.5 No vague platform language

Không được mơ hồ builder bằng:
- future-ready AI stack
- seamless next-generation automation
- intelligence at scale

Nếu không có contract rõ, không được đưa lên developer portal.

---

## 7. IA và route map chính thức

### 7.1 Root
- `/`
- `/quickstart`
- `/get-started`

### 7.2 Auth and identity
- `/auth`
- `/auth/sessions`
- `/auth/workspaces`
- `/auth/roles`

### 7.3 APIs
- `/api`
- `/api/reference`
- `/api/errors`
- `/api/pagination`
- `/api/idempotency`

### 7.4 Flow platform
- `/flow`
- `/flow/flows`
- `/flow/executions`
- `/flow/runtime`
- `/flow/queues`
- `/flow/approvals`
- `/flow/proofs`

### 7.5 Webhooks
- `/webhooks`
- `/webhooks/events`
- `/webhooks/security`
- `/webhooks/retries`

### 7.6 SDKs
- `/sdk`
- `/sdk/javascript`
- `/sdk/typescript`
- `/sdk/examples`

### 7.7 Node development
- `/nodes`
- `/nodes/contracts`
- `/nodes/development`
- `/nodes/secrets`
- `/nodes/preview-rules`

### 7.8 App integration
- `/integrations`
- `/integrations/app`
- `/integrations/flow`
- `/integrations/dash`

### 7.9 Change communication
- `/changelog`
- `/deprecations`
- `/release-notes`

---

## 8. Homepage requirements

Trang chủ `developer.iai.one` phải trả lời nhanh 5 câu:
1. đây là surface gì
2. ai nên vào đây
3. bắt đầu từ đâu
4. API / SDK / webhook / node docs nằm ở đâu
5. route nào đúng với use case hiện tại của tôi

Homepage bắt buộc có:
- one-line definition
- quickstart CTA
- API reference CTA
- auth/session CTA
- webhook CTA
- SDK CTA
- changelog CTA
- system map nhỏ cho app / flow / dash / api

Không được biến homepage thành brand manifesto thứ hai.

---

## 9. Quickstart system

Quickstart phải là lane nhanh nhất để builder có first success.

Phải có tối thiểu:
- prerequisites
- auth setup
- workspace resolution
- first API call
- first webhook receive hoặc first flow execution read
- expected response
- common errors

Quickstart must have:
- time estimate
- environment requirements
- copy-paste examples
- what to do next

---

## 10. Auth and session spec

Phần auth/session phải khóa rõ:
- auth model
- session model
- workspace model
- role model
- browser session rules
- backend verification rules

Bắt buộc có:
- `HttpOnly cookie` guidance
- `credentials: include` guidance cho browser apps
- session validate examples
- workspace resolution examples
- logout behavior
- expiry behavior

Không được dạy builder theo `localStorage` session nếu contract chính thức là cookie.

---

## 11. API reference requirements

Mỗi API reference page phải có:
- endpoint path
- method
- auth requirement
- request schema
- response schema
- status codes
- error codes
- idempotency note nếu có
- curl example
- JSON example

Nếu có OpenAPI source:
- `developer.iai.one` phải là human-friendly surface của source đó
- không được để endpoint dump vô ngữ cảnh

---

## 12. Error model

Portal phải dạy rõ nhóm lỗi:
- auth errors
- permission errors
- validation errors
- contract errors
- rate limit errors
- idempotency conflicts
- runtime errors
- webhook verification errors

Mỗi nhóm lỗi phải có:
- meaning
- probable cause
- retry guidance
- safe next step

---

## 13. Webhook system spec

Phần webhook phải khóa rõ:
- event names
- payload shape
- delivery expectations
- retry behavior
- idempotency expectation
- signature verification
- failure handling

Bắt buộc có:
- event catalog
- example payloads
- signature verification example
- local testing guidance
- replay / duplicate handling guidance

Không được viết webhook docs theo kiểu "nhận sự kiện khi có thay đổi".
Phải viết rõ event nào, payload nào, retry nào.

---

## 14. SDK strategy

`developer.iai.one` phải nói rõ:
- SDK nào là first-party
- ngôn ngữ nào được ưu tiên
- maturity level của từng SDK
- versioning / deprecation rules

V1 nên ưu tiên:
- JavaScript / TypeScript first

Mỗi SDK page phải có:
- install
- init
- auth wiring
- common operations
- error handling
- changelog link

---

## 15. Node development system

Node docs phải dạy builder:
- node là gì
- node contract là gì
- input / output schema rules
- secret scopes
- preview support
- side-effect level
- approval requirements nếu có

Bắt buộc có:
- node metadata model
- executor boundary model
- preview vs production rule
- stable / experimental meaning

Phần này phải đồng bộ với:
- `docs/FLOW_ENGINE_MASTER_ARCHITECTURE.md`

---

## 16. Integration references cho app / flow / dash

Phải có phần chỉ rõ:

### `app.iai.one`
- human-facing app integration expectations

### `flow.iai.one`
- product / trust / onboarding layer references

### `dash.iai.one`
- runtime app / control plane references

### `api.iai.one`
- browser-facing authority references

### `api.flow.iai.one`
- runtime / execution authority references

Builder phải hiểu domain nào để làm gì.
Không được để `developer.iai.one` tạo ra mơ hồ domain.

---

## 17. Search và navigation rules

Portal phải có:
- global search
- topical navigation
- breadcrumbs
- related pages
- next-step links

Search phải tìm được:
- endpoint
- event
- auth topic
- SDK topic
- node topic
- error code topic

---

## 18. Language, locale và SEO rules

`developer.iai.one` là public indexable surface.
Vì vậy phải tuân theo:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

Lock rule:
- English-first cho audience quốc tế
- Vietnamese first-class cho audience Việt Nam
- khi public route cần song ngữ, phải có canonical / hreflang / x-default đúng chuẩn

Không được:
- viết tiếng Việt không dấu trên public page
- trộn ngôn ngữ trong title / hero mơ hồ SEO
- để technical glossary drift giữa EN và VI

---

## 19. Content quality rules

Mỗi page kỹ thuật phải:
- rõ
- ngắn gọn
- có ví dụ
- có prerequisites nếu cần
- có "what next" rõ ràng

Không được:
- viết như sales copy
- viết quá ý niệm
- viết có vẻ đẹp nhưng không cho builder làm được việc

---

## 20. Release and changelog discipline

`developer.iai.one` phải có:
- changelog
- deprecation notices
- breaking-change labels
- last updated markers nếu cần

Mỗi breaking change phải có:
- impact
- migration note
- cutover date nếu có
- owner

Không được đổi contract im lặng mà không thông báo.

---

## 21. Team ownership và workflow

### Team A

Owns:
- IA
- homepage
- onboarding
- navigation
- developer copy
- SEO / locale compliance

### Team 2

Owns:
- API contract truth
- auth/session truth
- webhook truth
- runtime contract truth
- error model truth

### Shared rule

Team A được diễn đạt.
Team 2 giữ sự thật contract.
Không bên nào được sửa một mình làm drift.

---

## 22. Release gates cho `developer.iai.one`

`developer.iai.one` chỉ được reopen GO khi có đầy đủ:
- quickstart thật
- auth/session docs thật
- API reference source of truth rõ
- webhook docs thật
- SDK direction rõ
- app / flow / dash / api domain map rõ
- bilingual / locale / canonical rules đúng
- ghi chú rollback cho release

Nếu thiếu 1 mục, vẫn là NO-GO.

---

## 23. Definition of done

`developer.iai.one` chỉ được xem là hoàn chỉnh khi:
- builder mới có thể đi từ homepage -> quickstart -> first success mà không đoán
- auth/session docs không mâu thuẫn runtime contract
- API/webhook docs đủ để tích hợp thật
- node docs đủ để bắt đầu dev theo contract
- domain roles được giải thích rõ
- changelog / deprecation discipline có thật
- EN / VI đúng chuẩn toàn hệ

---

## 24. Final directive

`developer.iai.one` không tồn tại để "trông có vẻ có platform".
Nó tồn tại để builder có thể bắt đầu nhanh, tích hợp đúng, và mở rộng hệ thống mà không tự đoán contract.

Nếu một page không làm builder đến gần first success hơn,
không nên có mặt trong developer portal.

---

## 25. Release lock

Release gate của `developer.iai.one` được khóa tại:
- `docs/DEVELOPER_IAI_ONE_RELEASE_GATE_2026.md`
