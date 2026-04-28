# GLOBAL CRITICAL PATH

Version 1.0

Status: Live Working File

Scope: global synchronized live + gate completeness for `*.iai.one`

Last updated: `2026-04-22`

---

## 0. Kết luận 1 câu

Đường găng số 1 của toàn hệ hiện tại vẫn là `pay.iai.one` production gate.

## 1. Mục tiêu của giai đoạn này

Mục tiêu không phải “mọi thứ xanh local”.

Mục tiêu là đạt đồng thời:
- Team 1 không còn giữ `LOCK_RETAINED`
- `pay.iai.one` không còn blocker production
- Team 5 có thể rerun synchronized-live readiness trên snapshot mới
- các domain còn lại không còn thiếu production evidence để Team 1 đóng review closure
- mail lane có đường găng riêng nhưng không được làm chệch đường găng số 1

## 2. Critical path số 1: synchronized live

```text
Provider Owner
-> Team 1 owner follow-up complete
-> Team 2 rerun pay probe + gate + tests
-> Team 1 flip pay verdict
-> Team 5 rerun synchronized-live readiness
-> Global synchronized live claim
```

### Ai chặn ai, chính xác

1. `Provider Owner` chặn `Team 1`
   - thiếu xác nhận live merchant/channel/secret/provider_accounts canonical

2. `Team 1` chặn `Team 2`
   - Team 2 không nên chạy rerun production vô hạn khi chưa có owner ack mới

3. `Team 2` chặn `Team 1`
   - Team 1 chỉ flip gate khi có probe/gate/test mới đủ tín hiệu `PASS`

4. `Team 1` chặn `Team 5`
   - `release-claim` vẫn `LOCK_RETAINED`

5. `Team 5` chặn `global synchronized-live claim`
   - Team 5 là nơi hợp nhất readiness cuối

### Điều kiện tối thiểu để path này xanh

- có `owner ack` hợp lệ
- có probe artifact ngày mới của Team 2
- `checkout_url_non_null = PASS`
- `payment_link_id_non_null = PASS`
- `no_214 = PASS`
- `production_gate_green = PASS`
- nếu gate mode mới đang hiệu lực, các tín hiệu shared-runtime/shared-upstream cũng phải có source hợp lệ và không fail
- Team 1 bỏ `LOCK_RETAINED`
- Team 5 rerun readiness/final packet thành công

## 3. Critical path số 2: domain review closure

Đây không phải blocker số 1 của synchronized live, nhưng là blocker lớn của gate completeness theo domain.

```text
Team B CDN
-> Team 1 close CDN review

Team B Flows
-> Team 1 close Flows review

Team C CIOS
-> Team 1 close CIOS review
```

### Current truth

- `developer.iai.one`
  - đã `REOPEN_REVIEW_APPROVED`
  - không còn là blocker số 1
- `cdn.iai.one`
  - còn thiếu deploy/rule/cache/header evidence
- `flows.iai.one`
  - local test đã xanh trong workspace hiện tại nhưng còn thiếu route/runtime proof production trong packet
- `cios.iai.one`
  - còn 3 việc mở: Vitest env, fresh screenshot, strict smoke

## 4. Critical path số 3: mail lane

Mail là đường găng riêng.
Nó không chặn trực tiếp pay gate, nhưng chặn “email completeness toàn hệ”.

```text
lane.mail-internal-first (closed)
-> lane.mail-wave-1
-> lane.mail-wave-2-auth
-> lane.mail-wave-3-pay-flow
-> lane.mail-global-live
```

### Ai chặn ai

1. `Team SMTP` chặn `Wave 1`
   - phải giữ outbound/inbound/runtime thật ổn định

2. `Wave 1` chặn `Wave 2 Auth`
   - chỉ mở khi mọi row Wave 1 đều migrated thật

3. `Wave 2 Auth` chặn `Wave 3 Pay + Flow`
   - chỉ mở khi Gmail/Outlook matrix cho auth flows xanh thật

4. `Wave 3 Pay + Flow` chặn `mail global live`
   - chỉ mở khi payment/workflow mail có `messageId` thật và DB evidence đủ

## 5. Các lane quan trọng nhưng không phải đường găng số 1

- Team 3 NOOS continuity
- Team 4 support/recovery/trace mapping
- Team 5 KPI instrumentation
- shell monitor-only của `iai`, `home`, `docs`, `app`, `flow`, `dash`, `api`, `api.flow`, `mail`

Rule:
- không được lấy trạng thái xanh của các lane này để che blocker thật ở `pay`

## 6. Điều không được làm

- Không cho Team 5 rerun synchronized live trước khi pay verdict flip thật.
- Không gọi `flows` là production-ready chỉ vì local test xanh.
- Không gọi `developer` là `GO` chỉ vì reopen review đã approved.
- Không gọi `mail` là global live chỉ vì internal-first verification đã clean.
- Không mở scope mới cho Team 3 hoặc Team 4 trong khi đường găng số 1 vẫn là `pay`.

## 7. Ưu tiên thực thi đúng thứ tự

### P0

1. `Provider Owner -> Team 1`
2. `Team 1 -> Team 2 rerun window`
3. `Team 2 -> Team 1 pay gate evidence`
4. `Team 1 -> Team 5 gate flip authority`
5. `Team 5 -> global synchronized live verdict`

### P1

1. Team B CDN proof closure
2. Team B Flows production route/runtime proof closure
3. Team C CIOS evidence closure

### P2

1. Mail wave migration
2. Monitor-only lane stability
3. Non-blocking shell deltas

## 8. Admin short form

```text
Đường găng số 1: pay gate
Provider Owner
-> Team 1
-> Team 2
-> Team 1
-> Team 5
-> global synchronized live

Đường găng số 2: domain review closure
Team B CDN -> Team 1
Team B Flows -> Team 1
Team C CIOS -> Team 1

Đường găng số 3: mail lane
Team SMTP -> Wave 1 -> Wave 2 Auth -> Wave 3 Pay/Flow -> mail global live
```

## 9. Câu chốt

`pay gate` đang chặn synchronized live toàn hệ.

`mail lane` đang chặn email completeness toàn hệ.

`cdn / flows / cios` đang chặn domain gate completeness.

Team 1 là authority flip cuối cùng cho cả ba cụm đó.
