# TEAM_ADMIN_WEB_LIVE_DEPLOY_READINESS_2026-04-19
- Team: Team Admin / Team 1 Program Root
- Date: 2026-04-19
- Timezone: Asia/Ho_Chi_Minh
- Scope: `web.iai.one`
- Status: ACTIVE

## 1) Kết luận ngắn

`web.iai.one` hiện đã đủ điều kiện kỹ thuật để giữ trạng thái `READY_FOR_TEAM1_REVIEW` và chờ quyết định mở traffic ở mức web-only.

`web.iai.one` chưa đủ điều kiện để đi vào synchronized live của toàn hệ, vì synchronized live vẫn đang bị khóa bởi blocker liên team:
- `pay.iai.one` production gate còn FAIL
- `release-claim state` vẫn `LOCK_RETAINED`

## 2) Những gì đã xong cho web

- `pnpm test:web`: PASS
- `pnpm test:noos-commerce-contracts`: PASS
- `pnpm report:team5-gate-flow`: PASS
- `pnpm report:team5-live-sync-loop`: PASS
- Team 5 đã có:
  - preview release evidence packet
  - bilingual route QA packet
  - live-sync readiness checker
  - live-sync final packet
- Team 5 hiện không còn blocker nội bộ; blocker còn lại là blocker liên team.

## 3) Còn thiếu để deploy live web

### A. Nếu deploy web-only

Còn thiếu:
- quyết định rõ của Team 1 rằng cho phép mở live web riêng, không chờ synchronized live
- xác nhận reviewer cuối cho packet `web.iai.one`
- giữ rollback owner và pilot traffic plan ở trạng thái sẵn sàng

Hiểu đúng:
- nhánh này không đồng nghĩa với việc mở synchronized live toàn hệ
- nhánh này chỉ là mở traffic/lane cho `web.iai.one` dưới quyền Team 1

### B. Nếu deploy synchronized live

Còn thiếu đủ 2 cụm:
- `pay.iai.one` hết 4 tín hiệu FAIL còn lại của production gate
- `release-claim state` thoát `LOCK_RETAINED`

Ngoài ra còn 1 việc vận hành phải khóa:
- xác định lệnh deploy thật hoặc runbook deploy thật cho `web.iai.one`

## 4) Ước lượng thời gian

### Web-only live

Sớm nhất:
- trong cùng ngày hoặc trong 1 đến 2 giờ sau khi Team 1 phát lệnh mở web-only live

Điều kiện:
- không phát sinh review note mới từ Team 1
- Team 5 không có delta kỹ thuật mới cần retest

### Synchronized live

Sớm nhất:
- chỉ sau khi owner provider / hạ tầng thanh toán sửa xong live config của `pay`, Team 2 rerun gate thành công, và Team 1 rerun gate lần cuối

Ước lượng thực tế:
- từ lúc `pay` gate chuyển xanh thật: còn khoảng 30 đến 60 phút để Team 1 rerun gate, Team 5 rerun live-sync loop, và Team Admin bấm deploy
- thời gian chưa chắc chắn hiện tại nằm ở owner provider / hạ tầng thanh toán xử lý `payOS 214`, secret binding, và dữ liệu live `provider_accounts`

Không nên hứa cứng:
- chừng nào `payOS 214` còn tồn tại, chưa nên cam kết giờ live chính thức

## 5) Nhắc nhỏ cho các team trước khi mở web live

- Team 1: quyết định rõ mở web-only hay tiếp tục chờ synchronized live; không dùng từ ngữ làm các team hiểu nhầm rằng `governance READY` là đã được live đồng bộ.
- Team 2: rerun probe/gate ngay sau khi owner provider xác nhận live config đã sạch; nộp lại evidence packet cho Team 1.
- Team 5: giữ `team5-gate-flow` và `team5-live-sync-loop` luôn xanh; không mở scope mới ngoài web hardening và pilot traffic thật.
- Team Admin / Infra owner: chốt runbook deploy hoặc bổ sung script deploy thật cho `web.iai.one`.

## 6) Trạng thái quyết định hiện tại

- Web-only live: `CHỜ_TEAM1_QUYẾT_ĐỊNH`
- Synchronized live: `CHƯA_ĐƯỢC_PHÉP_MỞ`
