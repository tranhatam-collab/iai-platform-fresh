# TEAM_TEAM2_BLOCKERS_AND_DECISIONS_REQUIRED_2026-04-26

- Team: Team 2
- Date: 2026-04-26

---

## Blocker

### BLK-TEAM2-001
- Description: Canonical `TEAM2_PAY_GATE_API_KEY` chưa export → probe runtime FAIL 8/8 signal → pay gate không flip
- Owner: Founder + Provider Owner
- Blocking since: 2026-04-19 (PROD blocker đầu tiên)
- Severity: P0
- Proof of blocker: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-26.md` (HTTP 401 API_KEY_REQUIRED)
- Estimated unblock effort: founder push provider 1 email + provider export key (15 phút khi provider trả lời)
- Affects: pay.iai.one production gate, Team 5 sync live, Team D activation

### BLK-TEAM2-002
- Description: Shared runtime contract `/health` thiếu `shared_read_model` + `shared_upstream_runtime` field
- Owner: Team Platform Runtime (chưa định danh) hoặc Pay+Email (nếu Pay+Email cover platform contract evolution)
- Blocking since: 2026-04-22 (lần đầu probe shared runtime)
- Severity: P0
- Proof of blocker: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-26.md` (`legacy_or_unknown`)
- Estimated unblock effort: TBD — cần Team Platform Runtime owner xác nhận
- Affects: 5 shared signal trong gate verdict

### BLK-TEAM2-003
- Description: dash.iai.one chưa có production deploy proof
- Owner: Team 2 (Codex)
- Blocking since: 2026-04-26 (audit phát hiện gap)
- Severity: P1
- Proof of blocker: chưa có wrangler deploy log + domain proof trong audit
- Estimated unblock effort: ~30 phút (chạy `dig dash.iai.one` + capture vhost)
- Affects: dash.iai.one production-ready claim

---

## Founder decision required

### DEC-TEAM2-001
- Question: dash.iai.one legal lane là gì? (cần định nghĩa rõ trước audit master)
- Context: hiện chưa có file pháp lý lock cho dash
- Recommendation: assign Codex viết draft legal lane "billing-support-only, không xử lý tiền customer-facing"
- Default if no decision by 2026-04-28: ghi "TBD" trong audit master
- Affects: dash.iai.one audit completeness

### DEC-TEAM2-002
- Question: Team Platform Runtime owner định danh là agent nào?
- Context: shared runtime contract evolution không thuộc Pay+Email (per boundary v1.0.1 §3) cũng không thuộc Codex T1+2+3
- Recommendation: assign Pay+Email (vì pay.iai.one host endpoint) HOẶC tạm Codex wear-2-hats
- Default: Codex tạm cover, đánh dấu UNCONFIRMED
- Affects: shared runtime contract gap fill

### DEC-TEAM2-003
- Question: dash.iai.one Control Tower UI implement ngay hay defer?
- Context: spec đầy đủ (`docs/DASH_IAI_ONE_LIVING_CONTROL_SYSTEM_MANIFESTO_AND_MASTER_DIRECTION.md`), chưa có UI thật
- Recommendation: defer Q3 2026 (priority hiện là pay flip + audit)
- Default: defer
- Affects: dash.iai.one product readiness
