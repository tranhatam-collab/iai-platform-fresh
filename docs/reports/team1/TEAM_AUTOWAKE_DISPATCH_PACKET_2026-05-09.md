# TEAM_REMINDER_DISPATCH_PACKET_2026-05-09
- Generated at: 2026-05-09T11:17:44.945Z
- Timezone: Asia/Ho_Chi_Minh
- Cadence: every 10 minutes
- Active rows: 3

## Reminder Commands

### 1. Team 1

- team_id: `team-1`
- logical_channel: `surface-language-noos-docs-life`
- owner: `Surface/Language Owner`
- status: `ACTIVE`
- stop_condition: noos-web bilingual audit passes and public surface wording/legal/docs guardrails are accepted.

```text
T1 Surface & Language: close the 2 remaining noos-web bilingual issues, remove or registry-route hard-coded public copy, keep docs/developer/life wording legal-safe, rerun pnpm test:noos-web and bilingual audit.
```

### 2. Team 2

- team_id: `team-2`
- logical_channel: `cdn-flows-cios-runtime-proof`
- owner: `Infra/Runtime Owner`
- status: `ACTIVE`
- stop_condition: CIOS closure is ready and CDN/Flows production evidence is complete or formally NOT_PUBLIC_READY.

```text
T2 Infra & Runtime Evidence: hydrate ../cios.iai.one, pass evidence guard/upstream Vitest/strict smoke, close CDN 5 refs and Flows 3 refs, or formally mark CDN/Flows NOT_PUBLIC_READY with Team 1 acceptance.
```

### 3. Team 3

- team_id: `team-3`
- logical_channel: `release-sync-kpi-final-gate`
- owner: `Release Sync Owner`
- status: `ACTIVE`
- stop_condition: Team 3 live-sync readiness/final packet pass, batch ready to commit is PASS, and git scope is clean or intentionally staged.

```text
Team 3 Release Sync & KPI: close owner sign-off/NO-GO for the reduced visible model, rerun readiness/final packet after closures, keep sync-live blocked until liveSyncReady=true, and clean release git scope.
```
