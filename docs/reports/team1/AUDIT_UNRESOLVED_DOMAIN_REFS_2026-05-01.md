# AUDIT — Unresolved Domain References (2026-05-01)

**Audit Directive**: TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01  
**Global State**: `PRODUCTION_PUBLICATION_HOLD`  
**Audit Scope**: Cross-repo references to hold/internal domains  
**Audited Domains**: `web.iai.one`, `cdn.iai.one`, `flows.iai.one`

---

## CRITICAL (1 ref)

**Hard rule violation**: Public navigation must not advertise unresolved or not-public-ready domains as if they are live.

- **apps/home/src/server.ts:36** — `webUrl` default config parameter — `webUrl: options.webUrl ?? process.env.HOME_WEB_URL ?? "https://web.iai.one"` — **Fix**: Verify `HOME_WEB_SURFACE_ENABLED` flag is checked in render path before exposing web.iai.one link to portal navigation. Render must not advertise web.iai.one in portal UI unless flag is explicitly true.

---

## MEDIUM (8 refs)

Docs/internal references that describe domains correctly but lack feature-flag guards in code paths, or reference internal surfaces without explicit hold context.

- **apps/root/src/server.ts:36** — `webUrl` default config — Same pattern as home.ts: must verify flag before public exposure in health/og routes. **Fix**: Render layer should not expose web.iai.one in OG metadata or health output when `ROOT_WEB_SURFACE_ENABLED=false`.

- **apps/web/src/i18n.ts:28** — `loadSeoEntry("web.iai.one")` and line 149 `surface: "web.iai.one"` — Internal SEO metadata. **Fix**: Ensure these SEO entries are conditional; do not ship canonicals/hreflangs for web.iai.one in public sitemap.xml output until flag=true.

- **apps/pay/src/payment-surface-registry.ts:410,659,686** — Payment surface registry entries for `web.iai.one`, `cdn.iai.one`, `flows.iai.one` — Config-only, not public UI. **Fix**: Add comment noting these are internal config; cdn.iai.one and flows.iai.one must remain marked `NOT_ALLOWED` status until owner evidence packets delivered.

- **apps/pay/src/server.ts:261** — `webUrl` default config — `webUrl: options.webUrl ?? process.env.PAY_WEB_URL ?? "https://web.iai.one"` — **Fix**: Verify pay app only links to web.iai.one if payment pack for web is unlocked (currently `PREP_ONLY` status).

- **content/en.json:353, vi.json:353** — Footer copy references web.iai.one — `"web.iai.one operates as a growth surface on the same trust, auth, billing, and proof system as the core platform."` — **Fix**: This footer is rendered on root/home/app surfaces. Must be conditionally rendered only when `WEB_SURFACE_ENABLED=true`.

- **content/site-map.md:58,68,71** — site-map lists web.iai.one, cdn.iai.one, flows.iai.one under domain map — Marked as internal reference (not reclassified yet to match patch intent). **Fix**: If sitemap.xml is auto-generated from site-map.md, ensure cdn/flows entries do not appear in public sitemap.xml; web.iai.one must be conditional.

- **docs/iai-language-standard-lock.md:119** — Lists web.iai.one in language standards — Informational document. **Fix**: Already correctly marked as internal; no code change needed.

- **content/iai-master-domain-mission-map.md:182,220,222,254** — Defines domain mission and roles — Correctly marked as internal policy doc. **Fix**: No code change needed; this is specification-layer, not public UI.

---

## OK (120+ refs)

**Nature**: Technical config, internal execution docs, release evidence, admin controls, test/verification logs.

**Category breakdown**:

1. **Internal Documentation** (70+ refs in `/docs/`) — Release evidence packets, execution boards, team directives, status reports, CFO matrix, env bindings, etc. — All correctly scoped as internal team documents. No fix required.

2. **Technical Configuration** (10+ refs):
   - `trust-iai-one-starter/src/data/trust-state.json` — Internal trust ledger state. Correctly marked internal.
   - `apps/web/src/server.ts:360` — `origin` parameter in auth flow. Config-only, correctly hidden behind feature flag check.

3. **Test/Verification Logs** (5+ refs in `/docs/verification-log.md`, trust-iai-one-starter) — Marked "dns_not_resolving" or "declared" states. Correctly identifying hold status.

4. **README Context** (5+ refs in app-level README.md files):
   - `apps/home/README.md:41` — Correctly documents: "Only set it to `true` after Team 1 accepts DNS/deploy truth for `web.iai.one`."
   - `apps/root/README.md:41` — Same guard statement; correctly documented.
   - `apps/web/README.md:1,3` — Self-reference to own domain is expected.

---

## Summary

- **CRITICAL**: 1 ref (home.ts server config exposed in health/portal render without flag guard)
- **MEDIUM**: 8 refs (footer UI copy, pay server config, SEO render path, root health output — all need conditional guards)
- **OK**: 120+ refs (internal docs, config-only, test logs, correctly guarded)

