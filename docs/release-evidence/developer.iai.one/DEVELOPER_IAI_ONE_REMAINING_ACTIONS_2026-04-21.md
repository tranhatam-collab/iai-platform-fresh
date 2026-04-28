# DEVELOPER_IAI_ONE_REMAINING_ACTIONS_2026-04-21

- Domain: `developer.iai.one`
- Owner: Team A DevRel Owner
- Updated at: `2026-04-21`
- Current status: `READY_FOR_TEAM1_REOPEN_VERDICT`

## 1) Progress snapshot

- Engineering local completion: **100%**
  - lane + 7 required routes + tests + local proof đã hoàn tất
- Release gate completion (Team 1 reopen): **98%**
- Remaining: **2%**

## 2) Checkpoint matrix

| Checkpoint | Weight | Status | Evidence |
|---|---:|---|---|
| Implement `apps/developer` lane | 20% | `DONE` | `apps/developer/src/*` |
| Implement 7 required routes | 20% | `DONE` | `/quickstart`, `/auth`, `/api/reference`, `/webhooks`, `/sdk`, `/nodes`, `/changelog` |
| Integration tests pass | 15% | `DONE` | `pnpm test:developer` |
| Build + typecheck pass | 10% | `DONE` | `pnpm build:developer`, `pnpm typecheck:developer` |
| Local route/canonical proof artifact | 5% | `DONE` | `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.*` |
| Deploy scaffold tối thiểu trong `apps/developer` | 10% | `DONE` | `wrangler.jsonc`, `scripts/build-static.mjs`, `functions/health.js`, `pnpm --filter @iai/developer build:pages` |
| Packet cập nhật review-ready | 0% | `DONE` | `DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-21.md` |
| Preview deploy candidate proof | 10% | `DONE` | `https://376c6044.iai-developer.pages.dev` + alias URL |
| Preview screenshot pack (`/`, 7 required routes) | 10% | `DONE` | `docs/release-evidence/developer.iai.one/artifacts/screenshots/*.png` |
| Live curl pack (`/auth`, `/api/reference`, `/webhooks`) | 5% | `DONE` | `docs/release-evidence/developer.iai.one/artifacts/curl/*-final.txt` |
| Team 1 gate reopen verdict | 2% | `OPEN` | Chờ Team 1 verdict cuối |
| Team 1 reopen request packet chuẩn hóa | 3% | `DONE` | `DEVELOPER_IAI_ONE_TEAM1_REOPEN_REQUEST_2026-04-21.md` |

## 3) Next actions (in order)

1. Team 1 xác nhận verdict `reopen review` cho packet đã nộp.
