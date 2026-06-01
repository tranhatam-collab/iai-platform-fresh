/**
 * Quota Authority — Durable Object Scaffold
 *
 * Contract:
 *  - DO chỉ làm atomic counter/state.
 *  - Ledger event vẫn phải emit riêng; DO KHÔNG là billing truth.
 *  - Founder gate required trước khi bind/deploy DO thật.
 */

export interface QuotaState {
  tenant: string;
  workspaceId: string;
  unit: string;
  used: number;
  limit: number;
  windowStart: number; // unix ms
}

export class QuotaExceededError extends Error {
  constructor(
    public readonly tenant: string,
    public readonly unit: string,
    public readonly limit: number,
    public readonly requested: number
  ) {
    super(
      `Quota exceeded for tenant ${tenant}: requested ${requested} / limit ${limit} (${unit})`
    );
    this.name = "QuotaExceededError";
  }
}

/**
 * Plain TypeScript Quota authority class.
 * In production this logic runs inside a Cloudflare Durable Object
 * to guarantee atomic read-modify-write.
 */
export class QuotaDO {
  private state: QuotaState;

  constructor(initial: QuotaState) {
    this.state = initial;
  }

  /**
   * Check whether an increment would be allowed without mutating state.
   */
  check(increment: number): { allowed: boolean; remaining: number } {
    const remaining = this.state.limit - this.state.used;
    return {
      allowed: increment <= remaining,
      remaining: Math.max(0, remaining),
    };
  }

  /**
   * Atomically increment used quota.
   * Throws QuotaExceededError if the increment would exceed limit.
   */
  increment(amount: number): QuotaState {
    if (this.state.used + amount > this.state.limit) {
      throw new QuotaExceededError(
        this.state.tenant,
        this.state.unit,
        this.state.limit,
        this.state.used + amount
      );
    }
    this.state.used += amount;
    return { ...this.state };
  }

  getState(): Readonly<QuotaState> {
    return { ...this.state };
  }
}

/**
 * Minimal local stub for Cloudflare DurableObjectState.
 * Replace with @cloudflare/workers-types once the package is installed
 * and the DO is ready for real binding.
 */
interface DurableObjectStorageStub {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
}
interface DurableObjectStateStub {
  storage: DurableObjectStorageStub;
}

/**
 * Cloudflare Durable Object wrapper stub.
 * TODO: replace stub with real DO class extending DurableObject
 * once @cloudflare/workers-types binding is configured.
 */
export class DurableObjectQuota {
  private quota: QuotaDO;

  constructor(state: DurableObjectStateStub, env: unknown) {
    const stored = state.storage.get<QuotaState>("quota_state");
    // Initial placeholder until storage is wired
    this.quota = new QuotaDO({
      tenant: "unknown",
      workspaceId: "unknown",
      unit: "run_count",
      used: 0,
      limit: 0,
      windowStart: Date.now(),
    });
  }

  async fetch(request: Request): Promise<Response> {
    // TODO: wire RPC methods: check, increment, getState
    return new Response("QuotaDO stub", { status: 501 });
  }
}
