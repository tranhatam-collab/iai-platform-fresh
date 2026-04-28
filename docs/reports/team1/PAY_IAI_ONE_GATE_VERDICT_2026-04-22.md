# PAY_IAI_ONE_GATE_VERDICT_2026-04-22
- Team: Team 1 Program Root / Gate Authority
- Domain: `pay.iai.one`
- Date: 2026-04-22
- Verdict: `LOCK_RETAINED_WITH_REASON`

## 1) Quyết định

Team 1 **không flip gate** tại checkpoint này.

## 2) Lý do

Tín hiệu production gate mới nhất vẫn chưa đạt:
- `auth_key_present`: `FAIL`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- `shared_read_model_ready_for_shared_only`: `FAIL`
- `shared_upstream_active_read_mode_shared_contract`: `FAIL`
- `shared_upstream_release_gate_ready`: `FAIL`

Probe runtime mới nhất ngày `2026-04-22` đã hiện diện, nhưng đang trả `401` với mã `API_KEY_REQUIRED`, nên chưa đủ điều kiện đánh giá production checkout thật theo chuẩn gate.
Shared-runtime probe ngày `2026-04-22` cũng xác nhận production health contract hiện còn ở dạng `legacy_or_unknown`, chưa expose các trường shared gate mà automation đang yêu cầu.

Tham chiếu:
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md`

## 3) Điều kiện để đổi verdict sang `LOCK_FLIPPED`

Chỉ đổi verdict khi:
1. Owner provider xác nhận và nộp đủ evidence live theo follow-up Team 1.
2. Team 2 nộp runtime probe mới cho checkpoint hiện hành.
3. Team 2 rerun probe/gate/test với kết quả mới.
4. Toàn bộ tín hiệu machine-check trong `TEAM1_PAY_PROD_GATE_STATUS_2026-04-22` cùng chuyển `PASS`.

## 4) Hành động liên team sau verdict này

- Team 2: giữ `pay` prep-only, chờ owner ack rồi mới rerun.
- Team 5: chưa được rerun synchronized live claim.
- Team 3/Team 4: giữ monitor/review-only, không mở scope mới.
