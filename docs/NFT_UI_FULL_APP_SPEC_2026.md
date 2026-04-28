# NFT_UI_FULL_APP_SPEC_2026

Status: LOCKED
Scope: nft.iai.one frontend
Purpose: production UI for token view, verify view, registry and issuance preview

## 1. Pages

```
/
/verify/:collection/:tokenId
/token/:collection/:tokenId
/registry/:collection
/issue/preview
/docs/verification
/docs/issuance-policy
/docs/revocation-policy
```

## 2. Homepage

### H1
Verifiable digital assets for IAI

### Subline
NFTs on IAI are proof records, not speculation. Each asset is linked to issuer, subject, metadata hash, signature, status and public verification.

### Sections
- What this verifies
- How verification works
- Public registry
- Issuance policy
- Revocation policy

## 3. Verify page

Must show:
- Status badge
- Issuer
- Subject
- Collection
- Token ID
- Chain
- Contract
- Owner wallet
- Mint transaction
- Metadata hash
- Asset hash
- Proof hash
- Signature status
- Revocation status
- Dispute status

## 4. Token page

Must show:
- NFT image
- Name
- Description
- Attributes
- Owner
- Issuer
- Proof link
- Verification link
- Status

## 5. Registry page

Must show:
- Collection name
- Total issued
- Active
- Revoked
- Disputed
- Latest issued
- Search by token ID / wallet / role

## 6. Issue preview page

Must allow internal team to preview before mint:
- Collection
- Recipient wallet
- Subject role
- External ID hash
- Proof URL
- Asset URL
- Generated metadata
- Generated hash
- Signature preview

Important:

Preview is not issued. Preview must display clear badge:

```
PREVIEW ONLY
NOT ISSUED
NOT VERIFIED
```

## 7. Status badges

Allowed:
- Preview
- Issued
- Valid
- Revoked
- Disputed
- Expired
- Invalid

## 8. UI copy rules

Do not use:
- investment
- profit
- ROI
- floor price
- moon
- rarity value
- financial return

Use:
- proof
- issuer
- subject
- credential
- metadata
- signature
- status
- registry
- verification

## 9. Empty states
- No token found.
- No registry records yet.
- No proof document attached.
- This token has not been issued.

## 10. Error states
- Unable to load verification.
- Metadata hash does not match.
- Issuer signature is invalid.
- Token status is revoked.
- Registry is unavailable.

## 11. QA checklist

- [ ] Verify page loads by URL
- [ ] API returns valid JSON
- [ ] Invalid token shows clear error
- [ ] Revoked token shows revoked state
- [ ] Metadata link opens
- [ ] Proof link opens
- [ ] Mobile layout works
- [ ] No speculative language
- [ ] No investment language
