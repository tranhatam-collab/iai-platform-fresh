# TRUST_CLAIM_STANDARD.md

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Required before coding `trust.iai.one` Phase 1

## 1. Purpose

This document defines how every public claim on `trust.iai.one` must be written, labeled, and supported.

The core rule is simple:

**Every public claim must have either:**
- inline proof
- or explicit disclosure of what is not yet verified

No unsupported certainty is allowed.

## 2. Claim classes

Every trust claim must be classified into exactly one of three states.

### 2.1 Verified
Use **Verified** only when:
- the claim can be checked using public evidence
- the proof is linked or embedded
- the proof is current enough for the claim
- the proof is relevant to the exact statement being made

### 2.2 Declared
Use **Declared** when:
- the claim is officially stated by the organization
- but the supporting proof is not fully public, not yet complete, or only partially observable
- the claim is still intended to be true, but public verification is incomplete

### 2.3 Unverified
Use **Unverified** when:
- public proof is missing
- the current evidence is incomplete
- the system cannot confidently verify the claim
- the claim may be true, but must not be presented as confirmed

## 3. Claim writing rules

### Rule 1
Do not use absolute wording unless the proof supports it.

### Rule 2
If the system cannot prove the claim, downgrade it.

Preferred downgrade path:
- Verified → Declared → Unverified

### Rule 3
If the claim includes time sensitivity, it must include freshness context.

### Rule 4
No hidden confidence inflation.

Do not write:
- “operationally verified” if only a team note exists
- “live” if only internal test artifacts exist
- “production-ready” if 4-proof rule is incomplete

## 4. Minimum proof standard

A strong trust claim should aim for these proof types where applicable:

1. Source proof  
2. Domain proof  
3. Deploy proof  
4. Owner proof  

If all 4 are not available, the claim may still be shown, but must likely be labeled Declared or Unverified.

## 5. Claim formatting standard

Every trust claim block should support this structure:

- Claim
- Status: Verified / Declared / Unverified
- Evidence: link, source, or reference
- Disclosure: only if needed
- Last reviewed
- Stale rule

## 6. Disclosure rules

Disclosure is mandatory when:
- proof is partial
- proof is old
- proof is internal-only
- proof cannot be safely exposed publicly
- the claim depends on private infrastructure
- the claim is awaiting confirmation

## 7. Prohibited claim patterns

The team must not publish these patterns:
- “No hidden automation” unless observability is actually complete
- “Fully verified” when only some proofs exist
- “Production-ready” without the required proof set
- hard claims about private AI or infra behavior that the public cannot verify
- model-specific claims that may become stale quickly
- claims that expose private internal scope as if it were public evidence

## 8. AI disclosure standard

Allowed public language:
- AI-assisted
- human-reviewed
- evidence-based
- verification log available where public

Not allowed in Phase 1:
- hard-coded model names in public footer
- internal AI session details
- private prompt/process details
- implied certainty because AI was involved

## 9. Freshness and stale rules

Recommended Phase 1 rule:
- stale flag appears at >30 days
- major operational claims must be reviewed before staying Verified

## 10. Mismatch rule

If a public user reports that a trust claim appears false, outdated, or inconsistent:
- do not silently ignore
- mark for review
- downgrade if necessary until resolved

## 11. Team instruction

Before publishing any trust block, ask:

1. What exactly is the claim?
2. What evidence supports it?
3. Is that evidence public?
4. Is that evidence current?
5. Should the claim be Verified, Declared, or Unverified?
6. What disclosure is required?
7. When will it become stale?
