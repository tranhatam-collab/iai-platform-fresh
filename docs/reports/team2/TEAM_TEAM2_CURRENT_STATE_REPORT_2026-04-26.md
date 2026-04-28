# TEAM_TEAM2_CURRENT_STATE_REPORT_2026-04-26

- Team: Team 2 Runtime Platform Core
- Owner agent: Codex (per boundary plan v1.0.1 — NON-pay portion)
- Date: 2026-04-26
- Audit order ack: IAI_ONE_CURRENT_STATE_AUDIT_ORDER_2026-04-26

---

## Surface 1: dash.iai.one

- Surface: Dashboard (consumer/operator surface)
- Canonical domain: dash.iai.one
- Primary role: **product** (operator-facing, billing-support-only per IAI_ONE_AI_OWNER_EMAIL_AND_PAY_LANES_EXECUTION_PLAN §5)
- Current state: **DEV+ENDPOINT_LIVE** (test xanh, contract stable, **endpoint serving HTTP/2 200 qua Cloudflare verified 2026-04-26**)
- Production-ready: **NO — 3/4 proof OK, thiếu owner proof** (upgrade từ "thiếu 3/4 proof")
- Demo/simulated: NO (test thật, không mock)
- Auth source: shared-iai-auth (assumed)
- Payment source: none (billing-support-only per Q5 SIGNED)
- Invoice source: invoice.iai.one (Pay+Email own per Q2)
- Data source: TBD (chưa có proof D1/KV binding)
- Shared core dependency: `@iai/dash-runtime`, `@iai/dash-shared` (TBD)
- Known issues:
  - Control Tower UI spec đầy đủ nhưng UI chưa implement
  - Endpoint serving content nhưng business logic correctness chưa verify (chỉ HTTP 200)
- Security or legal risk: legal lane LOCKED billing-support-only (Q5)
- Founder decision needed: assign Cloudflare account owner làm "owner proof" cho audit
- Next 7-day action: monitor-only, không scope mới
- Next 30-day action: scope Control Tower UI implementation nếu founder approve

### Production proof (UPDATED 2026-04-26 EOD per dig probe)
- repo proof: ✅ `apps/dash/` HEAD `4268312`, `pnpm test:dash` PASS (per DAILY_TEAM2_2026-04-26)
- domain proof: ✅ **PASS** `dig dash.iai.one` → `104.21.8.122`, `172.67.139.112` (Cloudflare A records)
- deploy proof: ✅ **PASS** `curl -sI https://dash.iai.one` → `HTTP/2 200`, server: cloudflare, content-type: text/html
- owner proof: ❌ MISSING (Cloudflare account owner chưa ack chính thức cho audit)
- → Production-ready: **NO** (3/4 proof PASS — closest tới production-ready trong scope Codex; chỉ thiếu owner proof)

---

## Surface 2: shared-runtime-contract (apps/pay/health endpoint platform-shared portion)

- Surface: Shared runtime contract `/health` exposes `shared_read_model` + `shared_upstream_runtime`
- Canonical domain: pay.iai.one (overlap với Pay+Email scope — BUT contract evolution là Team Platform Runtime lane riêng)
- Primary role: **control plane**
- Current state: **BROKEN** — contract `legacy_or_unknown`, 5/8 signal FAIL trong shared probe
- Production-ready: NO
- Demo/simulated: NO
- Auth source: x-site-key + x-idempotency-key (mandatory)
- Payment source: pay.iai.one
- Invoice source: TBD
- Data source: pay-d1 (production), shared runtime (TBD)
- Shared core dependency: `@iai/pay-shared-runtime` (TBD)
- Known issues:
  - `/health` không expose `shared_read_model`
  - `/health` không expose `shared_upstream_runtime`
  - `shared_read_model_ready_for_shared_only` FAIL
  - `shared_upstream_active_read_mode_shared_contract` FAIL
  - `shared_upstream_release_gate_ready` FAIL
- Security or legal risk: none (technical contract gap)
- Founder decision needed: cấp ownership cho Team Platform Runtime evolution (hiện Codex chỉ probe, không sửa)
- Next 7-day action: chờ Pay+Email/Team Platform expose 3 field mới trong /health
- Next 30-day action: rerun shared probe verify 3 field PASS

### Production proof
- repo proof: `apps/pay/src/server.ts` (Pay+Email scope, Codex chỉ probe)
- domain proof: `curl https://pay.iai.one/health` → HTTP 200 nhưng `legacy_or_unknown`
- deploy proof: external (production endpoint live)
- owner proof: **MISSING** (chưa có Team Platform Runtime owner định danh)
- → Production-ready: NO

---

## Surface 3: pay production runtime probe (probe-only, không phải runtime owner)

- Surface: `scripts/team2-pay-prod-runtime-probe.mjs` + `scripts/team2-pay-shared-runtime-probe.mjs`
- Canonical domain: N/A (CLI tool)
- Primary role: **internal/operate**
- Current state: **LIVE** internal tool
- Production-ready: YES (internal use)
- Demo/simulated: NO
- Auth source: env `TEAM2_PAY_GATE_API_KEY` (canonical key, currently MISSING)
- Payment source: none
- Invoice source: none
- Data source: production pay.iai.one endpoint
- Shared core dependency: none
- Known issues: probe FAIL 8/8 signal vì env `TEAM2_PAY_GATE_API_KEY` chưa export (founder + provider duty)
- Security or legal risk: none
- Founder decision needed: push provider owner export canonical key
- Next 7-day action: rerun probe khi key về
- Next 30-day action: integrate probe output vào lane checker auto-loop

### Production proof
- repo proof: `scripts/team2-pay-*.mjs` HEAD `4268312`
- domain proof: probe target = production pay.iai.one (live endpoint verified HTTP 200)
- deploy proof: probe artifact `docs/reports/team2/TEAM2_PAY_PROD_RUNTIME_PROBE_2026-04-26.{md,json}` exists
- owner proof: Codex tự verify
