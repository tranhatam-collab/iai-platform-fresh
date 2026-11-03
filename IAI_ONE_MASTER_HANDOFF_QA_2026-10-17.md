# IAI.ONE - Independent QA of Master Handoff and Development Plan

- **Audit status:** `COMPLETE - NEEDS_REVISION_PARTIAL`
- **Release verdict:** `HOLD`
- **Mail verdict:** `NO_GO`
- **CIOS verdict:** `HOLD_P0_SECURITY`
- **Audit mode:** read-only review; no source, deployment, DNS, secret, database, or production mutation
- **Reviewed artifact:** `IAI_ONE_MASTER_HANDOFF_AND_DEV_PLAN_2026-10-16.md` version `1.0`
- **Reviewed artifact SHA-256:** `dc0bc6d61cb094486c879980cd0cf259365bba5de0f867122bf9f16306ac9a95`
- **Original evidence cutoff:** `2026-10-16T19:51:21+07:00`
- **QA recheck timestamp:** `2026-10-17T01:27:58+07:00`

## 1. Executive verdict

The report is correct on its central governance conclusions:

1. IAI.ONE cannot be declared fully operational.
2. The portfolio-wide release remains `HOLD`.
3. Mail remains `NO_GO`.
4. HTTP 200, green pull-request checks, file counts, documents, and backup presence are not production acceptance evidence.
5. There is not enough evidence to publish one portfolio-wide completion percentage.

The report is not yet sufficient as the canonical master handoff. It omits a P0 security issue in CIOS, does not lock the active source workspace, contains stale or imprecise source-state and Mail claims, does not incorporate the canonical LifeCode upgrade plan, and lacks durable raw evidence receipts.

The correct classification is:

```text
REPORT_STATUS=NEEDS_REVISION_PARTIAL
CENTRAL_VERDICT=VERIFIED_CURRENT
SOURCE_BASELINE=BLOCKED
PROVIDER_PROVENANCE=BLOCKED
PORTFOLIO_RELEASE=HOLD
MAIL=NO_GO
CIOS=HOLD_P0_SECURITY
COMPLETION_PERCENT=NOT_DETERMINABLE
```

## 2. Evidence classes used

| Status | Meaning |
|---|---|
| `VERIFIED_CURRENT` | Rechecked against current source, runtime, or provider evidence within the audit window |
| `VERIFIED_HEAD_ONLY` | Verified in committed source, but deployed identity is not proven |
| `VERIFIED_WORKTREE_ONLY` | Verified in local uncommitted files only |
| `REPORTED_UNVERIFIED` | Present in a report but not independently proven |
| `CONTRADICTED` | Current evidence conflicts with the report |
| `BLOCKED` | Required provider, source, environment, or recovery evidence was unavailable |
| `NOT_CHECKED` | Outside the performed audit scope |

## 3. High-severity findings

### IAI-QA-P0-01 - CIOS privilege escalation source risk omitted

**Status:** `VERIFIED_HEAD_ONLY`

Committed CIOS source accepts a caller-provided registration role, persists it, copies it into the session JWT, and maps `root` or `admin` to root authorization. The public registration route is exposed by the Worker. The same source also contains the default demo password `demo123456` when `AUTH_DEMO_PASSWORD` is absent.

Relevant source:

- `cios.iai.one/services/api/src/lib/session-auth.ts`: default password, caller role intake, persistence, and JWT claims.
- `cios.iai.one/services/api/src/lib/auth.ts`: `root` and `admin` authorization mapping.
- `cios.iai.one/services/api/src/worker.ts`: public `/v1/auth/register` route.
- `cios.iai.one/site/js/api-client.js`: live Worker base URL.

The public Worker health and metadata routes respond, but the deployed SHA and presence of `AUTH_DEMO_PASSWORD` have not been proven. Therefore this audit does not claim that the vulnerability is currently exploitable in production. It does require CIOS to be excluded from release until deployed identity, secrets, registration policy, token claims, and negative authorization tests are verified.

**Required closure evidence:** exact deployed SHA or artifact digest; secret-presence receipt without secret value; registration-role rejection test; forged-token and privilege-boundary tests; independent approval.

### IAI-QA-P0-02 - Active source workspace omitted

**Status:** `VERIFIED_CURRENT`

The active workspace at QA time is:

```text
/Users/tranhatam/Documents/New project/iai-platform-worktree
branch=security-remediation-20261006
HEAD=930c7af5c1ee4d00e717f1502697e403f6e6aa66
dirty_paths=70
```

