# TEAM_CHANNEL_MAPPING_AND_15MIN_REMINDER_PROTOCOL_2026-04-23

- Team: Team 1 Program Root / Codex Coordination
- Date: 2026-04-23
- Status: `ACTIVE_UNTIL_VERIFIED_COMPLETE`
- Scope: all active teams currently blocking or supporting synchronized live
- Machine schedule: `docs/reports/team1/TEAM_CHANNEL_REMINDER_SCHEDULE_2026-04-23.json`
- Checker / emitter: `scripts/team-channel-reminder-check.mjs`

## 1. Root rule

Every active team must be reminded every 15 minutes until that team's assigned work is complete and verified.

The reminder loop is not a daily 08:00 summary.

It is a continuous operational cadence:

- every 15 minutes
- every active team
- full task command
- explicit blocker owner
- explicit stop condition
- no vague status

The reminder may be stopped for a team only when:

1. the team reports completion
2. evidence exists
3. the relevant checker or Team 1 authority accepts the completion
4. the team status in the schedule is changed to `COMPLETE_VERIFIED`

## 2. Waiting rule

A team is allowed to wait only when:

- its own assigned work is complete
- its current blocker is owned by another named team
- evidence of its completed work is already attached
- its next action is explicitly `WAITING_ON_<OWNER>`

The team is not allowed to wait if it still has missing evidence inside its own responsibility boundary.

## 3. Delivery boundary

This repository now contains the canonical channel mapping and 15-minute reminder schedule.

Actual external dispatch requires a connected transport such as Slack, Teams, Notion, email, or an app heartbeat automation.

Until that connector is attached, use:

```bash
node scripts/team-channel-reminder-check.mjs --date=2026-04-23
```

To emit the current reminder packet to stdout:

```bash
node scripts/team-channel-reminder-check.mjs --date=2026-04-23 --emit
```

To write the current reminder status report:

```bash
node scripts/team-channel-reminder-check.mjs --date=2026-04-23 --write
```

Current Codex app thread heartbeat:

- `team-15m-reminder-loop-2`: `ACTIVE`
- Cadence: every 15 minutes
- Scope: current local thread reminder dispatch from the repo-side schedule
- Limitation: this does not replace Slack/Teams delivery; it keeps the Team 1 control thread awake and emitting the reminder packet.

## 4. Logical channel map

| team | logical channel | current status | reminder cadence |
|---|---|---|---|
| Team 1 Control Tower | `control-tower-gate-authority` | `COMPLETE_VERIFIED` | every 15 minutes |
| Team 2 Runtime and Platform Core | `pay-production-gate-runtime` | `ACTIVE` | every 15 minutes |
| Team B Pay Runtime | `pay-runtime-event-integration` | `ACTIVE` | every 15 minutes |
| Team D Payments Activation and Treasury Ops | `team-d-payment-activation` | `ACTIVE` | every 15 minutes |
| Team Email SMTP | `email-smtp-live-proof` | `ACTIVE` | every 15 minutes |
| Team 5 Live Sync | `global-live-sync-readiness` | `WAITING_ON_PAY_GATE` | every 15 minutes |
| Team C Language and Bilingual QA | `universal-bilingual-language-rebuild` | `ACTIVE` | every 15 minutes |
| Team A Developer Lane | `developer-iai-one-reopen-review` | `WAITING_ON_TEAM1_REVIEW` | every 15 minutes |
| Team B CDN and Flows | `cdn-flows-domain-proof` | `ACTIVE` | every 15 minutes |
| Team C CIOS | `cios-review-closure` | `ACTIVE` | every 15 minutes |

## 5. Current highest-priority reminder order

1. Team 1 must publish the `2026-04-23` pay gate note.
2. Team 2 must fix production key/header and shared runtime health contract.
3. Team B Pay Runtime must wire real payment events to `POST /internal/payment-email/send`.
4. Team D must complete `tranhatam.com` evidence first.
5. Team Email SMTP must provide sender, mailbox, workspace, messageId, DB/log, and inbox proof.
6. Team 5 must remain rerun-ready but must not claim synchronized live before Team 1 flips the gate.
7. Team C Language must close remaining bilingual rebuild blockers.
8. Team A must wait for Team 1 review unless a specific delta is requested.
9. Team B CDN/Flows must submit domain-specific production proof.
10. Team C CIOS must commit and attach review closure evidence if technical closure is truly complete.

## 6. Stop condition

Do not disable the reminder loop globally.

Disable only the row for a specific team when that team reaches:

`COMPLETE_VERIFIED`

Do not use:

- almost done
- waiting generally
- should be fine
- ready soon
- green locally
- pending minor issue

Every reminder row must remain active until evidence-backed completion is accepted.

## 7. Final instruction

The team reminder system exists to prevent passive waiting.

Teams must keep moving on everything they own.

Waiting is allowed only after their own work is done and the next blocker owner is named.
