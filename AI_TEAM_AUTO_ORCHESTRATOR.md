# AI TEAM AUTO ORCHESTRATOR

## Universal Autonomous AI Team Orchestration System

- Version: 1.0
- Status: Production-ready template
- Scope: Any website, app, platform, repository, AI agent system, or multi-domain ecosystem
- Owner: Founder / Product Owner / Tech Lead
- Purpose: Coordinate multiple AI agents as a disciplined development team that can plan, build, test, review, document, and prepare releases with controlled cost, quality, and evidence.

---

## 0. Core Statement

This file defines how an AI development team should operate automatically.

The system must not behave like a loose chatbot.

It must behave like a controlled delivery organization.

Every task must be routed through:

```txt
Intake
→ Classification
→ Agent Assignment
→ Model Selection
→ Execution Plan
→ Implementation
→ Verification
→ Evidence
→ Documentation Update
→ Human Approval if needed
```

---

## 1. Primary Goal

The goal is to create an AI team that can:

1. Understand project context quickly.
2. Classify tasks correctly.
3. Select the right agent.
4. Select the right model tier.
5. Execute with minimal context and credit.
6. Prevent uncontrolled changes.
7. Produce evidence for completion.
8. Update project memory and execution board.
9. Escalate to human approval when needed.
10. Keep the project moving toward production quality.

---

## 2. Required Companion Files

This orchestrator should work together with:

```txt
docs/PROJECT_CONTEXT_ENGINE.md
docs/PROJECT_EXECUTION_BOARD.md
docs/PROJECT_PROTOCOL_ACTIVATION.md
docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md
docs/AI_AUTO_CREDIT_MANAGER.md
docs/MASTER_DEV_EXECUTION_PROTOCOL_2026.md
```

If these files do not exist, the orchestrator must first propose creating them.

---

## 3. System Architecture

```txt
User / Founder / Team
        ↓
AI Team Auto Orchestrator
        ↓
Task Classifier
        ↓
Agent Router
        ↓
Model Router
        ↓
Tool Permission Layer
        ↓
Execution Pipeline
        ↓
Verification Layer
        ↓
Evidence + Context Update
        ↓
Human Approval / Release
```

---

## 4. Agent Roles

The orchestrator may call the following agents.

### 4.1 Intake Agent

Purpose:

- receive task
- identify missing information
- classify the request
- prevent vague execution

Best model tier:

- Mini / Fast model

Output:

- task summary
- task type
- risk level
- missing information
- recommended next step

---

### 4.2 Context Agent

Purpose:

- read PROJECT_CONTEXT_ENGINE.md
- identify current project state
- identify active files
- avoid re-reading unnecessary context
- produce compact context summary

Best model tier:

- Mini for normal context
- Long-context model for large project scan

Output:

- current project understanding
- active constraints
- relevant files
- context summary

---

### 4.3 Architect Agent

Purpose:

- design solution
- define boundaries
- identify dependencies
- split work into executable slices
- prevent architecture drift

Best model tier:

- Advanced reasoning model

Output:

- architecture analysis
- implementation plan
- risks
- approval checkpoint

Rules:

- must not write code before plan is accepted
- must mark assumptions clearly

---

### 4.4 Product Agent

Purpose:

- clarify user value
- define feature outcome
- check pricing/business impact
- define user flow
- prevent building features without purpose

Best model tier:

- Mini for simple product tasks
- Reasoning for high-impact decisions

Output:

- user problem
- intended outcome
- acceptance criteria
- non-goals

---

### 4.5 Builder Agent

Purpose:

- implement approved plan
- write full files
- modify only necessary files
- keep implementation minimal and testable

Best model tier:

- Coding model

Output:

- changed files
- full file output or PR-ready patch
- implementation notes
- manual test steps

Rules:

- no silent architecture change
- no unrelated refactor
- no mock logic unless requested

---

### 4.6 Debugger Agent

Purpose:

- reproduce problem
- find root cause
- apply minimal fix
- prevent repeated bugs

Best model tier:

- Coding model first
- Reasoning model if root cause unclear

Output:

- root cause
- affected files
- minimal fix
- regression test plan

---

### 4.7 Reviewer Agent

