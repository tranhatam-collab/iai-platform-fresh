# TEAM3_TO_TEAM2_UI_HOOKS_CONFIRMATION_2026-04-18
- Team: Team 3 Surface/IA/Content
- Receiver: Team 2 Runtime and Platform Core
- Date: 2026-04-18
- Scope: xác nhận NOOS UI hooks consume runtime locale/auth/session contract mà không fork

## Checkpoint A (Team 3 -> Team 2)
- `POST /en/checkout` giữ đúng `en` contract path:
  - redirect về `/en/checkout-success`
  - order locale giữ `en`
  - success path giữ `/en/checkout-success`
- `POST /vi/checkout` giữ đúng `vi` contract path:
  - redirect về `/vi/checkout-success`
  - order locale giữ `vi`
  - success path giữ `/vi/checkout-success`

Proof source:
- `tests/integration/noos-commerce-stack.test.mjs`
- `apps/noos-web/src/server.ts`
- `apps/noos-web/src/render.ts`

## Checkpoint B (Team 2 -> Team 3)
- success route giữ locale khi return-to-library handoff:
  - EN success link về EN library path
  - VI success link về VI library path
- library surfaces giữ localized behavior và `noindex,nofollow` cho buyer-private routes
- invalid locale fallback giữ default `en` và không làm drift success/library paths

Proof source:
- `tests/integration/noos-commerce-stack.test.mjs`
- `tests/integration/noos-commerce-surface.test.mjs`

## Contract posture
- Team 3 ở chế độ consume-only trên shared runtime contracts.
- Team 3 không fork locale/auth/billing wording.
- Team 3 chỉ patch route/locale/metadata alignment khi review note yêu cầu delta.

## Verification
- `NOOS_STACK_TEST=1 pnpm test:noos-stack` -> PASS
- `pnpm test:noos-web` -> PASS
- `pnpm test:noos-commerce-contracts` -> PASS

## Status
- UI hooks confirmation note đã được nộp cho Team 2 runtime lane confirmation.
