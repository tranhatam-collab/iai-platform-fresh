# TEAM DEV HANDOFF — iai-platform-fresh
**Ngày:** 2026-05-30
**Auditor:** Claude (OL)
**Branch:** main
**Commit mới nhất:** `bba7493` — test(verify-runtime): add package wiring and quota tenant tests

---

## TRẠNG THÁI HIỆN TẠI

### ✅ ĐÃ XONG — verify-runtime scaffold (commit bba7493 + f5c4b9b)

| Module | File | Status |
|---|---|---|
| Tenant resolver | `apps/verify-runtime/src/tenant-resolver.ts` | ✅ Logic đầy đủ, 6 tests PASS |
| Quota authority | `apps/verify-runtime/src/quota-do.ts` | ✅ QuotaDO logic PASS, DO wrapper = STUB |
| Usage emission | `apps/verify-runtime/src/usage-emission.ts` | ✅ 8 tests PASS |
| Tests | `apps/verify-runtime/tests/` | ✅ 20/20 PASS |
| Build | `apps/verify-runtime/dist/` | ✅ Clean |
| Wrangler config | `apps/verify-runtime/wrangler.toml` | ✅ Declared, NOT deployed |

**Không deploy** — Founder gate required (per comment trong quota-do.ts và wrangler.toml).

---

## VIỆC CÒN LẠI — ĐỂ ĐẠT 100%

### Phase 2A — Wire DurableObject thật (1-2 ngày)

**File:** `apps/verify-runtime/src/quota-do.ts`
**Việc:** Replace `DurableObjectQuota` stub với real Cloudflare DO class

```typescript
// Thay thế DurableObjectQuota stub bằng:
import { DurableObject } from "cloudflare:workers";

export class QuotaDOWorker extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const body = await request.json() as { action: string; amount?: number };

    if (body.action === "check") {
      const state = await this.ctx.storage.get<QuotaState>("state");
      const remaining = (state?.limit ?? 0) - (state?.used ?? 0);
      return Response.json({ allowed: (body.amount ?? 1) <= remaining, remaining });
    }

    if (body.action === "increment") {
      const state = await this.ctx.storage.get<QuotaState>("state") ?? defaultState;
      if (state.used + (body.amount ?? 1) > state.limit) {
        return Response.json({ error: "quota_exceeded" }, { status: 429 });
      }
      state.used += (body.amount ?? 1);
      await this.ctx.storage.put("state", state);
      return Response.json(state);
    }

    return new Response("Unknown action", { status: 400 });
  }
}
```

**Steps:**
1. `pnpm add -D @cloudflare/workers-types` trong verify-runtime
2. Replace stub class với real DurableObject extension
3. Update wrangler.toml: add `[[durable_objects.bindings]]` with real account class
4. Test với `wrangler dev --local` (DO can run local via miniflare)
5. Stress test: 20 parallel requests → exactly N allowed, rest 429

---

### Phase 2B — D1 Usage Ledger (1 ngày)

**wrangler.toml** uncomment và fill in:
```toml
[[d1_databases]]
binding = "USAGE_LEDGER_DB"
database_name = "verify_usage_ledger"
database_id = "CREATE_WITH: wrangler d1 create verify-usage-ledger"
```

**Migration file:** `apps/verify-runtime/migrations/001_usage_ledger.sql`
```sql
CREATE TABLE usage_events (
  id          TEXT PRIMARY KEY,
  tenant      TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  actor_id    TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  usage_amount REAL NOT NULL,
  unit        TEXT NOT NULL,
  metadata    TEXT,          -- JSON blob
  environment TEXT NOT NULL,
  timestamp   INTEGER NOT NULL
);
CREATE INDEX idx_usage_tenant_ts ON usage_events(tenant, timestamp);
CREATE INDEX idx_usage_workspace ON usage_events(workspace_id, timestamp);
```

