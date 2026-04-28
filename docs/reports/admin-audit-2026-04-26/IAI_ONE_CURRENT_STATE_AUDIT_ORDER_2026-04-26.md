# IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

- Authority: Founder Trần Hà Tâm (lệnh ban hành 2026-04-26)
- Issuing body: Team Admin (Codex / Team 1 Program Root / Control Tower Supervisor)
- Status: **MANDATORY — BINDING ON ALL TEAMS**
- Effective: từ thời điểm commit này
- Deadline: **2026-04-28 23:59 ICT** (48 giờ)
- Scope: toàn bộ team đang dev trong hệ `iai.one`

---

## 0. Bối cảnh

Founder ban hành Current State Audit là **Ưu tiên số 1 của toàn hệ**. Không team nào được:
- Viết thêm logic mới
- Mở thêm subdomain mới
- Claim production-ready, live, ready, migrated mà thiếu proof

**trước khi nộp đủ và đúng bộ báo cáo audit theo lệnh này.**

Quy tắc thay thế: từ ngày `2026-04-26` đến khi audit hoàn tất, mọi PR/commit không thuộc nhóm sau sẽ bị Team Admin block:
- Audit deliverable (4 file/team)
- Bug fix P0 đang hot
- Boundary cleanup theo lệnh Team Admin

---

## 1. Lệnh: 4 file bắt buộc per team

Mỗi team nộp đủ 4 file dưới đây vào `docs/reports/<team-id>/`:

### 1.1 `TEAM_<TEAM_NAME>_CURRENT_STATE_REPORT_2026-04-26.md`

Format bắt buộc cho từng surface team đang quản (xem §2 cho schema 15-mục):

```
## Surface: <surface-key>
- Surface: <name>
- Canonical domain: <fqdn>
- Primary role: <root | portal | product | developer/docs | control plane | internal/operate>
- Current state: <DEV | PREVIEW | DEMO | LIVE | BROKEN | DEPRECATED>
- Production-ready: <YES với proof | NO>
- Demo/simulated: <YES | NO>
- Auth source: <none | shared-iai-auth | own | third-party | unknown>
- Payment source: <none | pay.iai.one | own | third-party | unknown>
- Invoice source: <none | invoice.iai.one | own | third-party | unknown>
- Data source: <D1 | KV | R2 | external API | own | unknown>
- Shared core dependency: <list packages used: @iai/* + version>
- Known issues: <list>
- Security or legal risk: <list>
- Founder decision needed: <list>
- Next 7-day action: <list>
- Next 30-day action: <list>

### Production proof
- repo proof: <commit hash + file path>
- domain proof: <DNS dig output / TLS chain / vhost>
- deploy proof: <wrangler deploy log / build output>
- owner proof: <ack from human owner>
- (nếu thiếu bất kỳ proof nào → Production-ready: NO)
```

### 1.2 `TEAM_<TEAM_NAME>_DOMAIN_AND_SERVICE_MAP_2026-04-26.md`

Bảng 8 mục cho từng domain/subdomain team quản:

| Domain | Legal lane | Payment lane | Auth source | Data source | Shared core in use | Logic riêng ngoài core | Public wording sai? | Preview/simulated bị hiểu nhầm là production? |
|---|---|---|---|---|---|---|---|---|

### 1.3 `TEAM_<TEAM_NAME>_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`

```
## Blocker
- ID: <BLK-001>
- Description: <chi tiết>
- Owner: <team / agent / founder>
- Blocking since: <date>
- Severity: <P0 | P1 | P2>
- Proof of blocker: <log / screenshot / command output>
- Estimated unblock effort: <phút/giờ/ngày>

## Founder decision required
- ID: <DEC-001>
- Question: <câu hỏi cụ thể có YES/NO hoặc multiple choice>
- Context: <bối cảnh ngắn>
- Recommendation from team: <nếu có>
- Default if no decision by <date>: <fallback>
```

### 1.4 `TEAM_<TEAM_NAME>_ONE_PAGE_EXEC_SUMMARY_2026-04-26.md`

Tối đa 1 màn hình (~50 dòng), 7 mục:
1. Team scope (1 dòng)
2. Surface đang quản (bullet)
3. Live thật (số lượng + list)
4. Demo/simulated (số lượng + list)
5. Broken/blocked (số lượng + list)
6. Top 3 blocker
7. Top 3 founder decision needed

---

## 2. Schema 15 mục/surface — không được bỏ mục

| # | Mục | Yêu cầu |
|---|---|---|
| 1 | Surface | Tên ngắn của surface |
| 2 | Canonical domain | FQDN chính thức |
| 3 | Primary role | Đúng 1 trong 6 nhóm §3 |
| 4 | Current state | DEV/PREVIEW/DEMO/LIVE/BROKEN/DEPRECATED |
| 5 | Production-ready | YES (kèm proof) hoặc NO |
| 6 | Demo/simulated | YES/NO |
| 7 | Auth source | enum |
| 8 | Payment source | enum |
| 9 | Invoice source | enum |
| 10 | Data source | enum |
| 11 | Shared core dependency | list packages |
| 12 | Known issues | list |
| 13 | Security or legal risk | list |
| 14 | Founder decision needed | list |
| 15 | Next 7-day action + Next 30-day action | list |

