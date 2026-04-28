# DEVELOPER_IAI_ONE_TEAM1_REOPEN_REQUEST_2026-04-21

- Domain: `developer.iai.one`
- Owner: Team A DevRel Owner
- Request time: `2026-04-21`
- Request type: `REOPEN_REVIEW_VERDICT`

## 1) Packet submitted

- Main packet:
  - `docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-21.md`
- Preview runtime proof:
  - `docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_PREVIEW_RUNTIME_PROOF_2026-04-21.md`
- Remaining actions tracker:
  - `docs/release-evidence/developer.iai.one/DEVELOPER_IAI_ONE_REMAINING_ACTIONS_2026-04-21.md`

## 2) Required evidence attached

- Build/typecheck/test:
  - `pnpm build:developer` = PASS
  - `pnpm typecheck:developer` = PASS
  - `pnpm test:developer` = PASS (5/5)
- Local route proof:
  - `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.md`
  - `docs/release-evidence/developer.iai.one/artifacts/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_2026-04-21.json`
- Preview deploy:
  - `https://376c6044.iai-developer.pages.dev`
  - `https://omcode-smtp-internal-first-p.iai-developer.pages.dev`
- Screenshot pack:
  - `docs/release-evidence/developer.iai.one/artifacts/screenshots/*.png`
- Live curl pack:
  - `docs/release-evidence/developer.iai.one/artifacts/curl/health.txt`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/auth-final.txt`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/api-reference-final.txt`
  - `docs/release-evidence/developer.iai.one/artifacts/curl/webhooks-final.txt`

## 3) Request

- Team 1 xác nhận verdict cuối cho gate reopen của `developer.iai.one`:
  - Expected verdict field: `PASS/GO` hoặc `REOPEN_APPROVED`.
