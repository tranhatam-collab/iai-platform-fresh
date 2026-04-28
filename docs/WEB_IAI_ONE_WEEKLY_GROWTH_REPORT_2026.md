# WEB_IAI_ONE_WEEKLY_GROWTH_REPORT_2026

# web.iai.one Weekly Growth Report
## Version 1.0
## Status: ACTIVE - WEEKLY TEAM 5 OPERATING FILE
## Domain: web.iai.one
## Date: 2026-04-14

---

## 1. Mục đích

Đây là weekly growth ledger của Team 5 cho `web.iai.one`.

File này dùng để:
- tổng hợp weekly growth truth ở 1 chỗ
- làm source để xuất `docs/reports/team5/WEEKLY_TEAM5_YYYY_WW.md`
- review KPI, experiments, blockers, và release readiness với Team 1/2/4

---

## 2. Owner và scope

- Owner: Team 5 Web Lead
- KPI reviewer: Team 4 Growth Lead
- Contract reviewer: Team 2 Runtime Lead
- Release reviewer: Team 1 Program Root

### Scope
- acquisition, onboarding, activation, conversion, retention summary cho `web.iai.one`
- experiment result summary
- release gate readiness
- dependency và decision requests

---

## 3. Weekly cadence và schema

Cadence:
- Team 5 phải cập nhập file này trước Friday 16:00 ICT
- Từ file này xuất weekly report chuẩn trong `docs/reports/team5/`

Mỗi weekly cập nhập phải có:
1. Goals committed vs delivered
2. KPI snapshot
3. Experiment changes
4. Major blockers and resolutions
5. Carry-over items
6. Next-week plan
7. Decisions needed from Team 1

---

## 4. KPI snapshot format (locked)

Phần KPI snapshot mỗi tuần phải có ít nhất:
- visitor -> signup conversion
- signup -> first action activation
- first action -> retained user
- campaign -> qualified pipeline
- revenue-assist conversions
- bounce rate on key paths
- failed auth handoff
- broken route handoff

Nếu chưa live traffic:
- ghi rõ `baseline pending`
- ghi lý do
- ghi readiness cho instrumentation và pilot traffic

---

## 5. Experiment reporting format

Mỗi tuần chỉ báo cáo experiment có thay đổi state:
- `experiment_id`
- state change
- KPI delta
- guardrail delta
- kết luận
- next action

---

## 6. Weekly ledger

### Week `2026-W16`
- Week status: IN_PROGRESS
- Goals committed:
  - finalize web onboarding + Flow/API integration contract
  - lock KPI baseline and experiment registry
  - align auth/billing vocabulary with Team 1 + Team 2
- Goals delivered:
  - onboarding context synchronized with mission-map and release authority
  - Team 5 KPI baseline document drafted and locked
  - Team 5 experiment registry drafted and locked
  - minimal `apps/web` onboarding surface built with shared Flow/API contract reads
  - onboarding smoke test passed for shared-auth redirect and Team 2 contract calls
  - canonical auth/billing/deep-link handoff targets now read from Team 2 shared onboarding contract endpoint
- KPI snapshot:
  - visitor -> signup conversion: baseline pending (pilot traffic chưa live)
  - signup -> first action activation: baseline pending (instrumentation rollout đang hoàn tất chuyển)
  - first action -> retained user: baseline pending
  - campaign -> qualified pipeline: baseline pending
  - revenue-assist conversions: baseline pending
  - bounce rate on key paths: baseline pending
  - failed auth handoff: shared redirect mode wired, Team 2 final auth contract pending
  - broken route handoff: smoke pass for configured handoff targets
  - Team 2 contract health: `api.flow` trả về 1 open critical billing alert (`alt_9001`)
- Experiment changes:
  - `WEB-EXP-001`: moved to READY
  - `WEB-EXP-002`: moved to WAITING_TEAM2
- Major blockers and resolutions:
  - blocker: Team 2 contract confirmation window chưa đóng
  - resolution: route/auth/billing targets đã khoá qua Team 2 endpoint, nhưng release vẫn bị block bởi critical billing alert `alt_9001` và overdue item `inv_2301`
- Carry-over:
  - finish instrumentation for all P0 events
  - thêm persistent analytics/proof sink cho P0 events
  - stand up daily KPI snapshot
- Next-week plan:
  - run pilot traffic with instrumented onboarding
  - launch first approved landing experiment
  - prepare Tier 1 preview release packet
- Decisions needed from Team 1:
  - confirm reviewer cho Team 5 preview release gate
  - confirm copy language đã đúng mission boundary cho growth onboarding

---

## 7. Ongoing backlog

### P0
- weekly KPI snapshot có đủ signal để Team 4 review
- weekly report xuất theo protocol folder `docs/reports/team5/`
- release gate packet đọc rõ cho Team 1

### P1
- thêm cohort notes cho retention và campaign quality
- thêm experiment archive theo quarter
- thêm variance notes giữa informational vs paid business intent

### P2
- thêm benchmark so sánh week-over-week và month-over-month
- thêm recommendations layer cho next best experiment

---

## 8. Dependencies

- Team 1: release gate reviewer và mission compliance sign-off
- Team 2: shared auth/session/API confirmation
- Team 4: KPI governance review và funnel interpretation

---

## 9. Definition of done

File này đạt khi:
- Team 5 có 1 weekly growth ledger chạy đều
- weekly report protocol có source of truth rõ ràng
- KPI, experiments, blockers, và decisions có thể nhìn thấy trong 1 file
- release review với Team 1/2/4 chỉ cần 1 file để gom context
