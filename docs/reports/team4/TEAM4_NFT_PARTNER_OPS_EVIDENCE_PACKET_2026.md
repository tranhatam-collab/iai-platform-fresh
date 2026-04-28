# TEAM4_NFT_PARTNER_OPS_EVIDENCE_PACKET_2026
## Evidence packet vận hành đối tác của Team 4 cho `nft.iai.one`
## Version 1.2
## Status: READY_FOR_TEAM1_REVIEW
## Owner: Team 4 Growth Revenue Operations
## Date: 2026-04-17

---

## 1. Trạng thái packet

- Trạng thái hiện tại: `READY_FOR_TEAM1_REVIEW`
- Mốc review mục tiêu: intake ngay với Team 1; Team 4 giữ khóa phạm vi ở support/recovery/trace mapping.
- Chủ trì: Team 4 Growth Revenue Operations
- Reviewer from Team 4: Team 4 Ops Lead
- Locale wording audit: completed on 2026-04-17 per NOOS addendum lock

### 2026-04-18 Team 1 checkpoint
- Team 4 packet state: `READY_FOR_TEAM1_REVIEW`
- Lane state: `GO`
- Gate language lock: `Overall: PASS`, `Final verdict: GO` theo `docs/reports/team1/NFT_PHASE_C_GATE_STATUS_2026-04-18.md`

### Checklist đọc nhanh cho Team 1
| Hạng mục | Trạng thái |
|---|---|
| Asset opening policy wording locked | PRESENT |
| Support owner and escalation owner | PRESENT |
| Recovery path without bypass | PRESENT |
| Partner signed-sync handoff note | PRESENT |
| Deny-case macros | PRESENT |
| Rollback communication note | PRESENT |
| Runtime proof dependency on Team 2 acknowledged | PRESENT |
| Wrong asset opening trace mapping | PRESENT |
| Deny mismatch trace mapping | PRESENT |

### Checkpoint tuân thủ ngôn ngữ (NOOS addendum 2026-04-17)
- [x] Vietnamese support copy in this packet uses full diacritics where shown to users/partners.
- [x] EN/VI wording is separated by intended audience and does not mix in one SEO-facing title/hero context.
- [x] Ops terminology aligns with lock files `34_NOOS_BILINGUAL_SEO_AND_LOCALE_EXECUTION_LOCK_2026.md` and `IAI_BILINGUAL_SEO_AND_LOCALIZATION_STANDARD_2026.md`.

### Proof app surface (2026-04-17)
- [x] `/en/operations` and `/vi/operations` now render Team 4 ops packet blocks: ops truth, owner/escalation matrix, recovery path, partner handoff, incident matrix, support macros (including updates-announcement), rollback communication.
- [x] machine-readable trace map endpoint available: `/en/operations/trace-map.json` and `/vi/operations/trace-map.json`.
- [x] Team 1 intake checklist published: `docs/reports/team4/TEAM4_TO_TEAM1_INTAKE_CHECKLIST_2026-04-17.md`.
- [x] Integration proof command: `pnpm test:noos-web` -> PASS (includes Vietnamese operations route assertions).
- [x] Stack proof command: `NOOS_STACK_TEST=1 pnpm test:noos-stack` -> PASS.

---

## 2. Wording policy mở tài sản

- Tóm tắt policy mở tài sản đã phê duyệt:
  - `vc.vetuonglai.com` được phép hiện partner/program context, nhưng mọi protected asset opening chỉ được kết thúc trên `nft.iai.one`.
  - Class A preview có thể public. Class B/C/D protected action chỉ mở khi `nft.iai.one` cho kết quả allow sau policy check server-side.
- Tóm tắt wording cho tài sản vault-class:
  - Vault-class asset chỉ được open/export khi có shared session hợp lệ, passkey/WebAuthn step-up, wallet proof hoặc equivalent owner proof nếu policy yêu cầu, sau đó mới issue protected delivery TTL ngắn.
- Tóm tắt wording cho trạng thái deny:
  - Nếu session strength, step-up, wallet proof, partner signature, timestamp, hoặc policy input không hợp lệ thì hệ thống giữ trạng thái deny. Support chỉ dẫn buyer đi qua lane xác minh lại, không được mở bằng tay.
- Điều Team 4/support tuyệt đối không được hứa:
  - raw asset URL
  - manual vault open
  - partner-side override access
  - bypass passkey/WebAuthn hoặc wallet proof
  - "cấp tay trước, đối log sau"

---

## 3. Ownership của support

