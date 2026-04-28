# IAI_ONE_AUDIT_RELAY_MESSAGES_PAYEMAIL_T45_2026-04-26

- Issuing body: Team Admin (Codex)
- Date: 2026-04-26
- Purpose: 2 message ready-to-paste cho founder relay sang Pay+Email session + T4+5 session
- Goal: 2 agent nhận lệnh audit + nộp 4-file trước deadline 2026-04-28 23:59 ICT

---

## Cách dùng

1. Founder mở session Pay+Email (Claude session khác đang xử lý apps/pay + apps/mail-*)
2. Copy block dưới `## Message 1` → paste vào session đó
3. Founder mở session T4+5 (Claude session đang xử lý web.iai.one + T4/T5 KPI)
4. Copy block `## Message 2` → paste vào session đó
5. Khi 2 agent nộp 4-file (mỗi agent), Codex tự verify + update tracking board

---

## Message 1 — gửi cho Pay+Email agent (Agent 1 per boundary plan)

```
[FOUNDER RELAY — TEAM ADMIN ORDER]

Founder Trần Hà Tâm vừa ban hành Current State Audit Order toàn hệ
iai.one ngày 2026-04-26. Codex (Team 1 supervisor) là Team Admin đầu mối.

Pay+Email scope của bạn (per IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26
v1.0.1) bao gồm các team logical:
- Team B (pay infra portion): apps/pay/ webhook + payment-routing
- Team D (Payment Activation): tranhatam.com, omdalat.com, vetuonglai.com
- Team Email + Team SMTP: mail.iai.one, mailbox/alias mailcow
- Team Pay: pay.iai.one gateway + 17 intake row

Bạn phải nộp 4 file PER TEAM logical (tổng 16 file: 4 team × 4 file)
hoặc 4 file MERGED nếu Pay+Email cover toàn bộ trong cùng session.

Codex recommend: nộp 4 file MERGED dưới prefix TEAM_PAYEMAIL_*
(vì cùng 1 agent ownership), trong docs/reports/pay-email-agent/:
- TEAM_PAYEMAIL_CURRENT_STATE_REPORT_2026-04-26.md
- TEAM_PAYEMAIL_DOMAIN_AND_SERVICE_MAP_2026-04-26.md
- TEAM_PAYEMAIL_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md
- TEAM_PAYEMAIL_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md

Tài liệu binding bạn phải đọc trước khi viết:
- docs/reports/admin-audit-2026-04-26/IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md
  (mệnh lệnh + 6 quy tắc cấm + 6 nhóm phân loại + 4 proof rule)
- docs/reports/admin-audit-2026-04-26/IAI_ONE_AUDIT_TEMPLATE_4_FILE_PER_TEAM_2026-04-26.md
  (template chuẩn để copy-paste fill)

Quy tắc bắt buộc:
1. Schema 15 mục/surface — không bỏ mục
2. Production-ready=YES bắt buộc 4 proof (repo + domain + deploy + owner).
   Pay+Email có lợi thế: pay.iai.one + mail.iai.one là production endpoint
   thật → có khả năng cung cấp dig output + curl /health output làm domain
   proof + deploy proof.
3. Cấm cụm "đang làm/gần xong/sắp live/tạm ổn"
4. Schema 8 mục/domain trong file 2/4 (Domain and Service Map)
5. File 4/4 ≤50 dòng, 7 phần

Đặc biệt phải báo cáo chính xác:
- 17 intake row PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD: bao
  nhiêu row READY_FOR_LIVE thật, bao nhiêu chưa? (per
  PAY_IAI_ONE_AI_OWNER_INTAKE_REVIEW_2026-04-26.md hôm nay claim 0 row
  READY_FOR_LIVE)
- Wave 1 mailbox/alias mailcow: list mailbox đã tạo thật vs theo plan
- Pay gate 8 signal: state hiện tại từng signal
- Webhook outbound (commit b69292a): test PASS có phải production verified
  hay chỉ repo test?
- Bug idCountry (commit 02df6b4): đã merge production hay chỉ ở branch?

Deadline: 2026-04-28 23:59 ICT (48 giờ từ ban hành).

Khi nộp xong, ack bằng commit:
ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

Codex (Team Admin) sẽ verify ngay khi commit về.

Câu hỏi gì gửi qua founder relay sang Codex.
```

---

## Message 2 — gửi cho T4+5 agent

