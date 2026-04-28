# NFT_IAI_ONE_LIVE_AUDIT_2026-04-15
- Team: Team 1 Program Root
- Owner: Team 1 Program Root
- Scope: `nft.iai.one`
- Date: 2026-04-15
- Status: NO-GO for secure production lane

## 1. Gate question

Can Team 1 mark `nft.iai.one` as LIVE for the locked lane:
- 2-layer asset protection
- passkey / WebAuthn step-up
- wallet proof
- protected asset delivery
- signed partner sync with `vc.vetuonglai.com`

Answer:
- Public informational NFT surface: LIVE
- Secure NFT vault / protected asset lane: NO-GO

## 2. Evidence checked

### Repo evidence
- Command:
  - `rg --files apps docs scripts infra | rg 'nft|NFT'`
- Result:
  - workspace currently contains NFT governance/spec docs only
  - no checked-in `apps/nft`, worker runtime package, or route implementation owned in this repo checkpoint

### Public DNS / HTTPS evidence
- Commands:
  - `dig +short nft.iai.one`
  - `curl -I https://nft.iai.one`
- Result:
  - domain resolves to Cloudflare edge
  - HTTPS responds `HTTP/2 200`

### Public surface evidence
- Command:
  - `curl -sS https://nft.iai.one | sed -n '1,120p'`
- Result:
  - live page identifies itself as `NFT.IAI.ONE | Cổng NFT công khai song ngữ cho hệ sinh thái IAI`
  - current copy positions the site as a public bilingual NFT trust layer / gateway
  - page is indexable with `robots=index,follow`
  - top-level navigation exposes public routes such as `/collections/`, `/documents/`, `/disclosures/`, `/asset-registrations/`, `/verify/`, `/docs/`

### Protected-route behavior evidence
- Commands:
  - `curl -sS https://nft.iai.one/login | sed -n '1,80p'`
  - `curl -sS https://nft.iai.one/vault | sed -n '1,80p'`
  - `curl -sS https://nft.iai.one/settings/security | sed -n '1,80p'`
- Result:
  - these paths currently render the same public registry shell HTML as the homepage
  - no dedicated auth shell, vault shell, or protected app runtime was evidenced from the live response

## 3. Gate comparison against locked release requirements

Source of truth:
- `docs/NFT_IAI_ONE_RELEASE_GATE_2026.md`
- `docs/NFT_IAI_ONE_AND_VC_VETUONGLAI_COM_TWO_LAYER_ASSET_PROTECTION_MASTER_PLAN_2026.md`
- `docs/runtime/TEAM2_NFT_AUTH_AND_PROTECTED_ASSET_RUNTIME_SPEC_2026.md`

### Required P0 routes
- Required:
  - `/login`
  - `/vault`
  - `/assets/:assetId`
  - `/assets/:assetId/access`
  - `/assets/:assetId/proof`
  - `/assets/:assetId/download`
  - `/settings/security`
- Audit result:
  - FAIL for secure-lane evidence
  - public shell exists, but protected runtime behavior was not evidenced

### Required security controls
- Passkey / WebAuthn step-up:
  - no live evidence attached
- Wallet proof:
  - no live evidence attached
- Protected asset proxy / short-lived delivery:
  - no live evidence attached
- Audit trail for access / deny / download:
  - no live evidence attached
- Signed partner sync from `vc.vetuonglai.com`:
  - no live evidence attached

### Required evidence packet
- Missing from Team 1 gate packet:
  - changed routes list
  - changed API list
  - protected-route screenshots
  - pass case for gated asset
  - pass case for vault asset
  - deny case
  - signed partner sync event proof
  - audit log proof
  - rollback note

## 4. Team 1 verdict

### GO
- `nft.iai.one` may be described as a live public NFT gateway / registry-style surface.

### NO-GO
- `nft.iai.one` must not be described as live for:
  - secure vault access
  - 2-layer protected asset release
  - strongest-auth NFT custody lane
  - production-ready protected sync with `vc.vetuonglai.com`

## 5. Required next packet before gate reopen

### Team 2 must attach
- one live passkey / WebAuthn step-up proof
- one live wallet proof pass
- one live deny case
- one protected asset access success case
- one protected asset deny case
- audit evidence for access, deny, and download
- signed partner sync proof from `vc.vetuonglai.com`
- rollback note with owner and blast radius
- packet path:
  - `docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md`

### Team 4 / Ops must attach
- recovery path
- support path
- partner sync operations note
- incident response note for deny / stale / invalid signature cases
- packet path:
  - `docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md`

### Execution rule
- follow:
  - `docs/NFT_IAI_ONE_TEAM2_TEAM4_EVIDENCE_PACKET_EXECUTION_2026.md`

## 6. Final rule

Until the missing evidence above is attached, Team 1 production verdict remains:
- public surface = LIVE
- secure NFT lane = NO-GO
