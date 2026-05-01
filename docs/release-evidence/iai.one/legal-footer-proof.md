# iai.one Legal Footer Proof

Status: `PASS_REPO_SIDE`

Required footer signals:

- legal URL: `https://docs.iai.one/legal/iai-flow/`
- entity: `Angel Edu Tam Foundation Inc`

Machine proof:

- `tests/integration/root-surface.test.mjs` asserts both signals on the VI landing page.
- `tests/integration/root-surface.test.mjs` asserts `Legal entity: Angel Edu Tam Foundation Inc` on the EN landing page.

D2/D3 status: `CLOSED_REPO_SIDE`.