**Update `usage-emission.ts`:** Replace console.log stub với D1 insert:
```typescript
export async function emitUsageEvent(event: UsageEvent, db: D1Database): Promise<void> {
  await db.prepare(
    `INSERT INTO usage_events VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(...Object.values(event)).run();
}
```

---

### Phase 2C — Queue Async Emission (0.5 ngày)

**wrangler.toml** uncomment:
```toml
[[queues.producers]]
binding = "USAGE_EVENTS_QUEUE"
queue = "verify-usage-events"
```

**Pattern:** index.ts gọi `env.USAGE_EVENTS_QUEUE.send(event)` thay vì direct D1 insert.
D1 insert chạy trong Queue consumer worker riêng → không block main request path.

---

### Phase 2D — Staging Deploy + Smoke Test (0.5 ngày)

**Preconditions (Founder action):**
1. Create D1 database: `wrangler d1 create verify-usage-ledger`
2. Apply migration: `wrangler d1 execute verify-usage-ledger --file migrations/001_usage_ledger.sql --remote`
3. Create queue: `wrangler queues create verify-usage-events`
4. Confirm DO binding in CF account

**Deploy command:**
```bash
cd apps/verify-runtime
wrangler deploy --env staging   # NOT production until full smoke pass
```

**Smoke tests (5 required):**
```bash
# 1. Tenant resolution
curl -H "x-iai-tenant: iai" https://verify-runtime-staging.workers.dev/health

# 2. Quota check
curl -X POST https://verify-runtime-staging.workers.dev/quota/check \
  -d '{"tenant":"iai","workspace":"ws_001","amount":1}'

# 3. Quota increment + enforce
seq 1 20 | xargs -P20 -I{} curl -s -X POST \
  https://verify-runtime-staging.workers.dev/quota/increment \
  -d '{"tenant":"iai","workspace":"ws_001","amount":1}' \
  -w "%{http_code}\n" | sort | uniq -c
# Expected: N x 200, (20-N) x 429

# 4. Usage event emit
curl -X POST https://verify-runtime-staging.workers.dev/usage/emit \
  -d '{"event_type":"chat_run","usage_amount":1,"unit":"run_count","tenant":"iai","workspace_id":"ws_001"}'

# 5. D1 query verify
wrangler d1 execute verify-usage-ledger --command "SELECT COUNT(*) FROM usage_events;"
```

---

### Phase 3 — Wire verify-runtime into aiagent.iai.one (2 ngày)

**Goal:** `api.aiagent.iai.one` calls `verify-runtime` for quota checks instead of KV TOCTOU.

**Architecture:**
```
handleChat (index.ts)
  → fetch("https://verify-runtime.workers.dev/quota/increment", ...)
  → if 429: return 402 QUOTA_EXCEEDED to client
  → if 200: proceed with AI call
```

**Alternative (more efficient):** Import verify-runtime as a service binding:
```toml
# In aiagent.iai.one wrangler.toml
[[services]]
binding = "VERIFY_RUNTIME"
service = "verify-runtime"
```

Then in index.ts:
```typescript
const quotaResp = await env.VERIFY_RUNTIME.fetch(
  new Request("https://verify-runtime/quota/increment", { method: "POST", body: JSON.stringify({...}) })
);
```

---

## DIRTY FILES TO HANDLE (không liên quan verify-runtime)

```
M  apps/noos-web/src/data.ts          ← noos-web team
M  apps/noos-web/src/render.ts        ← noos-web team
M  apps/pay/src/payment-webhook-tenant-registry.ts  ← pay team
M  trust-iai-one-starter/.gitignore   ← cleanup commit
?? apps/developer/public/*" 2"        ← duplicate files, DELETE them
?? pay.iai.one/                       ← new sub-project, needs own commit
```

**Cleanup command for duplicates:**
```bash
cd /Users/tranhatam/Documents/Devnewproject/iai-platform-fresh
rm "apps/developer/public/404 2.html"
rm "apps/developer/public/_headers 2"
rm "apps/developer/public/_redirects 2"
rm -rf "apps/developer/public/api 2/"
rm "apps/developer/public/index 2.html"
```

---

## SUMMARY — COMPLETION ROADMAP

| Phase | Việc | Effort | Status |
|---|---|---|---|
| 1 | Scaffold + tests (tenant, quota, usage) | Done | ✅ `bba7493` |
| 2A | Wire real DurableObject | 1-2 ngày | 🔲 |
| 2B | D1 usage ledger | 1 ngày | 🔲 |
| 2C | Queue async emission | 0.5 ngày | 🔲 |
| 2D | Staging deploy + smoke | 0.5 ngày | 🔲 |
| 3 | Wire into aiagent.iai.one | 2 ngày | 🔲 |
| **Total remaining** | | **~5-6 ngày** | |

**Founder gates required (no code):**
- [ ] Create D1 database `verify-usage-ledger`
- [ ] Create queue `verify-usage-events`
- [ ] Approve DO deployment in CF account
- [ ] Confirm tenant list (`iai, dsts, nhachung, muonnoi, aal`) matches current plan

---

*Handoff by: Claude (OL audit)*
*2026-05-30*
