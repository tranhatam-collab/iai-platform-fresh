# TEAM1_PACKET_REQUEST_BATCH_2026-04-18
- Team: Team 1 Program Root / Gate Authority
- Date issued: 2026-04-18
- Deadline: 2026-04-20 17:00 ICT
- Scope: remaining NO-GO domains + Phase D pay release-claim readiness

## 1. Command objective

Batch nay la lenh nop packet chinh thuc cua Team 1 cho cac domain con lai.
Team 1 chi xem xet reopen/release-claim sau khi packet day du theo template:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

## 2. Required submissions

| Domain | Owner team | Owner (matrix) | Required packet path | Required evidence minimum | Current state |
|---|---|---|---|---|---|
| `developer.iai.one` | Team A | Team A DevRel Owner | `docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | route truth + API/curl proof + rollback note | `STUB_CREATED_PENDING_EVIDENCE` |
| `cios.iai.one` | Team C | Team C CIOS Owner | `docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | route truth + runtime contract proof + rollback note | `STUB_CREATED_PENDING_EVIDENCE` |
| `cdn.iai.one` | Team B | Team B Infra CDN Owner | `docs/release-evidence/cdn.iai.one/CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | deploy/test evidence + cache/rule proof + rollback note | `STUB_CREATED_PENDING_EVIDENCE` |
| `flows.iai.one` | Team B | Team B Automation Owner | `docs/release-evidence/flows.iai.one/FLOWS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md` | runtime execution proof + queue/dispatch proof + rollback note | `STUB_CREATED_PENDING_EVIDENCE` |
| `pay.iai.one` | Team 2 + Team 1 review | Team 2 Runtime Lead | `docs/release-evidence/pay.iai.one/PAY_IAI_ONE_PHASE_D_PREP_RELEASE_EVIDENCE_PACKET_2026-04-18.md` (already present) + Team 1 review delta | release-claim gating proof + rollback note + final Team 1 verdict section | `READY_FOR_TEAM1_REVIEW` |

## 3. Hard rules

- Không packet -> không review.
- Packet stub không được tinh la packet hoàn tất.
- Packet thiếu rollback note -> auto `BLOCKED`.
- Packet thiếu test/curl/runtime proof -> auto `BLOCKED`.
- Team 1 không mở GO neu không co owner accountability khop owner matrix.

## 4. Team 1 post-receipt actions

Sau moi packet được nop:
1. Team 1 rerun `pnpm report:lane`
2. Team 1 rerun `pnpm report:control-tower`
3. Team 1 cập nhật:
   - `docs/IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`
   - `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-18.md`
   - `docs/reports/team1/TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18.md`

## 5. Sendable short commands (owner-facing)

### Team A / developer.iai.one
Nop packet `developer.iai.one` theo template, bắt buộc co route truth + API/curl proof + rollback note trước 2026-04-20 17:00 ICT. Không packet = không review reopen.

### Team C / cios.iai.one
Nop packet `cios.iai.one` theo template, bắt buộc co runtime contract proof + rollback note trước 2026-04-20 17:00 ICT. Không packet = không review reopen.

### Team B / cdn.iai.one
Nop packet `cdn.iai.one` theo template, bắt buộc co deploy/test proof + cache/rule proof + rollback note trước 2026-04-20 17:00 ICT. Không packet = không review reopen.

### Team B / flows.iai.one
Nop packet `flows.iai.one` theo template, bắt buộc co runtime execution proof + queue/dispatch proof + rollback note trước 2026-04-20 17:00 ICT. Không packet = không review reopen.

### Team 2 / pay.iai.one
Giữ `pay` prep-only, bổ sung delta review-ready cho release-claim decision theo checklist Team 1; không được claim release trước verdict Team 1.
