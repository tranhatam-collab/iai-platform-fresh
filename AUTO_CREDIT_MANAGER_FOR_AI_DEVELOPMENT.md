# AUTO CREDIT MANAGER FOR AI DEVELOPMENT

## Universal Model Routing, Credit Control, and Autonomous AI Usage Policy

- Version: 1.0
- Status: Production-ready template
- Scope: Any project, repository, team, AI agent, coding assistant, or automation system
- Owner: Founder / Product Owner / Tech Lead
- Purpose: Reduce AI credit waste, select the right model automatically, prevent context overflow, and keep AI output accurate, fast, and cost-effective.

---

## 0. Core Principle

AI credit must be treated as an execution resource.

Do not use the strongest model for every task.

A professional AI development system must route work by:

- task complexity
- risk level
- required accuracy
- context size
- expected output
- cost sensitivity
- urgency
- production impact

The goal is not to use the cheapest model.

The goal is to use the lowest-cost model that can complete the task safely and correctly.

---

## 1. What This File Controls

This file defines:

1. How AI should classify tasks.
2. Which model tier should be used.
3. When to switch models automatically.
4. When to stop and reset context.
5. How to prevent credit waste.
6. How to handle large codebases.
7. How to manage agent loops.
8. How to report usage and risk.

This file should be used together with:

- PROJECT_CONTEXT_ENGINE.md
- PROJECT_EXECUTION_BOARD.md
- MASTER_DEV_EXECUTION_PROTOCOL_2026.md
- AI_TEAM_EXECUTION_SYSTEM.md
- AI_MODEL_ROUTING_POLICY.md

---

## 2. Model Tier System

Use model tiers instead of hardcoding one provider.

### T0 — Local / Open Source / Free Model

Use for:

- simple summaries
- spelling checks
- intent classification
- cheap routing
- first-pass analysis
- simple documentation cleanup
- non-critical internal notes

Examples:

- local Ollama model
- Cloudflare Workers AI small model
- Hugging Face hosted model
- cheap OpenRouter model

Do not use for:

- payment logic
- security decisions
- production code
- legal wording
- final review

---

### T1 — Mini / Fast / Low-Cost Model

Use for:

- small fixes
- short explanations
- simple code generation
- test case suggestions
- changelog summaries
- PR summaries
- simple refactor suggestions
- prompt compression
- context summarization

Default use percentage:

- 50% to 70% of all AI tasks

Examples:

- GPT mini class model
- Claude Haiku class model
- Gemini Flash class model

---

### T2 — Coding Workhorse Model

Use for:

- normal coding
- multi-file implementation
- API creation
- UI component building
- refactor up to medium complexity
- bug fixes with clear error
- test writing
- integration work

Default use percentage:

- 20% to 35% of all AI tasks

Examples:

- GPT Codex class model
- Claude Sonnet class model
- strong coding model in OpenCode, Copilot, Cursor, or API router

---

### T3 — Advanced Reasoning Model

Use for:

- architecture
- difficult debugging
- payment/security review
- complex data model decisions
- system design
- agent orchestration
- cross-repo changes
- production risk analysis
- final review before release

Default use percentage:

- 5% to 15% of all AI tasks

Examples:

- GPT Thinking / frontier reasoning model
- Claude Opus class model
- Gemini Pro class model
- other top reasoning models

---

### T4 — Specialist Model

Use only when task requires a specific capability:

- image generation
- video generation
- long-context document analysis
- legal/compliance review
- code security scanning
- translation refinement
- database query optimization
- vector search / embedding
- voice/audio processing

Examples:

- GPT Image / Imagen for images
- embedding models for semantic search
- security-specialized scanners
- long-context models

---

## 3. Automatic Routing Rules

AI must classify every task before choosing a model.

### Step 1 — Classify Task Size

Small task:

- one file
- under 100 lines changed
- no architecture impact
- no payment/security risk

Use: T1

Medium task:

- 2 to 5 files
- clear acceptance criteria
- moderate logic
- no production risk

Use: T2

Large task:

- more than 5 files
- architecture impact
- unclear dependency
- cross-module logic

Use: T3 for planning, then T2 for implementation

Critical task:

- payment
- auth
- security
- production deploy
- data migration
- legal wording
- user entitlement
- webhook verification
- billing

Use: T3 first, then T2, then T3 review

Bulk task:

- reading many files
- summarizing docs
- scanning logs
- extracting data

Use: T0 or T1 first, then escalate only if needed

---

## 4. Model Selection Table

