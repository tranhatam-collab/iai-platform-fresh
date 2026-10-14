# cdn skeleton

> **Planned direction (not released) · Định hướng (chưa phát hành)**
> This directory is a minimal skeleton. It is not a service, it has no features, and nothing here is deployed.

The role map lists `cdn.iai.one` as internal infrastructure for static assets. Which assets are served, who uploads them, how long they are cached and whether the product is a Worker, Pages or storage configuration are not decided in the repository.

## What the skeleton does

- `GET /health` answers `200` with `{"status":"not_implemented"}`. It never reports `ok`.
- It defines no other endpoint, because no endpoint is documented in the repository.
- Every other path is `404` and every other method on a known path is `405` with an `Allow` header.
- A request body above 16 KiB is refused with `413`.
- No response carries a CORS header.
- No credential can be checked, so no caller is identified and no route is allowed to do any work. The headers `x-user-id` and `x-tenant-id` are never read.

## What it does not do

It has no storage, no outgoing network call, no dependency, no secret and no deployment configuration: there is no wrangler file, no route, no custom domain and no account or namespace identifier. Anything about assets, cache policy, storage or a hostname is left open on purpose.

## Run and test

```
pnpm --filter @iai/cdn build
pnpm --filter @iai/cdn test
CDN_PORT=4391 pnpm --filter @iai/cdn start    # listens on 127.0.0.1
```

The tests are hermetic (`node:test`, a server on a random local port). They check that the health answer is honest, that every request outside the contract is refused, that credentials and identity headers change nothing, that oversized bodies are refused, that no CORS header is sent, and that the directory contains no deployment or secret configuration.
