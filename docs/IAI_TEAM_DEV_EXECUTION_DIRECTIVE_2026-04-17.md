# IAI_TEAM_DEV_EXECUTION_DIRECTIVE_2026-04-17
## Current execution directive for Team 1 / Team 2 / Team 3 / Team 4 / Team 5
## Version 1.1
## Status: ACTIVE
## Scope: *.iai.one + NOOS execution lanes
## Date: 2026-04-17
## Updated: 2026-04-18

---

## 0. Purpose

File này khóa lại lệnh vận hành hiện tại cho các team dev dựa trên repo truth, audit truth, và verify truth đang có trong workspace.

Mục tiêu:
- không để team nào phát lệnh lệch với code reality
- không để Team 1 tuyên bố GO sớm hơn evidence
- không để Team 2/3/4/5 lấn sang lane không thuộc quyền mình
- giữ thứ tự Phase B -> Phase C -> Phase D rõ ràng

---

## 0.1 Root protocol now mandatory for all teams and AI

Tu 2026-04-18, moi team va moi AI/Codex session trong repo nay phai obey:
- `docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md`

Hard rule:
- khong duoc bat dau task moi neu chua tra loi du 9 cau hoi startup trong master protocol
- khong duoc nhay tu `Understand` / `Clarify` thang sang `Build`
- khong duoc claim `done` neu chua co verify + report + next dependency ro
- khong duoc invent workflow rieng theo team
- khong duoc ghi de chat message len locked docs

Ap dung cho:
- Team 1
- Team 2
- Team 3
- Team 4
- Team 5
- AI / Codex / automation dang lam viec trong workspace nay

---

## 0.2 Shared daily operating rule from now

Moi work session cua team hoac AI phai follow:
1. Understand
2. Clarify
3. Implement
4. Self-check
5. Prepare report

Moi report phai co:
- completed
- in progress
- blockers
- changes
- next
- decision needed neu thuc su can

Approved task statuses only:
- Planned
- In Progress
- In Review
- Blocked
- Ready for QA
- Ready for Release
- Released
- Archived

Khong duoc dung:
- gan xong
- almost done
- tam on
- pass tam
- xong roi do

---

## 0.3 IAI-optimized execution mode (V2)

Master protocol van la root rule.
Nhung cach apply trong `*.iai.one` tu bay gio la:

Lock (fast) -> Build (small) -> Verify (real) -> Expand

Y nghia:
- khong over-spec truoc khi build
- khong build gia
- khong build half-UI roi goi la progress
- khong mo nhieu huong cung luc

Hard rule:
- execution-first, nhung van phai co structure
- khong test = chua lam
- khong output = chua verify

---

## 0.4 Task type system from now

Moi task phai thuoc 1 trong 3 loai:

### TYPE 1 - CORE SYSTEM
Vi du:
- Flow engine
- Dash runtime
- Auth
- Billing
- API

Rule:
- ap dung full protocol
- can evidence day du
- can release gate ro

### TYPE 2 - PRODUCT LAYER
Vi du:
- UI Dash
- Flow builder
- Web.iai.one
- Life.iai.one

Rule:
- ap dung light protocol
- quick lock, build that, verify that
- khong viet spec dai neu task da ro

### TYPE 3 - CONTENT / SEO / MEDIA
Vi du:
- bai viet
- SEO
- landing
- copy

Rule:
- ap dung content protocol rieng
- phai dung codex, metadata, route role
- khong keo content lane vao core protocol day du neu khong can

---

## 0.5 Quick lock rule

Moi task chi can lock nhanh 4 diem:
- task la gi
- thuoc he nao
- anh huong gi
- done la gi

Max time cho quick lock:
- 30 phut

---

## 0.6 Report rule V2

Bao cao rut gon bat buoc:
- DONE:
- IN PROGRESS:
- BLOCK:
- NEXT:

Neu task la TYPE 1 va co thay doi contract / release / security:
- them evidence
- them rollback note

---

## 1. Verified truth used for this directive

### 1.1 Repo truth
- `apps/root` tồn tại
- `apps/home` tồn tại
- `apps/app` tồn tại
- `apps/flow` tồn tại
- `apps/docs` tồn tại
- `apps/web` tồn tại
- `apps/dash` tồn tại

