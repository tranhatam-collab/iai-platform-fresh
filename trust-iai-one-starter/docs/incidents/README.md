# Incidents — trust.iai.one Phase 1

Incidents listed here are the only incidents that may appear on the public Trust page (Module 6).

## Hard rules

1. **No fake incidents.** Phase 1 starts with an empty list. The page renders an explicit empty-state disclosure.
2. **Human-reviewed.** A human must confirm scope, impact, and root cause before the incident moves out of `draft` status.
3. **Disclosure timeline.** Incidents that materially affect users should be drafted within 24 hours of internal awareness. Phase 1 does not enforce SLA technically; Phase 2 will.
4. **Append-only.** Once published, an incident entry is never deleted. Updates extend the entry.

## Statuses

- `draft` — internal only, not yet on Trust page
- `published` — visible on Trust page, root cause may still be partial
- `resolved` — fix shipped, entry retained for history

## Schema for published incidents

When ready to publish, add to `scripts/trust-state-builder.mjs` `incidents` array:

```json
{
  "id": "INC-2026-XX-NNN",
  "title": "<short title>",
  "status": "published | resolved",
  "impact": "low | medium | high",
  "first_observed": "YYYY-MM-DD",
  "published_at": "YYYY-MM-DDTHH:MM:SSZ",
  "summary": "<what happened, who was affected, what the user should do>",
  "root_cause": "<plain language root cause, or 'pending' if not yet known>",
  "fix_commit": "<git hash or 'pending'>",
  "evidence_links": []
}
```

## What does not belong here

- Marketing announcements
- Routine deploys
- Pre-production tests
- Internal-only incidents that did not affect any user surface
