# TEAM2_NFT_AUTH_AND_PROTECTED_ASSET_RUNTIME_SPEC_2026
## Team 2 runtime implementation spec for `nft.iai.one`
## Version 1.0
## Status: LOCKED FOR TEAM 2 / TEAM 1 / TEAM 4 / OPS
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-15

---

## 1. Scope

File nay chot phan Team 2 phai build that cho `nft.iai.one`:
- passkey / WebAuthn step-up
- wallet proof
- asset policy evaluation
- protected asset proxy
- audit trail
- signed sync voi `vc.vetuonglai.com`

Day khong phai manifesto.
Day la implementation spec de dev build dung runtime lane security-critical.

No thuc thi:
- `docs/NFT_IAI_ONE_AND_VC_VETUONGLAI_COM_TWO_LAYER_ASSET_PROTECTION_MASTER_PLAN_2026.md`
- `docs/NFT_IAI_ONE_RELEASE_GATE_2026.md`

---

## 2. Runtime outcome Team 2 phai tao ra

Team 2 phai tao duoc mot runtime chain dung thu tu:

1. session xac thuc
2. step-up auth neu asset class can
3. wallet proof neu asset class can
4. entitlement + policy decision server-side
5. protected asset proxy token issue
6. asset stream/download qua protected path
7. audit event persistence

Neu bo qua 1 mat xich:
- runtime lane duoc xem la FAIL

---

## 3. Non-negotiable implementation rules

- khong password-only cho vault-class action
- khong client-only proof checks
- khong public raw URL cho protected asset
- khong signed URL vo thoi han
- khong trust partner sync neu chua verify signature
- khong cho recovery lane bypass step-up lane
- khong cho admin override ma khong audit

---

## 4. Required runtime components

### 4.1 Session resolver
Trach nhiem:
- resolve shared session
- resolve `subject_id`
- resolve `workspace_id`
- resolve current risk/auth level

Output toi thieu:
- `subject_id`
- `workspace_id`
- `session_id`
- `session_strength`
- `session_expires_at`

### 4.2 Step-up service
Trach nhiem:
- issue WebAuthn/passkey challenge
- verify challenge response
- tao `step_up_session`
- cap short-lived privileged context

Khong duoc:
- dung magic link de gia lap step-up

### 4.3 Wallet proof service
Trach nhiem:
- issue one-time challenge nonce
- verify wallet signature
- bind proof voi subject + wallet + asset/action
- persist `signature_proof`

### 4.4 Asset policy engine
Trach nhiem:
- doc asset class
- doc entitlement
- doc collection/policy rules
- xac dinh:
  - allow
  - deny
  - need_step_up
  - need_wallet_proof

### 4.5 Protected asset proxy
Trach nhiem:
- issue short-lived proxy token
- map token -> exact subject + asset + action
- stream/download asset tu protected storage
- revoke token sau khi het TTL hoac da dung

### 4.6 Audit recorder
Trach nhiem:
- ghi `access.requested`
- ghi `access.allowed`
- ghi `access.denied`
- ghi `download.started`
- ghi `download.completed`
- ghi `wallet.proof.verified`
- ghi `step_up.verified`
- ghi `partner.sync.accepted/rejected`

### 4.7 Partner sync receiver
Trach nhiem:
- nhan event tu `vc.vetuonglai.com`
- verify signature
- verify timestamp
- verify idempotency
- normalize payload
- ghi audit
- update metadata/policy input state neu hop le

---

## 5. Canonical runtime objects

### 5.1 `step_up_session`
Fields toi thieu:
- `step_up_session_id`
- `subject_id`
- `workspace_id`
- `verification_method`
- `verified_at`
- `expires_at`
- `scope`
- `status`

### 5.2 `wallet_proof`
Fields toi thieu:
- `signature_proof_id`
- `subject_id`
- `wallet_id`
- `asset_id_optional`
- `challenge_nonce`
- `issued_at`
- `verified_at`
- `expires_at`
- `status`

