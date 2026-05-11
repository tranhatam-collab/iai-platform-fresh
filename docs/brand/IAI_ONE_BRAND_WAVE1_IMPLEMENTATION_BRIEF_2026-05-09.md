# IAI One Brand Wave 1 Implementation Brief

Date: 2026-05-09
Applied in repo: 2026-05-12
Status: `WAVE_1_BRIEF_READY_FOR_REVIEW`

## 1. Scope

Wave 1 covers only:
- `iai.one/root`
- `flow.iai.one`

Wave 1 does not cover:
- `pay.iai.one`
- `invoice.iai.one`
- `web.iai.one`
- `developer.iai.one`
- `dash.iai.one`
- `cios.iai.one`
- `cdn.iai.one`
- `life.iai.one`
- any production deploy without Founder preview approval

## 2. Objective

Apply Brand v2 rules to a small controlled pilot so Team 1, Team 2, and Team 3 can prove the workflow before touching the rest of the ecosystem.

Wave 1 must produce evidence, not just code.

## 3. Required Inputs

Before implementation:
- confirm the source path for `iai.one/root`
- confirm the source path for `flow.iai.one`
- confirm the active brand source files
- confirm assets/tokens/marks to apply
- confirm no payment or invoice files are touched

If `flow.iai.one` source is outside this repo, record the actual source path in `INTEGRATION.md`.

## 4. Allowed Changes

Allowed only after signoff:
- brand token usage for the approved surfaces
- approved logo/mark usage
- approved OG/social image references
- bilingual label normalization if already covered by canonical language docs
- page metadata alignment for approved surfaces
- local preview-only evidence

## 5. Disallowed Changes

Do not change:
- payment runtime behavior
- checkout logic
- invoice logic
- provider secrets or env bindings
- unrelated app copy
- routing behavior outside the target surfaces
- production deployment config

## 6. Evidence Folder Standard

Each Wave 1 target must provide:

```text
docs/brand/evidence/wave1/<surface>/
  INTEGRATION.md
  QA_REPORT.md
  PREVIEW_APPROVAL.md
  ROLLBACK.md
  screenshots/
```

Git may not track large screenshots if policy says evidence stays local. In that case, record local evidence paths in the markdown files.

## 7. Team Tasks

| Team | Task | Output |
|---|---|---|
| Team 1 | Verify brand source, bilingual copy, SEO metadata, and docs. | Team 1 signoff row. |
| Team 2 | Verify source mapping and runtime safety for `flow.iai.one`. | Team 2 signoff row. |
| Team 3 | Verify release sync impact and prevent overclaim. | Team 3 signoff row. |
| Team 0 / Founder | Approve preview before broader rollout. | Founder decision row. |

## 8. QA Requirements

Minimum QA:
- local render or preview URL captured
- desktop screenshot
- mobile screenshot
- bilingual toggle state if present
- SEO title/description/canonical check
- no console/runtime error if browser QA is available
- no unrelated file changes in final diff

## 9. Exit Criteria

Wave 1 may close only when:
- `INTEGRATION.md` exists for each target
- `QA_REPORT.md` exists for each target
- `PREVIEW_APPROVAL.md` is signed or explicitly rejected
- Team 1 signs
- Team 2 signs
- Team 3 signs
- Founder decides next action

## 10. Current Decision

Current decision: `READY_FOR_TEAM_REVIEW`.

No implementation, production deploy, or full rollout is authorized by this brief alone.
