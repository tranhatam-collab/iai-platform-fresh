# TEAM1_DEV_BEST_VERSION_BASELINE_2026-04-26
- Team: Team 1 Program Root / Control Tower
- Date: 2026-04-26
- Status: ACTIVE BASELINE (kế thừa 2026-04-22, không drift)

## 1. Mục tiêu baseline

Định nghĩa "phiên bản tốt nhất hiện tại" cho Team Dev để giữ đồng bộ command/report/gate và chuẩn ngôn ngữ nhất quán.

## 2. Bộ tài liệu chuẩn đang hiệu lực

- Root protocol: `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
- Directive: `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
- Team 1 live board: `docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
- Team 1 decision log: `docs/reports/team1/TEAM1_DECISION_LOG_2026.md`

## 3. Bộ kiểm tra bắt buộc

- `pnpm report:lane`
- `pnpm report:nft-phasec`
- `pnpm report:team1-language`
- `pnpm report:control-tower`

## 4. Chuẩn ngôn ngữ và mở rộng đa ngôn ngữ

- `docs/IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026.md`
- `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md`
- `docs/reports/team1/TEAM1_MULTILINGUAL_EXPANSION_READINESS_2026-04-26.md`

## 5. Gate status trọng yếu

- Control loop checkpoint 2026-04-26: lane FAIL (T4/T5 daily/report 2026-04-26 còn thiếu — out-of-scope của Team 1+2+3 hiện tại).
- `pay.iai.one`: vẫn `LOCK_RETAINED_WITH_REASON` cho đến khi 4 tín hiệu auth/checkout/no_214/production gate PASS + 3 tín hiệu shared runtime PASS.
- Team C cios.iai.one: closure attachment 04-23 đã có (8/8 PASS), accept queue.

## 6. Delta vs 2026-04-22

- payOS production channel `tranhatam` activated (Team 2, 04-24).
- `provider_accounts` row inserted (`pa_tranhatam_payos_live_20260424`).
- Team C closure attachment 04-23 nộp đầy đủ.
- Section 7 audit theo `TRANHATAM_COM_NON_TEAMD_GAP_AND_RESPONSIBILITY_MATRIX_2026-04-24.md` đã hoàn thành (artifact `*_AUDIT_*_2026-04-26.md`).
- Pay gate vẫn LOCK_RETAINED — không đủ điều kiện flip.
