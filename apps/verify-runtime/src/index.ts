/**
 * Verify Runtime — Quota + Tenant + Usage Emission Worker
 *
 * Deploy as a Cloudflare Worker with:
 *  - Durable Object atomic quota counter
 *  - D1 usage ledger
 *  - Queue async emission
 *
 * Routes:
 *   GET  /health          → health + tenant resolution
 *   POST /quota/check     → check quota without increment
 *   POST /quota/increment → atomically increment, 429 if exceeded
 *   POST /usage/emit      → emit usage event (queue → D1 fallback → validate-only)
 */

import { resolveTenant, TenantResolutionError } from "./tenant-resolver.js";
import { QuotaDurableObject } from "./durable-object.js";
import { validateUsageEvent, emitUsageEventToD1, emitUsageEventToQueue } from "./usage-emission.js";
import type { UsageEvent } from "./usage-emission.js";

export {
  resolveTenant,
  KNOWN_TENANTS,
  type KnownTenant,
  type TenantResolutionResult,
  TenantResolutionError,
} from "./tenant-resolver.js";

export {
  QuotaDO,
  type QuotaState,
  QuotaExceededError,
} from "./quota-do.js";

export {
  type UsageEvent,
  validateUsageEvent,
  emitUsageEvent,
  emitUsageEventToD1,
  emitUsageEventToQueue,
} from "./usage-emission.js";

export { QuotaDurableObject } from "./durable-object.js";

export interface Env {
  QUOTA_DO: DurableObjectNamespace<QuotaDurableObject>;
  USAGE_LEDGER_DB?: D1Database;
  USAGE_EVENTS_QUEUE?: Queue;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      // ─── /health ───
      if (url.pathname === "/health" && request.method === "GET") {
        const resolved = resolveTenant(request);
        return Response.json({
          status: "ok",
          service: "verify-runtime",
          tenant: resolved.tenant,
          resolvedBy: resolved.resolvedBy,
        });
      }

      // ─── /quota/check ───
      if (url.pathname === "/quota/check" && request.method === "POST") {
        const body = (await request.json()) as {
          tenant: string;
          workspaceId: string;
          amount?: number;
          limit?: number;
        };
        const id = env.QUOTA_DO.idFromName(`${body.tenant}:${body.workspaceId}`);
        const stub = env.QUOTA_DO.get(id);
        const resp = await stub.fetch(
          new Request("http://do/quota", {
            method: "POST",
            body: JSON.stringify({
              action: "check",
              tenant: body.tenant,
              workspaceId: body.workspaceId,
              amount: body.amount,
              limit: body.limit,
            }),
          })
        );
        return resp;
      }

      // ─── /quota/increment ───
      if (url.pathname === "/quota/increment" && request.method === "POST") {
        const body = (await request.json()) as {
          tenant: string;
          workspaceId: string;
          amount?: number;
          limit?: number;
        };
        const id = env.QUOTA_DO.idFromName(`${body.tenant}:${body.workspaceId}`);
        const stub = env.QUOTA_DO.get(id);
        const resp = await stub.fetch(
          new Request("http://do/quota", {
            method: "POST",
            body: JSON.stringify({
              action: "increment",
              tenant: body.tenant,
              workspaceId: body.workspaceId,
              amount: body.amount,
              limit: body.limit,
            }),
          })
        );
        return resp;
      }

      // ─── /usage/emit ───
      if (url.pathname === "/usage/emit" && request.method === "POST") {
        const event = (await request.json()) as UsageEvent;
        validateUsageEvent(event);

        if (env.USAGE_EVENTS_QUEUE) {
          await emitUsageEventToQueue(event, env.USAGE_EVENTS_QUEUE);
          return Response.json({ ok: true, channel: "queue" });
        }

        if (env.USAGE_LEDGER_DB) {
          await emitUsageEventToD1(event, env.USAGE_LEDGER_DB);
          return Response.json({ ok: true, channel: "d1" });
        }

        return Response.json({ ok: true, channel: "validate-only" });
      }

      return new Response("Not Found", { status: 404 });
    } catch (err) {
      if (err instanceof TenantResolutionError) {
        return Response.json({ error: err.message }, { status: 403 });
      }
      if (err instanceof Error && err.message.includes("UsageEvent validation")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
};
