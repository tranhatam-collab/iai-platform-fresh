import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { getCommerceSourceMode } from "./data.js";
import { renderCheckoutFromForm, renderRoute } from "./render.js";
import { defaultLocale, type Locale } from "./i18n.js";

export interface NoosWebServerOptions {
  port?: number;
}

async function readFormBody(req: AsyncIterable<Buffer | string>): Promise<URLSearchParams> {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return new URLSearchParams(body);
}

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

async function handleRequest(req: IncomingMessage, res: ServerResponse, port: number): Promise<void> {
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

  try {
    const response =
      req.method === "POST" && normalizedPostPath === "/checkout"
        ? await renderCheckoutFromForm(await readFormBody(req), locale)
        : await renderRoute(url.pathname, url.searchParams);

    res.writeHead(response.status, {
      "content-type": response.contentType,
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      ...(response.contentType.startsWith("text/html") ? { "x-frame-options": "DENY" } : {}),
      "x-noos-commerce-source": getCommerceSourceMode(),
      ...response.headers
    });
    res.end(response.body);
  } catch (error) {
    res.writeHead(500, {
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      "x-noos-commerce-source": getCommerceSourceMode()
    });
    res.end(
      JSON.stringify(
        {
          code: "noos_web_render_error",
          message: error instanceof Error ? error.message : "Unknown render error"
        },
        null,
        2
      )
    );
  }
}

export function createNoosWebServer(options: NoosWebServerOptions = {}): Server {
  const port = options.port ?? Number(process.env.NOOS_WEB_PORT ?? 4320);

  return createServer((req, res) => {
    handleRequest(req, res, port).catch((error: unknown) => {
      respondUnhandledError(res, error);
    });
  });
}
