# TEAM1_W1A_D12_CLOSEOUT_2026-05-02

- Date: `2026-05-02`
- Item: `D12 — root.iai.one declared in trust-state but no DNS A record`
- Source audit: `docs/reports/team1/AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §A
- Plan reference: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` §7 row D12
- Wave gated: `W1A` preview deploy (D12 was W1A-blocking)
- Status before: `open`
- Status after: `closed (path B executed)`

---

## 1. What D12 required

Plan v2 §7 row D12 stated that `root.iai.one` was declared in `trust-state.json official_domains` but has no DNS A record, and that the founder must execute exactly one of two paths before W1A preview deploy:

- **Path A** — configure a DNS A record for `root.iai.one` and attach it to a Cloudflare Pages or Worker target consistent with the monorepo;
- **Path B** — remove the entry from `trust-state.json official_domains`, regenerate trust-state, and update `content/site-map.md` accordingly.

Founder decision (this conversation): **path B**. Reason: there is no current product surface that needs `root.iai.one`, no deploy target exists, and keeping the entry creates a misclassification because the trust-state lists it as an official domain while live DNS does not resolve. Path A would have required standing up a real surface, which is out of scope of W1A truth cleanup.

---

## 2. What was done

### 2.1 Source change

`trust-iai-one-starter/scripts/trust-state-builder.mjs` — removed the line:

```diff
-  { domain: "root.iai.one",       role: "root surface",               canonical: true,  owner_team: "trust-pmo",    legal_lane: "root navigation" }
```

A comment was left in place noting that `root.iai.one` was removed on 2026-05-02 under D12 path B, and that re-adding it requires a real surface.

### 2.2 Regeneration

```
$ npm run trust:build-state
trust-state.json written: src/data/trust-state.json
trust-state.json mirrored: public/data/trust-state.json
verification-log.md written: docs/verification-log.md
content/ mirrored to public/content/
Module 1 domains: verified=13, declared=4
Modules 2-7: teams=10, channels=4, methods=5, go=0, reports=4, pages=1
```

Before: `verified=13, declared=5` (total 18).
After: `verified=13, declared=4` (total 17).

### 2.3 Files updated by the regeneration

- `trust-iai-one-starter/scripts/trust-state-builder.mjs` (source)
- `trust-iai-one-starter/src/data/trust-state.json` (build output)
- `trust-iai-one-starter/public/data/trust-state.json` (build output mirror)
- `trust-iai-one-starter/docs/verification-log.md` (build output)

### 2.4 site-map.md check

`content/site-map.md` was checked for `root.iai.one` references — none found, so no edit was required.

```
$ grep -n "root\.iai" content/site-map.md
(no output)
```

---

## 3. Proof — `root.iai.one` removed from trust-state

```
$ grep -c "root.iai.one" trust-iai-one-starter/public/data/trust-state.json trust-iai-one-starter/src/data/trust-state.json
trust-iai-one-starter/public/data/trust-state.json:0
trust-iai-one-starter/src/data/trust-state.json:0
```

Both build outputs contain zero references to `root.iai.one`.

```
$ head -5 trust-iai-one-starter/public/data/trust-state.json
{
  "generated_at": "2026-05-01T19:54:32.796Z",
  "build_commit": "81d1aab",
  "verification_policy": {
    "stale_after_days": 30,
```

`build_commit: "81d1aab"` is the HEAD that existed when builder ran (before this closeout commit). The next build will pick up the closeout commit hash.

---

## 4. What this closeout does NOT do

- It does NOT remove `root.iai.one` from anywhere outside `trust-iai-one-starter/` and `content/site-map.md`. The `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` audit narrative still mentions `root.iai.one` because it is a snapshot of the state on 2026-05-02 17:42 UTC.
- It does NOT trigger any DNS change at registrar level. No DNS record was created or removed for `root.iai.one`.
- It does NOT close D8a (Pages source-of-truth for `home-iai-one`).

After this closeout:

- W1A preview deploy is now blocked **only on D8a** (`home-iai-one` Pages source reconciliation). D7 was already closed in `TEAM1_W1A_D7_CLOSEOUT_2026-05-02.md`.

---

## 5. Sign-off

```
Item: D12
Path: B (remove from trust-state)
Closed: yes
Closed by: founder + Team 1 Control Tower
Date: 2026-05-02
Verification: trust-state.json contains zero "root.iai.one" entries; declared count reduced 5 → 4
```
