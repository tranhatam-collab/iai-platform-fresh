# TEAM1_W1B_D8B_EXECUTION_PACKET_v2_PATH_PAGES_2026-05-02

- Date: `2026-05-02`
- Item: `D8b — reconcile Cloudflare Pages source-of-truth for docs-iai-one`
- Wave gated: `W1B` preview deploy
- Source decision: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md` D-003 = `PAGES` (`DOCS_PAGES_CANONICAL`)
- Drift report: `docs/reports/team1/AUDIT_RUNTIME_SOURCE_DRIFT_MATRIX_2026-05-02.md`
- Supersedes: `TEAM1_W1B_D8B_EXECUTION_PACKET_2026-05-02.md` (held; previous packet listed 3 options without choosing)
- Status: `READY_FOR_FOUNDER_REVIEW_THEN_EXECUTION`

---

## 0. Context recap

- Live `docs.iai.one` is served by Cloudflare Pages project `docs-iai-one` with static docs HTML (`/assets/docs.css`), latest production source `ea02ab5` not in monorepo.
- Monorepo `apps/docs` is a Node TS server lane (`node:http`, `createServer`), no Pages config.
- Founder picked `PAGES` = keep Pages/static model canonical.

---

## 1. Founder decision (recorded)

- D-003 = `PAGES` (`DOCS_PAGES_CANONICAL`).
- Implication: keep current Pages deployment as the live source. Do NOT cutover to Node lane. `apps/docs` Node TS lane is reclassified as `EXPERIMENTAL_LANE_NOT_LIVE`.

---

## 2. Two execution sub-paths inside PAGES

### Sub-path P1 — declare legacy as canonical (lowest risk)

- Find or identify the canonical GitHub repo currently powering `docs-iai-one` Pages project (likely `tranhatam-collab/Docs.iai.one` or similar — verify via Pages dashboard).
- Document it as the official source for `docs.iai.one` in `docs/SURFACE_SOURCE_OF_TRUTH.md`.
- Mark `apps/docs/STATUS.md` as `experimental, not_live`.
- Effort: ~30 minutes (doc-only).

### Sub-path P2 — bring Pages-compatible source into monorepo

- Add a `apps/docs-pages/` (or rebuild `apps/docs/`) as a static-build lane compatible with Pages.
- Configure Pages project to point at `iai-platform-fresh` for `docs-iai-one`.
- Effort: 6–10 hours (build pipeline + content migration + Pages dashboard reconfig).

Recommendation: **Sub-path P1 first** (closes D8b in 30 minutes, restores W1B deploy gate). P2 can be a separate wave.

---

## 3. Sub-path P1 execution steps

1. Run `wrangler pages project list` and identify the GitHub repo binding for `docs-iai-one`. Capture in `docs/reports/team1/artifacts/d8b/wrangler-docs-iai-one-binding-2026-05-02.txt`.
2. Create `apps/docs/STATUS.md`:
   ```
   Lane: experimental, not_live
   Reason: Founder picked DOCS_PAGES_CANONICAL (D-003 = PAGES) on 2026-05-02. Live docs.iai.one is served by Cloudflare Pages project docs-iai-one from a separate canonical source. This Node TS server is not the live source.
   See: docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md
   ```
3. Update or create `docs/SURFACE_SOURCE_OF_TRUTH.md` adding `docs.iai.one` row.
4. Update plan v2 §7 row D8b status from `held` to `closed via path P1`.
5. Update `docs/release-evidence/docs.iai.one/` README + deferred.md status string to `READY_FOR_W1B_PREVIEW_DEPLOY`.

---

## 4. Closeout criteria

D8b can be marked `closed (path P1)` when all are true:

1. Pages binding evidence captured.
2. `apps/docs/STATUS.md` exists.
3. Source-of-truth doc updated.
4. Plan v2 §7 row D8b updated.
5. `docs/release-evidence/docs.iai.one/` packet updated to `READY_FOR_W1B_PREVIEW_DEPLOY`.
6. Closeout report `TEAM1_W1B_D8B_CLOSEOUT_PATH_P1_2026-05-02.md` written.

---

## 5. Wave gate note

- W1A still goes first (D8a path B1).
- W1B preview deploy is gated only on D8b closure once W1A is live and verified.