The reviewed report inventories a different iCloud checkout as the IAI Platform source candidate and does not enumerate the active 70-path worktree. No release candidate may be built from either dirty checkout until the canonical checkout, branch, exact SHA, intended patch, and excluded concurrent work are frozen.

### IAI-QA-P0-03 - Git index integrity is not checked

**Status:** `VERIFIED_CURRENT`

`app.iai.one` has a missing `.git/index`. Its apparent tracked deletions are therefore not trustworthy development changes and could become a destructive commit if staged blindly. The report classifies this only as 23 tracked changes.

Current source-state corrections also include:

- `noos.iai.one` is not clean; staged changes exist and its origin points to a local corrupt archive.
- `home.iai.one` is not fully clean; untracked files exist.
- Repo identity and index integrity must be checked before trusting any portfolio-wide `git status` inventory.

**Required closure evidence:** `.git/index` existence and integrity receipt; `git fsck`; `git diff --cached --summary`; remote/ref verification; safe index reconstruction plan approved before any write.

### IAI-QA-P0-04 - Mail wording is stale, but NO_GO remains correct

**Status:** `PARTIALLY_CONTRADICTED`

The report correctly identifies:

- MX points to `mail.iai.one`.
- Mail hostnames resolve to `89.167.116.167`.
- The served TLS identity is not an IAI identity and includes `ppinfo.ru`.
- Mail must not be considered operational.

The statement that ports 25, 465, 587, and 993 are all unreachable is not current. TCP connections were accepted during independent review, but SMTP banner/STARTTLS and TLS/IMAP negotiation did not produce a valid IAI Mail service.

The corrected claim is:

> Mail TCP endpoints accept connections, but service protocol and TLS identity are invalid or unusable; inbound, outbound, submission, and mailbox access are not production-verified. Mail remains `NO_GO`.

## 4. Major completeness gaps

### IAI-QA-P1-01 - LifeCode plan is not fully incorporated

**Status:** `VERIFIED_CURRENT`

The canonical Team Audit planning candidate exists on:

```text
branch=audit/lifecode-os-comprehensive-upgrade-plan-2026-10-11
SHA=336ef35a8386a744c6de18a7f7c6e268e89e6dac
document=docs/audit/LIFE_CODE_OS_COMPREHENSIVE_UPGRADE_PLAN_2026-10-11.md
```

It contains substantially more scope than WP3: containment, 20 method families, 12 analytical layers, 12 resonance fields, 9 product levels, data and result contracts, AI governance, reporting, commerce, privacy, legal, security, operations, decisions, and acceptance gates.

The master handoff cannot claim to contain sufficient LifeCode planning until WP3 and its acceptance backlog are derived from that exact branch and SHA, or the Founder explicitly chooses another canonical plan.

### IAI-QA-P1-02 - AI Agent current candidate and staging gates omitted

**Status:** `VERIFIED_CURRENT`

The handoff should identify AI.OMDALA PR #7 and its exact candidate:

```text
head=c9d4dacc4f32d77fed3ea1a96ff2f8bf82855fc5
review_decision=EMPTY
checks=5_SUCCESS_2_SKIPPED
staging_dns=NOT_RESOLVED
```

Skipped immutable provider or billing attestations are not equivalent to passing attestations. A clean source candidate or Worker dry-run is not staging acceptance. WP4 must include isolated bindings, deployed identity, authenticated model and ledger reconciliation, failure-path E2E, rollback, and independent approval.

### IAI-QA-P1-03 - Evidence is not durable or reproducible

**Status:** `VERIFIED_CURRENT`

The reviewed report is untracked in its parent umbrella repository. It does not include an evidence register linking each claim to raw command output, exit code, timestamp, exact SHA, environment, verifier, and receipt location.

The local presentation URL `http://127.0.0.1:4187/?view=1` returned connection failure during this QA and no listener was active on port 4187. A localhost-only URL is not a durable review artifact.

The external `Time Machine 4TB` snapshot could not be revalidated because the volume was not mounted. Previous backup claims should therefore be labeled `BLOCKED_REVALIDATION`, not current pass or current failure.

### IAI-QA-P1-04 - Owner OS registry scope is overextended

**Status:** `VERIFIED_CURRENT`

The referenced capability registry is scoped to `nguyenai.org`. Its overdue review and `0/10` result are valid for that registry's own scoring rules. It must not automatically block every IAI.ONE surface unless a dependency map proves that the surface relies on that control plane.

