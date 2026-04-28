# 29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026

# NOOS UPSELL, CROSS-SELL, AND PRODUCT LADDER SYSTEM
## Version 1.0
## Status: LOCKED FOR PRODUCT, GROWTH, CONTENT, DESIGN, DEV
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Khoa phau san pham de:
- tang AOV ma khong pha trust
- giu buyer journey ro rang
- dong bo voi pricing/license truth
- tranh upsell noise

Phu thuoc bat buoc:
- `22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`

---

## 2. Ladder architecture (locked)

1. Free trust surface
2. Entry products (P01/P02/P04)
3. Core bundles (P03/P05/P06/P07)
4. Advanced programs (P08/P09/P10)
5. Master pack (P11)
6. Team bundle (P12)
7. Organization/Strategic license

---

## 3. Official cross-sell map

- P01 -> P02
- P02 -> P03
- P03 -> P11
- P04 -> P11
- P05 -> P06
- P06 -> P11
- P07 -> P08
- P08 -> P11
- P09 -> P11
- P10 -> P11
- P11 -> P12
- P12 -> Organization license inquiry

No random recommendations outside this map in V1.

---

## 4. Placement rules by surface

### Product detail page
- 1 "next best step" card
- 1 "higher-value bundle" card
- 1 thematic sibling card

### Checkout success
- show one mapped upsell only
- no multi-offer spam

### Library home
- show role-based next recommendation
- hide already-owned products

---

## 5. Recommendation logic minimum

Inputs:
- purchased_products
- license_type
- last_purchase_date
- role_tag (if available)

Outputs:
- next_product_primary
- next_product_secondary
- upgrade_license_offer (optional)

---

## 6. Upgrade windows and messaging

Use locked windows from file `25`:
- Entry -> Core: 14 days
- Core -> Master: 21 days
- Master -> Team: 30 days

Messaging style:
- "Upgrade with credit"
- "Applied value from your previous purchase"

No fear-based urgency.

---

## 7. Catalog views for conversion

### View by depth
- Entry / Core / Advanced / Master / Team

### View by theme
- Foundation / Architecture / Governance / Vietnam / Grid / Bios / Orbit / Trust

### View by buyer type
- Individual / Builder / Team / Institution

---

## 8. Content system for upsell copy

Each upsell card must include:
- clear title
- one-line relevance
- why this is next
- price + license snapshot
- CTA

Avoid generic phrases like "you may also like".

---

## 9. Growth guardrails

Allowed:
- authority-led positioning
- role-based landing pages
- structured comparison blocks

Not allowed:
- fake scarcity
- endless coupons
- aggressive popups
- discount-first messaging

---

## 10. Analytics events (minimum)

- `product_viewed`
- `product_cta_clicked`
- `upsell_card_viewed`
- `upsell_card_clicked`
- `checkout_completed`
- `upgrade_credit_applied`
- `library_recommendation_clicked`

Track by `product_code`, `tier`, and `source_surface`.

---

## 11. Dev integration checklist

- render related products from locked map
- hide owned products in library recommendations
- support upgrade-credit badge display
- show team/org inquiry only for eligible paths
- keep recommendation rules config-driven

---

## 12. Definition of done

Done when:
- every product page has mapped cross-sell outputs
- success page and library recommendations align with ladder
- upgrade-credit prompts are visible inside valid windows
- AOV can grow without breaking trust tone

