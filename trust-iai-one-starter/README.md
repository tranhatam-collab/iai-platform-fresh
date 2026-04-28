# trust.iai.one starter

Operational Trust Surface for the IAI ecosystem. Phase 1 is **static-first** with a thin Workers API for the report form. Every public claim has inline proof or an explicit unverified disclosure.

Authoritative spec: [`TRUST_IAI_ONE_PHASE_1_IMPLEMENTATION_LOCK.md`](./TRUST_IAI_ONE_PHASE_1_IMPLEMENTATION_LOCK.md)
Team handbook: [`docs/TRUST_IAI_ONE_TEAM_HANDBOOK.md`](./docs/TRUST_IAI_ONE_TEAM_HANDBOOK.md)
Foundation sync pack: [`docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/`](./docs/TRUST_IAI_ONE_PHASE1_FOUNDATION_FILES_2026-04-26/)

---

## 1. Install

```bash
npm install
```

## 2. Build verification data and run locally

```bash
npm run dev
```

`npm run dev` first runs `trust:build-state` which probes the approved domain list and writes:

- `src/data/trust-state.json`
- `public/data/trust-state.json` (mirror, what the browser fetches)
- `docs/verification-log.md`

Then it starts `wrangler dev`. Open the URL Wrangler prints. The page reads `/data/trust-state.json` and renders all 7 modules.

## 3. Re-probe only

```bash
npm run trust:build-state
```

Run this whenever you want fresh probe data without starting the dev server.

## 4. Cloudflare deploy (one-time setup)

```bash
npx wrangler d1 create trust_iai_one_db
# Copy the returned database_id into wrangler.toml
npx wrangler r2 bucket create trust-iai-one-evidence

npm run db:prod
npm run seed:prod    # seed.sql is intentionally empty (no fake data)
```

DNS: point `trust.iai.one` (CNAME) to your Workers route or Pages domain.

## 5. Deploy

```bash
npm run deploy
```

`npm run deploy` re-builds verification data first, then runs `wrangler deploy`.

---

## What this surface contains

Foundation sync date: **2026-04-26**. Phase 1 now follows the foundation pack contracts and renders trust items as **Verified / Declared / Unverified**.

7 modules, in this order:

1. **Official Domains** — approved domains, roles, status, public evidence, stale state
2. **Official Teams** — responsibility boundaries and declared ownership
3. **Official Channels** — public channels, scope, use case, trust status
4. **Verification Methods** — how claims are checked and what limitations remain
5. **`/go/*` Short Links** — slug, destination, owner scope, reason, status
6. **Report & Impersonation** — mismatch, stale claim, and impersonation reporting path
7. **Trust Page Builder** — public trust page outputs with disclosure logic preserved

## What this surface does not contain (Phase 1)

- Authenticated user APIs (view/export/delete)
- Continuous runtime monitoring
- Anti-pattern auto-detection
- SLA enforcement
- Public exposure of internal AI sessions
- Marketing language

These are documented as Phase 2 work in Module 7 and the team handbook.

---

## Foundation pack now active

The team must treat these files as required inputs before changing code or copy:

- `TRUST_ROLE_BOUNDARY.md`
- `TRUST_CLAIM_STANDARD.md`
- `TRUST_MODULE_DATA_CONTRACTS.md`
- `TRUST_PUBLIC_VS_INTERNAL_DISCLOSURE_POLICY.md`
- `TRUST_PHASE1_ACCEPTANCE_CRITERIA.md`

If implementation conflicts with this pack, update the implementation plan first, then code.

---

## Editing rules (short version)

- Public copy edits go through `content/vi.json` and `content/en.json` together.
- New domains: append to `APPROVED_DOMAINS` in `scripts/trust-state-builder.mjs`, re-build.
- New limitations: add to `docs/known-limitations.md` and mirror into the builder.
- New incidents: follow `docs/incidents/README.md`.
- New trust items: include `status`, `evidence_reference` or `disclosure`, `last_reviewed_at`, `stale_after_days`, `owner_team`, and `public_visibility`.
- Do not hand-edit `verification-log.md` or any `trust-state.json` — re-run the builder.

Full editing rules: see the team handbook.
