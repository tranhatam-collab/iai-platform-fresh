# FLOW_IAI_ONE_RELEASE_GATE_2026
## Canonical release gate for `flow.iai.one`
## Cổng release chuẩn cho `flow.iai.one`
## Version 2.1
## Status: LOCKED
## Scope: `flow.iai.one`
## Date: 2026-04-18

---

## 1. Mục tiêu

File này khóa điều kiện release riêng cho `flow.iai.one`.

`flow.iai.one` chỉ được:
- preview release
- production release
- public announcement
- Team 1 signoff là `READY`

khi release packet và gate này cùng đạt chuẩn.

Template bằng chứng bắt buộc:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 2. Route truth bắt buộc

### 2.1 Public routes bắt buộc

- `/`
- các section cốt lõi mô tả Flow direction
- trust, explanation, onboarding sections trong scope release
- liên kết sang `dash.iai.one`, `docs.iai.one`, `developer.iai.one`

### 2.2 Route behavior bắt buộc

Phải chứng minh:
- route tải đúng
- internal links đúng
- CTA đúng vai trò
- không có marketing drift làm sai vai `living execution surface`
- mobile responsive đủ dùng nếu public route nằm trong scope

---

## 3. Product truth bắt buộc

### 3.1 Role truth

Copy và UI phải giữ đúng:
- `flow.iai.one = living execution surface`
- không mô tả như `workflow tool`
- không mô tả như `low-code integration hub`
- không mô tả như `builder demo shell`

### 3.2 Contract truth

Nội dung không được mâu thuẫn với:
- `api.flow.iai.one`
- `docs/FLOW_ENGINE_MASTER_ARCHITECTURE.md`
- `docs/IAI_FLOW_DASK_TUYET_DOI.md`

---

## 4. SEO và metadata gate

Nếu public route nằm trong scope, phải pass:
- title
- meta description
- canonical
- OG metadata nếu áp dụng
- quy tắc `EN/VI` nếu route thuộc lane song ngữ
- không để `dash` route hoặc app route rơi vào `flow` SEO surface

---

## 5. Evidence packet gate

Packet release của `flow.iai.one` bắt buộc có:
- release identity block
- scope shipped
- route evidence
- UI evidence
- API hoặc contract evidence nếu route có gọi live API
- edge cases
- rollback note
- known issues
- owner signoff
- Team 1 gate signoff

Packet không đúng template canonical -> `BLOCKED`

---

## 6. Smoke và rollback gate

Bắt buộc có:
- route load smoke pass
- không có outbound link hỏng
- không có CTA path hỏng
- rollback note rõ ràng
- rollback owner rõ ràng

---

## 7. Final status rule

Chỉ được `APPROVED_FOR_PREVIEW` hoặc `APPROVED_FOR_PRODUCTION` khi:
- route truth PASS
- product truth PASS
- SEO và metadata PASS
- release evidence packet đầy đủ
- rollback note đầy đủ
- Team 1 signoff PASS

Thiếu một mục -> `BLOCKED`
