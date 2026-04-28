# TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-22
- Scope: `developer.iai.one`, `cdn.iai.one`, `flows.iai.one`, `cios.iai.one`

## 1) Verdict theo domain

### `developer.iai.one`
- Verdict: `REOPEN_REVIEW_APPROVED`
- Lý do:
  - Team A đã nộp đủ packet và request reopen.
  - Team 1 verify lại `pnpm test:developer` ngày 2026-04-22: `PASS` (`5/5`).
- Ghi chú:
  - Đây là verdict reopen review; không tự động đồng nghĩa `GO` live claim.

### `cdn.iai.one`
- Verdict: `REOPEN_REVIEW_DENIED_PENDING_OWNER_EVIDENCE`
- Lý do:
  - Thiếu deploy/rule/cache proof domain-specific.
  - Chưa có smoke/asset header evidence cho CDN gate.

### `flows.iai.one`
- Verdict: `REOPEN_REVIEW_PENDING_ROUTE_RUNTIME_PROOF`
- Lý do:
  - Team 1 verify lại `pnpm test:flow-surface` ngày 2026-04-22: `PASS` (`4/4`).
  - Tuy vậy, packet hiện tại vẫn thiếu route/runtime proof production cho domain `flows.iai.one`.
- Ghi chú:
  - Issue `TS5083` trong packet cũ không còn tái hiện ở workspace này; cần Team B cập nhật packet bằng evidence mới.

### `cios.iai.one`
- Verdict: `SUBMITTED_EVIDENCE_REVIEW_PENDING`
- Lý do:
  - Owner evidence đã nộp.
- Team 1 closure checker ngày `2026-04-22` vẫn `FAIL` với 2 check còn mở:
  - `upstreamVitestPass` (`TIMEOUT`)
  - `strictSmokePass` (`FAIL_EXIT_1`)
- Pack screenshot đã hiện diện, nhưng chưa đủ để close review khi 2 check trên còn fail.

## 2) Điều phối tiếp theo

1. Team A nhận reopen verdict và chờ slot Team 1 review lane kế tiếp.
2. Team B (CDN) nộp đủ deploy/rule/cache/rollback evidence domain-specific.
3. Team B (Flows) bổ sung route/runtime proof production và cập nhật packet bằng kết quả test mới.
4. Team C xử lý dứt điểm `upstreamVitestPass` + `strictSmokePass`, rồi nộp lại closure snapshot cho Team 1.
