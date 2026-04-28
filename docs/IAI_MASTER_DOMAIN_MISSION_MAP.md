# IAI_MASTER_DOMAIN_MISSION_MAP.md
## IAI - Canonical Domain Mission Map
## Version 1.1 (Locked)
## Purpose: Prevent domain-role drift across Dev / Product / Content teams

---

## 0. WHY THIS FILE EXISTS

IAI does not operate as one website.  
IAI operates as one system expressed through multiple domain surfaces.

If these surfaces are not strictly defined:
- product will drift
- docs will drift
- content will drift
- development teams will build overlapping systems
- SEO and brand trust will fracture

This file is the canonical source of truth for:
- what each domain is for
- what each domain must not become
- which team owns it
- which content belongs there
- which content is forbidden there

No team may reinterpret a domain outside this map.

---

## 1. MASTER MISSION OF *.IAI.ONE

The mission of the entire `*.iai.one` system is:

**To operate one coherent trust-rooted platform where:**
- `iai.one` defines meaning and boundaries
- `home.iai.one` routes people into the right system surface
- `app.iai.one` holds human-facing product journeys
- `flow.iai.one` executes workflows, agents, and automation
- `dash.iai.one` controls real system state
- `docs.iai.one` and `developer.iai.one` make the platform teachable and extensible
- commercial expansion layers grow on top of the same trust and execution core

---

## 2. TEAM OWNERSHIP MODEL

### TEAM A - ROOT / TRUST / DOCS / PORTAL
Owns:
- iai.one
- home.iai.one
- docs.iai.one
- developer.iai.one
- global SEO rules
- public information architecture
- language lock
- bilingual localization governance
- canonical surface descriptions

### TEAM B - CORE PRODUCT / RUNTIME / CONTROL
Owns:
- app.iai.one
- flow.iai.one
- dash.iai.one
- api.iai.one
- api.flow.iai.one
- auth/session
- billing backbone
- proof/logs/runtime state
- shared data and execution contracts

### TEAM C - GROWTH PRODUCTS / COMMERCE / EXPANSION
Owns:
- web.iai.one
- cios.iai.one
- future market-facing product surfaces
- templates / commerce / SMB products
- product-led growth surfaces

### SHARED RULE
No team owns the meaning of the brand alone.  
Root meaning is defined only by this document plus charter.

---

## 3. DOMAIN MISSION TABLE

| Domain | Canonical Role | Team Owner | What It Must Do | What It Must Never Become |
|---|---|---|---|---|
| `iai.one` | Constitutional root / trust root | Team A | Define IAI, define boundaries, route into the ecosystem, hold trust language | Not a sales page, not a product dashboard, not a fundraising portal, not a social feed |
| `home.iai.one` | System portal | Team A | Route users by intent to the right surface | Not a second homepage, not a product clone, not a long-form manifesto |
| `docs.iai.one` | Documentation and standards hub | Team A | Explain architecture, concepts, standards, platform components | Not a blog farm, not a marketing site, not a feature landing page |
| `developer.iai.one` | Developer onboarding and integration surface | Team A | Publish APIs, SDK guidance, integration contracts, builder docs | Not a sales page, not a support forum, not a generic docs mirror |
| `app.iai.one` | Human-facing core product surface | Team B | Hold community, learning, verification, personal/product journeys | Not a docs site, not a general CMS, not a B2B admin panel |
| `flow.iai.one` | Execution product surface | Team B | Build, run, govern, and extend workflows/agents/runtime systems | Not just another automation website, not a generic landing page, not a docs clone |
| `dash.iai.one` | Control plane / operator UI | Team B | Expose real runtime state, actions, approvals, logs, billing, health | Not a chart-only dashboard, not a static reporting page, not a public marketing surface |
| `api.iai.one` | Core browser-facing backend authority | Team B | Power public and human-facing domain functions consistently | Not a random endpoint dump, not a second flow engine |
| `api.flow.iai.one` | Flow runtime API authority | Team B | Execute flow, run, node, agent, billing, and runtime control APIs | Not a shadow API with duplicate business logic |
| `cios.iai.one` | Independent B2B / enterprise product | Team C | Qualify, onboard, and serve enterprise workflows and customer intelligence use cases | Not the root brand, not consumer community, not a public docs clone |
| `web.iai.one` | AI website / commerce growth product | Team C | Let users create free informational sites and paid commerce/business sites on IAI infrastructure | Not a clone of root IAI, not a generic page builder without Flow integration |
| `noos.iai.one` | Reserved meaning / aggregate / future intelligence layer | Team C (future) with Team A approval | Future aggregate layer built on trusted system data and control abstractions | Must not be used as fundraising portal, random concept site, or commercial detour |
| `mail.iai.one` | Infrastructure surface only | Team B | Mail infrastructure and operator access | Must never be presented as a public product |
| `cdn.iai.one` | Infrastructure surface only | Team B | Asset delivery and platform infrastructure | Must never be used as user-facing brand surface |
| `flows.iai.one` | Internal automation / n8n layer | Team B | Internal automation support | Must not be a public flagship product |

