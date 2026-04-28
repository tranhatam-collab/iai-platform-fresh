# WEB_IAI_ONE_TEST_EVIDENCE_PACKET_2026-04-27

- Domain: `web.iai.one`
- Nhóm sở hữu: Team 5 (sản phẩm tăng trưởng web) — quản lý bởi T4+5 agent
- Owner chính: Team 5 Web Lead (TBD — repo-side T4+5 agent đang duy trì)
- Ngày phát hành: 2026-04-27
- Commit / branch: `d33a067` / `OMCODE/smtp-internal-first-phase1`
- Môi trường mục tiêu: preview + lane kiểm thử tích hợp cục bộ
- Người phê duyệt: Team 1 Program Root (đang chờ review)
- Owner rollback: T4+5 agent
- Mục đích: cung cấp test/build evidence cho `web.iai.one` ngày 04-27 nhằm chuẩn bị release packet đầy đủ ngay khi pay gate `LOCK_FLIPPED`. Packet này KHÔNG claim production-ready — vẫn thiếu domain proof + deploy proof + owner proof per audit `TEAM_TEAM5_CURRENT_STATE_REPORT_2026-04-26.md` Surface 1.

---

## 1. Test evidence — `pnpm test:web` 2026-04-27

Lệnh:

```
pnpm test:web
```

Sequence build chain:
- `@iai/mail-core@0.0.0 build` → tsc -p tsconfig.json (ok)
- `@iai/mail-api@0.0.0 build` → tsc -p tsconfig.json (ok)
- `@iai/web@0.0.0 build` → tsc -p tsconfig.json (ok)
- `node --test tests/integration/web-*.test.mjs`

Test results:

| # | Test | Status | Duration |
|---|---|---|---|
| 1 | web filter mapper keeps exact Team 2 query/filter names | ✅ PASS | 0.456 ms |
| 2 | web contract URLs stay aligned to the shared filter contract | ✅ PASS | 0.174 ms |
| 3 | web onboarding reads shared Team 2 contracts and redirects to shared auth | ✅ PASS | 20.903 ms |

Tổng kết:
- `tests`: 3
- `pass`: 3
- `fail`: 0
- `cancelled`: 0
- `skipped`: 0
- `todo`: 0
- `duration_ms`: 90.426

Log file: `docs/release-evidence/web.iai.one/WEB_IAI_ONE_TEST_EVIDENCE_LOG_2026-04-27.log` (29 dòng).

---

## 2. Cross-check — language compliance + typecheck

| Lệnh | Kết quả |
|---|---|
| `pnpm review:team5-language` | ✅ PASS (20 files diacritic-clean) |
| `pnpm typecheck:web` | ✅ PASS (apps/web tsc clean) |
| `pnpm review:team4-checkpoint -- --date=2026-04-27` | ✅ PASS |
| `pnpm proof:team4-checkpoint -- --date=2026-04-27` | ⚠️ deferred — bị block ở step "Build NOOS web" do `apps/noos-web/node_modules` missing sau cross-agent commits (Codex scope per Plan §1 Agent 3 — escalate per Rule 2) |

---

## 3. KPI baseline state ngày 04-27

Theo `docs/reports/team5/TEAM5_LIVE_SYNC_FINAL_PACKET_2026-04-27.md`:

| Metric | Value | Note |
|---|---|---|
| Status | `NOT_READY_FOR_SYNCHRONIZED_LIVE` | chờ pay flip |
| Auth fail rate | 25% (không đổi vs 04-26) | release floor 4% — pilot fixture data |
| Route fail rate | 16.67% (không đổi vs 04-26) | hard ceiling 2% — pilot fixture data |
| Baseline coverage | 100% | toàn bộ 12 P0 events |
| Pay production gate done | FAIL | 8 tín hiệu kế thừa snapshot Team 1 04-22 |
| Release-claim unlocked | FAIL | LOCK_RETAINED |
| Governance READY | PASS | Team 5 self-check |
| NO-GO owner sign-off done | PASS | Team 5 self-check |

---

## 4. Production-ready proof matrix (per audit File 1/4 Surface 1)

| Proof type | Status | Evidence |
|---|---|---|
| repo proof | ✅ HAVE | commit `d33a067`, test:web PASS 3/3, typecheck PASS, language review PASS |
| domain proof | ❌ MISSING | chưa chạy `dig web.iai.one` / không có TLS chain capture / không có Cloudflare vhost screenshot |
| deploy proof | ❌ MISSING | chưa chạy `wrangler pages deploy --project-name web-iai-one` (chờ DEC-TEAM5-002 ack) |
| owner proof | ❌ MISSING | Team 5 Web Lead human owner chưa định danh (T4+5 agent maintain repo-side) |

**Production-ready verdict: NO** (chỉ 1/4 proof) — không thay đổi vs audit `TEAM_TEAM5_CURRENT_STATE_REPORT_2026-04-26.md`.

---

## 5. Boundary conformance

T4+5 đã giữ Rule 1 + Rule 2 + Rule 6 trong session 04-27:
- KHÔNG edit `apps/pay/`, `apps/mail-*`, `apps/developer/`, `apps/flow/`, `apps/dash/`, `apps/noos-web/`, `apps/nft/`.
- Diacritic regression trong 4 file `docs/WEB_*` + 2 file team5 reports → fix theo Rule 1 ownership (đã commit `d33a067`).
- NOOS web build fail (apps/noos-web/node_modules missing) → escalate per Rule 2, KHÔNG tự `pnpm install`.
- Chỉ chạy verification scripts trong scope (`test:web`, `typecheck:web`, `review:team5-*`, `review:team4-checkpoint`).

---

## 6. Sẵn sàng cho release wave (sau pay flip)

Khi Pay+Email phát `LOCK_FLIPPED`, T4+5 sẽ:
1. Rerun `pnpm report:team5-live-sync-loop` trong 10–15 phút (SLA nội bộ).
2. Cập nhật packet này với KPI delta sau flip.
3. Yêu cầu founder ack DEC-TEAM5-002 để chạy `wrangler pages deploy` (đóng deploy proof).
4. Yêu cầu founder định danh Team 5 Web Lead (đóng owner proof).
5. Khi đủ 4/4 proof, packet promote thành `WEB_IAI_ONE_RELEASE_EVIDENCE_PACKET_<post-flip-date>.md` cho Team 1 review.

---

## 7. Chữ ký

- Soạn bởi: T4+5 agent (Codex Sonnet 4.6 / Opus 4.7 — repo-side)
- Reviewer: Team 1 Program Root (chờ accept vào release-evidence chain)
- Cờ bilingual: VI có dấu đầy đủ; EN từ kỹ thuật giữ nguyên.
- ack: `IAI_ONE_FOUR_AGENT_SCOPE_BOUNDARY_PLAN_2026-04-26 v1.0.2`
