# BILLING_AND_USAGE_SYSTEM_SPEC
## Canonical commercial truth for `dash.iai.one`, `pay.iai.one`, and shared billing surfaces across `*.iai.one`
## Đặc tả chuẩn cho lớp sự thật thương mại của `dash.iai.one`, `pay.iai.one` và các bề mặt billing dùng chung trong `*.iai.one`
## Version 1.1
## Status: LOCKED FOR TEAM 1 / TEAM 2 / TEAM PAY / OPS / RELEASE
## Scope: billing, usage, entitlements, credits, seats, payout readiness
## Date: 2026-04-18

---

## 1. Mục tiêu

File này tồn tại để khóa một sự thật rất quan trọng:

Billing không phải là biểu đồ.
Billing là một lớp authority của hệ.

Nếu `billing`, `usage` và `entitlements` không phản ánh đúng sự thật:
- Dash sẽ trở thành UI trang trí
- Pay sẽ trở thành intake shell không có finance truth
- `feature locks` sẽ mở sai hoặc chặn sai
- release gate sẽ mất giá trị

Vì vậy file này khóa:
- `usage units`
- `plan model`
- `entitlement model`
- `credit model`
- `seat model`
- `billing ledger`
- `feature locks`
- `payout` và `settlement` discipline liên quan `pay.iai.one`

---

## 2. Vai trò tuyệt đối

### 2.1 `dash.iai.one`

`dash.iai.one` là nơi người dùng:
- thấy `current plan`
- thấy `usage summary`
- thấy `credits`, `quota` và `seats`
- thấy `premium feature locks`
- thấy `invoices` và `billing events`
- hiểu vì sao một feature bị chặn hoặc được mở

Dash không được:
- tự tính `usage` bằng query UI tạm thời
- mở feature dựa trên `frontend-only flag`
- render `billing state` khi backend chưa xác nhận

### 2.2 `pay.iai.one`

`pay.iai.one` là:
- `payment intake surface`
- `wallet and balance surface`
- `payout and settlement control surface`

`pay.iai.one` không thay thế commercial truth của toàn hệ.
Nó phải dùng chung:
- `identity truth`
- `audit truth`
- `billing ledger truth`
- `entitlement truth`

### 2.3 Backend authority dùng chung

Commercial truth phải nằm ở backend authority:
- `api.flow.iai.one` cho `Flow` và `Dash usage truth`
- runtime/operator layer của `pay.iai.one` cho `payment`, `wallet`, `payout` và `settlement truth`

Không được để:
- Dash tự mở khóa feature
- Pay tự ghi balance theo cách không có `ledger truth`

---

## 3. Hard rules

- `no ledger truth -> no billing truth`
- `no entitlement check -> no premium feature release`
- `no usage emission -> no usage chart`
- `no audit trail -> no finance-sensitive action`
- `no rollback note -> no billing-related release`
- `no Team 1 gate -> no production release for commercial lane`

---

## 4. Commercial object model

Các object tối thiểu phải tồn tại:
- `billing_account`
- `workspace_plan`
- `plan_catalog`
- `plan_price`
- `usage_ledger_event`
- `usage_aggregate_daily`
- `credit_balance`
- `credit_ledger_entry`
- `seat_assignment`
- `entitlement_snapshot`
- `billing_event`
- `invoice_shadow`
- `checkout_record`
- `payment_receipt`
- `wallet_account`
- `currency_balance`
- `ledger_entry`
- `payout_request`
- `payout_approval`
- `payout_execution`

Hard rule:
- `balance`, `usage`, `credits`, `seats` và `entitlements` không được lấy từ UI cache làm `source of truth`

---

## 5. Usage unit model

### 5.1 Canonical usage units

Hệ phải khóa ngay từ đầu:
- `run_count`
- `step_count`
- `execution_duration_ms`
- `agent_tool_calls`
- `ai_input_tokens`
- `ai_output_tokens`
- `storage_bytes`
- `artifact_bytes`
- `seat_count`
- `premium_node_usage`
- `payment_intake_count`
- `payout_request_count`

### 5.2 Usage unit rules

- Mỗi unit phải có tên ổn định
- Mỗi unit phải có `source emitter` rõ ràng
- Mỗi unit phải map được tới `workspace` và `actor scope` khi cần
- Không được đổi nghĩa của unit sau khi đã billing nếu không có `migration plan`

---

## 6. Usage emission model

### 6.1 Emission points bắt buộc

