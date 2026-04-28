/**
 * Inbound webhook handler for the mail lane.
 *
 * Contract (locked here so receiver tenants can sign correctly):
 *   POST /v1/webhooks/inbound
 *   Headers (case-insensitive):
 *     content-type: application/json
 *     x-mail-webhook-timestamp: <unix_seconds>
 *     x-mail-webhook-signature: <lowercase hex HMAC-SHA256(secret,
 *                                  `${timestamp}.${rawBody}`)>
 *   Body: provider-shaped JSON (we do not interpret here yet; we only
 *   sign-verify, persist evidence, and return 202 if accepted).
 *
 * Replay window: ±300 seconds (configurable via factory option).
 *
 * The secret is read from `MAIL_API_WEBHOOK_SECRET` at request time so
 * rotations take effect without a process restart.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface InboundWebhookEvidenceRecord {
  receivedAt: string;
  evidenceId: string;
  signatureValid: boolean;
  timestampSkewSeconds: number;
  bodyByteLength: number;
  bodyHashSha256: string;
  providerEventId: string | null;
  rejectionCode: InboundWebhookRejectionCode | null;
}

export type InboundWebhookRejectionCode =
  | "MAIL_API_WEBHOOK_SECRET_MISSING"
  | "MAIL_WEBHOOK_TIMESTAMP_MISSING"
  | "MAIL_WEBHOOK_TIMESTAMP_INVALID"
  | "MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW"
  | "MAIL_WEBHOOK_SIGNATURE_MISSING"
  | "MAIL_WEBHOOK_SIGNATURE_INVALID"
  | "MAIL_WEBHOOK_BODY_INVALID";

export interface InboundWebhookEvidenceSink {
  recordEvidence(record: InboundWebhookEvidenceRecord): Promise<void> | void;
  list?(): readonly InboundWebhookEvidenceRecord[];
  findByProviderEventId?(
    providerEventId: string
  ): InboundWebhookEvidenceRecord | undefined;
  findByEvidenceId?(
    evidenceId: string
  ): InboundWebhookEvidenceRecord | undefined;
}

export interface InboundWebhookHandlerOptions {
  /** Read the current shared secret. Defaults to `process.env.MAIL_API_WEBHOOK_SECRET`. */
  resolveSecret?: () => string | undefined;
  /** Replay window in seconds (default 300). */
  replayWindowSeconds?: number;
  /** Now-seconds override for tests. */
  nowSeconds?: () => number;
  /** Evidence sink. Defaults to in-memory log (lost on restart). */
  evidenceSink?: InboundWebhookEvidenceSink;
  /** Max accepted body byte length (default 256 KiB). */
  maxBodyBytes?: number;
}

export const DEFAULT_INBOUND_WEBHOOK_REPLAY_WINDOW_SECONDS = 300;
export const DEFAULT_INBOUND_WEBHOOK_MAX_BODY_BYTES = 256 * 1024;

export const INBOUND_WEBHOOK_TIMESTAMP_HEADER = "x-mail-webhook-timestamp";
export const INBOUND_WEBHOOK_SIGNATURE_HEADER = "x-mail-webhook-signature";

interface VerifyOk {
  ok: true;
  timestamp: number;
  bodyHashSha256: string;
  providerEventId: string | null;
}

interface VerifyFail {
  ok: false;
  code: InboundWebhookRejectionCode;
  message: string;
  details?: Record<string, unknown>;
}

export type InboundWebhookVerifyResult = VerifyOk | VerifyFail;

export interface InboundWebhookVerifyInput {
  rawBody: string;
  timestampHeader: string | undefined;
  signatureHeader: string | undefined;
  secret: string | undefined;
  nowSeconds: number;
  replayWindowSeconds: number;
}

