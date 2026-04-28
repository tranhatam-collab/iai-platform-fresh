# verification-log.md

Last build: 2026-04-26T06:37:18.206Z
Build commit: 33c9fe3
Probe method: dig + curl HEAD
Stale after: 30 days

## Summary

- verified: 13
- declared (official but public proof incomplete): 1
- unverified: 0
- outside Phase 1 scope (no DNS): 5

## Verified domains

- iai.one | root | http 200 | dns 104.21.8.122, 172.67.139.112
- home.iai.one | root portal | http 200 | dns 172.67.139.112, 104.21.8.122
- dash.iai.one | operator surface | http 200 | dns 104.21.8.122, 172.67.139.112
- noos.iai.one | commerce surface | http 200 | dns 172.67.139.112, 104.21.8.122
- nft.iai.one | verifiable asset surface | http 200 | dns 172.67.139.112, 104.21.8.122
- flow.iai.one | product surface | http 200 | dns 104.21.8.122, 172.67.139.112
- app.iai.one | product surface | http 200 | dns 172.67.139.112, 104.21.8.122
- developer.iai.one | developer surface | http 200 | dns 172.67.139.112, 104.21.8.122
- docs.iai.one | developer docs | http 200 | dns 104.21.8.122, 172.67.139.112
- cios.iai.one | internal operations | http 200 | dns 104.21.8.122, 172.67.139.112
- pay.iai.one | payment control plane | http 200 | dns 172.67.139.112, 104.21.8.122
- mail.iai.one | mail control plane | http 200 | dns 89.167.116.167
- trust.iai.one | trust surface | http 200 | dns 104.21.8.122, 172.67.139.112

## Declared or unverified

- api.flow.iai.one | developer api | status declared | http 404

## Outside Phase 1 verified scope

- invoice.iai.one | invoice control plane | reason: dns_not_resolving
- cdn.iai.one | cdn edge | reason: dns_not_resolving
- flows.iai.one | automation surface | reason: dns_not_resolving
- web.iai.one | web surface | reason: dns_not_resolving
- root.iai.one | root surface | reason: dns_not_resolving

## Notes

- This log is regenerated on every build of trust.iai.one.
- "verified" means DNS resolved and HTTP returned 2xx or 3xx at probe time. It does not assert content correctness.
- "declared" means official but public proof is incomplete at build time.
- Domains in "outside Phase 1 verified scope" are not presented as verified on the Trust page.
