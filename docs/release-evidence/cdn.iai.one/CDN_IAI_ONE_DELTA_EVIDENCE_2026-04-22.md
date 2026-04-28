# CDN_IAI_ONE_DELTA_EVIDENCE_2026-04-22

- Domain: `cdn.iai.one`
- Owner team: Team B (Infra CDN Owner)
- Delta date: `2026-04-22`
- Baseline packet: `docs/release-evidence/cdn.iai.one/CDN_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md`
- Source commit: `OMCODE/smtp-internal-first-phase1@6783482`
- Delta purpose: cập nhật nhanh trạng thái runtime reachability để hỗ trợ Team 1 review blocker hiện tại

## 1) Reachability checks executed

| Command | Result | Notes |
|---|---|---|
| `curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' -L https://cdn.iai.one/` | `FAIL` | `curl: (6) Could not resolve host: cdn.iai.one` |
| `curl -I -sS https://cdn.iai.one/` | `FAIL` | `curl: (6) Could not resolve host: cdn.iai.one` |

## 2) Interpretation

- Trong môi trường hiện tại, chưa thể thu thập proof deploy/rule/cache runtime từ domain `cdn.iai.one` do DNS chưa resolve.
- Vì vậy trạng thái blocker domain-specific của CDN vẫn giữ `OPEN`.

## 3) Pending evidence remains unchanged

- deploy log
- rule snapshot
- cache verification
- purge/rollback note
- asset/header proof domain-specific

## 4) Suggested Team 1 interpretation

- Không flip trạng thái `cdn.iai.one` sang release-ready chỉ dựa trên docs pack.
- Giữ domain ở `PENDING_OWNER_EVIDENCE` cho đến khi owner nộp đủ evidence runtime đọc được ngay trong packet.
