# DEVELOPER_IAI_ONE_PREVIEW_RUNTIME_PROOF_2026-04-21

- Domain: `developer.iai.one`
- Proof date: `2026-04-21`
- Preview URL: `https://376c6044.iai-developer.pages.dev`
- Preview alias URL: `https://omcode-smtp-internal-first-p.iai-developer.pages.dev`
- Source commit: `OMCODE/smtp-internal-first-phase1@6783482`

## 1) Deploy proof

- Command:
  - `pnpm --filter @iai/developer deploy:preview`
- Result: `PASS`
- Deploy output:
  - `Deployment complete! Take a peek over at https://376c6044.iai-developer.pages.dev`
  - `Deployment alias URL: https://omcode-smtp-internal-first-p.iai-developer.pages.dev`

## 2) Screenshot proof (8 routes)

- `docs/release-evidence/developer.iai.one/artifacts/screenshots/root.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/quickstart.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/auth.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/api-reference.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/webhooks.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/sdk.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/nodes.png`
- `docs/release-evidence/developer.iai.one/artifacts/screenshots/changelog.png`

## 3) Live curl proof

- `/health`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/health.txt`
  - HTTP: `200`
- `/auth`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/auth-final.txt`
  - HTTP chain: `301 -> 200`
  - Canonical: `https://developer.iai.one/auth`
- `/api/reference`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/api-reference-final.txt`
  - HTTP chain: `301 -> 200`
  - Canonical: `https://developer.iai.one/api/reference`
- `/webhooks`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/webhooks-final.txt`
  - HTTP chain: `301 -> 200`
  - Canonical: `https://developer.iai.one/webhooks`

## 4) Local route/canonical matrix

- `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.md`
- `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.json`

## 5) Current gate state

- Runtime evidence package: `ATTACHED`
- Remaining item: `Team 1 reopen verdict`
