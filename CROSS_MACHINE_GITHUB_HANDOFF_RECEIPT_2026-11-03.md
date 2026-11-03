# IAI.ONE Cross-Machine GitHub Handoff Receipt

- **Date:** `2026-11-03` (`Asia/Ho_Chi_Minh`)
- **Overall verdict:** `PARTIAL_HANDOFF_READY_FOR_AUDIT`
- **Release authority:** none
- **Merge/deploy performed:** no
- **Canonical registry:** `IAI_SUBPROJECT_GITHUB_HANDOFF_2026-11-03.md`
- **Clone helper:** `scripts/clone-iai-handoff-repos.sh`

This receipt records source availability for development and audit on another machine. It does not claim that every local FileProvider-backed WIP file was uploaded, that every project passed its complete test suite, or that any branch is production-ready.

## Newly preserved WIP branches

| Repository | Branch | Immutable source snapshot | Remote readback |
|---|---|---|---|
| `tranhatam-collab/iai-platform-fresh` | `OMCODE/partial-cross-machine-handoff-20261103` | `ac5015ab15385ff5d61e341aed7ad42336d9a4a7` | Clean clone and `git fsck --full --no-dangling` PASS; later commits on this branch contain handoff registry/receipt updates |
| `tranhatam-collab/iai.one-platform` | `OMCODE/partial-cross-machine-handoff-20261103` | `fc5e5b2b66b5e582d2725230b1409609f5d5540c` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/flow.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `b5ca0c6ed3bfbde25713429c216f2689e967ff10` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/app.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `d4f913dc9f8918905e7059ca5d93973c43aef19c` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/Computer-AI` | `OMCODE/partial-cross-machine-handoff-20261103` | `d63fa1cbf3f555a9c6338623f37110ce709bcf57` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/Home.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `d3e925c1f750e2fda4ab9bdf5925842c3b5d6585` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/verify.iai.one` | `OMCODE/partial-cross-machine-handoff-20261103` | `e04b80eb60160a77ddeb0891e6a0723f5bce475c` | Clean clone and `git fsck --full --no-dangling` PASS |
| `tranhatam-collab/cios.iai.one` | `OMCODE/local-divergent-snapshot-20261103` | `ccb6ff22f721a6590e10289dd7f13cc8553ee4a2` | Clean clone, `git fsck --full --no-dangling`, 31-file count and 31/31 source/readback SHA-256 comparison PASS |

## Existing GitHub source baselines verified

The registry and clone helper pin source for AI.OMDALA/AI Agent, Computer.iai.one, LifeCode, App, CIOS, Docs, Home, NFT, NOOS, Verify, and Trust. New recovery branches were also independently cloned and read back on the handoff date.

## Materialization and validation boundaries

### IAI platform umbrella

- Included: 45 readable changed tracked files and 16 readable untracked files.
- Blocked: 13 changed tracked and 11 untracked FileProvider placeholders.
- `pnpm install --frozen-lockfile`: PASS.
- GitHub asset guard: PASS.
- Source tests and quality gate: FAIL because readable `apps/web/src/server.ts` depends on unavailable changed `apps/web/src/event-log.ts`.

### Legacy/parallel `iai.one-platform`

- Included: eight readable WIP files.
- Blocked: local `package.json` placeholder and unavailable historical local commit object.
- This is a file-level recovery branch based on remote `main`, not a merge-ready reconstruction.

### Standalone Flow

- Included: 24 readable changed tracked files and three meaningful untracked files.
- Blocked: `app/nodes/index.html`, `docs/architecture/index.html`, and `modules/index.html`.
- `npm ci`: PASS.
- `npm run type-check`: PASS.
- Raw credential scan: PASS with zero findings.
- Dependency report: six known vulnerabilities, including four high severity.

### App

- Recovered the only readable source difference: five Mail API/sender variables in `wrangler.toml`.
- Static build command: PASS, but it only prints a completion message.
- `npm ci`: blocked because the repository has no lockfile.

### Computer.iai.one