| Task Type | First Model | Escalate To | Notes |
|---|---|---|---|
| Summarize file | T1 | T2 | Never use T3 first |
| Summarize repo | T1 / long-context T4 | T3 | Use memory summary |
| Small bug fix | T1 | T2 | If root cause unclear, escalate |
| Normal feature | T2 | T3 | T3 plans only if architecture impact |
| Complex architecture | T3 | none | Do not implement until approved |
| UI component | T2 | T1 for cleanup | Use T2 for structure |
| CSS/style fix | T1 | T2 | Keep cheap |
| API endpoint | T2 | T3 if auth/payment |
| Payment webhook | T3 plan + T2 build | T3 review | Critical |
| Email webhook | T2 | T3 if security-sensitive |
| Auth/RBAC | T3 plan + T2 build | T3 review | Critical |
| Cloudflare deploy | T2 | T3 if production risk |
| PR review | T1 first | T3 for high-risk |
| Security review | T3 | specialist scanner | No cheap-only review |
| Documentation | T1 | T2 | T3 only for governance |
| Book/content editing | T2 | T3 for full structure |
| Image generation | T4 | none | Use image model |
| Data extraction | T0/T1 | T4 long context | Keep cheap |
| Test writing | T2 | T3 for critical flows |
| Release evidence | T2 | T3 final audit | Must be factual |

---

## 5. Escalation Rules

Escalate to a stronger model only when:

1. The current model cannot identify root cause.
2. Output contains repeated errors.
3. Architecture impact is detected.
4. Security/payment/auth risk appears.
5. The task requires cross-module reasoning.
6. The task has failed more than two attempts.
7. Production deployment is involved.
8. The answer requires high confidence.

Do not escalate because:

- user is impatient
- model output is short
- task feels important but is actually simple
- AI wants to over-explain
- context was poorly prepared

First improve the prompt and reduce scope.

---

## 6. De-Escalation Rules

Switch to a cheaper model when:

1. The plan is already locked.
2. Only formatting remains.
3. Only documentation cleanup remains.
4. Only changelog/release note is needed.
5. Only one small bug remains.
6. Output is repetitive.
7. The task is now mechanical.

Example:

T3 creates architecture.
T2 implements.
T1 writes changelog.
T1 summarizes PR.
T3 reviews only if high risk.

---

## 7. Context Control Rules

Context is the largest hidden cost.

AI must not load full project history unless required.

### Always use:

- PROJECT_CONTEXT_ENGINE.md
- current task
- active file list
- relevant code only
- latest decision log

### Never use:

- full old conversation history
- entire repo dump
- repeated pasted code
- unrelated docs
- stale plans

### If context is too large:

1. Stop.
2. Summarize current state.
3. Create a compact memory block.
4. Restart with only the memory block and active files.

---

## 8. Turn Limit Rules

Agent loops burn credit quickly.

Default limits:

- small task: max 2 turns
- medium task: max 4 turns
- large task: max 6 turns
- critical task: max 8 turns with approval checkpoints

If the model exceeds the turn limit:

1. Stop.
2. Summarize what failed.
3. Reduce scope.
4. Restart with a stronger prompt or stronger model.

Never allow infinite agent loops.

---

## 9. Prompt Compression Standard

Every prompt should follow this format:

```txt
Context:
[short project/module context]

Task:
[clear task]

Files:
[relevant files only]

Constraints:
- minimal change
- full file output if implementing
- no mock unless requested
- no architecture change without approval

Output:
[exact expected output]
```

Avoid:

- long storytelling
- repeated background
- vague commands
- “do everything”
- mixing unrelated tasks

---

## 10. Standard Commands

### Classify Before Work

```txt
Follow AUTO_CREDIT_MANAGER_FOR_AI_DEVELOPMENT.md.

Classify this task by:
- size
- risk
- required model tier
- expected token usage
- whether escalation is needed

Do not implement yet.

Task:
[task]
```

---

### Cheap First Analysis

```txt
Use the cheapest safe model.

Analyze only:
- task objective
- relevant files
- risk level
- smallest plan

Do not code.
```

---

### Workhorse Implementation

```txt
Use coding workhorse model.

Implement the approved plan.

Rules:
- full files only
- minimal change
- no unrelated refactor
- preserve architecture
- include test steps
```

---

### Advanced Review

```txt
Use advanced reasoning model.

Review this change for:
- architecture risk
- security risk
- payment/auth risk
- data consistency
- production readiness

Return issues only.
```

---

### Reset Context

```txt
Stop.

Context is too large or task is drifting.

Summarize:
1. what is known
2. what changed
3. what remains
4. next smallest task

Then restart with compact context only.
```

---

## 11. Credit Budget Policy

Each project should define a credit budget.

### Suggested default budgets

Small project:

- daily AI budget: low
- heavy model usage: max 10%

Medium project:

- daily AI budget: medium
- heavy model usage: max 15%

Large project:

- daily AI budget: controlled
- heavy model usage: max 20%
- requires usage report

Critical production system:

- heavy model allowed only for approved tasks
- all critical AI actions require evidence