export function verifyInboundWebhook(input: InboundWebhookVerifyInput): InboundWebhookVerifyResult {
  const secret = (input.secret ?? "").trim();
  if (!secret) {
    return {
      ok: false,
      code: "MAIL_API_WEBHOOK_SECRET_MISSING",
      message: "MAIL_API_WEBHOOK_SECRET is required before mail-api can verify inbound webhooks."
    };
  }

  const tsHeader = (input.timestampHeader ?? "").trim();
  if (!tsHeader) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_TIMESTAMP_MISSING",
      message: `Missing ${INBOUND_WEBHOOK_TIMESTAMP_HEADER} header.`
    };
  }

  const timestamp = Number.parseInt(tsHeader, 10);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_TIMESTAMP_INVALID",
      message: `${INBOUND_WEBHOOK_TIMESTAMP_HEADER} must be a positive unix-seconds integer.`
    };
  }

  const skew = Math.abs(input.nowSeconds - timestamp);
  if (skew > input.replayWindowSeconds) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW",
      message: `Timestamp skew ${skew}s exceeds replay window ${input.replayWindowSeconds}s.`,
      details: { skew_seconds: skew, replay_window_seconds: input.replayWindowSeconds }
    };
  }

  const sigHeader = (input.signatureHeader ?? "").trim().toLowerCase();
  if (!sigHeader) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_SIGNATURE_MISSING",
      message: `Missing ${INBOUND_WEBHOOK_SIGNATURE_HEADER} header.`
    };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${input.rawBody}`)
    .digest("hex");

  if (sigHeader.length !== expected.length) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_SIGNATURE_INVALID",
      message: "Signature does not match expected HMAC-SHA256 digest."
    };
  }

  const sigOk = timingSafeEqual(Buffer.from(sigHeader, "hex"), Buffer.from(expected, "hex"));
  if (!sigOk) {
    return {
      ok: false,
      code: "MAIL_WEBHOOK_SIGNATURE_INVALID",
      message: "Signature does not match expected HMAC-SHA256 digest."
    };
  }

  // bodyHash: re-use expected (timestamp-keyed) is wrong as a body hash; recompute over body only.
  const bodyHash = createHmac("sha256", secret).update(input.rawBody).digest("hex");

  let providerEventId: string | null = null;
  try {
    const parsed = input.rawBody.length > 0 ? JSON.parse(input.rawBody) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const candidate =
        (parsed as Record<string, unknown>).provider_event_id ??
        (parsed as Record<string, unknown>).providerEventId ??
        (parsed as Record<string, unknown>).id ??
        null;
      if (typeof candidate === "string" && candidate.trim()) {
        providerEventId = candidate.trim();
      }
    }
  } catch {
    // Body is not JSON — that's still fine for signature; we just have no ID.
  }

  return {
    ok: true,
    timestamp,
    bodyHashSha256: bodyHash,
    providerEventId
  };
}

class InMemoryEvidenceSink implements InboundWebhookEvidenceSink {
  private readonly entries: InboundWebhookEvidenceRecord[] = [];

  recordEvidence(record: InboundWebhookEvidenceRecord): void {
    this.entries.push(record);
  }

  list(): readonly InboundWebhookEvidenceRecord[] {
    return this.entries;
  }

  findByProviderEventId(
    providerEventId: string
  ): InboundWebhookEvidenceRecord | undefined {
    return this.entries.find((entry) => entry.providerEventId === providerEventId);
  }

  findByEvidenceId(evidenceId: string): InboundWebhookEvidenceRecord | undefined {
    return this.entries.find((entry) => entry.evidenceId === evidenceId);
  }
}

export function createInMemoryInboundWebhookEvidenceSink(): InboundWebhookEvidenceSink & {
  list(): readonly InboundWebhookEvidenceRecord[];
  findByProviderEventId(
    providerEventId: string
  ): InboundWebhookEvidenceRecord | undefined;
  findByEvidenceId(evidenceId: string): InboundWebhookEvidenceRecord | undefined;
} {
  return new InMemoryEvidenceSink();
}

/**
 * File-backed evidence sink. Each call appends one JSON line (NDJSON) to the
 * configured path. Suitable for production single-instance use; for multi-
 * instance, point this at shared storage or replace with a DB-backed sink.
 */
class FileEvidenceSink implements InboundWebhookEvidenceSink {
  private readonly entries: InboundWebhookEvidenceRecord[] = [];

  constructor(private readonly filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          if (!line.trim()) {
            continue;
          }
          try {
            this.entries.push(JSON.parse(line) as InboundWebhookEvidenceRecord);
          } catch {
            // skip corrupt line
          }
        }
      } catch {
        // ignore unreadable file; will be overwritten on next append
      }
    }
  }

  recordEvidence(record: InboundWebhookEvidenceRecord): void {
    this.entries.push(record);
    writeFileSync(this.filePath, `${this.entries.map((e) => JSON.stringify(e)).join("\n")}\n`, "utf8");
  }

  list(): readonly InboundWebhookEvidenceRecord[] {
    return this.entries;
  }

  findByProviderEventId(
    providerEventId: string
  ): InboundWebhookEvidenceRecord | undefined {
    return this.entries.find((entry) => entry.providerEventId === providerEventId);
  }

  findByEvidenceId(evidenceId: string): InboundWebhookEvidenceRecord | undefined {
    return this.entries.find((entry) => entry.evidenceId === evidenceId);
  }
}

export function createFileInboundWebhookEvidenceSink(
  filePath: string
): InboundWebhookEvidenceSink & {
  list(): readonly InboundWebhookEvidenceRecord[];
  findByProviderEventId(
    providerEventId: string
  ): InboundWebhookEvidenceRecord | undefined;
  findByEvidenceId(evidenceId: string): InboundWebhookEvidenceRecord | undefined;
} {
  return new FileEvidenceSink(filePath);
}

/**
 * Env contract used by `resolveInboundWebhookOptionsFromEnv`.
 *
 *   MAIL_API_WEBHOOK_SECRET            (required at request time, not here —
 *                                       resolveSecret reads it on each call)
 *   MAIL_API_INBOUND_EVIDENCE_FILE     (optional; if set + non-empty, file sink)
 *   MAIL_API_INBOUND_REPLAY_WINDOW_S   (optional; default 300)
 *   MAIL_API_INBOUND_MAX_BODY_BYTES    (optional; default 262144)
 */
export interface ResolvedInboundWebhookOptions extends InboundWebhookHandlerOptions {
  /** Diagnostic only; does not affect handler behavior. */
  resolution: {
    sinkMode: "file" | "memory";
    sinkFilePath: string | null;
    replayWindowSeconds: number;
    maxBodyBytes: number;
  };
}

export function resolveInboundWebhookOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env
): ResolvedInboundWebhookOptions {
  const filePathRaw = (env.MAIL_API_INBOUND_EVIDENCE_FILE ?? "").trim();
  const sinkFilePath = filePathRaw.length > 0 ? filePathRaw : null;
  const evidenceSink: InboundWebhookEvidenceSink = sinkFilePath
    ? createFileInboundWebhookEvidenceSink(sinkFilePath)
    : createInMemoryInboundWebhookEvidenceSink();

  const replayWindowSeconds = parsePositiveIntEnv(
    env.MAIL_API_INBOUND_REPLAY_WINDOW_S,
    DEFAULT_INBOUND_WEBHOOK_REPLAY_WINDOW_SECONDS,
    "MAIL_API_INBOUND_REPLAY_WINDOW_S"
  );

  const maxBodyBytes = parsePositiveIntEnv(
    env.MAIL_API_INBOUND_MAX_BODY_BYTES,
    DEFAULT_INBOUND_WEBHOOK_MAX_BODY_BYTES,
    "MAIL_API_INBOUND_MAX_BODY_BYTES"
  );

  return {
    evidenceSink,
    replayWindowSeconds,
    maxBodyBytes,
    resolution: {
      sinkMode: sinkFilePath ? "file" : "memory",
      sinkFilePath,
      replayWindowSeconds,
      maxBodyBytes
    }
  };
}

function parsePositiveIntEnv(
  rawValue: string | undefined,
  defaultValue: number,
  envName: string
): number {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) {
    return defaultValue;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `${envName} must be a positive integer if set, got: ${JSON.stringify(rawValue)}`
    );
  }
  return parsed;
}

async function readRawBody(request: IncomingMessage, maxBytes: number): Promise<{ raw: string; tooLarge: boolean }> {
  return new Promise((resolve, reject) => {
    let total = 0;
    let tooLarge = false;
    const chunks: Buffer[] = [];

    request.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        tooLarge = true;
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      resolve({ raw: Buffer.concat(chunks).toString("utf8"), tooLarge });
    });
    request.on("error", (err) => {
      reject(err);
    });
  });
}

function getHeader(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  if (typeof value === "string") {
    return value.trim() || undefined;
  }
  return undefined;
}

function writeJson(response: ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export interface InboundWebhookHandlerResult {
  handled: boolean;
}

/**
 * Returns a function that handles inbound webhook routes:
 *   - POST /v1/webhooks/inbound          (verify + persist evidence)
 *   - GET  /v1/webhooks/inbound/evidence (ops query: by evidence_id or
 *                                          provider_event_id; or list)
 *
 * Returns `{ handled: false }` for any other request so the caller can
 * fall through to other routes.
 */
export function createInboundWebhookHandler(
  options: InboundWebhookHandlerOptions = {}
): (request: IncomingMessage, response: ServerResponse, requestId: string) => Promise<InboundWebhookHandlerResult> {
  const resolveSecret = options.resolveSecret ?? (() => process.env.MAIL_API_WEBHOOK_SECRET);
  const replayWindowSeconds = options.replayWindowSeconds ?? DEFAULT_INBOUND_WEBHOOK_REPLAY_WINDOW_SECONDS;
  const nowSeconds = options.nowSeconds ?? (() => Math.floor(Date.now() / 1000));
  const evidenceSink = options.evidenceSink ?? createInMemoryInboundWebhookEvidenceSink();
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_INBOUND_WEBHOOK_MAX_BODY_BYTES;

  return async (request, response, requestId) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    // Ops evidence query route.
    if (request.method === "GET" && url.pathname === "/v1/webhooks/inbound/evidence") {
      const providerEventId = url.searchParams.get("provider_event_id")?.trim() ?? "";
      const evidenceIdQuery = url.searchParams.get("evidence_id")?.trim() ?? "";

      if (providerEventId) {
        const found = evidenceSink.findByProviderEventId?.(providerEventId);
        if (!found) {
          writeJson(response, 404, {
            ok: false,
            error: {
              code: "MAIL_WEBHOOK_EVIDENCE_NOT_FOUND",
              message: `No inbound webhook evidence for provider_event_id=${providerEventId}.`
            },
            meta: { request_id: requestId }
          });
          return { handled: true };
        }
        writeJson(response, 200, { ok: true, data: found, meta: { request_id: requestId } });
        return { handled: true };
      }

      if (evidenceIdQuery) {
        const found = evidenceSink.findByEvidenceId?.(evidenceIdQuery);
        if (!found) {
          writeJson(response, 404, {
            ok: false,
            error: {
              code: "MAIL_WEBHOOK_EVIDENCE_NOT_FOUND",
              message: `No inbound webhook evidence for evidence_id=${evidenceIdQuery}.`
            },
            meta: { request_id: requestId }
          });
          return { handled: true };
        }
        writeJson(response, 200, { ok: true, data: found, meta: { request_id: requestId } });
        return { handled: true };
      }

      const list = evidenceSink.list?.() ?? [];
      const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 50;
      const items = list.slice(-limit).reverse();
      writeJson(response, 200, {
        ok: true,
        data: { items, total: list.length, returned: items.length, limit },
        meta: { request_id: requestId }
      });
      return { handled: true };
    }

    if (request.method !== "POST" || url.pathname !== "/v1/webhooks/inbound") {
      return { handled: false };
    }

    const evidenceId = `evt_inbound_${randomUUID()}`;
    const receivedAt = new Date().toISOString();

    let raw = "";
    try {
      const result = await readRawBody(request, maxBodyBytes);
      if (result.tooLarge) {
        const record: InboundWebhookEvidenceRecord = {
          receivedAt,
          evidenceId,
          signatureValid: false,
          timestampSkewSeconds: 0,
          bodyByteLength: -1,
          bodyHashSha256: "",
          providerEventId: null,
          rejectionCode: "MAIL_WEBHOOK_BODY_INVALID"
        };
        await evidenceSink.recordEvidence(record);
        writeJson(response, 413, {
          ok: false,
          error: {
            code: "MAIL_WEBHOOK_BODY_INVALID",
            message: `Body exceeds max ${maxBodyBytes} bytes.`
          },
          meta: { request_id: requestId, evidence_id: evidenceId }
        });
        return { handled: true };
      }
      raw = result.raw;
    } catch (error) {
      writeJson(response, 400, {
        ok: false,
        error: {
          code: "MAIL_WEBHOOK_BODY_INVALID",
          message: error instanceof Error ? error.message : "Failed to read request body."
        },
        meta: { request_id: requestId, evidence_id: evidenceId }
      });
      return { handled: true };
    }

    const verifyResult = verifyInboundWebhook({
      rawBody: raw,
      timestampHeader: getHeader(request, INBOUND_WEBHOOK_TIMESTAMP_HEADER),
      signatureHeader: getHeader(request, INBOUND_WEBHOOK_SIGNATURE_HEADER),
      secret: resolveSecret(),
      nowSeconds: nowSeconds(),
      replayWindowSeconds
    });

    if (!verifyResult.ok) {
      const record: InboundWebhookEvidenceRecord = {
        receivedAt,
        evidenceId,
        signatureValid: false,
        timestampSkewSeconds: 0,
        bodyByteLength: Buffer.byteLength(raw, "utf8"),
        bodyHashSha256: "",
        providerEventId: null,
        rejectionCode: verifyResult.code
      };
      await evidenceSink.recordEvidence(record);

      const status =
        verifyResult.code === "MAIL_API_WEBHOOK_SECRET_MISSING"
          ? 503
          : verifyResult.code === "MAIL_WEBHOOK_TIMESTAMP_OUT_OF_WINDOW"
            ? 408
            : 401;

      writeJson(response, status, {
        ok: false,
        error: {
          code: verifyResult.code,
          message: verifyResult.message,
          details: verifyResult.details
        },
        meta: { request_id: requestId, evidence_id: evidenceId }
      });
      return { handled: true };
    }

    const record: InboundWebhookEvidenceRecord = {
      receivedAt,
      evidenceId,
      signatureValid: true,
      timestampSkewSeconds: nowSeconds() - verifyResult.timestamp,
      bodyByteLength: Buffer.byteLength(raw, "utf8"),
      bodyHashSha256: verifyResult.bodyHashSha256,
      providerEventId: verifyResult.providerEventId,
      rejectionCode: null
    };
    await evidenceSink.recordEvidence(record);

    writeJson(response, 202, {
      ok: true,
      data: {
        evidence_id: evidenceId,
        provider_event_id: verifyResult.providerEventId,
        received_at: receivedAt
      },
      meta: { request_id: requestId }
    });
    return { handled: true };
  };
}
