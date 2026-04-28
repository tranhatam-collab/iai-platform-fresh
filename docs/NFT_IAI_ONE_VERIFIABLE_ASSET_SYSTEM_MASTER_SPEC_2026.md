# NFT_IAI_ONE_VERIFIABLE_ASSET_SYSTEM_MASTER_SPEC_2026

Version: 2.0
Status: LOCKED (P2 READY)
Scope: nft.iai.one — Verifiable NFT + Credential + Provenance System
Required by: DEV / Backend / Frontend / Security / QA / Legal / Product

---

## 0. MỤC TIÊU

Xây dựng nft.iai.one thành:

- Không phải marketplace
- Không phải NFT sưu tầm
- Không phải đầu cơ

Mà là: **Hệ xác thực tài sản số có thể kiểm chứng độc lập**

---

## 1. ĐỊNH NGHĨA HỆ

```
NFT = Ownership Layer (ERC-721)
+
Verifiable Credential = Identity & Role Layer
+
Provenance Registry = Source of Truth
```

---

## 2. 9 LỚP CHUẨN BẮT BUỘC

Mỗi NFT phải có đủ:

1. Issuer
2. Subject
3. On-chain record
4. Metadata hash
5. Asset hash
6. Proof document
7. Cryptographic signature
8. Status / revocation
9. Public verification page

---

## 3. KIẾN TRÚC SYSTEM

```
nft.iai.one
├─ /token/:collection/:tokenId
├─ /verify/:collection/:tokenId
├─ /registry/:collection
├─ /api/metadata/:collection/:tokenId
├─ /api/verify/:collection/:tokenId
├─ /api/status/:collection/:tokenId
├─ /api/registry/:collection
├─ /api/issue/preview
├─ /api/issue/finalize
├─ /docs/*
```

---

## 4. METADATA SCHEMA (LOCKED)

```json
{
  "schema_version": "iai-nft-credential-v1",
  "status": "issued",
  "name": "",
  "description": "",
  "image": "",
  "external_url": "",
  "issuer": {
    "name": "",
    "domain": "",
    "issuer_wallet": ""
  },
  "contract": {
    "chain": "",
    "chain_id": 0,
    "address": ""
  },
  "token": {
    "token_id": "",
    "mint_tx": "",
    "minted_at": ""
  },
  "subject": {
    "wallet_address": "",
    "role": ""
  },
  "integrity": {
    "metadata_hash": "",
    "image_hash": "",
    "proof_hash": ""
  },
  "verification": {
    "proof_url": "",
    "status_url": ""
  },
  "signature": {
    "type": "EIP-712",
    "signer": "",
    "signature": ""
  }
}
```

---

## 5. API SPEC

### 5.1 Metadata
`GET /api/metadata/:collection/:tokenId`

### 5.2 Verify
`GET /api/verify/:collection/:tokenId`

Response:
```json
{
  "ok": true,
  "status": "issued",
  "metadata_hash_valid": true,
  "signature_valid": true,
  "revoked": false
}
```

### 5.3 Status
`GET /api/status/:collection/:tokenId`

### 5.4 Issue Preview
`POST /api/issue/preview`

### 5.5 Issue Finalize
`POST /api/issue/finalize`

---

## 6. DATABASE MODEL

Tables:
- collections
- tokens
- issuers
- subjects
- proofs
- signatures
- status_events
- audit_logs

---

## 7. ISSUE FLOW

1. Create metadata
2. Generate hashes
3. Generate proof
4. Sign data (EIP-712)
5. Save audit log
6. Mint NFT
7. Publish verify page

---

## 8. STATUS MODEL

- preview
- issued
- revoked
- expired
- disputed

---

## 9. VERIFY UI REQUIREMENTS

Trang `/verify/...` phải hiển thị:

- VALID / INVALID / REVOKED
- Issuer
- Subject
- Wallet
- Chain
- Token ID
- TX hash
- Metadata hash
- Signature
- Proof link

---

## 10. TOKEN TYPES (HỆ THỐNG CHUẨN)

### 10.1 Identity
- Founder Pass
- Contributor Pass

### 10.2 Asset
- Website Ownership Pass
- Domain Provenance Pass

### 10.3 Education
- Course Certificate
- Completion Pass

### 10.4 System
- API Access Pass
- Partner Verification Pass

### 10.5 Investment Access

KHÔNG phải investment token. Chỉ:
- access control
- whitelist
- eligibility

---

## 11. SECURITY

Bắt buộc:
- EIP-712 signature
- Hash SHA-256
- Audit log
- Immutable metadata snapshot

Không được:
- edit metadata sau mint
- mint không proof
- mint không issuer
- mint không log

---

## 12. LEGAL RULE

Không được:
- hứa lợi nhuận
- gọi NFT là investment
- marketing như tài sản tài chính

Phải có:
- disclaimer
- no speculation statement
- no guarantee

---

## 13. PRICING MODEL

### Phase 1
- Free preview
- $9 founding

### Phase 2
- $29 verified pass
- $99 asset verification

### Phase 3
- $499/year organization

### Phase 4
- Enterprise: custom

---

## 14. PHASE PLAN

### Phase 1 — Foundation
- metadata schema
- preview system
- basic verify

### Phase 2 — Production (HIỆN TẠI)
- verify API
- status API
- signature
- audit log
- 10 token production test

### Phase 3 — Scale
- registry
- dashboard
- multi-issuer
- API access

---

## 15. DEFINITION OF DONE

Một NFT đạt chuẩn khi:

- [x] Issuer rõ
- [x] Subject rõ
- [x] Wallet holder
- [x] Contract + token ID
- [x] TX hash
- [x] Metadata hash
- [x] Asset hash
- [x] Proof hash
- [x] Signature
- [x] Verify API
- [x] Status API
- [x] Public verify page
- [x] Revocation policy
- [x] Audit log
- [x] Disclaimer

---

## 16. CHỐT CHO TEAM DEV

NFT không phải hình ảnh.
NFT không phải marketplace.
NFT là: **proof + identity + source + verification**

---

## 17. P2 READY

Hệ đã đủ điều kiện chuyển sang P2 nếu:
- Metadata locked
- Verify API OK
- Status API OK
- Signature OK
- 10 token production pass
