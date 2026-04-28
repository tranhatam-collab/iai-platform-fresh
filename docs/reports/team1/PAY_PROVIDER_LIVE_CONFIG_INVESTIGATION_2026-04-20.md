# PAY PROVIDER LIVE CONFIG INVESTIGATION 2026-04-20
## Điều tra trực tiếp lớp blocker production của `pay.iai.one`

---

## 1. Mục tiêu

File này khóa phần điều tra trực tiếp mà Team Admin đã thực hiện trên production D1 và evidence runtime.

Mục tiêu:
- xác nhận blocker còn lại nằm ở đâu
- tách phần đã qua khỏi phần còn fail
- chỉ rõ việc nào còn có thể xử lý trong repo
- chỉ rõ việc nào bắt buộc owner provider hoặc hạ tầng live phải xử lý

---

## 2. Những gì đã kiểm tra trực tiếp

### 2.1 `provider_accounts` trên production D1

Schema production thật:
- `tenant_id`
- `provider_code`
- `account_label`
- `merchant_reference`
- `public_config_json`
- `secret_binding_prefix`
- `live_mode`
- `status`

Hai bản ghi live hiện có cho tenant `vetuonglai`:

| id | account_label | merchant_reference | secret_binding_prefix | live_mode | status |
|---|---|---|---|---:|---|
| `pa_vetuonglai_member_payos` | `vetuonglai-member` | `member.vetuonglai.com` | `PAYOS` | `1` | `active` |
| `pa_vetuonglai_payos_live` | `vetuonglai-member-live` | `member.vetuonglai.com` | `null` | `1` | `active` |

Điểm cần chú ý:
- cùng một tenant
- cùng provider `payos`
- cùng `merchant_reference`
- cùng `site_code` trong `public_config_json`
- nhưng một bản ghi thiếu `secret_binding_prefix`

### 2.2 `merchant_sites`

Bản ghi site đang được dùng là hợp lệ:

| site_code | tenant_id | domain | active |
|---|---|---|---:|
| `vetuonglai-member` | `ten_4332343d7594a73a` | `member.vetuonglai.com` | `1` |

### 2.3 `service_api_keys`

API key gate hiện tại đang được dùng thật:

| key_label | site_id | revoked_at | last_used_at |
|---|---|---|---|
| `vetuonglai-member-api-20260419-gate-v1` | `site_267a525681129876` | `null` | `2026-04-20T05:13:25.361Z` |

Điểm đã khóa:
- request đi qua lớp auth thật
- site mapping và tenant mapping đang hoạt động

### 2.4 `payment_intents`

Intent mới nhất được tạo thật:

| id | tenant_id | site_id | internal_order_id | amount | provider_code | payment_status | success_url | cancel_url | callback_url |
|---|---|---|---|---:|---|---|---|---|---|
| `pi_8e281700870149bf9e89836b38914b6e` | `ten_4332343d7594a73a` | `site_267a525681129876` | `ord_team2_probe_20260420_mo6qonu8` | `3000` | `payos` | `created` | `https://web.iai.one/checkout-success` | `https://web.iai.one/checkout-cancel` | `null` |

Điểm đã khóa:
- runtime tạo intent thành công
- `tenant_id` và `site_id` đúng
- route không fail ở auth hay lookup site

Điểm cần chú ý:
- `callback_url` trong intent đang là `null`

### 2.5 `payment_attempts`

Attempt mới nhất ghi nhận:

| id | payment_intent_id | provider_code | provider_order_id | provider_payment_url | provider_raw_status | initiated_at |
|---|---|---|---|---|---|---|
| `att_9592a02ff66c44ae9f6b41bacd661391` | `pi_8e281700870149bf9e89836b38914b6e` | `payos` | `7009914414284` | `null` | `214` | `2026-04-20T05:13:28.356Z` |

`response_json` đã lưu:
- `ok = true`
- `provider = "payos"`
- `code = "214"`
- `desc = "Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác"`
- `normalized.payment_link_id = null`
- `normalized.checkout_url = null`

Điểm đã khóa:
- runtime đã gọi thật sang provider
- provider đã trả về response thật
- lỗi hiện không còn nằm ở lớp auth nội bộ hay lookup site

---

## 3. Kết luận kỹ thuật đã khóa

### 3.1 Những gì không còn là nghi vấn

- Request production đi qua auth thật.
- API key hiện tại dùng đúng và có `last_used_at` mới.
- Tenant và site mapping đang hoạt động.
- Runtime đã tạo `payment_intent` thật trên D1.
- Runtime đã gọi thật sang `payos`.
- Provider là nơi trả về mã `214`.

