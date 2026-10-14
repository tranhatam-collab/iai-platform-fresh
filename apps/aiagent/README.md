# aiagent skeleton

> **Planned direction (not released) · Định hướng (chưa phát hành)**
> This directory is a minimal skeleton. It is not a service, it has no features, and nothing here is deployed.

`apps/web` calls `POST /v1/site/generate` on a configurable AI agent API base (`WEB_AIAGENT_API_BASE`). This skeleton only fixes that one call so the caller has something to meet; it answers `501`. The source of the real service, its caller authentication, its model, cost and limits are not known in the repository.

## What the skeleton does

- `GET /health` answers `200` with `{"status":"not_implemented"}`. It never reports `ok`.
- `POST /v1/site/generate` answers `501` with `{"error":"not_implemented"}`.
- Every other path is `404` and every other method on a known path is `405` with an `Allow` header.
- A request body above 16 KiB is refused with `413`.
- No response carries a CORS header.
- No credential can be checked, so no caller is identified and no route is allowed to do any work. The headers `x-user-id` and `x-tenant-id` are never read.

## What it does not do

It has no storage, no outgoing network call, no dependency, no secret and no deployment configuration: there is no wrangler file, no route, no custom domain and no account or namespace identifier. It calls no AI provider and has no quota.

## Run and test

```
pnpm --filter @iai/aiagent build
pnpm --filter @iai/aiagent test
AIAGENT_PORT=4393 pnpm --filter @iai/aiagent start    # listens on 127.0.0.1
```

The tests are hermetic (`node:test`, a server on a random local port). They check that the health answer is honest, that every request outside the contract is refused, that credentials and identity headers change nothing, that oversized bodies are refused, that no CORS header is sent, and that the directory contains no deployment or secret configuration.
