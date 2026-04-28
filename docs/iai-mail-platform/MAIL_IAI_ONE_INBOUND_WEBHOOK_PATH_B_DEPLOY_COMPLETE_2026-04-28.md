# MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28

- Generated at: 2026-04-28T09:54Z
- Owner: TEAM_MAIL_IAI_ONE
- Status: **PATH_B_LIVE_PRODUCTION**
- Predecessor: `MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_STATUS_2026-04-28.md`
  (which locked code-ready milestone before runtime deploy)

## Outcome

Inbound webhook (Path B) on `mail.iai.one` flipped from
`PATH_B_CODE_READY_AWAITING_RUNTIME_DEPLOY_AND_SECRET` → `PATH_B_LIVE_PRODUCTION`.

Live endpoint surface:

- `POST https://mail.iai.one/_mail/v1/webhooks/inbound`
- `GET  https://mail.iai.one/_mail/v1/webhooks/inbound/evidence`
  - `?provider_event_id=<id>` — lookup by provider event id
  - `?evidence_id=<id>` — lookup by evidence id
  - `?limit=<1..500>` — list (newest first)

Backend container: `iai-mail-api-pathb:50d4a77` (image SHA
`93e8176b3d8e99c2a0aba461e13278e908a0d8d1fc6dc97fc8863e48e3cb8a1c`).

## Architecture chosen — side-by-side

The new TS-backed runtime exposes a different route shape (`/v1/messages`)
than the legacy hand-written `server.js` (`/emails`, `/v1/send`,
`/emails/batch`). To preserve outbound mail for all 18 ALLOWED_FROM_DOMAINS,
the deploy did NOT replace the legacy container. Instead:

```
                          ┌─────────────────────────────────┐
                          │  mailcow-nginx (public 443)     │
                          └────────────┬────────────────────┘
                                       │
              ┌────────────────────────┼─────────────────────┐
              │                        │                     │
   /_mail/emails/*    /_mail/v1/webhooks/inbound/*   /_mail/health
   /_mail/v1/send                      │              /_mail/domains
   /_mail/emails/batch                 │
              │                        │                     │
              ▼                        ▼                     ▼
      iai-mail-api:3000      iai-mail-api-pathb:3001   iai-mail-api:3000
      (legacy server.js)     (TS dist 50d4a77)         (legacy)
              │                        │
              ▼                        ▼
      postfix-mailcow:25      /var/lib/iai-mail-api/
                              inbound-evidence.ndjson
```

Both containers share `mailcowdockerized_mailcow-network` so nginx can
proxy by service name (`iai-mail-api:3000`, `iai-mail-api-pathb:3001`).

## Deploy steps (performed end-to-end on 2026-04-28)

1. **Bundle deploy artifact locally** (`/tmp/path-b-deploy/`)
   - `dist/` ← `apps/mail-api/dist/` (commit `50d4a77`)
   - `node_modules/@iai/mail-core/` ← `packages/mail-core/dist/` + its
     `package.json` (workspace dep flattened)
   - `bootstrap.mjs` — calls `createFlowApiServer({ inboundWebhook:
     { evidenceSink: createFileInboundWebhookEvidenceSink(...) } })`,
     `.listen(3001, "0.0.0.0")`
   - `Dockerfile` — `node:22-alpine`, USER node, EXPOSE 3001
2. **Local smoke** of bootstrap.mjs against 33333 — confirmed 401 / 202
   paths before transferring.
3. **scp to VPS** at `/opt/iai-mail-api-pathb/` (root@mail.iai.one).
4. **`docker build -t iai-mail-api-pathb:50d4a77 .`** (231 MB image).
5. **`docker run -d --name iai-mail-api-pathb`** with:
   - `--network mailcowdockerized_mailcow-network`
   - `--env-file /opt/iai-mail-api/.env` (inherits `MAIL_API_WEBHOOK_SECRET`)
   - `-e PATH_B_PORT=3001 -e PATH_B_BIND=0.0.0.0`
   - `-v /var/lib/iai-mail-api:/var/lib/iai-mail-api`
   - `-p 127.0.0.1:3001:3001` (loopback only — public reach via nginx)
   - `--restart unless-stopped`
6. **Append nginx routes** to
   `/opt/mailcow-dockerized/data/conf/nginx/site.iai-mail-api.custom`:
   - `location = /_mail/v1/webhooks/inbound`
     → `proxy_pass http://iai-mail-api-pathb:3001/v1/webhooks/inbound`
   - `location = /_mail/v1/webhooks/inbound/evidence`
     → `proxy_pass http://iai-mail-api-pathb:3001/v1/webhooks/inbound/evidence`
   - Pre-deploy backup saved at
     `site.iai-mail-api.custom.bak.<timestamp>`
