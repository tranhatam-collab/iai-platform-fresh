# PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27

**Version:** 1.0.2
**Status:** AUTHORITATIVE for IAI.ONE ecosystem — DRAFT for any other tenant — §9 RESOLVED + §10 founder coordination decisions LOCKED 2026-04-27
**Audience:** Pay+Email dev team (Pay+Email session) + Codex supervisor + Founder
**Authoring note:** Codex (Team 1+2+3 supervisor) authored this file under direct founder mandate dated 2026-04-27 (`/model claude-opus-4-7[1m]` turn). Per `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26.md` v1.0.3 §1, `docs/PAY_IAI_ONE_*` is normally Pay+Email territory; this single file is a founder-mandated cross-write to deliver legal foundation lock to dev team faster than relay. Pay+Email may adopt or supersede; do not delete without founder approval.

**Source-of-truth chain (read top-down before any payment work):**

1. `/Users/tranhatam/PHÁP LÝ CÁC CÔNG TY HOA KỲ VÀ CANADA/Tên miên phap ly các công ty/FOUNDER_DECISION_RECORD_LOCKED_2026.md` (founder LOCKED 2026-04-27)
2. `/Users/tranhatam/PHÁP LÝ CÁC CÔNG TY HOA KỲ VÀ CANADA/Tên miên phap ly các công ty/PAYMENT_SPEC_FOR_DEV_DRAFT.md`
3. `/Users/tranhatam/PHÁP LÝ CÁC CÔNG TY HOA KỲ VÀ CANADA/Tên miên phap ly các công ty/PAY_TENANT_REGISTRY_DRAFT.json`
4. `/Users/tranhatam/PHÁP LÝ CÁC CÔNG TY HOA KỲ VÀ CANADA/Tên miên phap ly các công ty/INVOICE_TEMPLATE_BY_ENTITY_DRAFT.md`
5. This file (mirrors the IAI.ONE-relevant subset into the repo).

If conflict between this file and (1)–(4), the founder source files win. Update this file.

---

## 0. The single hard rule

```
pay.iai.one = ORCHESTRATOR ONLY
            ≠ merchant
            ≠ payment processor
            ≠ money holder
            ≠ legal seller of any product
```

Every IAI.ONE surface that needs to charge money MUST route through `pay.iai.one`, which then assigns a real legal entity merchant + provider per the lane logic in §3. A surface NEVER charges directly.

---

## 1. Scope of this file

**IN SCOPE — IAI.ONE ecosystem (founder-mandated focus this batch):**

- `iai.one` (apex)
- `home.iai.one`
- `app.iai.one`
- `flow.iai.one`
- `developer.iai.one`
- `docs.iai.one`
- `dash.iai.one`
- `noos.iai.one`
- `nft.iai.one`
- `trust.iai.one`
- `pay.iai.one` (orchestrator)
- `mail.iai.one`
- `invoice.iai.one`
- `cdn.iai.one`
- `flows.iai.one`
- `web.iai.one`
- `root.iai.one`
- `donate.iai.one` (if/when activated, donation lane only)
- `invest.iai.one` (CLOSED — no payment of any kind)

**OUT OF SCOPE this batch (founder said "team khác làm sau"):**

- `vc.vetuonglai.com`, `proof.tranhatam.com`
- `tranhatam.com`, `tranhatam.net`, `nguyenlananh.com`
- `vietcannew.com`, `phuongdong.us`, `phuongdonginsider.com`
- `aiaccountingloop.com`, `vn.aiaccountingloop.com`
- `tueban.com`, `omdala.com`, `omdalat.com`, `nhachung.org`, `muonnoi.org`
- `tramsaigon.com`, `duongsaotoasang.com`

For any out-of-scope domain, dev team MUST stop and ask founder before applying any payment logic.

---

## 2. Legal entity facts (status as of 2026-04-27)

### 2.1 IAI INTELLIGENTI ACADEMIC INTERNATIONAL LLC — Global Commercial primary

| Field | Value | Status |
|---|---|---|
| Jurisdiction | Delaware, USA | Verified (formation docs) |
| Entity type | LLC | Verified |
| EIN | 38-4153242 | Verified (SS-4 in founder hand) |
| State file number | 7960372 | Verified |
| Formation date | 2020-05-06 | Verified |
| Annual obligation | $300 annual tax, **no annual report required** | Verified (Delaware Division of Corporations) |
| Current Good Standing | **NOT YET VERIFIED** | Declared — must check `https://icis.corp.delaware.gov` before merchant onboarding |
| Merchant profile (MLM clean) | **NOT YET VERIFIED** | Unverified — historical SS-4 contains "multi-level marketing"; current public materials must be cleaned per §5 |

