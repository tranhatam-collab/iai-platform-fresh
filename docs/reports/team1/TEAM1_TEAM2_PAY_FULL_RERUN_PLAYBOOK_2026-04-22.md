# TEAM1_TEAM2_PAY_FULL_RERUN_PLAYBOOK_2026-04-22
- Team phát hành: Team 1 Program Root / Gate Authority
- Team thực thi chính: Team 2 Runtime and Platform Core
- Domain: `pay.iai.one`
- Ngày khóa: `2026-04-22`
- Mục tiêu: khóa đầy đủ env checklist, exact command order, artifact set, và release unblock criteria cho ca rerun production gate
- Trạng thái hiện tại: `ACTIVE_PLAYBOOK_LOCKED`

## 1) Core statement

Playbook này tồn tại để Team 2 và Team 1 không phải suy diễn lại ca rerun mỗi lần.

Nếu đang xử lý production gate của `pay.iai.one`, thứ tự đúng là:
1. khóa precheck
2. chạy đúng bundle
3. đọc đúng artifact
4. so với đúng unblock criteria
5. chỉ khi đủ điều kiện thì Team 1 mới xem xét flip gate

Không dùng playbook này để bypass Team 1 authority.
Không dùng playbook này để hợp thức hóa rerun mù.

## 2) Canonical truth đang có tại checkpoint `2026-04-22`

### Gate verdict hiện hành

- Team 1 verdict: `LOCK_RETAINED_WITH_REASON`
- Nguồn: `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`

### Rerun bundle trạng thái mới nhất

- Bundle status: `BLOCKED_PRECHECK`
- Nguồn: `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md`

### Blocker runtime mới nhất

- checkout probe đang trả:
  - `HTTP 401`
  - `code = API_KEY_REQUIRED`
  - `checkout_url = null`
  - `payment_link_id = null`
- Nguồn: `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`

### Blocker shared-runtime mới nhất

- production `/health` vẫn ở dạng `legacy_or_unknown`
- chưa expose:
  - `shared_read_model`
  - `shared_upstream_runtime`
- Nguồn: `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md`

Kết luận vận hành:
- chưa đủ điều kiện rerun full bundle có ý nghĩa authority
- chưa đủ điều kiện để Team 1 bỏ `LOCK_RETAINED`

## 3) Authority chain bắt buộc

### Team 2 được phép làm

- chuẩn bị env canonical
- chạy preflight
- chạy full rerun bundle
- nộp artifact và summary mới

### Team 2 không được làm

- tự claim `gate green`
- tự suy diễn `LOCK_FLIPPED`
- mở synchronized live

### Team 1 được phép làm

- xác nhận rerun window
- đối chiếu manual truth với automation truth
- phát verdict mới
- mở Team 5 chỉ khi gate thực sự đủ điều kiện

## 4) Pre-run conditions trước khi tốn một cửa sổ rerun

Chỉ nên mở full rerun khi cả 3 nhóm điều kiện dưới đây đã rõ:

### A. Owner/provider follow-up đã có trạng thái dùng được

Tối thiểu phải biết:
- key/header canonical nào sẽ dùng
- tenant/site nào là canonical cho ca rerun
- merchant hoặc channel live nào đang là record thật

### B. Team 2 có đủ env canonical

Thiếu env canonical thì full rerun chỉ lặp lại `401 API_KEY_REQUIRED`.

### C. Nếu vừa có deploy shared-runtime mới thì production `/health` phải là candidate thực sự

Nếu chưa có deploy mới hoặc `/health` vẫn legacy, Team 2 có thể chạy để lấy fail artifact mới, nhưng không được escalte như thể gate sắp xanh.

## 5) Env checklist khóa cứng

### 5.1 Env bắt buộc để qua preflight

Phải có đủ:

1. `TEAM2_PAY_GATE_API_KEY`
hoặc
1. `TEAM2_PAY_GATE_SITE_KEY`

2. `TEAM2_PAY_GATE_TENANT_CODE`

3. `TEAM2_PAY_GATE_SITE_CODE`

Rule:
- ưu tiên `TEAM2_PAY_GATE_API_KEY`
- chỉ dùng `TEAM2_PAY_GATE_SITE_KEY` khi đang rerun contract legacy-compatible có xác nhận rõ từ owner

### 5.2 Env khuyến nghị nên khóa rõ trong cùng ca rerun

- `TEAM2_PAY_GATE_BASE_URL`
- `TEAM2_PAY_GATE_ENDPOINT`
- `TEAM2_PAY_SHARED_BASE_URL`
- `TEAM2_PAY_SHARED_HEALTH_ENDPOINT`

Khuyến nghị current checkpoint:
- `TEAM2_PAY_GATE_BASE_URL=https://pay.iai.one`
- `TEAM2_PAY_GATE_ENDPOINT=/internal/checkout-session`
- `TEAM2_PAY_SHARED_BASE_URL=https://pay.iai.one`
- `TEAM2_PAY_SHARED_HEALTH_ENDPOINT=/health`

