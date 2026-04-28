# LANE_A_EXECUTION_DIRECTIVE_2026-04-14
## Team 1 Program Root Directive
## Status: ACTIVE
## Effective: 2026-04-14

---

## 1. Objective

Move from P0 stabilization to synchronized multi-team execution without domain-role drift.

---

## 2. Team assignments (next 72h)

### Team 1 (Program Root)
- enforce release gate against mission map + deploy authority + matrix
- run daily 09:00 and 17:00 cross-team sync checkpoints
- publish daily status to `docs/reports/team1/`

### Team 2 (Runtime/Core)
- maintain green tests for `pnpm test` and flow/mail runtime contracts
- keep checkout, entitlement, and library hooks stable for Team 3/5 surfaces
- publish dependency and contract drift notes daily

### Team 3 (NOOS Surface)
- continue shipping product/catalog/library surfaces on locked docs
- keep investor/fundraising legacy routes redirected and noindexed in active NOOS surface
- ensure no new NOOS route violates mission map boundaries
- maintain legacy repository in quarantine mode until full content parity migration is complete

### Team 4 (Growth/Revenue/Ops)
- execute Wave 1 launch sequence only
- operate authority-led funnel, no discount-spam tactics
- monitor checkout completion, library activation, and upgrade ladder KPIs

### Team 5 (web.iai.one new team)
- complete onboarding flow and Flow/API contract integration
- align release and auth/billing vocabulary with Team 1 + Team 2
- do not fork brand meaning or standalone contract language

---

## 3. Hard gates

No production promotion if any is true:
- mission-map conflict detected
- deploy authority mismatch
- ownership matrix mismatch
- test suite red in target service
- NOOS route reintroduces investor/fundraising drift

---

## 4. Reporting protocol

Each team must push:
- daily report by 17:00 ICT
- blocker escalation within 30 minutes of detection
- weekly summary every Friday

Location:
- `docs/reports/team{n}/`

---

## 5. Current lane status

- P0 stabilization: COMPLETE
- Lane A coordinated execution: IN PROGRESS
- Next checkpoint: 2026-04-15 09:00 ICT
