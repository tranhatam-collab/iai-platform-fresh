# TEAM1_BLOCKER_DASHBOARD_2026-05-02

- Date: `2026-05-02`
- Owner: Team 1 (Codex)
- Status: `FOUNDER_DECISION_BATCH_REQUEST`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Purpose: gom **toàn bộ founder decision đang mở** vào 1 file để founder reply 1 lần. Mọi item dưới đây đang chặn ≥1 team.

---

## 0. Câu chốt 1 dòng

Hệ đang dừng vì 9 quyết định nằm ở founder. Không team nào tự mở được bằng code. Reply 1 batch là cả hệ chạy.

---

## 1. P0 — chặn synchronized live

### D-001 — payOS business verification push

- Affects: `lane.pay-production-gate`, toàn bộ Team 5 live-sync, Team 4 launch wave, Team D activation.
- State: rerun 05-01 cho `RERUN_COMPLETED_GATE_FAIL`. Shared-runtime contract đã PASS. Còn fail: `checkout_url_non_null`, `payment_link_id_non_null`, `no_214`, `production_gate_green`.
- Root cause hiện tại: merchant/channel/package truth trên payOS dashboard không khớp; có thể do business verification chưa hoàn tất.
- Cần founder làm: gửi 1 email push provider payOS để verify business + xác nhận merchant code/channel/package canonical đang sống.
- Ai đang chờ: Team 2, Team 5, Team 4, Team D, Pay+Email Agent.
- Bỏ qua tạm nếu không reply: cả hệ giữ `LOCK_RETAINED_WITH_REASON` vô thời hạn.

### D-002 — Architecture decision: Next.js canonical hay Node canonical cho `home.iai.one` + `iai.one`

- Affects: D8a → W1A preview deploy.
- Truth source: `docs/reports/team1/NEXT_VS_NODE_DRIFT_2026-05-02.md` §4.
- 4 option (B/C/D + A=pause):
  - (B) Next.js canonical, đem source vào monorepo lane Pages-compatible.
  - (C) Node canonical, cutover từ Next.js Pages sang Node Worker, có preview UX sign-off.
  - (D) Multi-source temporary với expiry hợp đồng.
  - (A) Tiếp tục pause (default đang chạy).
- Recommendation: **B** — risk thấp nhất khi đang `PRODUCTION_PUBLICATION_HOLD`.
- Bỏ qua tạm nếu không reply: D8a giữ pause; W1A không deploy được; tất cả packet repo-side ready không có giá trị live.

---

## 2. P1 — chặn W1B + audit honesty

### D-003 — Docs runtime model cho `docs.iai.one`

- Affects: D8b → W1B preview deploy.
- Truth source: `docs/reports/team1/TEAM1_W1B_D8B_EXECUTION_PACKET_2026-05-02.md` §4.
- 3 option:
  - `DOCS_PAGES_CANONICAL` (recommended).
  - `DOCS_NODE_CANONICAL`.
  - `DOCS_MULTI_SOURCE_TEMPORARY` (chỉ defer, không close).
- Bỏ qua tạm nếu không reply: D8b giữ HELD; W1B không deploy.

### D-004 — Q-OPEN-4 agent identification cho Team A, Team B-CDN, Team B-Flows, Team C

- Overdue: 2 ngày (deadline reassess `2026-04-30`).
- Affects: 4 team không có agent thực hiện công việc → 5 evidence missing CDN, 3 evidence missing Flows, JWT placeholder CIOS, developer.iai.one chưa deploy → tất cả đứng vô thời hạn.
- Recommendation:
  - Team A → 1 agent (developer.iai.one + api.flow.iai.one cluster).
  - Team B-CDN → tách riêng vs Team B-Flows (per boundary v1.0.2).
  - Team B-Flows → tách riêng.
  - Team C → 1 agent (cios.iai.one).
- Bỏ qua tạm nếu không reply: Codex tạm cover bằng `INFERRED_DRAFT` board; KHÔNG được đụng code 4 surface đó.

### D-005 — `invoice.iai.one` BUILD vs DROP

