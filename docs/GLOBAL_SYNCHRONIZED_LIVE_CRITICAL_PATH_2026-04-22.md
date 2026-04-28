# GLOBAL_SYNCHRONIZED_LIVE_CRITICAL_PATH_2026-04-22
## Version 1.0
## Status: LOCKED GLOBAL CRITICAL PATH
## Scope: synchronized live for `*.iai.one`
## Date: 2026-04-22

Live working companion:
- `docs/reports/GLOBAL_CRITICAL_PATH.md`

Rule:
- file này giữ lớp giải thích đầy đủ
- `docs/reports/GLOBAL_CRITICAL_PATH.md` là 1-page working view cho điều phối hằng ngày

---

## 0. Core statement

Toàn hệ hiện **chưa được phép synchronized live**.

Không phải vì thiếu tài liệu.
Không phải vì thiếu report.
Không phải vì Team 3, Team 4, Team 5 chưa chuẩn bị.

Nút chặn hiện tại là:
- `pay.iai.one` production gate
- `release-claim = LOCK_RETAINED`
- Team 5 vì thế vẫn `NOT_READY_FOR_SYNCHRONIZED_LIVE`

File này khóa đúng đường đi ngắn nhất và đúng authority nhất để chuyển từ trạng thái hiện tại sang synchronized live thật.

---

## 1. Current synchronized live verdict

- Global verdict: `NOT_READY_FOR_SYNCHRONIZED_LIVE`
- Global release control: `READY`
- Global release-claim: `LOCK_RETAINED`
- Global blocker owner chain:
  1. Team 1 gate authority
  2. owner provider/live của `pay.iai.one`
  3. Team 2 rerun authority
  4. Team 1 flip authority
  5. Team 5 synchronized-live readiness rerun

---

## 2. What is already green

Các điểm dưới đây đã xanh hoặc đã đủ để không còn là blocker chính:

- lane protocol: `PASS`
- daily reports: `PASS`
- cross-team reports: `PASS`
- ownership matrix: `PASS`
- language compliance: `PASS`
- NO-GO packet tracker: `PASS`
- `nft.iai.one` pair gate: `GO`
- `noos.iai.one`: monitor-only stable
- Team 4 packet: `READY_FOR_TEAM1_REVIEW`
- Team 5 KPI/readiness/final packet loop: rerun được và đang xanh ở mức evidence
- Team A reopen review: approved

Kết luận:
- synchronized live không bị chặn ở lớp governance shell
- synchronized live đang bị chặn ở lớp production money/runtime/live truth

---

## 3. Active blockers on the critical path

### Blocker A — Provider/live owner acknowledgment chưa đóng

Team 1 vẫn đang chờ owner provider hoặc owner hạ tầng live trả lời đủ:
- merchant hoặc channel payOS có đang bị dừng không
- runtime production đã bind đủ secret live chưa
- `provider_accounts` canonical là record nào

Cho tới khi bước này đóng:
- Team 2 không nên rerun production probe thêm
- mọi rerun mới có nguy cơ chỉ lặp lại cùng lỗi cũ

### Blocker B — Latest verified runtime proof vẫn fail

Runtime proof gần nhất đang được Team 1 dùng làm canonical evidence vẫn là:
- `TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`

Kết quả vẫn là:
- `HTTP 401`
- `code = API_KEY_REQUIRED`
- `checkout_url = null`
- `payment_link_id = null`

Điều này giữ 4 tín hiệu classic ở trạng thái fail:
- `auth_key_present`
- `checkout_url_non_null`
- `payment_link_id_non_null`
- `no_214`
- `production_gate_green`

### Blocker C — Automated pay gate ngày 2026-04-22 còn fail sâu hơn

Automation gate ngày `2026-04-22` còn fail thêm ở:
- `shared_read_model_ready_for_shared_only`
- `shared_upstream_active_read_mode_shared_contract`
- `shared_upstream_release_gate_ready`

`team2_runtime_probe_present` hiện đã pass, nhưng production probe mới nhất vẫn chưa hợp lệ cho live checkout vì thiếu key/header canonical.

Nghĩa là ngay cả nếu nhìn theo lớp manual truth mới, synchronized live vẫn chưa đủ.
Nhìn theo automation gate mới, toàn hệ còn thiếu thêm proof của shared runtime/shared upstream, và production health contract của `pay.iai.one` hiện vẫn đang ở dạng legacy.

### Blocker D — Team 1 verdict vẫn là LOCK_RETAINED_WITH_REASON

