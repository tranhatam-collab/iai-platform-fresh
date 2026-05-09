# Synchronized Live Deploy Checklist

Date locked: 2026-05-09
Mode: 3-team visible execution

This checklist is the deploy boundary for the current `READY_FOR_SYNCHRONIZED_LIVE`
state. It keeps local evidence out of GitHub while giving operators a short,
repeatable release path.

## Team Ownership

| Team | Scope | Current action |
| --- | --- | --- |
| Team 1 | Governance, quality gates, release authority, bilingual audit | Verify green state before any deploy |
| Team 2 | Infra, runtime, DNS, CDN/Flows/CIOS evidence | Apply only approved infra fixes |
| Team 3 | noos-web/content/bilingual/release-sync | Keep noos-web and content gates green |

## Allowed Deploy Surfaces

Only deploy a surface when all rows below are green in the same operator session.

| Surface | Owner | Required checks | Deploy state |
| --- | --- | --- | --- |
| noos-web | Team 3 | `pnpm test:noos-web`, typecheck, bilingual audit | Allowed after Team 1 release approval |
| root/home/docs/app/pay/mail runtime surfaces | Team 1/2 | Existing surface-specific tests plus current completion checker | Allowed only if already in the current release packet |
| vc.vetuonglai.com DNS repair | Team 2 | `fix-vc-vetuonglai-dns.mjs --apply`, `dig`, `curl -I` | Allowed after Cloudflare DNS-edit token is present |

## Evidence-Only / Backlog Surfaces

These are not part of the current deploy closeout unless a new explicit founder
approval is added.

| Surface | Reason |
| --- | --- |
| cdn.iai.one | Needs owner production evidence; keep evidence-only |
| flows.iai.one | Needs runtime production route proof; keep evidence-only |
| developer.iai.one | Needs owner sign-off/proof; keep evidence-only |
| cios.iai.one | Keep evidence gate explicit; no opportunistic rollout |
| Brand v2 outside flow.iai.one | Pilot is not ratified for fan-out |

## Pre-Deploy Commands

Run these from the repository root before any allowed deploy:

```bash
pnpm test:noos-web
pnpm typecheck:noos-web
node scripts/universal-bilingual-language-rebuild-audit.mjs --date="$(TZ=Asia/Ho_Chi_Minh date +%F)"
node scripts/team-channel-reminder-check.mjs --date="$(TZ=Asia/Ho_Chi_Minh date +%F)" --write
node scripts/team1-all-teams-completion-status-check.mjs --date="$(TZ=Asia/Ho_Chi_Minh date +%F)"
```

## VC DNS Repair

The repo contains a dry-run safe utility. It will not mutate Cloudflare unless
`--apply` is provided and `CLOUDFLARE_API_TOKEN` is present.

```bash
export CLOUDFLARE_API_TOKEN="..."
node scripts/fix-vc-vetuonglai-dns.mjs --apply
dig +short vc.vetuonglai.com
curl -I https://vc.vetuonglai.com
```

Expected target:

```text
vc.vetuonglai.com -> proxied CNAME -> vetuonglai-vc-7b7.pages.dev
```

## Stop Conditions

Stop the deploy and return to Team 1 if any of these happen:

- Git status is dirty with unrelated changes.
- A deploy would include `docs/**`, release evidence, or local proof artifacts.
- Brand v2 changes appear outside the approved `flow.iai.one` pilot path.
- Cloudflare DNS changes require guessing zone/account/project IDs.
- Any gate says `NOT_READY`, `LOCK_RETAINED_WITH_REASON`, or `REAL_EVIDENCE_MISSING`.

## Closeout

After deploy, capture proof locally only:

```text
docs/reports/<team>/...
docs/release-evidence/<surface>/...
```

Do not force-add these paths to GitHub. The pre-push guard must stay green.