---

## 4. DOMAIN-BY-DOMAIN RULES

### 4.1 `iai.one`
#### Mission
Hold the meaning of IAI.  
It defines:
- what IAI is
- what IAI is not
- what the system protects
- which surfaces are primary

#### Allowed content
- charter language
- trust standards
- product architecture overview
- routing into flagship surfaces
- boundary statements
- public positioning

#### Forbidden content
- direct pricing pages
- random course/product pages
- fundraising mechanics
- marketplace product listings
- experimental feature announcements without system role

#### Immediate correction required
Any legacy Wix commerce or course pages that are still indexable must be:
- unpublished
- noindexed
- redirected
- or quarantined outside canonical IA

---

### 4.2 `home.iai.one`
#### Mission
Act as the only neutral portal into the system.

#### Allowed content
- entry by user intent
- route to app / flow / docs / dev / dashboard
- migration-safe onboarding
- where should I go next

#### Forbidden content
- becoming a second brand homepage
- duplicating root charter messaging excessively
- carrying deep feature detail better placed in product surfaces

---

### 4.3 `docs.iai.one`
#### Mission
Teach the system.

#### Allowed content
- architecture
- concepts
- standards
- models
- contracts
- pricing and billing documentation
- governance and proof
- platform-first documentation

#### Forbidden content
- generic content marketing
- public personal essays
- unowned technical pages without reviewers
- duplicate docs across domains

---

### 4.4 `developer.iai.one`
#### Mission
Enable builders to integrate with the platform.

#### Allowed content
- API references
- auth/session documentation
- flow/runtime/dev contracts
- SDK direction
- node development
- webhook rules
- app/dash integration references

#### Forbidden content
- general audience content
- enterprise marketing copy
- duplicated docs from `docs.iai.one` without role distinction

---

### 4.5 `app.iai.one`
#### Mission
Hold the human-facing product journey.

#### Allowed content
- feed
- lessons
- verification
- creator/user workflows
- member pathways
- learning and contribution surfaces

#### Forbidden content
- deep ops dashboard
- enterprise admin
- public docs duplication
- root-brand manifesto overload

---

### 4.6 `flow.iai.one`
#### Mission
Be the execution product flagship.

#### Allowed content
- builder
- runtime
- node ecosystem
- templates
- pricing
- billing
- workflow/agent/product onboarding
- links to docs and dash

#### Forbidden content
- vague AI platform language
- disconnected hype about future systems
- duplicating all of Dash inside Flow
- becoming a generic marketing site detached from execution truth

---

### 4.7 `dash.iai.one`
#### Mission
Be the control system.

#### Allowed content
- real-time or near-real-time runtime state
- actions
- approvals
- proofs
- logs
- billing
- system health
- operator surfaces

#### Forbidden content
- public promotional content
- generic analytics-only views
- fake data or mock surfaces in production
- duplicate builder experience from Flow

---

### 4.8 `cios.iai.one`
#### Mission
Operate as a standalone enterprise/B2B product.

#### Allowed content
- enterprise use cases
- demos
- pricing
- lead qualification
- compliance-safe automation positioning
- request-demo / start-free flows

