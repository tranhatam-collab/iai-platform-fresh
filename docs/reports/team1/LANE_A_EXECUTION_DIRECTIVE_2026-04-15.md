# LANE_A_EXECUTION_DIRECTIVE_2026-04-15
## Team 1 Program Root Directive
## Status: ACTIVE
## Effective: 2026-04-15

---

## 1. Objective

Chuyển Lane A từ "P0 file lock" sang "evidence closeout" để Team 1 có thể review gate theo domain mà không mơ hồ về rollback/test packet.

---

## 2. Team assignments (next 48h)

### Team 1 (Program Root)
- Duy trì control-tower checkpoints và cập nhật `IAI_TEAM1_LIVE_TRACKING_BOARD_2026.md`.
- Giữ partial open-gate mode, chỉ cho domain có test + release packet đầy đủ.
- Đóng dependency lane theo thứ tự critical path, không review ngẫu nhiên.

### Team 2 (Runtime/Core)
- Tiếp tục giữ xanh `pnpm test`.
- Tiếp nhận và xác nhận UI hooks closure từ Team 3 bằng evidence note rõ ràng.
- Giữ locale/auth/billing contract lock cho Team 5 handoff lane.

### Team 3 (NOOS Surface)
- Nộp explicit UI hooks confirmation note cho Team 2 runtime contract lane.
- Giữ NOOS route boundary đã khóa, không tái đưa investor/fundraising roles.
- Tiếp tục route-level bilingual QA evidence cho Team 4 launch lane.

### Team 4 (Growth/Revenue/Ops)
- Cập nhật wave readiness board từ PREP theo proof Team 3 đã nộp.
- Giữ wave expansion discipline (không mở wave mới nếu board chưa xanh).
- Đồng bộ bilingual growth copy theo locale lock và route readiness thật.

### Team 5 (`web.iai.one`)
- Nộp preview release packet cho `web.iai.one`.
- Nộp bilingual route QA packet (`en/vi`, canonical/hreflang/x-default).
- Giữ onboarding lane theo shared auth/billing/API contracts, không fork contract language.

---

## 3. Hard gates

Không reopen gate domain nếu thiếu bất kỳ mục nào sau:
- release packet theo template chung,
- test evidence xanh của lane liên quan,
- rollback note rõ owner và blast radius,
- mission-map + locale/SEO compliance.

---

## 4. Reporting protocol

Mỗi team phải gửi:
- daily report trước 17:00 ICT,
- blocker escalation trong 30 phút sau khi phát hiện,
- lane evidence path rõ ràng trong `docs/`.

---

## 5. Current lane status

- Lane snapshot: PASS (`pnpm report:lane`)
- Runtime gate: PASS (`pnpm test`)
- NOOS route + stack evidence: PASS (`pnpm test:noos-web`, `NOOS_STACK_TEST=1 pnpm test:noos-stack`)
- Lane A coordinated execution: IN PROGRESS
- Next checkpoint: 2026-04-16 09:00 ICT
