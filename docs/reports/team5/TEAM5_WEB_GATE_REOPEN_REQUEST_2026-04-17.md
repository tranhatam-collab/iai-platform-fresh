# TEAM5_WEB_GATE_REOPEN_REQUEST_2026-04-17
- Nhóm: Team 5 (`web.iai.one`)
- Chủ trì: Team 5 Web Lead
- Ngày yêu cầu: 2026-04-17
- Người review mục tiêu: Team 1 Program Root
- Loại yêu cầu: review mở lại preview gate
- Trạng thái: APPROVED_FOR_PREVIEW_REOPEN (quyết định Team 1 đã log ngày 2026-04-17)

## 1. Tóm tắt yêu cầu

Team 5 đề nghị Team 1 review và quyết định mở lại preview gate cho `web.iai.one` dựa trên packet evidence đã đính kèm.

Yêu cầu này tuân theo directive của Team 5 trong:
- `docs/IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17.md` (từ dòng 158 trở đi)

## 2. Evidence đính kèm

- Preview release packet:
  - `docs/release-evidence/web.iai.one/WEB_IAI_ONE_PREVIEW_RELEASE_EVIDENCE_PACKET_2026-04-17.md`
- Bilingual route QA packet:
  - `docs/release-evidence/web.iai.one/WEB_IAI_ONE_BILINGUAL_ROUTE_QA_PACKET_2026-04-17.md`
- Team 5 daily status update:
  - `docs/reports/team5/DAILY_TEAM5_2026-04-17.md`
- Team 5 weekly status update:
  - `docs/reports/team5/WEEKLY_TEAM5_2026_W16.md`
- Lane snapshot tham chiếu:
  - `docs/reports/team1/LANE_STATUS_SNAPSHOT_2026-04-17.md` (`Overall: PASS`)

## 3. Checklist tuân thủ directive (Team 5)

- [x] Giữ web contract xanh theo shared auth/billing/API truth.
- [x] Không trùng vai trò với `home.iai.one` hoặc `app.iai.one`.
- [x] Đồng bộ metadata, locale handoff, CTA và boundary wording với baseline shell.
- [x] Packet có đủ route proof, metadata proof, dependency note và rollback note.
- [x] Team 2 contract evidence đã đính kèm và hành vi consumer đã được xác minh.

## 4. Trạng thái dependency hiện tại

- Dependency contract Team 2:
  - CLOSED cho cửa sổ xác nhận onboarding contract của Team 5.
  - Chế độ hiện tại: monitor-only cho runtime contract stability.
- Dependency Team 1:
  - CLOSED: quyết định reviewer cho preview reopen đã hoàn tất.
  - Tham chiếu: `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-17.md`

## 5. Kết quả quyết định của Team 1

- decision: `APPROVED_FOR_PREVIEW_REOPEN`
- source: `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-17.md`
- follow-up mode: giữ dependency runtime ở monitor-only, không tạo preview->release claim nếu chưa có yêu cầu gate mới từ Team 1.
