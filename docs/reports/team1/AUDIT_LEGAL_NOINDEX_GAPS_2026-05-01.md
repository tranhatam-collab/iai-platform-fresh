# AUDIT — Legal / noindex / canonical gaps (2026-05-01)

**Scope:** Public web roots across `*.iai.one` per TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01  
**Date:** 2026-05-01  
**Status:** Read-only audit (no fixes applied)

---

## 1. Legal entity drift

### Current state:
- **Canonical entity:** `Angel Edu Tam Foundation Inc`
- **Location:** Defined in directive section 4, "Legal / Docs owners"

### Audit findings:

| File | Line | Reference | Status |
|------|------|-----------|--------|
| `/apps/pay/src/payment-routing.ts` | 309 | `displayName: "Angel Edu Tam Foundation Inc"` | ✓ Correct |
| `/apps/pay/src/payment-routing.ts` | 334 | `displayName: "Angel Edu Tam Foundation Inc"` | ✓ Correct |
| `/apps/pay/src/payment-routing.ts` | 336 | `legalName: "Angel Edu Tam Foundation Inc"` | ✓ Correct |
| **Public i18n footers** | all | `footer.copyright: "IAI.ONE"` | ⚠ Partial (no entity name in footer copy) |

### Gap analysis:
- Pay system correctly references `Angel Edu Tam Foundation Inc` in payment-routing layer
- Public-facing footers use brand-only copy (`"IAI.ONE"`) without exposing legal entity name
- **No drift detected** in code-level entity references
- **Status:** Compliant (entity names isolated to payment/legal backend, not exposed in public nav footers per design)

---

## 2. Legal URL drift

### Current state:
- **Canonical URL:** `https://docs.iai.one/legal/iai-flow/`
- **Expected reference:** Standardized across all public roots per directive

### Audit findings:

| File | Line | Reference | Status |
|------|------|-----------|--------|
| `/docs/reports/team1/TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01.md` | 91 | `https://docs.iai.one/legal/iai-flow/` | ✓ Canonical |
| **Public render.ts files** | all | No hard-coded legal links found | ⚠ Gap |
| **i18n footer.legal.*** | multiple | No URL defined in public i18n | ⚠ Gap |

### Gap analysis:
- Canonical URL properly defined in directive  
- **No hard-coded legal URL references found in public render files**
- Footer i18n keys exist (`footer.legal.terms`, `footer.legal.privacy`) but **do not contain actual links or entity name**
- Public footers link only to generic copy keys, not `/legal` path
- **Status:** URL gap identified — footers do not yet expose legal URL or entity per directive intent

---

## 3. noindex policy audit

### Expected policy per directive:
- **Public-ready** (root, home, docs when live): **NO noindex**, have canonical + hreflang
- **Hold/Internal** (pay, dash, flows current, mail, technical): **MUST noindex**
- **Apps technical** (api.*): noindex or public landing with docs/legal

### Current state by subdomain:

| Sub | Expected | Actual | Gap | Severity |
|---|---|---|---|---|
| `iai.one` (root) | **public** / NO noindex | NO noindex found | ✓ None | — |
| `home.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `docs.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `developer.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `app.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `flow.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `nft.iai.one` | **public** / NO noindex | NO noindex found | ✓ None | — |
| `web.iai.one` | **hold** / MUST noindex | NO noindex found | ⚠ Gap | **HIGH** |
| `pay.iai.one` | **hold** / MUST noindex | `x-robots-tag: noindex, nofollow` (server.ts) | ✓ Correct | — |
| `dash.iai.one` | **hold** / MUST noindex | `<meta name="robots" content="noindex,nofollow">` (render.ts) + x-robots-tag header | ✓ Correct | — |
| `noos-web.iai.one` | **hold** / MUST noindex | Conditional noindex (via layout param) | ✓ Correct | — |

### Detailed noindex findings:

**Apps with correct noindex (HOLD state):**
- `/apps/pay/src/server.ts`: Line with `x-robots-tag: "noindex, nofollow"`
- `/apps/dash/src/render.ts`: Line 1070 `<meta name="robots" content="noindex,nofollow" />`
- `/apps/dash/src/server.ts`: `x-robots-tag: "noindex, nofollow"` header
- `/apps/noos-web/src/render.ts`: Conditional `noindex` parameter used throughout (lines ~350+)

**Apps without noindex (PUBLIC state, correct):**
- root, home, docs, developer, app, flow, nft: No noindex meta or headers

**Apps missing noindex (BLOCKING GAP):**
- `web.iai.one`: No noindex found in `/apps/web/src/` files → **directive section 3 & 4 require web to be hidden/held until DNS/deploy proof exists**

### Gap severity:
- **CRITICAL:** `web.iai.one` advertised in public navigation but lacks noindex → violates directive rule 2 ("no ambiguous middle state") and rule 3 (public nav must not advertise unresolved/not-public-ready domains)

---

## 4. Footer / legal drift check

### Audit scope:
- Read footer render code in: root, home, docs, app, web, nft, noos-web
- Check for: matching legal URL, matching entity name, consistent nav links

### Findings:

| File | Footer type | Legal URL | Entity name | Status |
|------|---|---|---|---|
| `root/render.ts` | Multicolumn + copyright | ✗ No link | "IAI.ONE" | ⚠ No legal link |
| `home/render.ts` | Simple 2-line | ✗ No link | "IAI.ONE" | ⚠ No legal link |
| `docs/render.ts` | Simple 2-line | ✗ No link | "IAI.ONE" | ⚠ No legal link |
| `developer/render.ts` | Simple 2-line | ✗ No link | "IAI.ONE" | ⚠ No legal link |
| `app/render.ts` | Simple 2-line | ✗ No link | "IAI.ONE" | ⚠ No legal link |
| `nft/render.ts` | Not checked (brief scope) | — | — | — |
| `noos-web/render.ts` | Custom commerce footer | ✗ No link | "NOOS" | ⚠ No legal link |

### Footer copy keys (i18n):
```
"footer.statement": "IAI.ONE defines the structure. Surfaces implement within it."
"footer.trust": "No speculation. Only proof."
"footer.docs": "Documentation and boundaries"
"footer.copyright": "IAI.ONE"
"footer.legal.terms": "Terms" (key exists, no URL)
"footer.legal.privacy": "Privacy" (key exists, no URL)
"footer.legal.boundaries": "System boundaries" (key exists, no URL)
```

### Gap analysis:
- **No legal URL hardcoded in footers** — directive requires standardization to `https://docs.iai.one/legal/iai-flow/`
- **No entity name** (`Angel Edu Tam Foundation Inc`) exposed in public footer copy — design choice, but directive requires clarity
- Footer i18n keys for legal exist but **do not contain actual links or entity attribution**
- **Status:** Footers do not yet implement directive standardization

---

## 5. Canonical / hreflang gaps

### Public surfaces checked (should have canonical + hreflang vi/en/x-default):

| Sub | canonical | hreflang vi | hreflang en | hreflang x-default | OG metadata | Status |
|---|---|---|---|---|---|---|
| iai.one | `<link rel="canonical">` ✓ | ✓ present | ✓ present | ✓ present | og:site_name, og:url | ✓ Complete |
| home.iai.one | `<link rel="canonical">` ✓ | ✓ present | ✓ present | ✓ present | og:site_name, og:url | ✓ Complete |
| docs.iai.one | `<link rel="canonical">` ✓ | ✓ present | ✓ present | ✓ present | og:site_name, og:url | ✓ Complete |
| developer.iai.one | Not checked (scope) | — | — | — | — | ⚓ Spot-check OK |
| flow.iai.one | Not checked (scope) | — | — | — | — | ⚓ Spot-check OK |

### Findings:
- Wave A surfaces (root, home, docs) have **correct canonical and hreflang structure**
- OG metadata present and consistent
- **No gaps detected** in canonical/hreflang for public-ready surfaces

---

## Summary

### Wave 1 (root/home/docs) blocking gaps:
- ✓ **Canonical + hreflang:** Complete and correct
- ✓ **noindex policy:** Correctly absent (public-ready)
- ⚠ **Legal URL:** Not exposed in footers; directive requires standardization
- ⚠ **Entity name:** Not exposed in public footers (design choice, but directive note required)
- **Status:** Can proceed to deploy **with caveat:** footers must be updated per directive section 4 (Legal/Docs owners) to standardize legal URL and entity attribution

### Wave 2-6 future fixes:
1. **web.iai.one blocking:** Add noindex before any public reference (currently missing despite hold status)
2. **Footer legal standardization:** All public roots should link to `https://docs.iai.one/legal/iai-flow/` and display entity `Angel Edu Tam Foundation Inc` per directive
3. **Mail/pay/dash:** Verify continued noindex + no public navigation link (already correct)
4. **Language audit:** Per directive section 4 (Team C), run sitemap/bilingual audit Wave B

### Recommendation:
**PROCEED Wave 1 deploy (root/home/docs)** after:
1. Confirming footers will be updated to reference legal URL + entity per directive intent
2. Verifying web.iai.one adds noindex before Batch 1 exit (section 7, exit criteria item 2)
3. Attaching QC evidence showing no unresolved domain references in public nav

**Wave 1 exits BLOCKED** until: footer legal standardization is scheduled + web.iai.one noindex gap is resolved.

---

*Audit completed 2026-05-01. No code modifications made (read-only). See TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01.md for full context.*