Usage được ghi tại:
- `flow start`
- `step complete`
- `execution complete`
- `agent tool call`
- `AI response complete`
- `artifact upload/store`
- `template install` nếu có tính phí
- `payment intake event` nếu thuộc commercial lane
- `payout execution` nếu thuộc commercial lane

### 6.2 Emission contract

Mỗi usage event phải có tối thiểu:
- `event_id`
- `workspace_id`
- `subject_id` hoặc `system actor`
- `domain_surface`
- `usage_unit`
- `usage_amount`
- `source_object_id`
- `occurred_at`
- `environment`

### 6.3 Hard rule

Không tính billing trực tiếp từ dashboard query.
Billing phải đi từ:
- `usage ledger`
- `aggregate table`
- `billing events`

---

## 7. Plan model

### 7.1 Plan families

Tối thiểu có:
- `free`
- `starter`
- `pro`
- `team`
- `enterprise`

Nếu `pay.iai.one` có plan riêng, vẫn phải giữ cùng mô hình:
- `pay_starter`
- `pay_ops`
- `pay_enterprise`

### 7.2 Mỗi plan phải khóa

- `plan id`
- `plan name`
- `billing interval`
- `included usage`
- `overage rule`
- `seat rule`
- `premium node rule`
- `support level`
- `payout availability` nếu liên quan `pay`

### 7.3 Hard rule

Không được có feature premium nào mà không map vào plan hoặc entitlement.

---

## 8. Entitlement model

### 8.1 Entitlement categories

Tối thiểu:
- `route access`
- `feature access`
- `premium node access`
- `AI model tier access`
- `workspace member limit`
- `usage quota`
- `artifact/storage quota`
- `payout capability`
- `API key capability`

### 8.2 Entitlement source

Entitlement phải được suy ra từ:
- `plan`
- `add-on`
- `credit state`
- `workspace status`
- `manual admin grant` có audit

### 8.3 Feature lock rule

Mỗi `feature lock` phải có:
- `backend enforcement`
- giải thích rõ ở UI
- `audit trail` nếu có `manual override`

Không được:
- mở feature bằng `frontend-only toggle`
- ẩn feature mà không giải thích lý do

---

## 9. Credit model

### 9.1 Credit uses

Credits có thể dùng cho:
- `AI usage`
- `premium runs`
- `premium nodes`
- `overage buffer`

### 9.2 Credit truth

Credits phải có:
- `current balance`
- `ledger entries`
- `consume reason`
- `grant reason`
- `expiry policy` nếu có

### 9.3 Hard rule

Không được trừ credit mà không có `ledger entry`.

---

## 10. Seat model

### 10.1 Seat truth

Seat phải giám sát:
- `assigned seats`
- `pending invites`
- `active members`
- `seat limit`
- `over-seat state`

### 10.2 Seat gating

Nếu workspace vượt seat:
- backend phải biết
- Dash phải render đúng trạng thái
- không được mở thêm member một cách im lặng

---

## 11. Billing ledger model

### 11.1 Ledger families

Phải phân biệt rõ:
- `usage ledger`
- `credit ledger`
- `finance ledger`

### 11.2 Finance ledger

Cho `pay.iai.one`, `finance ledger` phải giữ:
- `payment intake`
- `wallet balance mutation`
- `settlement batch`
- `payout execution`
- `reversal`, `dispute`, `correction`

### 11.3 Append-only rule

Ledger phải là `append-only` hoặc có `correction model` kèm audit.
Không được viết lại lịch sử để “sửa cho đẹp”.

---

## 12. Dash billing surfaces

### 12.1 Minimum routes

- `/billing`
- `/billing/usage`
- `/billing/plans`
- `/billing/invoices`

### 12.2 Minimum dashboard truth

Dash phải hiển thị:
- `current plan`
- `usage summary`
- `seat summary`
- `credits summary` nếu có
- `premium lock summary`
- `invoice` hoặc `billing events` nếu có

### 12.3 Error and empty states

Phải có:
- `no billing account yet`
- `no invoices yet`
- `quota reached`
- `entitlement denied`
- `payment provider unavailable`

---

## 13. Pay commercial surfaces

### 13.1 Minimum finance states

`pay.iai.one` phải có:
- `pending`
- `verified`
- `failed`
- `rejected`
- `held`
- `cleared`
- `payout_requested`
- `payout_approved`
- `payout_executed`

### 13.2 Payout rule

