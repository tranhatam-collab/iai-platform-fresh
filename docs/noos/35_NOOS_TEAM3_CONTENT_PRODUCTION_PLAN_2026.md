# 35_NOOS_TEAM3_CONTENT_PRODUCTION_PLAN_2026

# NOOS Team 3 Content Production Plan
## Version 1.0
## Status: ACTIVE FOR TEAM 3 EXECUTION
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Bien lock files `24/25/26/28/29` thanh commerce surfaces co the publish duoc ma khong lam lech vai tro cua `noos.iai.one`.

File nay dinh nghia:
- Team 3 duoc san xuat nhung surface nao
- trinh tu xuat ban catalog/product/library
- quality gate noi dung truoc khi release
- cach handoff sang Team 4 ma khong doi lock truth

---

## 2. Owner, scope, va source of truth

- Owner: Team 3 Surface Lead
- Scope: catalog IA, product detail pages, buyer library surfaces, checkout handoff copy, NOOS route-level boundary compliance
- Review cadence: daily 11:00 ICT, pre-release review cung Team 1 neu co route/copy thay doi

Locked inputs bat buoc:
- `24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`
- `32_NOOS_TEAM3_SITE_IA_AND_APP_SURFACE_EXECUTION_PLAN_2026.md`
- `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md`

Khong thuoc scope:
- doi `product_code`, tier, gia, update window, hoac entitlement truth
- mo NOI dung theo huong investor/fundraising
- tu y tao campaign copy trai boundary cho Team 4

---

## 3. Surface inventory phai san xuat

### Catalog and discovery
- `/products`
- `/documents`
- `/programs`
- role-based catalog framing khi duoc mo P2

### Product detail
- `/product/[slug]`
- dung dung 12-section template khoa
- render dung title, positioning, price, license, update window, related ladder

### Buyer library
- `/library`
- `/library/product/[slug]`
- `/library/updates`
- `/library/licenses`
- `/library/account`

### Checkout handoff
- `/checkout`
- `/checkout-success`

### Operations-facing cross-team surface
- `/operations`
- chi duoc hien Team 4 contract, launch waves, support SLA, KPI contract
- khong doi Team 4 policy truth

---

## 4. Content production rules (khong duoc vi pham)

### 4.1 Product page rule
Moi product page phai co du 12 sections theo file `24`:
1. Product Hero
2. Product Positioning
3. Who It Is For
4. What Problems It Solves
5. What Is Included
6. Deliverables and Format
7. License and Usage
8. Version and Updates
9. Why This Matters
10. Related Products
11. FAQ
12. Final CTA

### 4.2 Commerce truth rule
Bat buoc hien thi ro:
- gia
- default license
- update window
- ladder next step
- library handoff neu da checkout

### 4.3 Boundary rule
Khong duoc:
- bien `noos.iai.one` thanh investor portal
- mo fundraising catalog, execution fund CTA, hoac investor package language
- de legacy route song cong khai ma khong redirect/noindex

### 4.4 Copy tone rule
Duoc:
- authority-led
- concise
- structured
- contract-led

Khong duoc:
- fake urgency
- discount landing voice
- over-claim
- vague benefits khong map ve lock files

---

## 5. Backlog Team 3

### P0
- ship `/products`, `/documents`, `/programs`
- ship priority product pages theo lock
- ship `/checkout-success` voi library handoff
- dong legacy investor/fundraising routes bang redirect + noindex
- pass `pnpm test:noos-web`
- pass `pnpm test:noos-commerce-contracts`

### P1
- hoan thien full 12 product pages
- day du empty/update/upgraded states trong library
- bo sung comparison va recommendation modules theo ladder lock

### P2
- role-based catalog view
- optimization blocks cho upsell/cross-sell
- team-license comparison surface cho P12

---

## 6. Dependencies va handoff

### Team 2
- checkout/order/library state truth
- entitlement va fulfillment status
- webhook stability

### Team 4
Team 3 handoff cho Team 4 khi:
- routes da on dinh
- CTA mapping khong doi
- boundary cleanup da xong
- `/operations` render du launch wave, KPI, support contract

Team 4 duoc phep tiep tuc:
- funnel tuning
- launch sequencing
- KPI dashboard
- support operations

Team 4 khong duoc doi:
- route names
- product truth
- pricing truth
- license truth

---

## 7. Review checklist truoc publish

- route dung IA trong file `32`
- product page du 12 sections
- gia/license/update window hien ro
- related products dung ladder
- checkout-success co library handoff
- library states khong sai truth
- khong con route investor/fundraising public
- page khong co investor/fundraising wording

---

## 8. Definition of done

Done khi:
- Team 3 surfaces build dung lock files `24/25/26/28/29`
- boundary cleanup da co evidence test
- Team 4 nhan duoc stable surface + handoff notes ma khong can hoi lai ve route truth
- file `36` va `39` duoc cap nhat song song voi implementation
