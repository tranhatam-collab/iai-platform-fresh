# TEAM1_PAY_FINAL_ACTIVE_OWNER_STATUS_2026-05-01
- Owner lane: Team 1 verdict authority
- Date: 2026-05-01
- Status: `SINGLE_ACTIVE_BLOCKER_LOCKED`

## Team identity lock
- `Team 2` = `Team 2 Runtime and Platform Core`
- Vai trò hiện tại của Team 2 trong lane `pay`:
  - chạy probe canonical
  - chạy rerun bundle chính thức
  - nộp artifact máy đọc cho Team 1
- Team 2 **không còn là đội sửa blocker active** ở thời điểm này.

## Closed lanes
- Runtime deploy: `DONE`
- Runtime `/health` shared contract: `DONE`
- D1 schema/ledger/reconciliation readiness: `DONE`
- Canonical auth for current gate key: `DONE`

## Single active blocker owner
- `Team Pay / payOS merchant owner`

## Why Team Pay is the only active blocker now
- Canonical one-shot probe has already passed runtime health and auth.
- The request reached provider/business execution and failed with payOS `214`.
- Current founder context strongly suggests the merchant may still be personal-only and not yet have the business gateway/channel active for the organization.

## What Team Pay must close
1. Xác nhận merchant đúng với `PAYOS_CLIENT_ID` production.
2. Xác nhận merchant có cổng doanh nghiệp/tổ chức đang active, không chỉ là tài khoản cá nhân.
3. Xác nhận channel/rail đang bật.
4. Xác nhận package/quota còn hiệu lực.
5. Nếu vẫn fail, mở ticket payOS support với packet chẩn đoán đã khóa.

## What Team 2 does after Team Pay clears
Chỉ sau khi Team Pay xác nhận provider truth đã sửa và one-shot canonical trả:
- `checkout_status = 201`
- `checkout_url` non-null
- `payment_link_id` non-null
- không còn `214`

thì Team 2 mới chạy:

```bash
cd "/Users/tranhatam/Documents/Devnewproject/iai-platform-fresh"
node scripts/team2-pay-prod-runtime-probe.mjs --date=2026-05-01
node scripts/team2-pay-shared-runtime-probe.mjs --date=2026-05-01
pnpm report:pay-prod-gate -- --date=2026-05-01
node scripts/team1-pay-full-rerun-review-check.mjs --date=2026-05-01
```

## Team 1 rule
- Team 1 keeps `LOCK_RETAINED_WITH_REASON` until the rerun bundle above replaces the current snapshot with green machine artifacts.
