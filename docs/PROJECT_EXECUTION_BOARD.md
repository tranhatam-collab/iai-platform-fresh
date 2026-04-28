# PROJECT EXECUTION BOARD

## Purpose

This board is the active execution surface for the AI team system.

It contains the first live activation of the system:

- `tranhatam.com`
- payment activation through `pay.iai.one`

## 1. Board status vocabulary

- `PLANNED`
- `IN_PROGRESS`
- `BLOCKED`
- `REVIEW_READY`
- `EVIDENCE_PENDING`
- `DONE`

## 2. Current first activation board

| work_id | lane | owner_team | ai_entry_role | current_state | next_action | stop_condition |
|---|---|---|---|---|---|---|
| `TRH-AI-001` | Gate authority | Team 1 | Architect | `IN_PROGRESS` | maintain canonical gate verdict and accept or reject next checkpoint | Team 1 publishes an updated verdict with exact unblock criteria |
| `TRH-AI-002` | Production probe | Team 2 | Debugger | `IN_PROGRESS` | rerun canonical pay probe with valid API key/header and confirm non-null payment fields | `checkout_url_non_null`, `payment_link_id_non_null`, and gate-green signals pass |
| `TRH-AI-003` | Runtime handoff | Team B Pay Runtime | Builder | `IN_PROGRESS` | wire real payment event into `POST /internal/payment-email/send` and persist evidence | provider ref plus mail `message_id` are written into the canonical row |
| `TRH-AI-004` | Site activation packet | Team D | Docs | `IN_PROGRESS` | complete `tranhatam.com` evidence packet and keep all status claims honest | all external evidence fields are complete and accepted |
| `TRH-AI-005` | Mail proof | Team Email SMTP | QA | `IN_PROGRESS` | prove sender binding, inbound routing, `/v1/send` accepted, and inbox delivery | message, log/DB, and inbox proof all refer to the same live send |
| `TRH-AI-006` | Repo-side docs alignment | Docs AI / Codex | Docs | `IN_PROGRESS` | keep system docs, context, and next-step notes synchronized | the board and context match the latest accepted state |

## 3. AI role mapping for this first activation

| AI role | current use in `tranhatam.com` activation | expected output |
|---|---|---|
| Architect AI | map blockers, choose minimal next step, define task boundary | plan |
| Builder AI | repo-side code/docs/workflow changes | changed files |
| Debugger AI | probe failure analysis, failing tests, route regressions | root cause + fix |
| Reviewer AI | check scope drift, release risk, missing evidence | findings |
| QA AI | run tests, probes, checklists, live verification steps | test/evidence result |
| Docs AI | update context, board, next action, release note | updated docs |

## 4. Operating rule

AI must not open a new lane while any active lane still has unresolved work owned by the same team or AI role, unless the board explicitly marks the new lane as independent.

## 5. First activation commands

Use these commands as the base QA/check layer for the first activation:

```bash
pnpm test:pay
node --test tests/integration/pay-team-d-intake-board.test.mjs
node scripts/pay-team-d-tranhatam-evidence-check.mjs --date=<date>
pnpm report:team2-pay-prod-probe -- --date=<date>
pnpm report:pay-prod-gate -- --date=<date>
```

## 6. Docs update rule

After each accepted step, Docs AI must update:

- this board
- `docs/PROJECT_CONTEXT_ENGINE.md`
- the relevant report or release note if the accepted state changed

## 7. Session reporting rule

After every session, each active team must publish one report using:

- `docs/AI_TEAM_KICKOFF_AND_SESSION_REPORTING_STANDARD.md`

First activation kickoff file:

- `docs/reports/team1/AI_TEAM_SYSTEM_KICKOFF_TRANHATAM_COM_2026-04-24.md`