### 3.2 Blocker gốc còn lại nằm ở đâu

Blocker còn lại nằm ở lớp provider live:
- merchant
- channel
- secret binding runtime
- hoặc logic chọn `provider_account` live

Không còn đủ bằng chứng để tiếp tục quy lỗi sang Team 2 code lane.

### 3.3 Finding quan trọng nhất

Tenant `vetuonglai` hiện có **2 bản ghi `provider_accounts` live cùng lúc** cho `payos`, cùng `merchant_reference`, cùng `site_code`, nhưng:
- một bản ghi có `secret_binding_prefix = PAYOS`
- một bản ghi có `secret_binding_prefix = null`

Đây là một finding thật.

Nó chưa đủ để khẳng định chắc chắn là nguyên nhân duy nhất của lỗi `214`, nhưng nó là dấu hiệu mạnh cho một trong hai khả năng:
- runtime đang chọn nhầm bản ghi live
- dữ liệu live bị đúp và không còn một canonical provider account rõ ràng

### 3.4 Finding phụ

`payment_intents.callback_url` hiện đang được lưu là `null` dù probe Team 2 có gửi `callback_url`.

Điều này chưa chứng minh là nguyên nhân của mã `214`, nhưng cần được owner runtime xác nhận rõ:
- là hành vi chủ đích
hoặc
- là dữ liệu bị rơi khi persist

---

## 4. Những gì tôi chưa làm trực tiếp

Tôi **chưa sửa production D1** và **chưa deactive bản ghi nào**.

Lý do:
- chưa có code runtime trong repo để chứng minh chính xác thuật toán chọn `provider_account`
- chưa đủ bằng chứng để sửa mù trên production data
- lỗi `214` có thể vẫn nằm ở merchant hoặc channel phía `payOS`, kể cả khi dữ liệu D1 nhìn có vẻ đúng

Quyết định này là cố ý để tránh sửa sai production.

---

## 5. Việc còn lại phải giao đúng owner

### Owner provider hoặc hạ tầng thanh toán

Phải xác nhận ngay:
- merchant live của `member.vetuonglai.com` có đang hoạt động thật không
- payment link hoặc checkout channel của merchant đó có bị tạm dừng không
- runtime production có thật sự bind đủ:
  - `PAYOS_CLIENT_ID`
  - `PAYOS_API_KEY`
  - `PAYOS_CHECKSUM_KEY`
- bản ghi `provider_accounts` nào mới là canonical

Phải xử lý một trong hai hướng:
- sửa merchant hoặc channel ở `payOS`
hoặc
- dọn dữ liệu live `provider_accounts` để chỉ còn một canonical account hợp lệ

### Team 2

Chỉ rerun sau khi owner provider xác nhận đã sửa:
- probe production
- `report:pay-prod-gate`
- evidence packet

### Team 1

Chỉ flip gate khi đồng thời đủ:
- `checkout_url_non_null = PASS`
- `payment_link_id_non_null = PASS`
- `no_214 = PASS`
- `production_gate_green = PASS`

---

## 6. Kết luận điều hành cuối

Phần còn lại tôi có thể xử lý trực tiếp trong repo đến đây đã làm xong:
- kiểm tra production D1
- chốt điểm fail thật
- tách rõ phần auth/site/runtime đã qua
- tìm ra finding dữ liệu live bị đúp ở `provider_accounts`

Phần còn lại không thể đóng dứt điểm chỉ bằng sửa repo:
- cần owner provider hoặc owner hạ tầng live xác nhận và sửa ở lớp live thật

Cho đến lúc đó:
- `pay.iai.one` vẫn `prep-only`
- `release-claim` vẫn `LOCK_RETAINED`
- chưa được synchronized live

---

## 7. Trạng thái gửi packet điều tra cho owner provider

- Trạng thái: `DISPATCHED_WAITING_OWNER_ACK`
- Packet đã gửi: `docs/reports/team1/TEAM1_PROVIDER_LIVE_OWNER_INVESTIGATION_PACKET_2026-04-20.md`

Ba xác nhận bắt buộc trong packet đã gửi:
1. Merchant hoặc channel payOS của `member.vetuonglai.com` có bị dừng không.
2. Runtime production có bind đủ `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` không.
3. Bản ghi `provider_accounts` canonical là bản ghi nào, và bản ghi còn lại có cần vô hiệu hóa không.
