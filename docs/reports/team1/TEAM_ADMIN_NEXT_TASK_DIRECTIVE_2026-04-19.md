# TEAM_ADMIN_NEXT_TASK_DIRECTIVE_2026-04-19
- Team: Team Admin / Team 1 Program Root
- Date: 2026-04-19
- Timezone: Asia/Ho_Chi_Minh
- Scope: `*.iai.one`
- Status: ACTIVE

## 1) Lệnh vận hành bắt buộc cho tất cả team

Từ checkpoint này, mọi team phải đi theo thứ tự bắt buộc:
1. Hoàn thành task trong lane đã giao.
2. Tự kiểm tra xong mới được commit.
3. Commit đúng scope lane.
4. Chạy test bắt buộc theo lane.
5. Nộp báo cáo theo mẫu `DONE / IN PROGRESS / BLOCK / NEXT` + bằng chứng test.

Hard rules:
- Không được mở scope mới ngoài lane đã khóa.
- Không được claim `GO` hoặc `done` khi chưa có test proof.
- Không được bỏ qua rollback note với lane có ảnh hưởng release/gate.

Deadline checkpoint chung:
- 2026-04-20 17:00 ICT

## 2) Nhiệm vụ tiếp theo theo từng team

### Team 1 (Program Root / Gate Authority)
Mục tiêu:
- Giữ control-tower ở trạng thái `READY`.
- Chốt checklist packet của các domain đang `NO-GO`.
- Chuẩn bị quyết định kế tiếp cho `pay.iai.one` release-claim gate.

Deliverables bắt buộc:
- cập nhật gate checklist:
  - `docs/reports/team1/TEAM1_REMAINING_GATE_PACKET_CHECKLIST_2026-04-18.md`
- cập nhật control session:
  - `docs/reports/team1/CONTROL_TOWER_SESSION_2026-04-19.md`

Test/verify bắt buộc:
- `pnpm report:lane`
- `pnpm report:nft-phasec`
- `pnpm report:control-tower`

### Team 2 (Runtime & Platform Core)
Mục tiêu:
- Giữ `dash` xanh và `pay` ở prep-only cho đến khi Team 1 flip gate.
- Không thay đổi contract shape gây drift downstream.

Deliverables bắt buộc:
- nộp delta nhỏ nếu Team 1 có review note cho `pay`.
- cập nhật daily + execution report cùng ngày.

Test/verify bắt buộc:
- `pnpm test:pay`
- `pnpm test:dash`

### Team 3 (NOOS Surface)
Mục tiêu:
- Duy trì `MONITOR_ONLY_ACCEPTED`, không mở feature mới.
- Giữ route/locale/metadata truth ổn định.

Deliverables bắt buộc:
- daily report lane monitor-only + note phụ thuộc Team 2 continuity.

Test/verify bắt buộc:
- `pnpm test:noos-web`
- `pnpm test:noos-commerce-contracts`

### Team 4 (Growth/Ops)
Mục tiêu:
- Giữ packet ops ở trạng thái review-ready.
- Duy trì `/operations` + trace-map không drift wording.

Deliverables bắt buộc:
- daily + report đầy đủ cho checkpoint ngày.
- không mở claim mới ngoài support/recovery/trace mapping.

Test/verify bắt buộc:
- `pnpm report:lane` (để Team 1 xác nhận governance loop)

### Team 5 (web.iai.one)
Mục tiêu:
- Giữ monitor-only theo shared contract.
- Giảm lỗi handoff (`auth`, `route`) trong pilot events.

Deliverables bắt buộc:
- KPI snapshot ngày + note cải thiện lỗi handoff.
- chỉ nộp delta khi có reviewer note Team 1.

Test/verify bắt buộc:
- `pnpm test:web`
- `pnpm test:noos-commerce-contracts`
- `pnpm review:team5-language`
- `pnpm report:team5-web-kpi`

## 3) Domain NO-GO packet closure (bắt buộc trước reopen)

Các domain còn `NO-GO` phải nộp packet đủ evidence (không chấp nhận stub):
- `developer.iai.one`
- `cios.iai.one`
- `cdn.iai.one`
- `flows.iai.one`

Theo template:
- `docs/DOMAIN_RELEASE_EVIDENCE_PACKET_TEMPLATE.md`

## 4) Mẫu báo cáo nộp lại cho Team Admin

Mỗi team nộp đúng định dạng:
- DONE:
- IN PROGRESS:
- BLOCK:
- NEXT:
- TEST PROOF:
- COMMIT HASH:

## 5) Điều kiện đóng checkpoint

Checkpoint chỉ đóng khi:
- Daily đủ Team 1..Team 5.
- Test proof hợp lệ theo lane.
- Packet evidence của domain NO-GO không còn trạng thái thiếu mục bắt buộc.
- Team 1 xác nhận `GO/NO-GO` sau khi rerun control loop.
