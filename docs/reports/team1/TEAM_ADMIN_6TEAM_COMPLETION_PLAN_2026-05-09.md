# TEAM_ADMIN_3TEAM_VISIBLE_COMPLETION_PLAN_2026-05-09

- Date: `2026-05-09`
- Timezone: `Asia/Ho_Chi_Minh`
- Owner: `Codex Main Team`
- Status: `ACTIVE_3TEAM_VISIBLE_MODEL`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Source snapshot: `docs/reports/team1/TEAM_ADMIN_ALL_TEAMS_COMPLETION_STATUS_2026-05-09.md`
- Auto-loop cadence: `30 phút/lần` (`node scripts/team-autowake-15m-loop.mjs --interval-minutes=30`)

## 0. Verdict

Mô hình đã hợp nhất về **3 team hiển thị điều phối nội bộ**: `Team 1`, `Team 2`, `Team 3`.

Codex is the **main accountable owner**. The execution lanes still under Codex control in this plan are `Team 1`, `Team 2`, and `Team 3`. Mail/payment external groups are no longer Codex-managed lanes; founder will run those separately and report back when ready. No old team may create a separate authority lane, separate live claim, or separate release verdict.

## 1. Verified Truth As Of 2026-05-09

- Pay is no longer the primary blocker: `TEAM1_PAY_PROD_GATE_STATUS_2026-05-06` is `PASS / LOCK_FLIPPED / RELEASE_READY`.
- Whole project status remains `60% complete / 40% remaining`.
- Current gate state is `READY_FOR_TEAM5_RERUN`.
- Node and pnpm are available in this session: `node v24.13.0`, `pnpm 9.15.9`.
- The repo-side autowake schedule in source is currently `30 minutes`, not `44 minutes`. The `44m` claim is not accepted as source-of-truth unless a matching automation artifact is created.
- `pnpm test:noos-web` has passed after the current noos-web patch set.
- Universal bilingual audit has improved but is still `FAIL`: `noos-web` has 2 open issues.
- Git scope is dirty and must not be called release-clean until unrelated/uncommitted work is separated or committed intentionally.

## 2. Active Codex Teams

| New team | Accountability | Old teams folded in | Current state |
|---|---|---|---|
| `Team 1` | noos-web bilingual/SEO, public copy registry, docs/developer wording, life/content/legal guardrails, public surface evidence packet hygiene | Team A, Team3, Team4, Team C Language | `IN_PROGRESS` |
| `Team 2` | CDN, Flows, CIOS recovery, DNS/runtime proof, noindex/internal policy, source-of-truth mapping | Team B-CDN, Team B-Flows, Team C CIOS | `BLOCKED_ON_PRODUCTION_EVIDENCE` |
| `Team 3` | live-sync readiness/final packet, NO-GO owner sign-off consolidation, preview URL handoff, final deploy sequence, git scope clean | Team 5 + old ABCD NO-GO coordinator | `READY_AFTER_EVIDENCE` |

## 3. External Lanes Not Managed Here

The following lanes are now out of Codex operating scope in this thread:

- old mail/inbox proof lane -> moved to founder-managed separate group
- old payment activation lane -> moved to founder-managed separate group

Codex will not wake, schedule, route, or report these two lanes as internal execution teams anymore. When founder reports progress back, Codex will absorb the result into the project truth snapshot.

## 4. Teams Removed / Merged

The following old labels must not be used as independent authority lanes anymore:

- legacy Team 1 control tower -> merged into Codex owner lane
- `Team 2 Pay` -> merged into `T4 Payment Activation` for follow-up, with pay gate monitor only
- legacy Team 3 -> merged into `Team 1`
- legacy Team 4 -> merged into `Team 1`
- legacy Team 5 -> merged into `Team 3`
- `Team A` -> merged into `Team 1`
- `Team B-CDN` -> merged into `Team 2`
- `Team B-Flows` -> merged into `Team 2`
- `Team C` -> split into `Team 1` and `Team 2`
- `Team D` -> external founder-managed lane, outside Codex execution scope
- `Team Email SMTP` -> external founder-managed lane, outside Codex execution scope

