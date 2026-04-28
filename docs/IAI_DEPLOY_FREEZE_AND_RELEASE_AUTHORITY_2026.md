# IAI_DEPLOY_FREEZE_AND_RELEASE_AUTHORITY_2026

# IAI Deploy Freeze and Release Authority
## Version 1.0
## Status: LOCKED - RELEASE CONTROL TRUTH
## Scope: *.iai.one
## Date: 2026-04-14

---

## 1. Purpose

This file defines:
- deploy freeze levels
- who can approve releases
- when deployments must be blocked

No team may self-approve production deploy outside this authority model.

---

## 2. Freeze tiers

### Tier 0 (Critical)
Domains:
- `iai.one`
- `app.iai.one`
- `flow.iai.one`
- `dash.iai.one`
- `api.iai.one`
- `api.flow.iai.one`
- `noos.iai.one`
- `mail.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

Rule:
- requires owner-team lead approval + Team 1 release gate pass

### Tier 1 (Important)
Domains:
- `home.iai.one`
- `docs.iai.one`
- `developer.iai.one`
- `web.iai.one`
- `cios.iai.one`

Rule:
- requires owner-team lead approval
- Team 1 notified pre-release

---

## 3. Release authority matrix

| Domain Group | Primary Approver | Secondary Approver | Final Gate |
|---|---|---|---|
| Team A domains | Team A Lead | Team 1 Program Root | Team 1 |
| Team B domains | Team B Lead | Team 1 Program Root | Team 1 |
| Team C domains | Team C Lead | Team 1 Program Root | Team 1 (for Tier 0 or mission-impacting changes) |

---

## 4. Hard stop conditions (auto-block)

Deploy must be blocked if:
- Cloudflare ownership row is incomplete in matrix file
- domain role conflicts with mission map
- release note missing rollback plan
- cross-team dependency is unresolved (RED status)
- auth/billing/proof contract impact is unreviewed

---

## 5. Required release note fields

Every production deploy must include:
- target domain
- ticket/task id
- approver names
- rollback command or rollback route
- risk level
- post-deploy verification checklist

---

## 6. Emergency release rule

Emergency release is allowed only if:
- incident severity is critical
- owner lead approves
- Team 1 is informed within 15 minutes
- post-mortem is filed within 24 hours

---

## 7. Definition of done

Release control is considered healthy when:
- no unauthorized production deploy occurs
- all deploys are traceable to approved authority
- freeze violations are zero

---

## 8. P0 release gate checklist (effective April 14, 2026)

A production release is blocked unless all are true:
1. Cloudflare ownership matrix row for target domain is complete and verified.
2. Git hygiene check passes (`git status` + `git fsck --full` clean on release clone).
3. Domain role matches `IAI_MASTER_DOMAIN_MISSION_MAP.md` (no boundary drift).
4. Core test suite for target service is green in release environment.
