# IAI Platform - GitHub Remote Audit Handoff

- Handoff date: `2026-11-03` (`Asia/Ho_Chi_Minh`)
- Repository: `tranhatam-collab/iai-platform-fresh`
- Local workspace: `/Users/tranhatam/Documents/New project/iai-platform-worktree`
- Working branch: `security-remediation-20261006`
- Base and remote `main`: `930c7af5c1ee4d00e717f1502697e403f6e6aa66`
- Intended delivery: one review branch plus a draft pull request; no direct merge or production deployment
- Current handoff status: `BLOCKED_LOCAL_MATERIALIZATION`

## 1. Purpose

This handoff packages the complete local development state for independent review from another machine. It does not declare production readiness. Source, CI, deployment, runtime, provider evidence, operational evidence, and approval remain separate gates.

The branch must not be pushed until every local source file is materialized, the complete diff is inspectable, secret scanning is rerun over the complete set, and the repository quality and GitHub asset guards pass.

## 2. Source identity and current state

The active checkout is a normal repository on branch `security-remediation-20261006`. The branch currently points to the same base SHA as remote `main`; the branch itself has not yet been published.

The local Git object pack and multiple worktree files have been offloaded by macOS File Provider. At handoff preparation time:

- `58` tracked paths have worktree metadata different from the index.
- `45` of those tracked paths are readable locally.
- `13` changed tracked paths are `dataless` and cannot be read or hashed.
- `32` untracked candidates exist outside generated dependency/build directories.
- Several untracked source, workflow, fixture, and schema files are also `dataless`.
- The main Git pack is `compressed,dataless`, so full `git status`, `git log`, staging, commit, and hook execution cannot yet be trusted.

No clone-based reconstruction may be presented as complete: most dataless changed files have no size-matching version at the tips of existing remote branches.

## 3. Change streams awaiting complete review

### A. Security remediation and CI controls

- AI dispatcher, PR review, and release workflows.
- Source CI workflow and autonomous configuration.
- HTTP request URL validation and payment/event security tests.
- Pay worker security helper and deployment-gate document.
- Common surface server changes across app, developer, docs, flow, home, NFT, pay, root, and web.

### B. Verify runtime, quotas, and access boundaries

- Durable Object and quota enforcement changes.
- Worker route and binding updates.
- Runtime route and quota tests.
- Wrangler binding changes.

### C. Mail API and internal SMTP lane

- Mail API bootstrap, server, and internal SMTP changes.
- SMTP health/runtime package changes.
- Internal-first production example, compose definition, and smoke/rollback runbook.
- SMTP internal-backend integration tests.

The mail source work is not proof that `mail.iai.one` is operational. Live TLS identity, virtual-host routing, API health, authenticated send, provider delivery, and inbox receipt require fresh independent evidence.

### D. Web telemetry and application APIs

- Dashboard authentication/API/server changes.
- Web event-log and server changes.
- AI builder, feedback, onboarding, and event-security tests.
- Team 5 KPI smoke updates.

### E. NOOS commerce package

- NOOS web package, data, rendering, server, and entry-point changes.
- Commerce contract and mock-server changes.
- Schema, OpenAPI, catalog, entitlement, library, and webhook fixture set.
- Commerce contract/surface/stack tests.

### F. Payment runtime

- Pay surface server changes.
- `pay.iai.one` worker, database helper, security helper, and Wrangler configuration.
- Payment security and callback-related tests.

### G. Documentation and audit material

- `IAI_ONE_MASTER_HANDOFF_QA_2026-10-17.md` is part of the review context.
- Operational reports under `docs/**` remain local-only under the repository GitHub guard unless an explicit policy exception is independently approved.
- Raw secrets, inbox content, private provider receipts, local logs, generated build output, dependencies, and local coordination locks must not be pushed.

## 4. Dataless changed tracked files

These files must be materialized before any complete commit:

