# AI TEAM KICKOFF AND SESSION REPORTING STANDARD

## Purpose

Standardize how any `iai.one` team starts work, runs a session, and reports after each session.

This file is reusable.

It is not tied to one domain only.

## 1. Start-of-session rule

Before a team starts a dev session, it must read:

- `docs/AI_TEAM_EXECUTION_SYSTEM.md`
- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- `docs/PROJECT_PROTOCOL_ACTIVATION.md`
- the latest team-specific directive or blocker file

The team must know:

- current objective
- current blockers
- scope in
- scope out
- exact stop condition

No session may start from memory alone.

## 2. Required session loop

Each session must follow this loop:

1. read current context
2. select one active work item
3. execute only inside that boundary
4. run relevant checks
5. write one session report
6. update next action and blocker owner

## 3. Session reporting is mandatory

After every session, the team must publish exactly one report block.

No vague updates.

No “gần xong”.

No “đang ổn”.

No “chờ chút”.

## 4. Required report format

Use this format:

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

## 5. Required minimum fields

Every session report must include:

- team name
- lane or domain
- exact session objective
- completed work
- verification commands and results
- current blocker
- next action
- current state

## 6. State vocabulary

Only use:

- `PLANNED`
- `IN_PROGRESS`
- `BLOCKED`
- `REVIEW_READY`
- `EVIDENCE_PENDING`
- `DONE`

Do not invent new informal states in reports.

## 7. Blocker rule

A blocker must always include:

- what is blocked
- why it is blocked
- who owns the unblock

Correct:

```text
- blocker: production probe still returns 401 API_KEY_REQUIRED
- blocker_owner: Team 2
```

Incorrect:

```text
- blocker: đang chờ
```

## 8. Verification rule

If the session changed code, config, workflow, or docs with executable meaning, the report must include verification.

Examples:

- `pnpm test:pay -> PASS`
- `node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=2026-04-23 -> PASS`
- `curl -I https://pay.iai.one -> HTTP 200`

If a check was not run, the report must say so explicitly.

## 9. Docs update rule

If the session changes accepted state, the team must also update:

- board
- context
- or the latest release/report note

No accepted state may live only in chat.

## 10. Reuse rule

For future domains or lanes, reuse this file unchanged unless the reporting format itself must change.

Change only:

- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- the team-specific kickoff directive