### 5.3 `asset_access_policy`
Fields toi thieu:
- `access_policy_id`
- `asset_id`
- `asset_class`
- `requires_step_up`
- `requires_wallet_proof`
- `entitlement_rule`
- `download_ttl_seconds`
- `stream_ttl_seconds`

### 5.4 `asset_proxy_token`
Fields toi thieu:
- `proxy_token_id`
- `subject_id`
- `asset_id`
- `action`
- `issued_at`
- `expires_at`
- `single_use`
- `status`

### 5.5 `asset_access_event`
Fields toi thieu:
- `asset_access_event_id`
- `subject_id`
- `asset_id`
- `action`
- `decision`
- `reason_code`
- `request_id`
- `created_at`

### 5.6 `partner_sync_event`
Fields toi thieu:
- `partner_event_id`
- `source_domain`
- `event_name`
- `signature_valid`
- `idempotency_key`
- `source_timestamp`
- `received_at`
- `status`

---

## 6. Required endpoint contract set

### 6.1 Session and security

#### `GET /v1/nft/security/session`
Purpose:
- return current session security state

Response fields toi thieu:
- `subject_id`
- `workspace_id`
- `session_strength`
- `step_up_active`
- `step_up_expires_at_optional`
- `wallet_proof_active`

#### `POST /v1/nft/security/step-up/challenge`
Purpose:
- issue passkey/WebAuthn challenge

Auth:
- valid shared session required

#### `POST /v1/nft/security/step-up/verify`
Purpose:
- verify challenge and create `step_up_session`

Output:
- `step_up_session_id`
- `expires_at`
- `scope`

### 6.2 Wallet proof

#### `POST /v1/nft/wallet-proof/challenge`
Purpose:
- issue one-time wallet proof challenge

Input:
- `wallet_id`
- `asset_id_optional`
- `action`

#### `POST /v1/nft/wallet-proof/verify`
Purpose:
- verify wallet signature

Input:
- `wallet_id`
- `challenge_nonce`
- `signature`
- `asset_id_optional`
- `action`

Output:
- `signature_proof_id`
- `expires_at`
- `wallet_id`

### 6.3 Asset access

#### `POST /v1/nft/assets/:assetId/access-check`
Purpose:
- evaluate access policy before issue token

Output:
- `decision`
- `requires_step_up`
- `requires_wallet_proof`
- `asset_class`
- `reason_code_optional`

#### `POST /v1/nft/assets/:assetId/proxy-token`
Purpose:
- issue short-lived protected token after all proofs pass

Input:
- `action` = `open` | `download` | `export`
- `step_up_session_id_optional`
- `signature_proof_id_optional`

Output:
- `proxy_token_id`
- `proxy_path`
- `expires_at`

#### `GET /v1/nft/assets/:assetId/download`
Purpose:
- stream asset through proxy

Auth:
- valid `proxy_token_id`

Rules:
- token scope phai match exact subject + asset + action
- token expired => deny
- token used roi va single-use => deny

### 6.4 Partner sync

#### `POST /v1/nft/partner-sync/events`
Purpose:
- nhan signed sync events tu `vc.vetuonglai.com`

Required headers:
- `x-partner-signature`
- `x-idempotency-key`
- `x-source-timestamp`

Rules:
- signature verification bat buoc
- stale replay reject
- duplicate event reject or noop with audit

---

## 7. Canonical flow sequence

### 7.1 Gated member asset flow

1. user login
2. call `access-check`
3. policy engine confirms gated asset
4. if only session + entitlement needed -> issue proxy token
5. download via protected proxy
6. write audit

### 7.2 Vault asset flow

1. user login
2. call `access-check`
3. response says `requires_step_up = true`
4. call step-up challenge
5. call step-up verify
6. response says `requires_wallet_proof = true`
7. call wallet challenge
8. call wallet verify
9. call proxy-token
10. stream/download via protected proxy
11. write full audit trail

### 7.3 Partner sync flow