Purpose:

- review code quality
- detect scope drift
- detect security/payment/auth risk
- verify alignment with project protocol

Best model tier:

- Mini for low-risk changes
- Reasoning for high-risk changes

Output:

- pass/fail
- critical issues
- medium issues
- low issues
- required changes before release

---

### 4.8 QA Agent

Purpose:

- define test plan
- verify acceptance criteria
- check edge cases
- confirm release readiness

Best model tier:

- Mini for checklist
- Coding model for test code
- Reasoning for critical workflows

Output:

- test checklist
- tested cases
- expected results
- remaining risk

---

### 4.9 Security Agent

Purpose:

- review secrets
- auth
- permissions
- webhook verification
- data exposure
- destructive operations

Best model tier:

- Advanced reasoning model

Output:

- security risks
- required mitigations
- release blockers

Must be invoked when task touches:

- secrets
- auth
- payment
- webhook
- user data
- admin permissions
- production deploy

---

### 4.10 DevOps Agent

Purpose:

- CI/CD
- Cloudflare
- Vercel
- Netlify
- GitHub Actions
- DNS
- environment variables
- rollback

Best model tier:

- Coding model for scripts
- Reasoning model for production changes

Output:

- deploy plan
- required secrets
- commands
- rollback plan
- smoke test checklist

---

### 4.11 Docs Agent

Purpose:

- update context engine
- update changelog
- write runbook
- write release notes
- maintain project memory

Best model tier:

- Mini for simple docs
- Coding/Reasoning for technical docs

Output:

- docs changed
- context update
- next step
- decision log

---

### 4.12 Finance / Payment Agent

Purpose:

- pricing
- Stripe
- PayOS
- VietQR
- invoices
- webhooks
- subscriptions
- entitlement logic

Best model tier:

- Advanced reasoning model for plan
- Coding model for implementation
- Reasoning model for review

Must be invoked when task touches:

- checkout
- billing
- webhook
- invoice
- subscription
- entitlement
- tax/compliance related payment claims

---

## 5. Default Team Size

For most professional web systems, use 6 core agents:

```txt
1. Intake Agent
2. Context Agent
3. Architect Agent
4. Builder Agent
5. Reviewer Agent
6. Docs Agent
```

For production systems, add:

```txt
7. QA Agent
8. DevOps Agent
```

For high-risk systems, add:

```txt
9. Security Agent
10. Finance / Payment Agent
```

Recommended maximum:

```txt
6 to 10 agents
```

Do not create many agents with overlapping responsibilities.

---

## 6. Task Classification

Every task must be classified before execution.

### Type A — Tiny

Examples:

- explain command
- fix typo
- summarize short text
- create small note

Agents:

- Intake
- Docs if needed

Model:

- Mini

---

### Type B — Small

Examples:

- edit one file
- small UI change
- small docs update
- simple bug with clear cause

Agents:

- Intake
- Builder
- Reviewer

Model:

- Mini first
- Coding if code required

---

### Type C — Standard

Examples:

- build API endpoint
- add UI component
- fix normal bug
- update docs and code together

Agents:

- Intake
- Context
- Builder
- Reviewer
- Docs

Model:

- Coding

---

### Type D — Complex

Examples:

- multi-file feature
- architecture change
- database model change
- multi-step workflow

Agents:

- Intake
- Context
- Architect
- Builder
- QA
- Reviewer
- Docs

Model:

- Reasoning for plan
- Coding for build
- Mini for docs

---

### Type E — High Risk

Examples:

- payment
- auth
- security
- production deployment
- DNS
- secrets
- user data
- destructive migration

Agents:

- Intake
- Context
- Architect
- Security
- DevOps
- Builder
- QA
- Reviewer
- Docs

Model:

- Reasoning for plan and review
- Coding for implementation

Human approval:

- required

---

## 7. Risk Levels

### R1 — Low

- no production risk
- easy rollback
- no sensitive data
- no payment/auth impact

Allowed:

- Mini or Coding

---

### R2 — Medium

- normal code change
- testable
- limited scope

Allowed:

- Coding

---

### R3 — High

- payment
- auth
- database
- deploy
- user-facing production workflow

Allowed:

