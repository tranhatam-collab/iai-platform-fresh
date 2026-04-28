# NFT_IAI_ONE_RELEASE_GATE_2026
## Release gate for `nft.iai.one`
## Version 1.0
## Status: LOCKED FOR TEAM 1 / TEAM 2 / TEAM 4 / OPS
## Scope: `nft.iai.one`
## Date: 2026-04-15

---

## 1. Mission of this gate

File nay khoa cau tra loi rat don gian:
- khi nao `nft.iai.one` duoc preview
- khi nao `nft.iai.one` duoc production
- khi nao Team 1 phai NO-GO

Day la lane security-critical.
Khong co partial green thi khong release.

---

## 2. Mandatory P0 routes

- `/login`
- `/vault`
- `/assets/:assetId`
- `/assets/:assetId/access`
- `/assets/:assetId/proof`
- `/assets/:assetId/download`
- `/settings/security`

Neu route protected nhung chua co auth/step-up/proof lane that:
- gate = FAIL

---

## 3. Mandatory P0 security controls

### Control A - Identity
- shared session works
- privileged session window ro rang
- passkey / WebAuthn step-up co that cho vault-class actions

### Control B - Asset proof
- wallet signature hoac equivalent owner proof co that
- server-side entitlement co that
- policy engine quyet dinh allow/deny co that

### Control C - Delivery
- protected assets khong public raw URL
- short-lived URL hoac proxied delivery co that
- deny case khong ro ri asset

### Control D - Audit
- access event co log
- deny event co log
- download/export event co log
- partner sync event co log

### Control E - Partner sync
- sync tu `vc.vetuonglai.com` co signature verification
- idempotency co that
- stale or invalid event bi reject

---

## 4. Evidence packet bat buoc

Team 1 chi duoc approve khi packet co day du:
- changed routes list
- changed API list
- screenshots for protected routes
- curl or API proof
- one pass case for gated asset
- one pass case for vault asset
- one deny case
- one partner sync signed event
- audit log proof
- rollback note

---

## 5. Preview gate

Preview chi mo khi:
- auth routes on
- one protected asset path on
- one deny path on
- audit path on
- rollback note on

Neu preview chua co deny path that:
- khong mo preview review cho lane nay

---

## 6. Production gate

Production chi mo khi:
- passkey/WebAuthn step-up da on
- wallet proof da on
- protected delivery da on
- partner sync signed verification da on
- audit event da on
- no direct raw asset exposure
- Team 1 GO

---

## 7. Automatic NO-GO conditions

- password-only protected access
- email-only protected access
- public raw asset URL con ton tai
- partner sync khong co signature verification
- wallet proof chi kiem tra tren client
- missing rollback
- missing audit for deny or download

---

## 8. Definition of done

Gate nay dat khi:
- Team 1 co the GO/NO-GO dua tren packet that
- Team 2 biet ro can ship control nao
- Team 4 biet ro can ship ops/recovery nao
- khong con tranh cai lane NFT can bao ve den muc nao