`Payout API` chỉ được mở sau khi có:
- `admin verification`
- `approval truth`
- `audit truth`
- `release gate` riêng

### 13.3 Hard rule

Không có `blind auto-release`.
Không có payout bằng UI button nếu `backend approval chain` chưa thật.

---

## 14. Billing and usage APIs

### 14.1 Dash-side required APIs

Phải có API authority cho:
- `current plan`
- `usage summary`
- `seat summary`
- `credit balance`
- `entitlement check`
- `invoice list`
- `billing event list`

### 14.2 Pay-side required APIs

Phải có API authority cho:
- `payment intent`
- `payment confirmation`
- `wallet balance`
- `payout request`
- `payout approval`
- `payout execution`
- `receipt retrieval`

### 14.3 API rules

Mỗi `billing/commercial API` phải:
- có `auth/session truth`
- có `workspace isolation truth`
- có audit nếu là action nhạy cảm
- có `error code` rõ ràng

---

## 15. Security and approval model

### 15.1 Step-up auth

Bắt buộc cho:
- `payout approval`
- thay đổi `bank/account`
- `API payout execution`
- `admin override`
- `manual entitlement grant` nếu là high risk

### 15.2 Approval model

Bắt buộc có:
- `approval request`
- `approval actor`
- `approval result`
- `approval timestamp`
- `approval audit`

### 15.3 Recommended dual-control

Nên áp dụng cho:
- `high-risk payout`
- `large correction`
- `privileged commercial override`

---

## 16. Audit and proof model

### 16.1 Audit events bắt buộc

- `plan change`
- `entitlement override`
- `credit grant / revoke`
- `payout approve / reject / execute`
- `wallet/account sensitive update`
- `invoice/manual correction`

### 16.2 Proof bundle

Mỗi release liên quan billing hoặc pay phải có:
- `API proof`
- `UI proof`
- `ledger proof`
- `approval proof` nếu áp dụng
- `rollback proof`

---

## 17. Release gates for commercial truth

### 17.1 Dash billing lane không được release nếu

- `usage summary` là giả
- `entitlements` không được enforce ở backend
- `current plan` không có `source of truth`
- `quota state` sai
- UI claim có `invoices` hoặc `billing events` nhưng data truth chưa có

### 17.2 Pay lane không được release nếu

- `ledger truth` chưa khóa
- `payout approval chain` chưa thật
- `admin verification` chưa thật
- `secret/provider/environment truth` chưa rõ
- `rollback note` chưa có

---

## 18. Rollout order

### Phase 1

- `usage units`
- `usage emission`
- `plan catalog`
- `entitlement checks`
- `Dash billing summary`

### Phase 2

- `credit ledger`
- `seat truth`
- `invoice shadow`
- `billing events`

### Phase 3

- `pay.iai.one` payment intake truth
- `wallet truth`
- `receipt truth`

### Phase 4

- `payout request / approval / execution truth`
- `settlement logs`
- `finance operations views`

### Phase 5

- `cross-border expansion`
- `crypto lane` chỉ sau một `security/compliance gate` riêng

---

## 19. Team responsibilities

### Team 1

- `gate authority`
- `release decision`
- `risk acceptance`

### Team 2

- `usage emission truth`
- `entitlement truth`
- `billing APIs`
- `pay runtime truth`

### Team 5 / product surfaces

- không được viết lại billing truth
- chỉ consume billing state từ backend authority

### Ops

- `environment`, `secrets`, `provider truth`
- `rotation discipline`
- `deploy safety`

---

## 20. Evidence required

Mỗi release liên quan billing hoặc pay phải có:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`
- target release gate file
- tham chiếu tới `environment/bindings/secrets truth`
- `rollback note`
- `known issues note`

---

## 21. Definition of done

Commercial truth chỉ được coi là khóa khi:
- `usage units` đã rõ
- `usage emission` đã rõ
- `plan / entitlements / credits / seats` đã rõ
- Dash chỉ consume backend truth
- Pay không mutate finance truth ngoài ledger
- Team 1 có thể block release dựa trên `packet + gate + environment truth`

---

## 22. Câu chốt

Không còn kiểu:
- hiển thị chart rồi gọi là billing
- bật feature rồi gọi là entitlement
- nhận tiền rồi mới tính ledger sau
- cho payout chạy rồi mới audit sau

Từ bây giờ:
- `billing = ledger + usage + entitlements + gates`
- `Dash = commercial visibility`
- `Pay = commercial execution`
- `Team 1 = gate cuối`