### 1.2 Current audit truth
Theo `docs/reports/team1/IAI_SURFACE_UI_SYSTEM_AUDIT_2026-04-17.md`, hiện có 6 public shell ở trạng thái `CONDITIONAL-GO` trong thứ tự audit:
- `iai.one`
- `home.iai.one`
- `app.iai.one`
- `flow.iai.one`
- `docs.iai.one`
- `web.iai.one`

Các surface còn `NO-GO`:
- `nft.iai.one`
- `pay.iai.one`

### 1.3 Fresh verify truth in this session
Trong phiên kiểm tra hiện tại:
- `pnpm test:flow-surface` PASS
- `pnpm test:docs` PASS

Điều này cho phép Team 1 nói rõ:
- `apps/flow` và `apps/docs` đã scaffold xong
- integration test của `flow` và `docs` đang PASS
- audit 6 shell `CONDITIONAL-GO` là phù hợp với repo reality hiện tại

---

## 2. Executive verdict on the draft messages

### 2.1 What is correct
- Team 1 được quyền khóa execution order tiếp theo là `nft.iai.one` rồi `pay.iai.one`
- Team 1 giữ quyền `GO/NO-GO` và rollback authority
- Team 2 phải giữ runtime/auth/billing/locale truth và evidence-first
- Team 3/4/5 phải bám baseline shell mới để không drift boundary

### 2.2 What must be corrected before sending
- Team 1 không nên nói chỉ `apps/docs` xong; phải nói rõ cả `apps/flow` và `apps/docs` đã được scaffold và verify
- Team 2 không sở hữu public copy/IA; Team 2 chỉ sở hữu contract, runtime truth, auth, billing, audit, trace, security
- Team 3 chỉ áp dụng `English-first + Vietnamese có dấu đầy đủ` cho lane NOOS/public locale policy, không được suy rộng thành rule mặc định cho toàn bộ `*.iai.one`
- Team 4 không được xin release lane `nft/pay` trước khi Team 1 reopen gate
- Team 5 không được tách auth/billing/runtime truth khỏi shared platform

---

## 3. Locked phase order from now

### Phase B
Khóa shell baseline:
- `iai.one`
- `home.iai.one`
- `app.iai.one`
- `flow.iai.one`
- `docs.iai.one`
- `web.iai.one`

### Phase C
Chỉ mở sau khi Team 1 xác nhận packet Phase B đầy đủ:
- `nft.iai.one`

### Phase D
Chỉ mở sau khi Team 1 xác nhận Phase C đủ gate:
- `pay.iai.one`

Hard rule:
- không team nào được nhảy thẳng sang `pay` khi `nft` chưa qua gate
- không team nào được gọi `PASS` nếu evidence mới nhất chưa attach

---

## 4. Sendable team directives

### Team 1

Directive to send:

Team 1 xác nhận Phase B đã hoàn tất ở mức shell + audit + verify truth: `apps/flow` và `apps/docs` đã scaffold xong, `pnpm test:flow-surface` và `pnpm test:docs` đều PASS, audit hiện khóa 6 public shell `CONDITIONAL-GO`: `iai/home/app/flow/docs/web`. Thứ tự execution tiếp theo khóa cứng là `nft.iai.one` rồi `pay.iai.one`. Team 1 bắt đầu gate Phase C ngay, và tiếp tục giữ toàn quyền `GO/NO-GO` + rollback theo authority file.

Mandatory actions:
- cập nhật tracking board và decision log theo trạng thái 6 shell `CONDITIONAL-GO`
- attach evidence packet cho `flow/docs` cùng với audit reference trước khi mở gate `nft`
- mở review gate cho `nft` trước, `pay` sau
- buộc mọi team nộp theo `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`
- giữ quyền stop-release nếu thiếu rollback note, env delta, hoặc owner on-call

### Team 2

Directive to send:

Team 2 đồng bộ build theo baseline mới nhưng chỉ trong lane contract/runtime/security. Team 2 phải giữ auth, billing, locale, runtime, audit và trace truth ổn định cho các surface đang mở (`root/home/app/flow/docs/web`), đồng thời chuẩn bị Phase C cho `nft` và Phase D cho `pay` mà không đụng sang public copy hoặc IA. Với NOOS, Team 2 tiếp tục khóa locale contract theo addendum `2026-04-17`: English-first cho route quốc tế, Vietnamese first-class cho route `vi`, không mất locale qua checkout -> success -> library. Mọi thay đổi phải evidence-first trước khi xin Team 1 review.

