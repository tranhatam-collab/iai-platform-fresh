# TEAM_EMAIL_TRAMSAIGON_EXT_MAIL_01_STATUS_2026-05-10
- Generated at: 2026-05-10T03:58:26.595Z
- Timezone: Asia/Ho_Chi_Minh
- Domain: `tramsaigon.com`
- Scope: `EXT-MAIL-01`
- Status: `EVIDENCE_LOCKED`
- Gap classification: `REAL_EVIDENCE_MISSING`
- Gap reason: Missing clusters: dns_auth, allowlist, delivery_output.
- EXT-MAIL-01 ready: FAIL
- Evidence dir: `docs/release-evidence/pay.iai.one/2026-05-10/tramsaigon.com`

## Checks
- PASS `evidence_dir_present` — Using latest evidence dir <= 2026-05-10: docs/release-evidence/pay.iai.one/2026-05-10/tramsaigon.com
- PASS `dns_proof_file_present` — Using docs/release-evidence/pay.iai.one/2026-05-10/tramsaigon.com/dns-live-proof.json
- FAIL `dns_mx_present` — No MX record in dns-live-proof.json.
- FAIL `dns_spf_present` — No SPF TXT record in dns-live-proof.json.
- PASS `dns_dmarc_present` — DMARC TXT: "v=DMARC1; p=quarantine; rua=mailto:dmarc@iai.one; fo=1"
- PASS `dns_dkim_present` — DKIM TXT entries: s1.domainkey.u97614395.wl146.sendgrid.net., "k=rsa; t=s; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqPK5Dz+ZTfhv+0TuzoNG8hX9k3SkDz7feeu32TXGMWJUBXfmj/DJ7pjWRadMmUqBo19qfVnoOolD5Kvd6Y5nJKddaFwDitt53T8KunSv+7sUiZQuBKTBsM8Aep/5bYsZLHi00oNrJHSSv1oOcigQqb0Pok+8atxpfWqg5VguIdoyA/hvbkEuVCDtg+lu64xeWvkfm" "Q/IoRp9cXuPp50I9AzzfY9OO85wjRpBDkrZq+5wZqdd98wK9/IDJ7LvLUVokQRBoboqwUnhIIW3Kx+Xczhkk+Il3Gg3vCJdsF7XnEoWYjpZzCCfV9Toj2lksl+8QKQPVoFCU6z2qrjg8oiUHQIDAQAB", s2.domainkey.u97614395.wl146.sendgrid.net., "k=rsa; t=s; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqfPik8IazOZVeXiG2qg3M2evKg341cTuz4jbXsPUH6UDOKUBtHxcnB1gXC+XJnJUu6dm1IraiHd5Z9/FwwIWhYA+b8+wxlIKkfrdzbzo0R+LfgNPL5Fdu+IEShT2EI2QYS3TVTUdCzqRwz8fGJDHnOhm78RMk7qFioASD8sjH+5latUHME70ZU2vZDSjaUzVhb8qS" "EkQy7d7tkTatngFjdvXRJpQI0FhDk+Y4+DsCCEgFgF4NCJ0pJQHVUy+nFxMhZkEi7mOL/C2rbZ3AaDbLMLkbPjG+HkI5cdYRGGgXTBkTiQzuqIchZ/LBAk0kEi+2QF9Fy9R02S/I7n7PBxqxwIDAQAB"
- FAIL `allowlist_runtime_proof_present` — allowlist readback is missing or still PENDING.
- PASS `secrets_proof_file_present` — Using docs/release-evidence/pay.iai.one/2026-05-10/tramsaigon.com/secrets-live-proof.json
- PASS `runtime_mail_secrets_bound` — Missing production: none; missing staging: none.
- FAIL `delivery_output_present` — mail-readback.json still marked PENDING_OWNER_EVIDENCE.
- PASS `public_send_not_open` — POST /v1/send status=401

## Cluster Summary
- DNS auth cluster (MX + SPF + DKIM + DMARC): FAIL
- Allowlist runtime proof: FAIL
- Runtime secrets bound (production + staging): PASS
- Delivery output (4 templates with message_id + final_state): FAIL
- Public /v1/send guard: PASS

## Missing Detail
- DNS missing: MX, SPF
- Allowlist missing fields: workspace_id, allowed_domains, verification_status, proof_ref
- Delivery missing templates: payment_receipt, checkout_status_update, payment_failed_notice, refund_notice

## Next commands
- `pnpm report:tramsaigon-ext-mail-01 -- --date=2026-05-10`
- `dig +short MX tramsaigon.com`
- `dig +short TXT tramsaigon.com`
- `dig +short TXT _dmarc.tramsaigon.com`
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env production`
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env staging`

