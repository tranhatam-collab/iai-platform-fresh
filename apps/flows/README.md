# flows skeleton

> **Planned direction (not released) · Định hướng (chưa phát hành)**
> This directory is a minimal skeleton. It is not a service, it has no features, and nothing here is deployed.

The role map lists `flows.iai.one` as an internal automation surface. It is not the same surface as `flow.iai.one`. Where the automation runtime runs, how access is controlled and which workflows exist are not decided in the repository.

## What the skeleton does

- `GET /health` answers `200` with `{"status":"not_implemented"}`. It never reports `ok`.
- It defines no other endpoint, because no endpoint is documented in the repository.
- Every other path is `404` and every other method on a known path is `405` with an `Allow` header.
- It reads no request body: nothing is defined that could take one.
- No response carries a CORS header, and every response sets `X-Content-Type-Options: nosniff`.
- The server sets request and header timeouts and listens on `127.0.0.1` unless `FLOWS_HOST` is set.
- No credential can be checked, so no caller is identified and no route is allowed to do any work. The headers `x-user-id` and `x-tenant-id` are never read.

## What it does not do

It has no storage, no outgoing network call, no dependency, no secret and no deployment configuration: there is no wrangler file, no route, no custom domain and no account or namespace identifier. Anything about a runtime, workflows, access control or a hostname is left open on purpose.

## Run and test

```
pnpm --filter @iai/flows build
pnpm --filter @iai/flows test
FLOWS_PORT=4392 pnpm --filter @iai/flows start    # listens on 127.0.0.1
```

The tests are hermetic (`node:test`, a server on a random local port). They check that the health answer is honest, that every request outside the contract is refused, that credentials and identity headers change nothing, that no CORS header is sent, that `nosniff` and the timeouts are set, that the process binds to 127.0.0.1 by default, and that the directory contains no deployment or secret configuration.