**Wave 1 Deploy Gate**: **BLOCKED**

**Action Required Before Wave 1**:
1. Wrap home portal render to check `HOME_WEB_SURFACE_ENABLED` before exposing web.iai.one link.
2. Wrap root health output and OG route to check `ROOT_WEB_SURFACE_ENABLED` before exposing web.iai.one.
3. Wrap footer copy in content templates to render conditionally only when `*_WEB_SURFACE_ENABLED=true`.
4. Verify `apps/web/src/i18n.ts` SEO paths are gated; do not publish canonical/hreflang for web.iai.one in sitemap.xml until flag=true.
5. Verify apps/pay links to web only if payment pack status allows (currently PREP_ONLY; gate accordingly).

**Secondary Actions (Wave 2-5)**:
- Refresh cdn.iai.one and flows.iai.one payment registry notes once owner evidence packets close.
- Reclassify internal domain entries in site-map.md once public surface map is finalized.

---

**Audit Completed**: 2026-05-01 | **Scope**: Full cross-repo grep + classification | **Exclusions**: node_modules, .git, test files, release-evidence, internal reports

---

## VERIFICATION ADDENDUM (Control Tower review, 2026-05-01)

Initial audit verdict was `BLOCKED`. After verification against actual code + test assertions, several findings were re-classified.

### CRITICAL re-classified to FALSE POSITIVE

**Original claim**: `apps/home/src/server.ts:36` — `webUrl` config exposes web.iai.one without flag check.

**Actual**: Config object holds `webUrl` default for *future enable*; the **rendered HTML never includes the URL when flag=false**. Verified by:
- `apps/home/src/render.ts:78-89` — surface card render is gated `config.webSurfaceEnabled ? renderSurfaceCard(...) : ""`
- `tests/integration/home-surface.test.mjs:34` — `assert.doesNotMatch(html, /https:\/\/web\.iai\.one/)` PASSES with default config
- `tests/integration/home-surface.test.mjs:57-71` — explicit re-enable test verifies URL appears only when `webSurfaceEnabled: true`

Same applies to `apps/root/src/server.ts:36` (MEDIUM #1) — verified clean by `tests/integration/root-surface.test.mjs:33` + lines 56-70.

### MEDIUM re-classified

| # | Original | Re-classified | Reason |
|---|---|---|---|
| #1 root server.ts:36 | MEDIUM | **FALSE POSITIVE** | Same gating verified by test |
| #2 apps/web/src/i18n.ts | MEDIUM | **DEFERRED Wave 5** | Self-reference inside web.iai.one app — handled when Wave 5 deploys |
| #3 apps/pay/payment-surface-registry | MEDIUM | **DEFERRED Wave 4** | Pay registry is Wave 4 scope |
| #4 apps/pay/server.ts:261 | MEDIUM | **DEFERRED Wave 4** | Pay app Wave 4 |
| #5 content/en.json + vi.json `web.landing.footer` | MEDIUM | **DEFERRED Wave 5** | Verified `web.landing.footer` is rendered ONLY by `apps/web/src/render.ts`, not by root/home/docs render. Confirmed via `grep "web\." apps/{root,home,docs}/src/render.ts` returns only `web.title` + `*.surface.web.body` (all gated) |
| #6 content/site-map.md | MEDIUM | **FALSE POSITIVE** | Anh đã reclassify in this commit: web.iai.one → "Growth (release hold)", cdn/flows → "Internal/infrastructure/hold" with explicit hold notes |
| #7 docs/iai-language-standard-lock.md | MEDIUM | **OK (informational)** | Language standards doc, internal |
| #8 content/iai-master-domain-mission-map.md | MEDIUM | **OK (policy spec)** | Domain mission spec, internal |

### REVISED VERDICT

| Severity | Original | Verified |
|---|---|---|
| CRITICAL | 1 | **0** |
| MEDIUM (Wave 1 blocking) | 8 | **0** |
| Wave 4 deferred | — | 2 (apps/pay) |
| Wave 5 deferred | — | 2 (apps/web self-ref) |
| FALSE POSITIVE | — | 4 |
| OK | 120+ | 120+ |

**Wave 1 Deploy Gate**: ✅ **CLEAN — UNBLOCKED**

The Batch 1 patch (feature-flag gating + sitemap reclassify) effectively removes web.iai.one from public navigation by default. No code path in root/home/docs leaks hold-domain references in rendered HTML when default config is used. Tests prove this.

**Future Wave gates** (not blocking now):
- Wave 4: audit apps/pay payment-surface-registry + server config gating before pay/api boundary lock
- Wave 5: gate `web.landing.footer` content + apps/web SEO entries when web.iai.one DNS/deploy truth lands

---

**Verification by**: Control Tower (Opus 4.7) | **Method**: cross-reference audit findings vs `git diff HEAD`, render.ts gating, test assertions, content key usage grep | **Date**: 2026-05-01