- Reasoning plan
- Coding implementation
- Reasoning or human review

Human approval:

- recommended

---

### R4 — Critical

- secrets
- legal/compliance
- production billing
- data deletion
- DNS changes
- irreversible migration

Allowed:

- Reasoning plan only until human approval

Human approval:

- mandatory

---

## 8. Model Routing

The orchestrator must use model classes, not vendor names.

### Model Classes

```txt
T0 Local / Open Source / Free
T1 Mini / Fast / Low Cost
T2 Coding Workhorse
T3 Advanced Reasoning
T4 Specialist
```

### Routing Rules

```txt
Tiny task → T1
Small task → T1 or T2
Standard task → T2
Complex task → T3 plan + T2 build
High-risk task → T3 plan + approval + T2 build + T3 review
Large context task → T4 long context or T1 summary first
Image/media task → T4 specialist
```

### De-escalation

After T3 completes plan:

```txt
Use T2 for build.
Use T1 for summary.
Use T1 for changelog.
Use T3 again only for risky review.
```

---

## 9. Tool Permission Matrix

The orchestrator must not allow every agent to do everything.

| Action | Allowed Agent | Approval Required |
|---|---|---|
| Read docs | All | No |
| Read code | Context, Architect, Builder, Reviewer | No |
| Modify code | Builder, Debugger | No for R1/R2, Yes for R3/R4 |
| Modify docs | Docs, Builder | No |
| Create branch | DevOps, Builder | No |
| Create PR | DevOps, Builder | No |
| Merge PR | Human | Yes |
| Deploy production | DevOps | Yes |
| Change DNS | DevOps | Yes |
| Change secrets | DevOps/Security | Yes |
| Delete data | Human + Security | Yes |
| Payment config | Finance/Payment + Security | Yes |
| Send customer email | Docs/Product | Yes if external |
| Update pricing | Product/Finance | Yes |
| Run destructive command | Human | Yes |

---

## 10. Standard Execution Pipeline

### Step 1 — Intake

Output required:

```txt
Task summary:
Task type:
Risk level:
Missing information:
Recommended agents:
Recommended model classes:
```

---

### Step 2 — Context

Output required:

```txt
Project state:
Relevant files:
Constraints:
Active decisions:
```

---

### Step 3 — Plan

Output required:

```txt
Implementation plan:
Affected files:
Acceptance criteria:
Risks:
Approval needed: yes/no
```

---

### Step 4 — Build

Output required:

```txt
Changed files:
Full file output or patch:
Notes:
```

---

### Step 5 — Verify

Output required:

```txt
Test plan:
Manual test steps:
Edge cases:
Known limitations:
```

---

### Step 6 — Review

Output required:

```txt
Review status:
Critical issues:
Required fixes:
Release readiness:
```

---

### Step 7 — Document

Output required:

```txt
Context update:
Changelog:
Next step:
Evidence links:
```

---

## 11. Master Orchestration Prompt

Use this for any task:

```txt
Follow AI_TEAM_AUTO_ORCHESTRATOR.md strictly.

Project:
[project name]

Task:
[task]

Rules:
- classify task first
- select required agents
- select model tier by cost and risk
- use PROJECT_CONTEXT_ENGINE.md before old chat history
- do not modify production, secrets, DNS, payment, or auth without approval
- produce evidence for completion
- update context after meaningful progress

Start with Intake Agent.
Do not implement until the plan is clear.
```

---

## 12. Full Auto Mode Prompt

Use only for safe non-production tasks:

```txt
Follow AI_TEAM_AUTO_ORCHESTRATOR.md.

Run full pipeline automatically for this low-risk task:

1. Intake
2. Context
3. Plan
4. Build
5. Verify
6. Review
7. Docs update

Task:
[task]

Constraints:
- no production deploy
- no secrets
- no payment/auth changes
- no destructive operations
- full file output only
```

---

## 13. Human Approval Mode Prompt

Use for R3/R4 tasks:

```txt
Follow AI_TEAM_AUTO_ORCHESTRATOR.md.

This task may be high risk.

Do not implement yet.

Task:
[task]

Run only:
1. Intake
2. Context
3. Architect plan
4. Risk review
5. Approval checkpoint

Wait for human approval before implementation.
```