- Owner chính: Team 4 Ops Lead
- Owner dự phòng: Team 4 Growth Lead
- Đường on-call: Team 4 Ops Lead -> Team 2 Runtime Lead -> Team 1 Program Root
- Escalation owner phía Team 2: Team 2 Runtime Lead
- Escalation owner phía Team 1: Team 1 Program Root

| Trách nhiệm | Owner chính | Owner dự phòng | Escalate khi |
| --- | --- | --- | --- |
| Buyer acknowledgement + triage | Team 4 Ops Lead | Team 4 Growth Lead | buyer bị deny, hold, hoặc không vào được lane protected |
| Ops wording / partner expectation | Team 4 Growth Lead | Team 4 Ops Lead | wording có nguy cơ drift khỏi gate/policy đã khóa |
| Runtime proof / step-up / wallet / proxy / partner receiver | Team 2 Runtime Lead | Team 2 on-call runtime owner | xuất hiện `STEP_UP_*`, `WALLET_*`, `ASSET_PROXY_*`, `PARTNER_SYNC_*` |
| Gate conflict / rollback authority / trust-root dispute | Team 1 Program Root | Team 1 release gate delegate | recovery, partner, hoặc support wording có nguy cơ vượt lock authority |

---

## 4. Đường recovery

- Điểm vào của recovery:
  - buyer ticket vào queue Team 4 phải có tối thiểu `subject_id` hoặc buyer identifier, `asset_id`, `partner_program_id_optional`, `asset_access_event_id_optional`, `partner_event_id_optional`.
  - Team 4 triage case vào 1 trong 5 nhóm: `step_up`, `wallet_proof`, `policy_deny`, `partner_sync`, `rollback_hold`.
- Ràng buộc recovery:
  - không manual grant access
  - không gửi raw URL
  - không đổi policy gate bằng support note
  - không để `vc.vetuonglai.com` trở thành final access decision
- Cách recovery tránh bypass step-up/wallet proof:
  - recovery chỉ được phép reset session, yêu cầu challenge mới, quarantine partner event, hoặc nhờ Team 2 replay lane đã verify.
  - mọi asset reopening vẫn phải đi lại chuỗi `access-check -> proxy-token -> protected delivery` trên `nft.iai.one`.
- Trường hợp bắt buộc re-verification:
  - `STEP_UP_INVALID`
  - `STEP_UP_EXPIRED`
  - `WALLET_PROOF_REQUIRED`
  - `WALLET_SIGNATURE_INVALID`
  - `WALLET_PROOF_EXPIRED`
  - đổi wallet, đổi thiết bị, đổi browser hoặc sau account recovery
  - có metadata drift từ partner sync ảnh hưởng entitlement/policy input
  - mọi vault-class action sau rollback hold

---

## 5. Partner handoff với `vc.vetuonglai.com`

- Owner/liên hệ phía partner:
  - Team 4 side: Team 4 Ops Lead
  - Partner side: VC Partner Ops contact / operational mailbox được Team 1 và Team 4 ghi nhận cho signed sync
- Điều kiện kích hoạt handoff:
  - `PARTNER_SYNC_SIGNATURE_INVALID`
  - `PARTNER_SYNC_REPLAY_BLOCKED`
  - stale `x-source-timestamp`
  - metadata drift làm sai policy input, collection mapping, hoặc partner program mapping
  - rollback hold ảnh hưởng buyer expectation bên partner surface
- Yêu cầu cho signed sync:
  - mọi sync từ `vc.vetuonglai.com` phải có `x-partner-signature`, `x-idempotency-key`, `x-source-timestamp`
  - payload tối thiểu phải có `partner_program_id`, `asset_id`, `event_name`, `source_timestamp`
  - partner được đồng bộ metadata/eligibility state, nhưng không được tự quyết final protected asset access
- Cách xử lý event stale/invalid:
  - quarantine event
  - không mutate access state
  - Team 2 nhận escalation cùng ngày
  - Team 4 gửi partner note trong 24h kèm `partner_event_id` và reject reason
- Cách xử lý metadata drift:
  - Team 4 mở drift ticket, đóng băng mọi promise liên quan asset ảnh hưởng
  - Team 2 đối soát normalized payload và audit log
  - escalate Team 1 cùng ngày nếu drift động đến trust root, asset opening policy, hoặc rollback hold

---

## 6. Ma trận incident

### Step-up required
- Hành động support:
  - xác nhận `STEP_UP_REQUIRED` hoặc `STEP_UP_EXPIRED`
  - hướng dẫn buyer hoàn tất passkey/WebAuthn trên `nft.iai.one`
  - thu thập `asset_access_event_id`
  - không chuyển buyer sang partner domain để "mở tay"
