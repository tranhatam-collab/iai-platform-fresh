/**
 * Quota Durable Object — Real Cloudflare DO Implementation
 *
 * Provides atomic per-workspace quota counter using Durable Object storage.
 * Each workspace gets its own DO instance (id = `${tenant}:${workspaceId}`).
 *
 * Request validation and counter logic live in quota-handler.ts so they can
 * be tested in Node without the `cloudflare:workers` runtime.
 */

import { DurableObject } from "cloudflare:workers";
import { handleQuotaRequest } from "./quota-handler.js";

export class QuotaDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return handleQuotaRequest(this.ctx.storage, request);
  }
}
