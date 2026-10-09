import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { getCommerceSourceMode, isCommerceDataReadable } from "./data.js";
import { renderCheckoutFromForm, renderRoute } from "./render.js";
import { defaultLocale, type Locale } from "./i18n.js";

export interface NoosWebServerOptions {
  /** Directory holding the commerce documents that /ready checks. Defaults to `docs/noos`. */
  docsRoot?: string;
  port?: number;
}

// A checkout form is a handful of short fields; anything larger is not a real checkout.
const MAX_FORM_BODY_BYTES = 64 * 1024;

class FormBodyTooLargeError extends Error {}

async function readFormBody(req: IncomingMessage): Promise<URLSearchParams> {
  const declaredLength = Number(req.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FORM_BODY_BYTES) {
    throw new FormBodyTooLargeError();
  }

  const chunks: Buffer[] = [];
  let size = 0;
  // destroyOnReturn: false keeps the socket open so the 413 below can still be written.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer);
    size += buffer.length;
    if (size > MAX_FORM_BODY_BYTES) {
      throw new FormBodyTooLargeError();
    }
    chunks.push(buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function respondPayloadTooLarge(req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(413, {
    connection: "close",
    "content-type": "text/plain; charset=utf-8",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff"
  });
  res.end("Payload too large");
  // Discard the rest of the upload without buffering it.
  req.resume();
}

// Pages are rendered from string templates with no executable scripts. `style-src 'unsafe-inline'`
// stays because the templates inline their stylesheet and style attributes. Product images come
// from the placeholder image host.
const CONTENT_SECURITY_POLICY =
  "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; " +
  "img-src 'self' data: https://picsum.photos; style-src 'unsafe-inline'; script-src 'none'";

function parseRequestUrl(requestUrl: string, port: number): URL | null {
  try {
    return new URL(requestUrl, `http://127.0.0.1:${port}`);
  } catch {
    return null;
  }
}

function respondBadRequest(res: ServerResponse): void {
  res.writeHead(400, {
    "content-type": "text/plain; charset=utf-8",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff"
  });
  res.end("Bad request");
}

function respondUnhandledError(res: ServerResponse, error: unknown): void {
  console.error("[noos-web] unhandled request error", error);

  try {
    if (res.headersSent) {
      res.destroy();
      return;
    }

    res.writeHead(500, {
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff"
    });
    res.end(JSON.stringify({ code: "noos_web_render_error", message: "Unexpected server error" }, null, 2));
  } catch {
    // The socket is already gone, so there is nothing left to send.
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  port: number,
  docsRoot?: string
): Promise<void> {
  if (!req.url || !req.method) {
    respondBadRequest(res);
    return;
  }

  const url = parseRequestUrl(req.url, port);
  if (!url) {
    respondBadRequest(res);
    return;
  }

  const localeMatch = url.pathname.match(/^\/(en|vi)(\/.*)?$/);
  const locale = (localeMatch?.[1] as Locale | undefined) ?? defaultLocale;
  const normalizedPostPath = localeMatch?.[2] || url.pathname;

  if (url.pathname === "/health") {
    res.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff"
    });
    res.end(
      JSON.stringify(
        { status: "ok", service: "noos-web", port, commerceSourceMode: getCommerceSourceMode() },
        null,
        2
      )
    );
    return;
  }

  // /health says the process is up; /ready says the data every page is built from can be read.
  if (url.pathname === "/ready") {
    const ready = isCommerceDataReadable(docsRoot);
    res.writeHead(ready ? 200 : 503, {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff"
    });
    res.end(JSON.stringify({ status: ready ? "ready" : "not_ready", service: "noos-web" }, null, 2));
    return;
  }

  try {
    const response =
      req.method === "POST" && normalizedPostPath === "/checkout"
        ? await renderCheckoutFromForm(await readFormBody(req), locale)
        : await renderRoute(url.pathname, url.searchParams);

    res.writeHead(response.status, {
      "content-type": response.contentType,
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      ...(response.contentType.startsWith("text/html")
        ? { "content-security-policy": CONTENT_SECURITY_POLICY, "x-frame-options": "DENY" }
        : {}),
      "x-noos-commerce-source": getCommerceSourceMode(),
      ...response.headers
    });
    res.end(response.body);
  } catch (error) {
    if (error instanceof FormBodyTooLargeError) {
      respondPayloadTooLarge(req, res);
      return;
    }
    // Upstream and filesystem errors carry URLs and paths; keep them in the server log only.
    console.error("[noos-web] render error", error);
    res.writeHead(500, {
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      "x-noos-commerce-source": getCommerceSourceMode()
    });
    res.end(JSON.stringify({ code: "noos_web_render_error", message: "Unexpected server error" }, null, 2));
  }
}

export function createNoosWebServer(options: NoosWebServerOptions = {}): Server {
  const port = options.port ?? Number(process.env.NOOS_WEB_PORT ?? 4320);

  return createServer((req, res) => {
    handleRequest(req, res, port, options.docsRoot).catch((error: unknown) => {
      respondUnhandledError(res, error);
    });
  });
}