7. **`docker exec mailcowdockerized-nginx-mailcow-1 nginx -s reload`**.
8. **Public smoke** — 6/6 green (see below).

## Bug found + fixed during deploy

**Symptom:** First request after container start returned `500
INTERNAL_ERROR — Unhandled runtime error.` Evidence sink GET endpoint
showed records WERE being recorded (signature verification works), so
the throw was downstream of `recordEvidence` but before HTTP response
write.

**Root cause:** Container runs as `node` (uid 1000) per `USER node` in
the Dockerfile. The host bind-mount `/var/lib/iai-mail-api` was created
as `root:root` (`drwxr-xr-x 2 root root`). When `FileEvidenceSink#recordEvidence`
called `writeFileSync` on the NDJSON file inside the mounted dir, it
got `EACCES: permission denied`. The `await evidenceSink.recordEvidence(record)`
threw, caught by the server's outer try/catch which silently calls
`respondError(500, "Unhandled runtime error.")` (no error log).

**Fix applied:**
```bash
chown 1000:1000 /var/lib/iai-mail-api
chmod 755 /var/lib/iai-mail-api
docker restart iai-mail-api-pathb
```

**Permanent remediation (recommended for future deploys):** Either
- (a) Add a runbook step "before `docker run`: `chown 1000:1000 <volume_dir>`",
- (b) Drop `USER node` from the Dockerfile and run as root inside container
  (acceptable for small-blast-radius internal services), or
- (c) Add `chown` to a container entrypoint script that runs as root before
  dropping privileges.

**Also recommended:** patch `apps/mail-api/src/server.ts` outer catch to
log `error.message` + `error.stack` (currently silent). The current code
swallows root cause information, making future production debugging
slower than necessary.

## Smoke test evidence (public endpoint, 2026-04-28T09:54Z)

```
T1: POST /_mail/v1/webhooks/inbound (no sig)
    → HTTP 401 ✓
       MAIL_WEBHOOK_TIMESTAMP_MISSING

T2: POST /_mail/v1/webhooks/inbound (valid HMAC)
    → HTTP 202 ✓
       evidence_id = evt_inbound_cecdf16b-6f38-496f-b07f-fd03cad25c96
       provider_event_id = public-smoke-1
       received_at = 2026-04-28T09:54:19.217Z

T3: GET /_mail/v1/webhooks/inbound/evidence?limit=3
    → HTTP 200 ✓ total=3
       - public-smoke-1     sig_valid=true
       - (null providerId)  sig_valid=false  (T1 record)
       - smoke-after-fix    sig_valid=true   (post-perm-fix internal smoke)

T4: GET /_mail/v1/webhooks/inbound/evidence?provider_event_id=public-smoke-1
    → HTTP 200 ✓

T5: POST with timestamp 601s in past (replay defense)
    → HTTP 408 ✓
       MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW
       skew_seconds=601, replay_window_seconds=300

T6: GET /_mail/health (legacy outbound — sanity)
    → HTTP 200 ✓
       {"ok":true,"service":"IAI Mail API","smtp":"postfix-mailcow:25",...}
```

## Operational notes

### Secret rotation
`MAIL_API_WEBHOOK_SECRET` is read from `process.env` by
`resolveSecret()` AT REQUEST TIME (not cached at boot). To rotate:
1. Generate new value: `openssl rand -hex 32`
2. Backup .env: `cp /opt/iai-mail-api/.env /opt/iai-mail-api/.env.bak.<timestamp>`
3. Update line: `sed -i 's|^MAIL_API_WEBHOOK_SECRET=.*|MAIL_API_WEBHOOK_SECRET=<new>|' /opt/iai-mail-api/.env`
4. **Restart required** for `--env-file` changes to take effect on the
   already-running container. (`process.env` is hydrated at container start.)
   ```
   docker restart iai-mail-api-pathb
   ```
5. Coordinate cutover with webhook senders — they must switch to the new
   value at the same moment, or stagger by accepting BOTH for a window.

> Note: The "rotate without restart" property documented in `inbound-webhook.ts`
> applies when `resolveSecret` is overridden to read from a hot-reloaded
> source (e.g., a file watch or KV store). With the default
> `process.env`-based resolver and `--env-file`, restart IS required.

