import { createHash, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderNftHome, renderNftNotFound, type NftRenderConfig } from "./render.js";

export interface NftServerOptions extends Partial<NftRenderConfig> {}

interface ResolvedNftConfig extends NftRenderConfig {}

interface AuditEvent {
  eventName: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface NftRuntimeState {
  auditEvents: AuditEvent[];
  proxyTokens: Map<string, { action: string; assetId: string }>;
  stepChallenges: Set<string>;
  stepSessions: Set<string>;
  walletChallenges: Map<string, { action: string; assetId?: string; walletId: string }>;
  walletProofs: Set<string>;
}

export function createNftServer(options: NftServerOptions = {}): Server {
  return createServer(createNftRequestHandler(options));
}

export function createNftRequestHandler(options: NftServerOptions = {}) {
  const config = resolveConfig(options);
  const state = createRuntimeState();

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config, state);
  };
}

function resolveConfig(options: NftServerOptions): ResolvedNftConfig {
  return {
    appUrl: options.appUrl ?? process.env.NFT_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.NFT_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.NFT_DEVELOPER_URL ?? "https://developer.iai.one",
    flowUrl: options.flowUrl ?? process.env.NFT_FLOW_URL ?? "https://flow.iai.one",
    homeUrl: options.homeUrl ?? process.env.NFT_HOME_URL ?? "https://home.iai.one",
    rootUrl: options.rootUrl ?? process.env.NFT_ROOT_URL ?? "https://iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedNftConfig,
  state: NftRuntimeState
) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const locale = resolveLocale(url, normalizeHeaderValue(request.headers["accept-language"]));

  try {
    if (await handleNftApiRequest(request, response, method, url, locale, state)) {
      return;
    }

    if (method !== "GET") {
      respondJson(
        response,
        405,
        {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: t(locale, "nft.error.method")
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/health") {
      respondJson(
        response,
        200,
        {
          ok: true,
          data: {
            app_url: config.appUrl,
            dash_url: config.dashUrl,
            developer_url: config.developerUrl,
            flow_url: config.flowUrl,
            home_url: config.homeUrl,
            root_url: config.rootUrl,
            service: "iai-nft",
            status: "ok"
          }
        },
        locale
      );
      return;
    }

    if (url.pathname.startsWith("/api/metadata/iai-genesis-pass/")) {
      recordAuditEvent(state, "raw_url.blocked", { path: url.pathname });
      respondJson(
        response,
        403,
        {
          ok: false,
          error: {
            code: "RAW_URL_BLOCKED",
            message: "Raw asset URLs are blocked. Use the gated proxy download flow."
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderNftHome(config, locale), locale);
      return;
    }

    respondHtml(response, 404, renderNftNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "NFT_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "nft.error.server")
        }
      },
      locale
    );
  }
}

async function handleNftApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  method: string,
  url: URL,
  locale: Locale,
  state: NftRuntimeState
): Promise<boolean> {
  if (!url.pathname.startsWith("/v1/nft/")) {
    return false;
  }

  if (url.pathname === "/v1/nft/audit") {
    if (method !== "GET") {
      respondMethodNotAllowed(response, locale);
      return true;
    }

    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const items = state.auditEvents.slice(0, Number.isFinite(limit) ? Math.max(1, limit) : 50);
    respondJson(response, 200, { ok: true, data: { items } }, locale);
    return true;
  }

  const downloadMatch = url.pathname.match(/^\/v1\/nft\/assets\/([^/]+)\/download$/);
  if (downloadMatch) {
    if (method !== "GET") {
      respondMethodNotAllowed(response, locale);
      return true;
    }

    const assetId = decodeURIComponent(downloadMatch[1] ?? "");
    const proxyTokenId = url.searchParams.get("proxy_token_id")?.trim() ?? "";
    const token = state.proxyTokens.get(proxyTokenId);

    if (!token || token.assetId !== assetId) {
      recordAuditEvent(state, "download.denied", { assetId });
      respondJson(response, 403, { ok: false, error: { code: "PROXY_TOKEN_INVALID" } }, locale);
      return true;
    }

    recordAuditEvent(state, "download.started", { assetId });
    recordAuditEvent(state, "download.completed", { assetId });
    respondJson(response, 200, { ok: true, data: { download_status: "completed" } }, locale);
    return true;
  }

  if (method !== "POST") {
    respondMethodNotAllowed(response, locale);
    return true;
  }

  const body = await readJsonBody(request);

  if (url.pathname === "/v1/nft/security/step-up/challenge") {
    const challengeNonce = `step_${randomUUID()}`;
    state.stepChallenges.add(challengeNonce);
    recordAuditEvent(state, "step_up.challenge.issued");
    respondJson(response, 200, { ok: true, data: { challenge_nonce: challengeNonce } }, locale);
    return true;
  }

  if (url.pathname === "/v1/nft/security/step-up/verify") {
    const challengeNonce = stringField(body, "challenge_nonce");
    const authenticatorResponse = stringField(body, "authenticator_response");

    if (!challengeNonce || !state.stepChallenges.has(challengeNonce) || authenticatorResponse !== "passkey_ok") {
      respondJson(response, 401, { ok: false, error: { code: "STEP_UP_INVALID" } }, locale);
      return true;
    }

    state.stepChallenges.delete(challengeNonce);
    const stepUpSessionId = `step_session_${randomUUID()}`;
    state.stepSessions.add(stepUpSessionId);
    recordAuditEvent(state, "step_up.verified");
    respondJson(response, 200, { ok: true, data: { step_up_session_id: stepUpSessionId } }, locale);
    return true;
  }

  if (url.pathname === "/v1/nft/wallet-proof/challenge") {
    const walletId = stringField(body, "wallet_id");
    const action = stringField(body, "action") ?? "download";
    const assetId = stringField(body, "asset_id_optional") ?? undefined;

    if (!walletId) {
      respondJson(response, 400, { ok: false, error: { code: "WALLET_ID_REQUIRED" } }, locale);
      return true;
    }

    const challengeNonce = `wallet_${randomUUID()}`;
    state.walletChallenges.set(challengeNonce, { action, assetId, walletId });
    recordAuditEvent(state, "wallet.proof.challenge.issued", { assetId, walletId });
    respondJson(response, 200, { ok: true, data: { challenge_nonce: challengeNonce } }, locale);
    return true;
  }

  if (url.pathname === "/v1/nft/wallet-proof/verify") {
    const challengeNonce = stringField(body, "challenge_nonce");
    const signature = stringField(body, "signature");

    if (!challengeNonce || !state.walletChallenges.has(challengeNonce) || signature !== `sig:${challengeNonce}`) {
      respondJson(response, 401, { ok: false, error: { code: "WALLET_PROOF_INVALID" } }, locale);
      return true;
    }

    const challenge = state.walletChallenges.get(challengeNonce);
    state.walletChallenges.delete(challengeNonce);
    const signatureProofId = `wallet_proof_${randomUUID()}`;
    state.walletProofs.add(signatureProofId);
    recordAuditEvent(state, "wallet.proof.verified", {
      assetId: challenge?.assetId,
      walletId: challenge?.walletId
    });
    respondJson(response, 200, { ok: true, data: { signature_proof_id: signatureProofId } }, locale);
    return true;
  }

  const assetAccessMatch = url.pathname.match(/^\/v1\/nft\/assets\/([^/]+)\/access-check$/);
  if (assetAccessMatch) {
    const assetId = decodeURIComponent(assetAccessMatch[1] ?? "");
    const decision = evaluateAssetAccess(assetId, body, state);
    recordAuditEvent(state, decision === "allow" ? "access.allowed" : "access.denied", { assetId, decision });
    respondJson(
      response,
      200,
      {
        ok: true,
        data: {
          decision,
          requires_step_up: decision === "need_step_up",
          requires_wallet_proof: decision === "need_wallet_proof"
        }
      },
      locale
    );
    return true;
  }

  const proxyTokenMatch = url.pathname.match(/^\/v1\/nft\/assets\/([^/]+)\/proxy-token$/);
  if (proxyTokenMatch) {
    const assetId = decodeURIComponent(proxyTokenMatch[1] ?? "");
    const decision = evaluateAssetAccess(assetId, body, state);

    if (decision !== "allow") {
      recordAuditEvent(state, "access.denied", { assetId, decision });
      respondJson(response, 403, { ok: false, error: { code: "ACCESS_NOT_ALLOWED", decision } }, locale);
      return true;
    }

    const tokenId = `proxy_${randomUUID()}`;
    state.proxyTokens.set(tokenId, { action: stringField(body, "action") ?? "download", assetId });
    recordAuditEvent(state, "download.proxy_token.issued", { assetId });
    respondJson(response, 200, { ok: true, data: { proxy_token_id: tokenId } }, locale);
    return true;
  }

  if (url.pathname === "/v1/nft/partner-sync/events") {
    const result = verifyPartnerSyncHeaders(request.headers);
    if (!result.ok) {
      recordAuditEvent(state, "partner.sync.rejected", { code: result.code });
      respondJson(response, 400, { ok: false, error: { code: result.code } }, locale);
      return true;
    }

    recordAuditEvent(state, "partner.sync.accepted", {
      assetId: stringField(body, "asset_id"),
      eventName: stringField(body, "event_name")
    });
    respondJson(response, 202, { ok: true, data: { status: "accepted" } }, locale);
    return true;
  }

  respondJson(response, 404, { ok: false, error: { code: "NFT_API_NOT_FOUND" } }, locale);
  return true;
}

function createRuntimeState(): NftRuntimeState {
  return {
    auditEvents: [],
    proxyTokens: new Map(),
    stepChallenges: new Set(),
    stepSessions: new Set(),
    walletChallenges: new Map(),
    walletProofs: new Set()
  };
}

function evaluateAssetAccess(assetId: string, body: Record<string, unknown>, state: NftRuntimeState): string {
  if (assetId === "ASSET-20260324-DEMO01") {
    return "allow";
  }

  const stepUpSessionId = stringField(body, "step_up_session_id_optional");
  if (!stepUpSessionId || !state.stepSessions.has(stepUpSessionId)) {
    return "need_step_up";
  }

  const signatureProofId = stringField(body, "signature_proof_id_optional");
  if (!signatureProofId || !state.walletProofs.has(signatureProofId)) {
    return "need_wallet_proof";
  }

  return "allow";
}

function verifyPartnerSyncHeaders(headers: IncomingMessage["headers"]): { code: string; ok: false } | { ok: true } {
  const idempotencyKey = normalizeHeaderValue(headers["x-idempotency-key"]);
  const signature = normalizeHeaderValue(headers["x-partner-signature"]);
  const sourceTimestamp = normalizeHeaderValue(headers["x-source-timestamp"]);

  if (!idempotencyKey || !signature || !sourceTimestamp) {
    return { code: "PARTNER_SYNC_SIGNATURE_REQUIRED", ok: false };
  }

  const timestampMs = Date.parse(sourceTimestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return { code: "PARTNER_SYNC_STALE", ok: false };
  }

  const expected = `sha256:${createHash("sha256")
    .update(`${idempotencyKey}:${sourceTimestamp}:vc.vetuonglai.com`)
    .digest("hex")}`;

  if (signature !== expected) {
    return { code: "PARTNER_SYNC_SIGNATURE_INVALID", ok: false };
  }

  return { ok: true };
}

function recordAuditEvent(
  state: NftRuntimeState,
  eventName: string,
  metadata?: Record<string, unknown>
): void {
  state.auditEvents.unshift({
    eventName,
    metadata,
    timestamp: new Date().toISOString()
  });
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  const parsed = JSON.parse(rawBody) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function stringField(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function respondMethodNotAllowed(response: ServerResponse, locale: Locale): void {
  respondJson(
    response,
    405,
    {
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: t(locale, "nft.error.method")
      }
    },
    locale
  );
}

function respondHtml(response: ServerResponse, statusCode: number, html: string, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(html);
}

function respondJson(response: ServerResponse, statusCode: number, payload: unknown, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "no-store");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}
