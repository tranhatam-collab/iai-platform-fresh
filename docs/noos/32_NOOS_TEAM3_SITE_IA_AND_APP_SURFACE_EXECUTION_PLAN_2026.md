# 32_NOOS_TEAM3_SITE_IA_AND_APP_SURFACE_EXECUTION_PLAN_2026

# NOOS Team 3 - Site IA and App Surface Execution Plan
## Version 1.0
## Status: LOCKED FOR TEAM 3 EXECUTION
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Team 3 chiu trach nhiem build toan bo commerce surface theo lock files, de buyer co the:
- kham pha catalog
- doc product pages
- di checkout
- quay lai buyer library

Khong duoc doi product truth, pricing truth, hoac entitlement truth.

---

## 2. Team 3 ownership (bat buoc)

### IA + routes
- `/en/*` public and buyer routes (English-first default)
- `/vi/*` public and buyer routes (Vietnamese with full diacritics in copy)
- `/products`
- `/documents`
- `/programs`
- `/licenses`
- `/product/[slug]`
- `/library`
- `/library/product/[product-slug]`
- `/library/updates`
- `/checkout-success`

### UI surfaces
- catalog views (theme/depth/buyer type)
- product detail template surfaces
- comparison blocks
- related products ladder cards
- buyer library UX (view/download/updates/license)
- locale switcher + canonical/hreflang/meta descriptions

---

## 3. Inputs Team 3 phai bam

- `24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`
- `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md`
- `docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
- `docs/IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md`
- `docs/IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026.md`

## 3A. Team 3 execution files

- `35_NOOS_TEAM3_CONTENT_PRODUCTION_PLAN_2026.md`
- `36_NOOS_TEAM3_UI_QA_AND_RELEASE_CHECKLIST_2026.md`
- `39_NOOS_DOMAIN_CORRECTION_IMPLEMENTATION_LOG_2026.md`

---

## 4. Out of scope (khong thuoc Team 3)

- webhook fulfillment logic
- entitlement grant backend
- Stripe event handling
- payment security logic

Nhung Team 3 phai tich hop hooks UI voi Team 2 contracts.

---

## 5. Build backlog

### P0 (72h)
- xac nhan Cloudflare ownership matrix rows cho cac domains Team 3 dung
- pass deploy authority and freeze gates truoc khi release Team 3 surfaces
- xac nhan git hygiene truth cho release branch
- loai bo/noindex/redirect cac route investor-fundraising legacy tren `noos.iai.one` (bat buoc truoc public release)
- ap dung route locale `en/vi`, Vietnamese copy co dau, canonical/hreflang/x-default theo lock standard
- dung page shell cho `/products` + 7 product pages uu tien:
  - P01, P02, P03, P04, P05, P07, P11
- dung dung 12-section template cho product pages
- render price + default license + update window
- related products map dung ladder lock
- dung `/checkout-success` UI with library handoff

### P1 (week 1)
- them 5 product pages con lai: P06, P08, P09, P10, P12
- them comparison blocks Entry/Core/Advanced/Master/Team
- hoan thien `/library`, `/library/product/[slug]`, `/library/updates`
- render full `en` + `vi` metadata and on-page copy parity cho cac routes da khoa
- them support states:
  - empty library
  - update available
  - update window expired
  - upgrade available

### P2 (week 2)
- role-based catalog views
- upsell/cross-sell optimization blocks
- team-license comparison surface cho P12
- organization inquiry entrypoint

---

## 6. Component contract cho Team 3

Reusable components bat buoc:
- ProductHero
- IncludedItemsList
- LicenseBox
- UpdatePolicyBox
- RelatedProductsGrid
- FAQAccordion
- FinalCTABlock
- PurchasedProductsGrid
- LibraryProductCard
- VersionHistoryList
- UpgradeCallout

Team 3 khong hardcode logic tung page theo kieu rieng le.

---

## 7. Team 3 - Team 2 integration checkpoints

### Checkpoint A
Product CTA -> checkout route mapping dung `product_code`.

### Checkpoint B
`/checkout-success` nhan du lieu order va render dung product/license.

### Checkpoint C
Library surfaces doc dung status tu entitlement API:
- `active`
- `expired_updates_only`
- `upgraded`

### Checkpoint D
Locale handoff dung lock `34`:
- checkout/success/library quay lai dung locale
- canonical/hreflang dung cho `en` va `vi`
- route khong prefix chi duoc xem la transition layer, khong phai SEO truth

---

## 8. QA checklist cho Team 3

- moi product page co du 12 sections?
- gia + license + update hien thi ro?
- related products dung map `29`?
- da an san pham da so huu tren library recommendations?
- `/checkout-success` co library handoff action ro?
- route locale + canonical/hreflang pass cho `en` va `vi`?
- English la default public surface?
- Vietnamese copy co dau day du?

---

## 9. Definition of done Team 3

Team 3 duoc xem la xong khi:
- toan bo routes surface da co va dung IA
- 12 product pages dung template lock
- library UI surfaces day du
- ladder recommendations dung map
- UI khong vi pham pricing/license truth