Team 1 đã phát hành verdict rõ ràng:
- `PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
- `PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md`
- `TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`

Canonical meaning:
- chưa flip gate
- chưa mở `release-claim`
- chưa cho synchronized live claim

### Blocker E — Team 5 đúng quy tắc nên vẫn chưa live

Team 5 hiện không có blocker code-level mới.
Nhưng Team 5 vẫn đúng khi giữ verdict:
- `NOT_READY_FOR_SYNCHRONIZED_LIVE`

Vì hai điều kiện gate của Team 5 vẫn fail:
- `payProductionGateDone = FAIL`
- `releaseClaimUnlocked = FAIL`

---

## 4. Exact critical path to green

Đây là đường đi ngắn nhất, đúng authority nhất, và không mở scope thừa:

### Step 1 — Team 1 đóng owner follow-up

Artifact:
- `docs/reports/team1/TEAM1_OWNER_PROVIDER_FOLLOWUP_2026-04-22.md`

Output bắt buộc:
- owner ack đủ 3 xác nhận live
hoặc
- owner note chỉ rõ phần live nào còn sai

Không có output này:
- không qua Step 2

### Step 2 — Team 2 tạo probe artifact ngày mới

Team 2 phải nộp đủ:
- `TEAM2_PAY_PROD_RUNTIME_PROBE_<ngày mới>.md`
- `TEAM2_PAY_PROD_RUNTIME_PROBE_<ngày mới>.json`
- `TEAM2_PAY_SHARED_RUNTIME_PROBE_<ngày mới>.md`
- `TEAM2_PAY_SHARED_RUNTIME_PROBE_<ngày mới>.json`

Playbook vận hành bắt buộc:
- `docs/reports/team1/TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22.md`

Mục tiêu tối thiểu:
- không còn thiếu `team2_runtime_probe_present`
- probe checkout không còn `401 API_KEY_REQUIRED`
- probe shared-runtime cho thấy production health contract không còn là `legacy_or_unknown`

### Step 3 — Team 2 rerun gate bundle đầy đủ

Team 2 phải rerun cùng bundle:
- production probe
- `pnpm report:pay-prod-gate -- --date=<ngày mới>`
- `pnpm test:pay`
- `pnpm test:dash`

Mục tiêu:
- 4 tín hiệu classic chuyển `PASS`
- nếu đang dùng automation gate mới, các tín hiệu shared-runtime cũng phải có source hợp lệ

### Step 4 — Team 1 kiểm tra lại manual truth và automation truth

Team 1 phải trả lời đồng thời 2 câu hỏi:

1. Manual gate truth đã đủ để bỏ `LOCK_RETAINED` chưa.
2. Automation gate mới còn thiếu signal nào không.

Chỉ khi cả hai lớp đều đủ hoặc Team 1 ban hành override có giải trình rõ:
- Team 1 mới được flip sang `LOCK_FLIPPED`

### Step 5 — Team 5 rerun readiness và final live-sync packet

Sau khi Team 1 flip thật:
- Team 5 rerun readiness
- Team 5 rerun final packet
- Team 5 phát verdict synchronized live mới

### Step 6 — Team 1 phát synchronized live authority verdict

Chỉ ở bước này, Team 1 mới được nói:
- synchronized live approved
hoặc
- synchronized live still blocked with reason

---

## 5. Non-critical but nearby work

Các việc này quan trọng, nhưng **không phải** critical path trực tiếp của synchronized live hôm nay:

- Team A `developer.iai.one` reopen review
- Team B `cdn.iai.one` owner evidence
- Team B `flows.iai.one` route/runtime proof refresh
- Team C `cios.iai.one` close 3 open issues
- Team 3 monitor-only NOOS continuity
- Team 4 review-ready support/recovery packet maintenance

Rule:
- không được để các lane này chen lên trước chuỗi Step 1 -> Step 6 ở trên

---

## 6. Do-not list

- Không rerun probe vô hạn khi chưa có owner ack mới.
- Không dùng packet `review-ready` để gọi là synchronized live ready.
- Không cho Team 5 claim live sớm vì “mọi thứ khác đã xong”.
- Không dùng governance PASS để che runtime FAIL.
- Không flip `release-claim` trước khi pay gate và shared-runtime truth đủ xanh.

---

## 7. Minimum green conditions

Synchronized live chỉ được gọi là `GREEN` khi đồng thời:

1. Team 1 owner follow-up đã đóng.
2. Team 2 có probe artifact ngày mới.
3. `checkout_url_non_null = PASS`
4. `payment_link_id_non_null = PASS`
5. `no_214 = PASS`
6. `production_gate_green = PASS`
7. Shared-runtime/shared-upstream signals không còn thiếu hoặc fail ở gate mode đang dùng.
8. Team 1 bỏ `LOCK_RETAINED`.
9. Team 5 rerun readiness/final packet và trả về trạng thái sẵn sàng live.

Thiếu 1 trong 9 điều kiện trên:
- synchronized live vẫn là `NOT_READY`

---

## 8. Canonical references

- `docs/CANONICAL_EXECUTION_LEDGER_AND_RELEASE_STATE.md`
- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
- `docs/reports/team1/PAY_IAI_ONE_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_2026-04-22.md`
- `docs/reports/team1/TEAM1_OWNER_PROVIDER_FOLLOWUP_2026-04-22.md`
- `docs/reports/team1/TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md`
- `docs/reports/team2/TEAM2_EXECUTION_REPORT_2026-04-22.md`
- `docs/reports/team5/TEAM5_LIVE_SYNC_READINESS_2026-04-22.md`
- `docs/reports/team5/REPORT_TEAM5_2026-04-22.md`

---

## 9. Final direction

Synchronized live của toàn hệ `iai.one` không còn là bài toán “thiếu team làm”.

Nó là bài toán đóng đúng một chuỗi authority:
- owner live
- Team 2 rerun
- Team 1 flip gate
- Team 5 rerun readiness
- Team 1 phát verdict cuối

Chỉ cần chuỗi này chưa hoàn tất, toàn hệ vẫn phải được gọi đúng tên:

`NOT_READY_FOR_SYNCHRONIZED_LIVE`
