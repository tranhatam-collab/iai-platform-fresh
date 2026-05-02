# TEAM1_W1B_D8B_EXECUTION_PACKET_2026-05-02

- Date: `2026-05-02`
- Item: `D8b — reconcile Cloudflare Pages source-of-truth for docs-iai-one`
- Source audit: `docs/reports/team1/AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §B1, §C3
- Drift reference: `docs/reports/team1/AUDIT_RUNTIME_SOURCE_DRIFT_MATRIX_2026-05-02.md`
- Plan reference: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` §7 row D8
- Wave gated: `W1B` preview deploy
- Status: `HELD — DO NOT EXECUTE pending docs deployment-model decision`

Hold reason:

1. Live `docs.iai.one` is currently served by Cloudflare Pages project `docs-iai-one` with production deployment sources like `ea02ab5`, `790025d`, `6f673f6` that do not exist in monorepo `iai-platform-fresh`.
2. Monorepo `apps/docs` is a Node TypeScript server lane (`node:http`, `createServer`, `server.listen`) and has no Pages/Wrangler config in `apps/docs/`.
3. Directly "switching Pages source to `apps/docs`" without choosing a runtime model can break build/deploy truth.

Execution permission:

- This packet is action-held until founder explicitly picks one docs runtime model in §4.
- Until then, treat §3 as evidence and §5 as decision options, not execution steps.

---

## 1. Current truth (verified 2026-05-02)

1. `wrangler pages project list --json` shows `docs-iai-one` is active, `Git Provider: Yes`, domains include `docs.iai.one`.
2. `wrangler pages deployment list --project-name docs-iai-one --json` shows production source chain (`ea02ab5` as latest).
3. `git cat-file -e <source>^{commit}` confirms sampled sources (`ea02ab5`, `790025d`, `6f673f6`, `9ee82d1`) are missing in monorepo.
4. Live body signature for `https://docs.iai.one` is static/docs shell (`/assets/docs.css`), not Next.js chunk runtime.
5. Downloaded Pages config shows `name = "docs-iai-one"` and empty `pages_build_output_dir`.

---

## 2. Why D8b cannot be auto-closed

`D8b` was originally written as source reconciliation, but the live/runtime model and monorepo lane model are not yet aligned. Closing D8b without a model decision would create false "source-of-truth aligned" evidence while deployment behavior remains ambiguous.

---

## 3. Evidence artifacts

- `docs/reports/team1/artifacts/d8b/wrangler-pages-project-list-2026-05-02.json`
- `docs/reports/team1/artifacts/d8b/wrangler-pages-deployments-docs-iai-one-2026-05-02.json`
- `docs/reports/team1/artifacts/d8b/wrangler-docs-iai-one-config-2026-05-02.toml`
- `docs/reports/team1/artifacts/drift-2026-05-02/docs.iai.one.headers.txt`
- `docs/reports/team1/artifacts/drift-2026-05-02/docs.iai.one.body.html`

---

## 4. Founder decision required

Pick exactly one path for docs:

1. `DOCS_PAGES_CANONICAL`
   - Keep Pages/static model as canonical for `docs.iai.one`.
   - Bring canonical source into `iai-platform-fresh` in a Pages-compatible lane.
   - Keep `apps/docs` as separate technical lane unless migrated.
2. `DOCS_NODE_CANONICAL`
   - Move `docs.iai.one` runtime from Pages to Node/Worker deployment sourced from monorepo `apps/docs`.
   - Provide explicit cutover and rollback.
3. `DOCS_MULTI_SOURCE_TEMPORARY`
   - Keep current split temporarily with signed owner contract and hard expiry date.
   - Not considered "D8b closed"; only "D8b deferred with expiry".

Recommended now: `DOCS_PAGES_CANONICAL` for minimum production risk under `PRODUCTION_PUBLICATION_HOLD`.

---

## 5. Closeout criteria after decision

D8b can be marked `closed` only when all are true:

1. Chosen path is recorded in repo as explicit founder decision.
2. `docs.iai.one` deployment source chain is verifiably tied to that chosen path.
3. `docs/release-evidence/docs.iai.one/` packet is updated to §8 file-shape.
4. W1B preview smoke is green and attached in artifact folder.

