# 37_NOOS_TEAM4_KPI_DASHBOARD_AND_TARGETS_2026

# NOOS Team 4 KPI Dashboard and Targets
## Version 1.1
## Status: ACTIVE FOR TEAM 4 EXECUTION
## Domain: NOOS.iai.one

---

## 1. Mục tiêu

Biến Team 4 KPI contract thành dashboard có ngưỡng ra quyết định rõ ràng cho launch, funnel, buyer ops, và retention.

File này không sửa product truth, pricing truth, hay license truth. File này chỉ định nghĩa:
- KPI phải theo dõi
- target và alert threshold
- cadence review
- owner xử lý khi KPI rơi khỏi guardrail

---

## 2. Owner, scope, và source of truth

- Owner: Team 4 Growth Lead
- Scope: funnel performance, checkout, activation, upgrade, support health
- Review cadence: daily 10:00 ICT, daily 17:00 ICT, weekly Friday review

Phụ thuộc bắt buộc:
- `33_NOOS_TEAM4_GROWTH_REVENUE_AND_OPERATIONS_EXECUTION_PLAN_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`
- Team 4 operations contract `/operations/team4`

---

## 3. Dashboard layout

Dashboard phải có 5 khung:

1. Acquisition to product discovery
- landing sessions by source
- product detail sessions by product_code
- CTA click-through rate by source_surface

2. Checkout health
- checkout completion rate
- payment cancel rate
- price/license mismatch alerts

3. Activation and fulfillment
- library activation within 24h
- failed fulfillment incidents
- time to entitlement confirmation

4. Expansion and ladder movement
- AOV
- upgrade rate theo mapped path
- repeat purchase rate 30/60/90 days

5. Buyer ops health
- first response SLA
- resolution SLA
- refund/dispute rate

---

## 4. Core KPI targets and alert thresholds

| KPI | Definition | Green target | Yellow | Red | Owner | Cadence |
| --- | --- | --- | --- | --- | --- | --- |
| conversion-rate-by-product | orders / product detail sessions per `product_code` | đạt hoặc vượt target từng product ở section 5 | thấp hơn target đến 24% | thấp hơn target từ 25% trở lên | Team 4 Growth Lead | daily |
| aov | total net revenue / completed orders | >= 115 USD | 95-114 USD | < 95 USD | Team 4 Growth Lead | daily |
| checkout-completion-rate | completed checkout / checkout starts | >= 70% | 60-69% | < 60% | Team 4 + Team 2 | daily |
| library-activation-rate-24h | orders có library access trong 24h / completed orders | >= 95% | 90-94% | < 90% | Team 4 + Team 2 | daily |
| upgrade-rate | eligible buyers đi lên mapped tier trong cửa sổ credit | >= 8% | 5-7% | < 5% | Team 4 Growth Lead | weekly |
| repeat-purchase-rate-30-60-90d | buyers mua lại trong 30/60/90 ngày | 30d >= 12%, 60d >= 18%, 90d >= 24% | 30d 8-11%, 60d 14-17%, 90d 18-23% | dưới ngưỡng yellow | Team 4 Growth Lead | weekly |
| support-response-sla | ticket được phản hồi lần đầu trong 24h | >= 95% tickets | 90-94% | < 90% | Team 4 Ops Lead | daily |
| refund-dispute-rate | refunds + disputes / completed orders | <= 1.5% | 1.51-2.5% | > 2.5% | Team 4 Ops Lead | weekly |
| pricing-mismatch-incidents | page, checkout, email, hoặc library render sai price/license | 0 per week | 1 per week | >= 2 per week | Team 4 + Team 3 | daily |
| failed-fulfillment-incidents | completed orders chưa grant access đúng hạn | <= 0.5% orders và không có ticket mở > 24h | 0.51-1.0% | > 1.0% | Team 4 + Team 2 | daily |

---

## 5. Wave 1 product targets

Wave 1 lock:
- P02 White Paper
- P03 Architecture
- P04 8 Layers
- P05 Governance
- P07 Vietnam Profile
- P11 Master Pack

| Product | Product detail conversion target | Checkout completion floor | Library activation 24h | Primary next step |
| --- | --- | --- | --- | --- |
| P02 | >= 2.8% | >= 72% | >= 96% | P03 |
| P03 | >= 1.9% | >= 70% | >= 95% | P11 |
| P04 | >= 2.4% | >= 72% | >= 96% | P11 |
| P05 | >= 1.7% | >= 69% | >= 95% | P06 |
| P07 | >= 1.6% | >= 68% | >= 95% | P08 |
| P11 | >= 1.1% | >= 66% | >= 94% | P12 |

Rule:
- không push broader acquisition nếu 2 ngày liên tiếp có hơn 2 KPI ở mức đỏ
- không mở Wave 2 nếu checkout completion, library activation, hoặc pricing mismatch chưa ở xanh trong 5 ngày liên tiếp

---

## 6. Reporting and escalation rules

### Daily readout
- 10:00 ICT: previous day KPI scan
- 17:00 ICT: intraday checkpoint + blocker update

### Weekly review
- Team 4 x Team 3: CTA placement, role-based route performance, pricing copy consistency
- Team 4 x Team 2: checkout failures, webhook delays, missing access root cause
- Team 4 x Team 1: lock compliance audit nếu KPI drift cần đổi wording, route, hoặc ops policy

### Escalation triggers
- pricing-mismatch-incidents > 0 -> escalate same day to Team 3 and Team 1
- failed-fulfillment-incidents > 0.5% -> escalate same day to Team 2
- support-response-sla < 90% -> open incident review within 24h
- refund-dispute-rate > 2.5% -> freeze campaign expansion cho tới khi có root cause

---

## 7. Instrumentation minimum

Bắt buộc có event và dimension:
- `product_viewed`
- `product_cta_clicked`
- `upsell_card_viewed`
- `upsell_card_clicked`
- `checkout_completed`
- `upgrade_credit_applied`
- `library_recommendation_clicked`

Dimension tối thiểu:
- `product_code`
- `tier`
- `license_type`
- `source_surface`
- `buyer_role`
- `launch_wave`

---

## 8. Backlog Team 4

### P0
- wire dashboard cho 10 KPI contract bắt buộc
- xác thực checkout completion và library activation tracking trước Wave 1
- thêm alert cho pricing mismatch và failed fulfillment

### P1
- thêm weekly cohort view cho repeat purchase 30/60/90d
- thêm role-based funnel split cho Individual / Builder / Team / Institution
- thêm upgrade-credit ledger snapshot vào dashboard expansion

---

## 9. Dependencies

- Team 2: checkout event truth, webhook/fulfillment logs, upgrade-credit ledger
- Team 3: page-to-checkout CTA mapping, role-based route tracking, noos route cleanup
- Team 1: lock compliance review nếu cần đổi ngưỡng hoặc cadence

Blocker hiện tại ngày 2026-04-17:
- Team 3 route-level proof đã có; broader campaign expansion vẫn dưới gate cho tới khi Team 4 ghi nhận cửa sổ KPI live đầu tiên sau Wave 1 `READY`

---

## 10. Definition of done

Done khi:
- dashboard cover đủ 10 KPI contract
- Wave 1 có target, threshold, owner, cadence rõ ràng
- alert path Team 2 / Team 3 / Team 1 được định nghĩa
- Team 4 có thể đọc daily và quyết định launch/hold không cần re-interpret lock files
