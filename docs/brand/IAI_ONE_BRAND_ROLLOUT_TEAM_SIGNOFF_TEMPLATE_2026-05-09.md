# IAI One Brand Rollout Team Signoff Template

Date: 2026-05-09
Applied in repo: 2026-05-12
Status: `SIGNOFF_TEMPLATE_READY`

Use this file for every brand rollout wave. A wave is not approved until all required roles fill the relevant rows.

## 1. Wave Identity

| Field | Value |
|---|---|
| Wave | `Wave __` |
| Target surfaces | `TBD` |
| Planned branch/commit | `TBD` |
| Preview URL | `TBD` |
| Rollback owner | `TBD` |
| Decision requested | `APPROVE_PREVIEW`, `APPROVE_IMPLEMENTATION`, or `REJECT_WITH_REASON` |

## 2. Required Checks

| Check | Owner | Status | Evidence |
|---|---|---|---|
| Canonical brand source exists | Team 1 | `PENDING` | `TBD` |
| Source-of-truth path verified | Team 1 | `PENDING` | `TBD` |
| Runtime/source boundary verified | Team 2 | `PENDING` | `TBD` |
| Release sync impact reviewed | Team 3 | `PENDING` | `TBD` |
| Bilingual copy reviewed | Team 1 | `PENDING` | `TBD` |
| SEO/canonical metadata reviewed | Team 1 | `PENDING` | `TBD` |
| Preview screenshot attached | Implementing team | `PENDING` | `TBD` |
| Rollback note attached | Implementing team | `PENDING` | `TBD` |
| Founder preview approval | Team 0 / Founder | `PENDING` | `TBD` |

## 3. Team 1 Signoff

Scope:
- brand source files
- bilingual content
- SEO metadata
- docs and approval packet

Decision:
- [ ] Approved
- [ ] Rejected
- [ ] Needs changes

Reviewer:

Date:

Evidence:

Notes:

## 4. Team 2 Signoff

Scope:
- runtime safety
- CDN/Flow/CIOS/DNS evidence
- source mapping for runtime surfaces

Decision:
- [ ] Approved
- [ ] Rejected
- [ ] Needs changes

Reviewer:

Date:

Evidence:

Notes:

## 5. Team 3 Signoff

Scope:
- release sync
- KPI impact
- no-go and live readiness
- commit and preview hygiene

Decision:
- [ ] Approved
- [ ] Rejected
- [ ] Needs changes

Reviewer:

Date:

Evidence:

Notes:

## 6. Founder / Team 0 Decision

Decision:
- [ ] Approve Wave 0 only
- [ ] Approve Wave 1 preview only
- [ ] Approve Wave 1 implementation
- [ ] Approve next wave planning
- [ ] Reject / hold rollout

Founder:

Date:

Approval evidence:

Conditions:

## 7. Release Claim Control

Allowed claims after this signoff:
- `READY_FOR_PREVIEW` only if preview exists and QA passes.
- `READY_FOR_IMPLEMENTATION` only if all team checks pass.
- `READY_FOR_PRODUCTION_DEPLOY` only if Founder explicitly approves production deploy.

Forbidden claims:
- `LIVE`
- `SYNC_LIVE`
- `PROJECT_COMPLETE`
- `FULL_ECOSYSTEM_ROLLOUT_COMPLETE`

Those claims require separate release evidence, not this template alone.
