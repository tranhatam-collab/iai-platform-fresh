import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderAppHome, renderAppNotFound, type AppRenderConfig } from "./render.js";

export interface AppServerOptions extends Partial<AppRenderConfig> {}

interface ResolvedAppConfig extends AppRenderConfig {}

export function createAppServer(options: AppServerOptions = {}): Server {
  return createServer(createAppRequestHandler(options));
}

export function createAppRequestHandler(options: AppServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveConfig(options: AppServerOptions): ResolvedAppConfig {
  return {
    dashUrl: options.dashUrl ?? process.env.APP_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.APP_DEVELOPER_URL ?? "https://developer.iai.one",
    docsUrl: options.docsUrl ?? process.env.APP_DOCS_URL ?? "https://docs.iai.one",
    flowUrl: options.flowUrl ?? process.env.APP_FLOW_URL ?? "https://flow.iai.one",
    homeUrl: options.homeUrl ?? process.env.APP_HOME_URL ?? "https://home.iai.one",
    nftUrl: options.nftUrl ?? process.env.APP_NFT_URL ?? "https://nft.iai.one",
    rootUrl: options.rootUrl ?? process.env.APP_ROOT_URL ?? "https://iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedAppConfig
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
            message: t(locale, "app.error.method")
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
            dash_url: config.dashUrl,
            developer_url: config.developerUrl,
            docs_url: config.docsUrl,
            flow_url: config.flowUrl,
            home_url: config.homeUrl,
            nft_url: config.nftUrl,
            root_url: config.rootUrl,
            service: "iai-app",
            status: "ok"
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderAppHome(config, locale), locale);
      return;
    }

    respondHtml(response, 404, renderAppNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "APP_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "app.error.server")
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

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}
