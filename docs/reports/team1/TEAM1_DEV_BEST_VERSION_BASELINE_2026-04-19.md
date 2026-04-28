# TEAM1_DEV_BEST_VERSION_BASELINE_2026-04-19
- Team: Team 1 Program Root / Control Tower
- Date: 2026-04-19
- Status: ACTIVE BASELINE

## 1. Mục tiêu baseline

Định nghĩa “phiên bản tốt nhất hiện tại” cho Team Dev để:
- giữ đồng bộ command/report/gate,
- giữ chuẩn ngôn ngữ nhất quán,
- sẵn sàng mở rộng đa ngôn ngữ mà không phá quy trình release.

## 2. Bộ tài liệu chuẩn đang hiệu lực

- Root protocol:
  - `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`
- Directive:
  - `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md`
- Execution board:
  - `docs/EXECUTION_BOARD_2026-04-18.md`
- Team 1 live board:
  - `docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
- Team command pack:
  - `docs/TEAM_DAILY_COMMAND_PACK_2026-04-18.md`
- Decision log:
  - `docs/reports/team1/TEAM1_DECISION_LOG_2026.md`

## 3. Bộ kiểm tra bắt buộc

- `pnpm report:lane`
- `pnpm report:nft-phasec`
- `pnpm report:team1-language`
- `pnpm report:control-tower` (đã tích hợp language check)

## 4. Chuẩn ngôn ngữ và mở rộng đa ngôn ngữ

- Language playbook:
  - `docs/IAI_MULTILINGUAL_EXPANSION_PLAYBOOK_2026.md`
- Canonical glossary:
  - `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md`
- Readiness report:
  - `docs/reports/team1/TEAM1_MULTILINGUAL_EXPANSION_READINESS_2026-04-19.md`

## 5. Trạng thái gate hiện tại

- Domain technical map: giữ nguyên theo checkpoint Team 1 gần nhất.
- Release control state toàn cục: phụ thuộc daily confirmation `team1..team5` theo ngày.
- `pay.iai.one`: vẫn `prep-only`, chưa mở release claim.

## 6. Rule cập nhật baseline

Chỉ cập nhật file baseline này khi có một trong các thay đổi sau:
- thay đổi pipeline kiểm tra,
- thay đổi root protocol/directive,
- thay đổi gate discipline ảnh hưởng toàn team,
- mở thêm ngôn ngữ mới vào scope chính thức.
