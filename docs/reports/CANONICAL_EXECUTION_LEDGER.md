# IAI Canonical Execution Ledger

Version 1.0

Status: Live Working File

Source of Truth: YES

Update SLA: `<= 24h`

Last updated: `2026-04-22`

---

## 0. Rule nhắc lại

- Đây là nguồn sự thật số 1 cho execution state và release state sau Team 1 verdict.
- Không đọc trạng thái ở nơi khác trước file này.
- Nếu conflict:
  - Team 1 gate verdict thắng tất cả.
  - file này đứng ngay dưới Team 1 gate verdict.
- Mọi daily report và execution report chỉ được tham chiếu state từ đây, không tự bịa status riêng.

## 1. Canonical precedence

1. `Team 1 gate verdict`
2. `CANONICAL_EXECUTION_LEDGER.md`
3. `Production evidence packet`
4. `Control tower checkpoint`
5. `Daily report`
6. `Team-local execution note`

Rule:
- `owner signoff` không đồng nghĩa `GO`
- `review-ready` không đồng nghĩa `production-ready`
- `local green` không đồng nghĩa `production-approved`
- `APPROVED_MONITOR_ONLY` không đồng nghĩa `SYNC_LIVE_ELIGIBLE`

## 2. State vocabulary

- `PLANNED`
- `IN_BUILD`
- `LOCAL_GREEN`
- `REVIEW_READY`
- `REVIEW_BLOCKED`
- `PRODUCTION_EVIDENCE_PENDING`
- `PRODUCTION_READY`
- `GATE_LOCKED`
- `APPROVED_MONITOR_ONLY`
- `APPROVED_FOR_PRODUCTION`
- `SYNC_LIVE_ELIGIBLE`
- `LIVE`
- `ROLLBACK_ONLY`
- `CLOSED`

## 3. Ledger core table

