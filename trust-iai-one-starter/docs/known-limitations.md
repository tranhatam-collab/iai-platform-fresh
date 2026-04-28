# Known Limitations — trust.iai.one Phase 1

This file is the authoritative source for limitations that apply to trust.iai.one in Phase 1. The Trust page renders these via `src/data/trust-state.json` (Module 5).

Rule: every entry must have a stable ID, a clear bilingual title, a first-reported date, and a status. Do not delete entries when they are addressed — change the status and add a resolved date.

---

## LIM-001 — Build-time data can become stale

- First reported: 2026-04-26
- Status: acknowledged
- Phase 1 disclosure: Domain Registry data is captured at build time. If no new build runs for more than 30 days, entries are auto-flagged as stale.
- Phase 2 fix path: scheduled re-probe (cron) and visible last-checked timestamp on every domain card.

## LIM-002 — Phase 1 has no runtime monitoring

- First reported: 2026-04-26
- Status: acknowledged
- Phase 1 disclosure: this surface does not actively poll domains between builds. It does not show real-time uptime.
- Phase 2 fix path: lightweight runtime probe + incident webhook.

## LIM-003 — Phase 1 does not yet provide user-level data export or deletion through API

- First reported: 2026-04-26
- Status: acknowledged
- Phase 1 disclosure: Module 7 only ships a report form. The page does not claim that view/export/delete APIs work.
- Phase 2 fix path: authenticated user endpoints and SLA disclosure.

## LIM-004 — Domain verification depends on last probe time

- First reported: 2026-04-26
- Status: acknowledged
- Phase 1 disclosure: a "verified" badge means the build-time probe succeeded. It does not assert continuous availability.
- Phase 2 fix path: continuous probing + visible incident link when status flips.

## LIM-005 — Content correctness of each domain is not asserted in Phase 1

- First reported: 2026-04-26
- Status: acknowledged
- Phase 1 disclosure: HTTP 2xx confirms the endpoint serves something. It does not confirm the served content is the intended product.
- Phase 2 fix path: content fingerprint per domain + diff alert.

---

## How to add a new limitation

1. Pick the next ID (LIM-XXX) sequentially.
2. Add a section here with bilingual-friendly title, first-reported date, status, and Phase 2 fix path.
3. Mirror the entry into `scripts/trust-state-builder.mjs` `limitations` array so it appears on the public page.
4. Re-run `npm run trust:build-state`.
5. Commit both files in the same commit.

## How to retire a limitation

- Change status to `resolved`.
- Add a `resolved` date and the commit hash that addressed it.
- Keep the entry visible — never delete history.
