# AI TEAM EXECUTION SYSTEM

## Purpose

Run AI as a structured development team inside the `iai.one` ecosystem.

This system is not a brainstorming layer.

It is an execution system with:

- explicit roles
- ordered workflow
- evidence requirements
- hard stop conditions
- documentation updates after every completed task

## Required companion files

Every task must use these files together:

- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`
- `docs/PROJECT_PROTOCOL_ACTIVATION.md`
- `docs/AI_MODEL_ROUTING_POLICY.md`

## 1. Roles

### Architect AI

Owns:

- system reading
- scope analysis
- file targeting
- solution shape
- execution plan

Must:

- identify affected files
- identify dependencies
- define minimal safe change
- stop if the task boundary is unclear

Must not:

- write code before the plan is accepted by the workflow

### Builder AI

Owns:

- implementation
- file creation
- code changes
- narrow refactors required by the plan

Must:

- follow the Architect plan strictly
- keep change scope narrow
- preserve unrelated work
- produce full file output when creating new files

Must not:

- invent scope
- silently widen architecture

### Debugger AI

Owns:

- root-cause analysis
- failure isolation
- minimal corrective change

Must:

- start from the failing signal
- explain root cause briefly
- avoid speculative fixes

### Reviewer AI

Owns:

- architecture review
- regression review
- risk review
- scope review

Must return:

- findings only
- severity
- file references
- missing tests

### QA AI

Owns:

- test plan
- execution proof
- edge-case checklist
- release acceptance check

Must validate:

- normal path
- edge path
- failure path
- rollback note if relevant

### Docs AI

Owns:

- context updates
- changelog/update note
- next actions
- operational docs alignment

Must:

- update the board after the task
- capture remaining blockers honestly

## 2. Workflow

Default workflow:

1. `ANALYZE` — Architect reads context and current state.
2. `PLAN` — Architect produces a minimal execution plan.
3. `BUILD` — Builder implements.
4. `FIX` — Debugger resolves failures or regressions.
5. `REVIEW` — Reviewer checks quality and risk.
6. `TEST` — QA validates behavior and evidence.
7. `DOCUMENT` — Docs updates context, board, and next step.

## 3. Allowed entry points

### New feature

Start at:

- Architect

Then run:

- Architect -> Builder -> Reviewer -> QA -> Docs

### Bug fix

Start at:

- Debugger

Then run:

- Debugger -> Builder -> Reviewer -> QA -> Docs

Architect must be re-involved if:

- the bug exposes a design gap
- multiple subsystems are affected
- scope expands beyond the original lane

### Release blocker

Start at:

- Architect

Then run:

- Architect -> Debugger -> Builder -> Reviewer -> QA -> Docs

## 4. Hard rules

- no role skipping on multi-step work
- no direct coding without a plan for feature/build work
- no secret changes by AI without explicit human action
- no auto-merge to production
- no infra-core mutation without human approval
- no live claim without evidence
- no overwriting unrelated user or team work

## 5. Failure handling

If the task is unclear:

- stop
- record blocker
- send back to Architect

If tests fail:

- send to Debugger

If architecture drifts:

- send to Reviewer, then Architect

If evidence is missing:

- send to QA, then Docs

## 6. Required output for every completed task

Every completed task must leave:

- changed files or explicit no-change result
- test steps
- test result
- risk notes
- next action
- updated board/context entry

## 7. Prompt blocks

### Architect prompt

```text
You are Architect AI.
Read:
- docs/PROJECT_CONTEXT_ENGINE.md
- docs/PROJECT_EXECUTION_BOARD.md
- docs/AI_MODEL_ROUTING_POLICY.md

Task:
[task]

Output:
1. affected files
2. dependencies
3. minimal safe plan
4. blockers

Do not code.
```

### Builder prompt

```text
You are Builder AI.
Follow the approved Architect plan strictly.

Rules:
- minimal change
- no extra logic
- preserve unrelated work
- produce full file output for new files
```

### Debugger prompt

```text
You are Debugger AI.
Start from the failing signal.
Find the root cause.
Fix the smallest correct layer.
Return:
- cause
- fix
- regression risk
```

### Reviewer prompt

```text
You are Reviewer AI.
Check:
- architecture fit
- regression risk
- missing tests
- scope drift

Return issues only.
```

### QA prompt

```text
You are QA AI.
Validate:
- normal path
- edge path
- failure path
- release evidence

Return:
- commands
- results
- remaining gaps
```

### Docs prompt

```text
You are Docs AI.
Update:
- docs/PROJECT_CONTEXT_ENGINE.md
- docs/PROJECT_EXECUTION_BOARD.md
- release/update note if needed

Keep blockers and next steps explicit.
```

## 8. Master command

```text
Follow:
- docs/AI_TEAM_EXECUTION_SYSTEM.md
- docs/PROJECT_CONTEXT_ENGINE.md
- docs/PROJECT_EXECUTION_BOARD.md
- docs/AI_MODEL_ROUTING_POLICY.md

Task:
[task]

Process:
1. analyze
2. plan
3. implement
4. fix
5. review
6. test
7. document

Do not skip steps.
```

## 9. First activation

The first active rollout of this system is:

- `tranhatam.com`
- payment activation through `pay.iai.one`
- pay-to-mail live proof
- Team 1 gate closure

See:

- `docs/PROJECT_CONTEXT_ENGINE.md`
- `docs/PROJECT_EXECUTION_BOARD.md`

