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

## Sources not fully handed off

- `academy.iai.one`, `invest.iai.one`, and `iaiacademy.iai.one`: no independent GitHub repository identity was proven.
- LifeCode: the pinned upgrade-plan branch is available, but later local phase WIP was not proven recoverable or pushed.
- NOOS: a remote baseline is pinned; unresolved local/corrupt-archive WIP was not included.
- Computer.iai.one and App: pinned remote sources exist; local checkout index/untracked state was not reconstructed.
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
2. Reconcile unresolved LifeCode, NOOS, Computer, App, Home, and Verify local WIP.
3. Establish repository identity for Academy/Invest scopes or explicitly map them to an umbrella source path.
4. Resolve dependency/security findings, then run project-specific test/build gates.
5. Open independent review PRs after GitHub CLI authentication is repaired.
6. Keep deployment, DNS, secrets, databases, runtime smoke tests, rollback, and Founder approval as separate evidence gates.

Until these gates are closed, the correct status is `PARTIAL_HANDOFF_READY_FOR_AUDIT`, not `COMPLETE_TRANSFER` and not `PRODUCTION_READY`.
