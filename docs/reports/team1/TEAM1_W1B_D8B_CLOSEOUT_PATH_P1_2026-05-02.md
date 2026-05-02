# TEAM1_W1B_D8B_CLOSEOUT_PATH_P1_2026-05-02

- Date: `2026-05-02`
- Item: D8b — Cloudflare Pages source-of-truth for `docs-iai-one`
- Path: `P1` (declare legacy Pages binding as canonical, mark monorepo `apps/docs` as experimental)
- Source decision: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md` D-003 = `PAGES`
- Execution packet: `docs/reports/team1/TEAM1_W1B_D8B_EXECUTION_PACKET_v2_PATH_PAGES_2026-05-02.md`
- Status: `CLOSED` (with binding capture deferred to founder dashboard read)

---

## 1. What changed

| Action | File | Verified |
|---|---|---|
| Marked monorepo `apps/docs` as experimental | `apps/docs/STATUS.md` | yes |
| Recorded source-of-truth row for `docs.iai.one` | `docs/SURFACE_SOURCE_OF_TRUTH.md` §1 | yes |
| Captured CLI limit for binding read | `docs/reports/team1/artifacts/d8b/DOCS_IAI_ONE_BINDING_CAPTURE_NOTE_2026-05-02.md` | yes |
| Plan v2 §7 row D8b flipped to `CLOSED` via P1 | `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` | (this batch) |
| W1B packet status string update | `docs/release-evidence/docs.iai.one/` | (this batch) |

---

## 2. Canonical truth recorded

- `docs.iai.one` → Cloudflare Pages project `docs-iai-one`. Live source commit chain on `main` (e.g. `ea02ab5`, `790025d`, `6f673f6`, `9ee82d1`) is NOT present in `iai-platform-fresh` monorepo, so a separate canonical repo exists.
- `apps/docs` in this monorepo is explicitly NOT the live source.

---

## 3. Known gap (does NOT block W1B preview deploy)

The exact GitHub repo bound to `docs-iai-one` cannot be read via wrangler CLI today. The capture note logs the procedure for founder to read it from Cloudflare dashboard (Workers & Pages → docs-iai-one → Settings → Builds & deployments → Source). When pasted, `SURFACE_SOURCE_OF_TRUTH.md` §1 row `docs.iai.one` updates from `TBD` to the real URL.

This gap does NOT block W1B preview deploy because:
- W1B preview deploy means triggering a preview build on the canonical Pages project via dashboard.
- Whoever has access to dashboard already has the binding visible there.
- Repo-side closure (this packet) just confirms the monorepo lane is NOT live.

---

## 4. What W1B preview deploy now means

Same as W1A under path B: trigger a preview build on the legacy Pages project via Cloudflare dashboard. Founder runs that action; not part of this closeout.

---

## 5. Items NOT changed by this closeout

- Pay gate unchanged (`LOCK_RETAINED_WITH_REASON`).
- D8a (home/iai) closure is filed separately as path B1.
- D8c (flow/dash), D8d (app), D9, D10, D11 unchanged.

---

## 6. Authority

This closeout records founder decision D-003 = `PAGES` and its sub-path P1 as executed. Reverting requires a new founder decision.