| entry_id | entry_type | owner_team | authority_team | current_state | release_mode | blocking_entries | required_evidence | evidence_class_current | next_action | next_action_owner | can_flip_to | truth_source_file | state_as_of | fresh_until | is_stale |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `domain.iai.one` | domain | Team 1 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | shell delta packet if changed | `GATE_VERDICT` | keep shell stable | Team 1 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.home.iai.one` | domain | Team 1 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | shell delta packet if changed | `GATE_VERDICT` | keep portal shell stable | Team 1 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.docs.iai.one` | domain | Team 1 + Team 3 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | docs delta packet if changed | `GATE_VERDICT` | keep docs shell stable | Team 1 + Team 3 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/TEAM1_DECISION_LOG_2026.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.app.iai.one` | domain | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | app shell delta packet if changed | `GATE_VERDICT` | keep app shell stable | Team 2 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.flow.iai.one` | domain | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | `domain.flows.iai.one` | production execution proof if route/runtime changes | `GATE_VERDICT` | keep product shell stable, do not over-claim runtime | Team 2 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.dash.iai.one` | domain | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | `domain.flow.iai.one` | runtime delta packet if contract changes | `GATE_VERDICT` | keep dash monitor-only and aligned with flow contract | Team 2 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/DASH_TEAM1_ACCEPTANCE_STATE_2026-04-18.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.web.iai.one` | domain | Team 5 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | `lane.pay-production-gate`, `lane.team5-live-sync` | pay gate PASS + readiness rerun | `GATE_VERDICT` | hold readiness loop, wait Team 1 flip | Team 5 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.noos.iai.one` | domain | Team 3 + Team 4 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | `domain.pay.iai.one` (indirect sync blocker only) | patch note only when upstream delta exists | `LOCAL_TEST` | keep monitor-only accepted state | Team 3 + Team 4 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team3/REPORT_TEAM3_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.nft.iai.one` | domain | Team 2 + Team 4 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | pair-review delta packet if changed | `GATE_VERDICT` | keep secure lane stable after GO | Team 2 + Team 4 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/NFT_PHASE_C_GATE_STATUS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.pay.iai.one` | domain | Team 2 / Payments | Team 1 | `GATE_LOCKED` | `review-only` | `lane.pay-production-gate` | owner provider confirmation + new runtime probe + full gate PASS | `GATE_VERDICT` | collect owner confirmation and rerun production probe | Team 1 + Team 2 + Provider Owner | `APPROVED_FOR_PRODUCTION` | `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.developer.iai.one` | domain | Team A / Team 1 | Team 1 | `REVIEW_READY` | `review-only` | none | Team 1 review closure | `PRODUCTION_ROUTE_PROOF` | wait Team 1 review slot and answer delta if requested | Team 1 + Team A | `PRODUCTION_EVIDENCE_PENDING` | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.cios.iai.one` | domain | Team C | Team 1 | `REVIEW_BLOCKED` | `review-only` | `lane.domain-reopen-review` | Vitest env fix + fresh screenshot + strict smoke | `LOCAL_TEST` | close 3 open issues and refresh packet | Team C | `PRODUCTION_EVIDENCE_PENDING` | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.cdn.iai.one` | runtime | Team B Infra | Team 1 | `REVIEW_BLOCKED` | `review-only` | `lane.domain-reopen-review` | deploy/rule/cache/header evidence | `DOC_ONLY` | deploy and capture domain-specific infra proof | Team B Infra | `PRODUCTION_EVIDENCE_PENDING` | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.flows.iai.one` | runtime | Team B Automation | Team 1 | `PRODUCTION_EVIDENCE_PENDING` | `review-only` | `lane.domain-reopen-review` | production route/runtime proof | `LOCAL_TEST` | refresh packet with route/runtime proof from production path | Team B Automation | `PRODUCTION_READY` | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.api.iai.one` | runtime | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | runtime delta packet if contract changes | `GATE_VERDICT` | keep API contract stable | Team 2 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.api.flow.iai.one` | runtime | Team 2 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | runtime delta packet if contract changes | `GATE_VERDICT` | keep API Flow contract stable | Team 2 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `domain.mail.iai.one` | runtime | Team SMTP | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | `lane.mail-system`, `lane.mail-global-live` | wave tracker proof by app/web flow | `PRODUCTION_RUNTIME_PROOF` | hold internal-first green, do not over-claim global live | Team SMTP | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.mail-system` | lane | Team SMTP | Team 1 | `PRODUCTION_EVIDENCE_PENDING` | `review-only` | none | outbound provider proof + deliverability + inbound route evidence | `PRODUCTION_RUNTIME_PROOF` | complete real SMTP runtime and keep dependency health green | Team SMTP | `PRODUCTION_READY` | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` | `2026-04-19` | `2026-04-20` | `yes` |
| `lane.pay-production-gate` | cross-team-gate | Team 2 | Team 1 | `GATE_LOCKED` | `review-only` | `provider.owner.confirmation` | owner confirmation + new probe + gate PASS | `GATE_VERDICT` | wait owner ack, then rerun gate bundle | Team 1 + Team 2 | `APPROVED_FOR_PRODUCTION` | `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.team5-live-sync` | cross-team-gate | Team 5 | Team 1 | `REVIEW_BLOCKED` | `review-only` | `lane.pay-production-gate` | pay gate PASS + release claim unlocked | `GATE_VERDICT` | rerun readiness only after Team 1 flip | Team 5 | `SYNC_LIVE_ELIGIBLE` | `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.language-compliance` | cross-team-gate | Team 1 | Team 1 | `APPROVED_MONITOR_ONLY` | `monitor-only` | none | same-day rerun if Team 1 docs/reports scope changes materially | `GATE_VERDICT` | keep Team 1 scope monitor loop only; do not treat this row as whole-system bilingual closure | Team 1 | `CLOSED` | `docs/reports/team1/TEAM1_LANGUAGE_COMPLIANCE_STATUS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.universal-bilingual-rebuild` | cross-team-gate | Team 1 + lane owners | Team 1 | `IN_BUILD` | `review-only` | `domain.dash.iai.one`, `domain.life.iai.one`, `domain.noos.iai.one` | dash content-source cleanup + life site-wide audit closure + noos locale architecture review closure | `DOC_ONLY` | use the dedicated status board; close dash cleanup, keep life blocked until site-wide audit closes, and review noos exception architecture explicitly | Team 1 + lane owners | `CLOSED` | `docs/reports/team1/TEAM1_UNIVERSAL_BILINGUAL_REBUILD_STATUS_BOARD_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.no-go-owner-signoff` | cross-team-gate | Team 1 | Team 1 | `CLOSED` | `monitor-only` | none | reopen packet only if domain evidence changes | `OWNER_SIGNOFF` | keep closed; do not confuse with GO | Team 1 | `CLOSED` | `docs/reports/team1/TEAM1_NO_GO_PACKET_STATUS_2026-04-21.md` | `2026-04-21` | `2026-04-23` | `no` |
| `lane.domain-reopen-review` | cross-team-gate | Team 1 | Team 1 | `REVIEW_BLOCKED` | `review-only` | `domain.cdn.iai.one`, `domain.flows.iai.one`, `domain.cios.iai.one` | domain-specific production evidence | `GATE_VERDICT` | close per-domain reopen verdicts one by one | Team 1 + domain owners | `PRODUCTION_EVIDENCE_PENDING` | `docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md` | `2026-04-22` | `2026-04-23` | `no` |
| `lane.mail-internal-first` | lane | Team SMTP | Team 1 | `CLOSED` | `monitor-only` | none | none for this lane | `PRODUCTION_RUNTIME_PROOF` | preserve verified remote-mode baseline | Team SMTP | `CLOSED` | `docs/iai-mail-platform/MAIL_IAI_ONE_INTERNAL_FIRST_VERIFICATION_CLOSEOUT_2026-04-15.md` | `2026-04-15` | `2026-04-16` | `yes` |
| `lane.mail-wave-1` | lane | Team Web + Team App/API | Team 1 | `IN_BUILD` | `local-only` | `lane.mail-system` | real action + messageId + DB evidence per flow | `DOC_ONLY` | migrate Wave 1 flows through internal SMTP and update tracker | Team Web + Team App/API + Codex | `LOCAL_GREEN` | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` | `2026-04-19` | `2026-04-20` | `yes` |
| `lane.mail-wave-2-auth` | lane | Team Auth | Team 1 | `PLANNED` | `local-only` | `lane.mail-wave-1` | all Wave 1 rows migrated + Gmail/Outlook matrix for auth flows | `DOC_ONLY` | do not start until Wave 1 is green | Team Auth | `IN_BUILD` | `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` | `2026-04-15` | `2026-04-16` | `yes` |
| `lane.mail-wave-3-pay-flow` | lane | Team Payments + Team Flow | Team 1 | `PLANNED` | `local-only` | `lane.mail-wave-2-auth` | all Wave 2 rows migrated | `DOC_ONLY` | hold until Wave 2 is green | Team Payments + Team Flow | `IN_BUILD` | `docs/iai-mail-platform/MAIL_IAI_ONE_APP_API_INTERNAL_SMTP_MIGRATION_TRACKER_2026-04-15.md` | `2026-04-15` | `2026-04-16` | `yes` |
| `lane.mail-global-live` | lane | Team SMTP | Team 1 | `PLANNED` | `review-only` | `lane.mail-wave-3-pay-flow` | all waves migrated + inbound/outbound deliverability proof | `DOC_ONLY` | finish waves 1-3 before global live claim | Team SMTP + Codex | `APPROVED_FOR_PRODUCTION` | `docs/iai-mail-platform/MAIL_IAI_ONE_MASTER_CHECKLIST_AND_TWO_TEAM_EXECUTION_2026-04-19.md` | `2026-04-19` | `2026-04-20` | `yes` |

## 4. Điều team phải nhớ

- `pay` đang khóa synchronized live.
- `mail` có lane riêng, không được gọi là “toàn hệ email live” chỉ vì internal-first đã verify.
- `developer` đã `REVIEW_READY`, chưa phải `GO`.
- `cdn`, `flows`, `cios` vẫn chưa production-clean.
- `dash`, `web`, `noos`, `nft` hiện là monitor-only truth, không phải giấy phép tự mở scope mới.
- `language-compliance` pass hiện chỉ là pass ở scope Team 1 docs/governance; whole-system universal bilingual rebuild đang được theo dõi riêng và chưa đóng.

## 5. Câu chốt

Nếu team không biết làm gì tiếp:
- nhìn `current_state`
- nhìn `blocking_entries`
- nhìn `next_action`
- làm đúng `next_action_owner`

Không cần suy đoán thêm ngoài ledger này.
