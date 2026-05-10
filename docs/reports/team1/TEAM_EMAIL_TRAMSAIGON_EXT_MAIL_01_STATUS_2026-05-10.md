# TEAM_EMAIL_TRAMSAIGON_EXT_MAIL_01_STATUS_2026-05-10
- Generated at: 2026-05-10T02:57:19.020Z
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
- FAIL `dns_dkim_present` — No DKIM TXT record in dns-live-proof.json.
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

## Next commands
- `pnpm report:tramsaigon-ext-mail-01 -- --date=2026-05-10`
- `dig +short MX tramsaigon.com`
- `dig +short TXT tramsaigon.com`
- `dig +short TXT _dmarc.tramsaigon.com`
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env production`
- `wrangler secret list --config pay.iai.one/wrangler.jsonc --env staging`

