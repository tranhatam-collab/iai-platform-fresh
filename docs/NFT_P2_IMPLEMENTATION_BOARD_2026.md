# NFT_P2_IMPLEMENTATION_BOARD_2026

Status: ACTIVE
Scope: P2 execution board for nft.iai.one

## P2 Goal

Move nft.iai.one from preview-level NFT metadata to production verifiable asset system.

## P2 Deliverables

### Backend
- [ ] `/api/metadata/:collection/:tokenId`
- [ ] `/api/verify/:collection/:tokenId`
- [ ] `/api/status/:collection/:tokenId`
- [ ] `/api/registry/:collection`
- [ ] `/api/issue/preview`
- [ ] `/api/issue/finalize`

### Database
- [ ] collections
- [ ] tokens
- [ ] issuers
- [ ] subjects
- [ ] proofs
- [ ] signatures
- [ ] status_events
- [ ] audit_logs

### Security
- [ ] EIP-712 signing
- [ ] SHA-256 hash generation
- [ ] issuer wallet allowlist
- [ ] audit log on every issue
- [ ] no production mint without proof

### Frontend
- [ ] verify page
- [ ] token page
- [ ] registry page
- [ ] issue preview page
- [ ] docs pages

### QA
- [ ] 10 token production test
- [ ] metadata hash validation
- [ ] image hash validation
- [ ] signature validation
- [ ] revoked token test
- [ ] invalid token test
- [ ] mobile QA

## P2 Exit Criteria

- [ ] 10 production test tokens pass
- [ ] Verify API returns stable response
- [ ] Status API returns stable response
- [ ] Public verify pages work
- [ ] Revocation policy live
- [ ] Issuance policy live
- [ ] No investment/speculation language

## P2 Lock Rule

No paid verification product may launch before P2 exit criteria pass.