### 2.2 ANGEL EDU TAM FOUNDATION INC. — Donation-only

| Field | Value | Status |
|---|---|---|
| Jurisdiction | South Dakota, USA | Verified (formation acknowledgment) |
| Entity type | Domestic Nonprofit Corporation | Verified |
| Business ID | NS275368 | Verified |
| EIN | **MISSING** in repo evidence | Unverified — locate or apply |
| Formation date | 2024-05-20 | Verified |
| Annual Report SD | **Due 2025-05-01 — status today UNKNOWN** | Unverified — check `https://sosenterprise.sd.gov` immediately; risk of dissolution if missed |
| IRS 501(c)(3) status | **NOT CONFIRMED** | Unverified — TEOS check at `https://irs.gov/charities-non-profits/tax-exempt-organization-search` |
| Banking | Banking resolution exists, no proof of opened account | Declared, not Verified |

### 2.3 Other entities (out-of-scope this batch but referenced)

- VIET CAN NEW CORP (Georgia) — secondary, verify Georgia registration first
- SUNORA REAL ESTATE CORPORATION (Wyoming) — dormant
- VN entities — Q4 PENDING, do NOT use for any pay code yet

---

## 3. Lane logic (LOCKED for IAI.ONE)

```
                   ┌──────────────────────────────────┐
                   │  /session/create on pay.iai.one  │
                   └──────────────┬───────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
   transaction_type        currency = USD             currency = VND
   = donation                                                │
        │                         │                          │
        ▼                         ▼                          ▼
   DONATION lane           COMMERCIAL_USD lane          COMMERCIAL_VND lane
   merchant =              merchant =                    merchant =
   ANGEL_EDU_TAM_          IAI_LLC_DELAWARE              TBD_VN_ENTITY
   FOUNDATION_SD                                          (Q4 PENDING)
   provider =              provider =                    provider =
   paypal_giving_fund      paypal_business               payos_qr / vietqr
        │                         │                          │
        │                         │                          │
        ▼                         ▼                          ▼
   ONLY when                 ONLY when                  ONLY when
   - SD Annual               - DE Good Standing         - VN entity
     Report verified           verified                   selected (Q4)
   - IRS TEOS confirmed      - MLM cleaned from         - MST + bank
     OR explicit               public materials           account verified
     no-tax disclaimer       - PayPal Business          - PayOS merchant
                               account opened             account opened

   transaction_type = investment  →  HARD STOP: throw INVESTMENT_LANE_CLOSED
```

### 3.1 Implementation contract per lane

```ts
type Lane = "COMMERCIAL_USD" | "COMMERCIAL_VND" | "DONATION" | "INVESTMENT_CLOSED";

function selectLane(domain: string, currency: "USD"|"VND", txType: string): {
  lane: Lane;
  entity: string;
  provider: string;
} {
  if (txType === "investment") {
    throw new Error("INVESTMENT_LANE_CLOSED");
  }
  if (txType === "donation") {
    if (!FOUNDATION_ANNUAL_REPORT_VERIFIED) {
      throw new Error("DONATION_LANE_NOT_READY_ANNUAL_REPORT_PENDING");
    }
    return { lane: "DONATION", entity: "ANGEL_EDU_TAM_FOUNDATION_SD", provider: "paypal_giving_fund" };
  }
  if (currency === "USD") {
    if (!IAI_LLC_GOOD_STANDING_VERIFIED) {
      throw new Error("USD_LANE_NOT_READY_GOOD_STANDING_PENDING");
    }
    if (!MERCHANT_PROFILE_CLEANED) {
      throw new Error("USD_LANE_NOT_READY_MERCHANT_PROFILE_DIRTY");
    }
    return { lane: "COMMERCIAL_USD", entity: "IAI_LLC_DELAWARE", provider: "paypal_business" };
  }
  if (currency === "VND") {
    throw new Error("VND_LANE_NOT_READY_VN_ENTITY_Q4_PENDING");
  }
  throw new Error("UNSUPPORTED_CURRENCY");
}
```

The four `*_NOT_READY_*` errors are a feature, not a bug. The lane stays closed until proof is on file. **Dev team must implement those gate booleans as config flags that only flip when founder confirms in writing.**

---

## 4. Per-domain payment mapping (IAI.ONE, founder-locked subset)

