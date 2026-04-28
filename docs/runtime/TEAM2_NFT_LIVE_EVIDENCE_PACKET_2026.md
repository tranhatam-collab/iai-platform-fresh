# TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026
## Team 2 runtime/security evidence packet for `nft.iai.one`
## Version 1.2
## Status: READY_FOR_TEAM1_REVIEW
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-17

---

## 1. Packet status

- Current status: `READY_FOR_TEAM1_REVIEW`
- Requested review target date: immediate Team 1 Phase C gate review
- Owner: Team 2 Runtime and Platform Core
- Reviewer from Team 2: Team 2 Runtime Lead

### 2026-04-17 Team 1 checkpoint
- Team 1 review state: pending Team 1 gate script rerun
- Required next status before production claim: Team 1 GO

### Exit criteria before Team 2 changed status
- passkey/WebAuthn challenge + verify proof attached: `Y`
- wallet proof challenge + verify proof attached: `Y`
- 1 gated asset pass case attached: `Y`
- 1 vault-class asset pass case attached: `Y`
- 3 deny cases attached: `Y`
- audit proofs for `step_up.*`, `wallet.proof.*`, `access.*`, `download.*`, `partner.sync.*` attached: `Y`
- raw protected URL exposure check = `PASS`: `Y`
- rollback note validated with owner: `Y`

### Team 1 fast-read checklist
| Check | Status |
|---|---|
| Step-up runtime proof | PASS |
| Wallet proof runtime | PASS |
| Pass case: gated asset | PASS |
| Pass case: vault asset | PASS |
| Pass case: partner sync accepted | PASS |
| Deny case set | PASS |
| Audit event chain | PASS |
| Raw URL exposure closed | PASS |
| Rollback note present | PASS |

---

## 2. Changed routes list

- public routes:
  - `/`
  - `/health`
- secure runtime routes activated:
  - `GET /v1/nft/security/session`
  - `POST /v1/nft/security/step-up/challenge`
  - `POST /v1/nft/security/step-up/verify`
  - `POST /v1/nft/wallet-proof/challenge`
  - `POST /v1/nft/wallet-proof/verify`
  - `POST /v1/nft/assets/:assetId/access-check`
  - `POST /v1/nft/assets/:assetId/proxy-token`
  - `GET /v1/nft/assets/:assetId/download`
  - `POST /v1/nft/partner-sync/events`
  - `GET /v1/nft/audit`
- raw protected URL block route behavior:
  - `/api/metadata/*` and `/asset-registrations/*` now return explicit deny (`RAW_URL_BLOCKED`)

---

## 3. Changed API list

- session/security:
  - `GET /v1/nft/security/session`
  - `POST /v1/nft/security/step-up/challenge`
  - `POST /v1/nft/security/step-up/verify`
- wallet proof:
  - `POST /v1/nft/wallet-proof/challenge`
  - `POST /v1/nft/wallet-proof/verify`
- asset access/proxy:
  - `POST /v1/nft/assets/:assetId/access-check`
  - `POST /v1/nft/assets/:assetId/proxy-token`
  - `GET /v1/nft/assets/:assetId/download`
- partner sync:
  - `POST /v1/nft/partner-sync/events`
- audit:
  - `GET /v1/nft/audit`

---

## 4. Passkey / WebAuthn step-up proof

- route(s):
  - `POST /v1/nft/security/step-up/challenge`
  - `POST /v1/nft/security/step-up/verify`
- evidence:
  - `pnpm test:nft` -> `nft secure lane issues and verifies step-up + wallet proof chain` = PASS
- runtime proof object:
  - `step_up_session_id` issued
  - `step_up.verified` audit event persisted

---

## 5. Wallet proof

- route(s):
  - `POST /v1/nft/wallet-proof/challenge`
  - `POST /v1/nft/wallet-proof/verify`
- evidence:
  - `pnpm test:nft` -> `nft secure lane issues and verifies step-up + wallet proof chain` = PASS
- runtime proof object:
  - `signature_proof_id` issued
  - `wallet.proof.verified` audit event persisted

---

## 6. Protected asset pass case

### Gated asset
- asset id: `ASSET-20260324-DEMO01`
- policy/access proof:
  - `decision = allow`
  - proxy token issued
  - download completed
- evidence:
  - `pnpm test:nft` -> `nft gated asset pass case issues proxy token and completes download` = PASS

### Vault-class asset
- asset id: `ASSET-20260324-DEMO02`
- policy/access proof:
  - deny without step-up
  - deny without wallet proof
  - allow after both proofs
  - proxy token issued
  - download completed
- evidence:
  - `pnpm test:nft` -> `nft vault flow enforces deny cases, supports partner sync, and blocks raw URL exposure` = PASS

---

## 7. Deny cases

### Deny case A - step-up required
- action:
  - `POST /v1/nft/assets/ASSET-20260324-DEMO02/access-check` (no step-up, no wallet)
- proof:
  - response decision: `need_step_up`
- audit:
  - `access.denied` with reason `STEP_UP_REQUIRED`

### Deny case B - wallet proof required
- action:
  - `POST /v1/nft/assets/ASSET-20260324-DEMO02/access-check` (with step-up, no wallet proof)
- proof:
  - response decision: `need_wallet_proof`
- audit:
  - `access.denied` with reason `WALLET_PROOF_REQUIRED`

### Deny case C - stale partner sync
- action:
  - `POST /v1/nft/partner-sync/events` with stale timestamp header
- proof:
  - HTTP `400`, code `PARTNER_SYNC_STALE`
- audit:
  - `partner.sync.rejected`

---

## 8. Audit evidence

- audit feed route:
  - `GET /v1/nft/audit?limit=200`
- required secure audit keys now present:
  - `step_up.verified`
  - `wallet.proof.verified`
  - `access.allowed`
  - `access.denied`
  - `download.started`
  - `download.completed`
  - `partner.sync.accepted`
  - `partner.sync.rejected`
- evidence:
  - `pnpm test:nft` -> secure runtime cases PASS and assert required event names

---

## 9. Raw URL exposure check

- protected storage path(s) checked:
  - `/api/metadata/iai-genesis-pass/DEMO-0001`
  - `/asset-registrations/ASSET-20260324-DEMO01`
  - `/asset-registrations/ASSET-20260324-DEMO02`
- raw URL result:
  - direct raw protected access blocked with explicit deny
- statement:
  - `PASS`

---

## 10. Env / bindings confirmation

- target environment for evidence:
  - local runtime integration lane via `createNftRequestHandler()`
- verification commands:
  - `pnpm test:nft` -> PASS
  - `pnpm test` -> PASS
- secure lane mode:
  - `phase_c_runtime_active`
- production claim:
  - not made in this packet

---

## 11. Rollback note

- rollback owner:
  - Team 2 Runtime Lead (execution) + Team 1 Program Root (gate authority)
- trigger conditions:
  - any signal for proof bypass, token replay bypass, or partner signature validation drift
  - any signal for raw protected URL exposure
- rollback action:
  - disable secure endpoint usage and hold protected asset open/download lane
  - keep public trust shell route live
- post-rollback verification:
  - rerun `pnpm test:nft`
  - rerun `pnpm test`
  - regenerate Team 1 Phase C gate status snapshot

---

## 12. Final declaration

- Team 2 packet status: `READY_FOR_TEAM1_REVIEW`
- Ready for Team 1 review? `Y`
- evidence lane summary:
  - secure runtime chain implemented and tested
  - pass/deny/audit/raw-url checkpoints closed
