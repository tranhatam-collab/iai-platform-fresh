# FOUNDER_REPLY_BATCH_2026-05-02

- Date: `2026-05-02`
- Author: Founder Trần Hà Tâm (recorded by Codex on his behalf)
- Status: `OFFICIAL_FOUNDER_REPLY`
- Source dashboard: `docs/reports/team1/TEAM1_BLOCKER_DASHBOARD_2026-05-02.md`
- Global state: `PRODUCTION_PUBLICATION_HOLD` (unchanged)

This file is the canonical record of founder's reply for the 9 decisions raised in the blocker dashboard. Each row links to the routing artifact (closeout / follow-up packet) that team owners must use for execution.

---

## 1. Reply table

| ID | Decision | Founder reply | Routing artifact |
|---|---|---|---|
| `D-001` | payOS business verification push | `yes` (founder will send push email) | `docs/reports/team2/TEAM2_PAYOS_BUSINESS_VERIFICATION_PUSH_2026-05-02.md` (Team 2 standby; founder action) |
| `D-002` | Architecture for `home.iai.one` + `iai.one` | `B` — Next.js canonical | `docs/reports/team1/TEAM1_W1A_D8A_EXECUTION_PACKET_v2_PATH_B_2026-05-02.md` |
| `D-003` | `docs.iai.one` runtime model | `PAGES` — `DOCS_PAGES_CANONICAL` | `docs/reports/team1/TEAM1_W1B_D8B_EXECUTION_PACKET_v2_PATH_PAGES_2026-05-02.md` |
| `D-004` | Agent identification for Team A / B-CDN / B-Flows / C | `PENDING` — founder will fill names later | (held; 4 teams remain READ-ONLY until names filed) |
| `D-005` | `invoice.iai.one` build vs drop | `DROP` | `docs/reports/pay-email-agent/INVOICE_IAI_ONE_DROP_RESOLUTION_2026-05-02.md` |
| `D-006` | `life.iai.one` ownership | `T4` — Team 4 | `docs/reports/team4/LIFE_IAI_ONE_OWNER_LOCK_T4_2026-05-02.md` |
| `D-007` | Launch wave authority | `Codex` (Team 1 control tower) | recorded in `LIFE_IAI_ONE_OWNER_LOCK_T4_2026-05-02.md` §3 + plan v2 §6 |
| `D-008` | `tramsaigon.com` receivers | `wait` — keep `FORM_IN_PROGRESS` | (no routing; status unchanged; default deadline `2026-05-15` still valid) |
| `D-009` | Slack/Notion/GitHub connector | `defer` | (no routing; broadcast continues to use repo-side packets) |

8/9 decisions are now actionable; D-004 remains the only outstanding founder fill.

---

## 2. Immediate consequences

1. `D-002 = B`: `D8a` is unfrozen. Execution path is "bring Next.js canonical source into monorepo" (or codify the legacy Next.js repo as the canonical source). Founder review still required before W1A preview deploy.
2. `D-003 = PAGES`: `D8b` is unfrozen. Execution path is "keep Pages/static model canonical for `docs.iai.one`". Bringing canonical source into monorepo lane is a follow-up.
3. `D-004 = PENDING`: Team A, Team B-CDN, Team B-Flows, Team C remain in `READ-ONLY` mode. No deploy, no code edit on `developer.iai.one`, `cdn.iai.one`, `flows.iai.one`, `cios.iai.one` until names are filed.
4. `D-005 = DROP`: `invoice.iai.one` is officially dropped from declared canonical inventory. Trust-state already does not list it; only 4 cross-team reports need patching.
5. `D-006 = T4` and `D-007 = Codex`: Team 4 takes ownership of `life.iai.one` (68 file editing unblocked); Codex retains launch wave authority.
6. `D-008 = wait`: `tramsaigon.com` stays paused until founder lock, no impact on critical path.
7. `D-009 = defer`: external broadcast remains repo-side only; no extra credentials needed today.

---

## 3. What still blocks synchronized live

- `D-001 = yes` is a founder action, not a code action; pay gate stays `LOCK_RETAINED_WITH_REASON` until payOS verifies and Team 2 reruns probe.
- `D-004 = PENDING` blocks domain reopen review closure for CDN, Flows, CIOS, developer.

Synchronized live therefore still depends on (a) founder push payOS, (b) founder name 4 team agents.

---

## 4. Authority

This reply was confirmed by founder in chat session 2026-05-02 and recorded by Codex as canonical. Until founder edits this file, all team execution packets must respect the routing in §1.