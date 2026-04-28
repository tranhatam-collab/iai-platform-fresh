# TEAM2_RUNTIME_ERROR_CODEBOOK_2026
## Team 2 Runtime Error Codebook
## Version 1.0
## Status: LOCKED FOR TEAM 2 / TEAM 3 / TEAM 4 / TEAM 5
## Owner: Team 2 Runtime and Platform Core
## Date: 2026-04-15

---

## 1. Muc tieu

Cho cac team co cung mot tu dien loi:
- de UI viet copy dung
- de ops biet can escalate o dau
- de tests assert dung

---

## 2. Canonical errors

| Error code | HTTP | Group | Meaning | Consumer action |
|---|---|---|---|---|
| `AUTH_REQUIRED` | 401 | auth | khong co session hop le | redirect auth hoac re-auth |
| `SESSION_INVALID` | 401 | auth | session het han hoac khong verify duoc | clear state, yeu cau login lai |
| `WORKSPACE_REQUIRED` | 400 | auth/workspace | thieu workspace context | yeu cau workspace resolution |
| `FORBIDDEN` | 403 | permissions | role khong du quyen | an action, hien permission guidance |
| `VALIDATION_ERROR` | 400 | input | request shape hoac field invalid | hien field errors/actionable guidance |
| `NOT_FOUND` | 404 | lookup | object khong ton tai hoac khong visible | show missing state |
| `IDEMPOTENCY_CONFLICT` | 409 | safety | duplicate request voi key da ton tai | khong retry blind; fetch current state |
| `PAYMENT_PROVIDER_ERROR` | 502 | billing | checkout/payment provider loi | retry co kiem soat + support if persistent |
| `ORDER_CREATE_FAILED` | 500 | fulfillment | khong tao duoc order sau thanh toan | incident runbook Team 2/4 |
| `ENTITLEMENT_GRANT_FAILED` | 500 | fulfillment | order da co nhung access chua grant | incident runbook Team 2/4 |
| `DELIVERY_ACCESS_DENIED` | 403 | delivery | buyer khong co access hop le | render support path + refetch entitlement |
| `LOCALE_UNSUPPORTED` | 400 | locale | locale yeu cau khong nam trong `supported_locales` | fallback ve `default_locale` |
| `RETURN_PATH_INVALID` | 400 | locale/routing | success/library return path sai contract | fallback route + log issue |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | webhook | signature khong hop le | reject event, log security signal |
| `STEP_UP_REQUIRED` | 403 | nft/auth | action can privileged auth cao hon | trigger passkey/WebAuthn step-up |
| `STEP_UP_INVALID` | 401 | nft/auth | step-up response khong verify duoc | yeu cau verify lai |
| `STEP_UP_EXPIRED` | 401 | nft/auth | step-up session het han | yeu cau step-up lai |
| `WALLET_PROOF_REQUIRED` | 403 | nft/proof | action can wallet/owner proof | trigger wallet proof lane |
| `WALLET_SIGNATURE_INVALID` | 401 | nft/proof | signature khong hop le | challenge lai, khong retry mu |
| `WALLET_PROOF_EXPIRED` | 401 | nft/proof | proof het han truoc khi issue proxy | challenge lai |
| `ASSET_POLICY_DENIED` | 403 | nft/policy | asset policy khong cho phep action hien tai | show deny state + support if needed |
| `ASSET_PROXY_EXPIRED` | 401 | nft/delivery | protected proxy token het han | issue lai token neu van con proof hop le |
| `ASSET_PROXY_SCOPE_INVALID` | 403 | nft/delivery | token khong match subject/asset/action | hard deny + security log |
| `PARTNER_SYNC_SIGNATURE_INVALID` | 401 | nft/partner | event tu partner khong verify duoc | reject event + security escalate |
| `PARTNER_SYNC_REPLAY_BLOCKED` | 409 | nft/partner | event duplicate/replay bi chan | noop/reject + audit |
| `RUNTIME_UNAVAILABLE` | 503 | runtime | service runtime khong san sang | retry later + surface degraded state |
| `QUEUE_BACKLOG_HIGH` | 503 | runtime | queue pressure vuot nguong an toan | show degraded state + reduce load |

---

## 3. UI writing rules

Team 3/4/5 khi viet error copy phai:
- ngan
- ro
- noi duoc next step
- khong do loi mo ho cho user

Khong duoc show raw internal stack cho public UI.

---

## 4. Ops escalation rule

Phai escalate ngay neu gap:
- `ORDER_CREATE_FAILED`
- `ENTITLEMENT_GRANT_FAILED`
- `RUNTIME_UNAVAILABLE` keo dai
- `WEBHOOK_SIGNATURE_INVALID` lap lai co pattern

---

## 5. Change control

Them / sua error code bat buoc cap nhat:
- file nay
- API contract changelog
- docs UI / runbooks lien quan
