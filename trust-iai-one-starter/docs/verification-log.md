# verification-log.md

Last build: 2026-04-28T11:52:20.325Z
Build commit: e1ae171
Probe method: dig + curl HEAD
Stale after: 30 days
Status enum: verified | declared | unverified

## Module 1 — Official Domains

Counts: verified=13, declared=5

- iai.one | status: verified | role: constitutional root | owner: founder | http: 200 | dns: 172.67.139.112, 104.21.8.122
- home.iai.one | status: verified | role: routing portal | owner: trust-pmo | http: 200 | dns: 104.21.8.122, 172.67.139.112
- trust.iai.one | status: verified | role: operational trust surface | owner: trust-pmo | http: 200 | dns: 104.21.8.122, 172.67.139.112
- dash.iai.one | status: verified | role: operator surface | owner: team-2 | http: 200 | dns: 172.67.139.112, 104.21.8.122
- noos.iai.one | status: verified | role: commerce surface | owner: team-3 | http: 200 | dns: 172.67.139.112, 104.21.8.122
- nft.iai.one | status: verified | role: verifiable asset surface | owner: trust-pmo | http: 200 | dns: 104.21.8.122, 172.67.139.112
- flow.iai.one | status: verified | role: orchestration surface | owner: team-flow | http: 200 | dns: 104.21.8.122, 172.67.139.112
- app.iai.one | status: verified | role: authenticated app surface | owner: team-app | http: 200 | dns: 104.21.8.122, 172.67.139.112
- developer.iai.one | status: verified | role: developer onboarding | owner: team-a | http: 200 | dns: 172.67.139.112, 104.21.8.122
- docs.iai.one | status: verified | role: documentation | owner: team-a | http: 200 | dns: 172.67.139.112, 104.21.8.122
- api.flow.iai.one | status: declared | role: developer api | owner: team-a | http: 404 | dns: 172.67.139.112, 104.21.8.122
- cios.iai.one | status: verified | role: internal operations system | owner: team-c | http: 200 | dns: 104.21.8.122, 172.67.139.112
- pay.iai.one | status: verified | role: payment control plane | owner: pay-email | http: 200 | dns: 104.21.8.122, 172.67.139.112
- mail.iai.one | status: verified | role: mail control plane | owner: pay-email | http: 200 | dns: 89.167.116.167
- cdn.iai.one | status: declared | role: cdn edge | owner: team-b-cdn | http: — | dns: —
- flows.iai.one | status: declared | role: automation surface | owner: team-b-flows | http: — | dns: —
- web.iai.one | status: declared | role: web surface | owner: team-5 | http: — | dns: —
- root.iai.one | status: declared | role: root surface | owner: trust-pmo | http: — | dns: —

## Module 2 — Official Teams

- founder | status: declared | scope: scope, escalation, role boundary approval
- trust-pmo | status: declared | scope: domain registry, ownership registry, mismatch review, stale review
- pay-email | status: declared | scope: pay.iai.one, mail.iai.one, payment activation, email evidence
- team-2 | status: declared | scope: dash.iai.one, runtime probe, shared platform contract verification
- team-3 | status: declared | scope: noos.iai.one commerce metadata, contract enforcement
- team-a | status: unverified | scope: developer.iai.one, docs.iai.one, api.flow.iai.one
- team-b-cdn | status: unverified | scope: cdn.iai.one delivery, cache, rule snapshots
- team-b-flows | status: unverified | scope: flows.iai.one route map, runtime, screenshots
- team-c | status: declared | scope: cios.iai.one closure, screenshot pack, smoke
- team-5 | status: declared | scope: web.iai.one KPI loop, synchronized live readiness

## Module 3 — Official Channels

- email | Trust mailbox | status: declared
- report-form | Trust report form | status: verified
- verification-log | Verification log | status: verified
- trust-state-feed | Trust state JSON | status: verified

## Module 4 — Verification Methods

- M-01 | DNS resolution probe | status: verified
- M-02 | HTTP HEAD probe | status: verified
- M-03 | Source proof | status: declared
- M-04 | Owner declaration | status: declared
- M-05 | Content correctness | status: unverified

## Module 5 — /go/* Short Links

- (none in Phase 1)

## Module 6 — Report & Impersonation

- mismatch | Data mismatch / sai lệch dữ liệu | status: verified | via: in-page form (Module 7) + email fallback to trust@iai.one
- stale_claim | Stale claim / tuyên bố quá hạn | status: verified | via: in-page form (Module 7) + email fallback to trust@iai.one
- impersonation | Impersonation / giả mạo | status: declared | via: email to trust@iai.one (subject: impersonation report)
- unverified_claim | Unverified claim / tuyên bố chưa xác minh | status: verified | via: in-page form (Module 7) + email fallback to trust@iai.one

## Module 7 — Trust Page Builder

- trust-iai-one | trust.iai.one | status: declared

## Notes

- This log is regenerated on every build of trust.iai.one.
- "verified" means probe + content are inline-supported. "declared" means officially stated with limited public proof. "unverified" means not enough proof to make a public claim.
- Domains, teams, channels, methods, and pages with last_reviewed_at older than 30 days appear with a stale flag in the public surface.
