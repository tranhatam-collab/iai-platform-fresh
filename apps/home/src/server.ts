import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderHomeNotFound, renderHomePortal, type HomeRenderConfig } from "./render.js";

export interface HomeServerOptions extends Partial<HomeRenderConfig> {}

interface ResolvedHomeConfig extends HomeRenderConfig {}

export function createHomeServer(options: HomeServerOptions = {}): Server {
  return createServer(createHomeRequestHandler(options));
}

export function createHomeRequestHandler(options: HomeServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveConfig(options: HomeServerOptions): ResolvedHomeConfig {
  return {
    appUrl: options.appUrl ?? process.env.HOME_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.HOME_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.HOME_DEVELOPER_URL ?? "https://developer.iai.one",
    docsUrl: options.docsUrl ?? process.env.HOME_DOCS_URL ?? "https://docs.iai.one",
    flowUrl: options.flowUrl ?? process.env.HOME_FLOW_URL ?? "https://flow.iai.one",
    nftUrl: options.nftUrl ?? process.env.HOME_NFT_URL ?? "https://nft.iai.one",
    rootUrl: options.rootUrl ?? process.env.HOME_ROOT_URL ?? "https://iai.one",
    webSurfaceEnabled: parseBooleanFlag(
      options.webSurfaceEnabled,
      process.env.HOME_WEB_SURFACE_ENABLED,
      false
    ),
    webUrl: options.webUrl ?? process.env.HOME_WEB_URL ?? "https://web.iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedHomeConfig
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
            message: t(locale, "home.error.method")
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
            docs_url: config.docsUrl,
            flow_url: config.flowUrl,
            nft_url: config.nftUrl,
            root_url: config.rootUrl,
            service: "iai-home",
            status: "ok",
            web_surface_enabled: config.webSurfaceEnabled,
            web_url: config.webSurfaceEnabled ? config.webUrl : null
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderHomePortal(config, locale), locale);
      return;
    }

    respondHtml(response, 404, renderHomeNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "HOME_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "home.error.server")
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

function parseBooleanFlag(
  optionValue: boolean | undefined,
  envValue: string | undefined,
  defaultValue: boolean
): boolean {
  if (typeof optionValue === "boolean") {
    return optionValue;
  }

  if (!envValue) {
    return defaultValue;
  }

  const normalized = envValue.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}
