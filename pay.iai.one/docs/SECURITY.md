# pay.iai.one Security Baseline

## First Principle

There is no such thing as absolute security. The correct goal is a payment platform with a very high security baseline, tight blast-radius control, and low PCI exposure.

## Non-Negotiable Rules

1. Never store raw card number, CVV, or track data.
2. Prefer provider-hosted checkout or provider tokenization.
3. Keep provider secrets in Cloudflare secrets, never in D1.
4. Require idempotency keys on write routes.
5. Hash internal site API keys before storage.
6. Verify provider webhook signatures before any fulfillment.
7. Write immutable provider event logs before processing.
8. Record audit logs for refunds, credential rotation, and site key issuance.
9. Default refund policy to `manual_review`.
10. Keep admin surfaces behind Cloudflare Access.

## Cloudflare Controls To Enable

- WAF for `pay.iai.one`
- rate limiting on public write routes
- Turnstile on public browser-origin session creation
- API Shield for schema validation and mTLS where practical
- zero trust access for admin endpoints
- log export and security event review

## Application Controls

- strict origin allow-list per site
- signed internal requests for server-to-server traffic
- nonce and timestamp window for critical callback routes
- queue-based retries instead of synchronous heavy work
- replay protection for webhook event ids
- reconciliation jobs for missed callbacks

## Data Handling

Allowed:

- order ids
- provider order ids
- provider transaction ids
- amount
- currency
- customer email and phone if needed
- receipt data
- minimal metadata

Not allowed:

- raw PAN
- CVV
- 3DS secrets
- provider dashboard passwords

## Release Gates Before Production

1. schema migrated
2. provider sandbox callback verified
3. refund flow tested
4. receipt pipeline verified
5. audit log written for key admin actions
6. rate limiting enabled
7. error monitoring enabled
8. key rotation procedure documented
