# PAY TEAM D SITE ACTIVATION CANDIDATE AUDIT 2026-04-22

Version 1.0

Status: Reference Snapshot Only

Scope

Audit of current `*.iai.one` web surfaces in the repository and recommendation for which surfaces should enter the Team D payment-activation intake queue.

Owners

Control Tower / Team D / Product / Team B / Team C

Priority

Highest

⸻

## 0. Purpose

This file answers one practical question:

Which websites currently present in the repo and Cloudflare domain map should be prepared for payment activation once `pay.iai.one` is ready?

It is not a release gate.
It is an activation triage snapshot.

As of the explicit Team D intake directive dated `2026-04-22`:

* this file remains reference-only
* it no longer sets Team D intake scope
* the live source of truth for active rows is `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`

⸻

## 1. Sources used

This audit is grounded in:

* `apps/*` surfaces present in the workspace
* `docs/CLOUDFLARE_DOMAIN_PROJECT_ACCOUNT_OWNER_MATRIX_2026.md`
* `docs/reports/CANONICAL_EXECUTION_LEDGER.md`
* `content/iai-master-domain-mission-map.md`
* `content/site-map.md`
* relevant commerce and billing docs for `web` and `noos`

⸻

## 2. Surfaces found in the workspace

Public or user-facing app surfaces currently present in `apps/`:

* `app`
* `dash`
* `developer`
* `docs`
* `flow`
* `home`
* `nft`
* `noos-web`
* `pay`
* `root`
* `web`

Mail and infra-related surfaces also present:

* `mail-api`
* `mail-smtp`
* `mail-web`
* `mail-worker`

Cloudflare domain matrix currently includes:

* `iai.one`
* `home.iai.one`
* `docs.iai.one`
* `developer.iai.one`
* `app.iai.one`
* `flow.iai.one`
* `dash.iai.one`
* `api.iai.one`
* `api.flow.iai.one`
* `web.iai.one`
* `cios.iai.one`
* `noos.iai.one`
* `nft.iai.one`
* `pay.iai.one`
* `mail.iai.one`
* `cdn.iai.one`
* `flows.iai.one`

⸻

## 3. Recommended Team D intake candidates

These should be in Team D intake preparation now.

### A. `web.iai.one`

Recommendation:

* add to Team D intake now
* priority: `P0`

Reason:

* mission includes paid business and commerce plans
* is a growth surface likely to need direct collection setup
* already present in Cloudflare domain matrix
* currently `APPROVED_MONITOR_ONLY`, so it is not blocked by missing domain existence, but still not fully synchronized live

Recommended Team D action:

* lock market type
* choose VN or international onboarding form
* collect owner and settlement model for first payment-enabled wave

### B. `noos.iai.one`

Recommendation:

* add to Team D intake now
* priority: `P0`

Reason:

* active commerce lock pack exists
* checkout, buyer library, order, and fulfillment flows are already specified
* clearly payment-adjacent and commerce-relevant
* should be ready in activation planning before the gateway is fully opened

Recommended Team D action:

* decide first commercial wave
* decide whether the first live activation is VN-first or international
* collect owner and account truth early

### C. `cios.iai.one`

Recommendation:

* add to Team D intake, but keep blocked
* priority: `P1`

Reason:

* enterprise surface likely to need collection or invoice-linked payment later
* current domain review is still not closed
* should be in the queue so intake is not forgotten, but should not move to live activation yet

Recommended Team D action:

* create blocked intake row
* wait for Team C review closure
* collect owner and commercial model next

### D. `app.iai.one`

Recommendation:

* add to Team D intake as a secondary candidate
* priority: `P2`

Reason:

* mission includes user-facing operations and account journeys
* commerce contracts reference app-facing buyer-library and account surfaces
* may be a supporting payment/account surface rather than the primary collection surface

Recommended Team D action:

* confirm whether app is direct payment intake or only post-purchase account surface
* if direct billing is planned, collect owner and settlement data

⸻

## 4. Surfaces not recommended for Team D intake right now

These should stay out of the payment-activation queue for now.

### `pay.iai.one`

Do not add as merchant intake.

Reason:

* this is the payment and settlement layer itself
* it is the system being completed, not a merchant website to onboard

### `iai.one`, `home.iai.one`, `docs.iai.one`, `developer.iai.one`

Do not add.

Reason:

* trust root, portal, docs, and build layer
* no current direct payment role is locked

### `flow.iai.one`, `dash.iai.one`, `api.iai.one`, `api.flow.iai.one`

Do not add.

Reason:

* execution, control, and API layers
* runtime and operations surfaces, not merchant onboarding targets

### `mail.iai.one`, `cdn.iai.one`, `flows.iai.one`

Do not add.

Reason:

* infrastructure-only surfaces

### `nft.iai.one`

Do not add in the current payment wave.

Reason:

* trust and registry surface
* mission explicitly blocks drift into speculative marketplace behavior
* no current payment activation requirement is locked from the documents reviewed in this audit

⸻

## 5. Current Cloudflare and execution truth by activation relevance

| Domain | Current execution truth | Team D intake recommendation | Reason |
|---|---|---|---|
| `web.iai.one` | `APPROVED_MONITOR_ONLY` | `ENTER_NOW` | paid business and commerce plans |
| `noos.iai.one` | `APPROVED_MONITOR_ONLY` | `ENTER_NOW` | active commerce and checkout architecture |
| `cios.iai.one` | `REVIEW_BLOCKED` | `ENTER_BLOCKED` | likely commercial surface, but domain closure still open |
| `app.iai.one` | `APPROVED_MONITOR_ONLY` | `ENTER_SECONDARY` | may support buyer/account/payment journeys |
| `pay.iai.one` | `GATE_LOCKED` | `DO_NOT_ENTER` | payment system itself, not merchant intake |
| `developer.iai.one` | `REVIEW_READY` | `DO_NOT_ENTER` | build layer, no direct payment role |
| `docs.iai.one` | `APPROVED_MONITOR_ONLY` | `DO_NOT_ENTER` | knowledge layer |
| `home.iai.one` | `APPROVED_MONITOR_ONLY` | `DO_NOT_ENTER` | portal layer |
| `iai.one` | `APPROVED_MONITOR_ONLY` | `DO_NOT_ENTER` | trust root |
| `flow.iai.one` | `APPROVED_MONITOR_ONLY` | `DO_NOT_ENTER` | execution surface |
| `dash.iai.one` | `APPROVED_MONITOR_ONLY` | `DO_NOT_ENTER` | control surface |
| `nft.iai.one` | `APPROVED_MONITOR_ONLY` | `DEFER` | trust surface, payment role not locked |

⸻

## 6. Action already taken

The following rows have been added to the Team D intake board:

* `web.iai.one`
* `noos.iai.one`
* `cios.iai.one`
* `app.iai.one`

Board file:

* `docs/PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md`

⸻

## 7. Immediate next step for Team D

Team D should do this next:

1. confirm legal owner and market type for `web.iai.one`
2. confirm legal owner and first commercial wave for `noos.iai.one`
3. leave `cios.iai.one` in blocked status until Team C closes the domain review gap
4. decide whether `app.iai.one` is a direct billing surface or only a post-purchase account surface

⸻

## 8. Final direction

The correct operational move is not to throw every domain into payment onboarding.

The correct move is:

* put real commerce candidates into Team D intake now
* keep non-merchant and infra surfaces out
* keep blocked commercial surfaces visible but blocked
* be ready to collect owner and account truth as soon as `pay.iai.one` is ready

That is the correct payment-activation triage for the current `*.iai.one` workspace.

⸻