```text
apps/flow/src/server.ts
apps/home/src/server.ts
apps/verify-runtime/tests/quota-do.test.ts
apps/web/src/event-log.ts
pay.iai.one/src/lib/db.ts
scripts/noos-commerce-mock-server.mjs
tests/integration/dash-app-phase0.test.mjs
tests/integration/flow-api-source-of-truth.test.mjs
tests/integration/flow-mail-api-send.test.mjs
tests/integration/mail-api-bootstrap.test.mjs
tests/integration/nft-runtime-secure.test.mjs
tests/integration/noos-commerce-stack.test.mjs
tests/integration/web-onboarding-contract.test.mjs
```

Untracked dataless candidates include the source CI workflow, NOOS entry point, and portions of the commerce schema/fixture set. They must also be materialized and reviewed before staging.

## 5. Secret and publication controls

A redacted static scan was run over `60` readable modified/untracked files. It found no recognized raw GitHub token, AWS access key, payment live key, or private-key block. Generic secret-like assignments were references to environment bindings, required Compose substitutions, or test fixtures.

This is not a complete pass because dataless files were unavailable. Before staging:

1. Materialize every tracked and untracked candidate.
2. Rerun token/private-key/high-entropy scanning over the complete candidate set.
3. Confirm `.env` files remain ignored and examples contain placeholders only.
4. Confirm operational evidence under `docs/**` remains excluded by policy.
5. Run `pnpm guard:iai-github-doc-assets` against the final index.

## 6. Required validation before commit

Run from the repository root after all files are local:

```bash
git status --short --branch
git diff --check
pnpm test:source
pnpm quality:gate
pnpm guard:iai-github-doc-assets
```

Run targeted tests for the changed lanes when the full source suite does not provide direct behavioral coverage:

```bash
pnpm test:mail-smtp
pnpm test:dash
pnpm test:web
pnpm test:noos-stack
pnpm test:noos-web
pnpm --filter @iai/verify-runtime test
```

`pnpm test:external-evidence` is a separate live-evidence lane. Its result must identify the environment and timestamp and must not be substituted for source tests.

## 7. Commit and PR plan

After full materialization and validation:

1. Review `git status` and the complete diff by work stream.
2. Stage all intended non-ignored source/config/test/handoff paths.
3. Do not force-add files rejected by the GitHub docs/assets guard.
4. Commit with a scope that describes the net aggregate change.
5. Push `security-remediation-20261006` to `origin` with upstream tracking.
6. Create or update one draft pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
7. Record the exact commit SHA, PR URL, CI checks, failed/skipped checks, and reviewer decision in this handoff.

Suggested PR title:

```text
fix(security): hand off platform remediation and runtime hardening
```

## 8. Remote audit procedure

On the independent review machine:

```bash
git clone git@github.com:tranhatam-collab/iai-platform-fresh.git
cd iai-platform-fresh
git fetch origin
git checkout security-remediation-20261006
git rev-parse HEAD
git diff --check origin/main...HEAD
pnpm install --frozen-lockfile
pnpm test:source
pnpm quality:gate
```

Reviewers must additionally verify:

- The branch base is the declared remote-main SHA or any rebase is explicitly recorded.
- No secret, local evidence, inbox content, or provider credential is present in the diff or commit history.
- Security controls fail closed and include negative tests.
- Mail, payment, quota, telemetry, and commerce changes have direct tests.
- Skipped CI checks are explained and are not counted as passes.
- Deployment identity and production behavior are audited separately from the source PR.

## 9. Rollback and recovery

- Before merge: close the draft PR and delete only the remote review branch; preserve the local recovery copy until independent audit is complete.
- After merge: use a normal revert commit for the exact merge SHA. Do not rewrite `main` history.
- Runtime rollback must follow each service's deployment runbook and must not be inferred from a Git revert alone.

## 10. Acceptance record

Complete these fields after publication:

```text
MATERIALIZATION_COMPLETE=PENDING
COMPLETE_SECRET_SCAN=PENDING
SOURCE_TESTS=PENDING
QUALITY_GATE=PENDING
GITHUB_ASSET_GUARD=PENDING
COMMIT_SHA=PENDING
REMOTE_BRANCH=PENDING
DRAFT_PR_URL=PENDING
CI_VERDICT=PENDING
INDEPENDENT_REVIEW=PENDING
MERGE_AUTHORITY=PENDING
```

Until these fields are backed by receipts, the handoff is suitable for recovery planning only and is not a release approval.
