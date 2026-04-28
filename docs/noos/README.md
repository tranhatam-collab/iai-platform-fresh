# NOOS Lock Pack (Team 1)

Status: LOCKED FOR TEAM ALIGNMENT  
Owner: Team 1 (Architecture & Contracts)

## Purpose

Folder `docs/noos/` is the canonical lock set for NOOS commerce-doc architecture in this repo.

This lock set ensures:
- commerce does not drift away from NOOS architecture role
- product pages, pricing, license, and buyer library stay contract-led
- Team 2, Team 3, and Team 4 can implement without re-interpreting strategy

## Locked files

- `22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`
- `31_NOOS_TEAM1_COMPLETION_AND_CROSS_TEAM_SYNC_2026.md`
- `32_NOOS_TEAM3_SITE_IA_AND_APP_SURFACE_EXECUTION_PLAN_2026.md`
- `33_NOOS_TEAM4_GROWTH_REVENUE_AND_OPERATIONS_EXECUTION_PLAN_2026.md`
- `34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md`

## Machine-readable pack

- `NOOS_COMMERCE_SCHEMA_PACK_v0.1.json`
- `NOOS_COMMERCE_OPENAPI_RENDERED.yaml`
- `NOOS_COMMERCE_FIXTURES_v0.1/`

## Quick commands

- `pnpm mock:noos-commerce`
- `pnpm test:noos-commerce-contracts`

## Dependency order

1. `22` = master strategy and commerce architecture  
2. `28` = product truth (12 products)  
3. `24` = product page system  
4. `25` = pricing + license law  
5. `26` = entitlement + library + delivery runtime truth
6. `27` = Stripe checkout + fulfillment execution plan
7. `29` = upsell/cross-sell ladder system
8. `31` = Team 1 handoff and cross-team execution sync
9. `32` = Team 3 execution lock (site IA + app surfaces)
10. `33` = Team 4 execution lock (growth + revenue + operations)
11. `34` = bilingual SEO + locale lock for all NOOS teams

## Integration rule

Files in this folder are not a separate business branch.
They are an extension layer of NOOS architecture/control direction in:

- `docs/noos-platform/NOOS_DEV_DIRECTION_MASTER_2026.md`

## Team handoff

- Team 2 (Runtime/Testbed): build checkout, entitlements, webhook flow, delivery protection, version log states.
- Team 3 (Site IA/App Surface): build catalog routes, product pages, comparison blocks, and buyer-library surface.
- Team 4 (Growth/Revenue/Ops): launch sequencing, funnel performance, upgrade operations, support SLA, and KPI governance.
- All teams: follow `34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md` for English-first public SEO, Vietnamese with full diacritics, locale-prefixed routes, and future locale expansion.
