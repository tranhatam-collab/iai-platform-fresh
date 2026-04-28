# TEAM1_DEV_BEST_VERSION_BASELINE_2026-04-28
- Team: Team 1 Program Root / Control Tower
- Date: 2026-04-28
- Status: ACTIVE BASELINE (kế thừa 2026-04-26, delta 04-27..04-28 ghi dưới)

## 1. Mục tiêu baseline

Định nghĩa "phiên bản tốt nhất hiện tại" cho Team Dev để giữ đồng bộ command/report/gate và chuẩn ngôn ngữ nhất quán.

## 2. Bộ tài liệu chuẩn đang hiệu lực

- Root protocol: `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
- Directive: `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
- Team 1 live board: `docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
- Team 1 decision log: `docs/reports/team1/TEAM1_DECISION_LOG_2026.md`
- **[NEW 04-27]** Legal foundation lock: `docs/PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` v1.0.1

## 3. Bộ kiểm tra bắt buộc

- `pnpm report:lane`
- `pnpm report:nft-phasec`
- `pnpm report:team1-language`
- `pnpm report:control-tower`
- `node scripts/team1-pay-prod-gate-check.mjs`

## 4. Chuẩn ngôn ngữ và mở rộng đa ngôn ngữ

- `docs/IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026.md`
- `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md`
- `docs/reports/team1/TEAM1_MULTILINGUAL_EXPANSION_READINESS_2026-04-28.md`

## 5. Gate status trọng yếu (2026-04-28)

- Lane 04-27: **PASS** (confirmed `pnpm report:lane -- --date=2026-04-27` post `1c0894e`)
- Lane 04-28: FAIL cho đến khi T4+T5 commit 04-28 cycle
- `pay.iai.one`: `LOCK_RETAINED_WITH_REASON` — 9 signal FAIL (canonical key + shared runtime + probe)
- `trust.iai.one`: Phase 1.5 live (`1915ab4`); custom domain bind blocked (zone/account mismatch)
- `invoice.iai.one`: Internal Error (Pay+Email §9 step 1 priority)

## 6. Delta vs 2026-04-26

- **[04-27]** Legal foundation lock v1.0.1 locked: `pay.iai.one = ORCHESTRATOR` rule, §9 dev plan 7 bước, Q-DEV-PAY-1..5 RESOLVED.
- **[04-27]** T4+T5 04-27 cycle: DAILY/REPORT/KPI/READINESS/PACKET T4+T5 04-27 submitted (commit `d33a067`).
- **[04-27]** Trust Phase 1.5: 7 modules + trust band align (commit `1915ab4`).
- **[04-28]** tramsaigon.com: SITE-INTAKE-112 → `FORM_IN_PROGRESS` (commit `d21e77d`, Pay+Email scope).
- **[04-28]** Lane snapshot 04-27 regenerated PASS (commit `1c0894e`).

## 7. 4-agent boundary plan

- `docs/IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md` v1.0.3
- Ranh giới hiệu lực: Pay+Email | Codex T1+T2+T3 | T4+T5 | teamd
- trust.iai.one: Codex T1+T2+T3 scope (Phase 1.5 delivered, Phase 2 custom domain blocked)