## 5. Today Execution Plan

### Team 1

Must do today:
- Finish the 2 remaining noos-web bilingual issues from `UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-05-09`.
- Move remaining quoted public body copy through shared registry or explicitly mark it non-public diagnostic copy.
- Ensure noos-web nav/button/footer registry signals are accepted by the audit.
- Keep docs/developer/life wording under legal/public-surface guardrails.

Acceptance:
- `pnpm test:noos-web` PASS.
- `UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_AUDIT_2026-05-09` rerun shows noos-web removed from pending pages.

### Team 2

Must do today:
- Restore or hydrate `../cios.iai.one` from the archive snapshot without copying `.git`, `.env`, or `node_modules`.
- Run CIOS evidence guard, upstream Vitest, and strict smoke.
- Close CDN 5 refs or mark `cdn.iai.one` formally `NOT_PUBLIC_READY`.
- Close Flows 3 refs or mark `flows.iai.one` formally `NOT_PUBLIC_READY`.

Acceptance:
- `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-05-09.json` has `reviewClosureReady=true`.
- CDN refs complete: `deploy_log_ref`, `rule_snapshot_ref`, `cache_header_proof_ref`, `purge_rollback_note_ref`, `asset_header_proof_ref`.
- Flows refs complete: `route_map_production_ref`, `runtime_production_ref`, `screenshot_production_ref`.

### Team 3

Must do today:
- Convert NO-GO owner sign-off into the reduced owner sign-off model.
- Rerun Team 3 readiness/final packet after T1/T2 closures and after any founder-reported external lane closure.
- Hold final sync live until `liveSyncReady=true`.
- Track dirty git scope and separate unrelated untracked tools from release commit scope.

Acceptance:
- `Team 3 live-sync ready` PASS.
- `Batch ready to commit` PASS.
- No dirty/unrelated file blocks release packaging.

## 6. Stop Conditions

The active Codex plan may stop only when every condition below is true:

- Completion is `100%`.
- Pay gate remains green.
- NO-GO owner sign-off is complete under the current model.
- Team 3 live-sync readiness PASS.
- Founder-managed mail/payment lanes are reported back as PASS or formally deferred/out-of-scope.
- CDN/Flows production evidence PASS or formally `NOT_PUBLIC_READY`.
- CIOS review closure PASS.
- noos-web bilingual audit PASS.
- Git scope is clean or intentionally staged/committed.

## 7. Founder Inputs Needed

Founder does not need to manage old team labels anymore. The only inputs needed are:

1. Name/approve owner sign-off for the current reduced model.
2. Provide or approve external evidence where only founder/operator has access:
   - Cloudflare/DNS/CDN/Flows proof.
   - Mailcow/Gmail/Outlook inbox proof through the separate external group.
   - Domain activation proof for payment emails through the separate external group.
3. Approve release once Codex reports stop conditions all PASS.

## 8. Commands

```zsh
cd "/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh"
pnpm test:noos-web
node scripts/universal-bilingual-language-rebuild-audit.mjs --date=2026-05-09
node scripts/team-b-cdn-flows-evidence-check.mjs --date=2026-05-09
node scripts/teamc-cios-review-closure-check.mjs --date=2026-05-09 --timeout-ms=60000
node scripts/team5-live-sync-readiness-check.mjs --date=2026-05-09
node scripts/team5-live-sync-packet.mjs --date=2026-05-09
node scripts/team1-all-teams-completion-status-check.mjs --date=2026-05-09
```

## 9. Final Guardrail

No team may claim `LIVE`, `SYNC_LIVE`, `SEO_COMPLETE`, or `PROJECT_COMPLETE` from local tests alone. Every live claim must have external evidence or a formal deferral accepted by Codex.
