# MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_STATUS_2026-04-28

- Generated at: 2026-04-28 (Asia/Ho_Chi_Minh)
- Owner: TEAM_MAIL_IAI_ONE
- Scope: Inbound webhook (Path B) — verify provider deliveries with HMAC,
  persist evidence, expose ops query route.

## Status

`PATH_B_CODE_READY_AWAITING_RUNTIME_DEPLOY_AND_SECRET`

Code is implemented, typechecked, built, and covered by automated tests.
Deployment and secret binding are external dependencies that must be
completed by the runtime owner before this surface goes live.

## Endpoint contract (locked)

- POST `/v1/webhooks/inbound`
  - Headers (case-insensitive):
    - `content-type: application/json`
    - `x-mail-webhook-timestamp: <unix_seconds>`
    - `x-mail-webhook-signature: <lowercase hex HMAC-SHA256>`
      where signed payload is `${timestamp}.${rawBody}`
  - Body: provider-shaped JSON (≤ 256 KiB)
  - Replay window: ±300 seconds
  - Responses:
    - `202` — accepted, evidence recorded, returns
      `{ ok: true, data: { evidence_id, provider_event_id, received_at } }`
    - `401` — signature invalid / signature missing / timestamp missing
    - `408` — timestamp outside replay window
    - `413` — body exceeds max bytes
    - `503` — `MAIL_API_WEBHOOK_SECRET` not configured
- GET `/v1/webhooks/inbound/evidence`
  - Query params (all optional):
    - `evidence_id` — return matching record (200) or 404
    - `provider_event_id` — return matching record (200) or 404
    - `limit` (default 50, max 500) — return newest-first list
  - Response shape: `{ ok: true, data: <record> | { items, total, returned, limit } }`

## Secret resolution

- Read at request time from `process.env.MAIL_API_WEBHOOK_SECRET`.
- Rotation does NOT require process restart; new value is picked up on the
  next request. Test suite covers the missing-secret path returning 503.

## Evidence sinks shipped

- `createInMemoryInboundWebhookEvidenceSink()` — default; data lost on
  restart; suitable for local dev and tests.
- `createFileInboundWebhookEvidenceSink(filePath)` — production-safe
  single-instance NDJSON sink. Each accepted/rejected request appends one
  JSON line. Existing file is reloaded on construction so the GET evidence
  query route still works after a restart.
- For multi-instance deployments, point both writers at shared persistent
  storage or replace with a DB-backed sink that implements the
  `InboundWebhookEvidenceSink` interface.

## Code references

- `apps/mail-api/src/inbound-webhook.ts` — verify + handler + sinks
- `apps/mail-api/src/server.ts` — wires `createInboundWebhookHandler` into
  the request pipeline before the SMTP backend handler
- `apps/mail-api/src/index.ts` — re-exports the public Path B API
- `tests/integration/mail-api-inbound-webhook.test.mjs` — 13 tests covering
  signature verification, handler responses, GET evidence (list, by
  evidence_id, by provider_event_id, miss → 404), and file-backed sink
  persistence across instances.

## Verification commands

```bash
pnpm --filter @iai/mail-api typecheck
pnpm --filter @iai/mail-api build
node --test tests/integration/mail-api-inbound-webhook.test.mjs
```

Last verified locally on 2026-04-28: 13/13 tests pass.

## What's still required to declare Path B live

These items are deploy/runtime responsibilities and are NOT code blockers:

1. Bind `MAIL_API_WEBHOOK_SECRET` in the production runtime environment.
   Use the same value the provider is configured to sign with.
2. Deploy the latest `apps/mail-api` build that includes
   `inbound-webhook.ts` to the production runtime serving
   `mail.iai.one`.
3. Optional but recommended: configure
   `createFileInboundWebhookEvidenceSink(...)` (or a DB-backed sink) as
   the sink so `/v1/webhooks/inbound/evidence` survives restarts.
4. Send a signed test request from the provider; expect `202` with
   `evidence_id`. Then `GET /v1/webhooks/inbound/evidence?provider_event_id=...`
   should return that record.
5. Capture the test response + GET evidence read-back into the inbound
   evidence packet and update the Path B verdict in the verification
   log.

## Anti-overclaim note

Until items 1–5 above are completed against the production runtime, this
surface MUST be reported as `PATH_B_CODE_READY_AWAITING_RUNTIME_DEPLOY_AND_SECRET`.
Do NOT mark Path B as live, GA, or release-ready before then.

## Update 2026-04-28T09:54Z — runtime deploy completed

Items 1–5 above have been performed against the production runtime.
See `MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md`
for the deploy log, smoke-test matrix, first production `evidence_id`
and rollback procedure. The surface is now reported as
`PATH_B_LIVE_PRODUCTION` (commit `ff9e334`).

Subsequent code change in the same window: the ad-hoc `bootstrap.mjs`
that hosted the listen call has been replaced by an in-package
entrypoint `apps/mail-api/src/bootstrap.ts` (exported as
`bootstrapFromEnv`, `buildServerOptionsFromEnv`, package `bin`
`iai-mail-api`, subpath export `@iai/mail-api/bootstrap`). Env-driven
sink config is centralised in `resolveInboundWebhookOptionsFromEnv` and
covered by `tests/integration/mail-api-bootstrap.test.mjs` (8/8 pass).
The next image rebuild should run `node ./dist/bootstrap.js` rather
than the legacy bundle's `bootstrap.mjs`; the two paths are
behaviourally equivalent, so the running container does not require an
emergency swap.
