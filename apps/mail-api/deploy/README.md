# mail-api deploy artifacts (Path B side-by-side container)

This directory contains the production deploy bundle for the
**Path B (inbound webhook)** side-by-side container that runs alongside
the legacy outbound `iai-mail-api` on `mail.iai.one`.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | `node:22-alpine` + su-exec entrypoint pattern |
| `docker-entrypoint.sh` | Chowns volume dir then drops to `node` (uid 1000) |
| `bootstrap.mjs` | Boots `createFlowApiServer({ inboundWebhook: { evidenceSink } })` and listens on `PATH_B_PORT` (default 3001) |

## Architecture context

See `docs/iai-mail-platform/MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md`.

Short version: the new TS-backed runtime exposes `/v1/messages` and
`/v1/webhooks/inbound`. The legacy `iai-mail-api` exposes `/emails`,
`/v1/send`, `/emails/batch`, `/health`, `/domains`. They cannot share a
container without backwards-compat shims in the new code, so they run
side-by-side on different ports.

## Build + ship procedure

From the monorepo root after running `pnpm --filter @iai/mail-api build`:

```bash
# 1. Stage bundle locally
mkdir -p /tmp/path-b-deploy
cp apps/mail-api/deploy/* /tmp/path-b-deploy/
cp -r apps/mail-api/dist /tmp/path-b-deploy/dist
mkdir -p /tmp/path-b-deploy/node_modules/@iai/mail-core
cp -r packages/mail-core/dist /tmp/path-b-deploy/node_modules/@iai/mail-core/
cp packages/mail-core/package.json /tmp/path-b-deploy/node_modules/@iai/mail-core/

# 2. Tarball + scp
tar czf /tmp/path-b-deploy.tar.gz -C /tmp path-b-deploy
scp /tmp/path-b-deploy.tar.gz root@mail.iai.one:/tmp/

# 3. On VPS — extract, build, run
ssh root@mail.iai.one '
  COMMIT=$(git -C /Users/<...>/iai-platform-worktree rev-parse --short HEAD || echo unknown)
  mkdir -p /opt/iai-mail-api-pathb
  cd /opt/iai-mail-api-pathb
  rm -rf ./*
  tar xzf /tmp/path-b-deploy.tar.gz --strip-components=1

  docker build -t iai-mail-api-pathb:${COMMIT} .

  # Stop existing (if any) — graceful, evidence persists in /var/lib/iai-mail-api
  docker rm -f iai-mail-api-pathb 2>/dev/null

  docker run -d \
    --name iai-mail-api-pathb \
    --restart unless-stopped \
    --network mailcowdockerized_mailcow-network \
    --env-file /opt/iai-mail-api/.env \
    -e PATH_B_PORT=3001 \
    -e PATH_B_BIND=0.0.0.0 \
    -v /var/lib/iai-mail-api:/var/lib/iai-mail-api \
    -p 127.0.0.1:3001:3001 \
    iai-mail-api-pathb:${COMMIT}
'
```

## Required environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `MAIL_API_WEBHOOK_SECRET` | **YES** | — | HMAC-SHA256 secret for inbound verification. `openssl rand -hex 32` recommended. Read at request time. |
| `PATH_B_PORT` | no | `3001` | Container listen port |
| `PATH_B_BIND` | no | `0.0.0.0` | Container bind address (must be 0.0.0.0 inside container, port mapping handles host exposure) |
| `PATH_B_EVIDENCE_DIR` | no | `/var/lib/iai-mail-api` | NDJSON evidence persistence dir |

## Volume contract

`/var/lib/iai-mail-api/` must be a writable directory. The entrypoint
chowns it to `node:node` (uid 1000) automatically — host-side directory
ownership does NOT need to be pre-set.

Files inside:

- `inbound-evidence.ndjson` — append-only, ~300 bytes/record. Rotate
  manually past ~500 MB.

## Smoke test (post-deploy)

```bash
SECRET=$(ssh root@mail.iai.one 'grep ^MAIL_API_WEBHOOK_SECRET= /opt/iai-mail-api/.env | cut -d= -f2-')
TS=$(date +%s)
BODY='{"providerEventId":"smoke-deploy-check"}'
SIG=$(printf "%s.%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $NF}')

# Expected: HTTP 202
curl -i -X POST https://mail.iai.one/_mail/v1/webhooks/inbound \
  -H "content-type: application/json" \
  -H "x-mail-webhook-timestamp: $TS" \
  -H "x-mail-webhook-signature: $SIG" \
  -d "$BODY"
```

## Rollback

```bash
docker stop iai-mail-api-pathb && docker rm iai-mail-api-pathb
docker exec mailcowdockerized-nginx-mailcow-1 nginx -s reload
# (legacy outbound on :3000 continues serving uninterrupted)
```
