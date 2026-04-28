# 26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026

# NOOS BUYER LIBRARY, ENTITLEMENTS, AND DELIVERY SYSTEM
## Version 1.0
## Status: LOCKED FOR DEV, PRODUCT, OPERATIONS
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Khoa post-purchase runtime truth:
- buyer nhan gi sau thanh toan
- entitlement model
- access control
- buyer library IA
- file delivery
- version/update handling

Phu thuoc bat buoc:
- Commerce strategy source: `22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- Product/entitlement truth source: `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`

---

## 2. Core thesis

Knowledge commerce phai co 3 truths:
1. Purchase truth (ai mua gi, license nao, khi nao)
2. Access truth (dang duoc mo gi)
3. Version truth (duoc cap nhat den muc nao)

Buyer library la noi hop nhat 3 truths.

---

## 3. Official system components

1. Buyer account
2. Order record
3. Product record
4. Entitlement record
5. License record
6. Library surface
7. Asset delivery
8. Version/update log

---

## 4. Post-purchase flow (locked)

1. Payment success
2. Order created
3. Buyer account linked/created
4. Entitlement granted
5. Product unlocked in library
6. Receipt + access email
7. Thank-you page
8. Buyer can view/download
9. Updates attach to same entitlement if in window

Khong ket thuc o 1 link tai file.

---

## 5. Library routes

### Core
- `/library`
- `/library/product/[product-slug]`
- `/library/updates`
- `/library/licenses`
- `/library/account`

### Optional later
- `/library/downloads`
- `/library/history`
- `/library/team`
- `/library/invoices`

---

## 6. Library IA minimum

### Library home cards
Moi item hien:
- product title/code/tier
- current version
- purchased date
- license type
- update status
- actions: View / Download / Updates

### Product detail in library
Bat buoc:
- product summary
- your license
- purchase record
- included assets
- version timeline
- upgrade options

### Updates page
- product code
- version
- date
- change summary
- eligibility status

---

## 7. Entitlement model (locked)

Minimum fields:
- buyer_id
- product_code
- license_type
- order_id
- granted_at
- access_status
- update_window_end
- entitlement_code
- version_scope

Access status values:
- active
- expired_updates_only
- revoked
- upgraded
- replaced

Version scope values:
- current_only
- current_plus_minor_updates
- current_plus_selected_updates
- full_bundle_window

---

## 8. Entitlement codes (locked)

- ENT_FOUNDATION = P01
- ENT_WHITEPAPER = P02
- ENT_ARCHITECTURE = P03
- ENT_LAYERS = P04
- ENT_GOVERNANCE = P05
- ENT_SECURITY = P06
- ENT_VIETNAM = P07
- ENT_GRID = P08
- ENT_ORBIT = P09
- ENT_BIOS = P10
- ENT_MASTER = P11
- ENT_BUILDER_TEAM = P12

---

## 9. Product asset model

Asset types:
- main_pdf
- appendix_pdf
- diagram_pack
- summary_sheet
- web_reading_edition
- version_notes
- license_sheet
- bundle_guide

Each asset should include:
- asset_id
- product_code
- asset_type
- version
- file_name
- delivery_mode
- access_rule

---

## 10. Delivery rules

V1 recommended:
- protected asset route or signed URL
- entitlement-bound access
- standardized filenames
- optional soft watermark
- version history trace

Khong dung:
- public forever links
- random file naming
- no version tracking

---

## 11. File naming convention

- `NOOS_P01_Manifesto_Foundation_Pack_v1_0.pdf`
- `NOOS_P02_White_Paper_Official_Extended_Edition_v1_0.pdf`
- `NOOS_P03_Architecture_System_Map_Pack_v1_0.pdf`
- `NOOS_P04_8_Layers_Future_Civilization_Technology_v1_0.pdf`
- `NOOS_P05_Governance_Trust_Human_Sovereignty_Pack_v1_0.pdf`
- `NOOS_P06_Post_Quantum_Auditability_Security_Direction_v1_0.pdf`
- `NOOS_P07_Vietnam_Sovereign_Resilience_Profile_Pack_v1_0.pdf`
- `NOOS_P08_Planetary_Care_Grid_Field_Intelligence_Pack_v1_0.pdf`
- `NOOS_P09_Orbit_NTN_Space_Utility_Pack_v1_0.pdf`
- `NOOS_P10_Programmable_Biology_Regenerative_Systems_Pack_v1_0.pdf`
- `NOOS_P11_Future_Civilization_Technology_Master_Pack_v1_0.pdf`
- `NOOS_P12_Builder_Bundle_for_Teams_v1_0.zip`

---

## 12. Buyer account minimum model

- buyer_id
- email
- name
- order_history
- entitlements
- license_records
- update_notices

---

## 13. Team/org readiness

V1 chua can org portal hoan chinh, nhung data model phai san sang:
- owner + invited members
- seat count
- assigned entitlements
- shared library visibility

---

## 14. Versioning + updates

Product version fields:
- current_version
- release_date
- version_type
- change_summary

Version types:
- minor_update
- content_update
- major_version

Behavior:
- buyer luon thay version dang so huu
- within window: thay update action
- outside window: thay upgrade note

---

## 15. Checkout success + email rules

### `/checkout-success` must show
- product bought
- license summary
- library button
- download now button
- updates note
- related next product

### Purchase email must include
- order confirmation
- product name
- license summary
- open library link
- download link
- support link

---

## 16. Security hygiene

- access based on entitlement
- non-public long-lived links
- update rights based on update window
- license changes logged

No heavy DRM required in V1, but access hygiene is mandatory.

---

## 17. Minimal dev entities

- buyer
- product
- order
- entitlement
- asset
- product_version
- license_record

---

## 18. Dev UI components

- LibraryHeader
- PurchasedProductsGrid
- LibraryProductCard
- ProductAccessPanel
- DownloadList
- VersionHistoryList
- UpdateBadge
- LicenseSummaryBox
- UpgradeCallout
- AccessIssuePanel

---

## 19. Definition of done

Dat khi:
- buyer co library that su
- entitlement naming nhat quan
- post-checkout access ro rang
- version/update/license hien thi du
- buyer khong con cam giac "mua xong chi nhan 1 link file"
