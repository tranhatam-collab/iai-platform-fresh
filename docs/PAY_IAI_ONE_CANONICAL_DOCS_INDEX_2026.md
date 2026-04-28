# PAY_IAI_ONE_CANONICAL_DOCS_INDEX_2026
## Chỉ mục canonical cho toàn bộ pack `pay.iai.one`
## Version 1.0
## Status: Locked

---

## 0. Upstream Control Note

- [PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md) là final navigation shell cho toàn bộ docs pack của lane `pay.iai.one`.
- [PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md](./PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md) là top-level entry point cho lane `pay.iai.one`.
- [PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md](./PAY_IAI_ONE_DOCS_USAGE_PROTOCOL_2026.md) governs how the pack must be used in practice by humans and AI systems.
- File này vẫn là downstream detailed reading pack và implementation guide.
- File này không override master execution order, governance direction, hoặc release gating được định nghĩa trong master project index.
- [PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md](./PAY_IAI_ONE_THREE_TEAM_EXECUTION_PLAN_2026.md) là accelerated execution overlay, không thay thế reading pack này hoặc starter map.
- Pay-specific governance pack của lane `pay.iai.one` gồm:
  - [PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md](./PAY_IAI_ONE_WEEKLY_STATUS_TEMPLATE_2026.md)
  - [PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md](./PAY_IAI_ONE_DECISION_LOG_TEMPLATE_2026.md)
  - [PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md](./PAY_IAI_ONE_RELEASE_EVIDENCE_PACKET_TEMPLATE_2026.md)
  - [PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md](./PAY_IAI_ONE_EXECUTION_BOARD_TEMPLATE_2026.md)
  - [PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md](./PAY_IAI_ONE_RISK_REGISTER_TEMPLATE_2026.md)
- Governance templates được tham chiếu như lớp vận hành chuyên biệt cho `pay.iai.one`, không chen vào reading order lõi nếu phase hiện tại chưa cần.
- Pending locked dependencies chưa materialize trong repo ở vòng này:
  - `PAY_IAI_ONE_DATABASE_SCHEMA_SQL_V1.md`
  - `PAY_IAI_ONE_API_SPEC_FULL_V1.md`
- Đây là locked dependencies về direction, không phải file bị quên. Team và AI agents không được tự ý viết nội dung thay thế nếu chưa có lock riêng.

---

## 1. Mục tiêu

File này là chỉ mục đọc chuẩn cho toàn bộ tài liệu `pay.iai.one`.

Trước khi dùng file này, mọi team phải đọc theo thứ tự:

1. [PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md](./PAY_IAI_ONE_DOCS_PACK_INDEX_FINAL_2026.md)
2. [PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md](./PAY_IAI_ONE_MASTER_PROJECT_INDEX_2026.md)

Mọi team phải đọc theo thứ tự này trước khi:
- mở backlog mới
- viết code mới
- thay đổi domain role
- thay đổi API contract
- thay đổi checkout flow
- thay đổi payout hoặc reconciliation logic

---

## 2. Bộ canonical lõi

### 2.1 Direction và role nền

1. [PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md](./PAY_IAI_ONE_WALLET_AND_SETTLEMENT_PHASE_PLAN_2026.md)
2. [PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md](./PAY_IAI_ONE_INTERNAL_CONTROL_PLANE_ARCHITECTURE_2026.md)

### 2.2 Commercial truth

3. [PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md](./PAY_IAI_ONE_REVENUE_SPLIT_AND_PAYOUT_RULES_V1.md)
4. [BILLING_AND_USAGE_SYSTEM_SPEC.md](./BILLING_AND_USAGE_SYSTEM_SPEC.md)

### 2.3 Event truth và finance truth

5. [PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md](./PAY_IAI_ONE_WEBHOOK_AND_RECONCILIATION_PROTOCOL_V1.md)
6. [DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md](./DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md)

### 2.4 Service orchestration và access control

7. [PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md](./PAY_IAI_ONE_SERVICE_LAYER_AND_TRANSACTION_ORCHESTRATION_V1.md)
8. [PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md](./PAY_IAI_ONE_ADMIN_ROLE_PERMISSION_MATRIX_V1.md)

### 2.5 Async, exception handling, và safety control

