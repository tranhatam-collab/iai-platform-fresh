# PAY_IAI_ONE_TEAM_DEV_STARTER_MAP_2026
## Bản đồ vào việc ngay cho Team 1-5
## Version 1.0
## Status: Execution Starter Lock

---

## 1. Mục tiêu

File này biến bộ spec `pay.iai.one` thành lệnh vào việc ngắn cho từng team.

Không thay thế spec gốc.
Nó chỉ nói:
- team nào đọc gì trước
- team nào build phần nào
- output đầu tiên của team là gì
- team nào không được lấn vai team khác

---

## 2. Pre-read Rule

Mọi team phải đọc theo thứ tự:

1. [PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md)
2. [PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md](./PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md)

trước khi dùng file starter map này.

Starter map không phải là entry point ngang cấp với master index.
Starter map chỉ là bản đồ khởi động theo team sau khi tầng điều hướng tổng đã được khóa.

---

## 3. Entry Conditions

Trước khi một team dùng file này để bắt đầu dev hoặc phối hợp integration, team đó phải biết rõ:

- current phase là gì
- current release scope là gì
- governing files cho phase hiện tại là gì
- unresolved blockers hiện có là gì
- team đang làm implementation mới hay chỉ làm integration/supporting work

Nếu 5 điều kiện trên chưa rõ, team chưa được dùng starter map như nguồn vào việc.

---

## 4. Operational Tracking Rule

Khi một team bắt đầu active implementation hoặc active integration, team đó phải cập nhật lớp vận hành hằng ngày bằng:

- [PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md](./PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md) cho execution tracking
- [PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md](./PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md) cho risk tracking khi có delivery risk, financial integrity risk, permissions risk, payout risk, reconciliation risk, release risk, hoặc security risk

Weekly status, execution board, và risk register phải kể cùng một câu chuyện vận hành.

Nếu lane đang chạy theo mô hình nén delivery trong ngày, mọi team phải tham chiếu thêm [PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md](./PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md) và [PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md](./PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md).

Ba team mới trong execution overlay không thay thế ownership logic bên dưới.
Chúng chỉ gom execution path lại để lane đi nhanh hơn dưới một control-tower coordination lane.

---

## 5. Team 1

### Vai trò

Team 1 giữ:
- governance gate
- release-claim
- owner sign-off
- reopen verdict
- synchronized live authority

### Phải đọc trước

1. [PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md](./PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md)
2. [PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md](./PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md)
3. [PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md](./PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md)
4. [PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md](./PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md)
5. [PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md](./PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md)
6. [PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md](./PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md)
7. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)
8. [IAI_DEPENDENCY_CRITICAL_PATH_2026.md](./IAI_DEPENDENCY_CRITICAL_PATH_2026.md)

### Output đầu tiên

- release gate checklist riêng cho `pay.iai.one`
- packet owner/provider investigation
- reopen criteria rõ cho `developer`, `cios`, `cdn`, `flows`, `pay`

### Không được làm

- không sửa business logic payout thay Team 2
- không tự đổi role domain

---

## 6. Team 2

### Vai trò

Team 2 giữ:
- payment intent
- payment session
- provider adapter
- webhook intake
- state machine
- ledger
- revenue split engine
- payout engine
- reconciliation runtime

### Phải đọc trước

1. [PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md](./PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md)
2. [PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md](./PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md)
3. [PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md](./PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md)
4. [PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md](./PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md)
5. [PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md](./PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md)
6. [PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md](./PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md)
7. [PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md](./PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md)
8. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)

### Output đầu tiên

- schema canonical cho `payment_intents`, `payment_sessions`, `provider_attempts`, `payments`
- route contract cho `create payment intent`, `create payment session`, `payment status`, `webhooks`
- một rail nội bộ chạy thật end-to-end

### Không được làm

- không nhảy sang multi-provider sớm khi rail đầu chưa ổn
- không build wallet trước ledger và reconciliation

---

## 7. Team 3

### Vai trò

Team 3 giữ:
- hosted checkout UI
- payment session rendering
- QR UX
- status UX
- receipt UX
- internal admin surface UI structure

### Phải đọc trước

1. [PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md](./PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md)
2. [PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md](./PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md)
3. [PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md](./PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md)
4. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)

### Output đầu tiên

- route shell `/checkout/{payment_session_id}`
- stateful QR block
- awaiting confirmation state
- confirmed state + receipt path
- copy registry VI/EN gắn theo key thay vì hard-code text
- checklist UI truth + QA gate cho checkout trước sign-off live

### Không được làm

- không tự đánh dấu payment thành công từ redirect
- không viết copy kiểu sales checkout

---

## 8. Team 4

### Vai trò

Team 4 giữ:
- finance ops
- reconciliation queue
- payout ops
- refund ops
- evidence review
- support escalation

### Phải đọc trước

1. [PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md](./PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md)
2. [PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md](./PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md)
3. [PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md](./PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md)
4. [PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md](./PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md)
5. [PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md](./PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md)
6. [PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md](./PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md)
7. [PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md](./PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md)
8. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)

### Output đầu tiên

- exception queue structure
- payout queue structure
- refund queue structure
- evidence review rules
- triage severity map và controlled resolution path cho từng lớp exception chính

### Không được làm

- không manual-resolve mà không có audit
- không dùng spreadsheet làm truth chính

---

## 9. Team 5

### Vai trò

Team 5 giữ:
- source-site integration
- success and cancel handoff
- callback receiving side
- web onboarding and cross-site payment bridge

### Phải đọc trước

1. [PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md](./PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md)
2. [PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md](./PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md)
3. [PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md](./PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md)
4. [PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md](./PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md)
5. [PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md](./PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md)
6. [PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md](./PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md)
7. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)

### Output đầu tiên

- source-site callback contract
- success URL handoff contract
- cancel URL handoff contract
- fulfillment outbox receiving contract
- contract copy/status mapping để source site không nói sai trạng thái thanh toán
- callback retry và fallback poll contract để source site không bị mù trạng thái khi outbox lỗi

### Không được làm

- không tự giữ payment truth ở source site
- không unlock entitlement từ redirect thô

---

## 10. Build Order Cho Toàn Team

1. registry và order model
2. payment intent API
3. payment session API
4. hosted checkout page
5. QR engine và một rail collection
6. webhook verification
7. payment state machine
8. ledger write
9. revenue split engine
10. fulfillment outbox
11. payout request và approval
12. reconciliation engine

---

## 11. Câu chốt

Mọi team có thể bắt đầu dev ngay sau khi đọc file này.

Nhưng nếu team nào bỏ qua spec canonical gốc, mọi output của team đó phải bị xem là chưa đủ chuẩn để merge hoặc release.

Và nếu team nào dùng starter map mà chưa đọc master index hoặc chưa khóa xong entry conditions, team đó chưa được coi là đã vào đúng phase dev của lane `pay.iai.one`.
