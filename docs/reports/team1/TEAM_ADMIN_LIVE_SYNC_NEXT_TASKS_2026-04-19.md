# TEAM_ADMIN_LIVE_SYNC_NEXT_TASKS_2026-04-19
- Team: Team Admin / Team 1 Program Root
- Date: 2026-04-19
- Timezone: Asia/Ho_Chi_Minh
- Scope: `*.iai.one`
- Status: ACTIVE
- Directive refresh (2026-04-19 14:03 ICT):
  - governance loop giữ `READY`, nhưng synchronized live chưa mở;
  - Team 1 chốt 4 owner sign-off NO-GO và giữ release-claim chưa flip;
  - Team 2 đóng dứt điểm 4 tín hiệu production gate còn thiếu của `pay.iai.one`;
  - Team 3 monitor-only, chỉ patch khi có review note hoặc delta từ Team 2;
  - Team 4 giữ review-ready, không mở claim mới;
  - Team 5 tiếp tục pilot traffic thật, hardening và packet live-sync cuối;
  - chỉ mở synchronized live khi đủ 3 điều kiện: 4 owner sign-off DONE + pay gate hết FAIL + release-claim thoát `LOCK_RETAINED`.

## 1) Mục tiêu của vòng tiếp theo

Mục tiêu của vòng này là đưa 5 team vào trạng thái:
- cùng một nhịp kiểm,
- cùng một mẫu báo cáo,
- cùng một chuẩn ngôn ngữ,
- và sẵn sàng live đồng bộ theo gate Team 1.

Hard rule:
- chưa có owner sign-off và production proof thì không được gọi release-ready cho domain liên quan.
- `controlReady` không đồng nghĩa với `được phép live đồng bộ`; muốn mở synchronized live thì `release-claim state` phải thoát `LOCK_RETAINED`.

## 2) Nhiệm vụ tiếp theo theo từng team

### Team 1
Mục tiêu:
- Giữ kết quả owner sign-off đã hoàn tất cho 4 domain NO-GO.
- Theo dõi tracker `report:nogo-packets` và `report:pay-prod-gate`.
- Không flip `pay.iai.one` release-claim cho đến khi production evidence thật đạt.
- Giữ phân biệt rõ 2 lớp trạng thái trong mọi báo cáo:
  - governance loop
  - live-sync / release-claim readiness

Việc đã hoàn thành:
- đã đóng `PENDING_OWNER_SIGNOFF` cho:
  - `developer.iai.one`
  - `cios.iai.one`
  - `cdn.iai.one`
  - `flows.iai.one`
Việc cần duy trì:
- tiếp tục chạy:
  - `pnpm report:lane -- --date=2026-04-19`
  - `pnpm report:nft-phasec -- --date=2026-04-19`
  - `pnpm report:nogo-packets -- --date=2026-04-19`
  - `pnpm report:pay-prod-gate -- --date=2026-04-19`
  - `pnpm report:control-tower -- --date=2026-04-19`

### Team 2
Mục tiêu:
- Giải blocker production của `pay.iai.one`.
- Giữ `dash.iai.one` xanh và giữ `pay` prep-only cho đến khi Team 1 cho lệnh flip.

Việc cần hoàn thành:
- tạo production attempt mới cho `pay`
- chứng minh:
  - `checkout_url` khác `null`
  - `payment_link_id` khác `null`
  - không còn `214`
- nếu Team 1 trả review note, ship delta nhỏ rồi retest ngay
- giữ nhịp test:
  - `pnpm test:pay`
  - `pnpm test:dash`

### Team 3
Mục tiêu:
- Giữ NOOS monitor-only.
- Không fork runtime contract.

Việc cần hoàn thành:
- giữ route/locale/metadata truth ổn định
- chỉ patch khi có Team 1 review note hoặc delta Team 2 ảnh hưởng `checkout-success/library`
- giữ test proof:
  - `pnpm test:noos-web`
  - `pnpm test:noos-commerce-contracts`

