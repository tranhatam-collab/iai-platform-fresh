# NFT_CONTRACT_DEPLOY_PLAN_2026

Status: LOCKED
Scope: nft.iai.one
Target chain: Base / EVM
Standard: ERC-721

## 1. Goal

Deploy NFT contracts for verifiable identity, role, asset, certificate and access passes.

NFT is not speculation.
NFT is proof, status, issuer, subject and verification.

## 2. Contract types

### 2.1 IAI Genesis Pass
Use for early users, contributors, builders.

### 2.2 Website Ownership Pass
Use for domain and website provenance.

### 2.3 Course Certificate Pass
Use for education completion.

### 2.4 Organization Verification Pass
Use for verified organizations.

### 2.5 Investment Access Pass
Use only for access control.
Never describe it as investment ownership.

## 3. Contract requirements

Each contract must support:

- ERC-721 ownership
- tokenURI
- issuer address
- pause
- role-based minting
- revocation registry reference
- metadata freeze rule
- event logs

## 4. Minting rule

A token can be minted only when all fields exist:

- issuer
- subject
- wallet
- metadata hash
- asset hash
- proof hash
- signature
- status record
- audit log

## 5. Metadata rule

`tokenURI` must point to:

```
https://nft.iai.one/api/metadata/{collection}/{tokenId}
```

Metadata must not be edited after `issued` state unless replaced through a new version and status event.

## 6. Deployment phases

### Phase 1
Deploy test contract on Base Sepolia.

### Phase 2
Mint 10 internal production-test tokens.

### Phase 3
Run verify API against all 10 tokens.

### Phase 4
Deploy production contract on Base mainnet.

### Phase 5
Enable public registry.

## 7. Required environment variables

```
NFT_ISSUER_PRIVATE_KEY
NFT_CONTRACT_OWNER_ADDRESS
NFT_BASE_RPC_URL
NFT_BASE_SEPOLIA_RPC_URL
NFT_METADATA_BASE_URL
NFT_REGISTRY_SIGNER_ADDRESS
```

## 8. Deployment checklist

- [ ] Contract compiled
- [ ] Unit tests passed
- [ ] Testnet deployed
- [ ] Contract address recorded
- [ ] Issuer wallet recorded
- [ ] Metadata API working
- [ ] Verify API working
- [ ] Status API working
- [ ] 10 token production test passed
- [ ] Mainnet deployment approved

## 9. Final rule

Do not mint production NFT without proof, hash, status and audit log.
