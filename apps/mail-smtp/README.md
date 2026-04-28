# mail-smtp

SMTP submission runtime skeleton for `smtp.mail.iai.one`.

Current scope:
- boot a STARTTLS-capable SMTP listener on port `587`
- enforce "AUTH only after TLS" at the runtime edge
- expose `/health` and `/health/dependencies` on a sidecar HTTP port
- provide a local stub backend so the SMTP runtime can be smoke-tested before the real auth/policy/queue services land
- expose a remote adapter mode so auth/policy/normalize/queue/audit can route to the real control-plane backend
- normalize raw MIME into the shared message model with text/html bodies, recipient headers, attachment metadata, `messageId`, `traceId`, and `smtpSessionId`
- map queue handoff into the shared worker/timeline contract exported by `@iai/mail-core`
- centralize env parsing in `@iai/config/mail-smtp`
- ship a local operator smoke script at `apps/mail-smtp/scripts/mail-smtp-smoke.sh`

What is intentionally still a stub:
- DB-backed SMTP read model for credential lookup, sender/domain policy, and suppression state
- real queue transport into `mail-worker`
- persistence into `messages`, `message_events`, and `delivery_attempts`
- metrics aggregation beyond the local health snapshot

Remote backend mode:
- set `MAIL_SMTP_BACKEND_MODE=remote`
- point `MAIL_SMTP_REMOTE_BASE_URL` at the internal control-plane adapter
- optionally set `MAIL_SMTP_REMOTE_TOKEN` for service-to-service auth
- by default the runtime will call:
  - `POST auth`
  - `POST mail-from`
  - `POST recipient`
  - `POST normalize`
  - `POST queue`
  - `POST audit`
- each endpoint may return either:
  - a raw JSON object matching the TypeScript seam contract, or
  - the standard API envelope `{ ok, data, error }`
- `normalize` and `queue` receive `rawMimeBase64` instead of a raw `Buffer`
- if remote `normalize` omits newer fields, runtime will backfill the local MIME parse for compatibility
- `/health/dependencies` still reads from `MAIL_API_DEPENDENCIES_HEALTH_URL`

Next implementation targets for the team:
1. implement the 6 remote backend endpoints behind the shipped adapter contract
2. replace the stub source with a real DB-backed read model for auth, sender/domain policy, and suppressions
3. have team `mail.iai.one` wrap real `POST /normalize` and `POST /queue` handlers, then persist into `messages`, `message_events`, and `delivery_attempts`
4. connect real queue transport from SMTP into the shipped worker/backend runtime and keep the SMTP trace contract aligned
5. add end-to-end SMTP client tests outside the current sandboxed port-binding limits
6. export telemetry to the shared observability pipeline used by the runbooks
