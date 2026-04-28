# PROJECT CONTEXT ENGINE

## Purpose

Provide the minimum correct operational context that every AI role must read before acting.

This file is the project-specific truth layer for the AI team system.

## 1. Ecosystem scope

Primary scope:

- `iai.one` ecosystem repo

Current first activation scope:

- `tranhatam.com`
- payment activation through `pay.iai.one`
- payment email live proof through `mail.iai.one`

Out of scope for this first activation:

- `life.iai.one`
- unrelated site launches
- infra-core redesign
- secret generation without human action

## 2. Current active human teams for the first activation

### Team 1 Control Tower

Owns:

- gate authority
- canonical verdict
- release hold or unlock

Current truth:

- pay production gate is still not fully unlocked
- no live claim is valid without Team 1 gate evidence

Primary references:

- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-23.md`
- `docs/reports/team1/TEAM_ADMIN_POST_TEAMD_REPORT_ACTIONS_2026-04-23.md`

### Team 2 Runtime and Platform

Owns:

- pay runtime probe
- production key/header binding
- provider integration signal
- production health contract

Current truth:

- payOS channel activation for `tranhatam` is now active
- real checkout URL has been generated from payOS production UI
- the remaining blocker is canonical runtime probe proof with valid API key and non-null payment fields

Primary reference:

- `docs/reports/team2/TEAM2_TRANHATAM_PAYOS_CHANNEL_ACTIVATION_2026-04-24.md`

### Team B Pay Runtime

Owns:

- payment runtime integration
- live payment event handoff into mail adapter
- canonical event persistence

Current truth:

- repo-side outbound adapter exists
- real payment event still must call `POST /internal/payment-email/send`
- canonical row must persist provider reference plus mail `message_id`

Primary references:

- `docs/PAY_IAI_ONE_PAYMENT_EMAIL_OUTBOUND_ADAPTER_CONTRACT_2026.md`
- `docs/reports/team1/TEAM_ADMIN_POST_TEAMD_REPORT_ACTIONS_2026-04-23.md`

### Team D Payments Activation and Treasury Ops

Owns:

- site intake
- mailbox package collection
- receiver confirmation
- activation evidence packet

Current truth:

- `tranhatam.com` is the first mandatory row
- state is still `FORM_IN_PROGRESS`
- live claim is forbidden until external proof is complete

Primary references:

- `docs/reports/teamd/TRANHATAM_COM_P0_PAYMENT_ACTIVATION_PACKET_2026-04-23.md`
- `docs/reports/teamd/TRANHATAM_COM_PAYMENT_ACTIVATION_EVIDENCE_STATUS_2026-04-23.md`

### Team Email SMTP

Owns:

- sender truth
- mailbox/alias truth
- inbound routing truth
- `/v1/send` accepted proof
- message delivery evidence

Current truth:

- lane is not live-close
- required proof clusters remain open:
  - mailbox/alias truth
  - inbound routing truth
  - Gmail proof
  - Outlook proof
  - internal inbox proof

Primary references:

- `docs/iai-mail-platform/MAIL_IAI_ONE_TEAM_EMAIL_SMTP_LANE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_2026-04-22.md`

## 3. First activation objective

Complete the first AI-team-controlled activation for `tranhatam.com` without overclaiming live readiness.

That means:

1. payment lane is wired correctly
2. mail lane is wired correctly
3. evidence exists
4. Team 1 can accept the checkpoint

## 4. Hard blockers right now

- Team 1 gate evidence still controls live status
- production runtime probe must pass with valid key/header
- provider ref must be captured
- payment email must return a real `message_id`
- canonical/D1 evidence row must store provider ref and `message_id`
- inbox proof must exist

## 5. Forbidden actions

- do not claim `READY_FOR_LIVE` for `tranhatam.com`
- do not bypass Team 1 gate
- do not use founder/personal mailboxes as production proof senders
- do not mutate secrets automatically
- do not rewrite unrelated repo work
- do not widen scope into unrelated domains

## 6. Required evidence for first activation done

`tranhatam.com` is only complete when all are true:

1. mailbox and alias truth exists for:
   - `pay@tranhatam.com`
   - `billing@tranhatam.com`
   - `support@tranhatam.com`
   - `noreply@tranhatam.com`
2. inbound routing truth exists
3. runtime bindings exist:
   - `MAIL_API_BASE_URL`
   - `MAIL_API_KEY`
   - `MAIL_API_WORKSPACE_ID`
   - `PAY_EMAIL_ADAPTER_INTERNAL_KEY`
4. one real or true sandbox payment action exists
5. provider reference exists
6. mail `message_id` exists
7. canonical or D1 evidence row exists
8. inbox proof exists
9. Team 1 accepts the checkpoint

## 7. Usage rule

Every AI role must read this file before acting on any task in the first activation lane.

