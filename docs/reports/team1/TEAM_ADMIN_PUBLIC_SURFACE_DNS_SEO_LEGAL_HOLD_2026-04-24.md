# TEAM_ADMIN_PUBLIC_SURFACE_DNS_SEO_LEGAL_HOLD_2026-04-24

- Date: `2026-04-24`
- Timezone: `Asia/Ho_Chi_Minh`
- Status: `PRODUCTION_PUBLICATION_HOLD`
- Authority: Team 1 Control Tower
- Scope: public `*.iai.one` surfaces, technical `api/pay` surfaces, SEO, language, legal/entity links, and public navigation truth

## 0. Hard rule

No team may claim synchronized live, production complete, SEO complete, or public-release complete while any P0 blocker in this file remains open.

This is not a copy polish issue. This is a public release blocker across DNS, sitemap, metadata, language, technical exposure, and legal consistency.

## 1. Live verification summary

The following checks were run from the repo control thread on `2026-04-24`:

```bash
dig +short <domain>
curl -sS -L --max-time 10 https://<domain>/
curl -sS -L --max-time 20 https://<domain>/sitemap.xml
curl -sS -L --max-time 10 https://<domain>/robots.txt
```

## 2. P0 blockers confirmed

| blocker_id | area | live finding | affected surfaces | owner | required action | release impact |
|---|---|---|---|---|---|---|
| `PUB-001` | DNS / public navigation | No DNS answer from `dig +short`; `curl` cannot resolve host. | `web.iai.one`, `cdn.iai.one`, `flows.iai.one`, `dashboard.iai.one` | Team B Infra + Team 5 + Team 1 | Either configure working DNS/deploy for the domains or remove them from public navigation/docs until ready. | Blocks any public claim that references these domains. |
| `PUB-002` | Sitemap XML | `/sitemap.xml` returns HTML instead of XML. | `flow.iai.one`, `cios.iai.one`, `dash.iai.one`, `developer.iai.one` | Team C SEO + surface owners | Serve valid XML sitemap with `application/xml`, or mark the surface as private/noindex and document why no sitemap is intended. Repo-side patch has been added for `flow`, `developer`, and internal `dash`; production still requires deploy proof. | Blocks SEO/live readiness. |
| `PUB-003` | Mail sitemap policy | `/sitemap.xml` returns `404` and root is public HTML. | `mail.iai.one` | Team Email SMTP | Decide public vs private. If public, add sitemap/canonical/meta/OG. If private/internal, keep robots disallow and add explicit noindex/internal policy. | Blocks mail public surface completion. |
| `PUB-004` | Metadata / share image | Missing or incomplete social share metadata on important surfaces. | `iai.one`, `cios.iai.one`, `dash.iai.one`, `mail.iai.one` | Team C SEO + Team 1 | Add canonical, description, OG title, OG description, OG image, Twitter image, and root language policy where appropriate. | Blocks public SEO/share quality. |
| `PUB-005` | Dash indexability decision | `dash.iai.one` root has `noindex,nofollow`. | `dash.iai.one` | Team B Dash + Team 1 | Current repo-side decision is `internal noindex control surface`: keep noindex, serve robots disallow, return non-HTML sitemap disabled response, and remove public-live claims unless Team 1 explicitly flips the policy. | Blocks public claim for Dash until decided and deployed. |
| `PUB-006` | Bilingual language compliance | Live titles/meta/UI still mix Vietnamese and English in the same public route or metadata layer. | `flow.iai.one`, `nft.iai.one`, `noos.iai.one`, `cios.iai.one`, `developer.iai.one` | Team C Language | Split VI/EN routes or render logic correctly, source all public copy from content registry, and rerun universal bilingual audit. | Blocks language release compliance. |
| `PUB-007` | Broken public link risk | `home.iai.one` references `cdn.iai.one`, which is unresolved. | `home.iai.one`, `cdn.iai.one` | Team 5 + Team B Infra | Remove or hide the `cdn.iai.one` public link until DNS/deploy is live, or make `cdn.iai.one` resolve and return intended policy. | Blocks clean public navigation. |
| `PUB-008` | Technical data exposure | Technical roots return JSON publicly; `api.iai.one` exposes route inventory behavior and API roots have sitemap `404`. | `pay.iai.one`, `api.iai.one`, `api.flow.iai.one` | Team 2 Runtime + Team B Pay/API | Confirm intent. If internal/private, add `noindex`, reduce root data exposure, document security boundary, and keep public docs separate. | Blocks technical-surface security acceptance. |
| `PUB-009` | Legal/entity consistency | Public roots checked do not consistently expose the canonical legal URL or entity. | `pay.iai.one`, `api.iai.one`, `mail.iai.one`, `dash.iai.one`, `cios.iai.one`, `developer.iai.one` | Team Legal/Docs + each surface owner | Standardize link to `https://docs.iai.one/legal/iai-flow/` and entity `Angel Edu Tam Foundation Inc` on every public surface where legal/footer content exists. | Blocks legal/public readiness. |
| `PUB-010` | Production claim discipline | Internal state still has deployment ownership/backend/canonical handoff blockers. | Team 2, Team 4, Team 5, pay gate, public surfaces | Team 1 | Keep `PRODUCTION_PUBLICATION_HOLD` until all blockers have evidence and Team 1 flips the gate. | Blocks synchronized live claim. |