### Team 4
Mục tiêu:
- Giữ ops/recovery/trace mapping review-ready.
- Không mở claim mới.

Việc cần hoàn thành:
- duy trì `/operations` và `trace-map.json` đúng wording đã khóa
- nộp daily/report checkpoint ngày kế tiếp đúng mẫu 6 mục
- giữ test proof:
  - `pnpm test:noos-web`
  - `pnpm report:lane`

### Team 5
Mục tiêu:
- Giữ nguyên trạng thái “xong trong phạm vi Team 5”, không tự mở scope mới.
- Tiếp tục kéo KPI handoff lỗi xuống bằng pilot traffic thật.
- Chờ Team 1 mở cửa sổ synchronized live sau khi blocker liên team được gỡ.

Việc cần hoàn thành:
- tiếp tục ingest pilot traffic thật thay vì fixture dần
- giữ `pnpm report:team5-gate-flow`
- giữ `pnpm report:team5-live-sync-loop`
- tiếp tục chạy:
  - `pnpm test:web`
  - `pnpm test:noos-commerce-contracts`
  - `pnpm review:team5-language`
  - `pnpm report:team5-web-kpi`
  - `pnpm report:team5-web-kpi-delta`
  - `pnpm report:team5-web-kpi-bundle`
- mục tiêu tiếp theo:
  - giảm `failedAuthHandoffRatePercent`
  - giảm `brokenRouteHandoffRatePercent`
  - giữ packet live-sync cuối luôn đồng bộ với gate Team 1

## 3) Lưu ý riêng cho `flow.iai.one` và `dash.iai.one`

### `flow.iai.one`
- Hiện đã có test xanh và gate ở mức `GO` conditional shell checkpoint.
- Việc còn lại là giữ release evidence và không để copy/route drift quay lại.
- Nếu cần live release riêng cho Flow, Team 2 phải bổ sung packet evidence tương ứng trước khi Team 1 signoff.

### `dash.iai.one`
- Đã `ACCEPTED_GO`.
- Việc còn lại là giữ runtime/auth/workspace truth ổn định, không đụng contract shape.
- Mọi thay đổi sau này phải đi qua retest `pnpm test:dash`.

## 4) Mẫu báo cáo bắt buộc

Mỗi team phải nộp:
- `DONE:`
- `IN PROGRESS:`
- `BLOCK:`
- `NEXT:`
- `TEST PROOF:`
- `COMMIT HASH:`

## 5) Điều kiện live đồng bộ

Chỉ coi vòng này là sẵn sàng live đồng bộ khi:
- daily đủ 5/5 team,
- Team 1 control loop vẫn `READY`,
- `release-claim state` không còn `LOCK_RETAINED`,
- `pay.iai.one` production gate hết `214`,
- 4 domain NO-GO có owner sign-off,
- Team 5 giữ hardening không drift,
- Flow/Dash không phát sinh regression mới,
- và lệnh hoặc runbook deploy thật của `web.iai.one` đã được chốt.

## 6) Nhắc nhỏ hoàn chỉnh trước live đồng bộ

- Team 1: giữ 4 packet NO-GO ở trạng thái PASS/`READY_FOR_REOPEN_REVIEW`; không dùng wording nào khiến team hiểu nhầm rằng `governance READY` đồng nghĩa với được live.
- Team 2: đóng dứt điểm 4 tín hiệu FAIL còn lại của `pay.iai.one`; chỉ khi có link thật và hết `214` mới được đề nghị flip gate.
- Team 3: tiếp tục `monitor-only`; chỉ patch khi có delta từ Team 2 hoặc note cụ thể từ Team 1.
- Team 4: tiếp tục `review-ready`; giữ `/operations` và trace-map đúng wording đã khóa, không mở claim mới.
- Team 5: giữ `live-sync-loop` xanh trong phạm vi Team 5, tiếp tục pilot traffic thật, chờ liên team gỡ blocker.
- Team Admin / Infra owner: chốt runbook deploy hoặc bổ sung script deploy thật cho `web.iai.one`.
