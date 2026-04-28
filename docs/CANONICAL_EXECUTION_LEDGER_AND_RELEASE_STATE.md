# CANONICAL_EXECUTION_LEDGER_AND_RELEASE_STATE
## Version 1.0
## Status: LOCKED CANONICAL OPERATIONAL TRUTH
## Scope: `*.iai.one`
## Last updated: 2026-04-22

Live working companion:
- `docs/reports/CANONICAL_EXECUTION_LEDGER.md`

Rule:
- file này giữ lớp giải thích mở rộng
- `docs/reports/CANONICAL_EXECUTION_LEDGER.md` là live working ledger để team cập nhật và đọc hằng ngày

---

## 0. Core statement

File này là ledger chuẩn cho toàn bộ hệ `iai.one` về:
- execution state
- release state
- gate state
- synchronized live state

Đây không phải backlog.
Đây không phải planning note.
Đây không phải chat recap.

Nếu cần trả lời nhanh:
- domain nào đang `GO`
- domain nào đang `MONITOR_ONLY`
- domain nào đang `PREP_ONLY`
- domain nào chỉ mới `REOPEN_REVIEW_APPROVED`
- domain nào còn `PENDING_OWNER_EVIDENCE`
- toàn hệ đã sẵn sàng synchronized live hay chưa

thì file này là canonical truth.

---

## 1. Canonical source precedence

Khi có nhiều file nói về cùng một gate, dùng thứ tự ưu tiên này:

1. Team 1 gate verdict hoặc Team 1 manual production verification note
2. Runtime probe hoặc packet evidence trực tiếp gần nhất của domain đó
3. Team 1 automation snapshot hoặc lane snapshot
4. Daily/execution report của từng team

Hard rule:
- downstream report không được override Team 1 gate verdict
- packet `review-ready` không đồng nghĩa `release-ready`
- file cũ hơn không được override snapshot mới hơn nếu cùng cấp authority

Ghi chú ngày `2026-04-22`:
- `pay.iai.one` có 2 lớp truth cùng tồn tại:
  - Team 1 manual gate truth hiện đã cập nhật theo runtime probe mới nhất ngày `2026-04-22`, nhưng probe đó trả `401 API_KEY_REQUIRED` nên chưa chứng minh được production checkout thật
  - Team 1 automated pay gate ngày `2026-04-22` còn fail thêm ở lớp shared-runtime vì `pay.iai.one/health` vẫn là contract legacy, chưa expose `shared_read_model` và `shared_upstream_runtime`
- canonical kết luận vì thế vẫn là:
  - `LOCK_RETAINED_WITH_REASON`
  - `NOT_READY_FOR_SYNCHRONIZED_LIVE`

---

## 2. Global control truth

### 2.1 Toàn hệ

- Lane protocol: `PASS`
- Daily reports: `PASS`
- Cross-team reports: `PASS`
- Ownership unresolved rows: `0`
- Language compliance: `PASS`
- Multilingual readiness: `PASS`
- Global release control state: `READY`
- Global release-claim state: `LOCK_RETAINED`
- Global synchronized live state: `NOT_READY_FOR_SYNCHRONIZED_LIVE`

### 2.2 Blocker gốc hiện tại

Blocker gốc của toàn hệ hiện tại vẫn là:
- `pay.iai.one` production gate

