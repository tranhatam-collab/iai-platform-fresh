import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

/** Largest request body, in bytes, that this skeleton reads before it answers 413. */
export const maxBodyBytes = 16 * 1024;

/** A body above this size is refused without being read to its end. */
export const drainLimitBytes = 64 * 1024;

export interface ContractRoute {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path template; "{name}" stands for exactly one path segment. */
  readonly path: string;
}

/** The only requests that get a 501. Everything else is 404 or 405. */
export const contractRoutes: readonly ContractRoute[] = [
  { method: "GET", path: "/v1/missions" },
  { method: "POST", path: "/v1/missions" },
  { method: "GET", path: "/v1/missions/{missionId}" },
  { method: "GET", path: "/v1/twins" },
  { method: "POST", path: "/v1/twins" },
  { method: "GET", path: "/v1/twins/{twinId}" },
  { method: "PATCH", path: "/v1/twins/{twinId}" },
  { method: "GET", path: "/v1/interplanetary-twins" },
  { method: "POST", path: "/v1/interplanetary-twins" },
  { method: "GET", path: "/v1/interplanetary-twins/{twinId}" },
  { method: "PATCH", path: "/v1/interplanetary-twins/{twinId}" },
  { method: "POST", path: "/v1/telemetry/events" },
  { method: "GET", path: "/v1/telemetry/events/{eventId}" },
  { method: "POST", path: "/v1/intents" },
  { method: "GET", path: "/v1/intents/{intentId}" },
  { method: "POST", path: "/v1/intents/{intentId}/approve" },
  { method: "POST", path: "/v1/intents/{intentId}/reject" },
  { method: "POST", path: "/v1/intents/{intentId}/rollback" },
  { method: "GET", path: "/v1/policy-envelopes/{policyId}" },
  { method: "POST", path: "/v1/evidence-records" },
  { method: "GET", path: "/v1/evidence-records/{recordId}" },
  { method: "POST", path: "/v1/dtn-bundles" },
  { method: "GET", path: "/v1/dtn-bundles/{bundleId}" },
  { method: "GET", path: "/v1/federation-policies/{policyId}" }
];

const healthBody = { status: "not_implemented" } as const;
const notImplementedBody = { error: "not_implemented" } as const;

export function createApiNoosServer(): Server {
  const server = createServer((request, response) => {
    handle(request, response).catch(() => {
      send(response, 500, { error: "internal_error" });
    });
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? "";
  const path = pathOf(request.url);
  if (path === undefined) {
    send(response, 400, { error: "bad_request" });
    return;
  }

  if (path === "/health") {
    if (method !== "GET") {
      send(response, 405, { error: "method_not_allowed" }, { allow: "GET" });
      return;
    }
    send(response, 200, healthBody);
    return;
  }

  const matching = contractRoutes.filter((route) => matchesTemplate(route.path, path));
  if (matching.length === 0) {
    send(response, 404, { error: "not_found" });
    return;
  }
  const allowed = [...new Set(matching.map((route) => route.method))];
  if (!allowed.includes(method as ContractRoute["method"])) {
    send(response, 405, { error: "method_not_allowed" }, { allow: allowed.join(", ") });
    return;
  }

  if (!hasBearerCredential(request)) {
    send(response, 401, { error: "unauthorized" }, { "www-authenticate": "Bearer" });
    return;
  }

  if (!(await bodyFitsLimit(request))) {
    send(response, 413, { error: "payload_too_large" }, { connection: "close" });
    return;
  }

  // This skeleton has no way to check a credential, so it never identifies a caller and no route does any work.
  // Headers such as x-user-id or x-tenant-id, cookies and bearer tokens are deliberately not read.
  send(response, 501, notImplementedBody);
}

/** True when the request carries a bearer-style credential of any value. The value is never checked. */
function hasBearerCredential(request: IncomingMessage): boolean {
  const value = request.headers.authorization;
  return typeof value === "string" && /^Bearer\s+\S+$/iu.test(value);
}

/** The path of the request target, or undefined when the target is not an origin-form path. */
function pathOf(target: string | undefined): string | undefined {
  if (target === undefined || !target.startsWith("/") || target.startsWith("//")) {
    return undefined;
  }
  return target.split(/[?#]/u, 1)[0];
}

function matchesTemplate(template: string, path: string): boolean {
  const wanted = template.split("/");
  const actual = path.split("/");
  if (wanted.length !== actual.length) {
    return false;
  }
  return wanted.every((segment, index) => {
    const part = actual[index] ?? "";
    return segment.startsWith("{") && segment.endsWith("}") ? part.length > 0 : segment === part;
  });
}

/**
 * True when the whole body arrives within maxBodyBytes. A body slightly above the limit is read to its end and
 * discarded, so the client receives the 413 instead of a reset connection. A body that is far above the limit
 * (more than drainLimitBytes, declared or counted) is refused at once and the connection is closed.
 */
function bodyFitsLimit(request: IncomingMessage): Promise<boolean> {
  const declared = request.headers["content-length"];
  if (declared !== undefined && Number(declared) > drainLimitBytes) {
    request.resume();
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let size = 0;
    let settled = false;
    const finish = (fits: boolean) => {
      if (!settled) {
        settled = true;
        resolve(fits);
      }
    };
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > drainLimitBytes) {
        finish(false);
      }
    });
    request.on("end", () => finish(size <= maxBodyBytes));
    request.on("error", () => finish(false));
  });
}

function send(
  response: ServerResponse,
  status: number,
  body: Record<string, string>,
  headers: Record<string, string> = {}
): void {
  if (response.headersSent) {
    return;
  }
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(text),
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    ...headers
  });
  response.end(text);
}
