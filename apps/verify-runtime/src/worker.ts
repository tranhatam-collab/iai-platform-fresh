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
  VERIFY_RUNTIME_SERVICE_TOKEN?: string;
}

interface QuotaRequestBody {
  tenant: string;
  workspaceId: string;
  amount?: number;
  limit?: number;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return mismatch === 0;
}

function authorizeServiceRequest(request: Request, env: Env): Response | undefined {
  const expected = env.VERIFY_RUNTIME_SERVICE_TOKEN?.trim();
  if (!expected) {
    return Response.json({ error: "service_auth_not_configured" }, { status: 503 });
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const presented = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : request.headers.get("x-service-key")?.trim() ?? "";
  if (!presented || !constantTimeEqual(presented, expected)) {
    return Response.json({ error: "service_auth_required" }, { status: 401 });
  }
  return undefined;
}

function parseQuotaBody(value: unknown): QuotaRequestBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Quota request validation: body must be an object");
  }
  const body = value as Record<string, unknown>;
  if (typeof body.tenant !== "string" || body.tenant.trim() === "") {
    throw new Error("Quota request validation: tenant is required");
  }
  if (typeof body.workspaceId !== "string" || body.workspaceId.trim() === "") {
    throw new Error("Quota request validation: workspaceId is required");
  }
  if (body.amount !== undefined && (!Number.isSafeInteger(body.amount) || Number(body.amount) <= 0)) {
    throw new Error("Quota request validation: amount must be a positive safe integer");
  }
  if (body.limit !== undefined && (!Number.isSafeInteger(body.limit) || Number(body.limit) <= 0)) {
    throw new Error("Quota request validation: limit must be a positive safe integer");
  }
  return {
    tenant: body.tenant.trim(),
    workspaceId: body.workspaceId.trim(),
    ...(body.amount === undefined ? {} : { amount: Number(body.amount) }),
    ...(body.limit === undefined ? {} : { limit: Number(body.limit) }),
  };
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

      const unauthorized = authorizeServiceRequest(request, env);
      if (unauthorized) return unauthorized;

      if (url.pathname === "/quota/check" && request.method === "POST") {
        const resolved = resolveTenant(request);
        const body = parseQuotaBody(await request.json());
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
        const body = parseQuotaBody(await request.json());
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
        const resolved = resolveTenant(request);
        const event = (await request.json()) as UsageEvent;
        validateUsageEvent(event);
        if (event.tenant !== resolved.tenant) {
          return Response.json(
            { error: "tenant_mismatch", resolved: resolved.tenant, body: event.tenant },
            { status: 403 }
          );
        }

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
      if (err instanceof Error && err.message.includes("Quota request validation")) {
        return Response.json({ error: err.message }, { status: 400 });
      }
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },

  async queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      if (!env.USAGE_LEDGER_DB) {
        message.retry();
        console.error("[verify-runtime] Usage ledger D1 binding is missing; event queued for retry");
        continue;
      }

      try {
        const event = message.body as UsageEvent;
        validateUsageEvent(event);
        await emitUsageEventToD1(event, env.USAGE_LEDGER_DB);
        message.ack();
      } catch (error) {
        message.retry();
        console.error(
          `[verify-runtime] Usage event persistence failed; event queued for retry: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  },
};

export default worker;
