# SUBDOMAIN DEV AUDIT REPORT — 2026-04-14
## Scope
- Audit all currently active `*.iai.one` subdomain development surfaces.
- Verify code reality vs canonical domain mission map.
- Highlight blockers that can break cross-team release safety.

## Snapshot Time
- Date: April 14, 2026
- Timezone: Asia/Ho_Chi_Minh

## Update Note
- This audit snapshot was the initial baseline.
- Follow-up closure and lane directives are tracked in:
  - `docs/reports/team1/P0_CLOSURE_REPORT_2026-04-14.md`
  - `docs/reports/team1/LANE_A_EXECUTION_DIRECTIVE_2026-04-14.md`

## Executive Summary
- Development is active across multiple repositories, but ownership and release control are still fragmented.
- Core product surfaces are moving (`app`, `flow`, `web`, `api`) and NOOS commerce docs are now locked in place.
- There are still P0 risks:
  - Git/worktree hygiene break in local environment.
  - Cloudflare ownership matrix exists but still `TBD` across production rows.
  - `noos.iai.one` content still includes investment/fundraising surface elements, conflicting with the new NOOS boundary lock.

## Repository-Level Reality Check

### 1) `/Users/tranhatam/Documents/Devnewproject/iai.one-platform`
- Branch: `feature/homepage-v1` (ahead 2)
- Working tree delta count: `164` files
- Active apps found: `root`, `home`, `flow`, `web`
- Active worker found: `workers/api`
- Deploy scripts exist for: root/home/flow/web/api
- Status: **Main monorepo currently carrying most active subdomain delivery**

### 2) `/Users/tranhatam/Documents/Devnewproject/home.iai.one`
- Branch: `main`
- Working tree delta count: `3`
- Status: **Active but small delta**

### 3) `/Users/tranhatam/Documents/Devnewproject/app.iai.one`
- Branch: `main`
- Working tree delta count: `19`
- Status: **Active with worker/auth/publish/security and migration changes**

### 4) `/Users/tranhatam/Documents/Devnewproject/flow.iai.one`
- Branch: `codex/phase2-social-community-sync`
- Working tree delta count: `1`
- Status: **Active with focused API/runtime change**

### 5) `/Users/tranhatam/Documents/Devnewproject/docs.iai.one`
- Branch: `main`
- Working tree delta count: `8`
- Status: **Active (generated docs/assets and sitemap changes)**

### 6) `/Users/tranhatam/Documents/Devnewproject/cios.iai.one`
- Branch: `main`
- Modified tracked files: `0`
- Untracked files: `7`
- `git status` was unstable/slow in this repo during audit; `ls-files` confirms mainly untracked planning files.
- Status: **Partially active, hygiene check required**

### 7) `/Users/tranhatam/Documents/Devnewproject/noos.iai.one`
- Branch: `feature/nul-semantic-bci`
- Working tree delta count: `44`
- Status: **Highly active, but still role drift risk (see P0 issues)**

## Missing Standalone Repos (as separate top-level folders)
- `developer.iai.one`: missing
- `web.iai.one`: missing
- `dash.iai.one`: missing
- `api.iai.one`: missing

Note:
- These are partially represented inside `iai.one-platform` (`apps/web`, `workers/api`, etc.).
- This confirms architecture is currently hybrid: mixed monorepo + separate repos.

## Quality and Test Snapshot (`/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree`)

### Passed
- `pnpm test:noos-commerce-contracts` → passed
- `pnpm test:mail-smtp` → passed (16/16)

### Failed
- `pnpm test` → failed at `test:flow` (1 failing test)
- Failing test:
  - `tests/integration/flow-api-source-of-truth.test.mjs`
  - Assertion mismatch: expected `billing.overdueCount = 1`, got `2`

Observed cause:
- `buildFlowSourceSummary()` uses current wall-clock time (`new Date().toISOString()`), while fixture due dates are fixed on `2026-04-14`.
- As real time advances, pending invoice may become overdue, making this test non-deterministic.

## P0 Risks (Must Fix Before Broad Cross-Team Release)

1. **Git/worktree hygiene break**
- `git status` in `iai-platform-worktree` fails with:
  - missing gitdir path reference to `flow.iai.one.clean.latest`
- Confirmed broken pointer file:
  - `/Users/tranhatam/Documents/Devnewproject/flow.iai.one.clean.latest/.git`
  - points to a non-existing path under `/Users/tranhatam/Documents/New project/...`

2. **Cloudflare ownership matrix still placeholder**
- File exists:
  - `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
- But production rows are still `TBD` (domain -> project -> account -> owner not fully assigned).

3. **NOOS role drift not fully cleaned**
- `noos.iai.one` still includes investment/fundraising content paths such as:
  - `/docs/investment-programs/`
  - fundraising/investor wording in docs pages
- This conflicts with the locked NOOS architecture/document-product mission.

## P1 Risks (Next)

1. Hybrid repo model without frozen release authority can create deploy ambiguity.
2. `docs.iai.one`, `app.iai.one`, `home.iai.one`, `noos.iai.one`, and monorepo `iai.one-platform` all have in-flight changes; release order must be explicitly gated.
3. Flow integration test has time-coupled assertion and should be stabilized with fixed test clock.

## Recommended 24h Action Order

1. Team 3: finalize Cloudflare ownership matrix with non-`TBD` production rows.
2. Team 3: close git/worktree hygiene defect and publish remediation proof.
3. Team 2: fix deterministic clock strategy for `flow-api-source-of-truth` test.
4. Team 1: confirm NOOS domain cleanup plan and enforce no investment portal behavior on `noos.iai.one`.
5. Team 1 + Team 3: freeze release authority document and publish go/no-go checklist for all subdomain deploys.

## Files Confirmed Present for NOOS Commerce Execution
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `/Users/tranhatam/Documents/Devnewproject/iai-platform-worktree/docs/noos/29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`

## Final Status
- Subdomain development is real and progressing.
- Governance/doc lock is mostly in place.
- System is **not release-safe across all surfaces yet** until P0 items above are closed.
