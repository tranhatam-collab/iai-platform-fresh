# AI MODEL ROUTING POLICY

## Purpose

Route the right model to the right task inside the `iai.one` execution system.

This policy is designed to be executable with currently available OpenAI-first tooling, while still leaving room for an external long-context QA pass if the project later adds one.

## 1. Primary routing

| role | primary model | use when | avoid when |
|---|---|---|---|
| Architect | `gpt-5.4` | architecture, cross-file planning, release blockers, ambiguous scope | trivial one-file fixes |
| Builder | `gpt-5.3-codex` | code changes, multi-file implementation, narrow refactors | pure reporting |
| Debugger | `gpt-5.3-codex` | failing tests, regressions, broken routes, probe mismatch | large ambiguous planning |
| Reviewer | `gpt-5.4` | risk review, architecture fit, release review | mechanical formatting |
| QA | `gpt-5.4-mini` | test matrix, checklist generation, evidence sweep, result normalization | deep architecture reasoning |
| Docs | `gpt-5.4-mini` | docs updates, board updates, changelog, next-step notes | code-heavy refactors |

## 2. Optional secondary routing

An external long-context QA model may be added later for:

- bulk doc sweeps
- long audit comparisons
- large-language compliance passes

It is optional.

The base system must work without it.

## 3. Task class routing

### Small task

Examples:

- wording fix
- one-file doc update
- narrow test addition

Preferred:

- `gpt-5.4-mini` for docs/checklists
- `gpt-5.3-codex` for code

### Medium task

Examples:

- multi-file feature in one lane
- route fix
- workflow update

Preferred:

- Architect: `gpt-5.4`
- Builder/Debugger: `gpt-5.3-codex`
- Reviewer: `gpt-5.4`

### Large task

Examples:

- cross-team release blocker
- architecture change
- AI system rollout

Preferred:

- Architect: `gpt-5.4`
- Builder/Debugger: `gpt-5.3-codex`
- Reviewer: `gpt-5.4`
- QA/Docs: `gpt-5.4-mini`

## 4. Fallback order

1. Retry the same model with tighter context.
2. Split the task into smaller bounded subtasks.
3. Move review or QA to a lighter model if the heavy model is not needed.
4. Escalate back to Architect if the task can no longer be defended coherently.

## 5. Cost policy

- use smaller models for reporting, formatting, and doc updates
- use heavier models only for planning, review, and ambiguous blockers
- do not spend high-reasoning capacity on simple file rewrites

## 6. Safety policy

No model may:

- change secrets directly
- approve production alone
- auto-merge to `main`
- rewrite unrelated work
- claim live readiness without evidence

