# TRUST_IAI_ONE_PHASE_1_IMPLEMENTATION_LOCK.md

**Project:** trust.iai.one  
**Document type:** Founder approved implementation lock for dev team  
**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Phase 1 approved with constraints  
**Owner:** Trần Hà Tâm  
**Purpose:** Build trust.iai.one as an Operational Trust Surface, not as a marketing page, not as a legal page, and not as a slogan-based declaration.

---

## 0. Founder Verdict

The proposed plan is directionally correct and can move to implementation.

The strongest point is the root rule:

> Every public claim must have inline proof or explicit unverified disclosure. If a claim cannot be verified, it must not appear as a public claim.

This rule is approved.

However, the implementation must be tightened before code. Trust.iai.one must never become a polished page that creates trust by language alone. It must create trust by proof, limitation disclosure, and visible operating evidence.

Phase 1 is approved as a static-first MVP, with no backend claims, no unsupported system claims, no private internal exposure, and no exaggerated language.

---

## 1. Non-Negotiable Product Rule

Every public statement on trust.iai.one must fall into one of three categories:

1. **Verified**
   The statement has inline evidence, probe data, source link, commit reference, schema source, or build log.

2. **Declared**
   The statement is officially stated by the organization, but public proof is incomplete, summarized, or internal-only.

3. **Unverified**
   The page openly says:
   - what is not verified,
   - why it is not verified,
   - what is needed to verify it,
   - when it will be reviewed again.

Any statement outside these three categories must be removed.

---

## 2. Final Corrections Applied

### 2.1 No absolute hidden automation claim

Do not say:

> There is no background automation.

Use:

> Automated behavior is disclosed according to its declared scope. If a behavior is not yet verifiable, this page shows it as unverified.

Reason: Phase 1 does not have full observability across the whole ecosystem.

---

### 2.2 Do not expose private AI session details in Phase 1

Public wording must stay generic:

> This page may be AI-assisted and human-reviewed. Build evidence is available in the verification log.

Do not publish:
- internal AI session names,
- exact model names,
- private commit scopes,
- internal task names,
- private repo references,
- internal operator details.

Detailed AI operation evidence can be moved to member or admin view in Phase 2.

---

### 2.3 Domain Registry must only show Verified domains when evidence supports it

Phase 1 must only show domains that meet both conditions:

1. DNS resolves.
2. HTTP returns a valid 2xx or expected production health status.
3. Page or endpoint has real content, not parked, empty, or placeholder content.

Domains that fail must not be presented as Verified. They may appear in a separate section titled:

> Outside Phase 1 verified scope

with reason: not resolving, not probed, not production content, or pending verification.

---

### 2.4 Do not hard-code model names or vendor claims

Do not say:
- Claude
- Opus
- GPT
- Anthropic
- OpenAI
- Codex
- any exact model name

Unless there is a public reason and evidence. Phase 1 does not need it.

Use:

> This page may be AI-assisted and human-reviewed. Build evidence is available in the verification log.

---

### 2.5 Phase 1 can proceed without waiting for seven approvals

The team may proceed under this lock.

Required checkpoints:

1. Builder output review.
2. Page content review.
3. Smoke verification before deploy.

---

### 2.6 Foundation pack is now active

The 2026-04-26 foundation pack is required input for all Phase 1 work:

- `docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_ROLE_BOUNDARY.md`
- `docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_CLAIM_STANDARD.md`
- `docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_MODULE_DATA_CONTRACTS.md`
- `docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_PUBLIC_VS_INTERNAL_DISCLOSURE_POLICY.md`
- `docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/TRUST_PHASE1_ACCEPTANCE_CRITERIA.md`

Any older wording in this lock that conflicts with those files must be interpreted through the foundation pack. In particular:

- Trust labels are now **Verified / Declared / Unverified**.
- The active module map is **Official Domains / Official Teams / Official Channels / Verification Methods / `/go/*` Short Links / Report & Impersonation / Trust Page Builder**.
- Public mode must expose only fields approved by the public-vs-internal disclosure policy.

