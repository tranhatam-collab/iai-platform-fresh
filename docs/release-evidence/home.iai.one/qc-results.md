# home.iai.one QC Results

- Date refreshed: `2026-05-02`
- Status: `PASS_REPO_SIDE`

## Commands

```text
pnpm test:home
PASS 5/5
```

```text
pnpm typecheck:home
PASS
```

```text
pnpm test:root
PASS 5/5
```

```text
pnpm test:docs
PASS 5/5
```

```text
pnpm test:app
PASS 4/4
```

```text
pnpm --filter @iai/developer build
PASS

pnpm --filter @iai/developer typecheck
PASS

node --test tests/integration/developer-surface.test.mjs
PASS 6/6
```

## Home-Specific Assertions

- `/health` returns `web_surface_enabled=false`
- `/health` returns `web_url=null`
- default `/` HTML does not expose `https://web.iai.one`
- default `/` HTML exposes `https://docs.iai.one/legal/iai-flow/`
- default `/` HTML exposes `Angel Edu Tam Foundation Inc`
- EN render exposes `Legal entity: Angel Edu Tam Foundation Inc`