Mandatory actions:
- giữ shared auth/session/runtime truth cho `root/home/app/flow/docs/web`
- nộp runtime traceable evidence cho mọi packet release
- chuẩn bị lane `nft`: passkey step-up, wallet proof, protected asset proxy, audit log, partner sync proof
- chuẩn bị lane `pay`: shared auth, billing, audit, ledger interfaces, nhưng chưa xin release public shell
- không sửa public copy, CTA, metadata, hoặc IA route-level nếu không có Team 1 + team surface owner request

### Team 3

Directive to send:

Team 3 dùng baseline shell mới (`root/home/app/flow/docs/web`) như boundary reference để build surface mà không drift vai trò domain. Trên lane NOOS, Team 3 tiếp tục áp dụng locale policy đã khóa: English-first cho route public quốc tế, Vietnamese có dấu đầy đủ cho route `vi`, không trộn ngôn ngữ trên cùng hero/title indexable. Team 3 chỉ sở hữu copy, IA, route QA và metadata proof; không được đổi pricing, license, product truth, mission, hay contract runtime.

Mandatory actions:
- triển khai route-level EN/VI evidence cho NOOS theo checklist hiện hành
- nộp metadata proof: canonical, hreflang, x-default, title, description theo locale
- giữ boundary đúng vai khi tham chiếu `root/home/app/flow/docs/web`
- không chạm pricing/license/product truth nếu chưa có source-of-truth update
- mọi packet phải có route list, screenshot proof, locale proof, known issues, rollback note

### Team 4

Directive to send:

Team 4 đồng bộ growth/ops wording theo đúng addendum ngôn ngữ NOOS ngày `2026-04-17` và chuẩn evidence packet traceable. Team 4 chỉ được chuẩn bị readiness cho lane `nft` rồi `pay` theo thứ tự khóa, không được xin mở release trước gate. Mọi đề xuất launch, ops, support, funnel, partner recovery đều phải bám product truth, locale truth và rollback readiness trước khi nộp Team 1.

Mandatory actions:
- cập nhật growth/ops wording theo locale policy đang khóa
- giữ funnel/reporting tách theo locale khi lane là NOOS
- chuẩn bị readiness cho `nft` trước `pay`
- không xin release nếu chưa có vận hành proof + rollback note + dependency state
- không tự sửa product truth, pricing truth, hay contract truth

### Team 5

Directive to send:

Team 5 tiếp tục build `web.iai.one` trên baseline đã pass regression và không được tách auth, billing, runtime truth khỏi shared system. Team 5 phải giữ handoff ngôn ngữ, metadata và route contract đồng bộ với shell baseline mới (`root/home/app/flow/docs/web`) để public routes không lệch EN/VI, canonical hay role boundary. Mọi packet nộp Team 1 phải bám đúng format evidence packet và ghi rõ contract dependency lên Team 2.

Mandatory actions:
- giữ `web` contract xanh với shared auth/billing/API truth
- không duplicate vai của `home.iai.one` hoặc `app.iai.one`
- đồng bộ metadata, locale handoff, CTA và boundary wording với baseline mới
- packet phải có route proof, metadata proof, dependency note, rollback note
- chỉ xin gate khi Team 2 contract evidence đã attach

---

## 5. Shared evidence rule for all teams

Không team nào được dùng chat message ngắn làm bằng chứng hoàn tất.

Mọi packet gửi Team 1 phải có tối thiểu:
- owner
- scope
- changed routes
- changed APIs/contracts
- exact files changed
- test commands
- pass/fail result
- screenshot hoặc curl proof
- known issues
- rollback note
- dependency touched
- release ask: preview / prod candidate / hotfix

Format bắt buộc:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

---

## 6. Final rule

Lệnh gửi cho team phải trung thực với code reality.

Không được nói:
- `PASS` nếu evidence mới chưa attach
- `Phase complete` nếu gate chưa đủ
- `Team X own everything` khi role đã bị khóa hẹp hơn

Đúng role trước.
Đúng evidence sau.
Deploy chỉ đến cuối cùng.

AI/Codex rule inside this repo:
- read first
- state assumptions
- no false completion
- no silent rewrite
- no hidden drift
