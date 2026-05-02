# apps/root — STATUS

- Lane: `experimental, not_live`
- Reason: Founder picked Next.js canonical (D-002 = `B`) on 2026-05-02. Live `iai.one` is served from legacy Next.js repo `tranhatam-collab/Home.iai.one` via Cloudflare Pages project `home-iai-one` (same project also serves `home.iai.one`). This Node TS server is **not** the live source.
- Authority: `docs/reports/FOUNDER_REPLY_BATCH_2026-05-02.md`
- Source-of-truth map: `docs/SURFACE_SOURCE_OF_TRUTH.md`

## Implications

- Do NOT deploy this lane to production.
- Do NOT switch Cloudflare Pages source to this lane.
- Future migration (sub-path B2) requires a new founder decision.

## Last decision date

`2026-05-02`
