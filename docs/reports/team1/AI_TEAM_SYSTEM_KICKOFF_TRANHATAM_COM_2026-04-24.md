# AI_TEAM_SYSTEM_KICKOFF_TRANHATAM_COM_2026-04-24

- Date: `2026-04-24`
- Scope: first AI-team-system activation for `tranhatam.com`
- Authority: Team 1 Control Tower
- Reporting rule: mandatory after every session

## 1. Global instruction

From this checkpoint onward, the active teams for `tranhatam.com` must start work under the AI team system and publish one report after each session.

Required base files:

- `docs/AI_TEAM_EXECUTION_SYSTEM.md`
- `docs/AI_TEAM_KICKOFF_AND_SESSION_REPORTING_STANDARD.md`
- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- `docs/PROJECT_PROTOCOL_ACTIVATION.md`

## 2. Team-by-team kickoff

### Team 1 Control Tower

Start now:

- maintain the canonical gate state
- reject overclaims
- accept only evidence-backed progress

Current task:

- keep the gate truth synchronized with Team 2, Team B, Team D, and Team Email SMTP

Must report after each session:

- whether gate state changed
- whether new evidence was accepted
- exact next unblock condition

### Team 2 Runtime and Platform

Start now:

- finish the production probe path for `tranhatam.com`
- prove runtime fields are non-null under the canonical probe

Current task:

- rerun only after key/header path is valid
- verify:
  - `checkout_url_non_null`
  - `payment_link_id_non_null`
  - `no_214`

Must report after each session:

- what changed
- what command was run
- exact probe result
- whether the blocker remains runtime, key/header, or deploy shape

### Team B Pay Runtime

Start now:

- wire the real payment event into `POST /internal/payment-email/send`
- persist provider reference and mail `message_id`

Current task:

- close runtime handoff evidence

Must report after each session:

- whether event trigger is wired
- whether provider ref is stored
- whether `message_id` is stored
- whether canonical or D1 row is updated

### Team D Payments Activation and Treasury Ops

Start now:

- work `tranhatam.com` first
- keep every status honest

Current task:

- complete the activation packet for:
  - mailbox truth
  - sender package truth
  - inbound route truth
  - runtime binding evidence
  - payment evidence

Must report after each session:

- which evidence fields were closed
- which remain open
- blocker owner
- whether `READY_FOR_LIVE` is still forbidden

### Team Email SMTP

Start now:

- close the mail proof lane

Current task:

- sender binding
- mailbox/alias truth
- inbound routing truth
- `/v1/send` accepted proof
- log/DB evidence
- inbox proof

Must report after each session:

- exact sender used
- `message_id`
- matching log/DB evidence state
- Gmail or inbox proof state
- remaining blocker

### Docs AI / Codex coordination

Start now:

- keep context and board synchronized
- record accepted state only, not assumptions

Current task:

- update project docs when a team session changes accepted state

Must report after each session:

- which file was updated
- which state changed
- what remains open

## 3. Mandatory session report block

Every team must use this exact shape after each session:

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

## 4. Current work item map

| team | active work item | current state | immediate stop condition |
|---|---|---|---|
| Team 1 | `TRH-AI-001` gate authority | `IN_PROGRESS` | no new gate note or no accepted evidence |
| Team 2 | `TRH-AI-002` production probe | `IN_PROGRESS` | probe still missing valid pass signals |
| Team B Pay Runtime | `TRH-AI-003` runtime handoff | `IN_PROGRESS` | provider ref and `message_id` not persisted together |
| Team D | `TRH-AI-004` activation packet | `IN_PROGRESS` | evidence fields still incomplete |
| Team Email SMTP | `TRH-AI-005` mail proof | `IN_PROGRESS` | send proof not matched by log/inbox evidence |
| Docs AI / Codex | `TRH-AI-006` docs alignment | `IN_PROGRESS` | board/context not synchronized with accepted state |

## 5. No-wait rule

No team may say it is waiting unless:

1. its own assigned work for the current step is complete
2. evidence is attached
3. the next blocker owner is named

## 6. End condition for the first activation

The first activation is only complete when:

1. Team 2 proves the canonical production probe path
2. Team B proves runtime handoff plus canonical persistence
3. Team D closes the activation packet truth
4. Team Email SMTP closes the mail proof lane
5. Team 1 accepts the checkpoint

Until then:

- continue dev
- continue reporting after each session
- do not claim live completion
