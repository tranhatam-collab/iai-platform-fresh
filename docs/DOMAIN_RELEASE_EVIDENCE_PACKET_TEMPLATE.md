# DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE
## Canonical release evidence template for `flow.iai.one`, `developer.iai.one`, `dash.iai.one`, and `api.flow.iai.one`
## Mẫu packet bằng chứng release chuẩn cho `flow.iai.one`, `developer.iai.one`, `dash.iai.one`, và `api.flow.iai.one`
## Version 2.1
## Status: LOCKED TEMPLATE FOR ALL TEAMS
## Scope: release evidence standard for core `*.iai.one` domains
## Date: 2026-04-18

---

## 1. Mục tiêu

Đây là mẫu chuẩn bắt buộc cho mọi release packet trước khi một domain hoặc surface được phép:
- preview release
- production release
- public announcement
- internal signoff là `READY`

Mục tiêu của file:
- chặn release dựa trên cảm giác
- buộc mọi team nộp bằng chứng theo cùng một chuẩn
- buộc `UI`, `API`, `auth`, `runtime`, `docs`, `SEO` và `rollback` phải có proof
- giúp Team 1 giữ gate nhất quán giữa các domain

Không domain nào được coi là:
- ready
- verified
- production-worthy
- safe to announce

nếu chưa có release evidence packet theo template này.

---

## 2. Hard rules

### 2.1 No packet, no release

Không có packet này thì:
- không preview release
- không production release
- không public CTA
- không marketing launch
- không claim `done`

### 2.2 One packet per domain release

Mỗi release của:
- `flow.iai.one`
- `developer.iai.one`
- `dash.iai.one`
- `api.flow.iai.one`

phải có packet riêng.

### 2.3 Evidence must be current

Không dùng:
- ảnh cũ
- `curl` cũ
- API response cũ
- staging screenshot cũ
- test packet từ release trước

### 2.4 Evidence must map to truth

Mọi bằng chứng phải map được tới:
- route thật
- domain thật
- environment thật
- API thật
- build hoặc revision thật

### 2.5 Team 1 is final gate

Packet chỉ có hiệu lực release khi:
- owner team signoff
- Team 1 review pass
- domain release gate pass

---

## 3. Packet identity block

Điền đầy đủ:
- Release ID
- Domain
- Environment
- Version / Tag
- Branch
- Commit SHA
- Build ID
- Date
- Release owner
- Review owner
- Team
- Related release gate file

### Domain selection

Chọn một:
- `flow.iai.one`
- `developer.iai.one`
- `dash.iai.one`
- `api.flow.iai.one`

### Environment selection

Chọn một:
- `preview`
- `production`

---

## 4. Executive summary

### 4.1 Release purpose

Mô tả ngắn:
- release này để làm gì
- thay đổi chính là gì
- vì sao cần release lúc này

### 4.2 Scope

Nêu rõ:
- route nào trong scope
- route nào ngoài scope
- API nào trong scope
- domain nào bị ảnh hưởng gián tiếp

### 4.3 Change class

Chọn một hoặc nhiều:
- `auth/session`
- `routing`
- `UI surface`
- `flow lifecycle`
- `builder`
- `runtime`
- `logs/inspector`
- `node catalog`
- `templates`
- `developer docs`
- `billing`
- `SEO`
- `infra/bindings`
- `deploy pipeline`
- `security hardening`

### 4.4 Risk class

Chọn một:
- `low`
- `medium`
- `high`
- `critical`

Và ghi lý do.

---

## 5. Route evidence

### 5.1 Route inventory

Liệt kê toàn bộ route trong scope.

Mẫu bảng:

| Route | Expected behavior | Auth required | Status | Evidence attached |
|---|---|---:|---|---|
| `/dashboard` | loads dashboard with real data | yes | pass/fail | yes/no |
| `/login` | login form works | no | pass/fail | yes/no |

### 5.2 Route categories

Đánh dấu từng route:
- `new`
- `changed`
- `redirected`
- `deprecated`
- `unchanged but re-verified`

### 5.3 Route proof required

Mỗi route phải có tối thiểu:
- screenshot hoặc screen recording
- request/response proof nếu có API call
- auth behavior proof nếu protected
- empty state proof nếu áp dụng
- error state proof nếu áp dụng

---

## 6. API evidence

### 6.1 API inventory

Liệt kê API trong scope.

Mẫu bảng:

| Endpoint | Method | Environment | Expected result | Auth | Status | Evidence |
|---|---|---|---|---:|---|---|
| `/api/auth/session` | GET | production | 200 or 401 correctly | yes | pass/fail | curl attached |

### 6.2 Required proof

Mỗi endpoint trong scope phải có:
- `curl request`
- response payload
- error case nếu có
- auth failure case nếu protected
- workspace isolation case nếu áp dụng

### 6.3 Example `curl` evidence format

```bash
curl -i https://api.flow.iai.one/api/auth/session
```

Ghi lại:
- HTTP status
- key response fields
- note nếu behavior đúng theo spec

### 6.4 Workspace isolation proof

Bắt buộc với APIs liên quan:
- flows
- executions
- drafts
- versions
- templates
- workspace surfaces

Phải chứng minh:
- request đúng workspace thấy dữ liệu đúng
- request sai workspace bị chặn đúng

---

## 7. Auth và session evidence

Phải xác nhận:
- login set session thành công
- session validate thành công
- protected route guard hoạt động
- logout xóa session đúng
- expired session behavior đúng
- frontend origin đúng
- `credentials: "include"` hoạt động
- cookie policy đúng

---

## 8. UI evidence

### Flow / Developer / Dash

