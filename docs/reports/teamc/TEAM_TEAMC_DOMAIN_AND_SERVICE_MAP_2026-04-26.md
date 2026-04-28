# TEAM_TEAMC_DOMAIN_AND_SERVICE_MAP_2026-04-26

> **⚠️ INFERRED BY ADMIN, AWAITING TEAM CONFIRM** (per Q4)

- Team: Team C
- Date: 2026-04-26

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| cios.iai.one | TBD (likely "internal operations system") | TBD (likely none) | workers JWT (placeholder — cần rotate) | cios-workers-api.tranhatam66.workers.dev | TBD | TBD | TBD | NO (closure 8/8 PASS) |

## Notes
- Closure attachment 04-23 đã accepted vào release-evidence chain (commit `f6fd622` Codex).
- 5 screenshot pack PASS: root, hub, app, pricing, demo.
- JWT secret production cần rotate trước flip live-claim.
