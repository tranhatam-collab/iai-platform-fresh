import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderNftHome, renderNftNotFound, type NftRenderConfig } from "./render.js";

export interface NftServerOptions extends Partial<NftRenderConfig> {}

interface ResolvedNftConfig extends NftRenderConfig {}

export function createNftServer(options: NftServerOptions = {}): Server {
  return createServer(createNftRequestHandler(options));
}

export function createNftRequestHandler(options: NftServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
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
  config: ResolvedNftConfig
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