### 5.3 Env payload nên khóa nếu site/domain cụ thể cần rerun chính danh

- `TEAM2_PAY_GATE_PROVIDER`
- `TEAM2_PAY_GATE_PLAN_CODE`
- `TEAM2_PAY_GATE_AMOUNT`
- `TEAM2_PAY_GATE_CURRENCY`
- `TEAM2_PAY_GATE_BILLING_CYCLE`
- `TEAM2_PAY_GATE_SUCCESS_URL`
- `TEAM2_PAY_GATE_CANCEL_URL`
- `TEAM2_PAY_GATE_CALLBACK_URL`
- `TEAM2_PAY_GATE_USER_ID`
- `TEAM2_PAY_GATE_EMAIL`
- `TEAM2_PAY_GATE_FULL_NAME`
- `TEAM2_PAY_GATE_LOCALE`
- `TEAM2_PAY_GATE_REF_CODE`
- `TEAM2_PAY_GATE_ORDER_PREFIX`

Nếu không khóa riêng, script sẽ dùng default hiện có trong code.
Điều này chỉ phù hợp cho probe kỹ thuật, không phù hợp cho owner-grade rerun cần truy vết chặt theo site/domain thật.

## 6) Copy-paste env shell pack

Điền giá trị thật trước khi chạy:

```bash
export RERUN_DATE=2026-04-22

export TEAM2_PAY_GATE_API_KEY='REDACTED_OR_REAL_KEY'
# Hoặc nếu có chỉ thị legacy rõ ràng:
# export TEAM2_PAY_GATE_SITE_KEY='REDACTED_OR_REAL_SITE_KEY'

export TEAM2_PAY_GATE_TENANT_CODE='CANONICAL_TENANT_CODE'
export TEAM2_PAY_GATE_SITE_CODE='CANONICAL_SITE_CODE'

export TEAM2_PAY_GATE_BASE_URL='https://pay.iai.one'
export TEAM2_PAY_GATE_ENDPOINT='/internal/checkout-session'
export TEAM2_PAY_SHARED_BASE_URL='https://pay.iai.one'
export TEAM2_PAY_SHARED_HEALTH_ENDPOINT='/health'
```

## 7) Exact command order

### Step 1 — Preflight only

Chạy:

```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date="$RERUN_DATE" --preflight-only
```

