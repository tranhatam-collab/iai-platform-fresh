# TEAM1_UNIVERSAL_QUALITY_GATE_IMPLEMENTATION_2026-05-04

- Date: `2026-05-04`
- Owner: `Team 1 Control Tower`
- Status: `IMPLEMENTED_VERIFIED`
- Policy source: `docs/reports/CROSS_TEAM_QUALITY_GATE_MEMO.md`

## 1. What was implemented

- Added native Git hook enforcement through `.githooks/pre-commit`.
- Added package entrypoint `pnpm quality:gate`.
- Added `scripts/install-git-hooks.mjs` and root `prepare` script so `pnpm install` enables `core.hooksPath=.githooks`.
- Added `scripts/universal-quality-gate.mjs` to block commits on:
  - TypeScript semantic failures through `pnpm typecheck`
  - staged whitespace errors through `git diff --cached --check`
  - missing HTML doctype/lang/viewport/heading structure
  - missing image alt text
  - duplicate literal IDs inside one template block
  - missing canonical/hreflang/Open Graph/Twitter metadata
  - missing EN/VI language handling or locale-aware render helpers
- Added missing NOOS Open Graph/Twitter image metadata in `apps/noos-web/src/render.ts`.

## 2. Hook behavior

Every local commit now runs:

```text
pnpm quality:gate
```

The hook blocks the commit if any gate fails.

## 3. Notes

- This implementation uses a native Git hook instead of adding `husky`, because the repo does not currently carry `husky`, `eslint`, `prettier`, `htmlhint`, `pa11y-ci`, or `unlighthouse` as installed dependencies.
- The gate reports those optional tools as notes when they are not installed, while enforcing built-in checks immediately.
- Live-preview checks such as Lighthouse and pa11y URL crawling still belong to preview evidence packets after a preview URL exists.

## 4. Verification target

Executed in this batch:

```text
node scripts/install-git-hooks.mjs
pnpm quality:gate
```

Observed result:

```text
Quality Gate Passed
```

## 5. Verification evidence

- `node scripts/install-git-hooks.mjs` -> PASS, Git `core.hooksPath` set to `.githooks`.
- `pnpm quality:gate` -> PASS.
- `pnpm gate:precommit` -> PASS, confirmed compatibility alias reaches the same universal gate.
- Verified coverage included:
  - root hook wiring and staged whitespace check
  - full monorepo `pnpm typecheck`
  - SEO registry coverage
  - HTML/SEO/a11y source checks for `app`, `dash`, `developer`, `docs`, `flow`, `home`, `nft`, `noos-web`, `pay`, `root`, `web`
  - language/i18n checks for the same surfaces
- The first run exposed strict-rule false positives around dynamic i18n button labels and layout shells; the gate was tightened to recognize dynamic accessible names while still blocking empty buttons.
