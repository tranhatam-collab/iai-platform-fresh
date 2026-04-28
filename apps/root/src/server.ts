import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import { renderRootHome, renderRootNotFound, type RootRenderConfig } from "./render.js";

export interface RootServerOptions extends Partial<RootRenderConfig> {}

interface ResolvedRootConfig extends RootRenderConfig {}

export function createRootServer(options: RootServerOptions = {}): Server {
  return createServer(createRootRequestHandler(options));
}

export function createRootRequestHandler(options: RootServerOptions = {}) {
  const config = resolveConfig(options);

  return (request: IncomingMessage, response: ServerResponse) => {
    void handleRequest(request, response, config);
  };
}

function resolveConfig(options: RootServerOptions): ResolvedRootConfig {
  return {
    appUrl: options.appUrl ?? process.env.ROOT_APP_URL ?? "https://app.iai.one",
    dashUrl: options.dashUrl ?? process.env.ROOT_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.ROOT_DEVELOPER_URL ?? "https://developer.iai.one",
    docsUrl: options.docsUrl ?? process.env.ROOT_DOCS_URL ?? "https://docs.iai.one",
    flowUrl: options.flowUrl ?? process.env.ROOT_FLOW_URL ?? "https://flow.iai.one",
    nftUrl: options.nftUrl ?? process.env.ROOT_NFT_URL ?? "https://nft.iai.one",
    portalUrl: options.portalUrl ?? process.env.ROOT_PORTAL_URL ?? "https://home.iai.one",
    webUrl: options.webUrl ?? process.env.ROOT_WEB_URL ?? "https://web.iai.one"
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedRootConfig
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
            message: t(locale, "root.error.method")
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
            portal_url: config.portalUrl,
            service: "iai-root",
            status: "ok",
            web_url: config.webUrl
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/og.svg") {
      const lang = url.searchParams.get("lang");
      const ogLocale = lang?.startsWith("vi") ? "vi" : "en";
      const svg = renderSurfaceSocialImageSvg({
        description:
          url.searchParams.get("description") ??
          (ogLocale === "vi"
            ? "Lop giao dien song ngu duoc khoa metadata va ranh gioi truoc khi live."
            : "Bilingual surface with locked metadata, copy, and trust boundaries."),
        locale: ogLocale,
        surface: url.searchParams.get("surface") ?? "iai.one",
        title: url.searchParams.get("title") ?? "IAI.ONE"
      });
      respondSvg(response, 200, svg, ogLocale);
      return;
    }

    if (url.pathname === "/") {
      respondHtml(response, 200, renderRootHome(config, locale), locale);
      return;
    }

    respondHtml(response, 404, renderRootNotFound(locale, url.pathname), locale);
  } catch (error) {
    respondJson(
      response,
      500,
      {
        ok: false,
        error: {
          code: "ROOT_SERVER_ERROR",
          message: error instanceof Error ? error.message : t(locale, "root.error.server")
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

function respondSvg(response: ServerResponse, statusCode: number, svg: string, locale: Locale): void {
  response.statusCode = statusCode;
  response.setHeader("cache-control", "public, max-age=300");
  response.setHeader("content-language", locale);
  response.setHeader("content-type", "image/svg+xml; charset=utf-8");
  response.end(svg);
}

function renderSurfaceSocialImageSvg(payload: {
  description: string;
  locale: Locale;
  surface: string;
  title: string;
}): string {
  const localeLabel = payload.locale === "vi" ? "Tieng Viet" : "English";
  const palette = payload.locale === "vi"
    ? {
        accent: "#1d6d62",
        accentSoft: "rgba(29, 109, 98, 0.16)",
        background: "#f5f0e8",
        body: "#365052",
        line: "rgba(19, 33, 36, 0.18)",
        title: "#132124"
      }
    : {
        accent: "#9f4f39",
        accentSoft: "rgba(159, 79, 57, 0.14)",
        background: "#f5f0e8",
        body: "#365052",
        line: "rgba(19, 33, 36, 0.18)",
        title: "#132124"
      };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(payload.title)}">
  <rect width="1200" height="630" fill="${palette.background}" />
  <rect x="34" y="34" width="1132" height="562" rx="34" fill="white" stroke="${palette.line}" />
  <circle cx="1098" cy="102" r="84" fill="${palette.accentSoft}" />
  <circle cx="132" cy="560" r="110" fill="${palette.accentSoft}" />
  <rect x="78" y="76" width="210" height="38" rx="19" fill="${palette.accentSoft}" />
  <text x="104" y="100" fill="${palette.accent}" font-size="18" font-weight="700" font-family="'IBM Plex Sans', 'Segoe UI', sans-serif" letter-spacing="1.8">${escapeXml(payload.surface.toUpperCase())}</text>
  <text x="78" y="162" fill="${palette.title}" font-size="66" font-weight="700" font-family="'Iowan Old Style', Georgia, serif">${escapeXml(payload.title)}</text>
  <foreignObject x="78" y="214" width="860" height="228">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'IBM Plex Sans','Segoe UI',sans-serif;font-size:28px;line-height:1.45;color:${palette.body};">
      ${escapeXml(payload.description)}
    </div>
  </foreignObject>
  <line x1="78" y1="492" x2="1122" y2="492" stroke="${palette.line}" />
  <text x="78" y="544" fill="${palette.accent}" font-size="22" font-weight="700" font-family="'IBM Plex Sans', 'Segoe UI', sans-serif">IAI.ONE</text>
  <text x="210" y="544" fill="${palette.body}" font-size="22" font-family="'IBM Plex Sans', 'Segoe UI', sans-serif">Bilingual system surface</text>
  <text x="992" y="544" fill="${palette.body}" font-size="18" font-family="'IBM Plex Sans', 'Segoe UI', sans-serif">${escapeXml(localeLabel)}</text>
</svg>
`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value.join(",") : value;
}
