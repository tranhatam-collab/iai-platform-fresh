import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderFlowHome, renderFlowNotFound, type FlowRenderConfig } from "./render.js";

export interface FlowServerOptions extends Partial<FlowRenderConfig> {}

interface ResolvedFlowConfig extends FlowRenderConfig {}

export function createFlowServer(options: FlowServerOptions = {}): Server {
  return createServer(createFlowRequestHandler(options));
}

export function createFlowRequestHandler(options: FlowServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveConfig(options: FlowServerOptions): ResolvedFlowConfig {
  return {
    apiFlowUrl: options.apiFlowUrl ?? process.env.FLOW_API_FLOW_URL ?? "https://api.flow.iai.one",
    appUrl: options.appUrl ?? process.env.FLOW_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.FLOW_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.FLOW_DEVELOPER_URL ?? "https://developer.iai.one",
    docsUrl: options.docsUrl ?? process.env.FLOW_DOCS_URL ?? "https://docs.iai.one",
    rootUrl: options.rootUrl ?? process.env.FLOW_ROOT_URL ?? "https://iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedFlowConfig
) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const locale = resolveLocale(url, normalizeHeaderValue(request.headers["accept-language"]));

  try {
    if (method !== "GET") {
      respondJson(
        response,
        405,
        {
          ok: false,
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: t(locale, "flow.error.method")
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
            api_flow_url: config.apiFlowUrl,
            app_url: config.appUrl,
            dash_url: config.dashUrl,
            developer_url: config.developerUrl,
            docs_url: config.docsUrl,
            root_url: config.rootUrl,
            service: "iai-flow",
            status: "ok"
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/sitemap.xml") {
      respondXml(response, 200, renderFlowSitemap(), "vi");
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderFlowHome(config, locale), locale);
      return;
    }

    respondHtml(response, 404, renderFlowNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "FLOW_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "flow.error.server")
        }
      },
      locale
    );
  }
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

function respondXml(response: ServerResponse, statusCode: number, xml: string, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "public, max-age=300");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "application/xml; charset=utf-8");
  response.end(xml);
}

function renderFlowSitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://flow.iai.one/</loc>
    <xhtml:link rel="alternate" hreflang="vi" href="https://flow.iai.one/" />
    <xhtml:link rel="alternate" hreflang="en" href="https://flow.iai.one/?lang=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://flow.iai.one/" />
  </url>
</urlset>
`;
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}