## 3. Current observed evidence

| surface | root status | DNS | sitemap status | sitemap result | notes |
|---|---:|---|---:|---|---|
| `iai.one` | `200` | resolves | `200` | XML | Root meta lacks visible OG image/Twitter image in quick meta scan. |
| `home.iai.one` | `200` | resolves | `200` | XML | Must remove or fix link to unresolved `cdn.iai.one`. |
| `app.iai.one` | `200` | resolves | `200` | XML | No P0 blocker observed in this pass. |
| `docs.iai.one` | `200` | resolves | `200` | XML | Legal canonical target lives here and must be linked consistently. |
| `flow.iai.one` | `200` | resolves | `200` | HTML | Sitemap invalid on production; repo-side XML sitemap patch added and must be deployed. Title/description are VI while OG is EN on root. |
| `nft.iai.one` | `200` | resolves | `200` | XML | Bilingual metadata mix remains and must be split/normalized. |
| `noos.iai.one` | `200` | resolves | `200` | XML | Bilingual copy still needs final language compliance closure. |
| `cios.iai.one` | `200` | resolves | `200` | HTML | Sitemap invalid; quick root meta scan only found title. |
| `dash.iai.one` | `200` | resolves | `200` | HTML | Production sitemap invalid; repo-side policy now treats Dash as internal noindex and disables sitemap as text/plain 404. Deploy proof required. |
| `developer.iai.one` | `200` | resolves | `200` | HTML | Sitemap invalid on production; repo-side XML sitemap patch added and must be deployed. Metadata mixes Developer Portal with IAI Flow labels. |
| `mail.iai.one` | `200` | resolves | `404` | Missing | Robots disallows all; must be documented as internal or completed as public. |
| `life.iai.one` | `200` | resolves | `200` | XML | No P0 blocker observed in this pass; handled by separate life teams. |
| `pay.iai.one` | `200` | resolves | `404` | JSON | Technical surface; must lock noindex/security/public root policy. |
| `api.iai.one` | `200` | resolves | `404` | JSON | Technical surface; route/data exposure policy required. |
| `api.flow.iai.one` | `200` | resolves | `404` | JSON | Technical surface; root exposure/noindex policy required. |
| `web.iai.one` | `000` | unresolved | `000` | unresolved | Public docs/nav must not treat as live until DNS is real. |
| `cdn.iai.one` | `000` | unresolved | `000` | unresolved | Public link from home must be removed/hidden or DNS fixed. |
| `flows.iai.one` | `000` | unresolved | `000` | unresolved | Cannot be claimed production/live while unresolved. |
| `dashboard.iai.one` | `000` | unresolved | `000` | unresolved | Must decide identity relative to `dash.iai.one`. |

## 4. Team assignments now

### Team 1 Control Tower

- Keep global state at `PRODUCTION_PUBLICATION_HOLD`.
- Reject any report that says `production complete`, `synchronized live`, or `public SEO complete` while `PUB-001` through `PUB-010` remain open.
- Update canonical ledger only after live evidence is rerun on the exact domain.
- Require every owner to attach evidence, not narrative.

### Team B Infra / CDN / Flows

- Fix or intentionally remove public exposure for `cdn.iai.one` and `flows.iai.one`.
- If keeping them public, provide:
  - DNS proof
  - deploy/vhost proof
  - route proof
  - cache/header proof for CDN
  - production runtime proof for Flows
  - rollback note
- If not public yet, mark them `NOT_PUBLIC_READY` and remove public navigation references.

### Team 5 Web / Home

