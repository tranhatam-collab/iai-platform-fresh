# WEB_IAI_ONE_EXPERIMENT_REGISTRY_2026

# web.iai.one Experiment Registry
## Version 1.0
## Status: ACTIVE - TEAM 5 CONTROL FILE
## Domain: web.iai.one
## Date: 2026-04-14

---

## 1. Mục đích

Khoá registry cho mọi experiment của `web.iai.one` để:
- Team 5 có 1 backlog test rõ ràng
- Team 4 review được KPI impact
- Team 1 kiểm soát mission/language drift
- Team 2 biết test nào có dùng shared auth/billing/API contracts

---

## 2. Owner và scope

- Owner: Team 5 Web Lead
- Review cadence: Team 4 host weekly funnel review
- Contract review: Team 2 khi experiment chạm vào auth/billing/route handoff
- Escalation owner: Team 1 nếu experiment có nguy cơ mission drift

### Scope
- landing/onboarding/activation experiments
- CTA framing và onboarding path experiments
- paid intent và revenue-assist experiments
- route handoff experiments có liên quan `app/flow/dash`

### Out of scope
- pricing truth changes
- billing logic changes
- auth system changes
- experiment trên domain khác mà thiếu Team 1 approval

---

## 3. Experiment rules (locked)

Mỗi experiment phải có:
- `experiment_id`
- owner
- hypothesis rõ
- 1 primary KPI
- ít nhất 1 guardrail
- stop rule
- start/end decision date
- evidence link trong weekly growth report

Chưa được chạy experiment nếu:
- phải tạo auth/billing wording riêng
- làm sai product/mission map
- log thiếu `experiment_id` + `variant_id`
- chưa có rollback path

### Stop rules
- failed auth handoff vượt 3%
- broken route handoff vượt 2%
- bounce rate key path tăng > 15% so với control
- Team 1 hoặc Team 2 đặt hard stop vì conflict contract

---

## 4. Active và planned registry

| Experiment ID | Surface | Hypothesis | Primary KPI | Guardrail | Dependency | Owner | Status |
|---|---|---|---|---|---|---|---|
| `WEB-EXP-001` | Intent-first landing CTA | Nếu đưa user vào role/use-case selection sớm, onboarding start rate sẽ tăng | onboarding start rate | bounce rate key path | Team 1 wording review | Team 5 | READY |
| `WEB-EXP-002` | Shared auth copy | Nếu copy auth nhấn mạnh đây là shared IAI entry, auth completion sẽ tăng và support confusion giảm | visitor -> signup conversion | failed auth handoff | Team 2 contract confirmation | Team 5 | WAITING_TEAM2 |
| `WEB-EXP-003` | Template-led vs use-case-led onboarding | Nếu cho user chọn template hoặc business goal sớm, first action completion trong 24h sẽ tăng | signup -> first action activation | bounce rate, time to first action | Team 3 design language alignment | Team 5 | PLANNED |
| `WEB-EXP-004` | Flow-powered automation proof block | Nếu onboarding show rõ lead/booking/commerce automation, qualified pipeline rate sẽ tăng | campaign -> qualified pipeline | route handoff failure | Team 2 deep link stability | Team 5 | PLANNED |
| `WEB-EXP-005` | Pricing reveal timing | Nếu dời pricing đến sau khi user chọn intent, revenue-assist conversion sẽ tăng mà không giảm trust | revenue-assist conversions | no price/license drift | Team 4 KPI governance | Team 5 | PLANNED |
| `WEB-EXP-006` | Post-auth next-step cards | Nếu sau auth có card gợi ý step tiếp theo, 7d retained user rate sẽ tăng | first action -> retained user | broken route handoff | Team 2 route ownership clarity | Team 5 | BACKLOG |

---

## 5. Experiment intake checklist

Trước khi đưa vào `READY`, phải có:
- hypothesis 1 câu rõ ràng
- control và variant mô tả được
- event tracking map cập nhập
- owner và reviewer rõ
- rollback rule rõ
- expected runtime window rõ ràng

---

## 6. Evidence và reporting rules

Mỗi experiment khi chạy phải báo cáo trong weekly growth report với:
- start date
- segment
- sample size
- KPI delta
- guardrail delta
- kết luận: ship / iterate / stop

Chưa được ghi "win" nếu:
- sample quá nhỏ
- contract failure tăng
- chỉ tăng click mà chưa tăng activation/conversion thật

---

## 7. P0/P1/P2 backlog cho experiment program

### P0
- khoá 2 experiment đầu tiên cho landing + auth handoff
- đảm bảo instrumentation log đủ cho variant
- tạo checklist rollback cho experiment trên onboarding path

### P1
- mở rộng experiment sang paid intent và revenue-assist flows
- thêm segment review theo campaign/role
- tạo weekly archive cho kết quả đã đóng

### P2
- thêm recommendation experiments sau activation
- thêm retention loop experiments
- thêm personalization có guardrail theo trust constraints

---

## 8. Dependencies

- Team 1: mission/language guardrails
- Team 2: auth/session/API handoff confirmation
- Team 4: KPI governance và decision review
- Team 3: design language nếu dùng shared components

---

## 9. Definition of done

Registry này đạt khi:
- mỗi experiment của Team 5 đều có row rõ ràng
- chưa có test nào chạy ngoài registry
- weekly growth report có thể đối chiếu kết quả với từng `experiment_id`
- Team 1/2/4 có thể review fast mà chưa cần hỏi lại context nền
