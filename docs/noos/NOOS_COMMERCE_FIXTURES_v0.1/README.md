# NOOS Commerce Fixtures v0.1

Fixture pack cho Team 2 test:
- Stripe webhook fulfillment
- entitlement state transitions
- buyer library state rendering
- catalog/product detail mocking cho Team 3

Phan loai:
- `webhooks/`: input events cho fulfillment handler
- `entitlements/`: canonical entitlement states
- `library/`: buyer library views theo state
- `catalog/`: locked product definitions for mock product surfaces
- `manifest.json`: danh sach fixture va muc dich

State coverage:
- webhook completed
- webhook duplicate / idempotency replay
- entitlement `active`
- entitlement `expired_updates_only`
- entitlement `upgraded`
- library `current`
- library `update_available`
- library `window_expired`
- library `upgraded`

Sync rule:
- neu doi entitlement fixture, library fixture, hoac schema fixture -> cap nhat dong thoi `manifest.json`
- neu doi state/value co y nghia nghiep vu -> cap nhat dong thoi docs/noos lien quan, toi thieu file `26_NOOS_BUYER_LIBRARY_ENTITLEMENTS_AND_DELIVERY_SYSTEM_2026.md`
- `pnpm test:noos-commerce-contracts` phai pass sau moi thay doi, neu khong xem la drift