---

## 12. Team Usage Rules

For teams:

1. Each task must have one AI session.
2. Do not mix unrelated tasks in one session.
3. Use one context engine per project.
4. Use one execution board per project.
5. Do not let each dev invent their own model routing.
6. All high-risk tasks require review by T3 model or human reviewer.
7. No AI claim of completion without evidence.

---

## 13. Agent Role Routing

### Architect Agent

Use:

- T3

Purpose:

- system design
- architecture
- high-risk planning

Must not:

- directly implement before approval

---

### Builder Agent

Use:

- T2

Purpose:

- code
- full file implementation
- integration

Escalate to T3 if:

- architecture becomes unclear
- security/payment risk appears

---

### Debugger Agent

Use:

- T2 first
- T3 if root cause unclear

Purpose:

- reproduce
- find root cause
- fix minimal

---

### Reviewer Agent

Use:

- T1 for low-risk PR
- T3 for high-risk PR

Purpose:

- review
- risk detection
- regression detection

---

### QA Agent

Use:

- T1 for checklist
- T2 for test code
- T3 for critical workflows

Purpose:

- test plan
- smoke test
- edge cases

---

### Docs Agent

Use:

- T1 for normal docs
- T2 for technical docs
- T3 for governance docs

Purpose:

- context engine
- changelog
- release notes
- runbooks

---

## 14. Production Safety Rules

Always use advanced review for:

- payment
- auth
- webhook
- database migration
- billing
- secrets
- DNS
- deployment
- user permissions
- data deletion
- legal/compliance text

AI must not perform destructive actions without explicit approval.

Examples of destructive actions:

- deleting database tables
- rotating production secrets
- changing DNS
- deploying to production
- disabling auth/security
- deleting files broadly
- overwriting history
- force pushing

---

## 15. Evidence Requirements

Before marking a task complete, AI must provide:

- files changed
- summary of change
- test evidence or manual test steps
- risk notes
- rollback notes for production changes

For production release:

- release evidence packet required
- smoke test required
- rollback plan required
- monitoring path required

---

## 16. Usage Report Template

Use this after meaningful AI work:

```md
## AI Usage Report

Task:
Date:
Owner:

### Classification
- Task size:
- Risk level:
- Model tier used:
- Escalation used: yes/no

### Work Completed
-

### Files Touched
-

### Evidence
-

### Credit Control
- Context minimized: yes/no
- Turn count:
- Heavy model used: yes/no
- Reason for heavy model:

### Risks
-

### Next Step
-
```

---

## 17. Auto-Switch Logic

Use this pseudo-logic in any implementation:

```txt
if task.risk in [payment, auth, security, production_deploy, data_migration]:
    use T3 for plan
    use T2 for implementation
    use T3 for review

elif task.size == small and task.risk == low:
    use T1

elif task.size == medium and task.risk in [low, medium]:
    use T2

elif task.size == large:
    use T3 for plan
    split task
    use T2 for each implementation slice

elif task.type in [summary, classification, formatting]:
    use T1 or T0

elif task.context_size == huge:
    use long-context T4 or summarize with T1 first

else:
    use T2
```

---

## 18. Example Model Map

Replace with your actual providers.

```json
{
  "T0": {
    "name": "Local or Open Source",
    "use_for": ["classification", "summaries", "cheap drafts"]
  },
  "T1": {
    "name": "Mini/Fast",
    "use_for": ["small fixes", "summaries", "docs cleanup", "PR summaries"]
  },
  "T2": {
    "name": "Coding Workhorse",
    "use_for": ["implementation", "debugging", "tests", "refactor"]
  },
  "T3": {
    "name": "Advanced Reasoning",
    "use_for": ["architecture", "security", "payment", "final review"]
  },
  "T4": {
    "name": "Specialist",
    "use_for": ["image", "embedding", "long-context", "security scanner"]
  }
}
```

---

## 19. Recommended File Placement

Place this file in every project:

```txt
docs/00_governance/AUTO_CREDIT_MANAGER_FOR_AI_DEVELOPMENT.md
```

or:

```txt
docs/AUTO_CREDIT_MANAGER_FOR_AI_DEVELOPMENT.md
```

Then reference it in:

- PROJECT_CONTEXT_ENGINE.md
- AI_TEAM_EXECUTION_SYSTEM.md
- PROJECT_EXECUTION_BOARD.md
- README.md

---

## 20. One-Line Rule

Use the cheapest model that can safely complete the task, and escalate only when evidence shows the task requires more reasoning, context, or accuracy.

---

## 21. Final Command

Before using any AI model, ask:

1. What is the smallest task?
2. What is the risk level?
3. What is the cheapest safe model?
4. What context is truly needed?
5. What evidence proves completion?

If these cannot be answered, do not spend credit yet.
