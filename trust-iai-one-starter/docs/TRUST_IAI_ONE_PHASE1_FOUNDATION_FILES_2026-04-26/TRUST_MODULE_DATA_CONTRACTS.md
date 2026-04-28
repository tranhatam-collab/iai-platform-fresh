# TRUST_MODULE_DATA_CONTRACTS.md

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Required before implementation of `trust.iai.one` Phase 1

## 1. Purpose

This document defines the minimum data contract for each Phase 1 module of `trust.iai.one`.

Phase 1 must remain:
- static-first
- proof-aware
- disclosure-aware
- safe for public release
- limited to live or probe-able truth where possible

## 2. Shared contract fields

Every public trust module item should support these core fields where applicable:

- `id`
- `title`
- `status` (`verified`, `declared`, `unverified`)
- `summary`
- `evidence_url` or `evidence_reference`
- `disclosure`
- `last_reviewed_at`
- `stale_after_days`
- `owner_team`
- `public_visibility`
- `notes`

## 3. Module 1 — Official Domains

### Minimum item contract
- `domain`
- `role`
- `status`
- `canonical`
- `owner_team`
- `legal_lane`
- `public_evidence`
- `disclosure`
- `last_reviewed_at`

### Required behavior
- only live or probe-able domains in Phase 1 by default
- unsupported domains must not be shown as operational truth
- domains can still appear if necessary, but must be labeled Declared or Unverified

## 4. Module 2 — Official Teams

### Minimum item contract
- `team_id`
- `team_name`
- `surface_scope`
- `responsibility_summary`
- `status`
- `public_contact_reference`
- `owner_declared`
- `disclosure`
- `last_reviewed_at`

## 5. Module 3 — Official Channels

### Minimum item contract
- `channel_type`
- `label`
- `value`
- `status`
- `scope`
- `use_case`
- `public_evidence`
- `disclosure`
- `last_reviewed_at`

## 6. Module 4 — Verification Methods

### Minimum item contract
- `method_id`
- `title`
- `applies_to`
- `description`
- `status`
- `evidence_reference`
- `limitations`
- `disclosure`
- `last_reviewed_at`

## 7. Module 5 — `/go/*` Short Links

### Minimum item contract
- `slug`
- `destination`
- `owner_scope`
- `status`
- `public_reason`
- `evidence_reference`
- `disclosure`
- `last_reviewed_at`

## 8. Module 6 — Report & Impersonation

### Minimum item contract
- `report_type`
- `label`
- `submission_method`
- `scope`
- `visibility`
- `status`
- `privacy_note`

## 9. Module 7 — Trust Page Builder

### Minimum item contract
- `page_id`
- `subject_type`
- `subject_name`
- `status`
- `verification_methods`
- `official_links`
- `public_contact`
- `disclosure`
- `last_reviewed_at`

## 10. Stale logic contract

All modules must support:
- `last_reviewed_at`
- `stale_after_days`

If age > stale threshold, surface must show warning.

## 11. Visibility contract

Each item should carry a visibility mode:
- `public`
- `member`
- `admin`
- `internal`

Phase 1 should only expose `public` items by default.

## 12. Trust status rendering rules

Each item must render one of:
- Verified
- Declared
- Unverified

Never render an item with no status.

## 13. Storage recommendation for Phase 1

Phase 1 should use simple content-driven data:
- JSON or markdown content files
- static generation
- manual review workflow
- explicit version control

## 14. Team instruction

The team must not begin implementation of a module until:
- the module has an approved item contract
- the allowed evidence type is clear
- the stale rule is clear
- the disclosure fallback is clear
