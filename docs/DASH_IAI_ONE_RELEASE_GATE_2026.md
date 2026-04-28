# DASH_IAI_ONE_RELEASE_GATE_2026
## Canonical release gate for `dash.iai.one`
## Cổng release chuẩn cho `dash.iai.one`
## Version 2.1
## Status: LOCKED
## Scope: `dash.iai.one`
## Date: 2026-04-18

---

## 1. Mục tiêu

File này khóa điều kiện release riêng cho `dash.iai.one`.

`dash.iai.one` là `living control system`.
Vì vậy không được release nếu `runtime`, `auth`, `permissions`, `approvals`, `actions`, `logs` hoặc `workspace truth` còn giả hoặc nửa thật.

Template bằng chứng bắt buộc:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 2. Route truth bắt buộc

### 2.1 Minimum route families

- `/login`
- `/dashboard`
- `/flows`
- `/flows/:flowId`
- `/flows/:flowId/builder`
- `/flows/:flowId/versions`
- `/flows/:flowId/drafts`
- `/flows/:flowId/publish`
- `/runtime/executions`
- `/runtime/executions/:executionId`
- `/logs`
- `/workspace`

### 2.2 Route behavior required

Phải có bằng chứng cho:
- empty states
- protected states
- permission-denied states
- error states
- không trình bày dữ liệu giả như dữ liệu thật

---

## 3. App truth gate

### 3.1 Auth và session truth

Bắt buộc pass:
- login
- session validate
- protected route guard
- logout
- session expiry behavior

### 3.2 Workspace truth

Bắt buộc pass:
- workspace resolution
- workspace isolation
- owner, admin, builder, viewer rendering đúng scope

### 3.3 Flow truth

Bắt buộc pass trong scope release nếu route hiện diện:
- open builder
- save draft
- validate
- preview
- publish
- version hoặc draft retrieval

### 3.4 Runtime truth

Bắt buộc pass:
- executions list
- execution detail
- step logs hoặc inspector nếu trong scope
- không có fake rows, không có fake runtime summary

### 3.5 Audit và sensitive action truth

Nếu scope có action nhạy cảm, phải có audit proof:
- publish
- secret operations
- API key operations
- cancel, retry hoặc approval actions

---

## 4. Approvals và proofs gate

Nếu approvals, artifacts hoặc proofs nằm trong scope, phải có bằng chứng:
- approval wait state
- approval action result
- artifact hoặc proof visibility đúng permission
- không lộ secret trong proof payloads

Nếu release có approvals hoặc proof UI mà không có backend truth -> `BLOCKED`

---

## 5. Indexing và metadata gate

Dash là auth-gated app surface.
Phải chứng minh:
- app routes không index
- protected routes không index
- metadata không drift sang marketing language

---

## 6. Evidence packet gate

Packet release của `dash.iai.one` bắt buộc có:
- route inventory
- API evidence
- auth/session evidence
- UI screenshots
- empty, error, protected state proof
- runtime truth proof
- smoke/manual test packet
- known issues
- rollback note
- owner signoff
- Team 1 gate signoff

Packet không đúng template canonical -> `BLOCKED`

---

## 7. Final status rule

Chỉ được release khi:
- required routes PASS
- auth/session PASS
- workspace truth PASS
- flow truth PASS
- runtime truth PASS
- audit truth PASS nếu áp dụng
- indexing/metadata PASS
- release packet PASS
- rollback note PASS
- Team 1 gate PASS

Thiếu một mục -> `BLOCKED`
