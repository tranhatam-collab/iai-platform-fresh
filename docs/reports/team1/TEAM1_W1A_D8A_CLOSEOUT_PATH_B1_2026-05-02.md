# TEAM1_W1A_D8A_CLOSEOUT_PATH_B1_2026-05-02

- Date: `2026-05-02`
- Item: D8a — Cloudflare Pages source-of-truth for `home-iai-one`
- Path: `B1` (declare legacy Next.js repo as canonical, mark monorepo lanes as experimental)
- Source decision: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md` D-002 = `B`
- Execution packet: `docs/reports/team1/TEAM1_W1A_D8A_EXECUTION_PACKET_v2_PATH_B_2026-05-02.md`
- Status: `CLOSED`

---

## 1. What changed

| Action | File | Verified |
|---|---|---|
| Marked monorepo `apps/home` as experimental | `apps/home/STATUS.md` | yes |
| Marked monorepo `apps/root` as experimental | `apps/root/STATUS.md` | yes |
| Created canonical source-of-truth map | `docs/SURFACE_SOURCE_OF_TRUTH.md` | yes |
| Plan v2 §6 next-actions rewritten | `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` | yes (prior commit `a577593`) |
| W1A packet status string update | (next commit) | (in this batch) |

---

## 2. Canonical truth recorded

- `home.iai.one` → `tranhatam-collab/Home.iai.one` (Next.js) via Cloudflare Pages project `home-iai-one`.
- `iai.one` → same repo, same Pages project.
- `apps/home` and `apps/root` in this monorepo are explicitly NOT the live source.

This information is the canonical mapping until founder issues a new decision. See `docs/SURFACE_SOURCE_OF_TRUTH.md` §1.

---

## 3. What W1A preview deploy now means

W1A preview deploy is no longer "deploy monorepo `apps/home` to a preview URL". With path B1 in effect, W1A preview deploy means "trigger a preview build on the legacy `tranhatam-collab/Home.iai.one` repo via Cloudflare Pages dashboard". Founder must run that action; it is not part of this closeout.

---

## 4. Items NOT changed by this closeout

- W1A repo-side review packet contents are unchanged.
- Pay gate is unchanged (`LOCK_RETAINED_WITH_REASON`).
- D8b (docs.iai.one) closure is filed separately.
- D8c, D8d, D9, D10, D11 are unchanged.

---

## 5. Authority

This closeout records founder decision D-002 = `B` and its sub-path B1 as executed. Reverting requires a new founder decision.