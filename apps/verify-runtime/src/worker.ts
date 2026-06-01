/**
 * Verify Runtime fetch handler.
 *
 * Keep this module free of `cloudflare:*` runtime imports so Node tests can
 * import and exercise route behavior without a Workers loader.
 */

import { resolveTenant, TenantResolutionError } from "./tenant-resolver.js";
import { validateUsageEvent, emitUsageEventToD1, emitUsageEventToQueue } from "./usage-emission.js";
import type { UsageEvent } from "./usage-emission.js";

export interface Env {
  QUOTA_DO: DurableObjectNamespace;
  USAGE_LEDGER_DB?: D1Database;
  USAGE_EVENTS_QUEUE?: Queue;
}

export const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Tenant-independent: load balancers may not send tenant headers.
      if (url.pathname === "/health" && request.method === "GET") {
        let resolved: { tenant: string; resolvedBy: string } | undefined;
        try {
          const r = resolveTenant(request);
          resolved = { tenant: r.tenant, resolvedBy: r.resolvedBy };
        } catch {
          // optional — health still ok without tenant
        }
        return Response.json({
          status: "ok",
          service: "verify-runtime",
          ...(resolved ? { tenant: resolved.tenant, resolvedBy: resolved.resolvedBy } : {}),
        });
      }

      if (url.pathname === "/quota/check" && request.method === "POST") {
        const resolved = resolveTenant(request);
        const body = (await request.json()) as {
          tenant: string;
          workspaceId: string;
          amount?: number;
          limit?: number;
        };
        if (body.tenant !== resolved.tenant) {
          return Response.json(
            { error: "tenant_mismatch", resolved: resolved.tenant, body: body.tenant },
            { status: 403 }
          );
        }
        const id = env.QUOTA_DO.idFromName(`${resolved.tenant}:${body.workspaceId}`);
        const stub = env.QUOTA_DO.get(id);
        return stub.fetch(
          new Request("http://do/quota", {
            method: "POST",
            body: JSON.stringify({
              action: "check",
              tenant: resolved.tenant,
              workspaceId: body.workspaceId,
              amount: body.amount,
              limit: body.limit,
            }),
          })
        );
      }

      if (url.pathname === "/quota/increment" && request.method === "POST") {
        const resolved = resolveTenant(request);
        const body = (await request.json()) as {
          tenant: string;
          workspaceId: string;
          amount?: number;
          limit?: number;
        };
        if (body.tenant !== resolved.tenant) {
          return Response.json(
            { error: "tenant_mismatch", resolved: resolved.tenant, body: body.tenant },
            { status: 403 }
          );
        }
        const id = env.QUOTA_DO.idFromName(`${resolved.tenant}:${body.workspaceId}`);
        const stub = env.QUOTA_DO.get(id);
        return stub.fetch(
          new Request("http://do/quota", {
            method: "POST",
            body: JSON.stringify({
              action: "increment",
              tenant: resolved.tenant,
              workspaceId: body.workspaceId,
              amount: body.amount,
              limit: body.limit,
            }),
          })
        );
      }

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

  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      const event = message.body as UsageEvent;
      validateUsageEvent(event);

      if (env.USAGE_LEDGER_DB) {
        await emitUsageEventToD1(event, env.USAGE_LEDGER_DB);
      } else {
        // D1 not bound — drop silently during pre-staging phase
        // eslint-disable-next-line no-console
        console.warn(`[verify-runtime] Dropped usage event ${event.event_id}: D1 not bound`);
      }
    }
  },
};

export default worker;
