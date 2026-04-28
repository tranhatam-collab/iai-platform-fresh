# pay.iai.one A1 wrangler copy-ready checklist

Status: proposed
Owner: pay.iai.one
Updated: 2026-04-17

## Purpose

This is the infra-ready command checklist for:

`A1: Bind PAYMENTS_DB and prove production schema readiness`

Use this from the repo root:

```bash
cd '/Users/tranhatam/Documents/Devnewproject/pay.iai.one'
```

## Current expected runtime names

- production worker: `pay-iai-one`
- staging worker: `pay-iai-one-staging`
- production D1: `pay-iai-one-prod`
- staging D1: `pay-iai-one-staging`

## Step 1: confirm wrangler config

```bash
rg -n "account_id|d1_databases|database_name|database_id|PAYMENTS_DB" wrangler.jsonc
```

Expected current ids in repo:

- production D1 id: `e3cbc281-365d-4733-bde1-a84b304ac320`
- staging D1 id: `21a899ba-527d-40b9-bc0e-ba49755d015c`

If those ids are wrong for the live account, stop and fix `wrangler.jsonc` before running anything else.

## Step 2: apply schema to staging

```bash
wrangler d1 execute pay-iai-one-staging --remote --file ./database/0001_init.sql
wrangler d1 execute pay-iai-one-staging --remote --file ./database/0002_internal_smtp_evidence.sql
```

## Step 3: verify staging tables

```bash
wrangler d1 execute pay-iai-one-staging --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Minimum expected tables:

- `payment_intents`
- `payment_attempts`
- `provider_events`
- `service_api_keys`
- `email_receipts`
- `email_delivery_evidence`
- `idempotency_keys`

## Step 4: apply schema to production

```bash
wrangler d1 execute pay-iai-one-prod --remote --file ./database/0001_init.sql
wrangler d1 execute pay-iai-one-prod --remote --file ./database/0002_internal_smtp_evidence.sql
```

## Step 5: verify production tables

```bash
wrangler d1 execute pay-iai-one-prod --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
wrangler d1 execute pay-iai-one-prod --remote --command "SELECT COUNT(*) AS payment_intents_count FROM payment_intents;"
wrangler d1 execute pay-iai-one-prod --remote --command "SELECT COUNT(*) AS provider_events_count FROM provider_events;"
wrangler d1 execute pay-iai-one-prod --remote --command "SELECT COUNT(*) AS email_delivery_evidence_count FROM email_delivery_evidence;"
```

## Step 6: redeploy worker

```bash
wrangler deploy --env production
```

## Step 7: smoke-check health

```bash
curl -sS https://pay.iai.one/health
curl -sS https://pay.iai.one/v1/providers
```

## Step 8: capture A1 evidence

Save or paste into the issue:

- `wrangler.jsonc` D1 binding snippet
- staging table query output
- production table query output
- production `GET /health` JSON
- production `GET /v1/providers` JSON

## A1 done gate

Do not close A1 until all are true:

- production `PAYMENTS_DB` binding is active
- production schema is applied
- required tables are queryable remotely
- worker is redeployed after schema work
- production health response is captured as evidence

## Important notes

- `GET /health` alone is not enough; table queries are mandatory
- do not paste secrets into shell history for A1
- if the production account or D1 names differ from this file, update the commands before running
