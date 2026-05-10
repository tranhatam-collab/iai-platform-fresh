import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { resolveLocale, t, type Locale } from "./i18n.js";
import {
  renderRootAuthCallback,
  renderRootHome,
  renderRootLogin,
  renderRootNotFound,
  type RootAuthProviderStatus,
  type RootRenderConfig
} from "./render.js";

export interface RootServerOptions extends Partial<RootRenderConfig> {
  appleClientId?: string;
  authBaseUrl?: string;
  authCookieDomain?: string;
  googleClientId?: string;
}

interface ResolvedRootConfig extends RootRenderConfig {
  authBaseUrl: string;
  authCookieDomain: string | null;
  oauth: {
    apple: OAuthProviderConfig;
    google: OAuthProviderConfig;
  };
}

interface OAuthProviderConfig {
  authorizationUrl: string;
  clientId: string | null;
  cookieName: string;
  provider: "apple" | "google";
  redirectPath: string;
  responseMode: "form_post" | "query";
  scope: string;
}

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
  const authBaseUrl = normalizeBaseUrl(
    options.authBaseUrl ?? process.env.ROOT_AUTH_BASE_URL ?? "https://iai.one"
  );
  const authCookieDomain = normalizeOptionalString(
    options.authCookieDomain ?? process.env.ROOT_AUTH_COOKIE_DOMAIN ?? ".iai.one"
  );
  const googleClientId = normalizeOptionalString(
    options.googleClientId ?? process.env.ROOT_GOOGLE_CLIENT_ID
  );
  const appleClientId = normalizeOptionalString(
    options.appleClientId ?? process.env.ROOT_APPLE_CLIENT_ID
  );

  return {
    appUrl: options.appUrl ?? process.env.ROOT_APP_URL ?? "https://app.iai.one",
    authBaseUrl,
    authCookieDomain,
    dashUrl: options.dashUrl ?? process.env.ROOT_DASH_URL ?? "https://dash.iai.one",
    developerUrl:
      options.developerUrl ?? process.env.ROOT_DEVELOPER_URL ?? "https://developer.iai.one",
    docsUrl: options.docsUrl ?? process.env.ROOT_DOCS_URL ?? "https://docs.iai.one",
    flowUrl: options.flowUrl ?? process.env.ROOT_FLOW_URL ?? "https://flow.iai.one",
    nftUrl: options.nftUrl ?? process.env.ROOT_NFT_URL ?? "https://nft.iai.one",
    oauth: {
      apple: {
        authorizationUrl: "https://appleid.apple.com/auth/authorize",
        clientId: appleClientId,
        cookieName: "iai_oauth_state_apple",
        provider: "apple",
        redirectPath: "/auth/apple/callback",
        responseMode: "form_post",
        scope: "name email"
      },
      google: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: googleClientId,
        cookieName: "iai_oauth_state_google",
        provider: "google",
        redirectPath: "/auth/google/callback",
        responseMode: "query",
        scope: "openid email profile"
      }
    },
    portalUrl: options.portalUrl ?? process.env.ROOT_PORTAL_URL ?? "https://home.iai.one",
    webSurfaceEnabled: parseBooleanFlag(
      options.webSurfaceEnabled,
      process.env.ROOT_WEB_SURFACE_ENABLED,
      false
    ),
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
  const authProviderStatuses = getAuthProviderStatuses(config);

  try {
    if (isOAuthStartPath(url.pathname)) {
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

      beginOAuth(response, config, url.pathname, locale);
      return;
    }

    if (isOAuthCallbackPath(url.pathname)) {
      if (method !== "GET" && method !== "POST") {
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

      await completeOAuthCallback(request, response, config, url, locale);
      return;
    }

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
            oauth: authProviderStatuses,
            portal_url: config.portalUrl,
            service: "iai-root",
            status: "ok",
            web_surface_enabled: config.webSurfaceEnabled,
            web_url: config.webSurfaceEnabled ? config.webUrl : null
          }
        },
        locale
      );
      return;
    }

    if (url.pathname === "/login") {
      respondHtml(response, 200, renderRootLogin(config, locale, authProviderStatuses), locale);
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

function beginOAuth(
  response: ServerResponse,
  config: ResolvedRootConfig,
  pathname: string,
  locale: Locale
): void {
  const provider = pathname === "/auth/apple/start" ? config.oauth.apple : config.oauth.google;

  if (!provider.clientId) {
    respondJson(
      response,
      503,
      {
        ok: false,
        error: {
          code: "OAUTH_PROVIDER_NOT_CONFIGURED",
          message:
            provider.provider === "apple"
              ? "ROOT_APPLE_CLIENT_ID is not configured for iai.one."
              : "ROOT_GOOGLE_CLIENT_ID is not configured for iai.one."
        }
      },
      locale
    );
    return;
  }

  const state = createStateToken();
  const redirectUri = new URL(provider.redirectPath, config.authBaseUrl).toString();
  const authorizationUrl = new URL(provider.authorizationUrl);
  authorizationUrl.searchParams.set("client_id", provider.clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", provider.scope);
  authorizationUrl.searchParams.set("state", state);

  if (provider.provider === "google") {
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
    authorizationUrl.searchParams.set("nonce", createStateToken());
  } else {
    authorizationUrl.searchParams.set("response_mode", provider.responseMode);
  }

  response.statusCode = 302;
  response.setHeader("cache-control", "no-store");
  response.setHeader("location", authorizationUrl.toString());
  response.setHeader("set-cookie", buildStateCookie(provider.cookieName, state, config.authCookieDomain));
  response.end();
}

async function completeOAuthCallback(
  request: IncomingMessage,
  response: ServerResponse,
  config: ResolvedRootConfig,
  url: URL,
  locale: Locale
): Promise<void> {
  const provider = url.pathname === "/auth/apple/callback" ? config.oauth.apple : config.oauth.google;
  const params =
    (request.method ?? "GET") === "POST"
      ? new URLSearchParams(await readRequestBody(request))
      : url.searchParams;
  const cookies = parseCookies(normalizeHeaderValue(request.headers.cookie));
  const expectedState = cookies[provider.cookieName] ?? "";
  const receivedState = params.get("state") ?? "";
  const error = params.get("error");
  const code = params.get("code");

  response.setHeader("set-cookie", expireStateCookie(provider.cookieName, config.authCookieDomain));

  if (error) {
    respondHtml(
      response,
      400,
      renderRootAuthCallback(locale, provider.provider, "error", `Provider returned: ${error}`),
      locale
    );
    return;
  }

  if (!expectedState || expectedState !== receivedState) {
    respondHtml(
      response,
      400,
      renderRootAuthCallback(locale, provider.provider, "error", "OAuth state did not match."),
      locale
    );
    return;
  }

  if (!code) {
    respondHtml(
      response,
      400,
      renderRootAuthCallback(locale, provider.provider, "error", "OAuth code was missing."),
      locale
    );
    return;
  }

  respondHtml(
    response,
    200,
    renderRootAuthCallback(
      locale,
      provider.provider,
      "ready",
      "Authorization code accepted. Server token exchange can run after the provider secret is installed."
    ),
    locale
  );
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

function getAuthProviderStatuses(config: ResolvedRootConfig): RootAuthProviderStatus[] {
  return [
    {
      configured: Boolean(config.oauth.google.clientId),
      label: "Google ID",
      provider: "google",
      redirectUri: new URL(config.oauth.google.redirectPath, config.authBaseUrl).toString(),
      startPath: "/auth/google/start"
    },
    {
      configured: Boolean(config.oauth.apple.clientId),
      label: "Apple ID",
      provider: "apple",
      redirectUri: new URL(config.oauth.apple.redirectPath, config.authBaseUrl).toString(),
      startPath: "/auth/apple/start"
    }
  ];
}

function isOAuthStartPath(pathname: string): boolean {
  return pathname === "/auth/google/start" || pathname === "/auth/apple/start";
}

function isOAuthCallbackPath(pathname: string): boolean {
  return pathname === "/auth/google/callback" || pathname === "/auth/apple/callback";
}

function createStateToken(): string {
  return randomBytes(24).toString("base64url");
}

function buildStateCookie(name: string, value: string, domain: string | null): string {
  return [
    `${name}=${value}`,
    "Path=/auth",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=600",
    domain ? `Domain=${domain}` : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function expireStateCookie(name: string, domain: string | null): string {
  return [
    `${name}=`,
    "Path=/auth",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
    domain ? `Domain=${domain}` : ""
  ]
    .filter(Boolean)
    .join("; ");
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    cookies[name] = decodeURIComponent(rawValue.join("="));
  }

  return cookies;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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
