import { createServer, type RequestListener, type Server } from "node:http";
import { getCommerceSourceMode } from "./data.js";
import { renderCheckoutFromForm, renderRoute } from "./render.js";
import { defaultLocale, type Locale } from "./i18n.js";

async function readFormBody(req: AsyncIterable<Buffer | string>): Promise<URLSearchParams> {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return new URLSearchParams(body);
}

export function createNoosWebRequestHandler(port = Number(process.env.NOOS_WEB_PORT ?? 4320)): RequestListener {
  return async (req, res) => {
  if (!req.url || !req.method) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  let url: URL;
  try {
    url = new URL(req.url, `http://127.0.0.1:${port}`);
  } catch {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ code: "invalid_request_url" }));
    return;
  }
  const localeMatch = url.pathname.match(/^\/(en|vi)(\/.*)?$/);
  const locale = (localeMatch?.[1] as Locale | undefined) ?? defaultLocale;
  const normalizedPostPath = localeMatch?.[2] || url.pathname;

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
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
      "x-noos-commerce-source": getCommerceSourceMode(),
      ...response.headers
    });
    res.end(response.body);
  } catch (error) {
    res.writeHead(500, {
      "content-type": "application/json; charset=utf-8",
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
  };
}

export function createNoosWebServer(port = Number(process.env.NOOS_WEB_PORT ?? 4320)): Server {
  return createServer(createNoosWebRequestHandler(port));
}