| Domain | Payment? | Currency lanes | Merchant USD | Merchant VND | Status today | Founder approval needed before dev |
|---|---|---|---|---|---|---|
| iai.one | NO | — | — | — | Apex, no commerce | n/a |
| home.iai.one | NO | — | — | — | Portal/routing only | n/a |
| trust.iai.one | YES (Phase 2+) | USD | IAI_LLC_DELAWARE | — | Phase 1 LIVE static; Phase 2 paid features deferred | YES — confirm before any pay code on trust |
| pay.iai.one | NO (orchestrator) | — | — | — | Control plane only | n/a |
| invoice.iai.one | NO (issuer) | — | — | — | Invoice generator, multi-tenant | n/a |
| flow.iai.one | YES | USD | IAI_LLC_DELAWARE | — | DRAFT — pending DE GS + MLM clean | YES |
| developer.iai.one | YES | USD | IAI_LLC_DELAWARE | — | DRAFT | YES |
| docs.iai.one | NO | — | — | — | Docs only | n/a |
| dash.iai.one | NO | — | — | — | Operator surface, billing-support-only | n/a |
| noos.iai.one | YES | USD | IAI_LLC_DELAWARE | — | DRAFT — commerce surface, payment via pay.iai.one | YES |
| nft.iai.one | YES | USD | IAI_LLC_DELAWARE | — | DRAFT | YES |
| app.iai.one | YES | USD + VND | IAI_LLC_DELAWARE | TBD_VN_ENTITY | DRAFT — VND lane blocked until Q4 | YES (USD only first) |
| mail.iai.one | NO (control plane) | — | — | — | Mail orchestrator | n/a |
| cdn.iai.one | NO | — | — | — | CDN edge | n/a |
| flows.iai.one | NO | — | — | — | Automation runtime | n/a |
| web.iai.one | YES (Phase 2+) | USD | IAI_LLC_DELAWARE | — | DRAFT | YES |
| root.iai.one | NO | — | — | — | Root surface | n/a |
| donate.iai.one | YES | USD | ANGEL_EDU_TAM_FOUNDATION_SD | — | BLOCKED — Foundation Annual Report + TEOS pending | NO — do not build until §5 verify done |
| invest.iai.one | **NEVER** | — | — | — | Hard CLOSED — research only | NEVER |

**Rule for dev:** apply payment logic for one domain per session, with founder approval per domain. Do not bulk-enable.

---

## 5. Verify-first checklist (gate before any production payment work)

Before any USD payment work goes live for any IAI.ONE domain:

1. [ ] **DE Good Standing** verified at `https://icis.corp.delaware.gov` for IAI LLC — paste output into a release-evidence note
2. [ ] **Merchant profile clean**: every public-facing material (websites, product pages, payment onboarding forms, terms, descriptions) checked for "MLM" / "multi-level marketing" — none must remain
3. [ ] **PayPal Business** account opened under EIN `38-4153242` with the cleaned business description (text approved by founder)
4. [ ] **Webhook signature verification** implemented for PayPal IPN/webhooks, idempotent
5. [ ] **Audit log** captures every transaction with `entity`, `lane`, `provider`, `provider_ref`, `domain`

Before any VND payment work goes live for any IAI.ONE domain:

1. [ ] **Q4 resolved** — founder selects 1 of 2 VN candidates (`IAI Real Estate & Education Services JSC` MST `0314040099` or `Viet Can New Media & Education Investment JSC` MST `0311855706`)
2. [ ] **MST verified** at both `https://masothue.com/` and `https://dangkykinhdoanh.gov.vn`
3. [ ] **VN entity bank account** opened, account name = legal name
4. [ ] **PayOS merchant** account linked to that bank account
5. [ ] **E-invoice capability** confirmed per Thông tư 32/2025/TT-BTC
6. [ ] **HMAC-SHA256 signature verification** implemented for PayOS webhook (no order paid via returnUrl)

Before any DONATION work goes live:

1. [ ] **SD Annual Report** for Foundation verified at `https://sosenterprise.sd.gov` (filed, not delinquent)
2. [ ] **EIN** for Foundation located or applied for
3. [ ] **IRS TEOS** check returns 501(c)(3) determination — link to determination letter
4. [ ] **PayPal Giving Fund** enrollment for Foundation
5. [ ] **Donor copy** approved by founder — no tax-deductible language unless TEOS confirmed

The INVESTMENT lane has no checklist; it is closed and must remain closed.

---

## 6. Hard stops (NEVER do these)

