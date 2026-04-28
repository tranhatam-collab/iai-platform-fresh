# FLOWS_IAI_ONE_DELTA_EVIDENCE_2026-04-22

- Domain: `flows.iai.one`
- Owner team: Team B (Automation Owner)
- Delta date: `2026-04-22`
- Baseline packet: `docs/release-evidence/flows.iai.one/FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md`
- Source commit: `OMCODE/smtp-internal-first-phase1@6783482`
- Delta purpose: đóng lỗi `TS5083` đã được ghi nhận trước đó ở `pnpm test:flow-surface`

## 1) Rerun commands and results

| Command | Result | Notes |
|---|---|---|
| `pnpm build:flow` | `PASS` | Build `@iai/flow` thành công |
| `pnpm typecheck:flow` | `PASS` | Không còn lỗi TS |
| `pnpm test:flow-surface` | `PASS` | 4/4 pass, không còn `TS5083` |
| `pnpm test:flow` | `PASS` | 21/21 pass (bao gồm flow contracts + flow surface) |
| `node scripts/flow-local-route-proof.mjs --date=2026-04-22` | `PASS` | Sinh artifact route proof local cho `flows` |

## 2) Blocker status delta

- Blocker cũ trong packet `2026-04-20`:
  - `pnpm test:flow-surface` `FAIL` với `TS5083: Cannot read file 'tsconfig.json'`
- Trạng thái mới:
  - `CLOSED_LOCALLY` (đã rerun xanh, không còn `TS5083`)

## 3) What is still pending (unchanged)

- Đây là delta kỹ thuật local để đóng lỗi build/test và bổ sung local route proof.
- Local route proof artifacts:
  - `docs/release-evidence/flows.iai.one/artifacts/FLOWS_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-22.md`
  - `docs/release-evidence/flows.iai.one/artifacts/FLOWS_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-22.json`
- Owner evidence ở lớp domain production cho `flows.iai.one` vẫn cần bổ sung riêng:
  - route map proof production
  - runtime proof production
  - screenshot proof domain

## 4) Production reachability check from this environment

- Command:
  - `curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' -L https://flows.iai.one/`
  - `curl -i -sS https://flows.iai.one/health`
- Result:
  - `FAIL` (`curl: (6) Could not resolve host: flows.iai.one`)
- Note:
  - Chưa thể ghi nhận runtime proof production trong vòng này từ môi trường hiện tại.

## 5) Suggested Team 1 interpretation

- Có thể cập nhật issue `TS5083` từ `OPEN` sang `CLOSED_LOCAL_EVIDENCE_ATTACHED`.
- Chưa đủ để tự động nâng `flows.iai.one` thành release-ready nếu thiếu evidence production domain-specific.
