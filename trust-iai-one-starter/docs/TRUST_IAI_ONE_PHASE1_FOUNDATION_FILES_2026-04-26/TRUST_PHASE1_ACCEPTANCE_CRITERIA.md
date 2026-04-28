# TRUST_PHASE1_ACCEPTANCE_CRITERIA.md

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Required before team begins coding Phase 1

## 1. Purpose

This document defines what must be true before `trust.iai.one` Phase 1 can be considered acceptable for release.

It is not enough that the page looks good.  
It must be trustworthy by design.

## 2. Phase 1 release goal

Phase 1 is approved only as a **static-first operational trust surface**.

## 3. Minimum technical acceptance

Phase 1 is acceptable only if all of the following are true:

1. Built as static-first
2. Uses Astro + Tailwind
3. Deployable on Cloudflare Pages
4. No mandatory backend required for public trust rendering
5. Content-driven structure is clear and maintainable
6. Trust labels render correctly
7. Stale flag logic works
8. Mismatch reporting path exists
9. Unsupported domains are not presented as fully operational truth
10. No private infra is exposed publicly

## 4. Minimum product acceptance

Phase 1 must include these 7 modules:

1. Official Domains
2. Official Teams
3. Official Channels
4. Verification Methods
5. `/go/*` Short Links
6. Report & Impersonation
7. Trust Page Builder

## 5. Trust-label acceptance

Every public claim block must satisfy:
- one visible label: Verified, Declared, or Unverified
- proof or disclosure attached
- last reviewed date available
- stale logic available

## 6. Evidence acceptance

Phase 1 must not publish unsupported claims as strong truth.

## 7. Domain registry acceptance

The Official Domains module passes only if:
- live or probe-able domains are clearly identified
- non-stable or unsupported domains are not shown as fully verified
- each listed domain has a role
- each listed domain has a trust status
- stale entries are visibly flagged

## 8. Public disclosure acceptance

Phase 1 passes public disclosure acceptance only if:
- AI disclosure is generic and safe
- no hard-coded model names are required in footer
- no private internal scope is exposed
- no private repo structure is exposed
- no sensitive operational notes leak into public mode

## 9. Stale and mismatch acceptance

Phase 1 passes only if:
- stale threshold is implemented
- stale items show warning at >30 days
- mismatch report path is visible
- impersonation report path is visible
- the wording does not overpromise response capabilities

## 10. UX acceptance

Phase 1 must be:
- clear
- calm
- minimal
- trust-oriented
- easy to scan

## 11. Safety acceptance

Phase 1 fails if it:
- exposes private infrastructure
- exposes secrets
- exposes unapproved internal ops detail
- exposes private AI session detail
- mislabels unsupported claims as verified
- confuses role boundaries across IAI surfaces

## 12. Content acceptance

The content passes only if:
- every module has bounded scope
- every trust statement is evidence-aware
- every stale item has stale handling
- every disclosure is readable and not hidden
- unsupported certainty is removed

## 13. Founder acceptance checklist

Founder may approve Phase 1 release only if all boxes below are true:

- [ ] Role boundary is respected
- [ ] Claim standard is implemented
- [ ] Data contracts are respected
- [ ] Public vs internal disclosure rules are respected
- [ ] Static-first build works on Cloudflare Pages
- [ ] All 7 modules exist
- [ ] Stale flag >30 days works
- [ ] Mismatch form/path exists
- [ ] No private infra exposure
- [ ] No hard-coded model naming requirement
- [ ] No unsupported claim inflation
- [ ] Trust page builder preserves disclosure logic

## 14. Team release rule

The team must not call Phase 1 “done” merely because:
- the UI is built
- the page deploys
- the modules render

Phase 1 is only done when:
- the trust logic is correct
- the disclosure logic is correct
- the boundary logic is correct
- the content is safer than silence

## 15. Final instruction

Ship Phase 1 only when it is modest, clear, and true.

If the choice is between:
- shipping a bigger page with weaker truth
- or shipping a smaller page with stronger truth

choose the smaller, truer page.
