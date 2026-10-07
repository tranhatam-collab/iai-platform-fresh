/**
 * Verify Runtime fetch handler.
 *
 * Keep this module free of `cloudflare:*` runtime imports so Node tests can
 * import and exercise route behavior without a Workers loader.
 */

import { resolveTenant, TenantResolutionError } from "./tenant-resolver.js";
import {
  validateUsageEvent,
  emitUsageEventToD1,
  emitUsageEventToQueue,
  UsageEventValidationError,
} from "./usage-emission.js";
import {
  RequestValidationError,
  parseQuotaAmount,
  parseQuotaIdentifier,
  parseQuotaLimit,
  readJsonObject,
} from "./request-validation.js";

export interface Env {
  QUOTA_DO: DurableObjectNamespace;
  USAGE_LEDGER_DB?: D1Database;
  USAGE_EVENTS_QUEUE?: Queue;
}

/**
 * Validate a /quota/* request and forward it to the workspace's Durable Object.
 *
 * Input is validated here as well as inside the Durable Object so malformed
 * requests are rejected before a Durable Object instance is addressed (an
 * undefined workspaceId would otherwise map to a shared `iai:undefined` bucket).
 */
async function forwardQuotaRequest(
  action: "check" | "increment",
  request: Request,
  env: Env
): Promise<Response> {
  const resolved = resolveTenant(request);
  const body = await readJsonObject(request);

  const tenant = parseQuotaIdentifier(body.tenant, "tenant");
  if (tenant !== resolved.tenant) {
    return Response.json(
      { error: "tenant_mismatch", resolved: resolved.tenant, body: tenant },
      { status: 403 }
    );
  }
  const workspaceId = parseQuotaIdentifier(body.workspaceId, "workspaceId");
  const amount = parseQuotaAmount(body.amount);
  const limit = parseQuotaLimit(body.limit);

  const id = env.QUOTA_DO.idFromName(`${resolved.tenant}:${workspaceId}`);
  const stub = env.QUOTA_DO.get(id);
  return stub.fetch(
    new Request("http://do/quota", {
      method: "POST",
      body: JSON.stringify({ action, tenant: resolved.tenant, workspaceId, amount, limit }),
    })
  );
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
        return await forwardQuotaRequest("check", request, env);
      }

      if (url.pathname === "/quota/increment" && request.method === "POST") {
        return await forwardQuotaRequest("increment", request, env);
      }

      if (url.pathname === "/usage/emit" && request.method === "POST") {
        const event = await readJsonObject(request);
        // Rejects unknown tenants, non-finite amounts and non-ISO timestamps.
        validateUsageEvent(event);

        // Same rule as the quota routes: the event must belong to the tenant the request resolves to.
        const resolved = resolveTenant(request);
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
      if (err instanceof RequestValidationError) {
        return err.toResponse();
      }
      if (err instanceof UsageEventValidationError) {
        return Response.json({ error: err.message }, { status: 400 });
      }
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },

  /**
   * Queue delivery is at-least-once, so every message is handled on its own:
   * D1 inserts are idempotent on event_id (a redelivered event is a no-op), an
   * invalid message can never succeed and is acknowledged and dropped (it must
   * not block or fail the rest of the batch), and a transient D1 failure
   * retries only that message.
   */
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        const event: unknown = message.body;
        validateUsageEvent(event);

        if (env.USAGE_LEDGER_DB) {
          const inserted = await emitUsageEventToD1(event, env.USAGE_LEDGER_DB);
          if (!inserted) {
            // eslint-disable-next-line no-console
            console.warn(`[verify-runtime] Ignored duplicate usage event ${event.event_id}`);
          }
        } else {
          // D1 not bound — drop silently during pre-staging phase
          // eslint-disable-next-line no-console
          console.warn(`[verify-runtime] Dropped usage event ${event.event_id}: D1 not bound`);
        }
        message.ack();
      } catch (err) {
        if (err instanceof UsageEventValidationError) {
          // eslint-disable-next-line no-console
          console.error(`[verify-runtime] Dropped invalid usage event: ${err.message}`);
          message.ack();
        } else {
          // eslint-disable-next-line no-console
          console.error("[verify-runtime] Usage event delivery failed; will retry", err);
          message.retry();
        }
      }
    }
  },
};

export default worker;