---

## 3. Phase 1 Scope

Phase 1 is static-first.

Approved:
- Astro
- Tailwind CSS
- Cloudflare Pages
- Build-time trust-state generator
- Static verification data
- Public 7-module Trust UI
- Report form with mailto fallback
- Known limitations file
- Incident skeleton with no fake incidents
- Stale verification flags

Not approved for Phase 1:
- Backend API claims
- D1 production logic
- User data export API
- User delete API
- Authenticated member view
- Runtime SLA monitoring
- Cron-based probing
- Automated dark-pattern detection
- Public exposure of internal AI sessions
- Marketing language

---

## 4. Phase 1 Information Architecture

The Trust page must contain seven modules from the active foundation pack.

Each module item must support the shared trust contract where applicable:

1. `id`
2. `title`
3. `status` (`verified`, `declared`, `unverified`)
4. `summary`
5. `evidence_url` or `evidence_reference`
6. `disclosure`
7. `last_reviewed_at`
8. `stale_after_days`
9. `owner_team`
10. `public_visibility`
11. `notes`

Each public item must render one visible status. Items with internal-only evidence must normally be downgraded to Declared in public mode.

---

## 5. Seven Module Specification

### 5.1 Module 1 — Official Domains

**Purpose:** Publish official approved domains and subdomains without presenting unsupported domains as operational truth.

Minimum fields:
- domain
- role
- status
- canonical
- owner_team
- legal_lane
- public_evidence
- disclosure
- last_reviewed_at

Failure mode:
- unsupported domains must be Declared or Unverified, not Verified
- stale domains must show a visible warning

---

### 5.2 Module 2 — Official Teams

**Purpose:** Publish team responsibility boundaries at a high level without exposing private operational detail.

Minimum fields:
- team_id
- team_name
- surface_scope
- responsibility_summary
- status
- public_contact_reference
- owner_declared
- disclosure
- last_reviewed_at

Failure mode:
- team ownership conflicts stay internal unless approved for public disclosure
- unconfirmed responsibility must be Declared or Unverified

---

### 5.3 Module 3 — Official Channels

**Purpose:** Show official public communication and reporting channels, including their scope and use case.

Minimum fields:
- channel_type
- label
- value
- status
- scope
- use_case
- public_evidence
- disclosure
- last_reviewed_at

Failure mode:
- private inboxes, aliases, or internal incident contacts must not appear in public mode

---

### 5.4 Module 4 — Verification Methods

**Purpose:** Explain how claims are checked, what evidence applies, and what limitations remain.

Minimum fields:
- method_id
- title
- applies_to
- description
- status
- evidence_reference
- limitations
- disclosure
- last_reviewed_at

Failure mode:
- methods without public proof must not be described as fully verified

---

### 5.5 Module 5 — `/go/*` Short Links

**Purpose:** Publish short-link routes only when their destination, owner scope, and reason are clear.

Minimum fields:
- slug
- destination
- owner_scope
- status
- public_reason
- evidence_reference
- disclosure
- last_reviewed_at

Failure mode:
- ambiguous, stale, or unowned short links must be Declared or Unverified

---

### 5.6 Module 6 — Report & Impersonation

**Purpose:** Provide a visible public path for mismatch, stale-claim, and impersonation reports.

Minimum fields:
- report_type
- label
- submission_method
- scope
- visibility
- status
- privacy_note

Failure mode:
- the page must not overpromise response time or enforcement capability in Phase 1

---

### 5.7 Module 7 — Trust Page Builder

**Purpose:** Allow public trust pages to be created or published while preserving disclosure, visibility, and status logic.

Minimum fields:
- page_id
- subject_type
- subject_name
- status
- verification_methods
- official_links
- public_contact
- disclosure
- last_reviewed_at