---

## 14. Agent Output Header

Every AI response must start with:

```txt
Agent:
Task type:
Risk level:
Selected model tier:
Context used:
Approval required:
Next action:
```

This makes execution auditable.

---

## 15. Context Management

To avoid context overflow:

1. Use PROJECT_CONTEXT_ENGINE.md first.
2. Use active file list.
3. Do not read the full repo unless required.
4. Summarize large files.
5. Restart sessions when context becomes too large.
6. Store decisions in context engine.
7. Store tasks in execution board.

If context becomes too large:

```txt
Stop.
Create SESSION_SUMMARY.
Restart with compact context.
```

---

## 16. Credit Control

The orchestrator must follow AI_AUTO_CREDIT_MANAGER.md.

Default policy:

```txt
70% cheap/mini/local model
20% coding model
10% advanced reasoning model
```

Heavy model usage requires reason.

Heavy model is allowed automatically only for:

- architecture
- security
- payment
- auth
- production incident
- failed cheaper attempt with evidence

---

## 17. Git Workflow

For code tasks:

```txt
1. Create branch
2. Implement scoped changes
3. Run tests
4. Create PR
5. Attach evidence
6. Human reviews
7. Merge
8. Deploy if approved
```

Suggested branch names:

```txt
feature/<project>-<short-name>
fix/<project>-<short-name>
docs/<project>-<short-name>
chore/<project>-<short-name>
```

Commit messages:

```txt
feat:
fix:
docs:
refactor:
test:
chore:
```

---

## 18. Release Gate

Before release, the orchestrator must confirm:

```txt
[ ] Scope delivered
[ ] Acceptance criteria passed
[ ] Tests or manual verification provided
[ ] No unresolved R3/R4 risks
[ ] Rollback plan exists
[ ] Release evidence packet created
[ ] Context engine updated
[ ] Human approval received if required
```

No release without evidence.

---

## 19. Evidence Requirements

Every completed task must include:

```txt
Files changed:
Tests run:
Manual verification:
Screenshots/logs if relevant:
Known risks:
Rollback plan if production:
Next step:
```

For production releases, complete:

```txt
DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md
```

---

## 20. Error Handling

If AI fails:

### If task unclear

```txt
Return to Intake Agent.
Ask clarifying question or propose assumptions.
```

### If implementation fails

```txt
Send to Debugger Agent.
```

### If architecture conflict appears

```txt
Send to Architect Agent.
Pause implementation.
```

### If security/payment risk appears

```txt
Send to Security Agent or Finance/Payment Agent.
Require approval.
```

### If repeated failure occurs

```txt
Stop.
Create system correction note.
Update PROJECT_EXECUTION_BOARD.md.
```

---

## 21. System Correction Rule

If the same problem occurs more than twice:

Do not only fix the output.

Fix the system that produced the problem.

Update one or more:

```txt
PROJECT_CONTEXT_ENGINE.md
PROJECT_EXECUTION_BOARD.md
AI_TEAM_AUTO_ORCHESTRATOR.md
AI_AUTO_CREDIT_MANAGER.md
MASTER_DEV_EXECUTION_PROTOCOL_2026.md
```

---

## 22. Autonomous Boundaries

The AI team may autonomously:

- summarize docs
- write drafts
- create low-risk files
- propose architecture
- write tests
- prepare PRs
- update changelog
- update context engine

The AI team may not autonomously:

- deploy production
- merge PR
- rotate secrets
- delete data
- change DNS
- charge customers
- send external legal/payment claims
- alter pricing public pages
- modify auth/payment in production without approval

---

## 23. Project Setup Checklist

For every new project, create:

```txt
docs/PROJECT_CONTEXT_ENGINE.md
docs/PROJECT_EXECUTION_BOARD.md
docs/PROJECT_PROTOCOL_ACTIVATION.md
docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md
docs/AI_AUTO_CREDIT_MANAGER.md
docs/AI_TEAM_AUTO_ORCHESTRATOR.md
```

Optional:

```txt
docs/AI_MODEL_ROUTING_POLICY.md
docs/AI_TOOL_PERMISSION_MATRIX.md
docs/AI_AGENT_REGISTRY.md
```