### Rollback (full revert)
```bash
# Stop new container
docker stop iai-mail-api-pathb && docker rm iai-mail-api-pathb

# Restore nginx config
cd /opt/mailcow-dockerized/data/conf/nginx/
mv site.iai-mail-api.custom.bak.<timestamp> site.iai-mail-api.custom
docker exec mailcowdockerized-nginx-mailcow-1 nginx -s reload

# Optional cleanup
docker rmi iai-mail-api-pathb:50d4a77
rm -rf /opt/iai-mail-api-pathb
# (keep /var/lib/iai-mail-api/ for evidence audit trail)
```

After rollback, legacy `iai-mail-api:3000` continues serving `/_mail/emails`,
`/_mail/v1/send`, `/_mail/emails/batch`, `/_mail/health`, `/_mail/domains`
exactly as before. Path B endpoints return 404 on the public surface.

### Evidence file growth
`/var/lib/iai-mail-api/inbound-evidence.ndjson` is append-only NDJSON.
At ~300 bytes per record, even at 100k inbound events/year the file is
~30 MB. No rotation needed for the first year. When it grows past ~500 MB,
rotate manually:
```bash
mv /var/lib/iai-mail-api/inbound-evidence.ndjson \
   /var/lib/iai-mail-api/inbound-evidence.ndjson.<YYYY-MM>
docker restart iai-mail-api-pathb
# (new file created on first record by FileEvidenceSink ctor)
```

For multi-instance scaling later, replace the file-backed sink with a
DB-backed sink (the SinkInterface is already abstracted — see
`InboundWebhookEvidenceSink` in `inbound-webhook.ts`).

## What remains open (post-deploy backlog)

1. **Webhook sender configuration** — no provider is currently signed up
   to send to this endpoint. Once Path B has tenants, document tenant-list
   and per-tenant secret strategy (single shared secret today; per-tenant
   recommended for production multi-provider).
2. **Outbound mail migration** — when the team is ready, migrate
   `/_mail/emails` → `/_mail/v1/messages` so the legacy container can
   retire. Track in a separate ticket; not urgent.
3. **Server.ts error logging patch** — log `error.message`/`stack` in
   the outer catch so future production failures aren't silent (1-line
   change, low risk).
4. **Volume-permission Dockerfile fix** — apply one of the (a)/(b)/(c)
   options above to make future fresh deploys self-healing.

## Artifact registry

| Path | Purpose |
|---|---|
| `apps/mail-api/src/inbound-webhook.ts` | Path B handler source (518 LOC, commit `50d4a77`) |
| `apps/mail-api/dist/inbound-webhook.js` | Compiled output shipped in image |
| `tests/integration/mail-api-inbound-webhook.test.mjs` | 13 tests, all passing on `50d4a77` |
| `/opt/iai-mail-api-pathb/` (VPS) | Source bundle |
| `/var/lib/iai-mail-api/inbound-evidence.ndjson` (VPS) | Persistent evidence |
| `/opt/mailcow-dockerized/data/conf/nginx/site.iai-mail-api.custom` (VPS) | Public route config |
| `iai-mail-api-pathb:50d4a77` (Docker image) | Runtime container image |
| `evt_inbound_cecdf16b-6f38-496f-b07f-fd03cad25c96` | First production evidence id |

## Sign-off

- Code: commit `50d4a77` on branch `OMCODE/smtp-internal-first-phase1`
- Tests: 13/13 pass (verified locally and in container)
- Secret: parked in `/opt/iai-mail-api/.env` (sha256 `20e63b37…f39ea0`, length 64)
- Live: 6/6 public smoke tests green
- Legacy outbound: untouched, verified post-deploy via `T6 /_mail/health`

Path B inbound webhook is **production-ready** as of 2026-04-28T09:54Z.

## Addendum 2026-04-28 — bootstrap.mjs replaced by canonical entrypoint

The hand-written `bootstrap.mjs` shipped in the initial deploy bundle was
an ad-hoc shim. It has been superseded by a first-class entrypoint inside
the package:

- **Source**: `apps/mail-api/src/bootstrap.ts`
- **Compiled**: `dist/bootstrap.js` (built by `pnpm --filter @iai/mail-api build`)
- **Public exports** (`apps/mail-api/src/index.ts`):
  `bootstrapFromEnv`, `buildServerOptionsFromEnv`,
  `resolveInboundWebhookOptionsFromEnv`
- **Package bin**: `iai-mail-api → ./dist/bootstrap.js`
- **Subpath export**: `@iai/mail-api/bootstrap`

