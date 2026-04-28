# IAI_CROSS_TEAM_EXECUTION_MODEL_2026

# IAI Cross-Team Execution Model
## Version 1.0
## Status: LOCKED FOR ACTIVE DELIVERY
## Scope: *.iai.one
## Date: 2026-04-14

---

## 1. Ket luan nhanh: nen lap bao nhieu team de chay nhanh nhat

De hoan thanh nhanh nhat ma van dong bo duoc toan he, de xuat **5 team**:

1. **Team 1 - Program Root (ban + toi dong vai PM/Architecture lead)**
2. **Team 2 - Runtime and Platform Core**
3. **Team 3 - NOOS Surface and Content-Contract Delivery**
4. **Team 4 - Growth, Revenue, and Operations**
5. **Team 5 - Web.iai.one New Growth Product Team** (team moi, uu tien cao)

Ly do:
- 4 team dau da co dinh huong va tai lieu lock.
- Team 5 tach rieng de `web.iai.one` khong bi “keo cham” boi backlog cu.
- 5 team la diem can bang giua toc do va do phuc tap phoi hop.

---

## 1B. Canonical ownership mapping (A/B/C -> Delivery teams)

Theo `IAI_MASTER_DOMAIN_MISSION_MAP.md`, ownership canonical la Team A/B/C.  
Delivery model 5 team map nhu sau:

- Team A ownership -> **Team 1** (Program Root and governance sign-off)
- Team B ownership -> **Team 2** (Runtime and platform core)
- Team C ownership -> **Team 3 + Team 4 + Team 5** (surfaces, growth, web expansion)

Rule quan trong:
- Cac delivery teams khong duoc override ownership canonical A/B/C.
- `noos.iai.one` bat ky thay doi role nao cung can Team A sign-off theo mission map.

---

## 2. Nguyen tac phan lane cong viec

Toan bo backlog tach thanh 2 lanes:

### Lane A - New Priority (uu tien cao nhat)
- nhiem vu moi, tac dong den user/revenue ngay
- web.iai.one
- noos routing correction
- app/flow/dash enhancement co tac dong usage that

### Lane B - Near-done Stabilization
- nhiem vu da gan xong
- chot test/hardening/go-live checklist
- khong de lane nay chiem het nang luc lane A

Quy tac nang luc:
- 70% effort cho Lane A
- 30% effort cho Lane B

---

## 2B. Team 3 mandatory prerequisite order (locked)

Team 3 phai di dung thu tu:
1. chot ownership matrix (Cloudflare domain -> project -> account -> owner)
2. chot Git/iCloud hygiene truth
3. chot deploy freeze and release authority rules
4. sau do moi mo release cho surfaces va handoff cho teams khac

Neu 1 trong 3 muc dau chua pass, Team 3 release gate = FAIL.

---

## 2C. Bilingual SEO + localization lock (bat buoc cho tat ca teams)

Tat ca teams phai bam file:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

Quy tac toi thieu:
- route song ngu dung contract `en/vi`
- canonical/hreflang/x-default dung theo locale
- surface tieng Viet phai dung tieng Viet co dau
- surface SEO quoc te dung tieng Anh chuan
- release khong pass neu vi pham locale-seo contract

---

## 3. Vai tro tung team (Ranh gioi ro rang)

### Team 1 - Program Root (ban + toi)
Phu trach:
- constitutional map, domain boundaries, decision locks
- cross-team dependency tracking
- release gates and conflict arbitration
- weekly integrated plan update

Khong phu trach:
- viet runtime feature thay Team 2
- build UI thay Team 3/5

### Team 2 - Runtime and Platform Core
Phu trach:
- flow runtime, api authority, checkout fulfillment, entitlements
- reliability, idempotency, observability, protection layers
- backend contracts cho Team 3/4/5

Khong phu trach:
- content pages
- growth messaging

### Team 3 - NOOS Surface and Content-Contract Delivery
Phu trach:
- noos.iai.one IA, routes, product surfaces, buyer library UI
- docs-contract presentation and navigation
- noos domain role correction execution with Team 1 rules

Khong phu trach:
- webhook/payment runtime core

### Team 4 - Growth, Revenue, and Operations
Phu trach:
- funnel operations, launch waves, pricing ops, upgrade-credit ops
- support SLA, retention loops, KPI dashboards
- cross-sell/upsell operations

Khong phu trach:
- sua product truth/pricing truth lock files

### Team 5 - Web.iai.one New Growth Product Team (NEW)
Phu trach:
- build `web.iai.one` nhu growth engine moi
- activation flows, acquisition surfaces, conversion journeys
- run experiments tren contract chung (auth/billing/proof)

