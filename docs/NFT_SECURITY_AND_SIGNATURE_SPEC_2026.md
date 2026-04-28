# NFT_SECURITY_AND_SIGNATURE_SPEC_2026

Status: LOCKED
Scope: nft.iai.one signature, hash and issuer security

## 1. Hashing

Use SHA-256 for:
- `metadata_hash`
- `image_hash`
- `proof_hash`

Format: `sha256:<hex>`

## 2. Signature

Use EIP-712 structured data signature for issuance proof.

Signed fields:
- `schema_version`
- `collection`
- `token_id`
- `issuer`
- `subject_wallet`
- `metadata_hash`
- `image_hash`
- `proof_hash`
- `issued_at`
- `status_url`

## 3. Issuer wallet

Only allowlisted issuer wallets may sign production tokens.

Required table `issuers`:
- issuer_id
- name
- domain
- wallet_address
- status
- created_at

## 4. Signature validation

Verify API must check:
- signature exists
- signer matches issuer wallet
- signed payload matches current metadata hashes
- status is not revoked

## 5. Revocation

Revocation does not delete token.
Revocation changes credential status.

Reasons:
- incorrect_subject
- issuer_error
- holder_request
- fraud_detected
- dispute
- replacement_issued

## 6. Audit log

Every issuance action must write:
- actor
- action
- collection
- token_id
- timestamp
- hashes
- signature
- ip/user-agent if available

## 7. Forbidden

- Do not store issuer private key in frontend.
- Do not expose signing secret.
- Do not mint without audit log.
- Do not overwrite issued metadata silently.
- Do not delete revoked token records.