Env contract (resolved by `resolveInboundWebhookOptionsFromEnv` +
`buildServerOptionsFromEnv`):

| Var | Default | Effect |
|---|---|---|
| `PORT` | `3000` | Listen port (0 ⇒ ephemeral OS pick, used by tests) |
| `MAIL_API_BIND_ADDRESS` | `0.0.0.0` | Bind address (alias: `API_FLOW_BIND_ADDRESS`) |
| `MAIL_API_WEBHOOK_SECRET` | _unset_ | HMAC secret; if empty → handler responds 503 |
| `MAIL_API_INBOUND_EVIDENCE_FILE` | _unset_ | If set → file-backed NDJSON sink at this path; else in-memory |
| `MAIL_API_INBOUND_REPLAY_WINDOW_S` | `300` | Positive integer; rejects bad values at boot |
| `MAIL_API_INBOUND_MAX_BODY_BYTES` | `262144` | Positive integer; rejects bad values at boot |

On bootstrap success a single JSON line is logged to stdout (level=info,
`msg=mail_api_listening`) including the resolved sink mode/file, replay
window, body cap, and `secret_configured` boolean — suitable for log
scraping.

Tests: `tests/integration/mail-api-bootstrap.test.mjs` (8/8 pass)
covers env resolution branches and verifies a real evidence record
written by one bootstrap lifetime is readable by a fresh bootstrap of
the same env (proves restart-safe persistence).

Operational impact for the live VPS container: next image rebuild
should `CMD ["node", "/app/dist/bootstrap.js"]` (or rely on the `bin`
alias once the package is `npm install`'d). The previously deployed
`bootstrap.mjs` is functionally equivalent — no behavioural change,
just code-locality.

## Addendum 2026-04-28T11:26Z — image rebuilt and swapped to c1b9b3b

The Path B container has been rebuilt against `c1b9b3b` (the commit
that introduced `dist/bootstrap.js` as the canonical entrypoint) and
swapped in place. Legacy `iai-mail-api` was not touched.

- Bundle: `/opt/iai-mail-api-pathb-c1b9b3b/` (Dockerfile now `CMD
  ["node", "/app/dist/bootstrap.js"]`; `bootstrap.mjs` removed from
  the image).
- Image: `iai-mail-api-pathb:c1b9b3b` (unpacked manifest digest
  `sha256:8858d4a1…02bb44`).
- Run command: `--env-file /opt/iai-mail-api/.env` augmented with
  `-e PORT=3001 -e MAIL_API_BIND_ADDRESS=0.0.0.0 -e
  MAIL_API_INBOUND_EVIDENCE_FILE=/var/lib/iai-mail-api/inbound-evidence.ndjson`.
  This overrides the legacy `PORT=3000` from the shared env-file and
  switches the sink path resolution from the in-package default
  (in-memory) to file-backed.
- Volume `/var/lib/iai-mail-api` retained → 8-row evidence NDJSON
  preserved across the swap (continuity verified).
- Port binding `127.0.0.1:3001:3001`, network
  `mailcowdockerized_mailcow-network`, restart `unless-stopped`
  unchanged.
- Graceful shutdown wired in-package: SIGTERM/SIGINT → `server.close()`
  with a 10s force-exit safety net (parity with the prior
  `bootstrap.mjs`).
- Local pre-flight smoke (port 33334) verified 401 / 202 / GET 200 /
  clean SIGTERM exit-0 before the VPS swap.

Public smoke matrix re-run after swap (T1–T6 all green):

| # | Endpoint | Expected | Actual |
|---|---|---|---|
| T1 | POST `/_mail/v1/webhooks/inbound` (no sig) | 401 | 401 |
| T2 | POST signed | 202 + evidence_id | 202 + `evt_inbound_835d2ad0-…` |
| T3 | GET `…/evidence?limit=3` | 200 newest-first | 200, item0 = T2 evidence |
| T4 | GET `…/evidence?provider_event_id=evt_p6_swap_…` | 200 record | 200 record |
| T5 | POST stale ts (now-1000s) | 408 | 408 |
| T6 | GET `/_mail/health` (legacy) | 200 | 200 |

Rollback (if needed): the prior image `iai-mail-api-pathb:6f8c02c`
remains in `docker images`; `docker stop iai-mail-api-pathb && docker
rm iai-mail-api-pathb && docker run -d … iai-mail-api-pathb:6f8c02c`
restores the previous runtime byte-for-byte.

Path B image is now in lockstep with git HEAD (`c1b9b3b`).
