# Security Remediation Deploy Gates

This file names configuration contracts only. It contains no secret values and
is not a production receipt. Source changes remain `VERIFIED_WORKTREE_ONLY`
until the exact commit is released and runtime probes pass.

## Required secret contracts

| Surface | Required secret/config | Consumer |
|---|---|---|
| Mail API | `MAIL_API_KEY` | Mail read models, Dash/Web flow calls, `/v1/send` |
| Mail webhook | `MAIL_API_WEBHOOK_SECRET` | Signed inbound provider webhook |
| Mail SMTP bridge | `MAIL_SMTP_REMOTE_TOKEN` | Private SMTP-to-Mail-API service calls |
| Mail SMTP seed | `MAIL_SMTP_SEED_USERNAME`, `MAIL_SMTP_SEED_PASSWORD`, `MAIL_SMTP_SEED_WORKSPACE_ID`, `MAIL_SMTP_SEED_DEFAULT_SENDER`, `MAIL_SMTP_SEED_PRIMARY_DOMAIN` | Explicit first credential; no default account is created |
| Dash | `DASH_SESSION_SIGNING_SECRET`, `DASH_FLOW_API_KEY` | Signed user session and Mail/Flow API access |
| Web | `WEB_SHARED_FLOW_API_KEY`, `WEB_EVENT_API_KEY` | Shared Flow contract and internal KPI event read/write |
| Verify Runtime | `VERIFY_RUNTIME_SERVICE_TOKEN` | Quota and usage endpoints |
| Pay Worker | `PAY_OPERATOR_API_KEY` | Operator and finance routes |
| NFT runtime | `NFT_PARTNER_SYNC_SECRET` | Partner-sync HMAC |

Use the same generated value for `MAIL_API_KEY`, `DASH_FLOW_API_KEY`, and
`WEB_SHARED_FLOW_API_KEY` only when those consumers are intentionally in the
same trust boundary. All other rows require independent values. Never commit
the values or pass them as command-line arguments.

NFT gated delivery also requires production implementations of the
`verifyStepUpToken` and `verifyWalletSignature` callbacks. The runtime now fails
closed when those verifiers are absent.

## Verify Runtime resource gate

Before deploying `apps/verify-runtime`:

1. Create and migrate D1 from `apps/verify-runtime/migrations/001_usage_ledger.sql`.
2. Replace `REPLACE_AFTER_CREATE` in `apps/verify-runtime/wrangler.toml` with the
   created database ID.
3. Create `verify-usage-events` and `verify-usage-events-dlq` queues.
4. Put `VERIFY_RUNTIME_SERVICE_TOKEN` with `wrangler secret put`.
5. Run the source gate and a Wrangler dry run, then deploy through the protected
   `AI Release` workflow.

The queue consumer retries instead of acknowledging usage when D1 is missing or
persistence fails. Do not remove the dead-letter queue from production config.

## Pay Worker gate

Provision `PAY_OPERATOR_API_KEY` for the production environment in addition to
the existing provider and webhook secrets. Deploy with the explicit production
environment:

```text
wrangler deploy --config pay.iai.one/wrangler.jsonc --env production
```

Then verify that unauthenticated operator routes return `401` (or `503` when the
secret is deliberately absent), checkout URLs remain on the registered merchant
origin, and invalid provider signatures cannot mutate payment state.

## Release evidence sequence

1. Exact commit SHA and clean checkout.
2. `pnpm install --frozen-lockfile`.
3. `pnpm typecheck`, `pnpm test:source`, `pnpm quality:gate`, dependency audit.
4. Target-specific dry run and immutable deployment ID.
5. Auth-negative and authenticated-positive runtime probes.
6. Queue-to-D1 usage receipt, payment webhook receipt, mail delivery receipt.
7. Rollback test and owner approval.

Missing external governance files or sibling workspaces are reported by
`pnpm test:external-evidence`; they must not be replaced with fabricated files
just to make the gate green.