Failure mode:
- generated or builder-assisted pages must not bypass claim status, evidence, disclosure, stale, or visibility rules

---

## 6. Required File Structure

Use this structure unless an existing founder-created folder requires adaptation.

```text
apps/trust/
  src/
    pages/
      index.astro
      official-domains.astro
      official-teams.astro
      official-channels.astro
      verification-methods.astro
      go-links.astro
      report-impersonation.astro
      trust-page-builder.astro
    components/
      DomainCard.astro
      TeamBoundaryCard.astro
      ChannelCard.astro
      VerifyLink.astro
      StaleFlag.astro
      TrustStatusBadge.astro
      UnverifiedBadge.astro
      ReportForm.astro
      DisclosureFooter.astro
    data/
      trust-state.json
    styles/
      global.css
  scripts/
    trust-state-builder.mjs
  docs/
    known-limitations.md
    verification-log.md
    TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/
    incidents/
      README.md
  astro.config.mjs
  package.json
  tailwind.config.mjs
  README.md
```

---

## 7. Trust State Builder Requirement

Create:

```text
apps/trust/scripts/trust-state-builder.mjs
```

The builder must:

1. Probe approved domain list.
2. Record DNS resolution result.
3. Record HTTP status.
4. Record content verification status if possible.
5. Mark failed domains as Declared or Unverified, never Verified.
6. Mark stale verification over 30 days.
7. Generate `src/data/trust-state.json`.
8. Generate or update `docs/verification-log.md`.
9. Preserve status, evidence or disclosure, owner, visibility, and stale fields for all module items.

The builder must not delete failed domains silently. It must mark status clearly.

---

## 8. Trust State JSON Schema

```json
{
  "generated_at": "2026-04-26T00:00:00.000Z",
  "build_commit": "unknown-or-git-hash",
  "verification_policy": {
    "stale_after_days": 30,
    "phase": "phase_1_static",
    "allowed_statuses": ["verified", "declared", "unverified"]
  },
  "domains": [
    {
      "fqdn": "example.iai.one",
      "role": "product surface",
      "phase_1_scope": "verified_public",
      "last_verified": "2026-04-26",
      "status": "verified | declared | unverified",
      "owner_team": "Trust PMO",
      "public_visibility": "public",
      "disclosure": "",
      "probe": {
        "dns_resolved": true,
        "http_status": 200,
        "content_checked": true,
        "stale_days": 0
      },
      "proof": {
        "dns": "available",
        "http": "available",
        "source": "build_time_probe"
      }
    }
  ],
  "teams": [],
  "channels": [],
  "verification_methods": [],
  "go_links": [],
  "reporting_paths": [],
  "trust_pages": [],
  "ai_disclosure": {
    "public_statement": "This page may be AI-assisted and human-reviewed. Build evidence is available in the verification log.",
    "private_session_details_public": false,
    "last_reviewed": "2026-04-26"
  },
  "limitations": [],
  "incidents": [],
  "outside_phase_1_scope": []
}
```

---

## 9. Public Copy Rules

### Allowed tone

Use:
- calm
- precise
- verifiable
- non-sales
- direct

Do not use:
- revolutionary
- world-changing
- trusted by
- best
- transparent without proof
- safe without scope
- ethical without evidence
- future of humanity
- value of mankind
- perfect
- 100 percent verified unless actually verified

---

## 10. Public Footer Copy

Use exactly:

```text
This page may be AI-assisted and human-reviewed. Build evidence is available in the verification log.
```

Vietnamese:

```text
Trang này có thể có sự hỗ trợ của AI và đã được con người rà soát. Bằng chứng build được công bố trong nhật ký xác minh.
```

---

## 11. Report Form Phase 1

Phase 1 uses a no-backend fallback.

Options:
- mailto founder or trust mailbox
- static form provider only if already approved
- no hidden external tracking

Form fields:
- issue type
- affected page
- what seems incorrect
- optional contact email
- evidence link or screenshot note

Form must clearly state:

