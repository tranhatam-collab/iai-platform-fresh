# TEAM1_PAY_PROVIDER_214_HANDOFF_2026-05-01
- Owner lane: Team 1 coordination -> Team Pay execution
- Date: 2026-05-01
- Status: `ACTIVE HANDOFF`

## Why this handoff exists
- The latest canonical one-shot probe no longer fails at auth or runtime health.
- The request reached payOS provider/business execution and failed with provider code `214`.
- This makes Team Pay the active blocker owner for the production gate.
- Founder context suggests a likely root cause: the current payOS setup may still be personal-only and the business/enterprise payment gateway for the organization is not active yet.

## Provider diagnostic package
- `worker_version_id = 053c8cb9-9f09-40fb-9063-2bd62f9c9559`
- `provider = payos`
- `auth row = sak_2026_05_01_team2_gate`
- `health_status = 200`
- `shared_read_model.rolloutReadyForSharedOnly = true`
- `shared_upstream_runtime.activeReadMode = shared_contract`
- `shared_upstream_runtime.releaseGate.ready = true`
- `schema_ready = true`
- `last_probe = 2026-05-01T12:11:52Z`
- `checkout_status = 502`
- `checkout_code = 214`
- `checkout_message = Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác`
- `checkout_url = null`
- `payment_link_id = null`
- `provider_codes_numeric = [214, 5900614422343]`

## Team Pay required actions
1. Đăng nhập payOS merchant dashboard đúng merchant đang bind với `PAYOS_CLIENT_ID` production.
2. Xác nhận merchant đang `active`, không `pending`, `suspended`, hoặc `under_review`.
3. Xác nhận payment channel/rail đang bật.
4. Xác nhận package/quota còn hiệu lực.
5. Xác nhận merchant hiện tại có thật sự được cấp cổng doanh nghiệp/tổ chức, không chỉ là tài khoản cá nhân.
6. Xác nhận webhook/merchant configuration không ở trạng thái tạm dừng.
7. Nếu dashboard đều đúng mà vẫn còn `214`, mở ticket payOS support với diagnostic package ở trên.

## Most likely interpretation right now
- Nếu merchant hiện tại mới là tài khoản cá nhân và chưa được payOS mở cổng doanh nghiệp cho pháp nhân, lỗi `214` rất có thể là phản ứng đúng từ provider.
- Trong trường hợp đó, Team Pay không nên tiếp tục yêu cầu Team Runtime sửa code hoặc deploy lại; việc cần làm là kích hoạt đúng merchant/channel doanh nghiệp hoặc đổi sang provider/channel phù hợp hơn cho legal entity hiện tại.

## Release rule
- Không mở Team 2 rerun bundle cho tới khi Team Pay xác nhận provider truth đã được sửa và one-shot canonical trả:
  - `checkout_status = 201`
  - `checkout_url` non-null
  - `payment_link_id` non-null
  - không còn `214`