```
1. NEVER use ANGEL EDU TAM FOUNDATION as merchant for any commercial product.
2. NEVER charge money on invest.iai.one (no QR, no PayPal button, no wire link).
3. NEVER push payment code to production without per-domain founder approval.
4. NEVER use the founder's personal PayPal/Stripe as merchant default.
5. NEVER write "MLM" or "multi-level marketing" anywhere a merchant underwriter can read.
6. NEVER claim "tax-deductible" on donations until IRS TEOS shows 501(c)(3) for the EIN.
7. NEVER trust PayOS returnUrl to confirm a paid status — wait for signed webhook.
8. NEVER reuse a PayOS orderCode.
9. NEVER assign a domain to an entity that has no current Good Standing on file.
10. NEVER apply this lock to out-of-scope domains (vc/proof/personal/external) without
    founder explicit per-sub approval.
```

---

## 7. Approval protocol (founder-required)

For every sub-domain in §4 marked "YES — confirm before any pay code", dev MUST send a one-liner ask to founder via the trust mailbox or in-session relay:

```
Sub-approval request — <date>

Domain: <e.g., flow.iai.one>
Lane requested: <COMMERCIAL_USD | COMMERCIAL_VND | DONATION>
Entity: <e.g., IAI_LLC_DELAWARE>
Provider: <e.g., paypal_business>
Verify-first checklist completed: <link to evidence>
Proposed go-live date: <date>

Founder approves [ ]
Founder rejects [ ] — reason: ___
Founder defers [ ] — open question: ___
```

Founder approval is per domain, per lane. Do not assume one domain's approval covers another.

---

## 8. Public claim labeling (matches Trust foundation pack)

Per `trust-iai-one-starter/docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_CLAIM_STANDARD.md`, every public-facing claim about a payment lane on any IAI.ONE surface must be one of:

- **Verified** — there is inline proof on the page (e.g., link to determination letter, link to entity registry).
- **Declared** — officially stated by IAI but proof is partial/internal/pending (e.g., entity exists, GS pending re-check).
- **Unverified** — page says openly what is not verified, why, when it will be reviewed.

For lanes that are NOT_READY (per §3 errors), public copy must say "Payment not yet enabled for this lane. Reason: <why>." — never imply payment works when it does not.

---

## 9. Open questions — RESOLVED 2026-04-27 (Pay+Email Agent reply)

All 5 sequencing questions answered by Pay+Email Agent and acknowledged by Codex. Reply binding for next dev sprint.

- **Q-DEV-PAY-1** → `repo-read`. Pay+Email reads this lock on next session start; ack pattern locked in AI Owner plan §6 — no founder relay extra needed.
- **Q-DEV-PAY-2** → `after`. trust.iai.one Phase 2 paid features run AFTER §5 verify-first checklist. Reason: §5 is tax/legal foundation; paid features cannot pre-empt it.
- **Q-DEV-PAY-3** → `USD-first` for app.iai.one. Receiver `recv_usd_angeledutam_foundation_relay_thread` is `ACTIVE_DOMAIN_DEFAULT`; payment-routing already enforces ID-country policy. VND lane waits for VN merchant onboarding (Q4 PENDING).
- **Q-DEV-PAY-4** → `before`. Fix invoice.iai.one BEFORE any merchant onboarding. Reason: invoice = tax-evidence chain; broken invoice = cannot claim payment-complete. Owner: Pay+Email (invoice is in their lane). Codex tracks as a sequencing dependency for §5 USD checklist.
- **Q-DEV-PAY-5** → `yes`. Codex creates follow-up task for aiaccountingloop.com Foundation reference cleanup (security/legal leak risk even though OUT OF SCOPE this batch). Task file: `docs/PAY_IAI_ONE_FOLLOWUP_AIACCOUNTINGLOOP_FOUNDATION_CLEANUP_2026-04-27.md`. Execution requires founder explicit per-sub approval per §7.

### Sequenced dev plan after these answers

1. **Pay+Email** fixes invoice.iai.one Internal Error (Q-DEV-PAY-4 `before`).
2. **Pay+Email + founder** complete §5 USD-lane verify-first checklist (DE Good Standing + MLM cleanup + PayPal Business open).
3. **Pay+Email** ships USD lane for IAI.ONE domains marked YES in §4 (per-domain founder ack required).
4. **app.iai.one** USD-only ships first (Q-DEV-PAY-3); VND lane queued for Q4 resolution.
5. **trust.iai.one** Phase 2 paid features queued AFTER step 3 (Q-DEV-PAY-2).
6. **Codex** continues governance + standby for cross-team coordination.
7. **Founder** decides when to execute aiaccountingloop cleanup task (Q-DEV-PAY-5).

---

## 10. Founder coordination decisions — LOCKED 2026-04-27

Founder issued these 6 decisions in direct reply after §9 was published. They override any earlier contradictory plan and bind every agent.

