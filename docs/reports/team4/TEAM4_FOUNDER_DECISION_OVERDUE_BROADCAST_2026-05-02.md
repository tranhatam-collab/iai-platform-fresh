# TEAM4_FOUNDER_DECISION_OVERDUE_BROADCAST_2026-05-02

- Date: `2026-05-02`
- Owner: Team 4 Growth Revenue Operations
- Status: `BROADCAST_PACKAGE_REPO_SIDE_READY`
- External delivery: `CONNECTOR_PENDING` (Slack/Notion/GitHub URL chưa cấp — chính là D-009)
- Purpose: liệt kê các founder decision đã vượt qua deadline `default if no decision`. File này thay thế cadence broadcast khi chưa có connector.

---

## 1. Overdue table

| ID | Question 1 dòng | Default deadline | Hôm nay | Trễ | Recommendation | Status nếu không reply |
|---|---|---|---|---:|---|---|
| `DEC-TEAM2-001` | dash.iai.one legal lane | 2026-04-28 | 2026-05-02 | 4 ngày | "billing-support-only, không xử lý tiền customer-facing" | TBD trong audit |
| `DEC-TEAM3-001` | noos.iai.one legal lane | 2026-04-28 | 2026-05-02 | 4 ngày | "commerce surface, payment qua pay.iai.one" | TBD trong audit |
| `DEC-TEAM4-001` | life.iai.one ownership T4/T5 | 2026-04-30 | 2026-05-02 | 2 ngày | (a) Team 4 | T4+5 giữ READ-ONLY 68 file |
| `DEC-TEAM4-002` | launch wave authority | 2026-04-30 | 2026-05-02 | 2 ngày | (a) Codex phát verdict | T4+5 chờ Codex |
| `DEC-TEAM4-004` | Slack/Notion/GitHub connector | 2026-04-30 | 2026-05-02 | 2 ngày | (a) cấp ngay | broadcast packet stay paused |
| `DEC-TEAM4-005` | T4+5 read-only quyền apps/* | 2026-04-30 | 2026-05-02 | 2 ngày | (a) YES read-only | T4+5 không reference cấu trúc apps/* |
| Q-OPEN-4 (4 team) | định danh agent Team A/B-CDN/B-Flows/C | implicit 2026-04-30 | 2026-05-02 | 2 ngày | tách per boundary v1.0.2 | 4 team không có agent thực hiện |

7 quyết định trễ hạn default; 4 trong số đó (`DEC-TEAM2-001`, `DEC-TEAM3-001`, `DEC-TEAM4-001`, Q-OPEN-4) đang tạo blocker dây chuyền.

---

## 2. Hậu quả dây chuyền

```
Q-OPEN-4 (Team A/B-CDN/B-Flows/C agent)
  → 5 evidence missing CDN
  → 3 evidence missing Flows
  → JWT placeholder CIOS
  → developer.iai.one chưa deploy
  → domain.cdn.iai.one + domain.flows.iai.one + domain.cios.iai.one + domain.developer.iai.one đứng

DEC-TEAM4-001 (life.iai.one owner)
  → 68 file life.iai.one không edit
  → life.iai.one/reports cadence đứt 4 ngày

DEC-TEAM4-002 (launch wave authority)
  → khi pay flip cũng không ai mở launch wave được

DEC-TEAM4-004 (connector)
  → Pay+Email Item 2 (PAYMENT_WEBHOOK_SECRET) Team B Pay Runtime visibility kém
  → broadcast packet không fire được
```

---

## 3. Founder reply tối thiểu

Per file `TEAM1_BLOCKER_DASHBOARD_2026-05-02.md` §5 — chỉ cần 8 dòng reply trong dashboard đó. File này KHÔNG yêu cầu reply riêng; chỉ archive escalation cadence cho audit chain.

---

## 4. Team 4 self-action hôm nay

- 🟢 File này (broadcast escalation) — DONE.
- 🟢 Daily report 05-02 catch-up (file riêng `DAILY_TEAM4_2026-04-29_TO_2026-05-02_CATCHUP.md`).
- 🟡 Launch wave kick-off — bỏ qua, chờ pay flip + DEC-TEAM4-002.
- 🟡 life.iai.one editing — bỏ qua, chờ DEC-TEAM4-001.
- 🟡 Connector broadcast — bỏ qua, chờ DEC-TEAM4-004 credentials.

---

## 5. Liên kết

- `docs/reports/team1/TEAM1_BLOCKER_DASHBOARD_2026-05-02.md`
- `docs/reports/team4/TEAM_TEAM4_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/team2/TEAM_TEAM2_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/team3/TEAM_TEAM3_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/teama/TEAM_TEAMA_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/teamb-cdn/TEAM_TEAMB-CDN_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/teamb-flows/TEAM_TEAMB-FLOWS_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
- `docs/reports/teamc/TEAM_TEAMC_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26.md`
