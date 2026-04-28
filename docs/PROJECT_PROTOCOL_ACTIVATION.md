# PROJECT PROTOCOL ACTIVATION

## Purpose

Explain how to activate the AI team system in a real repo without turning it into an unsafe autopilot.

## 1. Activation order

1. create or receive a task through GitHub issue
2. classify the task:
   - feature
   - bug
   - release blocker
   - docs or reporting
3. load:
   - `docs/AI_TEAM_EXECUTION_SYSTEM.md`
   - `docs/PROJECT_CONTEXT_ENGINE.md`
   - `docs/PROJECT_EXECUTION_BOARD.md`
   - `docs/AI_MODEL_ROUTING_POLICY.md`
4. assign the entry role:
   - Architect for feature or blocker
   - Debugger for bug
5. produce plan
6. implement
7. review
8. test
9. document
10. open PR
11. require human approval before merge or release

## 2. Git branch rule

Suggested branch pattern:

- `OMCODE/<lane>-<short-slug>`

Examples:

- `OMCODE/tranhatam-pay-gate`
- `OMCODE/mail-proof-wave1`
- `OMCODE/teamd-activation-packet`

## 3. PR rule

No AI-generated PR is complete without:

- summary
- problem
- exact changes
- test evidence
- risks
- rollback plan

Use:

- `.github/PULL_REQUEST_TEMPLATE.md`

## 4. Safety rule

The AI team system may automate:

- task analysis
- branch creation
- code generation
- test execution
- draft PR generation
- docs updates

The AI team system may not autonomously:

- merge to production
- rotate or invent secrets
- change production infrastructure core without explicit human action
- claim live readiness without evidence

## 5. First activation in this repo

The first mandatory activation of this system is:

- `tranhatam.com`
- payment activation
- mail proof
- Team 1 gate closure

Why this first:

- it already has active reports
- the blockers are concrete
- the lanes are known
- success criteria are evidence-based

## 6. Required first-activation outputs

The first activation is only considered complete when:

1. Team 2 confirms live production probe pass
2. Team B confirms runtime handoff and canonical row persistence
3. Team D completes the activation packet truth
4. Team Email SMTP completes delivery proof
5. Team 1 accepts the checkpoint

## 7. Session reporting rule

Every active team must report after each session.

Use:

- `docs/AI_TEAM_KICKOFF_AND_SESSION_REPORTING_STANDARD.md`

For the first activation kickoff:

- `docs/reports/team1/AI_TEAM_SYSTEM_KICKOFF_TRANHATAM_COM_2026-04-24.md`

No state change is accepted until it exists in a session report or an updated evidence file.

## 8. Rollout rule for future teams

After `tranhatam.com` is stable, reuse the same system for other `iai.one` lanes by changing only:

- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- `docs/AI_AUTONOMOUS_CONFIG.json`
- the team-specific kickoff directive

Do not fork the workflow unless the release boundary is materially different.