## 5. Internal consistency corrections

| Item | Report text | Required correction |
|---|---|---|
| WP0 inputs | Table says three missing inputs | Detailed section lists seven; use seven or separate three blockers from four decisions |
| Execution order | Mail is presented before source/deploy lock | Run Mail containment in parallel with source lock; execute recovery only after owner, topology, rollback, and canonical target are known |
| PR check totals | Head checks count only selected checks | State whether counts include GitHub Actions only or all status contexts, including review bots |
| Surface inventory | 33 names | Keep as a scoped inventory, not a zone-complete asset register |
| Report authority | Current handoff | Mark as non-canonical until tracked, reviewed, and linked to immutable receipts |
| Report authorship | Not stated | Add author, verifier, and approval fields |

## 6. Claims independently supported

The following major claims are sufficiently supported within their stated limits:

1. The central `HOLD` and Mail `NO_GO` verdicts.
2. The 33-surface scoped inventory and the arithmetic reported for its categories at the original cutoff.
3. The warning that HTTP 200 does not prove business-flow readiness.
4. The remote baseline SHAs recorded for IAI Platform, AI.OMDALA, and LifeCode at the original cutoff.
5. The listed PRs had no `APPROVED` review at the audit cutoff.
6. LifeCode live assets matched parts of a dirty or untracked local worktree rather than a proven clean remote-main build.
7. The LifeCode Worker health endpoint responded, while the remote-main Worker workflow evidence did not establish a successful current production deployment.
8. MailGla checklists contained 174 unchecked items at the inspected revision.
9. Backup presence was not equivalent to successful isolated restore and functional verification.
10. The report correctly refuses to compute a portfolio-wide completion percentage.

## 7. Required changes for report version 1.1

1. Freeze the actual active workspace, repo, branch, exact HEAD, and intended patch for every scoped project.
2. Add repo-index integrity checks before interpreting dirty-path counts.
3. Add CIOS as a P0 security finding and remove it from release scope until closure receipts exist.
4. Replace the Mail reachability claim with the protocol and TLS failure claim, including timestamp and probe source.
5. Bind LifeCode WP3 to an explicit canonical planning branch and full 40-character SHA.
6. Add AI Agent PR #7, staging DNS, attestation, isolated resource, E2E, rollback, and approval gates to WP4.
7. Add an evidence register with evidence IDs, raw outputs, exit codes, timestamps, exact SHAs, environments, and verifiers.
8. Track and review the report in the correct canonical repository.
9. Export the presentation as a durable artifact or provide its source and reproducible launch command; remove localhost-only delivery as the sole reference.
10. Revalidate GitHub, Cloudflare, DNS/TLS, live runtime, mounted backup, and restore evidence immediately before approval.
11. Correct WP0 input count, execution dependencies, PR check-count semantics, and capability-registry scope.
12. Issue an immutable v1.1 digest and obtain independent review before Founder acceptance.

## 8. Release sequence after report correction

```text
WP0 incident containment and authority lock
  -> WP1 canonical source/deployment registry
  -> isolated remediation branches
  -> independent security review
  -> staging with isolated data and credentials
  -> core and failure-path E2E
  -> backup restore and rollback drills
  -> immutable release candidate
  -> Founder approval for exact digest and scope
  -> authorized deployment
  -> post-deploy verification and observation window
```

Mail incident containment may run in parallel with WP1. Mail recovery and production promotion may not bypass source, infrastructure ownership, rollback, and acceptance gates.

## 9. Final QA decision

```text
CENTRAL_HOLD_VERDICT=ACCEPTED
MAIL_NO_GO_VERDICT=ACCEPTED_WITH_WORDING_CORRECTION
SOURCE_LEDGER=REJECTED_PENDING_REBUILD
CIOS_SECURITY_COVERAGE=MISSING_P0
LIFECODE_COVERAGE=INCOMPLETE
AI_AGENT_COVERAGE=INCOMPLETE
EVIDENCE_DURABILITY=FAIL
MASTER_HANDOFF_APPROVAL=NOT_GRANTED
NEXT_ARTIFACT=IAI_ONE_MASTER_HANDOFF_AND_DEV_PLAN_2026-10-17_V1_1.md
```

This QA does not authorize commit, push, merge, deployment, DNS changes, secret changes, database migration, production-data mutation, cleanup, or maturity transition.
