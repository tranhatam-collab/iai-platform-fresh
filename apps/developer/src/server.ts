import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import {
  renderDeveloperHome,
  renderDeveloperRequiredRoute,
  renderDeveloperNotFound,
  type DeveloperRequiredRoutePath,
  type DeveloperRenderConfig
} from "./render.js";

export interface DeveloperServerOptions extends Partial<DeveloperRenderConfig> {}

interface ResolvedDeveloperConfig extends DeveloperRenderConfig {}

const requiredDeveloperRoutes = new Set<DeveloperRequiredRoutePath>([
  "/quickstart",
  "/auth",
  "/api/reference",
  "/webhooks",
  "/sdk",
  "/nodes",
  "/changelog"
]);

export function createDeveloperServer(options: DeveloperServerOptions = {}): Server {
  return createServer(createDeveloperRequestHandler(options));
}

export function createDeveloperRequestHandler(options: DeveloperServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveConfig(options: DeveloperServerOptions): ResolvedDeveloperConfig {
  return {
    apiUrl: options.apiUrl ?? process.env.DEVELOPER_API_URL ?? "https://api.iai.one",
    appUrl: options.appUrl ?? process.env.DEVELOPER_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.DEVELOPER_DASH_URL ?? "https://dash.iai.one",
    docsUrl: options.docsUrl ?? process.env.DEVELOPER_DOCS_URL ?? "https://docs.iai.one",
    flowApiUrl:
      options.flowApiUrl ?? process.env.DEVELOPER_FLOW_API_URL ?? "https://api.flow.iai.one",
    flowUrl: options.flowUrl ?? process.env.DEVELOPER_FLOW_URL ?? "https://flow.iai.one",
    homeUrl: options.homeUrl ?? process.env.DEVELOPER_HOME_URL ?? "https://home.iai.one",
    rootUrl: options.rootUrl ?? process.env.DEVELOPER_ROOT_URL ?? "https://iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedDeveloperConfig
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
            message: t(locale, "developer.error.method")
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
            api_url: config.apiUrl,
            app_url: config.appUrl,
            dash_url: config.dashUrl,
            docs_url: config.docsUrl,
            flow_api_url: config.flowApiUrl,
            flow_url: config.flowUrl,
            home_url: config.homeUrl,
            root_url: config.rootUrl,
            service: "iai-developer",
            status: "ok"
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/sitemap.xml") {
      respondXml(response, 200, renderDeveloperSitemap(), "vi");
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderDeveloperHome(config, locale), locale);
      return;
    }

    if (isDeveloperRequiredRoute(url.pathname)) {
      respondHtml(response, 200, renderDeveloperRequiredRoute(config, locale, url.pathname), locale);
      return;
    }

    respondHtml(response, 404, renderDeveloperNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "DEVELOPER_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "developer.error.server")
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

function renderDeveloperSitemap(): string {
  const routes = ["/", ...requiredDeveloperRoutes];
  const urls = routes
    .map((route) => {
      const loc = `https://developer.iai.one${route}`;
      const en = route === "/" ? "https://developer.iai.one/?lang=en" : `${loc}?lang=en`;

      return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="vi" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}

function isDeveloperRequiredRoute(path: string): path is DeveloperRequiredRoutePath {
  return requiredDeveloperRoutes.has(path as DeveloperRequiredRoutePath);
}
