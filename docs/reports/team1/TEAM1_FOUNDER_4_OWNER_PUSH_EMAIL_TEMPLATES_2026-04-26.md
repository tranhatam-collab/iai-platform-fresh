# TEAM1_FOUNDER_4_OWNER_PUSH_EMAIL_TEMPLATES_2026-04-26

- Team: Team 1 Program Root / Control Tower (Codex supervisor)
- Date: 2026-04-26
- Audience: Founder Trần Hà Tâm
- Purpose: 4 email template founder copy-paste để push owner evidence cho 4 domain BLOCKED, gỡ Q-OPEN-4 mà không cần spawn agent thứ 4
- Source data: `TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md`, `TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_2026-04-23.md`, `TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-04-23.md`

---

## 0. Tóm tắt founder

| Domain | Verdict | Owner | Action cần | Mức ưu tiên |
|---|---|---|---|---|
| `developer.iai.one` | `REOPEN_REVIEW_APPROVED` | Team A lead | Schedule deploy slot + ship artifact | P1 — sắp gỡ |
| `cdn.iai.one` | `REOPEN_REVIEW_DENIED_PENDING_OWNER_EVIDENCE` | Team B Infra lead | Nộp 5 ref evidence (deploy log, rule snapshot, cache header, purge rollback, asset header) | P0 — quá hạn 04-20 |
| `flows.iai.one` | `REOPEN_REVIEW_PENDING_ROUTE_RUNTIME_PROOF` | Team B Automation lead | Nộp 3 ref evidence (route map prod, runtime prod, screenshot prod) | P0 — quá hạn 04-20 |
| `cios.iai.one` | Closure 8/8 PASS từ 04-23 | Team C lead | Thank + request live-claim sign-off | P2 — chỉ ack |

→ Founder gửi 4 email dưới đây thay vì spawn agent A+B+C+D. Khi evidence về, Codex (Team 1) tự ingest vào lane checker + release-evidence chain.

---

## 1. Email cho Team A (developer.iai.one owner)

```
Subject: [PUSH] developer.iai.one — REOPEN_REVIEW_APPROVED, cần Team A schedule deploy slot

To: <Team A lead>
From: Trần Hà Tâm

Hi Team A,

Team 1 Program Root đã verify lại packet developer.iai.one ngày 2026-04-22:
- pnpm test:developer = PASS (5/5)
- Verdict: REOPEN_REVIEW_APPROVED

Đây là tin tốt — review đã unblock. Team A cần làm tiếp:

1. Schedule deploy slot cho developer.iai.one (production cutover)
2. Capture deploy log + route smoke + screenshot deploy thành công
3. Nộp evidence packet vào: docs/release-evidence/developer.iai.one/<YYYY-MM-DD>/
   với manifest.md + deploy_log + smoke_output + screenshot

Deadline đề xuất: 2026-04-30 (4 ngày từ hôm nay).

Codex (Team 1 supervisor) sẽ tự verify packet khi ship vào repo, không cần Team A ping
thêm. Verdict GO/NO-GO sẽ ra trong 1 phiên kế tiếp sau khi packet về.

Nếu Team A cần slot review riêng với Team 1 (other agent), reply email này.

Truth source: docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md

Cảm ơn,
Trần Hà Tâm
```

---

## 2. Email cho Team B Infra (cdn.iai.one owner)

```
Subject: [PUSH P0] cdn.iai.one — thiếu 5 evidence ref, đã quá hạn 6 ngày, lane B-CDN BLOCKED

To: <Team B Infra lead>
From: Trần Hà Tâm

Hi Team B Infra,

Lane cdn.iai.one đang ở trạng thái REOPEN_REVIEW_DENIED_PENDING_OWNER_EVIDENCE
từ 2026-04-22. Quá hạn 04-20 deadline 6 ngày, đang block toàn bộ Team B release chain.

Team 1 evidence checker (2026-04-23) báo thiếu 5 ref bắt buộc:

1. deploy_log_ref          — log Cloudflare wrangler deploy production cdn.iai.one
2. rule_snapshot_ref       — snapshot Cloudflare Page Rules / Rulesets active
3. cache_header_proof_ref  — header response proof (Cache-Control, CF-Cache-Status, Age)
4. purge_rollback_note_ref — runbook purge cache + rollback nếu deploy lỗi
5. asset_header_proof_ref  — asset response header (immutable, max-age, ETag)

Team B Infra cần:

A) Chạy deploy production cho cdn.iai.one (nếu chưa)
B) Capture 5 evidence trên
C) Nộp vào: docs/release-evidence/cdn.iai.one/2026-04-XX/
   với manifest.md ghi đủ 5 field tương ứng + file artifact đính kèm

Deadline mới: 2026-04-29 (3 ngày).

Lưu ý: Team 1 evidence checker sẽ FAIL packet nếu thiếu bất kỳ ref nào — không có
cách nào bypass. Đây là rule khoá để bảo vệ uptime production.

Truth source:
- docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_2026-04-23.md
- docs/reports/team1/TEAM1_DOMAIN_REOPEN_VERDICTS_2026-04-22.md

Cảm ơn,
Trần Hà Tâm
```

---

## 3. Email cho Team B Automation (flows.iai.one owner)

