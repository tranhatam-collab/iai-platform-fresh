# 42_NOOS_BILINGUAL_GROWTH_COPY_MATRIX_2026

# NOOS Bilingual Growth Copy Matrix
## Version 1.1
## Status: ACTIVE COPY GOVERNANCE
## Domain: NOOS.iai.one
## Owner: Team 4
## Date: 2026-04-17

---

## 1. Mục tiêu

Khóa các growth surfaces và campaign surfaces theo EN/VI đúng tone authority, không drift khỏi pricing/license/product truth.

---

## 2. Copy governance rules

- EN surface dùng cho traffic quốc tế.
- VI surface dùng cho traffic Việt Nam/local.
- Không dùng copy không dấu.
- Không mix tone sales rẻ tiền với NOOS authority tone.
- Không đổi price/license/update policy wording nếu chưa qua lock file.

---

## 3. Surface matrix

| Surface | Primary locale | Secondary locale | Copy owner | Depends on | Status |
|---|---|---|---|---|---|
| `/products` discovery blocks | EN | VI | Team 4 + Team 3 review | Team 3 UI surface | PASS |
| role-based landing snippets | EN | VI | Team 4 | Team 3 route readiness | PASS_WITH_NOTES |
| product CTA framing | EN | VI | Team 4 | lock files 24/25/29 | PASS |
| checkout support copy | EN | VI | Team 4 | Team 2 runtime wording | PASS |
| post-purchase next-step prompts | EN | VI | Team 4 | Team 3 success/library handoff | PASS |
| support escalation templates | EN | VI | Team 4 | Team 2 incident states | PASS |
| updates announcement copy | EN | VI | Team 4 | Team 2 version/update events | PASS |

---

## 4. Mandatory checks

Trước khi launch copy:
- đối chiếu price/license với lock files
- đối chiếu locale với Team 2 contract
- đối chiếu CTA với Team 3 route/IA
- đối chiếu tone với Team 1 language governance

Evidence đã có ngày 2026-04-17:
- `pnpm test:noos-web` PASS
- `NOOS_STACK_TEST=1 pnpm test:noos-stack` PASS
- locale-safe checkout-success -> library handoff đã giữ đúng `en/vi`
- route operations và support fallback đã có EN/VI copy đúng tone authority

---

## 5. Close rule

Matrix này chỉ được xem là đạt khi mỗi growth surface launchable đều có row rõ ràng và không còn `WAITING_*` ở các bề mặt P0.

Current close note ngày 2026-04-17:
- P0 growth surfaces đã có proof trong app và test.
- `role-based landing snippets` đang được đóng bằng query-state trên locale routes, chưa mở thêm route landing riêng.
- `updates announcement copy` đã có macro EN/VI trên bề mặt `/operations`; phát hành cuối vẫn chờ event/update feed từ Team 2 để mở rộng tự động hóa.
