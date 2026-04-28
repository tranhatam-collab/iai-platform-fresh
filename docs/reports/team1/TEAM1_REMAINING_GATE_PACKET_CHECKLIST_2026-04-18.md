# TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18
- Team: Team 1 Program Root / Gate Authority
- Date: 2026-04-18
- Scope: remaining NO-GO domains + Phase D pay release-claim gate
- Due target: 2026-04-20 EOD ICT

## 1. Submission checklist by domain

| Domain | Gate target | Required packet | Required test proof | Rollback note | Owner matrix confirmed | Mission-map/boundary pass | Team 1 verdict |
|---|---|---|---|---|---|---|---|
| `developer.iai.one` | reopen review | [ ] attached | [ ] attached | [ ] attached | [ ] pass | [ ] pass | `PENDING` |
| `cios.iai.one` | reopen review | [ ] attached | [ ] attached | [ ] attached | [ ] pass | [ ] pass | `PENDING` |
| `cdn.iai.one` | reopen review | [ ] attached | [ ] attached | [ ] attached | [ ] pass | [ ] pass | `PENDING` |
| `flows.iai.one` | reopen review | [ ] attached | [ ] attached | [ ] attached | [ ] pass | [ ] pass | `PENDING` |
| `pay.iai.one` | release-claim review | [ ] attached (Phase D review-ready) | [ ] attached | [ ] attached | [ ] pass | [ ] pass | `LOCKED_PREP_ONLY` |

Stub status:
- packet stubs for `developer`, `cios`, `cdn`, `flows` have been pre-created by Team 1 to reduce submission setup time; checklist remains unchecked until owner evidence is fully filled.

## 2. Hard rules for all submissions

- Team 1 does not accept reopen request without all four evidence parts:
  - release packet
  - green test proof
  - rollback note
  - owner accountability (from ownership matrix)
- For `pay.iai.one`, `prep-only` remains active until Team 1 marks `review-ready` and explicitly flips release-claim gate.
- Any packet delta after submission requires Team 1 rerun:
  - `pnpm report:lane`
  - `pnpm report:control-tower`

## 3. Escalation mapping

- ESC-H1 (Team 2 + Team 1): close `pay.iai.one` review-ready packet and keep release claim locked until verdict.
- ESC-H2 (domain owners): close packet gaps for `developer`, `cios`, `cdn`, `flows`.
- ESC-H3 (Team 1): rerun control-tower loop within 30 minutes after each packet update.
- Issued command batch:
  - `docs/reports/team1/TEAM1_PACKET_REQUEST_BATCH_2026-04-18.md`