- Stop treating `web.iai.one` as public-ready while DNS is unresolved.
- Fix the `home.iai.one` link to `cdn.iai.one` by either hiding it or pointing it to a currently working public surface.
- Resolve `dash.iai.one` versus `dashboard.iai.one` naming so docs and links do not split identity.

### Team C SEO / Language

- Fix XML sitemap behavior for `flow`, `cios`, `dash`, `developer`.
- For `flow` and `developer`, deploy the repo-side XML sitemap patch and attach live `content-type: application/xml` proof.
- For `dash`, deploy the repo-side internal/noindex policy patch and attach proof that `/robots.txt` disallows all and `/sitemap.xml` no longer returns HTML.
- Add a policy outcome for `mail`:
  - public surface with sitemap and metadata, or
  - private surface with explicit noindex/internal documentation.
- Close missing canonical/description/OG/Twitter metadata for `iai`, `cios`, `dash`, `mail`.
- Rerun the Universal Bilingual Language Rebuild audit after fixing route/meta language separation.

### Team 2 Runtime / API

- Confirm whether `pay.iai.one`, `api.iai.one`, and `api.flow.iai.one` are public API surfaces or internal technical endpoints.
- If internal/private:
  - return `X-Robots-Tag: noindex, nofollow`
  - avoid exposing route inventory on `/`
  - move public docs to `docs.iai.one`
  - attach security boundary note
- If public:
  - add public API landing pages, canonical metadata, legal link, and docs link.

### Team Email SMTP

- Do not claim `mail.iai.one` public completion from health/DNS alone.
- Choose and document one policy:
  - `mail.iai.one` public support/mail landing with sitemap + metadata + legal link, or
  - `mail.iai.one` internal/ops-only with robots/noindex and no public SEO claim.
- Keep `/v1/send` boundary separate from public hostname health proof.

### Legal / Docs owners

- Standardize every public surface footer/legal reference to:
  - `https://docs.iai.one/legal/iai-flow/`
  - `Angel Edu Tam Foundation Inc`
- Surfaces with no legal/footer block must either add one or be explicitly classified as internal/noindex.

## 5. Acceptance criteria before release hold can be removed

The hold may be removed only when all of these are true:

1. `web.iai.one`, `cdn.iai.one`, `flows.iai.one`, and `dashboard.iai.one` are either live/resolving or removed from public navigation/docs.
2. `flow`, `cios`, `dash`, and `developer` return valid XML at `/sitemap.xml` or have explicit noindex/internal policy.
3. `mail.iai.one` has either a public sitemap/meta/legal package or explicit internal/noindex policy.
4. `iai`, `cios`, `dash`, and `mail` have complete canonical/description/OG/Twitter metadata if public.
5. `dash.iai.one` has an explicit public/internal indexability decision.
6. `flow`, `nft`, `noos`, `cios`, and `developer` pass the bilingual language audit with no mixed-language public metadata/UI.
7. Technical JSON surfaces have a written security/indexing policy and evidence.
8. Legal entity and legal URL are consistent across public surfaces.
9. Team 1 reruns live checks and publishes a new verdict.

## 6. Reminder lock

This blocker set is now included in the `2026-04-24` 15-minute reminder schedule.

Use:

```bash
node scripts/team-channel-reminder-check.mjs --date=2026-04-24 --emit
```

Do not disable a team row until the owner has submitted evidence and Team 1 has accepted it.

## 7. Repo-side patch verification

Repo-side patches were added for the blockers that can be safely handled inside this workspace without changing DNS or external deployment state:

| patch | files | verification |
|---|---|---|
| `flow.iai.one` XML sitemap route | `apps/flow/src/server.ts`, `tests/integration/flow-surface.test.mjs` | `pnpm test:flow-surface` -> PASS `5/5` |
| `developer.iai.one` XML sitemap route | `apps/developer/src/server.ts`, `tests/integration/developer-surface.test.mjs` | `pnpm test:developer` -> PASS `6/6` |
| `dash.iai.one` internal/noindex sitemap policy | `apps/dash/src/server.ts`, `tests/integration/dash-app-phase0.test.mjs` | `pnpm test:dash` -> PASS `12/12` |
| 15-minute blocker reminder schedule | `docs/reports/team1/TEAM_CHANNEL_REMINDER_SCHEDULE_2026-04-24.json` | `node scripts/team-channel-reminder-check.mjs --date=2026-04-24 --write` -> PASS |

Production is still blocked until these repo-side changes are deployed and live `curl` evidence replaces the current failing live observations.
