# docs.iai.one QC Results

- Date refreshed: `2026-05-02`
- Status: `PASS_REPO_SIDE`

## Commands

```text
pnpm typecheck:docs
PASS
```

```text
pnpm test:docs
PASS 5/5
```

## Docs-Specific Assertions

- `/` renders docs boundary shell in VI/EN
- canonical is `https://docs.iai.one/`
- `/health` returns docs scaffold truth
- `/missing` returns explicit 404 shell

## Deploy Gate Note

W1B preview deploy is no longer blocked by D8b. The canonical runtime is Pages project `docs-iai-one`; `apps/docs` is explicitly `experimental, not_live`. W1B still follows W1A in sequence.
