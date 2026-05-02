# apps/docs — STATUS

- Lane: `experimental, not_live`
- Reason: Founder picked `DOCS_PAGES_CANONICAL` (D-003 = `PAGES`) on 2026-05-02. Live `docs.iai.one` is served from Cloudflare Pages project `docs-iai-one` with a separate canonical source repo (binding to be captured under `docs/reports/team1/artifacts/d8b/`). This Node TS server is **not** the live source.
- Authority: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md`
- Source-of-truth map: `docs/SURFACE_SOURCE_OF_TRUTH.md`

## Implications

- Do NOT deploy this lane to production.
- Do NOT switch Cloudflare Pages source to this lane.
- Future migration (sub-path P2) requires a new founder decision.

## Last decision date

`2026-05-02`