- Recovered 15 changed tracked files, 12 new source/test files and four reports; exact blob comparison passed for all 31 source files.
- Frozen-lockfile install and full typecheck/build: PASS.
- Test result: 278 total, 261 pass, three fail and 14 skip.
- Failures prove incorrect VND invoice formatting, epoch-second date handling and missing HTML escaping in invoice email output.
- GitHub reports 74 Dependabot findings on the default branch, including one critical and 47 high.

### Home

- GitHub reports the canonical repository as `tranhatam-collab/Home.iai.one` (renamed from the lowercase repository URL).
- Recovered `_redirects`; all four redirect targets exist in the branch.
- Eight changed tracked local files remain FileProvider-blocked, so the branch is partial.

### Verify

- Recovered 10 changed config/view files plus new `src/lib/i18n.ts`; exact comparison passed for all 11 files.
- `npm ci`: PASS; dependency report: six findings, including five high.
- Typecheck: FAIL with 13 errors because missing/dataless routes and views still use the old language contract.
- Twelve tracked local paths remain unavailable; the branch must not be released as complete.

### CIOS

- Canonical `main` at `c0b350f1c04b930bd326b8ee4e19ed220c25b022`: `npm ci`, typecheck, build and full test suite 42/42 PASS; focused Worker R1 auth contract suite 10/10 PASS.
- Current source ignores caller-supplied registration role/workspace and requires explicit demo-seed configuration plus `AUTH_DEMO_PASSWORD`.
- Local package audit reports 26 vulnerabilities (one critical, nine high); GitHub reports 59 default-branch Dependabot findings (one critical, 26 high). Their scopes differ.
- The separate audit-only branch preserves 31 divergent local files under `recovery/local-readable/`; it does not modify runtime paths and its ancestry is not proven.

## Sources not fully handed off

- `academy.iai.one`, `invest.iai.one`, and `iaiacademy.iai.one`: no independent GitHub repository identity was proven.
- LifeCode: the pinned upgrade-plan branch is available; the inspected local checkout is older/incomplete and was not allowed to overwrite it.
- NOOS: the remote baseline remains pinned; local runtime diffs were rejected because they contain merge markers, destructive deletions and dataless files.
- Computer.iai.one: the safe source subset is preserved, but nested `.gen1-recovery`, local secrets/cache and case-colliding `Docs` artifacts remain excluded.
- App: the readable source delta is preserved, but historical local Git index state is unavailable.
- Home and Verify: readable deltas are now preserved on partial handoff branches; blocked local files and Verify contract errors remain unresolved.
- CIOS: canonical source tests pass, but dependency findings and unverified live deployed-SHA/secret posture keep release status on HOLD; the divergent local snapshot is audit-only.

Do not delete the source machine, iCloud material, or local archives while any item above remains partial or blocked.

## Restore on the audit machine

```bash
git clone --branch OMCODE/partial-cross-machine-handoff-20261103 \
  git@github.com:tranhatam-collab/iai-platform-fresh.git
cd iai-platform-fresh
git rev-parse HEAD
bash scripts/clone-iai-handoff-repos.sh ../iai-one-audit-sources
```

The helper requires the immutable platform source snapshot to remain in the branch ancestry and requires exact branch HEAD equality for every other repository. After cloning, each repository must run its own install, secret scan, tests, build, and runtime verification.

## Remaining gates

1. Recover all FileProvider-blocked local files and compare them with the preserved branches.
2. Reconcile unresolved LifeCode, NOOS, excluded Computer material, App Git history, Home blocked paths, Verify missing paths, and the CIOS divergent snapshot.
3. Establish repository identity for Academy/Invest scopes or explicitly map them to an umbrella source path.
4. Resolve dependency/security findings, then run project-specific test/build gates.
5. Open independent review PRs after GitHub CLI authentication is repaired.
6. Keep deployment, DNS, secrets, databases, runtime smoke tests, rollback, and Founder approval as separate evidence gates.

Until these gates are closed, the correct status is `PARTIAL_HANDOFF_READY_FOR_AUDIT`, not `COMPLETE_TRANSFER` and not `PRODUCTION_READY`.
