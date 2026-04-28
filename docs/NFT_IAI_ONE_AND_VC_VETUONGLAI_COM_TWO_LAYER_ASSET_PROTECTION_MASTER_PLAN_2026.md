# NFT_IAI_ONE_AND_VC_VETUONGLAI_COM_TWO_LAYER_ASSET_PROTECTION_MASTER_PLAN_2026
## Master plan for `nft.iai.one` synchronized with `vc.vetuonglai.com`
## Version 1.0
## Status: LOCKED FOR TEAM 1 / TEAM 2 / TEAM 4 / OPS
## Scope: `nft.iai.one` + external partner sync with `vc.vetuonglai.com`
## Date: 2026-04-15

---

## 1. Why this file exists

Qua doi chieu repo hien tai:
- `nft.iai.one` chua co row trong mission map
- `nft.iai.one` chua co row trong owner matrix
- `nft.iai.one` chua co row trong env/bindings truth
- `vc.vetuonglai.com` chua duoc khoa nhu mot external partner surface co contract ro rang

Nghia la lane nay dang duoc dev nhung chua nam trong governance chinh cua he.
Neu tiep tuc theo cach do:
- asset protection se bi phan tan
- deploy authority se mo ho
- sync giua `nft.iai.one` va `vc.vetuonglai.com` se khong co policy chung
- viec mo asset cho VC co the vuot ra ngoai auth/proof boundary cua IAI

File nay khoa lai lane NFT truoc khi go-live.

---

## 2. Absolute role of `nft.iai.one`

`nft.iai.one` khong phai:
- marketplace hype surface
- gallery public cho raw asset files
- fundraising page
- detached experiment outside IAI contracts

`nft.iai.one` la:
- secure asset verification surface
- vault access surface
- custody-aware protected delivery surface
- proof-bound access control layer for NFT and partner asset programs

Hard rule:
- `vc.vetuonglai.com` co the la partner business surface, collection surface, hoac relationship surface
- nhung moi asset protected action phai ket thuc o `nft.iai.one`
- `vc.vetuonglai.com` khong duoc phat public raw asset links cho lane protected

---

## 3. Canonical architecture between the two domains

### `vc.vetuonglai.com`
Vai tro:
- partner business surface
- collection or program context
- external portfolio or venture-facing presentation
- source of partner-side metadata or business eligibility state

### `nft.iai.one`
Vai tro:
- auth gate
- step-up gate
- wallet proof gate
- protected asset gateway
- audit and custody proof surface

### Locked integration rule
- `vc.vetuonglai.com` khong duoc tro thanh trust root
- `nft.iai.one` phai la noi xac nhan access policy cuoi cung
- moi lane asset protected phai dung contract do `nft.iai.one` kiem soat

---

## 4. The required 2-layer protection model

`nft.iai.one` phai dung hai lop bao ve doc lap, khong duoc chi dung 1 login thong thuong.

### Layer 1 - Identity and session assurance
Day la lop xac nhan con nguoi dang vao he co dung la chu the duoc phep hay khong.

Bat buoc:
- session auth that
- passkey / WebAuthn cho cac action vault-class
- device-aware session binding neu co the
- short-lived privileged session window
- step-up auth cho action nhay cam

Khong duoc xem la du manh neu chi co:
- password only
- email OTP only
- magic link only
- SMS only

Recovery co the ton tai, nhung recovery khong duoc co trust level ngang voi passkey action.

### Layer 2 - Asset action proof
Day la lop xac nhan nguoi da dang nhap duoc phep mo asset cu the trong boi canh cu the.

Bat buoc:
- wallet signature hoac cryptographic ownership proof cho asset protected action
- entitlement check server-side
- policy check theo asset class
- short-lived protected URL hoac proxied download
- audit event cho moi lan open/download/export/share request

Khong duoc:
- link thang den R2/public object
- raw asset URL song dai
- chi kiem tra tren client
- tin vao partner domain session ma bo qua local proof layer

---

## 5. Strongest practical assurance standard for this lane

De dat muc bao dam manh nhat cho lane tai san VC dang mo:

### End-user protected asset standard
- login with shared identity
- passkey / WebAuthn step-up cho vault-class access
- wallet signature cho open/export asset neu asset la NFT-gated
- server-side entitlement and policy decision
- protected delivery chi co han, gan voi subject + asset + session
- audit log for every sensitive action

### Admin/operator standard
- passkey or hardware security key required
- khong dung password-only admin
- role-scoped admin surfaces
- explicit approval log cho override actions
- two-person review cho destructive re-assignment / mass revoke / policy bypass neu lane da vao production

### Recovery standard
- recovery route tach rieng khoi normal login
- recovery khong duoc auto-cap access vao vault-class actions
- sau recovery phai bat buoc step-up lai truoc khi mo asset protected

---

## 6. Asset classes and required protection

### Class A - Public preview
Cho phep:
- thumbnail
- teaser metadata
- public collection info

Khong cho phep:
- original asset
- hi-res protected file
- export pack

### Class B - Gated member asset
Bat buoc:
- session auth
- entitlement check
- protected delivery

