# IAI One Ecosystem Brand Rollout Approval Report

Date: 2026-05-09
Applied in repo: 2026-05-12
Status: `WAVE_0_AND_WAVE_1_APPROVAL_PACKET_READY`
Authority: Team 0 / Founder final approval, Team 1 gate authority, Team 2 runtime evidence, Team 3 release sync

## 1. Verdict

The ecosystem is not approved for full brand rollout yet.

Approved scope for team review:
- Wave 0: canonical brand documentation, tokens, marks, approval checklist, and rollout control docs.
- Wave 1: controlled pilot for `iai.one/root` and `flow.iai.one` only.

Not approved:
- Full ecosystem rollout.
- Production deploy from this packet alone.
- `pay.iai.one` or `invoice.iai.one` brand rollout while payment gates are not explicitly green.
- Broad edits to `apps/pay`, `apps/web`, `apps/developer`, `apps/flow`, or shared `content/*` without lane owner approval.

## 2. Current Alignment Check

| Plan area | Current assessment | Decision |
|---|---|---|
| Brand v2 master lock and assets | Docs/assets may exist outside this repo, but this repo did not have tracked `docs/brand` rollout control files before this packet. | Apply Wave 0 governance docs. |
| Flow pilot | Pilot is allowed only with evidence: integration note, QA report, screenshots, and preview approval. | Prepare Wave 1 brief; do not claim complete. |
| Other domains | No broad rollout approval is present. | Hard stop until Wave 1 is approved. |
| Team 1 control tower | Team 1 remains gate authority. | Team 1 owns approval packet and final verdict. |
| Team 2 infra/runtime | Team 2 owns runtime evidence for CDN, Flow, CIOS, and DNS-related proof. | Team 2 must attach production evidence before release claims. |
| Team 3 release sync | Team 3 owns release sync, KPI, live readiness, and no-go rollup. | Team 3 must block sync-live claim until gates pass. |
| Pay and Team D | Payment activation and external evidence are separate from brand rollout. | Do not couple brand approval to payment launch claims. |

## 3. Canonical Brand Inputs

Teams must use only canonical sources approved by Team 0 / Founder:

| Source | Purpose | Approval state |
|---|---|---|
| `docs/brand/IAI_BRAND_SYSTEM_V2_MASTER_LOCK.md` | Brand v2 rules and lock state if present locally. | Founder review required. |
| `docs/brand/dist/` | Generated tokens, marks, OG templates, and brand assets if present locally. | Use only after Wave 0 approval. |
| `docs/IAI_LANGUAGE_GLOSSARY_CANONICAL_2026.md` | Naming, bilingual terminology, and forbidden wording. | Canonical. |
| `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md` | Language and SEO rules. | Canonical. |
| `docs/SURFACE_SOURCE_OF_TRUTH.md` | Source mapping for public surfaces. | Must be checked before edits. |

If a canonical file is missing in a working copy, teams must record `MISSING_SOURCE` in their evidence and must not invent replacement rules.

## 4. Ecosystem Mapping

| Surface | Owner lane | Rollout wave | Decision |
|---|---|---:|---|
| `iai.one/root` | Team 1 | Wave 1 | Pilot candidate. |
| `flow.iai.one` | Team 2 + Team 3 | Wave 1 | Pilot candidate with preview approval. |
| `home.iai.one` | Team 1 | Wave 2 | Hold until Wave 1 passes. |
| `app.iai.one` | Team 1 | Wave 2 | Hold until Wave 1 passes. |
| `dash.iai.one` | Team 2 | Wave 2 | Hold; verify runtime/source first. |
| `web.iai.one` | Team 3 | Wave 3 | Hold until release sync gate passes. |
| `developer.iai.one` | Team 1 | Wave 3 | Hold until owner sign-off. |
| `docs.iai.one` | Team 1 | Wave 3 | Hold until owner sign-off. |
| `cios.iai.one` | Team 2 | Wave 3 | Hold until CIOS closure evidence. |
| `cdn.iai.one` | Team 2 | Wave 3 | Hold until CDN evidence. |
| `nft.iai.one` | Team 2 | Wave 4 | Hold until prior waves pass. |
| `trust.iai.one` | Team 3 | Wave 4 | Hold until release sync gate passes. |
| `noos.iai.one` | Team 1 | Wave 4 | Hold until bilingual audit passes. |
| `life.iai.one` | Team 1 | Wave 5 | Hold; high content volume risk. |
| `pay.iai.one` | Payment owner + Team 3 | Blocked | No brand rollout until pay gate green. |
| `invoice.iai.one` | Payment owner + Team 3 | Blocked | No brand rollout until payment/invoice gate green. |

## 5. Rollout Waves

| Wave | Scope | Exit criteria |
|---|---|---|
| Wave 0 | Docs, source list, token review, signoff template. | Founder and Team 1 acknowledge packet. |
| Wave 1 | `iai.one/root` and `flow.iai.one` pilot only. | Integration note, QA report, screenshots, preview approval. |
| Wave 2 | `home`, `app`, `dash`. | Wave 1 accepted and source mappings verified. |
| Wave 3 | `web`, `developer`, `docs`, `cios`, `cdn`. | Owner sign-off and runtime evidence complete. |
| Wave 4 | `nft`, `trust`, `noos`. | Bilingual and surface-specific QA pass. |
| Wave 5 | `life`, payment-adjacent surfaces, long-tail content. | Explicit Founder approval and domain owner evidence. |

## 6. File Patterns Under Control

Potentially affected files after approval:
- `apps/*/src/render.ts`
- `apps/*/src/i18n.ts`
- `content/en.json`
- `content/vi.json`
- `content/seo-registry.csv`
- public assets and OG templates
- QA evidence under approved report folders

These patterns are not approval to edit every file. Each wave must list exact files before implementation.

## 7. Hard Stops

Stop immediately if any condition is true:
- No preview approval for Wave 1.
- Missing source-of-truth mapping for a target domain.
- Payment gate is not green for `pay` or `invoice`.
- Team 2 cannot produce runtime evidence for a runtime-owned surface.
- Team 3 release sync says `NOT_READY`.
- A team attempts production deploy from this approval packet alone.

## 8. Required Evidence

Each implementation wave must attach:
- `INTEGRATION.md`
- `QA_REPORT.md`
- screenshot pack or rendered proof
- `PREVIEW_APPROVAL.md`
- exact git diff summary
- rollback note

## 9. Recommendation

Approve only Wave 0 and Wave 1 for now.

Do not approve full ecosystem rollout until Wave 1 has real preview approval and Team 1 / Team 2 / Team 3 all sign the template in this folder.
