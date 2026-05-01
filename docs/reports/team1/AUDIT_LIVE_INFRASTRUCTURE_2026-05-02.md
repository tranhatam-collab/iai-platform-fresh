# AUDIT — Live Infrastructure (Cloudflare + GitHub + Web Live)

- Date: `2026-05-02`
- Probe time: `2026-05-01 17:42 UTC` to `2026-05-01 17:50 UTC`
- Auditor: Control Tower (Opus 4.7)
- Method: read-only `dig`, `curl -I`, Cloudflare API (`wrangler` OAuth), GitHub public API
- Scope: 18 domains in `trust-state.json official_domains` + 3 Cloudflare accounts owned by founder + GitHub `tranhatam-collab` (33 repos)
- Status: Read-only audit. No infrastructure modifications. No commits. No deploys.

---

## A. Web live HTTP probe (18 domains)

Probe matrix from `dig +short A @1.1.1.1` and `curl -I https://<domain>/`:

| Domain | DNS A | HTTP | Stack signal | Trust-state expected | Match |
|---|---|---|---|---|---|
| iai.one | Cloudflare (104.21.8.122 / 172.67.139.112) | 200 | Worker (DYNAMIC) | verified/public | OK |
| home.iai.one | Cloudflare | 200 | Worker | verified/public | OK |
| trust.iai.one | Cloudflare | 200 | Pages with strict CSP | verified/public | OK |
| dash.iai.one | Cloudflare | 200 | Pages | verified/hold (must noindex) | **GAP — no `x-robots-tag` on response** |
| noos.iai.one | Cloudflare | 200 | Pages | verified/public | OK |
| nft.iai.one | Cloudflare | 200 | Pages | verified/public | OK |
| flow.iai.one | Cloudflare | 200 | Pages | verified/public | OK |
| app.iai.one | Cloudflare | 200 | Next.js (`x-nextjs-prerender`, `x-next-cache-tags`) | verified/public | OK |
| developer.iai.one | Cloudflare | 200 | Worker | verified/public | OK |
| docs.iai.one | Cloudflare | 200 | Pages, HSTS preload, strict CSP, COOP/CORP | verified/public | OK |
| api.flow.iai.one | Cloudflare | 404 on `/` | Worker API (CORS allow `https://flow.iai.one`) | verified/internal | **GAP — no `x-robots-tag`** |
| cios.iai.one | Cloudflare | 200 | Worker | verified/public | OK |
| pay.iai.one | Cloudflare | 200 | Worker JSON, `cache-control: no-store` | verified/hold (must noindex) | **GAP — no `x-robots-tag`** |
| mail.iai.one | non-CF (89.167.116.167) | 200 | nginx + Roundcube (`MCSESSID` cookie, `x-robots-tag: none`) | verified/internal | OK (separate lane) |
| cdn.iai.one | NONE | — | — | declared/hold | OK (correctly absent) |
| flows.iai.one | NONE | — | — | declared/hold | OK (correctly absent) |
| web.iai.one | NONE | — | — | declared/hold | OK (correctly absent) |
| root.iai.one | NONE | — | — | declared (alias of root) | **GAP — declared in trust-state but no DNS** |

Findings:

- 14 of 18 domains live with HTTP 200 (`mail` separate lane, 13 Cloudflare).
- 3 hold-domains (`web`, `cdn`, `flows`) correctly have no DNS — matches plan v2 §1 hard lock.
- 1 declared domain (`root.iai.one`) is in trust-state but has no DNS — D12.
- 3 surfaces (`dash`, `pay`, `api.flow`) lack `x-robots-tag` header in production response — D11. Repo code in `apps/dash`, `apps/pay`, and the relevant API does set the header, so the running version is older than the repo.

---

## B. Cloudflare account state (3 accounts)

Wrangler OAuth (read-only enumeration) confirms:

### B1. Account `Tranhatam` (`f3f9e76222dcb488d5e303e29e8ba192`) — owns zone `iai.one`

Zones in this account include `iai.one`, `tranhatam.com`, `omdala.com`, `muonnoi.org`, `angeledutamfoundation.com`, `tueban.com`, etc.

Pages projects relevant to `*.iai.one`:

| Pages project | Custom domains | GitHub-linked | Last deploy | Notes |
|---|---|---|---|---|
| `home-iai-one` | `iai-one.pages.dev` (no `home.iai.one` custom domain attached) | Yes | ~1 month | Linked to repo `Home.iai.one`, NOT to monorepo. **D8.** |
| `docs-iai-one` | `docs.iai.one`, `www.docs.iai.one` | Yes | ~1 month | Custom domain attached. Source repo unknown. |
| `trust-iai-one` | `trust.iai.one`, `www.trust.iai.one` | Yes | ~2 months | OK. |
| `iai-dash` | `dash.iai.one`, `www.dash.iai.one` | No (direct upload) | ~3 weeks | No GitHub link. Source-of-truth not in monorepo. **D8.** |
| `nft-iai-one` | `nft.iai.one` | No | ~1 month | Direct upload. **D8.** |
| `flow-iai-one` | `flow-iai-one.pages.dev` (no `flow.iai.one` custom domain attached) | Yes | ~3 weeks | Custom domain missing on Pages config. Live serves through other route. **D8.** |
| `app-iai-one` | `app-iai-one.pages.dev` (no `app.iai.one` custom domain attached) | Yes | ~3 weeks | Same Pages-vs-live mismatch. **D8.** |
| `noos-iai-one` | `noos.iai.one` | No | ~2 weeks | Direct upload. **D8.** |
| `life-iai-one` | `life.iai.one` | No | ~1 week | Direct upload. Trust-state classification needs cross-check. |
| `life-code-os` | `lifecode.iai.one` | Yes | ~4 days | OK. |

### B2. Workers in account `Tranhatam` (selected, iai-related)

| Worker | Modified (UTC) | Bindings of note |
|---|---|---|
| `iai-api-production` | 2026-04-10 06:39 | `DB` (D1), `CACHE` (KV), `JWT_SECRET`, `MAIL_API_KEY`, `ANTHROPIC_API_KEY` |
| `iai-api` | 2026-04-06 14:14 | `DB`, `CACHE`, `MEDIA` (R2), `N8N_BASE_URL` |
| `iai-api-preview` | 2026-04-10 07:53 | preview env |
| `iai-flow-api` | 2026-04-09 16:14 | `DB`, `FILES` (R2), `EXECUTION_COORDINATOR` (Durable Object) |
| `iai-pay` | 2026-04-23 16:19 | `MAIL_API_KEY`, `PAY_EMAIL_ADAPTER_INTERNAL_KEY` |
| `pay-iai-one` | **2026-05-01 10:28** | `PAY_API_BASE_URL`, `PAYMENTS_DB` (D1), `PAY_IAI_ONE_WEBHOOK_SECRET`. Most recent deploy. **D10.** |
| `iai-flow-engine` | 2026-03-15 18:11 | `EXECUTION_COORDINATOR`, `FLOW_RUNTIME_SECRET` |
| `tranhatam-platforms-api` | 2026-04-29 07:48 | `AUTOMATION_QUEUE`, `ASSETS` (R2), `DB` |
| `life-code-api` | 2026-04-26 18:15 | `LIFE_CODE_DB` |

### B3. Account `Anhhatam` (`62d57eaa548617aeecac766e5a1cb98e`)

Zones: `aiaccountingloop.com`, `lamviecmuonnoi.com` (pending), `nguyenlananh.com`, `vetuonglai.com`.

Workers of note (relevant to drift):

- `pay-iai-one` (modified 2026-04-14) — same name as `Tranhatam`'s newer `pay-iai-one`. **D9.**
- `trust-iai-one` (modified 2026-04-26) — additional copy.

### B4. Account `Tranhatam66` (`93112cc89181e75335cbd7ef7e392ba3`)

Zones: `iaifoundation.com`, `nhachung.org`, `omdala.com` (pending), `phuongdong.us`, `tramsaigon.com`, `tranhatam.net` (pending), `vietcannew.com`, `phuongdonginsider.com`.

