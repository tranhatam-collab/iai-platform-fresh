# DEVELOPER_IAI_ONE_RELEASE_GATE_2026
## Canonical release gate for `developer.iai.one`
## Cổng release chuẩn cho `developer.iai.one`
## Version 2.1
## Status: LOCKED
## Scope: `developer.iai.one`
## Date: 2026-04-18

---

## 1. Mục tiêu

File này khóa điều kiện release riêng cho `developer.iai.one`.

Template bằng chứng bắt buộc:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

`developer.iai.one` không được release nếu docs, examples, `curl`, `quickstart` và `auth/session truth` không còn khớp với backend authority hiện tại.

---

## 2. Route truth bắt buộc

### 2.1 Required routes

- `/`
- `/quickstart`
- `/auth`
- `/api/reference`
- `/webhooks`
- `/sdk`
- `/nodes`
- `/changelog`

### 2.2 Route behavior

Mỗi route trong scope phải có:
- load truth
- navigation truth
- search hoặc navigation proof nếu trong scope
- không có link chết
- không có example cũ sai contract

---

## 3. Contract và docs truth

Bắt buộc khớp với runtime truth hiện tại:
- auth/session docs phải aligned với Team 2 contracts
- API reference phải aligned với live contract source of truth
- webhook docs phải aligned với event matrix
- SDK/examples phải aligned với request/response thực tế
- changelog phải được cập nhật nếu release có đổi contract hoặc examples

Nếu example request không chạy được -> `BLOCKED`

---

## 4. Verification gate

Bắt buộc có bằng chứng:
- quickstart walkthrough pass
- `curl` examples pass
- auth/session example pass
- webhook example pass nếu nằm trong scope
- 404 và error cases được mô tả nếu docs route có nhắc đến

---

## 5. SEO và metadata gate

Vì đây là public docs surface, phải pass:
- title
- meta description
- canonical
- robots
- internal link correctness
- quy tắc `EN/VI` nếu có route localized

---

## 6. Evidence packet gate

Packet release của `developer.iai.one` bắt buộc có:
- route inventory
- API evidence
- `curl` evidence
- auth/session evidence
- docs screenshot hoặc route proof
- known issues
- rollback note
- owner signoff
- Team 1 signoff

Packet không đúng template canonical -> `BLOCKED`

---

## 7. Final status rule

Chỉ được release khi:
- required routes PASS
- contract và docs truth PASS
- quickstart và `curl` PASS
- metadata PASS
- release packet PASS
- rollback note PASS
- Team 1 gate PASS

Thiếu một mục -> `BLOCKED`
