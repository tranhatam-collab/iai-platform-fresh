# docs.iai.one — W1B evidence packet (status: file-shape gap)

- Surface: `docs.iai.one`
- Wave: `W1B`
- Status: `PARTIAL — FILE_SHAPE_INCOMPLETE`
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Plan: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`

## Sign-off line

```
Wave: W1B
Surface: docs.iai.one
QC green: yes (per artifacts/W1B_QC_TEST_SUMMARY_2026-05-01.md)
Deferred items addressed: D2 (closed), D3 (closed)
Founder review status: pending
Founder sign-off date: —
```

## File-shape status against plan v2 §8

| Required file | Present? | Note |
|---|---|---|
| `README.md` | yes (this file) | created 2026-05-02 |
| `qc-results.md` | partial | raw QC output is in `artifacts/W1B_QC_TEST_SUMMARY_2026-05-01.md`; should be normalized into `qc-results.md` per §8 |
| `noindex-proof.md` | **missing** | `docs.iai.one` is a public shell, so this can be `n/a public` per §8; still must exist as a file |
| `canonical-hreflang-proof.md` | **missing** | required for public shell |
| `legal-footer-proof.md` | **missing** | must show `https://docs.iai.one/legal/iai-flow/` and entity `Angel Edu Tam Foundation Inc` (D2/D3 closeout proof) |
| `sitemap-proof.md` | **missing** | required for public shell |
| `domain-proof.md` | **missing** | live `docs.iai.one` returned HTTP 200 in `AUDIT_LIVE_INFRASTRUCTURE_2026-05-02.md` §A; raw `dig`+`curl` output should be captured here |
| `screenshots/` | **missing** | VI shell, EN shell, sitemap, /robots.txt |
| `deferred.md` | **missing** | should list which §7 items touch this surface (D2 closed, D3 closed, D8b open W1B-deploy-blocking) |

## Closure plan

1. W1A packet review proceeds independently of this packet (per §7 hard rule, repo-side review and deploy approval are two separate gates).
2. **Before** founder approves W1B preview deploy, this packet must be brought up to §8 file-shape and D8b (Pages source for `docs-iai-one` linked to monorepo `apps/docs`) must be closed.
3. The pre-deploy evidence narrative file `DOCS_IAI_ONE_W1B_PRE_DEPLOY_EVIDENCE_PACKET_2026-05-01.md` and the QC artifact under `artifacts/` are kept; the §8 standardized files will be added in a dedicated W1B closeout commit.

## Commit basis

`3048195` — same as W1A packets. Will be refreshed to the next commit that lands §7 patch + live infra audit (2026-05-02).
