# WEB_IAI_ONE_NEW_TEAM_EXECUTION_PLAN_2026

# web.iai.one New Team Execution Plan
## Version 1.0
## Status: LOCKED FOR TEAM 5 EXECUTION
## Domain: web.iai.one
## Date: 2026-04-14

---

## 1. Mục đích team mới

`web.iai.one` là growth engine mới của hệ `*.iai.one`, phục vụ:
- user acquisition
- activation
- conversion
- revenue support

Chưa được trở thành hệ riêng.
Phải chạy trên cùng trust/auth/billing/proof contracts của hệ.

---

## 2. Boundary lock cho Team 5

### Team 5 phải làm
- xây growth product surface có KPI rõ
- kết nối với `app/flow/dash/api` thay vì tạo stack riêng
- tạo experiment framework cho conversion

### Team 5 chưa được làm
- tạo auth system riêng
- tạo billing rails riêng
- đổi domain mission map
- duplicate vai trò `home.iai.one` hoặc `app.iai.one`

---

## 3. Team 5 dependencies phải có

- Team 1: domain mission, release gates, conflict arbitration
- Team 2: auth/billing/api contracts, runtime endpoints
- Team 4: growth ops, KPI governance, funnel operations
- Team 3: shared design language and cross-link with NOOS surfaces
- Team 1 + Team 3: bilingual SEO/localization compliance theo global lock file

## 3A. Team 5 operating files (phải duy trì)

- KPI baseline + release gates: `docs/WEB_IAI_ONE_KPI_BASELINE_AND_RELEASE_GATES_2026.md`
- experiment registry: `docs/WEB_IAI_ONE_EXPERIMENT_REGISTRY_2026.md`
- weekly growth ledger: `docs/WEB_IAI_ONE_WEEKLY_GROWTH_REPORT_2026.md`
- localization and SEO lock: `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

---

## 4. P0/P1/P2 backlog

### P0 (10-14 ngày)
- route map and IA lock for web.iai.one
- MVP landing-to-conversion path
- shared auth entry and session handoff
- analytics baseline events
- go-live with contract compliance

### P1
- role-based landing variants
- conversion experiments (CTA, offer framing, onboarding paths)
- deep links vào app/flow/dash theo intent

### P2
- retention loops
- referral/community growth hooks (nếu phù hợp mission)
- advanced funnel personalization under trust constraints

---

## 5. KPI contract cho Team 5

### Phải theo dõi
- visitor -> signup conversion
- signup -> first action activation
- first action -> retained user
- campaign -> qualified pipeline
- revenue-assist conversions

### Guardrail metrics
- bounce rate on key paths
- failed auth handoff
- broken route handoff to app/flow/dash

---

## 6. Integration checklist

- auth contract dùng contract Team 2
- billing references dùng contracts chung
- proof/audit references chưa xung đột
- route handoff sang app/flow/dash test pass
- domain mission compliance pass (Team 1 sign-off)
- locale compliance pass (`en/vi`, Vietnamese có dấu, canonical/hreflang đúng)

---

## 7. Weekly sync format

### Team 5 x Team 1
- mission compliance
- launch gate readiness

### Team 5 x Team 2
- API/auth dependency health

### Team 5 x Team 4
- funnel and experiment review
- performance actions for next week

---

## 8. Definition of done Team 5

Team 5 đạt khi:
- web.iai.one go-live trên contracts chung
- có conversion funnel running with measurable KPIs
- chưa phá role của root/core domains
- có cadence optimize hằng tuần
