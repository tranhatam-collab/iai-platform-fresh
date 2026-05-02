# docs.iai.one Release Evidence

- Surface: `docs.iai.one`
- Wave: `W1B`
- Status: `READY_FOR_W1B_PREVIEW_DEPLOY` (D8b closed via path P1 on 2026-05-02 per `docs/reports/team1/TEAM1_W1B_D8B_CLOSEOUT_PATH_P1_2026-05-02.md`; W1B preview deploy executes against canonical legacy `docs-iai-one` Pages binding via Cloudflare dashboard, not against this monorepo. Exact bound repo URL pending founder dashboard read per `docs/reports/team1/artifacts/d8b/DOCS_IAI_ONE_BINDING_CAPTURE_NOTE_2026-05-02.md`. Global hold `PRODUCTION_PUBLICATION_HOLD` still applies; this status only authorizes a preview build.)
- Global state: `PRODUCTION_PUBLICATION_HOLD`
- Plan: `docs/reports/team1/TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md`

## Sign-off line

```
Wave: W1B
Surface: docs.iai.one
QC green: yes (per `qc-results.md` and `artifacts/W1B_QC_TEST_SUMMARY_2026-05-01.md`)
Deferred items addressed: D2 (closed), D3 (closed), D8b (closed via path P1; exact bound repo URL remains a documented dashboard follow-up)
Founder review status: pending
Founder sign-off date: —
```

## File-shape status against plan v2 §8

| Required file | Present? | Note |
|---|---|---|
| `README.md` | yes | this file |
| `qc-results.md` | yes | normalized from current repo-side QC |
| `noindex-proof.md` | yes | `n/a public shell` |
| `canonical-hreflang-proof.md` | yes | repo-side canonical/hreflang proof |
| `legal-footer-proof.md` | yes | D2/D3 repo-side proof |
| `sitemap-proof.md` | yes | repo-side proof |
| `domain-proof.md` | yes | deploy-time live proof still pending |
| `screenshots/` | yes | placeholder with required capture list |
| `deferred.md` | yes | includes post-closeout D8b note and remaining preview/prod items |

## Closure plan

1. W1A packet review proceeds independently of W1B (separate gates in plan §7).
2. D8b is closed via path P1: `docs-iai-one` Pages project is canonical; `apps/docs` is explicitly `experimental, not_live`. Exact GitHub repo URL remains a documented dashboard follow-up, not a preview blocker.
3. The pre-deploy narrative file `DOCS_IAI_ONE_W1B_PRE_DEPLOY_EVIDENCE_PACKET_2026-05-01.md` and QC artifact remain as supporting evidence.

## Commit basis

`aaa0c05` (`docs(team1): patch plan v2 with live infra audit (D7-D12)`, 2026-05-02). Previous bases were `97ee825` and `3048195`.
