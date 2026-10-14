import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

const healthBody = { status: "not_implemented" } as const;

export function createCdnServer(): Server {
  const server = createServer((request, response) => {
    try {
      handle(request, response);
    } catch {
      send(response, 500, { error: "internal_error" });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

/** Only GET /health is defined. Every other path is 404. */
function handle(request: IncomingMessage, response: ServerResponse): void {
  const path = pathOf(request.url);
  if (path === undefined) {
    send(response, 400, { error: "bad_request" });
    return;
  }

  if (path !== "/health") {
    send(response, 404, { error: "not_found" });
    return;
  }

  if (request.method !== "GET") {
    send(response, 405, { error: "method_not_allowed" }, { allow: "GET" });
    return;
  }
  send(response, 200, healthBody);
}

/** The path of the request target, or undefined when the target is not an origin-form path. */
function pathOf(target: string | undefined): string | undefined {
  if (target === undefined || !target.startsWith("/") || target.startsWith("//")) {
    return undefined;
  }
  return target.split(/[?#]/u, 1)[0];
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