---

## 24. AI Agent Registry Template

Use this section to define project-specific agents.

```md
## Agent Registry

### Architect Agent
Owner:
Model tier:
Tools allowed:
Approval required for:

### Builder Agent
Owner:
Model tier:
Tools allowed:
Approval required for:

### Reviewer Agent
Owner:
Model tier:
Tools allowed:
Approval required for:

### QA Agent
Owner:
Model tier:
Tools allowed:
Approval required for:

### DevOps Agent
Owner:
Model tier:
Tools allowed:
Approval required for:

### Docs Agent
Owner:
Model tier:
Tools allowed:
Approval required for:
```

---

## 25. Example Workflow: Build Payment Webhook

Task:

```txt
Build Stripe webhook endpoint.
```

Classification:

```txt
Type: High Risk
Risk: R3
Agents: Intake, Context, Architect, Finance/Payment, Security, Builder, QA, Reviewer, Docs
Model: T3 plan, T2 build, T3 review
Approval: required before production deploy
```

Pipeline:

```txt
1. Intake defines scope.
2. Context loads payment architecture.
3. Architect designs endpoint.
4. Payment Agent checks Stripe flow.
5. Security Agent checks signature verification.
6. Builder writes endpoint.
7. QA defines webhook test.
8. Reviewer checks risk.
9. Docs updates context.
10. Human approves release.
```

---

## 26. Example Workflow: Update Landing Page Copy

Task:

```txt
Update hero copy on homepage.
```

Classification:

```txt
Type: Small
Risk: R1
Agents: Intake, Builder, Reviewer, Docs
Model: T1 or T2
Approval: not required unless public brand claim changes
```

Pipeline:

```txt
1. Intake confirms scope.
2. Builder edits file.
3. Reviewer checks copy.
4. Docs records change if needed.
```

---

## 27. Example Workflow: Deploy Cloudflare Worker

Task:

```txt
Deploy updated Worker to production.
```

Classification:

```txt
Type: High Risk
Risk: R3/R4 depending scope
Agents: DevOps, QA, Reviewer, Docs
Model: T2 or T3
Approval: required
```

Pipeline:

```txt
1. DevOps prepares deploy command.
2. QA verifies smoke test.
3. Reviewer checks rollback.
4. Human approves deploy.
5. DevOps deploys.
6. Docs updates release record.
```

---

## 28. Monitoring and Reporting

Every active project should have weekly AI team report:

```md
# AI Team Weekly Report

Project:
Week:

## Completed
-

## In Progress
-

## Blockers
-

## Risks
-

## AI Usage
- Mini/local usage:
- Coding usage:
- Reasoning usage:
- High-cost reasons:

## Quality
- PRs reviewed:
- Bugs found:
- Repeated issues:

## Next Week
-
```

---

## 29. Minimum Implementation for Dev Team

If implementing this in code, create modules:

```txt
/ai/orchestrator/intake.ts
/ai/orchestrator/classifyTask.ts
/ai/orchestrator/selectAgents.ts
/ai/orchestrator/selectModelTier.ts
/ai/orchestrator/permissionCheck.ts
/ai/orchestrator/executePipeline.ts
/ai/orchestrator/verifyOutput.ts
/ai/orchestrator/updateContext.ts
/ai/orchestrator/logUsage.ts
```

Minimum task object:

```ts
type OrchestratedTask = {
  id: string;
  project: string;
  title: string;
  description: string;
  taskType: "Tiny" | "Small" | "Standard" | "Complex" | "HighRisk";
  riskLevel: "R1" | "R2" | "R3" | "R4";
  requiredAgents: string[];
  selectedModelTiers: string[];
  requiresApproval: boolean;
  status: "INTAKE" | "PLANNING" | "BUILDING" | "VERIFYING" | "REVIEWING" | "DONE" | "BLOCKED";
};
```

---

## 30. Final Rule

The AI team is allowed to move fast only when scope, risk, context, model, and evidence are clear.

If any of these are unclear:

```txt
Stop.
Clarify.
Plan again.
```

A fast uncontrolled AI team creates chaos.

A controlled AI team creates compounding execution power.
