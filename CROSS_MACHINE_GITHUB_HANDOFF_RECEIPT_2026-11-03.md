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

## Existing GitHub source baselines verified

The registry and clone helper pin source for AI.OMDALA/AI Agent, Computer.iai.one, LifeCode, App, CIOS, Docs, Home, NFT, NOOS, Verify, and Trust. Every listed remote branch/SHA was rechecked with `git ls-remote` on the handoff date.

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

## Sources not fully handed off

- `academy.iai.one`, `invest.iai.one`, and `iaiacademy.iai.one`: no independent GitHub repository identity was proven.
- LifeCode: the pinned upgrade-plan branch is available; the inspected local checkout is older/incomplete and was not allowed to overwrite it.
- NOOS: the remote baseline remains pinned; local runtime diffs were rejected because they contain merge markers, destructive deletions and dataless files.
- Computer.iai.one: the safe source subset is preserved, but nested `.gen1-recovery`, local secrets/cache and case-colliding `Docs` artifacts remain excluded.
- App: the readable source delta is preserved, but historical local Git index state is unavailable.
- Home and Verify: pinned remote baselines exist; inspected local untracked/generated files were intentionally not pushed.

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
2. Reconcile unresolved LifeCode, NOOS, excluded Computer material, App Git history, Home, and Verify local state.
3. Establish repository identity for Academy/Invest scopes or explicitly map them to an umbrella source path.
4. Resolve dependency/security findings, then run project-specific test/build gates.
5. Open independent review PRs after GitHub CLI authentication is repaired.
6. Keep deployment, DNS, secrets, databases, runtime smoke tests, rollback, and Founder approval as separate evidence gates.

Until these gates are closed, the correct status is `PARTIAL_HANDOFF_READY_FOR_AUDIT`, not `COMPLETE_TRANSFER` and not `PRODUCTION_READY`.