- Đường escalation:
  - repeat failure hoặc nhiều buyer cùng gặp -> Team 2 Runtime Lead
  - wording xung đột với gate/policy -> Team 1 Program Root

### Wallet proof required
- Hành động support:
  - xác nhận `WALLET_PROOF_REQUIRED`, `WALLET_SIGNATURE_INVALID`, hoặc `WALLET_PROOF_EXPIRED`
  - hướng dẫn buyer challenge lại và verify lại wallet proof
  - đối soát wallet_id, asset_id, action scope
  - không xác nhận access khi wallet proof chưa pass
- Đường escalation:
  - runtime loop, challenge không issue được, hoặc proof bind sai -> Team 2 Runtime Lead
  - partner metadata cam kết khác với deny state -> Team 1 Program Root sau khi Team 2 đọc log

### Access denied
- Hành động support:
  - xác nhận `ASSET_POLICY_DENIED` hoặc `ASSET_PROXY_SCOPE_INVALID`
  - trả lời buyer bằng policy wording đã khóa, nói rõ chưa đạt điều kiện mở asset
  - mở review nếu buyer cho rằng metadata/eligibility bị sai
- Đường escalation:
  - nghi ngờ policy input sai -> Team 2 Runtime Lead
  - deny conflict với partner promise hoặc release wording -> Team 1 Program Root

### Invalid partner signature
- Hành động support:
  - không thay đổi access state
  - đánh dấu event bị quarantine
  - thông báo partner không được promise access cho tới khi signed event hợp lệ
- Đường escalation:
  - Team 2 Runtime Lead cùng ngày
  - Team 1 Program Root nếu lặp lại hoặc có dấu hiệu trust-root drift

### Stale partner sync
- Hành động support:
  - giữ nguyên trạng thái deny/hold
  - yêu cầu partner gửi lại event mới với timestamp hợp lệ
  - không đưa stale event vào policy finality
- Đường escalation:
  - Team 2 Runtime Lead nếu backlog, replay, hoặc timestamp drift lặp lại
  - Team 1 Program Root nếu stale lane ảnh hưởng partner-facing commitments

### Rollback trigger
- Hành động support:
  - chuyển tất cả ticket liên quan protected opening/download sang hold mode
  - dùng rollback macro cho buyer và partner
  - không mở asset bằng tay trong cửa sổ rollback
- Đường escalation:
  - Team 2 Runtime Lead kích hoạt hold kỹ thuật
  - Team 1 Program Root xác nhận gate authority và blast radius
  - Team 4 Growth Lead đồng bộ expectation với partner/business side

---

## 6A. Trace mapping cho `wrong asset opening request` + `deny mismatch`

### Case 1: Wrong asset opening request
- detection signals:
  - `requested_asset_id` nằm ngoài `entitled_asset_ids_snapshot` của `subject_id`
  - runtime trả `ASSET_PROXY_SCOPE_INVALID` hoặc `ASSET_POLICY_DENIED`
  - buyer yêu cầu mở tài sản không cùng đường với `order_id` vừa hoàn tất
- Trace fields bắt buộc:
  - `subject_id` hoặc buyer identifier
  - `requested_asset_id`
  - `entitled_asset_ids_snapshot`
  - `asset_access_event_id`
  - `policy_eval_id`, `deny_code`, `deny_reason`
  - `order_id`, `entitlement_id`
- Decision path:
  - giữ deny state, không manual open
  - trả lời buyer bằng macro deny có `asset_access_event_id`
  - mở verification nhánh Team 2 khi phát hiện entitlement snapshot lệch bất thường
- Escalation owner:
  - Team 2 Runtime Lead cho mismatch policy/entitlement
  - Team 1 Program Root nếu partner promise xung đột deny state

### Case 2: Deny mismatch
- detection signals:
  - partner/support claim allow nhưng runtime trả `ASSET_POLICY_DENIED`
  - `policy_input_hash` lệch với payload partner sync
  - deny reason không thống nhất giữa bản ghi buyer và partner
- Trace fields bắt buộc:
  - `partner_event_id`
  - `x-idempotency-key`, `x-source-timestamp`
  - `policy_input_hash`
  - `deny_reason`, `deny_code`
  - `asset_access_event_id`
  - `review_ticket_id`
- Decision path:
  - freeze promise state và giữ deny cho tới khi đối soát trace hoàn tất
  - quarantine partner event mismatch
  - attach trace bundle cho Team 2 + Team 1 review trong ngày
- Escalation owner:
  - Team 2 Runtime Lead cho trace reconciliation
  - Team 1 Program Root cho gate authority và communication lock

