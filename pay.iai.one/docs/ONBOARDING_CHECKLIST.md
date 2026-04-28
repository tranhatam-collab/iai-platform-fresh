# Merchant And Platform Onboarding Checklist

## Platform Provisioning

- create subdomain `pay.iai.one`
- create Cloudflare Worker project
- create D1 database
- create queue for receipts and webhook retries
- create production secrets store
- enable WAF, rate limiting, and Access policies

## Internal Platform Defaults

- `PAY_API_BASE_URL=https://pay.iai.one`
- `REFUND_POLICY=manual_review`
- `EMAIL_PROVIDER=internal_smtp`
- `PAY_ENV=production`

## Tenant Onboarding Data Needed Per Site

- `tenant_code`
- `site_code`
- domain
- allowed origin
- success URL
- cancel URL
- callback URL
- support email
- receipt sender email

## Domestic Provider Checklist

### payOS

- merchant account approved
- live API keys issued
- return URL confirmed
- cancel URL confirmed
- webhook URL confirmed
- settlement bank configured

### MoMo

- merchant contract signed
- `partnerCode`, `accessKey`, `secretKey`
- IPN URL confirmed
- refund permission confirmed
- recurring capability confirmed if needed

### ZaloPay

- merchant account approved
- `app_id`, `key1`, `key2`
- callback URL confirmed
- query and refund endpoints confirmed

### VNPay

- merchant account approved
- `tmnCode`, `hashSecret`
- return URL confirmed
- IPN verification confirmed
- refund capability confirmed

## Email And Receipt Checklist

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE_TRANSPORT`
- `SMTP_AUTH_MODE`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_HELO_DOMAIN`
- `EMAIL_FROM_PAY`
- `EMAIL_FROM_BILLING`
- `EMAIL_REPLY_TO_SUPPORT`
- verified sending domain
- tested receipt inbox with real inbox evidence

## Production Gate

- one provider sandbox flow passed
- one provider refund flow passed
- one receipt sent successfully with messageId + D1 evidence + inbox proof
- webhook replay tested
- D1 schema applied
- admin access locked down
