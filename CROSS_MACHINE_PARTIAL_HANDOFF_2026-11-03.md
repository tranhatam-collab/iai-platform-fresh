# IAI Platform Cross-Machine Partial Handoff

- **Status:** `PARTIAL_RECOVERY_HANDOFF`
- **Base SHA:** `930c7af5c1ee4d00e717f1502697e403f6e6aa66`
- **Branch:** `OMCODE/partial-cross-machine-handoff-20261103`
- **Purpose:** preserve every locally readable source change for audit and development on another machine
- **Release authority:** none

## Included

- 45 readable tracked files whose content differs from the index.
- 16 readable untracked files.
- `CROSS_MACHINE_HANDOFF_MANIFEST_2026-11-03.json` with exact included and blocked paths.
- Existing audit and handoff context available in the source workspace.

## Not included

- 13 changed tracked files that macOS FileProvider reports as `dataless` and not uploaded.
- 11 untracked files that are also `dataless` and not uploaded.
- Secrets, local `.env` files, dependencies, generated build output, provider data, mailbox content, and production databases.

The blocked files are listed in the JSON manifest. Most blocked tracked WIP has no size-matching blob in any current GitHub ref, so replacing it with the base version would be data loss. This branch intentionally preserves the base version for those paths and records the gap.

## Restore on another machine

```bash
git clone git@github.com:tranhatam-collab/iai-platform-fresh.git
cd iai-platform-fresh
git checkout OMCODE/partial-cross-machine-handoff-20261103
git rev-parse HEAD
cat CROSS_MACHINE_HANDOFF_MANIFEST_2026-11-03.json
pnpm install --frozen-lockfile
pnpm test:source
pnpm quality:gate
```

## Acceptance boundary

This is a source-preservation branch, not a complete handoff and not a release candidate. Completion requires recovery of all 24 blocked paths, a complete secret scan, source tests, a clean-clone verification, and independent review.

## Validation receipt before publication

```text
pnpm install --frozen-lockfile=PASS
git diff --check=PASS
recognized raw-secret scan on readable changed files=PASS (0 findings)
pnpm guard:iai-github-doc-assets=PASS
pnpm test:source=FAIL
pnpm quality:gate=FAIL
```

`pnpm test:source` and `pnpm quality:gate` stop during the `@iai/web` TypeScript build because the new readable `apps/web/src/server.ts` expects `WEB_BASELINE_EVENT_NAMES`, `buildWebEventBaseline`, and `assignmentReason`, while the corresponding changed `apps/web/src/event-log.ts` is one of the unavailable FileProvider placeholders. This is direct evidence that the partial branch is not buildable until the blocked WIP is recovered.