Workers `iai-api`, `iai-api-production`, `iai-api-preview`, `iai-flow-api` exist with the same names (modified between 2026-03-23 and 2026-04-03, all older than `Tranhatam`'s versions). **D9.**

---

## C. GitHub state (`tranhatam-collab`, 33 public repos)

Via public API.

### C1. Critical finding

The local repo `iai-platform-fresh` (HEAD `3048195` after the 2026-05-02 commit, previously `97ee825`) has:

- no `git remote` configured (verified by `git remote -v` returning empty);
- no matching repo on GitHub `tranhatam-collab` (verified by listing the 33 public repos).

Older single-surface repos exist on GitHub (`Home.iai.one`, `docs.iai.one`, `cios.iai.one`, `iai-flow-engine`, `app-mobile-noos.iai.one`, `iai.one-platform`) but their last push dates are between 2026-03-15 and 2026-04-09 — before the Batch 1, Batch 1.1, and Plan V2 work landed locally.

This means:

- the entire post-2026-04-09 work in `iai-platform-fresh` (including all Pay-gate hardening and the W1A/W1B evidence shape) lives only on this disk;
- no CI deploy is possible until the repo is pushed;
- founder review and audit cannot occur over GitHub. **D7.**

### C2. Most recent activity on GitHub

- `AI.OMDALA.COM` — pushed 2026-05-01 17:04 UTC, default branch `OMCODE/team1-continuous-plan-sync-20260428`, size 3.9 MB. This is a separate orchestration / docs repo. Not the monorepo.
- `nguyenlananh.com` — pushed 2026-04-30, unrelated.
- `Tranhatam.net` — pushed 2026-04-16 on branch `claude/sync-website-repo-OPLV5`.

### C3. Repo ↔ Cloudflare Pages mapping risk

Pages project `home-iai-one` is most likely linked to the older single-surface repo `Home.iai.one` (last push 2026-03-28). When Wave 1A preview deploy runs from the monorepo, the Pages project source must either be:

1. switched to the new monorepo path `apps/home`; or
2. replaced by a brand new Pages project bound to `home.iai.one` and the monorepo source.

Without that decision, a preview deploy from `iai-platform-fresh` will not reach the live `home.iai.one` host. This is the core of **D8**.

---

## D. Repo-vs-live drift summary

| Surface | Local repo `iai-platform-fresh` HEAD `3048195` | GitHub `tranhatam-collab` | Cloudflare live source | Drift |
|---|---|---|---|---|
| `iai.one` (root) | `apps/root/` includes Batch 1.1 + D2/D3 closeout | not pushed | Worker `iai-api-production`, modified 2026-04-10 | ~3 weeks behind |
| `home.iai.one` | `apps/home/` includes Batch 1.1 + D2/D3 closeout | older repo `Home.iai.one`, last push 2026-03-28 | Pages `home-iai-one`, last deploy ~1 month ago | ~5 weeks behind, plus repo source mismatch |
| `docs.iai.one` | `apps/docs/` updated for D2/D3 | older repo `docs.iai.one`, last push 2026-03-28 | Pages `docs-iai-one`, last deploy ~1 month ago | ~5 weeks behind |
| `pay.iai.one` | `apps/pay/` includes Batch 1.1 (web flag, gate, D2/D3) | not pushed | Worker `pay-iai-one`, modified 2026-05-01 10:28 | recent deploy of unverified source |
| `dash.iai.one` | `apps/dash/` (unchanged in 3048195) | not pushed | Pages `iai-dash`, direct upload, last deploy ~3 weeks ago | older than repo, no GitHub link |
| `web.iai.one` | `apps/web/` Batch 1.1 release-hold wording | not pushed | not deployed | OK (correctly absent) |

---

## E. Header conformance check (production)

Plan v2 §4 gate matrix requires technical / hold surfaces to carry `x-robots-tag: noindex, nofollow`. Production responses observed:

| Surface | Repo code sets it? | Production header | Match |
|---|---|---|---|
| `pay.iai.one` | yes (`apps/pay/src/server.ts`) | header NOT present in HEAD response | NO |
| `dash.iai.one` | yes (`apps/dash/src/server.ts` + meta robots in render) | header NOT present in HEAD response | NO |
| `api.flow.iai.one` | unverified | header NOT present in HEAD response | NO |
| `mail.iai.one` | nginx layer (`x-robots-tag: none`) | header present (`none`) | acceptable for internal mail UI |

D11 captures the redeploy work to make production carry the header repo intends.

---

## F. Deferred items raised by this audit

| ID | Deferred item | Plan v2 §7 row |
|---|---|---|
| D7 | Push `iai-platform-fresh` to GitHub `tranhatam-collab` | added |
| D8 | Reconcile Cloudflare Pages source-of-truth before Wave 1A preview deploy | added |
| D9 | Multi-account worker name drift (`iai-api*`, `pay-iai-one`) | added |
| D10 | Verify `pay-iai-one` worker source (deployed 2026-05-01 10:28) | added |
| D11 | `dash`, `pay`, `api.flow` missing `x-robots-tag` in production | added |
| D12 | `root.iai.one` declared in trust-state but has no DNS | added |

All six are now tracked in `TEAM1_ALL_WEB_COMPLETION_PLAN_V2_2026-05-01.md` §7.

---

## G. Recommendations (not actions)

This audit does not act. It reports. Owners and waves are assigned in plan v2 §7. The two W1A-deploy-blocking items are:

1. **D7** — push the monorepo to GitHub before any Wave 1A preview deploy.
2. **D8** — decide and execute Pages source reconciliation before any Wave 1A preview deploy.

Until those are closed, repo-side QC may proceed but no preview deploy may be triggered. Founder review of the W1A packet shape may proceed in parallel.

---

*End of audit. Read-only. No state was changed.*
