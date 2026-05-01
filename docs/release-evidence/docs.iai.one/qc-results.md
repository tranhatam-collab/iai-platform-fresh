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

W1B preview deploy remains blocked until D8b is closed (Pages source reconciliation for `docs-iai-one` to monorepo `apps/docs`).