Artifact:
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.json`

Chỉ được qua Step 2 khi:
- `Status = PREFLIGHT_READY`
- `auth_key_present = PASS`
- `tenant_code_explicit = PASS`
- `site_code_explicit = PASS`

Nếu kết quả còn `BLOCKED_PRECHECK`:
- dừng
- không chạy full bundle
- mở lại owner/config follow-up

### Step 2 — Full rerun bundle

Chạy:

```bash
node scripts/team2-pay-prod-rerun-bundle.mjs --date="$RERUN_DATE"
```

Bundle này sẽ lần lượt chạy:
1. `node scripts/team2-pay-prod-runtime-probe.mjs --date=<date>`
2. `node scripts/team2-pay-shared-runtime-probe.mjs --date=<date>`
3. `node scripts/team1-pay-prod-gate-check.mjs --date=<date>`
4. `pnpm test:pay`
5. `pnpm test:dash`

### Step 3 — Artifact review bắt buộc sau full bundle

Phải mở và đọc đủ:

1. `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`
2. `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_<date>.md`
3. `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_<date>.md`
4. `docs/reports/team1/TEAM1_PAY_PROD_GATE_STATUS_<date>.md`

### Step 3.5 — Team 1 chạy review checker

Chạy:

```bash
node scripts/team1-pay-full-rerun-review-check.mjs --date="$RERUN_DATE"
```

Artifact sinh ra:
- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_<date>.md`
- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_<date>.json`

Team 1 dùng artifact này để trả lời nhanh:
- có thiếu artifact không
- có còn kẹt precheck không
- gate còn fail ở tín hiệu nào
- đã đủ điều kiện mở flip review hay chưa

### Step 4 — Chỉ khi bundle fail kỹ thuật mới chạy lệnh lẻ

Nếu cần debug sâu, chạy đúng thứ tự:

```bash
node scripts/team2-pay-prod-runtime-probe.mjs --date="$RERUN_DATE"
node scripts/team2-pay-shared-runtime-probe.mjs --date="$RERUN_DATE"
node scripts/team1-pay-prod-gate-check.mjs --date="$RERUN_DATE"
pnpm test:pay
pnpm test:dash
```

Rule:
- không lấy output lệnh lẻ để override bundle status
- bundle vẫn là artifact gom chính của ca rerun

## 8) Bundle status decision matrix

### `BLOCKED_PRECHECK`

Meaning:
- chưa đủ env canonical để bắt đầu rerun hợp lệ

Action:
- dừng full rerun
- cấp env còn thiếu
- không escalte sang Team 1 flip review

### `PREFLIGHT_READY`

Meaning:
- đã qua cửa chuẩn bị
- chưa chạy full rerun

Action:
- chạy ngay full bundle trong cùng cửa sổ nếu owner/provider window đã mở

### `COMMAND_FAILURE`

Meaning:
- một hoặc nhiều command trong full bundle lỗi ở mức thực thi

Action:
- sửa command failure trước
- không yêu cầu Team 1 đánh giá flip

### `RERUN_COMPLETED_GATE_FAIL`

Meaning:
- rerun hoàn tất
- artifact mới đã có
- nhưng gate signals vẫn còn `FAIL`

Action:
- xử lý đúng các unmet signals mới nhất
- không claim production-ready

### `RERUN_GREEN`

Meaning:
- full bundle đã chạy xong
- Team 1 gate snapshot đang xanh

Action:
- chuyển ngay sang Team 1 authority review
- vẫn chưa tự động đồng nghĩa `LOCK_FLIPPED`

## 9) Release unblock criteria cho Team 1

Team 1 chỉ xem xét bỏ `LOCK_RETAINED` khi toàn bộ tín hiệu gate bắt buộc đều `PASS`:

1. `auth_key_present`
2. `checkout_url_non_null`
3. `payment_link_id_non_null`
4. `no_214`
5. `production_gate_green`
6. `shared_read_model_ready_for_shared_only`
7. `shared_upstream_active_read_mode_shared_contract`
8. `shared_upstream_release_gate_ready`

Ngoài 8 tín hiệu trên, Team 1 còn phải thấy:
- runtime probe ngày mới dùng đúng env canonical
- shared-runtime probe ngày mới không còn `legacy_or_unknown`
- artifact ngày mới đồng nhất cùng một `RERUN_DATE`
- `pnpm test:pay` pass
- `pnpm test:dash` pass

## 10) Minimum evidence set để Team 2 nộp lại cho Team 1

Mỗi ca rerun phải nộp đủ:

1. `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.md`
2. `TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_<date>.json`
3. `TEAM2_PAY_PROD_RUNTIME_PROBE_<date>.md`
4. `TEAM2_PAY_PROD_RUNTIME_PROBE_<date>.json`
5. `TEAM2_PAY_SHARED_RUNTIME_PROBE_<date>.md`
6. `TEAM2_PAY_SHARED_RUNTIME_PROBE_<date>.json`
7. `TEAM1_PAY_PROD_GATE_STATUS_<date>.md`
8. `TEAM1_PAY_PROD_GATE_STATUS_<date>.json`

Nếu thiếu 1 trong 8 artifact này:
- Team 1 không đóng được full rerun review

Template nộp chuẩn 6 mục của Team 2:
- `docs/reports/team2/TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md`

## 11) Team 1 review order sau khi Team 2 nộp bundle

Team 1 review theo đúng thứ tự:

1. kiểm `RERUN_DATE` có đồng nhất không
2. chạy `node scripts/team1-pay-full-rerun-review-check.mjs --date="$RERUN_DATE"`
3. kiểm bundle status là gì
4. kiểm checkout runtime probe còn `401`, `214`, hay `null` không
5. kiểm shared runtime còn `legacy_or_unknown` không
6. kiểm gate snapshot còn unmet signal nào không
6. mới quyết định:
   - `LOCK_RETAINED_WITH_REASON`
   - hoặc `LOCK_FLIPPED`

## 12) Do-not list

- Không rerun full bundle khi preflight còn đỏ.
- Không dùng key/header chưa được owner xác nhận làm canonical cho ca rerun authority.
- Không coi `pnpm test:pay` pass là đủ để flip gate.
- Không coi `/health = 200` là đủ nếu contract vẫn legacy.
- Không claim Team 5 rerun window trước khi Team 1 phát verdict mới.

## 13) Next unlock after a successful rerun

Chỉ sau khi Team 1 phát verdict mới theo bundle rerun:
- Team 5 mới được rerun synchronized-live readiness
- Team 5 mới được cập nhật final packet
- Team 1 mới được xem xét mở synchronized live claim

## 14) Canonical references

- `docs/reports/team1/PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md`
- `docs/reports/team1/TEAM1_TEAM2_PAY_RERUN_PRECHECK_DIRECTIVE_2026-04-22.md`
- `docs/reports/team1/TEAM1_PAY_FULL_RERUN_REVIEW_STATUS_<date>.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RERUN_BUNDLE_STATUS_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_SHARED_RUNTIME_PROBE_2026-04-22.md`
- `docs/reports/team2/TEAM2_PAY_FULL_RERUN_SUBMISSION_TEMPLATE_2026-04-22.md`
- `docs/GLOBAL_SYNCHRONIZED_LIVE_CRITICAL_PATH_2026-04-22.md`
- `docs/CANONICAL_EXECUTION_LEDGER_AND_RELEASE_STATE.md`
