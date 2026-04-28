# 41_NOOS_BILINGUAL_CONTENT_QA_LOG_2026

# NOOS Bilingual Content QA Log
## Version 1.0
## Status: ACTIVE QA LOG
## Domain: NOOS.iai.one
## Owner: Team 3
## Date: 2026-04-17

---

## 1. Mục tiêu

Theo dõi route-by-route EN/VI parity cho NOOS public commerce surfaces và buyer surfaces.

---

## 2. QA rules

- English là default public surface.
- Vietnamese copy phải có dấu đầy đủ.
- canonical / hreflang / x-default phải đúng.
- không close route nào nếu Team 2 locale contract chưa đúng.
- `PASS_WITH_NOTES` chỉ được dùng khi route đã pass trên fixture + mock-backed stack, nhưng vẫn còn dependency runtime Team 2 cần giữ ổn định cho live handoff.

---

## 3. Route QA matrix

| Route group | EN copy | VI copy | Canonical/hreflang | Runtime dependency | Owner | Status |
|---|---|---|---|---|---|---|
| `/products` | PASS | PASS | PASS | none | Team 3 | PASS |
| `/documents` | PASS | PASS | PASS | none | Team 3 | PASS |
| `/programs` | PASS | PASS | PASS | none | Team 3 | PASS |
| `/licenses` | PASS | PASS | PASS | none | Team 3 | PASS |
| Priority product pages P01/P02/P03/P04/P05/P07/P11 | PASS | PASS | PASS | none | Team 3 | PASS |
| Remaining product pages P06/P08/P09/P10/P12 | PASS | PASS | PASS | none | Team 3 | PASS |
| `/checkout-success` | PASS | PASS | PASS | Team 2 locale return path | Team 3 | PASS_WITH_NOTES |
| `/library` | PASS | PASS | PASS | Team 2 entitlement + locale | Team 3 | PASS_WITH_NOTES |
| `/library/product/[slug]` | PASS | PASS | PASS | Team 2 entitlement + product status | Team 3 | PASS_WITH_NOTES |
| `/library/updates` | PASS | PASS | PASS | Team 2 version/update data | Team 3 | PASS_WITH_NOTES |
| `/library/licenses` | PASS | PASS | PASS | Team 2 entitlement + license state | Team 3 | PASS_WITH_NOTES |
| `/library/account` | PASS | PASS | PASS | Team 2 buyer/account identity | Team 3 | PASS_WITH_NOTES |

---

## 4. Verification checklist

Mỗi route chỉ được move sang `PASS` khi:
- copy EN rõ, đúng product truth
- copy VI có dấu đầy đủ
- locale switch không gây redirect sai
- canonical/hreflang/x-default đúng
- metadata title/description đúng locale

---

## 5. Current blockers

- Team 2 phải giữ live locale contract và success/library return path đúng với shape đã verify trên fixture + mock stack.
- Team 1 lane pass vẫn phụ thuộc mission-map compatibility check và daily report bundle ngày.

---

## 6. Close rule

Log này được xem là xanh cho P0/P1 public route evidence khi:
- tất cả product pages P01-P12 chuyển sang `PASS`
- buyer routes giữ `PASS_WITH_NOTES` cho tới khi Team 2 live handoff ổn định
