# TRUST_PUBLIC_VS_INTERNAL_DISCLOSURE_POLICY.md

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Required before implementing public trust content

## 1. Purpose

This document defines what `trust.iai.one` may expose publicly in Phase 1, what must stay internal, and what may be shown only in summarized form.

The goal is to avoid a common failure mode:

**A trust page that leaks private operational detail and accidentally creates new trust risk.**

## 2. Public-first principle

Public trust content must be:
- useful
- verifiable where possible
- limited
- intentional
- safe

## 3. Four visibility levels

### Public
Safe to show to any visitor.

### Member
Visible only to logged-in approved members if such mode exists later.

### Admin
Visible only to trusted operators.

### Internal
Not public-facing at all.

## 4. Publicly allowed content in Phase 1

Allowed:
1. Official domain and subdomain list
2. Official roles at a high level
3. Official public communication channels
4. High-level verification methods
5. Trust labels: Verified / Declared / Unverified
6. High-level disclosures
7. Stale warnings
8. Public trust page builder outputs
9. Mismatch / impersonation reporting instructions
10. Generic AI-assisted, human-reviewed disclosure language

## 5. Publicly restricted content in Phase 1

Must not be exposed directly in public mode unless separately approved:
1. Private repository structure
2. Internal commit-level operational detail as default public artifact
3. Private agent session details
4. Internal scope boundaries not approved for public disclosure
5. Secret URLs or operational endpoints
6. Internal ownership conflicts
7. Security-sensitive implementation details
8. Internal runtime telemetry that could aid abuse
9. Model-specific AI naming if it may quickly become stale or misleading
10. Private inboxes, aliases, or internal incident contacts not intended for public use

## 6. Allowed public AI disclosure

Allowed:
- AI-assisted
- human-reviewed
- evidence-based
- verification log available where public

Not allowed in Phase 1:
- hard-coded model names in the footer
- private session or prompt details
- internal AI workflow steps
- statements implying complete observability if it does not exist

Approved generic line:

“This page may be AI-assisted and human-reviewed. Public claims are shown with proof or disclosure.”

## 7. Evidence publication rule

When evidence exists, the team must decide:

- Can it be shown publicly?
- Can it be summarized publicly?
- Must it stay internal?

## 8. Disclosure downgrade rule

If the strongest evidence is internal-only, the public claim must often be downgraded from Verified to Declared.

## 9. Mismatch handling

If a public visitor reports that something appears false or outdated:
- do not expose internal debate
- acknowledge the report path
- review internally
- update trust label if required
- publish corrected public statement when appropriate

## 10. Review cadence

Every public trust content block must have:
- a review owner
- a last reviewed date
- a stale threshold

## 11. Team instruction

Before exposing any field publicly, ask:

1. Is this necessary for public trust?
2. Is it safe to expose?
3. Is it verifiable enough for the chosen label?
4. Would exposing this create new security or legal risk?
5. Should this be public, summarized, admin-only, or internal?
