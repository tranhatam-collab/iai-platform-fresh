# TEAM2_LOCALE_AND_LANGUAGE_CONTRACT_2026
## Team 2 Locale and Language Contract
## Version 1.0
## Status: LOCKED FOR TEAM 2 / TEAM 3 / TEAM 4 / TEAM 5
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## 1. Scope

File nay khoa contract locale cho cac runtime/public-facing services ma Team 2 cung cap.

No bo sung va thuc thi:
- `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- `docs/noos/41_NOOS_TEAM2_LOCALE_CHECKOUT_SESSION_ORDER_CONTRACT_2026.md`

---

## 2. Canonical fields

Moi contract public-facing nen ho tro:
- `locale`
- `default_locale`
- `supported_locales`
- `fallback_locale`

Neu la checkout/success/library flow, nen co them:
- `success_return_path`
- `library_return_path`

---

## 3. Current locked values

- `default_locale = en`
- `supported_locales = [en, vi]`
- `fallback_locale = en`

Rules:
- `en` la default public/international locale
- `vi` la Vietnamese first-class locale
- Team 2 khong duoc tra locale field mau thuan voi route/canonical truth

---

## 4. Fallback behavior

Trinh tu fallback:
1. requested locale
2. supported locale match
3. `fallback_locale`

Khong duoc:
- tra 404 chi vi locale khong support
- bo trong locale context trong order/success/library responses

---

## 5. Checkout / success / library rules

### Checkout
- request locale phai duoc persist vao checkout context neu route la public commerce surface

### Success
- thanh cong phai return ve locale dung voi route bat dau neu locale do support
- neu locale khong support, fallback ve `en`

### Library
- library va buyer routes phai nhan duoc locale context de Team 3 render dung EN/VI

---

## 6. Consumer notes

### Team 3
- dung contract nay de render locale dung cho checkout-success, library, updates

### Team 4
- dung contract nay de dam bao growth comms va launch surfaces khong drift locale

### Team 5
- dung contract nay de route onboarding/success handoff ve dung shared surfaces

---

## 7. Language quality rule

Team 2 co the khong own marketing/content copy,
nhung Team 2 phai giu:
- locale data dung
- fallback dung
- khong tra metadata mau thuan language gate

Neu khong, Team 3/4/5 se khong the pass release gate.

---

## 8. Addendum ngon ngu checkpoint 2026-04-17

Team 2 adopt addendum language gate tu NOOS lock:
- tham chieu: `docs/noos/34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md`
- checkpoint: section directive tu `2026-04-17`

Quy tac bo sung bat buoc cho Team 2 runtime evidence packet:
- phai co language checklist item cho locale behavior `en/vi`
- phai xac nhan fallback van giu `en` khi locale input invalid/missing
- phai xac nhan success/library return path khong drift khoi locale goc
- phai ghi ro neu surface nao chua co lane song ngu that (khong duoc "assume pass")

---

## 9. Gate discipline

Team 2 khong xin Team 1 review neu:
- chua co packet evidence traceable cho locale contract
- chua co ket qua test cho lane locale lien quan
- chua cap nhat changelog neu co contract delta
