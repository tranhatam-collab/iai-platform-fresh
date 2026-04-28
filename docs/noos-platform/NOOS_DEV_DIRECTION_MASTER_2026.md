# NOOS_DEV_DIRECTION_MASTER_2026

Status: PRODUCTION LOCK - ARCHITECTURE DIRECTION

Scope: NOOS.IAI.ONE - Civilization OS / Control Layer

---

## 0. MUC TIEU TOI THUONG

NOOS khong phai la:
- website
- app
- flow builder
- investor portal

NOOS la:

Lop kien truc dieu hanh cua toan bo he thong IAI o cap nen van minh

Vai tro duy nhat:
- dinh nghia cach the gioi van hanh
- khong truc tiep thuc thi (Flow lam viec do)
- khong truc tiep hien thi (App lam viec do)

---

## 1. SYSTEM BOUNDARY (RANH GIOI TUYET DOI)

### 1.1 NOOS chiu trach nhiem
- Mission model
- Twin model
- Policy / Governance
- Trust / Security model
- Federation logic
- Delay-tolerant behavior
- Evidence architecture
- System constraints (energy / ethics / safety)

### 1.2 NOOS KHONG lam
- khong execute workflow -> Flow
- khong lam UI chinh -> App
- khong chay automation truc tiep
- khong lam dashboard business

---

## 2. CORE PRINCIPLES (NGUYEN TAC KHONG THAY DOI)

### 2.1 Local-first (Fractal Civilization)
- moi node phai song doc lap
- moi habitat co mini-NOOS
- federation chi xay ra khi co contact

### 2.2 Delay is default
- khong assume realtime
- khong assume always connected
- moi command phai chiu duoc delay

### 2.3 Evidence-first
- khong co log -> khong ton tai
- moi hanh dong phai sinh EvidenceRecord

### 2.4 Human sovereignty
- human veto layer bat buoc
- khong co bypass

### 2.5 Energy-aware
- moi hanh dong phai co energy constraint

---

## 3. 5-LAYER FRACTAL ARCHITECTURE (BAT BUOC)

### 3.1 Governance Layer
- FederationPolicy
- Human veto
- Ethical constraints
- Sovereignty rules

### 3.2 Control Layer
- Mission graph
- Twin orchestration
- Policy evaluation
- Simulation / prediction

### 3.3 Execution Layer (Flow)
- workflows
- approval queue
- scheduling
- retries
- rollback execution

### 3.4 Field Layer
- devices / sensors
- robots
- gateways
- NTN nodes
- DTN relay

### 3.5 Extended Human Layer
- operator UI
- health twin
- BCI
- education intelligence

---

## 4. INFORMATION ARCHITECTURE (IA)

### 4.1 NOOS site structure

```text
noos.iai.one/
  / (HOME - ARCHITECTURE ONLY)
  /docs/
    civilization-os/
    governance/
    api-contracts/
    evidence/
    device-matrix/
    roadmap/
    vietnam-profile/
    mars-latency-lab/
```

### 4.2 REMOVE / FIX NGAY
- Homepage hien tai dang bi lech (investor portal)
- phai sua ve NOOS dung nghia

---

## 5. CORE OBJECT SCHEMA (BAT BUOC)

### 5.1 InterplanetaryTwin

```json
{
  "id": "string",
  "type": "habitat|region|device|human|energy|relay",
  "latencyProfile": "earth|mars|deep-space|vn-remote",
  "autonomyMode": "full|bounded|assist",
  "energyProfile": "critical|limited|normal|surplus",
  "federationLevel": "none|local|regional|global",
  "contactWindows": [],
  "sovereigntyScope": "local|national|cross-border",
  "degradedBehaviorRef": "string",
  "evidenceRetentionClass": "short|long|permanent"
}
```

### 5.2 DelayTolerantIntent

```json
{
  "id": "string",
  "actor": "string",
  "target": "string",
  "action": "string",
  "approvalState": "pending|approved|rejected",
  "workflowRef": "string",
  "rollbackRef": "string",
  "expectedDeliveryWindow": "ISO8601",
  "priorityOnReconnect": "low|normal|high|critical",
  "notAfter": "ISO8601",
  "localAutonomyAllowed": true,
  "degradedModePolicy": "string",
  "custodyChain": []
}
```

### 5.3 EvidenceRecord

```json
{
  "id": "string",
  "intentId": "string",
  "type": "approval|execution|relay",
  "timestamp": "ISO8601",
  "actor": "string",
  "dataHash": "string",
  "attestationChain": [],
  "confidence": 0.0,
  "relayPath": [],
  "retention": "permanent"
}
```

### 5.4 FederationPolicy

