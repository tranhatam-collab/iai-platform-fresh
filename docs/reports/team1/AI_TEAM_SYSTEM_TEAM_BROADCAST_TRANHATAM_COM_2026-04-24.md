# AI_TEAM_SYSTEM_TEAM_BROADCAST_TRANHATAM_COM_2026-04-24

- Date: `2026-04-24`
- Scope: `tranhatam.com` first activation under the `iai.one` AI team system
- Authority: Team 1 Control Tower
- Reporting lock: every team must publish one session report after each session

Use with:

- `docs/AI_TEAM_KICKOFF_AND_SESSION_REPORTING_STANDARD.md`
- `docs/reports/team1/AI_TEAM_SYSTEM_KICKOFF_TRANHATAM_COM_2026-04-24.md`

## Team 1 Control Tower

Start now.

Your job:

- keep the canonical gate truth synchronized
- reject overclaims
- accept only evidence-backed progress

Report after each session:

- gate state
- new accepted evidence
- exact next unblock condition

## Team 2 Runtime and Platform

Start now.

Your job:

- fix the canonical production probe path
- rerun only when key/header path is valid
- prove:
  - `checkout_url_non_null`
  - `payment_link_id_non_null`
  - `no_214`

Report after each session:

- commands run
- exact probe result
- whether blocker is runtime, key/header, or deploy shape

## Team B Pay Runtime

Start now.

Your job:

- wire the real payment event into `POST /internal/payment-email/send`
- persist provider reference
- persist mail `message_id`

Report after each session:

- whether trigger is wired
- whether provider ref is stored
- whether `message_id` is stored
- whether canonical or D1 evidence is updated

## Team D Payments Activation and Treasury Ops

Start now.

Your job:

- work `tranhatam.com` first
- keep every status honest
- complete:
  - mailbox truth
  - sender package truth
  - inbound route truth
  - runtime binding evidence
  - payment evidence

Report after each session:

- evidence fields closed
- evidence fields still open
- blocker owner
- whether `READY_FOR_LIVE` remains forbidden

## Team Email SMTP

Start now.

Your job:

- close sender binding
- close mailbox and alias truth
- close inbound routing truth
- prove `/v1/send` accepted
- prove log/DB evidence
- prove inbox delivery

Report after each session:

- exact sender used
- `message_id`
- matching log/DB evidence state
- Gmail or inbox proof state
- remaining blocker

## Docs AI / Codex

Start now.

Your job:

- keep context and board synchronized
- record accepted state only

Report after each session:

- files updated
- accepted state changed
- remaining open items

## Mandatory session report shape

```text
# SESSION REPORT
- Team:
- Date:
- Lane:
- Objective for this session:

## Done
- 

## Verification
- command/result
- command/result

## Blockers
- blocker
- blocker_owner

## Next action
- 

## Current state
- one of: PLANNED / IN_PROGRESS / BLOCKED / REVIEW_READY / EVIDENCE_PENDING / DONE
```

## Operational rule

No team may claim waiting unless:

1. the current assigned work is complete
2. evidence is attached
3. the next blocker owner is named
