# 36_NOOS_TEAM3_UI_QA_AND_RELEASE_CHECKLIST_2026

# NOOS Team 3 UI QA and Release Checklist
## Version 1.0
## Status: ACTIVE FOR TEAM 3 EXECUTION
## Domain: NOOS.iai.one

---

## 1. Muc tieu

Tao mot checklist release de Team 3 khong ship theo cam giac.

Checklist nay la gate truoc khi Team 3 bao Team 1/Team 4 rang commerce IA da san sang.

---

## 2. Mandatory verify commands

Bat buoc chay:
- `pnpm test:noos-web`
- `pnpm test:noos-commerce-contracts`

Khong duoc danh dau ready neu mot trong hai lenh fail.

Verification snapshot da co ngay 2026-04-14:
- `pnpm test:noos-web` -> PASS
- `pnpm test:noos-commerce-contracts` -> PASS

---

## 3. Route QA checklist

| Route | Must prove | Status rule |
| --- | --- | --- |
| `/products` | catalog render dung product truth | pass neu render product list khoa |
| `/documents` | document collection dung IA | pass neu khong drift sang blog/fundraising |
| `/programs` | advanced program collection dung IA | pass neu ladder va positioning dung |
| `/licenses` | price/license/update rules visible | pass neu khong an truth |
| `/product/[slug]` | du 12 sections | pass neu dung template `24` |
| `/library` | purchased state ro | pass neu buyer handoff dung |
| `/library/product/[slug]` | owned product detail ro | pass neu khong leak truth sai |
| `/library/updates` | current/expired/upgraded states ro | pass neu update path dung |
| `/library/licenses` | license surface ro | pass neu khong invent policy moi |
| `/library/account` | buyer account/support entry ro | pass neu khong sai scope |
| `/checkout` | pre-success handoff logic ro | pass neu product mapping on dinh |
| `/checkout-success` | library handoff ro | pass neu CTA/library truth dung |
| `/operations` | Team 4 contract render du | pass neu Team 4 co the nhan baton |

---

## 4. Product template QA checklist

Moi product page bat buoc co:
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

Reject ngay neu:
- thieu gia
- thieu license
- thieu update window
- thieu related products
- thieu final CTA

---

## 5. Boundary compliance checklist

Bat buoc:
- `/docs/investment-programs/` phai redirect ve surface hop le
- route investor/fundraising legacy phai `noindex`
- khong co public page nao tu nhan la investor portal
- khong co fundraising catalog hoac execution fund CTA
- `noos.iai.one` giu dung vai tro docs/product aggregate, khong thanh fundraising portal

Current closure evidence:
- route legacy duoc intercept trong `apps/noos-web/src/render.ts`
- integration proof nam trong `tests/integration/noos-commerce-surface.test.mjs`

## 5A. Shared filter contract rule

Neu Team 3 surface co doc hoac map filter state tu shared Flow/API contract, chi duoc dung dung cac key hien tai:
- `status`
- `severity`
- `overdue_only`
- `workspace_id`

Khong doi ten key, khong doi y nghia, khong tu gop thanh filter dictionary rieng.

---

## 6. Release gate checklist

Team 3 chi duoc bao ready khi tat ca deu xanh:
- `pnpm test:noos-web`
- `pnpm test:noos-commerce-contracts`
- route inventory dung theo file `32`
- boundary compliance pass
- Team 3 related Cloudflare rows khong vi pham release authority gate
- git hygiene khong canh bao sai evidence cho file dang release

Neu chua xanh:
- khong promote release
- khong bao Team 4 mo campaign expansion

---

## 7. Handoff checklist cho Team 4

Team 4 duoc nhan khi Team 3 da giao:
- route list on dinh
- CTA mapping on dinh
- product/detail/library surfaces on dinh
- `/operations` render du launch wave, KPI, support contract
- boundary cleanup da xong va khong con investor/fundraising drift

Team 4 khong duoc sua:
- route names
- price/license/update truth
- product ladder truth

---

## 8. Sign-off block

- Owner: Team 3 Surface Lead
- Review partner: Team 1 release gate
- Downstream handoff: Team 4 Growth/Ops
- Last verified: 2026-04-14
- Decision: READY FOR TEAM 4 HANDOFF WHEN STANDARD RELEASE GATE IS GREEN