### Class C - Vault asset
Bat buoc:
- session auth
- passkey / WebAuthn step-up
- wallet signature hoac equivalent owner proof
- protected delivery with strict TTL
- custody audit

### Class D - Admin custody action
Bat buoc:
- admin role
- passkey / strong admin auth
- audit trail
- dual-approval neu action anh huong nhieu assets hoac nhieu owners

---

## 7. Required core objects

- `subject_id`
- `workspace_id`
- `wallet_id`
- `asset_id`
- `collection_id`
- `partner_program_id`
- `entitlement_id`
- `access_policy_id`
- `step_up_session_id`
- `signature_proof_id`
- `asset_access_event_id`
- `custody_record_id`

Ten goi nay khong duoc drift giua:
- `nft.iai.one`
- `vc.vetuonglai.com` sync layer
- `api.iai.one` / `api.flow.iai.one`

---

## 8. Required routes and capabilities

### Minimum routes for `nft.iai.one`
- `/login`
- `/vault`
- `/collections`
- `/collections/:collectionId`
- `/assets/:assetId`
- `/assets/:assetId/access`
- `/assets/:assetId/proof`
- `/assets/:assetId/download`
- `/settings/security`

### Minimum backend capabilities
- session validation
- passkey step-up verification
- wallet signature verification
- entitlement read
- asset policy evaluation
- protected asset issuance
- audit event persistence
- partner sync receive/pull

---

## 9. Sync contract with `vc.vetuonglai.com`

`vc.vetuonglai.com` duoc phep dong bo:
- collection metadata
- partner program metadata
- business-side eligibility state
- portfolio or relationship context

`vc.vetuonglai.com` khong duoc tu quyet:
- final protected asset access
- vault access bypass
- raw file delivery
- proof state finality ben trong IAI

### Required sync rules
- partner sync phai co signature verification
- idempotency key bat buoc
- source timestamp bat buoc
- stale event phai bi reject hoac quarantine
- policy changes phai duoc audit

---

## 10. Storage and delivery rules

### Storage
- preview assets co the o `R2_PUBLIC_ASSETS`
- protected assets phai o `R2_PROTECTED_ASSETS`
- proof and audit artifacts co the o `R2_ARTIFACTS`

### Delivery
- khong public direct object path cho protected asset
- khong signed URL vo thoi han
- khong asset access neu policy decision chua pass
- moi protected delivery phai giong mot transaction co trace

---

## 11. Audit and observability rules

Phai ghi lai it nhat:
- ai truy cap
- asset nao duoc mo
- policy nao da duoc evaluate
- co step-up hay khong
- co wallet proof hay khong
- co denied hay khong
- URL protected duoc issue luc nao
- action xay ra tu `nft.iai.one` hay tu partner sync

Khong co audit:
- khong duoc xem lane nay la production-ready

---

## 12. Team ownership and delivery split

### Team 1
- gate authority
- deploy authority
- owner cua final GO/NO-GO
- boundary review giua `nft.iai.one` va `vc.vetuonglai.com`

### Team 2
- auth/session
- passkey/WebAuthn lane
- wallet proof lane
- protected asset delivery lane
- audit/runtime truth

### Team 4
- VC partner operations
- support and recovery policy
- asset opening policy wording
- external partner handoff and escalation

Hard rule:
- khong team nao duoc release lane NFT neu Team 2 contract evidence va Team 4 ops evidence chua du

---

## 13. Immediate P0 backlog

### P0-A Governance closure
- dua `nft.iai.one` vao mission map
- dua `nft.iai.one` vao owner matrix
- dua `nft.iai.one` vao env/bindings truth
- tao release gate rieng cho `nft.iai.one`

### P0-B Security closure
- khoa Layer 1 va Layer 2 model
- khoa asset classes
- khoa protected delivery rule
- khoa sync rule voi `vc.vetuonglai.com`

### P0-C Runtime closure
- auth guard that
- step-up flow that
- wallet proof that
- audit event that
- protected URL/proxy flow that

### P0-D Evidence closure
- 1 flow member asset pass
- 1 flow vault asset pass
- 1 denied access case pass
- 1 partner sync signed event pass
- rollback note pass

---

## 14. Hard stop rules

- Khong mo public asset routes neu protected asset van co the truy cap bang raw URL.
- Khong release neu vault-class action chua co step-up auth.
- Khong release neu partner sync chua co signature verification.
- Khong release neu audit event chua du cho access-deny-open-download.
- Khong release neu recovery flow co the bypass vault proof.

---

## 15. Definition of done

Lane nay chi duoc xem la on khi:
- `nft.iai.one` nam trong governance chinh cua he
- `vc.vetuonglai.com` co role ro rang la partner surface, khong phai trust root
- 2 lop bao ve da duoc khoa va implement dung
- protected assets khong the mo bang direct link
- Team 1 co release gate rieng cho lane nay
- Team 2 va Team 4 co evidence that cho lane nay

---

## 16. Final directive

`nft.iai.one` khong duoc ship nhu mot NFT page thong thuong.

No phai duoc ship nhu:
- secure asset gateway
- custody-aware proof surface
- two-layer protected access system

va moi asset partner tu `vc.vetuonglai.com` muon mo theo lane protected deu phai di qua boundary nay.
