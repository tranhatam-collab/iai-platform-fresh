# PAY_IAI_ONE_FOLLOWUP_AIACCOUNTINGLOOP_FOUNDATION_CLEANUP_2026-04-27

**Status:** APPROVED — founder authorized execute on 2026-04-27 (see §4)
**Created by:** Codex (Team 1 supervisor) per Q-DEV-PAY-5 reply (Pay+Email Agent: `yes`)
**Scope:** OUT-of-batch (aiaccountingloop.com is not in IAI.ONE ecosystem; founder said "team khác làm sau")
**Reason this exists despite being out-of-batch:** security/legal leak risk. `PAY_TENANT_REGISTRY_DRAFT.json` flags both `aiaccountingloop.com` and `vn.aiaccountingloop.com` with `CRITICAL: REMOVE ALL FOUNDATION REFERENCES IMMEDIATELY`. Pay+Email Agent confirmed this should not wait for the next batch.
**Authoring chain:** Codex authored under founder direct mandate. Pay+Email is the future executor when founder approves.

---

## 1. The risk

Per `/Users/tranhatam/PHÁP LÝ CÁC CÔNG TY HOA KỲ VÀ CANADA/Tên miên phap ly các công ty/PAY_TENANT_REGISTRY_DRAFT.json`:

```jsonc
"aiaccountingloop.com": {
  "payment_needed": true,
  "lane_usd": "COMMERCIAL_USD",
  "lane_vnd": "COMMERCIAL_VND",
  "merchant_usd": "IAI_LLC_DELAWARE",
  "merchant_vnd": "TBD_VN_ENTITY",
  "CRITICAL": "REMOVE ALL FOUNDATION REFERENCES IMMEDIATELY — legal violation",
  ...
},
"vn.aiaccountingloop.com": {
  ...
  "CRITICAL": "REMOVE ALL FOUNDATION REFERENCES IMMEDIATELY",
  ...
}
```

Per `FOUNDER_DECISION_RECORD_LOCKED_2026.md` Q5 (LOCKED): ANGEL EDU TAM FOUNDATION INC. must be used for **donation / public benefit / scholarship / education support phi thương mại** ONLY. Using the Foundation as merchant of record for any commercial product is a hard legal violation.

If aiaccountingloop.com (a commercial accounting SaaS) currently shows the Foundation anywhere in:
- merchant disclosure
- terms of service
- payment receipt header
- legal entity reference
- "powered by" / "operated by" footer
- privacy policy
- contact / billing entity

…then there is an active commercial-vs-501c3 conflict that must be cleaned before any other payment work proceeds.

---

## 2. Cleanup checklist (when founder approves execute)

Pay+Email (or assigned agent) must, in this order:

1. [ ] **Discover**: grep aiaccountingloop.com source for any of: `Angel Edu Tam`, `Foundation Inc`, `ANGEL_EDU_TAM_FOUNDATION_SD`, `501(c)(3)`, `tax-exempt`, `nonprofit`. List all hits with file path + line.
2. [ ] **Snapshot**: capture current public-facing pages (PDF/screenshot) so the violation state is preserved as audit evidence before edit.
3. [ ] **Replace**: rewrite all merchant disclosures to point at the correct commercial entity per `PAY_TENANT_REGISTRY_DRAFT.json` mapping:
    - USD lane: `IAI_LLC_DELAWARE` (subject to §5 verify-first checklist of legal foundation lock)
    - VND lane: `TBD_VN_ENTITY` (Q4 PENDING — until then, VND lane stays NOT_READY)
4. [ ] **Verify**: re-grep to confirm zero Foundation references remain in aiaccountingloop public surface.
5. [ ] **Disclose**: add a single line to `docs/PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` change log noting the cleanup commit hash + date.
6. [ ] **Founder ack**: founder verifies the diff before push to production.

---

## 3. Hard rules during this cleanup

- Do not touch IAI.ONE-domain code in the same commit (keep batches isolated).
- Do not invent new merchant copy without founder approve.
- Do not enable any aiaccountingloop payment lane in this cleanup; this is a *remove*, not a *configure*.
- If any reference is in a published legal document (e.g., on a hosted PDF or a third-party portal), escalate to founder — Codex/Pay+Email cannot edit external systems.

---

## 4. Founder execute approval slot

Founder fills this in to authorize execution:

```
Q-DEV-PAY-5 execute approval — 2026-04-27

Founder approves Pay+Email to execute the cleanup checklist in §2.
Scope: aiaccountingloop.com + vn.aiaccountingloop.com only.
Other out-of-scope domains remain on hold per founder rule
"chỉ liên quan đến IAI.one trước, còn những team khác làm sau."

Executor agent: Pay+Email
Cleanup must remove ALL of the following before any payment onboarding
touches that surface:
  - foundation wording (Angel Edu Tam Foundation references)
  - legal lane wording inconsistent with commercial scope
  - payment lane wording that would imply Foundation as merchant of record
  - commercial posture conflict with 501(c)(3) restriction

Target completion: 2026-04-30 (per founder direct mandate 2026-04-27)

Founder signature: Trần Hà Tâm — 2026-04-27 (via direct reply to Codex,
recorded in PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md §10
decision row 5).
```

Status: APPROVED. Pay+Email may begin execution per §2 checklist on the next session pickup. Codex will not auto-execute the cleanup itself — execution is Pay+Email's lane.

---

## 5. Change log

- 2026-04-27 v1.0 — Codex created task per Q-DEV-PAY-5 reply (Pay+Email Agent: `yes`). Awaiting founder execute approval.
- 2026-04-27 v1.1 — Founder approved execute (decision row 5 of `docs/PAY_IAI_ONE_DEV_LEGAL_FOUNDATION_LOCK_2026-04-27.md` §10). Status promoted QUEUED → APPROVED. Target completion 2026-04-30. Pay+Email is the executor.
