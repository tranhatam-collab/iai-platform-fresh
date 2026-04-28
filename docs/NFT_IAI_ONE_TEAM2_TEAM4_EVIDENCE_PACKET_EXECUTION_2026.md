# NFT_IAI_ONE_TEAM2_TEAM4_EVIDENCE_PACKET_EXECUTION_2026
## Team 2 + Team 4 execution packet for `nft.iai.one`
## Version 1.0
## Status: LOCKED FOR TEAM 1 / TEAM 2 / TEAM 4 / OPS
## Owner: Team 1 Program Root
## Date: 2026-04-15

---

## 1. Purpose

File nay khong them strategy moi.
File nay khoa cach Team 2 va Team 4 nop dung evidence packet con thieu de Team 1 co the review `nft.iai.one` theo release gate that.

Sequence bat buoc:
1. Team 2 nop runtime/security packet
2. Team 4 nop ops/recovery/partner packet
3. Team 1 moi review GO/NO-GO

Khong dao thu tu nay.

### 2026-04-17 checkpoint
- Team 2 packet: `BLOCKED`
- Team 4 packet: `READY_FOR_TEAM1_REVIEW`
- Team 1 verdict: `NO-GO`
- next lane after NFT: `pay.iai.one` van bi block cho toi khi Team 1 reopen Phase C

Interpretation:
- Team 4 khong du de mo gate mot minh
- Team 2 la packet quyet dinh cho Phase C reopen
- Team 1 chi review final khi ca 2 packet cung dat trang thai hop le

---

## 2. Packet file paths (locked)

### Team 2 phai nop vao
- `docs/runtime/TEAM2_NFT_LIVE_EVIDENCE_PACKET_2026.md`

### Team 4 phai nop vao
- `docs/reports/team4/TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026.md`

Khong nop bang chat roi bao "da xong".
Phai co file evidence checked-in hoac it nhat du noi dung de Team 1 review.

---

## 3. Team 2 packet (runtime/security truth)

Team 2 chi duoc bao `READY_FOR_TEAM1_REVIEW` khi packet co du:

### Runtime chain
- shared session that
- passkey / WebAuthn step-up that
- wallet proof that
- server-side policy decision that
- protected asset proxy / short-lived delivery that
- audit persistence that
- signed partner sync receive/verify that

### Pass cases bat buoc
- 1 gated asset pass
- 1 vault-class asset pass
- 1 signed partner sync accepted pass

### Deny cases bat buoc
- 1 deny vi chua step-up
- 1 deny vi chua wallet proof hoac policy deny
- 1 stale/invalid partner signature reject

### Evidence bat buoc
- changed routes list
- changed API list
- screenshots cua `/login`, `/vault`, `/settings/security`, va it nhat 1 protected asset flow
- curl/API proof cho:
  - step-up challenge/verify
  - wallet proof challenge/verify
  - asset access allow
  - asset access deny
  - partner sync accept/reject
- audit log proof cho:
  - `step_up.verified`
  - `wallet.proof.verified`
  - `access.allowed`
  - `access.denied`
  - `download.started` hoac `download.completed`
  - `partner.sync.accepted`
  - `partner.sync.rejected`
- xac nhan khong con raw public URL cho protected asset
- rollback note

### Hard fail
- password-only lane
- client-only wallet proof
- direct asset URL con mo
- khong co deny case that
- khong co audit deny/download

---

## 4. Team 4 packet (ops/recovery/partner truth)

Team 4 chi duoc bao `READY_FOR_TEAM1_REVIEW` khi packet co du:

### Ops truth
- VC asset opening policy wording da khoa
- support owner va escalation owner ro rang
- recovery path da khoa
- partner handoff voi `vc.vetuonglai.com` da khoa
- stale/invalid signature incident path da khoa
- deny-case support wording da khoa

### Evidence bat buoc
- owner matrix cho support/on-call/escalation
- recovery decision tree
- partner sync handoff note
- support macros / response wording cho:
  - step-up required
  - wallet proof required
  - access denied
  - invalid partner sync
  - stale partner sync
- incident handling note cho:
  - wrong asset opening request
  - deny mismatch
  - partner metadata drift
  - rollback trigger
- rollback/hold communications note

### Hard fail
- recovery co the bypass vault proof
- partner surface tu nhan quyet dinh final access
- support wording hua mo asset thu cong ngoai policy
- khong ro owner khi deny/escalation xay ra

---

## 5. Status words (locked)

Chi duoc dung 4 trang thai sau:
- `BLOCKED`
- `IN_PROGRESS`
- `READY_FOR_TEAM1_REVIEW`
- `APPROVED_BY_TEAM1`

Khong dung:
- "gan xong"
- "co ve on"
- "da live mot phan"

---

## 6. Team 1 review rule

Team 1 chi review khi:
- Team 2 packet = `READY_FOR_TEAM1_REVIEW`
- Team 4 packet = `READY_FOR_TEAM1_REVIEW`

Neu 1 trong 2 packet con thieu:
- Team 1 verdict = `NO-GO`

### Team 1 fast review output
Khi ca 2 packet da du, Team 1 phai chot ro trong decision log:
- packet nao dat
- packet nao con note
- rollback owner la ai
- blast radius cua lane `nft`
- co mo gate Phase C hay khong
- neu khong mo gate, blocker nao con mo

---

## 7. Final directive

`nft.iai.one` chi duoc xin gate reopen khi Team 2 va Team 4 nop packet dung file, dung thu tu, dung evidence.

Public gateway dang live khong duoc tinh la secure NFT production.
