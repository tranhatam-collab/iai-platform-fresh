# TEAM1_W1A_D8A_EXECUTION_PACKET_2026-05-02

- Date: `2026-05-02`
- Item: `D8a — reconcile Cloudflare Pages source-of-truth for home-iai-one`
- Source audit: `docs/reports/team1/AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §B1, §C3
- Plan reference: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` §7 row D8
- Wave gated: `W1A` preview deploy
- Status: `OPEN_EXECUTION_PACKET_READY`

---

## 1. Current truth (verified now)

1. Cloudflare Pages project `home-iai-one` is still active, Git-linked, and last modified around 1 month ago.
2. `home-iai-one` currently shows only `iai-one.pages.dev` in project domains (not `home.iai.one`).
3. Latest production deployment source for `home-iai-one` is commit `f1da67b`.
4. `f1da67b` resolves to `HEAD` of legacy repo `tranhatam-collab/Home.iai.one` (not this monorepo).
5. `f1da67b` does not exist in monorepo `iai-platform-fresh`.

This confirms D8a remains open: W1A preview deploy from monorepo cannot be considered source-of-truth aligned yet.

---

## 2. Why CLI-only closeout is not enough

`wrangler pages project --help` exposes only `list/create/delete` for projects and does not expose a direct non-interactive source-relink command in this workflow.

Current safest closeout remains the plan-approved founder dashboard action:
- re-bind source for existing `home-iai-one` project to monorepo `tranhatam-collab/iai-platform-fresh` with root dir `apps/home`, or
- create a fresh Pages project bound to that monorepo path and retire old `home-iai-one`.

---

## 3. Founder one-action playbook (recommended)

Recommended path: keep project name `home-iai-one`, re-bind source to monorepo.

Dashboard action:
1. Cloudflare Dashboard -> Account `Tranhatam` -> Pages -> `home-iai-one` -> Settings -> Build & deployments.
2. Reconnect repository:
   - Repo: `tranhatam-collab/iai-platform-fresh`
   - Branch: `main`
   - Root directory: `apps/home`
3. Save and trigger one production deployment.

If reconnect is blocked in-place:
1. Create new project (for example `home-iai-one-v2`) with the monorepo binding above.
2. Attach `home.iai.one` to the new project.
3. Decommission old `home-iai-one` after smoke pass.

---

## 4. Verification commands (run right after founder action)

```bash
cd "/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh"
CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 wrangler pages project list --json
CLOUDFLARE_ACCOUNT_ID=f3f9e76222dcb488d5e303e29e8ba192 wrangler pages deployment list --project-name home-iai-one --json
curl -sS -I https://home.iai.one/
curl -sS -I https://home.iai.one/health
```

Pass conditions:
1. `home-iai-one` deployment source advances from legacy chain and is tied to the new monorepo-triggered deployment.
2. `home.iai.one` serves expected W1A behavior (`/` truthful shell, `/health` contract).
3. D8a can be marked `closed`, enabling W1A preview deploy gate.

---

## 5. Evidence artifacts

- `docs/reports/team1/artifacts/d8a/wrangler-home-iai-one-config-2026-05-02.toml`
- Command proof captured in terminal during this session:
  - `wrangler pages project list --json`
  - `wrangler pages deployment list --project-name home-iai-one --json`
  - `git ls-remote git@github.com:tranhatam-collab/Home.iai.one.git`
  - `git cat-file -t f1da67b` (exit `128` in monorepo)

---

## 6. Closeout template (fill after founder action)

```
Item: D8a
Closed: yes/no
Closure path: relink existing / create-new-and-cutover
Cloudflare project: <name>
Deployment id: <id>
Deployment source commit: <sha>
Monorepo commit reference: <sha>
home.iai.one smoke: pass/fail
Date: YYYY-MM-DD
```