---

## 7. Wording/macro cho support

- step-up required macro:
  > Chào [buyer_name], yêu cầu mở tài sản `[asset_id]` hiện cần bước xác minh bổ sung trên `nft.iai.one`. Vui lòng hoàn tất passkey/WebAuthn step-up rồi thử lại trong cửa sổ 10 phút. Support không thể mở tài sản bằng tay khi bước này chưa pass. Mã theo dõi: `[asset_access_event_id]`.
- wallet proof required macro:
  > Chào [buyer_name], hệ thống đang cần wallet proof hợp lệ để tiếp tục action với tài sản `[asset_id]`. Vui lòng chạy lại challenge và xác minh đúng wallet đã được liên kết. Khi wallet proof chưa pass, support không thể issue protected access thay cho bạn. Mã theo dõi: `[asset_access_event_id]`.
- access denied macro:
  > Chào [buyer_name], yêu cầu hiện tại đang ở trạng thái deny theo asset policy đã khóa cho `[asset_id]`. Điều này có thể do entitlement, step-up, wallet proof, hoặc action scope chưa đúng. Chúng tôi đang đối soát lại input policy; nếu có sai lệch metadata, support sẽ mở ticket kiểm tra thay vì mở tài sản bằng tay.
- invalid partner sync macro:
  > Chào [partner_contact], sự kiện đồng bộ `[partner_event_id]` từ `vc.vetuonglai.com` không qua được kiểm tra chữ ký nên không được dùng để thay đổi protected access state. Vui lòng gửi lại event đã ký hợp lệ; cho tới khi đó, đối tác không được promise access cho buyer.
- stale partner sync macro:
  > Chào [partner_contact], sự kiện đồng bộ `[partner_event_id]` bị đánh dấu stale hoặc replay và đã được quarantine. Trạng thái protected access không thay đổi. Vui lòng gửi lại event mới với `x-source-timestamp` hợp lệ và idempotency key mới nếu cần.
- rollback hold macro:
  > Chào [recipient_name], lane mở tài sản protected đang ở chế độ hold có kiểm soát để xác minh an toàn access trên `nft.iai.one`. Trong cửa sổ này, support sẽ không mở tài sản bằng tay hay gửi link trực tiếp. Chúng tôi sẽ cập nhật lại trước `[next_update_time]` với incident id `[incident_id]`.

---

## 8. Ghi chú truyền thông rollback

- Owner rollback:
  - Team 2 Runtime Lead (technical hold)
  - Team 4 Ops Lead (buyer/partner communication)
  - Team 1 Program Root (gate authority)
- Nhóm bắt buộc phải được thông báo:
  - Team 1 Program Root
  - Team 2 Runtime Lead / runtime on-call
  - Team 4 Growth Lead + Team 4 Ops Lead
  - VC Partner Ops contact
- Buyer bị ảnh hưởng hoặc queue đang mở.
- Mẫu ghi chú nội bộ:
  - `Rollback trigger: [trigger]. Scope: [asset_class/route/partner_program]. Immediate action: freeze protected open/download, preserve audit, no manual unlock. Owner: [owner]. Next update: [time].`
- Mẫu thông báo cho partner:
  - `We placed the protected asset lane in controlled hold while nft.iai.one verifies policy and sync integrity. Please do not promise access or distribute links from vc.vetuonglai.com until Team 1 clears reopen. Reference: [partner_event_id/incident_id].`
- Mẫu thông báo cho người dùng:
  - `Tài sản bạn yêu cầu đang tạm thời ở trạng thái hold để xác minh an toàn truy cập. Chúng tôi đang kiểm tra trên nft.iai.one và sẽ cập nhật lại trước [time]. Support không mở tài sản bằng tay trong cửa sổ kiểm tra này.`

---

## 9. Tuyên bố cuối

- Team 4 packet status: `READY_FOR_TEAM1_REVIEW`
- Ready for Team 1 review? `Y`
- Khoảng trống đã biết:
  - live raw proof cho accepted/rejected partner sync và protected delivery vẫn lấy từ packet Team 2; Team 4 không tạo runtime claim mới.
  - Team 4 packet này chỉ xác nhận ops truth, owner/escalation, recovery, macros, rollback communication, trace mapping theo scope đã khóa.

### Quy tắc nộp packet của Team 4
Team 4 giữ packet ở trạng thái `READY_FOR_TEAM1_REVIEW` và bám đúng gate language của Team 1 (`Overall: PASS`, `Final verdict: GO`) mà không mở thêm claim ngoài mission map đã khóa.
