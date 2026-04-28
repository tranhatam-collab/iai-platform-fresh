# TEAM1_2_3_TNO_CONTINUOUS_EXECUTION_PLAN_2026-04-28

- Owner lane: Team 1 + Team 2 + Team 3
- Execution alias: TEAM_NOVA_OPS (TNO)
- Date locked: 2026-04-28
- Mode: CONTINUOUS_DEV
- Report target: Founder update loop

## 1) Mission lock

Operate continuous development for Team 1-2-3 with strict gate discipline:

1. Keep Team 1 control/gate artifacts current.
2. Keep Team 2 dash/runtime proof fresh and rerun-ready.
3. Keep Team 3 NOOS contract/surface green after any upstream delta.
4. Maintain cross-team visibility (Team A/B/C, Team 4/5, Pay+Email) without scope overlap.
5. Publish founder-readable status deltas on every significant state change.

## 2) Scope and boundaries

### In scope

- Team 1 reports/checkers/gate decisions.
- Team 2 monitor-only runtime checks and preflight/bundle tracking.
- Team 3 NOOS tests/contracts/typecheck and route truth maintenance.
- TNO coordination board updates and blocker escalation notes.

### Out of scope (unless reassigned)

- Team 4/5 implementation work.
- Team A/B/C implementation work.
- Pay+Email implementation requiring provider secrets or external owner action.

## 3) Continuous cadence

### A) 15-minute watch loop (light)

1. Detect any new artifact under:
   - `docs/reports/team1/`
   - `docs/reports/team2/`
   - `docs/reports/team3/`
   - `docs/reports/pay-email-agent/`
2. If new pay-related artifact appears, immediately rerun:
   - `node scripts/team1-pay-prod-gate-check.mjs --date=2026-04-28`
   - `node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-04-28`
3. If no new artifact, keep watch-only (no noisy rerun).

### B) 60-minute control loop (standard)

1. Team 1 control integrity:
   - `pnpm report:lane -- --date=2026-04-28`
   - `pnpm report:nogo-packets -- --date=2026-04-28`
2. Team 2 readiness snapshot:
   - `node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-28 --preflight-only`
3. Team 3 health snapshot:
   - `pnpm typecheck:noos-web`
   - `pnpm test:noos-commerce-contracts`
4. Update TNO boards when any state changes.

### C) End-of-cycle deep loop (each major change)

Trigger when one of these occurs:

- Canonical pay key appears.
- Pay+Email publishes new runtime/shared probe artifacts.
- NOOS contract or checkout-flow signature changes.

Then run:

1. Team 2 explicit preflight:
   - `TEAM2_PAY_GATE_TENANT_CODE=vetuonglai TEAM2_PAY_GATE_SITE_CODE=vetuonglai-member TEAM2_PAY_GATE_PROVIDER=payos node scripts/team2-pay-prod-rerun-bundle.mjs --date=2026-04-28 --preflight-only`
2. Team 1 pay review:
   - `node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-04-28`
3. Team 3 full NOOS stack verification (when environment allows):
   - `pnpm test:noos-web`
   - `pnpm test:noos-stack`

## 4) Report update contract (always-on)

### Core boards to keep updated

1. `docs/reports/team1/TEAM1_2_3_CONSOLIDATED_STATUS_2026-04-28.md`
2. `docs/reports/team1/TEAM_NOVA_OPS_REMAINING_TEAMS_EXECUTION_2026-04-28.md`
3. `docs/reports/team1/TEAM_NOVA_OPS_OWNER_SIGNOFF_DEBT_2026-04-28.md`
4. `docs/reports/team1/DAILY_TEAM1_2026-04-28.md`

### Update rule

- Any state transition (PASS->FAIL, FAIL->PASS, BLOCKED->READY, TODO->0) must be reflected in boards in the same execution round.
- No stale claim allowed in daily report after rerun confirms newer truth.

## 5) Cross-team sync protocol

TNO keeps a strict consumer role for external lanes:

1. Read latest Team 4/5 reports and note only dependencies impacting Team 1-2-3 gates.
2. Read Pay+Email evidence updates and rerun Team 1/2 checkers immediately.
3. Read Team A/B/C packet movement for NO-GO closure tracking.
4. Escalate only with exact unmet signals/artifacts, no generic reminders.

## 6) Founder reporting format

Every update to founder uses this compact frame:

1. What changed since last report (delta only).
2. Current gate state (pay gate, NO-GO, Team 2 preflight, Team 3 health).
3. Exact blockers that still require external owner action.
4. Next execution steps already started.

## 7) Continuous done criteria

TNO mission for this cycle is complete only when all below are true:

1. Pay gate reaches reviewable state and Team 1 can issue valid flip review verdict.
2. NO-GO packet status is PASS for all 4 blocked domains.
3. Team 2 preflight is no longer blocked by missing canonical key.
4. Team 3 NOOS checks remain green after latest upstream change.

Until then, keep continuous loop active.
