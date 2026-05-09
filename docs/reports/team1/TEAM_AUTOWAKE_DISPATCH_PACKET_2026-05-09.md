# TEAM_REMINDER_DISPATCH_PACKET_2026-05-09
- Generated at: 2026-05-09T03:23:26.714Z
- Timezone: Asia/Ho_Chi_Minh
- Cadence: every 15 minutes
- Active rows: 4

## Reminder Commands

### 1. T0 Codex Main

- team_id: `t0-codex-main`
- logical_channel: `program-root-authority`
- owner: `Codex Main`
- status: `ACTIVE`
- stop_condition: Completion reaches 100%, all evidence clusters pass or are formally deferred, and Codex Main issues final release verdict.

```text
T0 Codex Main: own the whole project. Keep PRODUCTION_PUBLICATION_HOLD active, reject stale/overclaim reports, rerun admin completion after each closure, and only release when all active Codex stop conditions pass.
```

### 2. T1 Surface & Language

- team_id: `t1-surface-language`
- logical_channel: `surface-language-noos-docs-life`
- owner: `Surface/Language Owner`
- status: `ACTIVE`
- stop_condition: noos-web bilingual audit passes and public surface wording/legal/docs guardrails are accepted.

```text
T1 Surface & Language: close the 2 remaining noos-web bilingual issues, remove or registry-route hard-coded public copy, keep docs/developer/life wording legal-safe, rerun pnpm test:noos-web and bilingual audit.
```

### 3. T2 Infra & Runtime Evidence

- team_id: `t2-infra-runtime-evidence`
- logical_channel: `cdn-flows-cios-runtime-proof`
- owner: `Infra/Runtime Owner`
- status: `ACTIVE`
- stop_condition: CIOS closure is ready and CDN/Flows production evidence is complete or formally NOT_PUBLIC_READY.

```text
T2 Infra & Runtime Evidence: hydrate ../cios.iai.one, pass evidence guard/upstream Vitest/strict smoke, close CDN 5 refs and Flows 3 refs, or formally mark CDN/Flows NOT_PUBLIC_READY with Team 1 acceptance.
```

### 4. T5 Release Sync & KPI

- team_id: `t5-release-sync-kpi`
- logical_channel: `release-sync-kpi-final-gate`
- owner: `Release Sync Owner`
- status: `ACTIVE`
- stop_condition: Team 5 live-sync readiness/final packet pass, batch ready to commit is PASS, and git scope is clean or intentionally staged.

```text
T5 Release Sync & KPI: convert NO-GO owner sign-off into the reduced model, rerun readiness/final packet after closures, keep sync-live blocked until liveSyncReady=true, and clean release git scope.
```
