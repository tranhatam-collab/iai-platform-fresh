# CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026

# Cloudflare Domain -> Project -> Account -> Owner Matrix
## Version 1.0
## Status: LOCKED - INFRA OWNERSHIP TRUTH
## Scope: *.iai.one
## Date: 2026-04-14

---

## 1. Purpose

This file is the mandatory infra ownership truth for release-safe operations.

It exists to prevent:
- unknown deployment authority
- cross-team overwrite on wrong project/account
- release confusion across shared domains

No production deploy is allowed unless target rows are filled and verified.

---

## 2. Required columns

Each row must define:
- domain
- Cloudflare project or worker
- Cloudflare account id
- primary owner team
- named owner
- backup owner
- deploy authority (who can approve production deploy)
- freeze tier
- last verified date

### 2.1 Sensitive ID policy
- Public repo stores stable Cloudflare account aliases.
- Raw numeric account ids are stored in secured ops vault and release tooling.
- Alias mismatch with release tooling is treated as a hard-stop condition.

---

## 3. Matrix (locked for current release cycle)

| Domain | CF Project/Worker | CF Account ID | Owner Team | Named Owner | Backup Owner | Deploy Authority | Freeze Tier | Last Verified |
|---|---|---|---|---|---|---|---|---|
| `iai.one` | `apps/root (Pages: iai-root)` | `cf_acc_platform_primary` | Team A | `Team A Lead (Acting)` | `Team 1 Program Root` | Team A Lead | Tier 0 | `2026-04-14` |
| `home.iai.one` | `apps/home (Pages: iai-home)` | `cf_acc_platform_primary` | Team A | `Team A Portal Owner` | `Team 1 Program Root` | Team A Lead | Tier 1 | `2026-04-14` |
| `docs.iai.one` | `docs.iai.one static surface (Pages: iai-docs)` | `cf_acc_platform_primary` | Team A | `Team A Docs Owner` | `Team 1 Program Root` | Team A Lead | Tier 1 | `2026-04-14` |
| `developer.iai.one` | `Developer docs surface (Pages: iai-developer)` | `cf_acc_platform_primary` | Team A | `Team A DevRel Owner` | `Team 1 Program Root` | Team A Lead | Tier 1 | `2026-04-14` |
| `app.iai.one` | `app runtime surface (Worker/Pages: iai-app)` | `cf_acc_product_core` | Team B | `Team B App Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `flow.iai.one` | `apps/flow (Pages: iai-flow)` | `cf_acc_product_core` | Team B | `Team B Flow Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `dash.iai.one` | `dash runtime surface (Pages/Worker: iai-dash)` | `cf_acc_product_core` | Team B | `Team B Dash Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `api.iai.one` | `workers/api (Service: iai-api)` | `cf_acc_product_core` | Team B | `Team B API Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `api.flow.iai.one` | `workers/api (Route group: flow-api)` | `cf_acc_product_core` | Team B | `Team B Flow API Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `web.iai.one` | `apps/web (Pages: iai-web)` | `cf_acc_growth_primary` | Team C | `Team C Web Owner` | `Team C Growth Backup` | Team C Lead | Tier 1 | `2026-04-14` |
| `cios.iai.one` | `cios surface (Pages/Worker: iai-cios)` | `cf_acc_growth_primary` | Team C | `Team C CIOS Owner` | `Team C Growth Backup` | Team C Lead | Tier 1 | `2026-04-14` |
| `noos.iai.one` | `noos surface (Pages: noos-surface)` | `cf_acc_growth_primary` | Team C (Team A approval) | `Team C NOOS Owner` | `Team A Boundary Approver` | Team A + Team C | Tier 0 | `2026-04-14` |
| `mail.iai.one` | `mail-api + mail-smtp + mail-worker` | `cf_acc_product_core` | Team B | `Team B Mail Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `cdn.iai.one` | `zone-level CDN asset rules (iai-assets)` | `cf_acc_platform_primary` | Team B | `Team B Infra CDN Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |
| `flows.iai.one` | `internal automation runtime (n8n/flows)` | `cf_acc_product_core` | Team B | `Team B Automation Owner` | `Team B Runtime Backup` | Team B Lead | Tier 0 | `2026-04-14` |

---

## 4. Validation rules

- No row may keep `TBD` or `UNASSIGNED` for production domains.
- Each owner team must confirm rows by signed commit.
- If account/project mismatch is detected, deploy is auto-blocked.

---

## 5. Release gate usage

Before any production release:
1. confirm domain row is complete
2. confirm deploy authority matches release approver
3. confirm freeze tier rule allows deploy
4. attach verification timestamp in release note

---

## 6. Definition of done

This matrix is considered complete when:
- all active domains have non-`TBD` values
- each row has named and backup owner
- deploy authority is unambiguous
- Team 1 has validated the final matrix snapshot