9. [PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md](./PAY_IAI_ONE_QUEUE_AND_ASYNC_JOB_SPEC_V1.md)
10. [PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md](./PAY_IAI_ONE_RECONCILIATION_EXCEPTION_PLAYBOOK_V1.md)

### 2.6 Ops, UI, và live readiness

11. [PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md](./PAY_IAI_ONE_ADMIN_OPS_DASHBOARD_SPEC_V1.md)
12. [PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md](./PAY_IAI_ONE_INTERNAL_CHECKOUT_UI_FLOW_V1.md)
13. [PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md](./PAY_IAI_ONE_HOSTED_CHECKOUT_UI_COPY_REGISTRY_V1.md)
14. [PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md](./PAY_IAI_ONE_TEST_MATRIX_AND_GO_LIVE_ACCEPTANCE_V1.md)

### 2.7 Governance và execution chung của hệ

15. [IAI_MASTER_DOMAIN_MISSION_MAP.md](./IAI_MASTER_DOMAIN_MISSION_MAP.md)
16. [IAI_DEPENDENCY_CRITICAL_PATH_2026.md](./IAI_DEPENDENCY_CRITICAL_PATH_2026.md)
17. [MASTER_DEV_EXECUTION_PROTOCOL_2026.md](./MASTER_DEV_EXECUTION_PROTOCOL_2026.md)
18. [TEAM1_DEFINITION_OF_DONE_2026.md](./TEAM1_DEFINITION_OF_DONE_2026.md)
19. [TEAM2_DEFINITION_OF_DONE_2026.md](./TEAM2_DEFINITION_OF_DONE_2026.md)
20. [TEAM3_DEFINITION_OF_DONE_2026.md](./TEAM3_DEFINITION_OF_DONE_2026.md)
21. [TEAM4_DEFINITION_OF_DONE_2026.md](./TEAM4_DEFINITION_OF_DONE_2026.md)
22. [TEAM5_DEFINITION_OF_DONE_2026.md](./TEAM5_DEFINITION_OF_DONE_2026.md)

---

## 3. Quy tắc đọc

- Không đọc rời từng file rồi tự suy diễn role.
- Không nhảy thẳng vào UI trước khi đọc control plane, revenue split, và webhook protocol.
- Không build payout trước khi hiểu eligibility, reserve hold, approval policy, và reconciliation dependency.
- Không build public payment UX theo kiểu marketing checkout.

---

## 4. Thứ tự đọc khuyến nghị theo vai trò

### Team 1

Đọc:
1. phase plan
2. internal control plane architecture
3. service layer and transaction orchestration
4. admin role permission matrix
5. queue and async job spec
6. reconciliation exception playbook
7. webhook and reconciliation protocol
8. test matrix and go-live acceptance
9. dependency critical path
10. DoD Team 1

### Team 2

Đọc:
1. internal control plane architecture
2. revenue split and payout rules
3. webhook and reconciliation protocol
4. service layer and transaction orchestration
5. admin role permission matrix
6. queue and async job spec
7. reconciliation exception playbook
8. test matrix and go-live acceptance
9. billing and usage system spec
10. DoD Team 2

### Team 3

Đọc:
1. internal checkout UI flow
2. hosted checkout UI copy registry
3. admin ops dashboard spec
4. test matrix and go-live acceptance
5. internal control plane architecture
6. DoD Team 3

### Team 4

Đọc:
1. webhook and reconciliation protocol
2. service layer and transaction orchestration
3. admin role permission matrix
4. queue and async job spec
5. reconciliation exception playbook
6. admin ops dashboard spec
7. revenue split and payout rules
8. test matrix and go-live acceptance
9. DoD Team 4

### Team 5

Đọc:
1. internal checkout UI flow
2. hosted checkout UI copy registry
3. internal control plane architecture
4. webhook and reconciliation protocol
5. queue and async job spec
6. reconciliation exception playbook
7. test matrix and go-live acceptance
8. DoD Team 5

---

## 5. Câu chốt

Nếu một team chưa đọc đúng bộ canonical này, team đó chưa được coi là đã vào đúng lane `pay.iai.one`.

Và nếu một team đọc file này mà bỏ qua docs pack index final hoặc master project index, team đó vẫn chưa được coi là đã vào đúng entrypoint điều hành của lane `pay.iai.one`.
