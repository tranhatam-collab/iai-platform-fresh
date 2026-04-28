# REPORT_TEAM5_2026-04-19

DONE:
- Đã consume shared runtime contracts đúng chuẩn Team 5:
  - không fork locale/auth/billing wording,
  - giữ shared contract làm nguồn truth duy nhất trong `apps/web`.
- Đã giảm lỗi handoff pilot ở auth/route bằng hardening parser alias trong `apps/web/src/server.ts`.
- Đã thêm regression test cho contract wording fallback:
  - khi upstream gửi invalid wording keys, `web` bắt buộc fallback về canonical shared keys (không fork wording runtime).
- Đã vá ổn định cho contract drift guard:
  - `scripts/noos-commerce-contract-check.mjs` thêm guard + retry parser YAML để giảm lỗi fail ngẫu nhiên khi verify OpenAPI/fixture entitlement.
- Đã đồng bộ test và smoke evidence:
  - `pnpm test:web` PASS,
  - `pnpm test:noos-commerce-contracts` PASS,
  - `pnpm smoke:team5-web-kpi:pilot:v2` PASS,
  - `pnpm report:team5-web-kpi -- --date=2026-04-19` PASS,
  - `pnpm report:team5-web-kpi-delta -- --date=2026-04-19 --compare-date=2026-04-18` PASS.
- Đã cập nhật snapshot KPI mới:
  - `failedAuthHandoffRatePercent`: `50` (2026-04-18) -> `25` (2026-04-19),
  - `brokenRouteHandoffRatePercent`: `33.33` (2026-04-18) -> `16.67` (2026-04-19).
- Đã bổ sung delta note tự động để nộp reviewer nhanh:
  - `docs/reports/team5/WEB_KPI_DELTA_2026-04-18_TO_2026-04-19.md`.
- Đã bổ sung KPI bundle tự động để nộp gate theo gói:
  - `docs/reports/team5/WEB_KPI_BUNDLE_2026-04-19.md`.
- Đã khóa flow nộp gate Team 5 thành một lệnh vận hành:
  - `pnpm report:team5-gate-flow`.
- Đã thêm checker live-sync readiness đọc trực tiếp control-tower:
  - `pnpm report:team5-live-sync-readiness -- --date=2026-04-19`
  - kết quả hiện tại: `NOT_READY_FOR_SYNCHRONIZED_LIVE`.
- Đã thêm live-sync final packet tự động:
  - `pnpm report:team5-live-sync-packet -- --date=2026-04-19 --compare-date=2026-04-18`
  - output: `TEAM5_LIVE_SYNC_FINAL_PACKET_2026-04-19.{md,json}`.
- Đã gắn delta KPI này vào preview evidence packet và bilingual QA packet để Team 1 review theo một trace thống nhất.

IN PROGRESS:
- Tiếp tục giữ `web.iai.one` ổn định trên shared contract và duy trì cadence proof hằng ngày.
- Tiếp tục theo reviewer path của Team 1, không mở claim mới ngoài phạm vi preview evidence.

BLOCK:
- Không có blocker implementation trong scope Team 5.
- Live-sync đang bị khóa theo gate liên đội:
  - 4 owner sign-off NO-GO đã hoàn tất (`PASS` ở control-tower ngày 2026-04-19).
  - `pay.iai.one` production gate còn FAIL 5 tín hiệu.
  - release-claim state vẫn `LOCK_RETAINED`.

NEXT:
- Thu pilot traffic thật để thay dần fixture batch và tăng độ tin cậy KPI.
- Khi có review note mới từ Team 1, Team 5 sẽ ship delta nhỏ + retest + nộp lại evidence packet.
- Duy trì flow nộp gate Team 5 bằng một lệnh:
  - `pnpm report:team5-gate-flow`, sau đó sync packet evidence theo reviewer path Team 1.
- Duy trì flow nộp cuối synchronized-live:
  - `pnpm report:team5-live-sync-loop`.

TEST PROOF:
- `pnpm report:team5-gate-flow` -> PASS
- `pnpm report:team5-live-sync-readiness -- --date=2026-04-19` -> PASS (`NOT_READY_FOR_SYNCHRONIZED_LIVE`)
- `pnpm report:team5-live-sync-packet -- --date=2026-04-19 --compare-date=2026-04-18` -> PASS
- `pnpm test:web` -> PASS (`3/3`)
- `pnpm test:noos-commerce-contracts` -> PASS
- `pnpm review:team5-language` -> PASS
- `pnpm smoke:team5-web-kpi:pilot:v2` -> PASS (`Coverage: 100%`)
- `pnpm report:team5-web-kpi -- --date=2026-04-19` -> PASS
- `pnpm report:team5-web-kpi-delta -- --date=2026-04-19 --compare-date=2026-04-18` -> PASS
- `pnpm report:team5-web-kpi-bundle -- --date=2026-04-19 --compare-date=2026-04-18` -> PASS

COMMIT HASH:
- HEAD hiện tại: `3a02052`
- Trạng thái Team 5: thay đổi đang ở working tree, chưa cắt commit riêng.

Phụ thuộc cần Team 2:
- Giữ ổn định shared onboarding contract (`/v1/flow/web-onboarding-contract`) và wording key dictionary parity (EN/VI).
- Nếu Team 2 thay đổi OpenAPI/contract, cần thông báo delta nhỏ để Team 5 cập nhật fixture/schema + retest `test:noos-commerce-contracts`.

Release readiness theo gate Team 1:
- Trạng thái Team 5: `READY_FOR_TEAM1_REVIEW` ở mức preview evidence.
- Không flip release claim khi chưa có quyết định reopen chính thức từ Team 1.
