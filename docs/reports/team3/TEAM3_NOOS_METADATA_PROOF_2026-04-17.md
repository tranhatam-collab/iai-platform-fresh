# TEAM3_NOOS_METADATA_PROOF_2026-04-17

- Team: Team 3 Surface/IA/Content
- Domain: `noos.iai.one`
- Scope: route-level metadata proof cho EN/VI NOOS surfaces
- Date: 2026-04-17

---

## 1. Nguồn Metadata Contract

- Metadata rendering contract được tập trung tại:
  - `apps/noos-web/src/render.ts` (`layout()` generates `title`, `description`, `canonical`, `hreflang`, `x-default`, and `robots`)
- Route-level verification contract được cover tại:
  - `tests/integration/noos-commerce-surface.test.mjs`

---

## 2. Route-Level Metadata Proof Matrix

| Route group | Metadata expectation | Proof source | Status |
|---|---|---|---|
| `/products`, `/`, `/vi` | non-prefixed routes phải redirect vào locale-prefixed canonical entrypoints | `noos-commerce-surface.test.mjs` (`public routes redirect to locale-prefixed canonicals`) | PASS |
| `/en/products`, `/vi/products` | locale switcher + alternate locale metadata phải hiện diện; EN-first public behavior được giữ | `noos-commerce-surface.test.mjs` (`english catalog renders...hreflang`) | PASS |
| `/en/product/<slug>`, `/vi/product/<slug>` | canonical và alternate localized product metadata phải hiện diện | `noos-commerce-surface.test.mjs` (`sitemap and product canonicals expose localized SEO endpoints only`) | PASS |
| `/en/library`, `/vi/library`, `/en/checkout-success`, `/vi/checkout-success` | buyer-only routes phải localized và có `noindex,nofollow` | `noos-commerce-surface.test.mjs` (`library and checkout-success stay localized and noindexed`) | PASS |
| Legacy investor/fundraising routes | legacy routes phải redirect khỏi NOOS public surface và giữ noindex/no-follow | `noos-commerce-surface.test.mjs` (`legacy investor and fundraising routes...`) | PASS |
| `/sitemap.xml` | sitemap chứa EN/VI localized endpoints và loại trừ retired investor/fundraising paths | `noos-commerce-surface.test.mjs` (`sitemap and product canonicals...`) | PASS |

---

## 3. Generator Behavior Proof

`apps/noos-web/src/render.ts` metadata behavior in `layout()`:
- emits `<title>` and `<meta name="description">`
- emits `<link rel="canonical">` for indexable routes
- emits per-locale `<link rel="alternate" hreflang="...">`
- emits `<link rel="alternate" hreflang="x-default">`
- emits `<meta name="robots" content="noindex,nofollow">` for buyer/private states

Điều này giúp Team 3 giữ đúng locale và metadata ownership while consuming shared runtime contracts mà không fork locale/auth/billing wording.

---

## 4. Verification Commands

- `pnpm typecheck:noos-web` -> PASS
- `pnpm test:noos-web` -> PASS
- `pnpm test:noos-commerce-contracts` -> PASS
- `NOOS_STACK_TEST=1 pnpm test:noos-stack` -> PASS
- `pnpm report:lane` -> PASS (`Overall: PASS`, snapshot date `2026-04-17`)
