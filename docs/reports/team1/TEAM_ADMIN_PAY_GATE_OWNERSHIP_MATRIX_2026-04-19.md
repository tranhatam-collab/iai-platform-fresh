# TEAM ADMIN PAY GATE OWNERSHIP MATRIX
## Đối chiếu phần thiếu của `pay.iai.one` theo team
## Ngày: 2026-04-19

---

## 1. Kết luận ngắn

Team 2 báo cáo đúng về trạng thái kỹ thuật hiện tại.

Nhưng phần thiếu còn lại không còn thuộc riêng Team 2.

Từ thời điểm này, ownership được chốt như sau:
- Team 2 chịu trách nhiệm kiểm chứng lại ngay sau khi cấu hình live được sửa.
- Team 1 chịu trách nhiệm giữ gate, review evidence, và chỉ flip release-claim khi đủ tín hiệu.
- Owner provider hoặc owner hạ tầng thanh toán chịu trách nhiệm chính cho lỗi `214`, secret binding, và dữ liệu live provider account.
- Team 5 chỉ tiếp tục giữ live-sync loop xanh, không phải owner của blocker `pay`.

---

## 2. Trạng thái thực tế đã đối chiếu

- Probe production ngày `2026-04-19`: `HTTP 201`, nhưng provider trả `214`, chưa có link thật.
- `attempt_after_2026_04_19`: `PASS`
- `checkout_url_non_null`: `FAIL`
- `payment_link_id_non_null`: `FAIL`
- `no_214`: `FAIL`
- `production_gate_green`: `FAIL`
- `pnpm report:pay-prod-gate`: `FAIL`
- `pnpm test:pay`: `PASS`
- `pnpm test:dash`: `PASS`
- D1 production: bảng `provider_accounts` đang rỗng
- `release-claim state`: `LOCK_RETAINED`

Kết luận vận hành:
- Team 2 đã đi hết phần rerun và chứng minh đúng trạng thái lỗi hiện tại.
- Blocker chính đã chuyển sang lớp cấu hình provider live và lớp gate của Team 1.

---

## 3. Ma trận ownership theo tín hiệu thiếu

| Tín hiệu | Trạng thái | Owner chính | Team phối hợp | Ghi chú |
|---|---|---|---|---|
| `attempt_after_2026_04_19` | PASS | Team 2 | Team 1 | Đã xong |
| `checkout_url_non_null` | FAIL | Owner provider / hạ tầng thanh toán | Team 2 | Không thể xanh nếu provider vẫn trả `214` |
| `payment_link_id_non_null` | FAIL | Owner provider / hạ tầng thanh toán | Team 2 | Phụ thuộc link thật từ live provider |
| `no_214` | FAIL | Owner provider / hạ tầng thanh toán | Team 2, Team 1 | Đây là blocker gốc |
| `production_gate_green` | FAIL | Team 1 | Team 2 | Chỉ được PASS sau khi 3 tín hiệu trên cùng xanh |

---

## 4. Ownership theo team

### Team 1
Chịu trách nhiệm:
- giữ `LOCK_RETAINED` đúng kỷ luật
- yêu cầu owner provider xác nhận cấu hình live
- review packet sau rerun
- flip `release-claim` khi đủ bằng chứng

Chưa xong:
- chưa thể mở synchronized live
- chưa thể đổi `production_gate_green` sang `PASS`

### Team 2
Chịu trách nhiệm:
- giữ lane `pay` ở prep-only
- rerun probe ngay khi cấu hình live được xác nhận
- rerun `pnpm report:pay-prod-gate`
- rerun `pnpm test:pay`
- nộp lại evidence packet và gate note

Đã xong trong vòng này:
- dùng key hợp lệ
- probe production đúng ngày
- xác nhận lỗi thật là `214`
- chứng minh đây không phải false fail của app code

### Owner provider / hạ tầng thanh toán
Chịu trách nhiệm:
- cấu hình live `payOS` đúng tenant/site
- bảo đảm secret binding đúng môi trường production
- bảo đảm dữ liệu `provider_accounts` tồn tại và đúng
- gỡ tình trạng `214`

Đây là owner chính của blocker hiện tại.

### Team 5
Chịu trách nhiệm:
- giữ `team5-live-sync-loop` xanh
- cập nhật readiness packet
- chờ Team 1 mở synchronized live

Không chịu trách nhiệm:
- sửa `214`
- flip `release-claim`
- tự ý claim synchronized live

---

## 5. Việc còn lại theo đúng thứ tự

1. Team 1 gọi owner provider hoặc owner hạ tầng thanh toán xác nhận cấu hình live thực tế.
2. Owner provider cập nhật live account, secret binding, và dữ liệu `provider_accounts`.
3. Team 2 rerun probe production ngay sau cập nhật.
4. Team 2 rerun `pnpm report:pay-prod-gate`.
5. Nếu cả 4 tín hiệu còn lại đều xanh, Team 1 mới flip `production_gate_green` và `release-claim`.
6. Team 5 rerun live-sync readiness.
7. Khi đó mới đủ điều kiện nói tới synchronized live.

---

## 6. Ước lượng thời gian thực tế

Nếu cấu hình live provider được sửa xong:
- Team 2 cần khoảng `15–30 phút` để rerun probe, rerun gate, và nộp lại evidence.
- Team 1 cần khoảng `15–30 phút` để review, chốt gate, và flip release-claim.
- Team 5 cần khoảng `10–15 phút` để rerun live-sync readiness packet.

Tổng thời gian sau khi provider live được sửa:
- khoảng `30–60 phút`

Nếu `214` chưa được gỡ:
- chưa được cam kết giờ live chính thức.

---

## 7. Kết luận điều hành

Phần thiếu hiện tại thuộc:
- Team 2: phần rerun và evidence sau sửa cấu hình
- Team 1: phần gate và release-claim
- Owner provider / hạ tầng thanh toán: phần blocker gốc đang làm fail lane

Phần thiếu không thuộc Team 3, Team 4, hay Team 5.

Cho đến lúc `214` được xử lý sạch, `pay.iai.one` vẫn đúng trạng thái:
- prep-only
- `LOCK_RETAINED`
- chưa đủ điều kiện synchronized live
