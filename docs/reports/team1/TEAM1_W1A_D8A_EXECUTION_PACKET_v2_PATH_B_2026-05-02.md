# TEAM1_W1A_D8A_EXECUTION_PACKET_v2_PATH_B_2026-05-02

- Date: `2026-05-02`
- Item: `D8a — reconcile Cloudflare Pages source-of-truth for home-iai-one`
- Wave gated: `W1A` preview deploy
- Source decision: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md` D-002 = `B` (Next.js canonical)
- Drift report: `docs/reports/team1/NEXT_VS_NODE_DRIFT_2026-05-02.md`
- Supersedes: `TEAM1_W1A_D8A_EXECUTION_PACKET_2026-05-02.md` (held; previous packet assumed Pages-source switch and is no longer applicable)
- Status: `READY_FOR_FOUNDER_REVIEW_THEN_EXECUTION`
- Global state: `PRODUCTION_PUBLICATION_HOLD`

---

## 0. Context recap

- Live `home.iai.one` and `iai.one` are served by Cloudflare Pages project `home-iai-one`, sourced from legacy GitHub repo `tranhatam-collab/Home.iai.one`, latest production deployment commit `f1da67b` (Next.js).
- Monorepo `iai-platform-fresh/apps/home` and `apps/root` are Node TypeScript servers (`node:http`, `createServer`) — different runtime, different repo.
- Founder picked path `B` = Next.js canonical. The Next.js codebase becomes the source of truth for these two surfaces; the Node TS apps in monorepo are reclassified as a separate experimental lane (or retired).

---

## 1. Founder decision (recorded)

- D-002 = `B` (Next.js canonical).
- Implication: do NOT switch Pages source to `apps/home`/`apps/root`. Do NOT delete legacy Next.js repo.
- The Node TS lanes `apps/home` + `apps/root` are now `EXPERIMENTAL_LANE_NOT_LIVE` until a future migration plan is approved.

---

## 2. Two execution sub-paths inside path B

The founder reply picks the architecture, not the integration shape. Sub-path must be confirmed before any deploy.

### Sub-path B1 — keep legacy repo as canonical (lowest risk)

- Treat `tranhatam-collab/Home.iai.one` as the official source-of-truth for `home.iai.one` + `iai.one`.
- Update README in `iai-platform-fresh` to point at the legacy repo for these two surfaces.
- Mark `apps/home` and `apps/root` in monorepo as `lane: experimental, not_live` in their `package.json` description and a `STATUS.md` file.
- W1A repo-side review packet stays valid; W1A preview deploy now means "deploy the legacy Next.js repo to a preview URL", not "deploy monorepo `apps/home`".
- Effort: ~1 hour (doc-only, no code change).

### Sub-path B2 — bring Next.js canonical source into monorepo

- Move legacy Next.js source into `apps/home` and `apps/root` as Next.js (replacing the Node TS server code) or into new lanes `apps/home-next` / `apps/root-next`.
- Add `wrangler.toml` / Pages config under those lanes.
- Switch Pages project `home-iai-one` "Production branch" + repo binding to `tranhatam-collab/iai-platform-fresh` once monorepo lane is build-clean.
- Effort: 4–8 hours (code merge + build verification + Pages dashboard reconfig).

Recommendation: **Sub-path B1 first** (closes D8a in 1 hour, restores W1A deploy gate). B2 can be a follow-up wave, separately gated.

---

## 3. Sub-path B1 execution steps

1. Create `apps/home/STATUS.md` and `apps/root/STATUS.md` with content:
   ```
   Lane: experimental, not_live
   Reason: Founder picked Next.js canonical (D-002 = B) on 2026-05-02. Live home.iai.one and iai.one are served from legacy Next.js repo tranhatam-collab/Home.iai.one. This Node TS server is not the live source.
   See: docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md
   ```
2. Add a top-level note in repo `README.md` (or create `docs/SURFACE_SOURCE_OF_TRUTH.md`) listing canonical source per surface:
   - `home.iai.one` → `tranhatam-collab/Home.iai.one` (Next.js, Pages project `home-iai-one`)
   - `iai.one` → `tranhatam-collab/Home.iai.one` (same Pages project)
   - All other surfaces → `iai-platform-fresh` (this repo)
3. Update plan v2 §7 row D8a status from `paused` to `closed via path B1` once §1 + §2 commit lands.
4. Update `docs/release-evidence/iai.one/` and `docs/release-evidence/home.iai.one/` README + deferred.md status string from `_PAUSED_PENDING_DRIFT_DECISION` back to `READY_FOR_W1A_PREVIEW_DEPLOY` since the architecture is now locked.

---

## 4. Closeout criteria

D8a can be marked `closed (path B1)` only when all are true:

1. `STATUS.md` exists in both `apps/home/` and `apps/root/`.
2. Source-of-truth doc is committed (top-level README note OR `docs/SURFACE_SOURCE_OF_TRUTH.md`).
3. Plan v2 §7 row D8a updated.
4. `docs/release-evidence/iai.one/` and `home.iai.one/` packets updated to `READY_FOR_W1A_PREVIEW_DEPLOY`.
5. Closeout report `TEAM1_W1A_D8A_CLOSEOUT_PATH_B1_2026-05-02.md` written.

W1A preview deploy itself is then a separate founder action: trigger preview build of legacy `tranhatam-collab/Home.iai.one` repo via Cloudflare Pages dashboard.

---

## 5. Risks if execution skipped

- D8a stays open → W1A preview deploy never happens → Team 5 readiness loop never gets fresh truth → synchronized live remains blocked alongside pay gate.
- Monorepo `apps/home`/`apps/root` keep accruing drift; future merge cost grows.

---

## 6. Authority

This packet replaces the held `TEAM1_W1A_D8A_EXECUTION_PACKET_2026-05-02.md` for path B. Anyone executing must read both files and confirm path B is selected before any commit.