```
[FOUNDER RELAY — TEAM ADMIN ORDER]

Founder Trần Hà Tâm vừa ban hành Current State Audit Order toàn hệ
iai.one ngày 2026-04-26. Codex (Team 1 supervisor) là Team Admin đầu mối.

T4+5 scope của bạn (per IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26
v1.0.1) bao gồm:
- Team 4: Growth Revenue Operations
- Team 5: Web KPI / Live Sync (web.iai.one)
- (theo Codex Q3 recommend, sẽ thêm app.iai.one + home.iai.one + root.iai.one
   nếu founder confirm — đến giờ chưa LOCKED)

Bạn phải nộp 4 file PER TEAM (Team 4 + Team 5):

Team 4 set (docs/reports/team4/):
- TEAM_TEAM4_CURRENT_STATE_REPORT_2026-04-26.md
- TEAM_TEAM4_DOMAIN_AND_SERVICE_MAP_2026-04-26.md
- TEAM_TEAM4_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md
- TEAM_TEAM4_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md

Team 5 set (docs/reports/team5/):
- TEAM_TEAM5_CURRENT_STATE_REPORT_2026-04-26.md
- TEAM_TEAM5_DOMAIN_AND_SERVICE_MAP_2026-04-26.md
- TEAM_TEAM5_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md
- TEAM_TEAM5_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md

Tổng 8 file (4 file × 2 team).

Tài liệu binding phải đọc:
- docs/reports/admin-audit-2026-04-26/IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26.md
- docs/reports/admin-audit-2026-04-26/IAI_ONE_AUDIT_TEMPLATE_4_FILE_PER_TEAM_2026-04-26.md

Tham khảo cách Codex tự audit T1+T2+T3 hôm nay (đã commit a17158c):
- docs/reports/team1/TEAM_TEAM1_*_2026-04-26.md (4 file)
- docs/reports/team2/TEAM_TEAM2_*_2026-04-26.md (4 file)
- docs/reports/team3/TEAM_TEAM3_*_2026-04-26.md (4 file)

Quy tắc bắt buộc:
1. Schema 15 mục/surface
2. Production-ready=YES bắt buộc 4 proof
3. Cấm cụm "đang làm/gần xong/sắp live/tạm ổn"
4. Schema 8 mục/domain
5. ≤50 dòng cho file 4/4

Đặc biệt phải báo cáo chính xác:
- web.iai.one: KPI loop là production hay preview? Coverage 100% là measure
  thật hay measure mock data? (per WEB_KPI_BUNDLE_2026-04-26.md hôm nay
  claim coverage 100%)
- Team 5 readiness state: NOT_READY_FOR_SYNCHRONIZED_LIVE còn block bởi
  pay gate — confirm KHÔNG có blocker nào trong scope T5 (BLK_T5_*)
- Team 4 packet READY_FOR_TEAM1_REVIEW: scope cụ thể là gì? Có monitor-only
  ngoài pay flip không?
- DAILY/REPORT 04-24 + 04-25 đang missing — backfill hay cố tình skip?

Deadline: 2026-04-28 23:59 ICT.

Khi nộp xong, ack bằng commit:
ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

Codex (Team Admin) verify ngay.

Câu hỏi qua founder relay.
```

---

## Verification checklist sau khi 2 message gửi đi

Khi 2 agent commit 4-file của họ, Codex sẽ check:

| Tiêu chí | Pay+Email | T4+5 |
|---|---|---|
| Đủ file (4 hay 16 hay 8) | _pending_ | _pending_ |
| Schema 15 mục/surface | _pending_ | _pending_ |
| 4 proof cho mọi LIVE claim | _pending_ | _pending_ |
| Không có cụm cấm | _pending_ | _pending_ |
| Schema 8 mục/domain | _pending_ | _pending_ |
| ≤50 dòng file 4/4 | _pending_ | _pending_ |
| Ack commit | _pending_ | _pending_ |

PASS → cập nhật tracking board status `ĐẠT_CHUẨN`.
FAIL → commit `admin-audit: trả lại <team> với note CẦN_SỬA: <reason>` + comment cụ thể trong file `docs/reports/admin-audit-2026-04-26/IAI_ONE_AUDIT_REVIEW_NOTES_2026-04-26.md`.

---

## Note cho founder

Sau khi 2 agent nộp xong (ước tính 12-24 giờ từ relay), Codex sẽ:
1. Update tracking board status
2. Promote `IAI_ONE_CURRENT_STATE_MASTER_AUDIT_2026-04-26.md` từ v1 PARTIAL → v1 FINAL (với 7 bảng đầy đủ data 6/12 team)
3. Update Founder Exec Summary với data thật từ Pay+Email + T4+5
4. Refresh zip trên Desktop với version mới

Còn lại 4 team KHÔNG_OWNER (Team A, B-CDN, B-Flows, C) chỉ unblock được khi founder reply Q-OPEN-4 hoặc Codex được approve wear-2-hats per DEC-MASTER-006.