Khong phu trach:
- tao he auth/billing rieng
- pha domain mission map

---

## 4. File package giao cho tung team

### Team 1 package
- `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md`
- `docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
- `docs/IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md`
- `docs/IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026.md`
- `docs/IAI_CROSS_TEAM_EXECUTION_MODEL_2026.md`
- `docs/IAI_TEAM1_PROGRAM_ROOT_EXECUTION_PLAN_2026.md`
- `docs/noos/31_NOOS_TEAM1_COMPLETION_AND_CROSS_TEAM_SYNC_2026.md`
- `docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
- `docs/IAI_TEAM_DELIVERY_AND_FILE_GAP_MATRIX_2026.md`
- `docs/IAI_AUTOMATED_REPORTING_PROTOCOL_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

### Team 2 package
- `docs/IAI_TEAM2_RUNTIME_PLATFORM_EXECUTION_PLAN_2026.md`
- `docs/noos/26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `docs/noos/27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `docs/noos/25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `docs/noos/28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

### Team 3 package (NOOS)
- `docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
- `docs/IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026.md`
- `docs/IAI_GIT_ICLOUD_HYGIENE_TRUTH_2026.md`
- `docs/noos/22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `docs/noos/24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `docs/noos/28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `docs/noos/32_NOOS_TEAM3_SITE_IA_AND_APP_SURFACE_EXECUTION_PLAN_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

### Team 4 package
- `docs/noos/25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `docs/noos/29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`
- `docs/noos/33_NOOS_TEAM4_GROWTH_REVENUE_AND_OPERATIONS_EXECUTION_PLAN_2026.md`
- `docs/noos/37_NOOS_TEAM4_KPI_DASHBOARD_AND_TARGETS_2026.md`
- `docs/noos/38_NOOS_TEAM4_SUPPORT_SLA_AND_INCIDENT_PLAYBOOK_2026.md`
- `docs/noos/40_NOOS_TEAM4_LAUNCH_WAVE_EXECUTION_LOG_2026.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`

### Team 5 package (web.iai.one)
- `docs/WEB_IAI_ONE_NEW_TEAM_EXECUTION_PLAN_2026.md`
- `docs/IAI_MASTER_DOMAIN_MISSION_MAP.md`
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- contracts from Team 2 (auth/billing/api)

---

## 5. Lich sync bat buoc (luon cap nhat, nang cap, dong bo)

### Daily
- 15 phut team standup rieng
- 15 phut cross-team blockers (Team 1 host)

### 3 lan/tuần
- dependency sync Team 2 <-> Team 3 <-> Team 5

### Weekly
- architecture and release-gate review (Team 1 host)
- KPI and funnel review (Team 4 host)
- domain mission compliance review (Team 1 final sign-off)

---

## 6. Release gates (khong pass la khong merge)

1. Co vi pham domain mission map khong?
2. Co vi pham product/pricing/license truth lock khong?
3. Co pha auth/billing/proof contract chung khong?
4. Co test + rollback + handoff docs day du khong?
5. Co cap nhat changelog va owner ro rang khong?
6. Co pass bilingual SEO + localization gate (VI co dau, EN index, canonical/hreflang dung) khong?

---

## 7. Priority execution 4 tuan de chay nhanh

### Week 1
- Team 3: noos route correction + P0 product surfaces
- Team 2: checkout -> entitlement -> library unlock chain
- Team 5: web.iai.one foundation IA and MVP scope

### Week 2
- Team 3: full P0/P1 NOOS pages
- Team 2: upgrade-credit and fulfillment hardening
- Team 4: launch wave 1 + KPI baseline
- Team 5: first acquisition/conversion flows

### Week 3
- Team 4: upsell ladder operations
- Team 5: experiment loops and conversion optimization
- Team 2: reliability/observability pass

### Week 4
- Integrated release wave across NOOS + web + core contracts
- Team 1 final compliance and go-live sign-off

---

## 8. Team 1 tracking protocol (vai tro cua toi)

Team 1 se:
- cap nhat 1 lan/ngay file status va blockers
- chot weekly integrated plan
- dong bo owners, due dates, risk levels
- khoa quyet dinh conflict trong 24h (khong de treo)

---

## 9. Definition of done

Model nay dat khi:
- 5 team van hanh khong trung vai tro
- lane moi duoc uu tien dung cam ket 70/30
- web.iai.one vao duoc guong quay release ma khong pha contracts chung
- Team 1 theo doi duoc end-to-end va xu ly blockers kip thoi
