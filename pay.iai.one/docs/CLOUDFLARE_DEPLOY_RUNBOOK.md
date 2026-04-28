# Cloudflare Deploy Runbook For pay.iai.one

This is the shortest safe path to the first live dev link for `pay.iai.one`.

## Current Reality

Right now the codebase is ready for the first deployment package, but deployment is blocked by infrastructure access, not by application code.

What is still missing:

- Cloudflare access that can actually see the `iai.one` zone
- Worker deploy permission on the account that owns `iai.one`
- D1 create or bind permission
- real `payOS` keys
- real email sender verification

No VPS is needed for this phase. Cloudflare Workers + D1 is enough for the first secure release.

## What I Need From You

Send these through secure env setup or dashboard actions, not pasted into chat:

1. Cloudflare access that can manage the account that owns `iai.one`
2. `iai.one` zone ID
3. D1 database ID after creation, or permission for me to create it
4. `payOS` sandbox or live keys:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY`
   - `PAYOS_CHECKSUM_KEY`
5. Payment email sending setup:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE_TRANSPORT`
   - `SMTP_AUTH_MODE`
   - `SMTP_USERNAME`
   - `SMTP_PASSWORD`
   - verified sending domain for `iai.one`
6. Confirmation of sender emails:
   - `pay@iai.one`
   - `billing@iai.one`
   - `support@iai.one`

## Step 1: Create The Worker

In the Cloudflare account that owns `iai.one`:

1. Go to Workers & Pages
2. Create Worker
3. Use the script name `pay-iai-one`
4. Keep the runtime on the current Workers default

If you prefer CLI, the project already expects:

```bash
wrangler deploy --env production
```

## Step 2: Create D1

Create one D1 database for production:

```bash
wrangler d1 create pay-iai-one-prod
```

After creation, copy the database ID and place it into `wrangler.jsonc` under the `PAYMENTS_DB` binding.

Recommended names:

- production: `pay-iai-one-prod`
- staging: `pay-iai-one-staging`

## Step 3: Bind D1 In wrangler.jsonc

Uncomment and fill this block in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "PAYMENTS_DB",
    "database_name": "pay-iai-one-prod",
    "database_id": "REAL_PROD_D1_ID",
    "preview_database_id": "REAL_STAGING_D1_ID",
    "migrations_dir": "./database",
    "remote": true
  }
]
```

## Step 4: Apply Schema

Run the schema files in order:

```bash
wrangler d1 execute pay-iai-one-prod --remote --file ./database/0001_init.sql
wrangler d1 execute pay-iai-one-prod --remote --file ./database/0002_internal_smtp_evidence.sql
```

Then verify quickly:

```bash
wrangler d1 execute pay-iai-one-prod --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

This matters because `health` only proves binding presence. It does not prove the schema has been applied.

## Step 5: Set Required Secrets

Set the production secrets directly in Cloudflare, one by one:

```bash
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT
wrangler secret put SMTP_SECURE_TRANSPORT
wrangler secret put SMTP_AUTH_MODE
wrangler secret put SMTP_USERNAME
wrangler secret put SMTP_PASSWORD
wrangler secret put SMTP_HELO_DOMAIN
wrangler secret put EMAIL_FROM_PAY
wrangler secret put EMAIL_FROM_BILLING
wrangler secret put EMAIL_REPLY_TO_SUPPORT
wrangler secret put TURNSTILE_SECRET
wrangler secret put PAYOS_CLIENT_ID
wrangler secret put PAYOS_API_KEY
wrangler secret put PAYOS_CHECKSUM_KEY
```

Then set non-secret vars in `wrangler.jsonc` or dashboard:

- `PAY_ENV=production`
- `PAY_API_BASE_URL=https://pay.iai.one`

Optional later, not gate today:

- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `ZALOPAY_APP_ID`
- `ZALOPAY_KEY1`
- `ZALOPAY_KEY2`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Step 6: Verify Email Domain

Before receipts can be treated as live:

1. Verify the sending domain in the internal SMTP provider
2. Verify DNS records for the sender domain
3. Confirm all three sender addresses exist and route correctly

Required mailbox roles for payment mail:

- `pay@iai.one`: receipt and payment sender
- `billing@iai.one`: billing status and renewal/failure sender
- `support@iai.one`: reply-to and support inbox

## Step 7: Add Custom Domain

Bind the Worker to:

- `pay.iai.one`

Do not create a proxied CNAME from `pay.iai.one` to `*.workers.dev` when the zone and Worker live in different Cloudflare accounts. Cloudflare will block that with Error 1014: `CNAME Cross-User Banned`.

Use Cloudflare-managed `Custom Domain` binding for the Worker instead of a manual CNAME whenever possible.

Important account rule:

- the Worker and the Cloudflare zone that owns `pay.iai.one` should live in the same account for the fast path
- if they live in different accounts, you either need Cloudflare for SaaS or you need to redeploy the Worker into the account that owns `iai.one`

## Step 8: First Smoke Test

After deploy, verify these endpoints in order:

1. `GET https://pay.iai.one/health`
2. `GET https://pay.iai.one/v1/providers`
3. `POST https://pay.iai.one/v1/checkout/sessions`
4. `POST https://pay.iai.one/v1/providers/payos/confirm-webhook`

Expected progression:

- `health` responds 200
- `providers` lists `payOS` first
- checkout creates a provider session once D1 and secrets are ready
- webhook confirmation succeeds once the callback URL is registered in `payOS`

## What To Send Me Back

Once you finish the dashboard side, send me only these non-secret facts:

- `iai.one` zone ID
- Worker name actually created
- D1 database ID
- whether the schema apply command succeeded
- whether the custom domain binding for `pay.iai.one` is attached
- whether `payOS` keys are already set in runtime
- whether `RESEND_API_KEY` is already set in runtime

That is enough for me to continue with deploy verification and the first real end-to-end payment pass.
