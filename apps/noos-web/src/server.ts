import { createServer } from "node:http";
import { getCommerceSourceMode } from "./data.js";
import { renderCheckoutFromForm, renderRoute } from "./render.js";
import { defaultLocale, type Locale } from "./i18n.js";

const port = Number(process.env.NOOS_WEB_PORT ?? 4320);

async function readFormBody(req: AsyncIterable<Buffer | string>): Promise<URLSearchParams> {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return new URLSearchParams(body);
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);
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
});

server.listen(port, "127.0.0.1", () => {
  console.log(`NOOS web listening on http://127.0.0.1:${port}`);
});