**Cấm**: "đang làm", "gần xong", "sắp live", "tạm ổn" — phải replace bằng state cụ thể + proof.

---

## 3. 6 nhóm phân loại surface

Mỗi surface phải thuộc đúng 1 nhóm:

1. **root** — entry point hệ (iai.one, home.iai.one)
2. **portal** — surface tổng hợp/login/intake
3. **product** — surface tạo doanh thu (flow, app, dash, noos)
4. **developer/docs** — developer.iai.one, docs.iai.one, api.*
5. **control plane** — pay, invoice, mail, cdn, flows
6. **internal/operate** — cios, admin tools, dashboard nội bộ

Surface chồng vai (vd vừa product vừa control plane) → BÁO ngay vào §13 founder decision needed.

---

## 4. Mapping 12 team → agent → domain

| Team | Owner agent | Surface dự kiến | Audit deadline |
|---|---|---|---|
| Team 1 (Program Root) | Codex | governance, control tower | 2026-04-28 23:59 |
| Team 2 (Runtime Platform) | Codex | dash.iai.one, shared runtime | 2026-04-28 23:59 |
| Team 3 (NOOS Commerce) | Codex | noos.iai.one | 2026-04-28 23:59 |
| Team 4 (Growth Ops) | T4+5 agent | growth/launch ops | 2026-04-28 23:59 |
| Team 5 (Web KPI) | T4+5 agent | web.iai.one | 2026-04-28 23:59 |
| Team A (Developer) | TBD (Q-OPEN-1) | developer.iai.one, api.flow.iai.one | 2026-04-28 23:59 |
| Team B (CDN/Flows) | TBD | cdn.iai.one, flows.iai.one | 2026-04-28 23:59 |
| Team B (Pay infra) | Pay+Email | pay infra portion | 2026-04-28 23:59 |
| Team C (CIOS) | TBD | cios.iai.one | 2026-04-28 23:59 |
| Team D (Payment Activation) | Pay+Email | activation/treasury | 2026-04-28 23:59 |
| Team Email + SMTP | Pay+Email | mail.iai.one | 2026-04-28 23:59 |
| Team Pay | Pay+Email | pay.iai.one | 2026-04-28 23:59 |

**Surface không có owner rõ — escalate ngay**: `iai.one` (root), `home.iai.one`, `app.iai.one`, `flow.iai.one`, `docs.iai.one`, `api.flow.iai.one`, **`invoice.iai.one`** (KHÔNG xuất hiện trong boundary plan v1.0.1 — gap nghiêm trọng).

---

## 5. Quy trình nộp + verify

1. Team viết 4 file → push lên branch `OMCODE/smtp-internal-first-phase1` (current branch) hoặc PR riêng.
2. Notify Team Admin trong commit message hoặc chat.
3. Team Admin đọc 4 file → check 6 tiêu chí pass:
   - [ ] Đủ 4 file
   - [ ] Schema 15 mục/surface đầy đủ
   - [ ] Phân loại 6 nhóm rõ ràng
   - [ ] Production-ready claim đi kèm 4 proof (repo/domain/deploy/owner)
   - [ ] Không có cụm "đang làm/gần xong/sắp live/tạm ổn" thiếu state cụ thể
   - [ ] Blocker có proof + severity + estimate
4. PASS → Team Admin update tracking board status `ĐẠT CHUẨN`.
5. FAIL → Team Admin trả lại với note `CẦN SỬA: <reason>`.

---

## 6. Cảnh báo + cấm

### Cấm với mọi team
- Mở subdomain mới
- Push logic mới ngoài bug fix P0
- Claim live/migrated/ready khi thiếu proof

### Cấm với Team Admin (Codex)
1. Không tự sửa role của domain
2. Không tự đổi legal lane
3. Không tự đổi payment lane
4. Không tự kết luận production-ready khi thiếu proof
5. Không gom báo cáo chung chung
6. Không bỏ qua team nộp thiếu
7. Không cho phép team mở logic mới trước khi audit hoàn tất

### Hệ quả khi vi phạm
- Team Admin sẽ revert commit vi phạm và escalate trực tiếp founder.

---

## 7. Master file deliverable cuối cùng

Sau khi nhận đủ báo cáo, Team Admin nộp:
- `docs/reports/admin-audit-2026-04-26/IAI_ONE_CURRENT_STATE_MASTER_AUDIT_2026-04-26.md` — 7 bảng + 10 câu trả lời
- `docs/reports/admin-audit-2026-04-26/IAI_ONE_FOUNDER_EXEC_SUMMARY_2026-04-26.md` — 1 trang tóm tắt + 3 quyết định cần ký

---

## 8. Acknowledgement

Khi mỗi team đọc lệnh này, ack bằng commit message:
```
ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26
```
Hoặc tạo file `docs/reports/<team-id>/AUDIT_ORDER_ACK_2026-04-26.md` với 1 dòng.

---

## 9. Liên hệ Team Admin

- Channel: commit message + file trong `docs/reports/admin-audit-2026-04-26/`
- Escalation founder: qua Team Admin (không bypass)
- Codex (Team Admin) standby 24/7 cho 48 giờ tới — tự verify ngay khi báo cáo nộp về.