1. `vc.vetuonglai.com` sends signed event
2. Team 2 receiver verifies signature
3. timestamp + idempotency checked
4. payload normalized
5. partner event persisted
6. downstream metadata/policy updates applied if valid
7. audit event persisted

---

## 8. TTL and expiration policy

Team 2 phai khoa TTL ro rang, khong de runtime tu do "de sau tinh".

### Recommended locked TTLs
- step-up challenge TTL: `5 minutes`
- step-up session TTL: `10 minutes`
- wallet challenge TTL: `5 minutes`
- wallet proof TTL: `10 minutes`
- proxy token TTL for open: `60 seconds`
- proxy token TTL for download/export: `120 seconds`

Rules:
- het TTL => bat buoc re-run proof lane
- khong auto-extend privileged proof silently

---

## 9. Storage and bindings mapping

### D1
Dung cho:
- step-up sessions
- wallet proofs
- policy metadata
- audit references
- partner sync event records

### R2
- `R2_PROTECTED_ASSETS` cho protected originals
- `R2_ARTIFACTS` cho audit/proof artifacts neu can

### Durable / queue
- `DO_RUNTIME_COORDINATOR` neu can giu short-lived coordination state
- `QUEUE_EVENTS_INGEST` cho audit or partner event processing neu volume cao

---

## 10. Required error model additions

Team 2 phai them va publish cac error codes sau:

- `STEP_UP_REQUIRED`
- `STEP_UP_INVALID`
- `STEP_UP_EXPIRED`
- `WALLET_PROOF_REQUIRED`
- `WALLET_SIGNATURE_INVALID`
- `WALLET_PROOF_EXPIRED`
- `ASSET_POLICY_DENIED`
- `ASSET_PROXY_EXPIRED`
- `ASSET_PROXY_SCOPE_INVALID`
- `PARTNER_SYNC_SIGNATURE_INVALID`
- `PARTNER_SYNC_REPLAY_BLOCKED`

Chi tiet consumer messaging phai cap nhat trong:
- `docs/runtime/TEAM2_RUNTIME_ERROR_CODEBOOK_2026.md`

---

## 11. Required audit event names

Bat buoc dung ten event on dinh:
- `nft.step_up.challenge_issued`
- `nft.step_up.verified`
- `nft.wallet_proof.challenge_issued`
- `nft.wallet_proof.verified`
- `nft.asset.access_requested`
- `nft.asset.access_allowed`
- `nft.asset.access_denied`
- `nft.asset.proxy_issued`
- `nft.asset.download_started`
- `nft.asset.download_completed`
- `nft.partner_sync.accepted`
- `nft.partner_sync.rejected`

---

## 12. Anti-patterns Team 2 phai tranh

- verify wallet proof tren client roi moi xin API "tin ket qua"
- bo qua server-side entitlement check vi da co wallet
- issue signed URL dai hon nhu session proof
- truyen asset path that ra client truoc khi policy pass
- cho partner sync ghi de state ma khong verify signature
- gom recovery va step-up thanh cung mot trust level

---

## 13. Immediate implementation order

1. build `GET /v1/nft/security/session`
2. build step-up challenge/verify
3. build wallet challenge/verify
4. build asset access-check
5. build proxy-token issue
6. build protected download stream
7. build partner sync receiver
8. build audit views/logging hooks
9. attach evidence packet cho Team 1

---

## 14. Team 1 release evidence Team 2 phai nop

- one successful gated asset access
- one successful vault asset access
- one denied access
- one expired proof denial
- one partner sync accepted
- one partner sync rejected
- no raw URL exposure proof
- rollback note

---

## 15. Definition of done

File nay dat gia tri khi Team 2 co the build ma khong can tu doan:
- runtime chain nao dung truoc/sau
- endpoint nao can ton tai
- TTL nao phai khoa
- audit nao phai ghi
- loi nao phai tra ve

Neu dev van con phai tu doan 3 muc tren:
- file nay chua dat
