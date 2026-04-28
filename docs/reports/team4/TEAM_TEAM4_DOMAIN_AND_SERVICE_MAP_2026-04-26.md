# TEAM_TEAM4_DOMAIN_AND_SERVICE_MAP_2026-04-26

- Team: Team 4 Growth Revenue Operations
- Date: 2026-04-26

## Domain bảng

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|
| (none — Team 4 không own public domain riêng) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| noos.iai.one (Team 4 sub-stream — ops/copy/launch portion only) | TBD (Codex own commerce surface; Team 4 chỉ ops governance) | pay.iai.one (Q5 SIGNED 2026-04-26) | shared-iai-auth | NOOS schema pack | `@iai/noos-web` (Codex own) | NO (Team 4 chỉ edit copy + launch wave + support playbook + KPI dashboard ops) | NO — Team 4 governance content đã PASS bilingual review | NO |
| life.iai.one (extended scope per founder 2026-04-26 expansion — TBD per Plan §1) | TBD (chưa khóa legal lane riêng cho life) | TBD (Lớp 4 private core invest access có thể link pay.iai.one — chưa audit) | TBD (life có member/private routes — chưa rõ shared-iai-auth) | static site (separate stack, không dùng `@iai/*`) | NONE (independent stack) | YES — life.iai.one có sub-3-team nội bộ + role upgrade engine + assessment scoring | TBD — cần audit `npm run validate` + `npm run audit:live` (chưa chạy theo Rule 1 chờ DEC) | YES — site có thể đã live (Cloudflare Pages project `life-iai-one`) nhưng T4+5 chưa verify domain/deploy proof |

## Notes

- Team 4 **không own public domain** riêng. Surface 1 (Growth/Launch Ops governance) và Surface 4 (Reminder cadence) là internal governance — không có FQDN. Surface 2 (NOOS Team 4 sub-stream) consume `noos.iai.one` từ Codex (Plan §1 Agent 3). Surface 3 (life.iai.one) là extended scope per founder expansion 2026-04-26, ownership **chưa lock** per Plan §1 Agent 4 ("life.iai.one TBD").
- Cross-domain dependency:
  - Team 4 governance feed copy/wording vào shared content package (`content/iai-language-codex.md` — cross-team) và NOOS commerce surface (`apps/noos-web/` — Codex own).
  - Team 4 reminder cadence consume schedule JSON do Codex (Team 1) phát hành.
  - Team 4 launch wave kick-off chờ pay flip do Pay+Email phát.
- Cảnh báo chồng vai:
  - life.iai.one **chưa lock owner** — nếu T4+5 self-claim sẽ vi phạm Rule 1 file-ownership exclusivity. T4+5 hiện giữ life.iai.one ở chế độ READ-ONLY chờ DEC-TEAM4-001.
  - NOOS commerce surface: Codex own `apps/noos-web/` + `docs/noos/` (commerce schema/openapi/fixtures). Team 4 sub-stream chỉ own `33/37/38/40/42` ops portion. Audit/edit ngoài 5 file đó = vi phạm boundary.
  - Reminder schedule JSON: Codex (Team 1) own. T4+5 KHÔNG được tự generate `TEAM_CHANNEL_REMINDER_SCHEDULE_2026-04-26.json` (vi phạm Rule 4 cross-team coord doc). Chỉ consume + escalate khi thiếu.
- Team 4 verification scope (per Rule 6): `pnpm review:team4-checkpoint -- --date=...`, `pnpm proof:team4-checkpoint -- --date=...`. Không chạy `pnpm test:noos-*` hay `pnpm test:dash` (Codex scope).
