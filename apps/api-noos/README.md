# api-noos skeleton

> **Planned direction (not released) · Định hướng (chưa phát hành)**
> This directory is a minimal skeleton. It is not a service, it has no features, and nothing here is deployed.

The role map lists `api.noos.iai.one` as the control-plane API of the NOOS layer. Its API contract (version 0.2.0, kept outside this repository) lists 24 operations on 19 paths. This skeleton fixes only those paths and methods, under the `/v1` prefix that the NOOS mobile app uses by default, so that a caller meets a refusal that says the truth. It copies no description, schema or example from the contract.

## What the skeleton does

- `GET /health` answers `200` with `{"status":"not_implemented"}`. It never reports `ok`.
- Each of the 24 operations listed below (19 paths) answers `401` with `WWW-Authenticate: Bearer` when the request has no bearer credential, and `501` with `{"error":"not_implemented"}` when it has one. The credential is never checked: any bearer value gives the same answer.
- Every other path is `404` and every other method on a known path is `405` with an `Allow` header.
- A request body above 16 KiB is refused with `413`.
- No response carries a CORS header.
- No credential can be checked, so no caller is identified and no route is allowed to do any work. The headers `x-user-id` and `x-tenant-id` are never read.

## What it does not do

It has no storage, no outgoing network call, no dependency, no secret and no deployment configuration: there is no wrangler file, no route, no custom domain and no account or namespace identifier. Which service issues bearer tokens, where data would be stored and whether a Worker exists at all are not decided; the skeleton checks no token.

## Operations (path and method only)

All paths are under `/v1`.

| Method | Path |
|---|---|
| GET | `/missions` |
| POST | `/missions` |
| GET | `/missions/{missionId}` |
| GET | `/twins` |
| POST | `/twins` |
| GET | `/twins/{twinId}` |
| PATCH | `/twins/{twinId}` |
| GET | `/interplanetary-twins` |
| POST | `/interplanetary-twins` |
| GET | `/interplanetary-twins/{twinId}` |
| PATCH | `/interplanetary-twins/{twinId}` |
| POST | `/telemetry/events` |
| GET | `/telemetry/events/{eventId}` |
| POST | `/intents` |
| GET | `/intents/{intentId}` |
| POST | `/intents/{intentId}/approve` |
| POST | `/intents/{intentId}/reject` |
| POST | `/intents/{intentId}/rollback` |
| GET | `/policy-envelopes/{policyId}` |
| POST | `/evidence-records` |
| GET | `/evidence-records/{recordId}` |
| POST | `/dtn-bundles` |
| GET | `/dtn-bundles/{bundleId}` |
| GET | `/federation-policies/{policyId}` |

## Run and test

```
pnpm --filter @iai/api-noos build
pnpm --filter @iai/api-noos test
API_NOOS_PORT=4394 pnpm --filter @iai/api-noos start    # listens on 127.0.0.1
```

The tests are hermetic (`node:test`, a server on a random local port). They check that the health answer is honest, that every request outside the contract is refused, that credentials and identity headers change nothing, that oversized bodies are refused, that no CORS header is sent, and that the directory contains no deployment or secret configuration.
