/**
 * Quota Durable Object — Real Cloudflare DO Implementation
 *
 * Provides atomic per-workspace quota counter using Durable Object storage.
 * Each workspace gets its own DO instance (id = `${tenant}:${workspaceId}`).
 */

import { DurableObject } from "cloudflare:workers";
import type { QuotaState } from "./quota-do.js";

interface QuotaRequest {
  action: "check" | "increment" | "getState";
  tenant: string;
  workspaceId: string;
  amount?: number;
  limit?: number;
}

function requirePositiveSafeInteger(value: number | undefined, fallback: number, field: string): number {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved <= 0) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return resolved;
}

export class QuotaDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const body = (await request.json()) as QuotaRequest;

    if (!body.tenant?.trim() || !body.workspaceId?.trim()) {
      return Response.json({ error: "tenant_and_workspace_required" }, { status: 400 });
    }

    if (body.action === "check") {
      const state = await this.getState(body);
      const remaining = state.limit - state.used;
      const amount = requirePositiveSafeInteger(body.amount, 1, "amount");
      return Response.json({ allowed: amount <= remaining, remaining });
    }

    if (body.action === "increment") {
      const state = await this.getState(body);
      const amount = requirePositiveSafeInteger(body.amount, 1, "amount");
      if (state.used + amount > state.limit) {
        return Response.json(
          { error: "quota_exceeded", used: state.used, limit: state.limit },
          { status: 429 }
        );
      }
      state.used += amount;
      await this.ctx.storage.put<QuotaState>("quota_state", state);
      return Response.json(state);
    }

    if (body.action === "getState") {
      const state = await this.getState(body);
      return Response.json(state);
    }

    return new Response("Unknown action", { status: 400 });
  }

  private async getState(body: QuotaRequest): Promise<QuotaState> {
    const stored = await this.ctx.storage.get<QuotaState>("quota_state");
    if (stored) return stored;

    const fresh: QuotaState = {
      tenant: body.tenant,
      workspaceId: body.workspaceId,
      unit: "run_count",
      used: 0,
      limit: requirePositiveSafeInteger(body.limit, 100, "limit"),
      windowStart: Date.now(),
    };
    await this.ctx.storage.put<QuotaState>("quota_state", fresh);
    return fresh;
  }
}