```
Subject: [PUSH P0] flows.iai.one — thiếu 3 production proof, đã quá hạn 6 ngày

To: <Team B Automation lead>
From: Trần Hà Tâm

Hi Team B Automation,

Lane flows.iai.one đang ở REOPEN_REVIEW_PENDING_ROUTE_RUNTIME_PROOF từ 2026-04-22.

Tin tốt: pnpm test:flow-surface = PASS (4/4) ngày 2026-04-22.
Tin chưa tốt: packet vẫn thiếu 3 ref production-specific:

1. route_map_production_ref   — route map snapshot từ flows.iai.one production
2. runtime_production_ref     — runtime contract proof (response từ /health, /version, /flows)
3. screenshot_production_ref  — screenshot UI production (login, dashboard, flow execution)

Team B Automation cần:

A) Chạy `curl https://flows.iai.one/health` + capture JSON
B) Chạy `curl https://flows.iai.one/_routes` (hoặc tương đương) + capture route map
C) Mở browser → flows.iai.one → screenshot 3 page (landing, login, flow page)
D) Nộp vào: docs/release-evidence/flows.iai.one/2026-04-XX/
   với manifest.md ghi 3 field + file artifact

Deadline mới: 2026-04-29 (3 ngày).

Ghi chú: issue TS5083 trong packet cũ KHÔNG còn tái hiện ở workspace hiện tại.
Team B chỉ cần update packet bằng evidence production mới, không cần fix lại TS5083.

Truth source: docs/reports/team1/TEAM_B_CDN_FLOWS_PRODUCTION_EVIDENCE_STATUS_2026-04-23.md

Cảm ơn,
Trần Hà Tâm
```

---

## 4. Email cho Team C (cios.iai.one owner)

```
Subject: [ACK] cios.iai.one — closure 8/8 PASS, ready for live-claim sign-off

To: <Team C lead>
From: Trần Hà Tâm

Hi Team C,

Cảm ơn Team C đã đóng đủ closure cho cios.iai.one. Team 1 closure checker
(2026-04-23) báo:

- Review closure ready: PASS
- Gate checks: 8/8 PASS
  - ciosWorkspacePresent ✅
  - packetPresent ✅
  - runtimeProofPresent ✅
  - screenshotPackPresent ✅
  - workspaceEvidenceGuardPass ✅
  - upstreamVitestPass ✅
  - strictSmokeReady ✅
  - strictSmokePass ✅
- Screenshot pack: 5/5 PASS (root, hub, app, pricing, demo)
- Smoke command: 3/3 PASS

Codex (Team 1 supervisor) đã accept closure attachment vào release-evidence chain
(docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_TEAM1_CLOSURE_ATTACHMENT_2026-04-23.md).

Còn 2 lưu ý nhỏ trong smoke readiness (không block closure, chỉ note):
- Direct bearer token: missing (nếu cần production smoke với bearer thật, supply
  vào .env apps/cios)
- Workers JWT secret: looks placeholder (rotate thật trước khi flip live-claim)

Team C cần làm tiếp:

1. Reply email này confirm sẵn sàng cho live-claim sign-off
2. Rotate JWT secret production (nếu chưa)
3. Khi sẵn sàng, ping founder để Team 1 phát verdict GO

Deadline đề xuất: 2026-04-30.

Truth source:
- docs/reports/team1/TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-04-23.md
- docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_TEAM1_CLOSURE_ATTACHMENT_2026-04-23.md

Cảm ơn,
Trần Hà Tâm
```

---

## 5. Tracking matrix

Founder cập nhật bảng này khi gửi email + khi owner reply:

| Domain | Email sent at | Owner reply at | Evidence shipped at | Verdict by Team 1 |
|---|---|---|---|---|
| developer.iai.one | _pending_ | — | — | — |
| cdn.iai.one | _pending_ | — | — | — |
| flows.iai.one | _pending_ | — | — | — |
| cios.iai.one | _pending_ | — | — | — |

Codex sẽ tự update bảng này khi evidence packet xuất hiện trong `docs/release-evidence/<domain>/`.

---

## 6. Vì sao founder gửi 4 email thay vì spawn agent A+B+C+D?

Phân tích supervisor (Codex):

1. 4 domain BLOCKED **không vì thiếu agent**, mà vì **thiếu external evidence** (deploy log, route map, owner ack). Spawn AI agent thêm cũng không tạo evidence được — vẫn cần human owner thao tác Cloudflare console / capture screenshot / chạy deploy.

2. Codex (Team 1+2+3) **không có Cloudflare wrangler credentials**, không có deploy access — wear-2-hats không gỡ được blocker.

3. CIOS (1/4 domain) đã thực sự đóng — chỉ cần ack.

4. 3 domain còn lại có evidence rule rõ ràng: 5 ref CDN + 3 ref Flows + 1 deploy slot Developer = 9 việc cụ thể. Owner đọc email → làm trong 2-3 ngày → ship evidence → Codex verify tự động.

5. Khi 4 domain xanh, Q-OPEN-4 tự đóng (không cần agent A+B+C+D). Có thể giữ scope này dưới Codex coordination cho đến khi production evolution thật sự cần dedicated agent.

→ Recommend founder: gửi 4 email + chờ 3-4 ngày + reassess Q-OPEN-4 với evidence mới.