| # | Topic | Decision | Owner | Codex action |
|---|---|---|---|---|
| 1 | mail.iai.one `MAIL_API_WEBHOOK_SECRET` blocker (legacy `iai-mail-api` has no webhook endpoint, doesn't read the secret) | **Path B**: deploy a new mail runtime that has the webhook endpoint, reads the secret, and verifies the signature. Do NOT patch legacy. **Cutover production gated** until invoice.iai.one is fixed AND new runtime has endpoint + secret read + webhook verify all working. | Pay+Email | Track. No relay extra needed (Pay+Email reads this lock on next session per Q-DEV-PAY-1 `repo-read`). |
| 2 | invoice.iai.one Internal Error | **APPROVED — Pay+Email executes now** per Q-DEV-PAY-4 `before` sequencing. This is a dependency priority for the §5 USD checklist and the entire control plane. | Pay+Email | Codex waits for the fix commit, then re-runs lane checker. No proactive Codex action. |
| 3 | trust.iai.one custom domain | **HOLD — do NOT open custom domain publicly.** Internal/static/Pages preview is allowed. Public custom-domain bind only after D1 / account ownership is reconciled (zone iai.one is on Tranhatam account, Worker is on Anhhatam account). | Founder + Codex | Codex keeps Worker live at the workers.dev URL only. No DNS / route push toward trust.iai.one until founder confirms reconcile is done. |
| 4 | Q4 VN entity selection for VND lane | **Provisional candidate #1 = IAI Real Estate & Education Services JSC**, for INTERNAL PLANNING ONLY. **No production lock, no public exposure, no VND live** until all 5 verify gates pass: (a) Cổng đăng ký doanh nghiệp quốc gia confirms registration, (b) MST is active, (c) legal representative confirmed, (d) corporate bank account confirmed, (e) e-invoice capability confirmed. | Founder + verify chain | Codex updates planning artifacts with `IAI_REAL_ESTATE_EDU_JSC_VN` placeholder + 5-gate disclosure on every reference. |
| 5 | aiaccountingloop cleanup execute | **APPROVED — execute immediately.** Cleanup must remove all foundation wording, legal/payment lane wording, and commercial posture BEFORE any payment onboarding touches that surface. | Pay+Email (executor) | Codex signs the approval block in the companion task file `docs/PAY_IAI_ONE_FOLLOWUP_AIACCOUNTINGLOOP_FOUNDATION_CLEANUP_2026-04-27.md` §4. |
| 6 | Coordination rule | **No team may lock production lanes without final legal verify.** Codex stays in relay/coordinate mode based on these 4 decisions; no new proactive scope. Pay+Email runs invoice fix first, then deploys new mail runtime. | All agents | Codex publishes this lock §10, then standby. |

### Codex execution this turn

- §10 added (this section).
- aiaccountingloop cleanup task §4 founder-approval block filled in.
- Bilingual MLM internal standard published as a separate companion file: `docs/MLM_MEANINGFUL_LIFE_MODEL_INTERNAL_STANDARD_BILINGUAL_2026.md` (internal-only — must not be rendered on any public UI). Relevant to the §5 MLM merchant-cleanup line and §9 step 2 ordering.
- No new dev scope opened beyond these decisions.

---

## 10. Change log

- 2026-04-27 v1.0 — Codex authored under founder direct mandate. IAI.ONE-only scope. Reflects FOUNDER_DECISION_RECORD_LOCKED_2026.md, PAYMENT_SPEC_FOR_DEV_DRAFT.md, PAY_TENANT_REGISTRY_DRAFT.json. Future versions: founder owns; Pay+Email or Codex updates only with founder written approval.
- 2026-04-27 v1.0.1 — Pay+Email Agent answered Q-DEV-PAY-1..5; §9 promoted from Open Questions to Resolved + sequenced dev plan added. Follow-up cleanup task file created for Q-DEV-PAY-5 (aiaccountingloop, awaiting founder execute approval).
- 2026-04-27 v1.0.2 — Founder issued 6 coordination decisions; §10 added to lock them. mail.iai.one webhook secret blocker: path B (deploy new runtime, no legacy patch). invoice.iai.one fix: Pay+Email approved to execute now (Q-DEV-PAY-4 sequencing dependency). trust.iai.one custom domain: HOLD until D1/account ownership reconciled. VN entity Q4: provisional candidate IAI Real Estate & Education Services JSC for internal planning ONLY — production lock requires 5 verify gates. aiaccountingloop cleanup: founder execute approval signed in companion task file. No team may lock production lanes without final legal verify.