- Affects: trust-state honesty + 4 cross-team report (Team 2/3/5/C) đang cite `invoice.iai.one` là canonical mà nó không tồn tại.
- Truth source: `docs/reports/pay-email-agent/TEAM_PAYEMAIL_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md` `BLK-PAYEMAIL-002` + `DEC-PAYEMAIL-INVOICE-001`.
- Default deadline: `2026-05-05`.
- Recommendation: **DROP** đến khi pay lane stable + có legal lane signoff (invoice = financial document).
- Bỏ qua tạm nếu không reply: Pay+Email queue follow-up task; trust-state vẫn nói dối declared cho đến 05-05.

---

## 3. P1 — chặn life.iai.one + launch wave

### D-006 — `life.iai.one` ownership: T4 hay T5?

- Overdue: 2 ngày (deadline default `2026-04-30`).
- Truth source: `docs/reports/team4/TEAM_TEAM4_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md` `DEC-TEAM4-001`.
- 4 option (a/b/c/d). Recommendation: **(a) Team 4** — life.iai.one nặng content + bilingual + launch wave.
- Bỏ qua tạm nếu không reply: T4+5 giữ `READ-ONLY` mode; không edit 68 file life.iai.one; reports `life.iai.one/reports/` đứt cadence.

### D-007 — Launch wave kick-off authority

- Overdue: 2 ngày.
- Truth source: `DEC-TEAM4-002`.
- 3 option (a/b/c). Recommendation: **(a) Codex phát verdict `LAUNCH_WAVE_1_GO`** sau khi pay flip.
- Bỏ qua tạm nếu không reply: launch wave SLA ngừng đếm; T4+5 chờ.

### D-008 — `tramsaigon.com` receivers + paid offers lock

- Default deadline: `2026-05-15` (chưa overdue).
- Affects: SITE-INTAKE-112 → ACTIVE_NOW transition.
- Truth source: `DEC-PAYEMAIL-001` (4 sub-question: paid offers, owner truth, payment model, VND/USD receiver).
- Recommendation: reuse pattern `tranhatam.com` (individual + ACB VND + PayPal USD) nếu founder dùng chung pháp nhân.
- Bỏ qua tạm nếu không reply: tramsaigon stays `FORM_IN_PROGRESS`; không block lane khác.

---

## 4. P2 — quality of life

### D-009 — Slack/Notion/GitHub connector cho Team 4 broadcast

- Overdue: 2 ngày.
- Truth source: `DEC-TEAM4-004`.
- Recommendation: cấp ngay (Notion parent page + GitHub repo URL + Slack workspace key).
- Bỏ qua tạm nếu không reply: external transport `CONNECTOR_PENDING`; broadcast packet stay paused; cross-team visibility kém nhưng không block code.

---

## 5. Tóm tắt — founder reply tối thiểu

```
D-001 (payOS push):                    [yes / wait]
D-002 (home/iai architecture B/C/D/A): [B / C / D / A=pause]
D-003 (docs runtime):                  [PAGES / NODE / TEMP]
D-004 (4 team agent name):
  - Team A:                            [agent name]
  - Team B-CDN:                        [agent name]
  - Team B-Flows:                      [agent name]
  - Team C:                            [agent name]
D-005 (invoice.iai.one):               [BUILD / DROP / DEFER]
D-006 (life.iai.one owner):            [T4 / T5 / split / external]
D-007 (launch wave authority):         [Codex / PayEmail / founder]
D-008 (tramsaigon receivers):          [reuse / company-new / wait]
D-009 (Slack/Notion connector):        [credentials / defer]
```

8 dòng reply (D-001..D-009 trừ D-004 cần điền tên owner) là đủ để cả hệ chạy lại.

---

## 6. Liên kết

- `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` (plan v2)
- `docs/reports/team1/NEXT_VS_NODE_DRIFT_2026-05-02.md` (D-002)
- `docs/reports/team1/TEAM1_W1B_D8B_EXECUTION_PACKET_2026-05-02.md` (D-003)
- `docs/reports/team1/AUDIT_RUNTIME_SOURCE_DRIFT_MATRIX_2026-05-02.md`
- `docs/reports/team1/AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md`
- `docs/reports/CANONICAL_EXECUTION_LEDGER.md` §6 addendum
- `docs/reports/pay-email-agent/TEAM_PAYEMAIL_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/team4/TEAM_TEAM4_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
