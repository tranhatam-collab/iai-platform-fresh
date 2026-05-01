# TEAM1_ALL_WEB_EXECUTION_AND_QC_DIRECTIVE_2026-05-01

- Date: `2026-05-01`
- Timezone: `Asia/Ho_Chi_Minh`
- Status: `ACTIVE_EXECUTION_RESTART`
- Authority: Team 1 Control Tower
- Scope: public and semi-public `*.iai.one` surfaces while `payOS` business verification remains external

## 0. Why this directive is active now

`pay.iai.one` provider verification is parked at external merchant truth.
That does not stop the rest of the `*.iai.one` ecosystem from being completed repo-side.

From this point forward:
- we continue all public-surface completion work
- we do not wait idly on `payOS`
- we do not mix external provider blockers with repo-side web quality work

## 1. Hard rules

1. No team may claim `production complete`, `public-live complete`, or `SEO complete` while `PRODUCTION_PUBLICATION_HOLD` remains active.
2. Public navigation must not advertise unresolved or not-public-ready domains as if they are live.
3. Internal or technical roots must not be treated like marketing/public SEO surfaces unless Team 1 explicitly flips that policy.
4. No deploy happens from this directive without founder review after QC evidence is attached.

## 2. Current execution split

### Lane parked externally

- `pay.iai.one` merchant/business verification on `payOS`
- owner: Team Pay / provider owner
- repo-side status: already narrowed and parked correctly

### Lane active internally now

- root/home public truth cleanup
- unresolved-domain navigation cleanup
- sitemap / metadata / bilingual / legal consistency completion
- technical-surface boundary hardening
- deploy sequence preparation by wave

## 3. Batch 1 starting now

Batch 1 is intentionally narrow and high-signal:

1. Hide `web.iai.one` from `iai.one` and `home.iai.one` by default until public deploy truth exists.
2. Reclassify `web.iai.one`, `cdn.iai.one`, and `flows.iai.one` correctly in canonical site-map content.
3. Keep `cdn.iai.one` and `flows.iai.one` out of public-ready truth until DNS/runtime proof exists.
4. Attach QC evidence for the changed public shells before any deploy discussion starts.

## 3.1 Batch 1.1 refinement now active

Before Wave 1 evidence packets are considered review-ready, Team 1 requires one more cleanup pass:

1. `pay.iai.one` must stop advertising `web.iai.one` by default.
2. `root`, `home`, and `pay` `/health` must not expose active `web_url` when web-surface hold is still on.
3. `web.iai.one` source copy must read as `release-hold`, not already public-live.
4. trust-state must classify unresolved declared domains as `hold`, not `public-ready`.

## 4. Team tasks from this point

### Team 1 Control Tower

- Keep global state at `PRODUCTION_PUBLICATION_HOLD`.
- Accept repo-side quality progress even while `payOS` remains externally blocked.
- Gate every deploy wave with exact tests/checkers and live evidence.

### Team 5 Web / Home / Root

- Maintain `home.iai.one` and `iai.one` as truthful public entry surfaces.
- Do not expose `web.iai.one` by default until Team 1 flips deploy truth.
- Keep portal/root copy aligned with current release state instead of aspirational state.

### Team B Infra / Flows / CDN

- Either make `cdn.iai.one` and `flows.iai.one` live with DNS/runtime proof, or keep them out of public navigation and public-ready docs.
- Submit domain-specific proof only; narrative is not enough.

### Team C SEO / Language

- Finish sitemap validity, metadata completeness, and bilingual route separation.
- Prioritize surfaces still open in the public hold packet:
  - `flow.iai.one`
  - `cios.iai.one`
  - `dash.iai.one`
  - `developer.iai.one`
  - `mail.iai.one`
  - `nft.iai.one`
  - `noos.iai.one`

### Team Runtime / API owners

- Keep technical roots on explicit policy:
  - public API landing with docs/legal
  - or internal/noindex technical root
- No ambiguous middle state.
- `api.iai.one` stays `policy/docs only` until a real runtime source-of-truth exists in repo.

### Legal / Docs owners

- Standardize legal URL to `https://docs.iai.one/legal/iai-flow/`
- Standardize entity to `Angel Edu Tam Foundation Inc`
- Remove footer/legal drift across public roots

## 5. QC gates by wave

### Wave A — public truth and navigation

- `pnpm test:root`
- `pnpm test:home`
- manual diff check on public-link surfaces

### Wave B — sitemap/indexability/language

- `pnpm test:flow-surface`
- `pnpm test:developer`
- `pnpm test:dash`
- Team 1 language audit / universal bilingual rerun

### Wave C — technical-surface policy

- pay/api/mail boundary policy verification
- noindex/legal/doc-link checks
- security-boundary note attached
- Lighthouse is not required by default for technical/internal surfaces.

### Wave D — deploy preparation

- only after founder review
- only after repo-side QC is green
- deploy one wave at a time

## 6. Planned deploy order after founder review

1. `W1A` -> `iai.one` + `home.iai.one`
2. `W1B` -> `docs.iai.one`
3. `W2` -> `flow.iai.one` + `developer.iai.one` + `dash.iai.one`
4. `W3` -> `cios.iai.one` + `nft.iai.one` + `noos.iai.one`
5. `W4` -> `mail.iai.one` + technical roots with explicit boundary policy + `app.iai.one`
6. `W5` -> `web.iai.one` only after DNS/deploy/public proof, plus `life.iai.one`
7. `W6` -> `cdn.iai.one` and `flows.iai.one` only after owner evidence is accepted

## 7. Batch 1 exit criteria

Batch 1 is complete when:

1. `root` and `home` no longer default to advertising `web.iai.one`
2. canonical site-map content no longer frames `cdn.iai.one` or `flows.iai.one` as public-ready
3. QC for `root` and `home` is green
4. founder can review a clean repo-side packet before any deploy wave begins

## 8. Reminder

We are not waiting idly for `payOS`.
We are finishing everything else that can be completed honestly inside the codebase, then deploying in controlled waves after founder approval.
