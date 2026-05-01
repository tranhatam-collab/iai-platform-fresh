# 2026-05-01 Pre-Fix Stale Artifacts

These artifacts were moved here before the next production rerun because they no longer represent the repo-side truth after the following fixes:

- commit `885fbd1` aligned the Team 2 runtime probe defaults to the canonical gate target:
  - `tenant_code = vetuonglai`
  - `site_code = vetuonglai-member`
  - `callback_url = https://member.vetuonglai.com/api/access/webhooks/pay/iai-one`
- the Worker lane now caps live payOS descriptions to 9 characters to remove a plausible code-side contributor to provider `214`

The files in this folder are still useful as pre-fix evidence, but they should not be read as the next authoritative rerun state.

## Moved artifacts
- `team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-05-01.md`
- `team1/TEAM1_PAY_PROD_GATE_STATUS_2026-05-01.json`
- `team1/TEAM1_PAY_PROD_GATE_STATUS_2026-05-01.md`
- `team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.json`
- `team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-05-01.md`
- `team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.json`
- `team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-05-01.md`
