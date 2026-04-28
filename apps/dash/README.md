# `@iai/dash`

Phase 0 scaffold for `dash.iai.one`.

Current guarantees:
- auth guard exists for app routes
- workspace resolution is explicit
- runtime summary is fetched from `api.flow`
- no fake runtime state is rendered as product truth

Environment:
- `DASH_FLOW_API_BASE`
- `DASH_SHARED_AUTH_URL`
- `DASH_SESSION_COOKIE_NAME`
- `DASH_WORKSPACE_COOKIE_NAME`
- `DASH_DEFAULT_WORKSPACE_ID`
- `DASH_PORT`
- `DASH_HOST`

This package is intentionally narrow until the Phase 1 control-home lane is locked.