Canonical unmet signals đang giữ toàn hệ:
- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`

Automation gap ngày `2026-04-22` còn cho thấy:
- `team2_runtime_probe_present` = đã có file probe ngày mới
- nhưng `auth_key_present` = `FAIL` vì probe mới nhất đang trả `401 API_KEY_REQUIRED`
- `shared_read_model_ready_for_shared_only` = thiếu hoặc chưa pass
- `shared_upstream_active_read_mode_shared_contract` = thiếu hoặc chưa pass
- `shared_upstream_release_gate_ready` = thiếu hoặc chưa pass

Kết luận:
- toàn hệ không thiếu governance shell
- toàn hệ không thiếu report loop
- toàn hệ đang bị giữ bởi production runtime/live truth của `pay.iai.one`

---

## 3. Canonical domain execution ledger

| Domain / lane | Primary owner | Execution state | Release state | Live state | Canonical evidence | Next unlock artifact |
|---|---|---|---|---|---|---|
| `dash.iai.one` | Team 2 + Team 1 | `STABLE_MONITOR_ONLY` | `ACCEPTED_GO` | `MONITOR_ONLY` | `IAI_DEPENDENCY_CRITICAL_PATH_2026.md`, Dash acceptance evidence | chỉ cần delta packet nếu có contract-breaking change |
| `web.iai.one` | Team 5 + Team 1 | `READY_PACKET_MONITOR_ONLY` | `READY_FOR_TEAM1_REVIEW` ở mức packet/evidence | `NOT_READY_FOR_SYNCHRONIZED_LIVE` | `REPORT_TEAM5_2026-04-22.md`, `TEAM5_LIVE_SYNC_READINESS_2026-04-22.md` | Team 1 bỏ `LOCK_RETAINED`, Team 5 rerun readiness/final packet |
| `noos.iai.one` | Team 3 + Team 4 + Team 1 | `MONITOR_ONLY_ACCEPTED` | `STABLE_PATCH_MODE` | `MONITOR_ONLY` | `REPORT_TEAM3_2026-04-22.md`, `REPORT_TEAM4_2026-04-22.md` | chỉ patch khi Team 1 note hoặc Team 2 delta thật |
| `nft.iai.one` | Team 2 + Team 4 + Team 1 | `PAIR_GATE_PASS` | `GO` | `MONITOR_ONLY_AFTER_GO` | `CONTROL_TOWER_AUTOMATION_STATUS_2026-04-20.md` | pair-review delta packet nếu có đổi |
| `pay.iai.one` | Team 2 + Team 1 | `PREP_ONLY` | `LOCK_RETAINED_WITH_REASON` | `NOT_PUBLIC_READY` | `PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md`, `PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`, `TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md` | owner provider ack -> Team 2 rerun -> Team 1 flip verdict |
| `developer.iai.one` | Team A / Team 1 | `REOPEN_REVIEW_APPROVED` | `REVIEW_REOPEN_APPROVED_ONLY` | `NO_GO_LIVE_CLAIM_YET` | `TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | Team 1 slot review lane kế tiếp |
| `cdn.iai.one` | Team B Infra CDN Owner + Team 1 | `PENDING_OWNER_EVIDENCE` | `REOPEN_REVIEW_DENIED_PENDING_OWNER_EVIDENCE` | `BLOCKED` | `TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`, `CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | deploy/rule/cache/rollback evidence domain-specific |
| `flows.iai.one` | Team B Automation Owner + Team 1 | `PENDING_ROUTE_RUNTIME_PROOF` | `REOPEN_REVIEW_PENDING_ROUTE_RUNTIME_PROOF` | `BLOCKED` | `TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`, `FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | route/runtime proof production + packet refresh |
| `cios.iai.one` | Team C + Team 1 | `SUBMITTED_EVIDENCE_REVIEW_PENDING` | `EVIDENCE_REVIEW_PENDING` | `BLOCKED_PENDING_REVIEW_CLOSURE` | `TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`, `CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | close 3 open issues: Vitest env, screenshot, strict smoke |

---

## 4. Canonical team execution ledger

| Team | Current state | Canonical instruction | Hard stop |
|---|---|---|---|
| Team 1 | `READY / PASS` nhưng đang giữ `LOCK_RETAINED` | tiếp tục gate authority, owner follow-up, final release verdict | không flip lock khi pay gate còn fail |
| Team 2 | `PREP_ONLY_WAIT_OWNER_ACK` | không rerun mù; chỉ rerun khi owner provider ack hoặc Team 1 review note mới; dùng `TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22.md` để khóa đúng key/header canonical trước khi rerun checkout; nộp lại theo `TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md` | không claim lane xanh khi còn `401 API_KEY_REQUIRED` hoặc `214` |
| Team 3 | `MONITOR_ONLY_ACCEPTED` | giữ NOOS surface ổn định, chỉ patch khi có delta thật | không fork contract upstream |
| Team 4 | `REVIEW_READY_MONITOR_ONLY` | giữ support/recovery/trace mapping review-ready | không claim synchronized live trước Team 1 |
| Team 5 | `READY_PACKET_WAIT_GATE_FLIP` | giữ KPI/readiness loop và chờ trigger hợp lệ từ Team 1 | không claim synchronized live khi còn `LOCK_RETAINED` |

---

## 5. Release state dictionary

- `ACCEPTED_GO`
  - domain đã qua gate release ở lớp authority tương ứng
- `MONITOR_ONLY`
  - domain đã qua release checkpoint chính và chỉ còn theo dõi delta
- `PREP_ONLY`
  - được tiếp tục lane nền tảng nhưng chưa có quyền claim public-ready
- `LOCK_RETAINED_WITH_REASON`
  - Team 1 chủ động giữ gate khóa vì điều kiện chưa đạt
- `REOPEN_REVIEW_APPROVED`
  - được mở lại vòng review evidence, chưa phải live approval
- `PENDING_OWNER_EVIDENCE`
  - packet có thể tồn tại nhưng owner evidence cốt lõi còn thiếu
- `EVIDENCE_REVIEW_PENDING`
  - evidence đã nộp nhưng chưa được Team 1 đóng review closure
- `NOT_READY_FOR_SYNCHRONIZED_LIVE`
  - toàn hệ hoặc domain chưa được phép claim live đồng bộ

---

## 6. What is actually blocking global release today

Không phải:
- daily report loop
- cross-team report format
- ownership matrix
- language compliance
- Team 3 NOOS
- Team 4 ops packet
- Team 5 KPI packet

Đang chặn thật:
- `pay.iai.one` live provider layer
- Team 2 đã có probe artifact ngày `2026-04-22` nhưng probe đó chưa có key/header canonical nên chưa chứng minh được production checkout thật
- shared-runtime/shared-upstream signals chưa đủ `PASS` cho mode gate mới

---

## 7. Immediate allowed actions

Được làm:
- Team 1 follow-up owner provider
- Team 2 chuẩn bị rerun bundle mới
- Team 5 giữ readiness loop xanh
- Team A/B/C cập nhật packet evidence theo verdict reopen tương ứng

Không được làm:
- claim synchronized live
- flip `release-claim` bằng cảm giác
- dùng packet reopen như bằng chứng `GO`
- tạo truth mới ngoài Team 1 gate verdict

---

## 8. Canonical references

- `docs/reports/team1/LANE_STATUS_SNAPSHOT_2026-04-22.md`
- `docs/reports/team1/TEAM1_EXECUTION_REPORT_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md`
- `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`
- `docs/reports/team1/TEAM_ADMIN_ALL_TEAMS_COMPLETION_REMINDER_2026-04-22.md`
- `docs/reports/team2/TEAM2_EXECUTION_REPORT_2026-04-22.md`
- `docs/reports/team3/REPORT_TEAM3_2026-04-22.md`
- `docs/reports/team4/REPORT_TEAM4_2026-04-22.md`
- `docs/reports/team5/REPORT_TEAM5_2026-04-22.md`
- `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md`

---

## 9. Final direction

Nếu cần một câu duy nhất để điều hành toàn hệ ngày `2026-04-22`:

`iai.one` hiện có governance-ready, report-ready, packet-ready ở nhiều lane, nhưng chưa release-ready toàn hệ vì `pay.iai.one` vẫn giữ `LOCK_RETAINED_WITH_REASON` và synchronized live vẫn `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