Tùy domain, nhưng tối thiểu phải có ảnh hoặc video cho:
- homepage hoặc entry route
- route chính trong scope
- empty state
- error state
- protected state nếu có
- mobile sample nếu route public

### `api.flow.iai.one`

Không cần UI screenshots, nhưng bắt buộc có:
- health response
- auth response
- execution response
- logs hoặc steps response nếu trong scope

Hard rule:
- không được dùng dữ liệu giả để làm runtime trông “đang sống”

---

## 9. Runtime truth evidence

Áp dụng cho:
- `dash.iai.one`
- `api.flow.iai.one`
- `flow.iai.one` nếu có runtime preview dùng dữ liệu thật

Phải chứng minh:
- execution được tạo thật
- execution detail đọc được
- step logs đọc được nếu trong scope
- preview và production nhìn ra khác biệt
- không có fake rows hoặc fake runtime summary

---

## 10. Builder evidence

Áp dụng nếu builder nằm trong scope.

Phải có bằng chứng cho:
- load builder state
- save builder state
- autosave draft nếu có
- validate flow
- preview flow
- publish flow
- version creation hoặc retrieval
- draft restore nếu có

Nếu `lock/collaboration` nằm trong scope, phải có thêm:
- active lock shown correctly
- read-only mode shown correctly
- renew works
- release works

---

## 11. Docs evidence

Áp dụng cho:
- `flow.iai.one` docs sections
- `developer.iai.one`

Phải chứng minh:
- route tồn tại
- content khớp backend truth
- examples còn current
- links hoạt động
- không có stale endpoint reference
- changelog được cập nhật nếu relevant

Nếu `quickstart` nằm trong scope:
- steps phải chạy được
- copy/paste commands phải đúng

---

## 12. SEO và metadata evidence

Áp dụng cho public routes.

Phải kiểm tra:
- title
- meta description
- canonical
- robots
- OG tags nếu áp dụng
- structured data nếu áp dụng
- internal links đúng

Riêng với `dash.iai.one` và `api.flow.iai.one`:
- app routes không được index
- API không được index

---

## 13. Infrastructure evidence

Phải xác nhận:
- đúng domain
- đúng Pages/Worker project
- đúng preview hoặc production target
- đúng bindings
- đúng `D1 / KV / R2 / DO / Queue environment`

### Secret proof

Không ghi secret value.
Chỉ xác nhận:
- secret hiện diện
- secret đúng environment
- secret đúng owner
- không lộ trên frontend

---

## 14. Test packet

### 14.1 Smoke tests

Liệt kê:
- tên test
- environment
- kết quả
- evidence link

### 14.2 Manual test packet

Liệt kê các case đã test tay:
- auth
- route navigation
- API call
- preview
- publish
- run
- logs
- billing nếu có

### 14.3 Automated test packet

Nếu có:
- unit
- integration
- e2e
- contract tests

---

## 15. Security và permission evidence

Phải xác nhận:
- owner, admin, builder, viewer behavior đúng scope
- restricted action bị chặn đúng
- không có secret leakage trong frontend, screenshots, logs, docs
- audit event được tạo nếu scope có action nhạy cảm

---

## 16. Billing và entitlement evidence

Áp dụng nếu scope có billing hoặc commercial features.

Phải có:
- current plan visible
- usage visible
- quota checks work
- premium feature gating works
- usage ledger updated
- entitlement check applied
- UI và backend state nhất quán

---

## 17. Known issues block

Phải ghi trung thực:
- issue ID
- severity
- user impact
- workaround
- release được hay không
- target fix timeline

Không được release mà không khai báo known issue nếu issue đã biết.

---

## 18. Rollback note

Packet nào cũng phải có rollback plan.

### Must include

- rollback trigger conditions
- rollback owner
- rollback method
- config hoặc resources bị ảnh hưởng
- data migration risk nếu có
- user-facing message nếu cần

Ví dụ rollback classes:
- revert frontend deploy
- revert worker deploy
- disable feature flag
- hide route
- remove CTA
- restrict access

---

## 19. Signoff block

### Owner signoff

- Domain owner
- Team
- Date
- Signature / approval line

### QA / verifier signoff

- Verifier
- Date
- Signature / approval line

### Team 1 gate signoff

- Team 1 reviewer
- Date
- Result: `pass / conditional pass / fail`

### Founder signoff

Chỉ áp dụng nếu release thuộc founder-locked scope.

---

## 20. Final release decision

Chọn một:
- `APPROVED_FOR_PREVIEW`
- `APPROVED_FOR_PRODUCTION`
- `APPROVED_WITH_CONDITIONS`
- `BLOCKED`

Nếu:
- `conditional` -> ghi rõ điều kiện còn thiếu
- `blocked` -> ghi rõ blocker và team owner của blocker

---

## 21. Annexes

Đính kèm nếu có:
- screenshot bundle
- `curl` outputs
- test logs
- route list
- build metadata
- changelog entry
- release gate reference
- dependency critical path reference
- environment / bindings truth reference

---

## 22. Minimal packet checklist

Release packet tối thiểu chỉ hợp lệ khi có đủ:
- release identity block
- executive summary
- route evidence
- API evidence
- auth/session evidence
- infrastructure evidence
- smoke hoặc manual tests
- known issues
- rollback note
- owner signoff
- Team 1 gate signoff

---

## 23. Câu chốt cho toàn đội

Không còn kiểu:
- “Build xong rồi, chắc release được.”
- “UI ổn rồi, API chắc cũng ổn.”
- “Docs để sau.”
- “Rollback chưa nghĩ tới.”

Từ bây giờ:
- release phải có packet
- packet phải có evidence
- evidence phải current
- Team 1 mới được pass gate cuối
