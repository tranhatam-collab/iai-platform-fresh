# 24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026

# NOOS PRODUCT PAGE TEMPLATE AND COPY SYSTEM
## Version 1.0
## Status: LOCKED FOR DEV, CONTENT, DESIGN, GROWTH
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Khoa template chuan cho toan bo product pages de:
- content viet nhanh khong lech giong
- design dung page system nhat quan
- dev dung reusable components thay vi hardcode
- buyer hieu ro gia tri, license, update, va buoc mua tiep

Phu thuoc bat buoc:
- Strategy source: `22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- Product truth source: `28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`

---

## 2. 5 jobs cua moi product page

Moi page phai lam dung 5 viec:
1. Giai thich ro san pham la gi
2. Giai thich ro danh cho ai
3. Lam ro buyer nhan duoc gi
4. Lam ro khac biet voi content free
5. Dan buyer toi mua hoac nang cap phu hop

---

## 3. 12-section template (locked)

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

Khong bo cac block quan trong neu khong co phe duyet chien luoc.

---

## 4. Section requirements (minimum)

### 4.1 Product Hero
Bat buoc co:
- product label (Entry/Core/Advanced/Master/Team)
- official title
- one-line positioning
- price
- license badge
- primary CTA
- trust row (immediate delivery, versioned, library access)

### 4.2 Product Positioning
- 2-4 cau
- dat vao dung ngu canh trong NOOS
- giai thich tai sao khong phai chi la bai viet cong khai

### 4.3 Who It Is For
- 4-8 audience bullets
- khong dung "for everyone"

### 4.4 Problems It Solves
- 3-6 bullets
- problem -> capability sau mua

### 4.5 What Is Included
- danh sach tung phan trong pack
- cam cum tu "and more"

### 4.6 Deliverables and Format
Bat buoc lam ro:
- file types
- library access
- update notices (neu co)

### 4.7 License and Usage
Bat buoc co:
- default license
- what allowed
- what not allowed
- upgrade path

### 4.8 Version and Updates
Bat buoc co:
- current version
- update window
- update type

### 4.9 Why This Matters
- doan ngan, manh
- nang gia tri tu info -> asset

### 4.10 Related Products
- 2-4 cards
- it nhat 1 deepening + 1 ladder upsell

### 4.11 FAQ
Toi thieu:
- receive after purchase?
- physical product?
- sharing policy?
- updates?
- access later?
- upgrade path?

### 4.12 Final CTA
Bat buoc co:
- closing line
- reassurance (delivery/license/library)
- price repeat
- buy button

---

## 5. Copy system (locked)

### 5.1 Product title
- dung dung ten khoa trong file `28`
- khong tu y doi Pack/Bundle/Program

### 5.2 One-line positioning formula
`[structured/premium/team-ready] + [document/bundle/program] + [for who] + [outcome]`

### 5.3 Value layers phai co tren moi page
- Functional value
- Strategic value
- Reusable value

### 5.4 CTA style
Dung:
- Get the Master Pack
- Buy the Foundation Pack
- Get the Architecture Pack

Khong dung:
- fake urgency
- sales noise
- cheap promo language

---

## 6. Template variants

### Entry template
Ap dung: P01, P02, P04  
Nhe, nhanh hieu, friction thap.

### Core template
Ap dung: P03, P05, P06, P07  
Nhan manh bundle logic va applicability.

### Advanced program template
Ap dung: P08, P09, P10  
Can diagram previews va "inside program" structure.

### Master template
Ap dung: P11  
Flagship, show separate-vs-bundle value.

### Team template
Ap dung: P12  
Nhan team-value, seats/license block, org upgrade path.

---

## 7. Dev reusable components

- ProductHero
- ProductMetaRow
- AudienceBlock
- ProblemsSolvedGrid
- IncludedItemsList
- DeliverablesBox
- LicenseBox
- UpdatePolicyBox
- WhyItMattersBlock
- RelatedProductsGrid
- FAQAccordion
- FinalCTABlock
- BundleComparisonBlock
- TeamLicenseComparisonBlock

Khong hardcode moi page bang logic rieng.

---

## 8. Anti-patterns cam

Khong duoc:
- giau gia
- giau license
- giau delivery
- viet nhu blog
- over-hype sales tone
- bien page thanh discount landing

---

## 9. Checklists

### Content
- title/positioning ro
- audience cu the
- included/deliverables ro
- license/updates ro
- related products dung ladder

### Design
- hierarchy ro
- price + license de thay
- CTA manh nhung tinh te

### Dev
- route/content slots day du
- reusable components
- analytics + entitlement hooks
- checkout success handoff

---

## 10. Definition of done

Dat khi:
- 12 products dung cung he template
- content/design/dev dung chung mot schema
- buyer nhin vao hieu day la structured digital products