#### Forbidden content
- replacing core brand
- consumer onboarding
- root charter messaging beyond minimal alignment
- direct dependency on public community language

#### Special rule
CIOS may maintain product-level auth and buyer journey independently,  
but should use shared execution/billing/auth primitives where possible.

---

### 4.9 `web.iai.one`
#### Mission
Be the growth product for mass adoption and revenue expansion.

#### Allowed content
- free informational websites
- paid business websites
- paid commerce websites
- templates
- onboarding wizard
- AI-assisted site generation
- Flow-powered lead, booking, and commerce automation

#### Forbidden content
- becoming only a pretty template gallery
- ignoring Flow integration
- behaving like a fully separate SaaS platform without shared contracts
- dumping advanced operator complexity onto beginner users

---

### 4.10 `noos.iai.one`
#### Mission
Reserved for future aggregate / meaning / higher-order intelligence layer.

#### Current rule
Do not load this domain with:
- fundraising
- investor portal logic
- random future hype
- product confusion

#### Unlock condition
NOOS may only be activated as a true layer when:
- App is alive
- Flow is alive
- Dash is alive
- proofs, decisions, and operating patterns exist at real scale

Until then, it remains reserved or docs-only.

#### P0 enforcement (effective April 14, 2026)
- `noos.iai.one` is under content freeze for any investor/fundraising surface.
- The following routes and equivalents must be removed, redirected, or noindexed before next production release:
  - `/docs/investment-programs/`
  - any page with investor package, fundraising catalog, or execution fund CTA language
- Team C cannot release NOOS public content changes without Team A boundary sign-off and Team 1 release gate confirmation.

---

## 5. SHARED PLATFORM CONTRACTS

Every domain above must obey the same shared contracts.

### Shared auth contract
- one identity model
- one session philosophy
- one workspace model
- one role model

### Shared billing contract
- one billing source of truth
- one usage model
- one plan registry
- one invoice logic

### Shared data contract
- object model must stay consistent
- user / flow / run / proof / action / workspace / asset naming must not drift

### Shared proof contract
- if a domain creates meaningful actions, it must be able to connect to proof and audit logic

### Shared language contract
- no domain may redefine what IAI is
- no domain may create its own contradictory mission
- all teams must follow `docs/IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`
- Vietnamese public surfaces must use Vietnamese with full diacritics
- international SEO surfaces must keep English as primary index language where defined

---

## 6. CONTENT RULES FOR ALL TEAMS

### Team A may publish
- root pages
- docs
- architecture content
- domain role definitions
- SEO/canonical standards

### Team B may publish
- product docs
- release notes
- runbooks
- API references
- feature-specific product copy

### Team C may publish
- product pages
- template pages
- pricing pages
- onboarding content
- growth content

### But
No team may publish pages that:
- contradict root mission
- create a new sub-brand identity accidentally
- mix fundraising/product/docs indiscriminately
- break canonical SEO logic

---

## 7. IMMEDIATE CORRECTION CHECKLIST

### Priority P0
- Quarantine or redirect stray legacy Wix pages under `iai.one`
- Lock `iai.one` as trust root only
- Lock `home.iai.one` as routing portal only
- Lock `flow.iai.one` as execution flagship
- Lock `dash.iai.one` as control plane only
- Remove investment portal role from `noos.iai.one`
- Lock bilingual SEO and localization standard across active public routes (`en` + `vi`)

### Priority P1
- Create `web.iai.one` product model
- Align docs for Flow, App, Web, CIOS, Dash
- Ensure pricing and billing language is consistent across docs and product surfaces

### Priority P2
- Unify shared design system, auth language, and cross-domain IA
- Introduce cross-domain release discipline

---

## 8. DEFINITION OF DONE

A domain is correct only when:
- its public role matches this file
- its content matches this file
- its ownership is clear
- it uses shared platform contracts
- it does not confuse users about where to go next

If a domain is technically live but role-unclear, it is not done.

---

## 9. FINAL DIRECTIVE

The `*.iai.one` system must be understood as:
- one root
- one portal
- one platform core
- multiple product surfaces
- one trust architecture

No team is allowed to freestyle domain identity.

This file overrides local interpretation.

---

# END
