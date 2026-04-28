# WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026

# web.iai.one KPI Baseline and Release Gates
## Version 1.0
## Status: LOCKED FOR TEAM 5 EXECUTION
## Domain: web.iai.one
## Date: 2026-04-14

---

## 1. Mục đích

Khoá KPI baseline và release gate tối thiểu cho `web.iai.one` để:
- đo được acquisition -> activation -> conversion theo cùng funnel truth
- không lệch khỏi shared auth/billing/proof contracts
- release dựa trên metric và gate rõ ràng, không dựa trên cảm giác

---

## 2. Owner và scope

- Owner: Team 5 Web Lead
- KPI governance reviewer: Team 4 Growth Lead
- Contract reviewer: Team 2 Runtime Lead
- Release gate approver: Team 1 Program Root

### Scope
- acquisition entries cho `web.iai.one`
- onboarding wizard và intent routing
- shared auth/session handoff
- route handoff sang `app.iai.one`, `flow.iai.one`, `dash.iai.one`
- paid commerce/business assist paths

### Out of scope
- auth infrastructure SLA chi tiết của Team 2
- billing backbone metrics của Team 2
- NOOS commerce KPI dashboard của Team 4

---

## 3. Shared funnel truth

Funnel chuẩn Team 5 phải đo theo cùng 1 cách:

1. Visitor vào entry surface
2. Visitor chọn intent/role và bắt đầu onboarding
3. Shared auth handoff thành công
4. User đạt first meaningful action
5. User vào trạng thái có handoff tới Flow/API/shared product surface
6. User bắt đầu paid intent hoặc revenue-assist handoff
7. User quay lại trong cửa sổ retention

### First meaningful action (locked)

User được tính là activated khi hoàn thành ít nhất 1 trong các action:
- tạo site draft đầu tiên
- chọn template/use-case path
- kết nối Flow-powered action đầu tiên
- tạo lead/booking/commerce setup đầu tiên

---

## 4. Analytics event baseline (P0 yêu cầu)

Toàn bộ event dưới đây phải có `timestamp`, `user_or_anonymous_id`, `route`, `variant_id` (nếu có experiment), và `source_campaign` (nếu có):

- `web_landing_view`
- `web_role_selected`
- `web_onboarding_started`
- `web_auth_handoff_started`
- `web_auth_handoff_completed`
- `web_auth_handoff_failed`
- `web_first_action_completed`
- `web_flow_handoff_completed`
- `web_route_handoff_failed`
- `web_paid_intent_started`
- `web_revenue_assist_completed`
- `web_returned_within_7d`

Nếu surface đang chạy experiment, phải log thêm:
- `experiment_id`
- `variant_id`
- `assignment_reason`

---

## 5. KPI baseline

Đây là baseline vận hành ban đầu cho giai đoạn pre-go-live và pilot traffic.  
Nếu chưa đủ sample, release gate dùng `release floor` + contract smoke + QA evidence.

| KPI | Định nghĩa | Baseline vận hành | Release floor | Owner |
|---|---|---:|---:|---|
| Visitor -> signup conversion | `web_auth_handoff_completed / web_landing_view` | 8% | 4% | Team 5 |
| Signup -> first action activation | `web_first_action_completed trong 24h / web_auth_handoff_completed` | 45% | 30% | Team 5 |
| First action -> retained user | `web_returned_within_7d / web_first_action_completed` | 30% | 18% | Team 5 + Team 4 |
| Campaign -> qualified pipeline | `paid intent hoặc sales-qualified handoff / campaign visitors` | 10% | 5% | Team 5 + Team 4 |
| Revenue-assist conversions | `web_revenue_assist_completed trong 14d / activated users` | 6% | 2% | Team 5 + Team 4 |

### Guardrail metrics

| Guardrail | Định nghĩa | Operating target | Hard ceiling |
|---|---|---:|---:|
| Bounce rate on key paths | % session rời sau landing/onboarding mà chưa có next step | <= 45% | 60% |
| Failed auth handoff | `web_auth_handoff_failed / web_auth_handoff_started` | <= 1% | 3% |
| Broken route handoff | `web_route_handoff_failed / handoff attempts` | <= 0.5% | 2% |
| Median time to first action | thời gian từ auth complete -> first action | <= 15 phút | 30 phút |
| Missing required instrumentation | % core steps thiếu event | 0% | 0% |

---

## 6. Measurement rules

### Cửa sổ đo
- signup conversion: same session hoặc trong 24h
- activation: trong 24h sau auth handoff complete
- retention: 7 ngày
- revenue-assist conversion: 14 ngày

### Sample rules
- < 100 landing visitors: dùng QA/pilot evidence, chưa khoá baseline thật
- >= 500 landing visitors và >= 50 auth completes: khoá baseline lần 1
- >= 2,000 landing visitors: review lại baseline và guardrail với Team 4

### Segments yêu cầu
- new vs returning
- campaign vs direct
- free informational intent vs paid business/commercial intent
- variant A/B nếu có experiment đang chạy

---

## 7. Release gates

## Gate 1 - Mission and language
- copy không được biến `web.iai.one` thành root brand clone
- không được tự mô tả auth/billing như 1 hệ riêng
- Flow integration phải hiển thị rõ như shared system capability, chứ không phải stack riêng

## Gate 2 - Contract compliance
- shared auth entry dùng contract Team 2
- billing references dùng plan/billing truth chung
- meaningful actions có proof/audit-ready identifiers
- route handoff tới `app/flow/dash` có owner rõ ràng

## Gate 3 - Measurement readiness
- 100% event trong section 4 có mặt trên preview hoặc pilot
- dashboard/cơ sở tổng hợp metric có thể đọc được hằng ngày
- experiment surfaces log `experiment_id` và `variant_id`

## Gate 4 - Quality and UX
- không có broken handoff blocker ở P0 path
- failed auth handoff nằm dưới hard ceiling
- bounce rate key path không vượt ceiling trong pilot traffic
- copy dictionary auth/billing đã được Team 1 + Team 2 review

## Gate 5 - Operational readiness
- Team 5 có weekly growth report đang vận hành
- rollback owner, release owner, và incident contact đã ghi rõ
- Team 1 được notify trước khi release Tier 1

---

## 8. P0/P1/P2 backlog cho KPI system

### P0
- instrument đầy đủ event baseline trong onboarding và handoff
- khoá copy dictionary cho auth/session/billing references
- map first meaningful action vào shared proof model
- có dashboard daily đọc được conversion, activation, và guardrails

### P1
- thêm segmentation theo role/use-case/campaign
- thêm experiment attribution by funnel stage
- thêm 7d retention cohort review

### P2
- thêm predictive quality scoring cho high-intent leads
- thêm retention breakdown theo product archetype
- thêm benchmark so sánh campaign cohorts theo quarter

---

## 9. Dependencies

- Team 1: mission compliance và release gate sign-off
- Team 2: auth/session/billing/API contract confirmation
- Team 4: KPI governance và funnel review cadence
- Team 3: design language alignment nếu có shared surface components

---

## 10. Definition of done

File này đạt khi:
- Team 5 có 1 bộ KPI baseline đọc được, chạy được, review được
- release gate cho `web.iai.one` có pass/fail rõ ràng
- events, funnels, và guardrails khớp với shared contract language
- weekly growth report có thể dùng file này làm source of truth