```json
{
  "id": "string",
  "scope": "habitat|region|planet",
  "allowedData": [],
  "conflictResolution": "last-write|vote|priority",
  "approvalThreshold": "single|multi|human-required",
  "humanVetoRequired": true,
  "latencyTolerance": "low|medium|high",
  "localOverride": true
}
```

---

## 6. SECURITY DIRECTION (PQC-NATIVE)

### 6.1 Bat buoc
- ML-KEM (FIPS 203) -> key exchange
- ML-DSA (FIPS 204) -> signing
- SLH-DSA (FIPS 205) -> long-term

### 6.2 Khong chap nhan
- chi TLS truyen thong
- chi RSA/ECC legacy

---

## 7. DTN ARCHITECTURE (BAT BUOC)

### 7.1 Moi command phai ho tro
- store-and-forward
- delayed delivery
- duplicate handling
- reconnect priority

### 7.2 Route modes
- realtime (neu co)
- delayed
- offline queue

---

## 8. COMMAND LIFECYCLE (LOCK)

```text
Intent
 -> Policy check
 -> Approval queue
 -> Execute (Flow)
 -> Evidence record
 -> Rollback-ready
 -> Federation (on contact)
```

---

## 9. TEST MATRIX (BAT BUOC)

### 9.1 Core tests
- approval delay
- missing approval
- rollback before rollout
- policy mismatch
- stale policy
- lost connection
- duplicate delivery
- replay attack simulation

### 9.2 Degraded mode tests
- mat ve tinh
- mat gateway
- mat policy sync
- energy low
- device isolation

---

## 10. VIETNAM PROFILE (TRIEN KHAI THUC)

### 10.1 Mission classes
- wildfire
- flood / dam
- agriculture
- energy grid
- remote health
- island / maritime

### 10.2 Connectivity
- 5G / LTE-M / NB-IoT
- LoRa
- NTN fallback
- DTN relay

### 10.3 Sovereignty
- data classification
- regional policy
- human approval requirement

---

## 11. MARS LATENCY TEST (BAT BUOC)

### 11.1 Profile

```text
latency: 4-24 phut
mode: delayed
```

### 11.2 Test behavior
- no realtime control
- local autonomy must work
- delayed approval must still valid
- rollback after delay must succeed

---

## 12. DEV TASK PRIORITY

### P0 (NGAY)
- Fix homepage NOOS
- Lock 5-layer architecture
- Publish schemas
- Implement approval + rollback

### P1
- DTN simulation
- Mars latency lab
- Evidence pipeline

### P2
- Vietnam profile
- UI mapping
- federation sync logic

---

## 13. DEFINITION OF DONE

NOOS dat chuan khi:
- khong con la docs-only
- co schema that
- co lifecycle that
- co test matrix that
- co degraded mode that
- co Vietnam deployment profile
- Flow khong the bypass
- moi command deu co approval + rollback + evidence

---

## 14. CAU CHOT CHO TEAM DEV

NOOS khong phai la thu chay he thong.
NOOS la thu dinh nghia cach he thong duoc phep chay.

---

## 15. COMMERCE KNOWLEDGE LAYER LOCK (TEAM 1)

De tranh commerce tach roi khoi architecture direction, bo file khoa sau la bat buoc:

- `docs/noos/22_NOOS_DIRECT_DOCUMENT_PRODUCTS_AND_PROGRAM_PACKAGING_MASTER_PLAN_2026.md`
- `docs/noos/24_NOOS_PRODUCT_PAGE_TEMPLATE_AND_COPY_SYSTEM_2026.md`
- `docs/noos/25_NOOS_PRICING_LADDER_AND_LICENSE_MODEL_2026.md`
- `docs/noos/26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `docs/noos/27_NOOS_STRIPE_CHECKOUT_AND_DIGITAL_PRODUCT_FULFILLMENT_PLAN_2026.md`
- `docs/noos/28_NOOS_FIRST_12_PRODUCTS_FULL_DEFINITIONS_2026.md`
- `docs/noos/29_NOOS_UPSELL_CROSS_SELL_AND_PRODUCT_LADDER_SYSTEM_2026.md`

Nguyen tac:
- Commerce la extension layer cua NOOS architecture, khong phai mot nhanh rieng.
- Product, pricing, license, entitlements, va library phai bam dung cac file lock tren.
- Team 2 va Team 3 trien khai runtime/surface khong duoc sua lai product truth.

---

Neu muon, buoc tiep theo la:
- `NOOS_SCHEMA_PACK_v0.3.json` (full OpenAPI + validation + examples)
- `NOOS_SIMULATION_ENGINE` (Python) - chay Mars latency + DTN routing thuc

Do moi la buoc chuyen tu kien truc sang he thong song that.