> Phase 1 does not use a backend ticketing system yet. Reports are sent through the listed contact path.

---

## 12. Smoke Verification Checklist

Before deploy, the dev team must confirm:

- No unsupported public claim.
- No slogan-only trust language.
- No model/vendor hard-code.
- No private AI session detail.
- No fake incident.
- No fake SLA.
- No fake anti-pattern audit.
- Domain Registry only shows Verified domains when public proof meets the threshold.
- Failed domains appear only in outside scope or unverified section.
- Every page has AI-assisted and human-reviewed footer.
- Every module has either proof, Declared disclosure, or Unverified disclosure.
- Mobile layout works.
- Dark mode works if included.
- Build passes.
- Generated trust-state.json exists.
- verification-log.md exists.

---

## 13. Three Checkpoints

### Checkpoint 1 — Builder output

Deliver:
- trust-state-builder.mjs
- trust-state.json
- verification-log.md

Founder reviews:
- domain list
- outside scope list
- trust label classification
- AI disclosure level
- stale flags

---

### Checkpoint 2 — Page draft

Deliver:
- all 7 active module sections or pages
- components
- content wired to trust-state.json

Founder reviews:
- wording
- proof links
- unverified disclosures
- no marketing language

---

### Checkpoint 3 — Pre-deploy smoke pass

Deliver:
- build output
- smoke checklist
- README
- deployment notes

Founder approves:
- push
- Cloudflare Pages deploy
- DNS CNAME for trust.iai.one

---

## 14. Revenue Driver Logic

Trust.iai.one should become a revenue driver by proving that IAI is not only selling AI tools, but selling verifiable operating confidence.

Do not sell trust as emotion.

Sell:

1. Evidence export
2. Audit history
3. Domain verification
4. AI usage disclosure
5. Incident transparency
6. User control logs
7. Enterprise trust API in Phase 2
8. Member-level system trace
9. Compliance-ready evidence package later
10. Operational reliability proof

### Free layer

Public:
- overview
- verified domain registry
- limitations
- incident skeleton
- public trust policy

### Member layer

Later:
- deeper logs
- user request history
- report tracking
- evidence export

### Pro layer

Later:
- PDF evidence export
- audit package
- API evidence feed
- deeper AI behavior trace

### Enterprise layer

Later:
- trust API
- compliance reports
- dedicated trust dashboard
- SLA evidence
- private deployment trust log

Core positioning:

> Users do not pay for trust language. They pay for verification, control, evidence, and operational accountability.

---

## 15. Final Implementation Decision

Proceed with Phase 1 under the following command:

```text
Proceed with trust.iai.one Phase 1.

Build apps/trust as a static-first Astro + Tailwind + Cloudflare Pages surface.

Every public claim must be backed by inline proof, generated verification data, source file, or explicit unverified disclosure.

Do not expose private AI sessions, do not hard-code model/vendor names, do not list unverified domains as Verified, do not claim backend controls that Phase 1 does not have.

Ship three checkpoints:
1. trust-state builder and verification output,
2. page draft with 7 modules,
3. smoke verification before deploy.
```

---

## 16. Definition of Done

Phase 1 is done when:

- trust-state builder runs.
- trust-state.json is generated.
- verification-log.md is generated.
- 7 modules are implemented.
- index page links to all modules.
- no unsupported claim exists.
- every public item is marked Verified, Declared, or Unverified.
- Verified domains are probe-backed.
- outside-scope domains are not disguised as Verified.
- report form works through Phase 1 fallback.
- README explains local run and deploy.
- Cloudflare Pages can build the site.
- founder can review the generated evidence before public deployment.

---

## 17. Founder Note to Team

This project is not a design task first. It is an evidence task first.

Design must serve verification.

The page can be simple. It cannot be vague.

Empty verified data is acceptable.

Fake confidence is not acceptable.

Trust.iai.one must become the place where the IAI ecosystem shows what is real, what is still limited, and what can be checked by users.
