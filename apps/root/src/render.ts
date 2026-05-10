import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";

export interface RootRenderConfig {
  appUrl: string;
  dashUrl: string;
  developerUrl: string;
  docsUrl: string;
  flowUrl: string;
  nftUrl: string;
  portalUrl: string;
  webSurfaceEnabled: boolean;
  webUrl: string;
}

export interface RootAuthProviderStatus {
  configured: boolean;
  label: string;
  provider: "apple" | "google";
  redirectUri: string;
  startPath: string;
}

export function renderRootHome(config: RootRenderConfig, locale: Locale): string {
  return page(
    "/",
    locale,
    undefined,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.root.title"))}</strong>
        </div>
        <button class="menu-toggle" type="button" aria-label="${escapeHtml(t(locale, "footer.menu_label"))}" aria-expanded="false" onclick="const n=this.parentElement.querySelector('.topnav');const o=n.classList.toggle('is-open');this.setAttribute('aria-expanded',o)">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></svg>
        </button>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(localizeExternalUrl(config.portalUrl, locale))}">${escapeHtml(t(locale, "nav.portal"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(t(locale, "nav.developer"))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/login", locale))}">${escapeHtml(t(locale, "nav.login"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
          ${renderLocaleSwitch(locale, "/")}
        </nav>
      </header>

      <main class="page-shell" id="main-content">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "root.hero.eyebrow"))}</p>
            <h1>${escapeHtml(t(locale, "surface.root.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "root.hero.body"))}</p>
            <p class="note">${escapeHtml(t(locale, "root.hero.note"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(localizeExternalUrl(config.portalUrl, locale))}">${escapeHtml(
                t(locale, "btn.open_entry")
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(
                t(locale, "btn.read_boundaries")
              )}</a>
            </div>
          </div>
          <aside class="panel role-panel">
            <p class="eyebrow">${escapeHtml(t(locale, "root.role.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "root.role.title"))}</h2>
            <ul class="stack-list">
              <li>${escapeHtml(t(locale, "root.role.point1"))}</li>
              <li>${escapeHtml(t(locale, "root.role.point2"))}</li>
              <li>${escapeHtml(t(locale, "root.role.point3"))}</li>
              <li>${escapeHtml(t(locale, "root.role.point4"))}</li>
            </ul>
          </aside>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "root.map.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "root.map.title"))}</h2>
          <p>${escapeHtml(t(locale, "root.map.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "nav.portal"), t(locale, "root.surface.portal.body"), config.portalUrl, t(locale, "btn.open_entry"), "portal")}
          ${renderSurfaceCard(locale, t(locale, "nav.app"), t(locale, "root.surface.app.body"), config.appUrl, t(locale, "btn.open"), "app")}
          ${renderSurfaceCard(locale, t(locale, "nav.flow"), t(locale, "root.surface.flow.body"), config.flowUrl, t(locale, "btn.open_runtime"), "flow")}
          ${renderSurfaceCard(locale, t(locale, "nav.docs"), t(locale, "root.surface.docs.body"), config.docsUrl, t(locale, "btn.open_docs"), "docs")}
          ${renderSurfaceCard(locale, t(locale, "nav.developer"), t(locale, "root.surface.developer.body"), config.developerUrl, t(locale, "btn.open"), "developer")}
          ${renderSurfaceCard(locale, t(locale, "nav.dashboard"), t(locale, "root.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"), "dash")}
          ${renderSurfaceCard(locale, t(locale, "nav.verify"), t(locale, "root.surface.verify.body"), config.nftUrl, t(locale, "btn.view_registry"), "verify")}
          ${
            config.webSurfaceEnabled
              ? renderSurfaceCard(
                  locale,
                  t(locale, "nav.web"),
                  t(locale, "root.surface.web.body"),
                  config.webUrl,
                  t(locale, "btn.open_web"),
                  "web"
                )
              : ""
          }
        </section>

        <section class="boundary-grid">
          <div class="section-head boundary-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "root.boundaries.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "root.boundaries.title"))}</h2>
            <p>${escapeHtml(t(locale, "root.boundaries.body"))}</p>
          </div>
          <article class="boundary-card reveal">
            <p>${escapeHtml(t(locale, "boundary.no_speculation"))}</p>
          </article>
          <article class="boundary-card reveal">
            <p>${escapeHtml(t(locale, "boundary.no_blackbox"))}</p>
          </article>
          <article class="boundary-card reveal">
            <p>${escapeHtml(t(locale, "boundary.human_judgment"))}</p>
          </article>
        </section>
      </main>

      <footer class="footer">
        <div class="footer-grid">
          <div class="footer-brand">
            <strong>${escapeHtml(t(locale, "footer.copyright"))}</strong>
            <p>${escapeHtml(t(locale, "footer.statement"))}</p>
            <p>${escapeHtml(t(locale, "footer.trust"))}</p>
          </div>
          <div class="footer-col">
            <p class="footer-heading">${escapeHtml(t(locale, "footer.nav.surfaces"))}</p>
            <a href="${escapeHtml(localizeExternalUrl(config.portalUrl, locale))}">${escapeHtml(t(locale, "nav.portal"))}</a>
            <a href="${escapeHtml(localizeExternalUrl(config.appUrl, locale))}">${escapeHtml(t(locale, "nav.app"))}</a>
            <a href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(t(locale, "nav.flow"))}</a>
            <a href="${escapeHtml(localizeExternalUrl(config.nftUrl, locale))}">${escapeHtml(t(locale, "nav.verify"))}</a>
          </div>
          <div class="footer-col">
            <p class="footer-heading">${escapeHtml(t(locale, "footer.nav.resources"))}</p>
            <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
            <a href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(t(locale, "nav.developer"))}</a>
            <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
            ${
              config.webSurfaceEnabled
                ? `<a href="${escapeHtml(localizeExternalUrl(config.webUrl, locale))}">${escapeHtml(
                    t(locale, "nav.web")
                  )}</a>`
                : ""
            }
          </div>
          <div class="footer-col">
            <p class="footer-heading">${escapeHtml(t(locale, "footer.nav.legal"))}</p>
            <a href="https://docs.iai.one/legal/iai-flow/">${escapeHtml(t(locale, "footer.legal.iai_flow"))}</a>
            <p>${escapeHtml(t(locale, "footer.entity"))}</p>
          </div>
        </div>
      </footer>
    `
  );
}

export function renderRootLogin(
  config: RootRenderConfig,
  locale: Locale,
  providers: RootAuthProviderStatus[]
): string {
  const isVi = locale === "vi";

  return page(
    "/login",
    locale,
    isVi ? "Đăng nhập" : "Login",
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
          <strong>${escapeHtml(isVi ? "Shared identity" : "Shared identity")}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(t(locale, "nav.portal"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(t(locale, "nav.developer"))}</a>
          ${renderLocaleSwitch(locale, "/login")}
        </nav>
      </header>

      <main class="page-shell" id="main-content">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
            <h1>${escapeHtml(isVi ? "Đăng nhập vào IAI" : "Sign in to IAI")}</h1>
            <p class="lede">${escapeHtml(
              isVi
                ? "Bắt đầu bằng Google ID hoặc Apple ID. Phiên đăng nhập dùng chung sẽ đi tiếp tới các bề mặt IAI sau khi provider key được cài vào môi trường deploy."
                : "Start with Google ID or Apple ID. The shared session can carry into IAI surfaces after provider keys are installed in the deployment environment."
            )}</p>
            <div class="actions auth-actions">
              ${providers.map((provider) => renderAuthButton(provider)).join("")}
            </div>
          </div>
          <aside class="panel role-panel">
            <p class="eyebrow">${escapeHtml(isVi ? "Redirect URI cần đăng ký" : "Redirect URIs to register")}</p>
            <h2>${escapeHtml(isVi ? "Key không nằm trong code" : "Keys stay out of code")}</h2>
            <ul class="stack-list">
              ${providers
                .map(
                  (provider) =>
                    `<li><strong>${escapeHtml(provider.label)}</strong>: <code>${escapeHtml(
                      provider.redirectUri
                    )}</code></li>`
                )
                .join("")}
            </ul>
          </aside>
        </section>
      </main>
    `
  );
}

export function renderRootAuthCallback(
  locale: Locale,
  provider: "apple" | "google",
  status: "error" | "ready",
  detail: string
): string {
  const isVi = locale === "vi";
  const providerLabel = provider === "apple" ? "Apple ID" : "Google ID";

  return page(
    `/auth/${provider}/callback`,
    locale,
    isVi ? "Kết quả đăng nhập" : "Login result",
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
          <strong>${escapeHtml(providerLabel)}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(buildLocalizedPath("/login", locale))}">${escapeHtml(isVi ? "Đăng nhập" : "Login")}</a>
          ${renderLocaleSwitch(locale, `/auth/${provider}/callback`)}
        </nav>
      </header>
      <main class="page-shell" id="main-content">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(providerLabel)}</p>
            <h1>${escapeHtml(
              status === "ready"
                ? isVi
                  ? "Callback đã sẵn sàng"
                  : "Callback is ready"
                : isVi
                  ? "Callback cần kiểm tra"
                  : "Callback needs attention"
            )}</h1>
            <p class="lede">${escapeHtml(detail)}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/login", locale))}">${escapeHtml(
                isVi ? "Quay lại đăng nhập" : "Back to login"
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
}

export function renderRootNotFound(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "root.page.not_found"),
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.root.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          ${renderLocaleSwitch(locale, path)}
        </nav>
      </header>
      <main class="page-shell" id="main-content">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.root.domain"))}</p>
            <h1>${escapeHtml(t(locale, "root.not_found.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "root.not_found.body"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(
                t(locale, "root.not_found.back")
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
}

function renderAuthButton(provider: RootAuthProviderStatus): string {
  const disabled = provider.configured ? "" : " is-disabled";
  const href = provider.configured ? provider.startPath : "#";
  const suffix = provider.configured ? "" : " · needs key";

  return `<a class="primary auth-provider${disabled}" href="${escapeHtml(href)}" aria-disabled="${
    provider.configured ? "false" : "true"
  }">${escapeHtml(`Continue with ${provider.label}${suffix}`)}</a>`;
}

const surfaceIcons: Record<string, string> = {
  portal: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3L25 9v10l-11 6L3 19V9z"/><path d="M14 15V25"/><path d="M3 9l11 6 11-6"/></svg>`,
  app: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="10"/><circle cx="14" cy="14" r="4"/><path d="M14 4v6M14 18v6M4 14h6M18 14h6"/></svg>`,
  flow: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="6" rx="2"/><rect x="17" y="18" width="8" height="6" rx="2"/><path d="M7 10v4a4 4 0 004 4h6M21 18v-4a4 4 0 00-4-4h-6"/></svg>`,
  docs: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h12l6 6v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M17 4v6h6"/><path d="M9 14h10M9 18h7"/></svg>`,
  developer: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 8 4 14 9 20"/><polyline points="19 8 24 14 19 20"/><line x1="15" y1="4" x2="13" y2="24"/></svg>`,
  dash: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="10" height="10" rx="2"/><rect x="15" y="3" width="10" height="6" rx="2"/><rect x="3" y="15" width="10" height="10" rx="2"/><rect x="15" y="11" width="10" height="14" rx="2"/></svg>`,
  verify: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2L4 7v7c0 6.4 4.3 12.4 10 14 5.7-1.6 10-7.6 10-14V7z"/><path d="M10 14l3 3 5-6"/></svg>`,
  web: `<svg class="surface-icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="11"/><ellipse cx="14" cy="14" rx="5" ry="11"/><path d="M3 14h22"/><path d="M5 8h18M5 20h18"/></svg>`,
};

function renderSurfaceCard(
  locale: Locale,
  title: string,
  body: string,
  href: string,
  ctaLabel: string,
  iconKey?: string
): string {
  const localizedHref = localizeExternalUrl(href, locale);
  const icon = iconKey && surfaceIcons[iconKey] ? surfaceIcons[iconKey] : "";

  return `
    <article class="surface-card reveal">
      ${icon ? `<div class="card-icon">${icon}</div>` : ""}
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="card-footer">
        <code>${escapeHtml(new URL(localizedHref).host)}</code>
        <a href="${escapeHtml(localizedHref)}">${escapeHtml(ctaLabel)} →</a>
      </div>
    </article>
  `;
}

function page(path: string, locale: Locale, pageTitle: string | undefined, body: string): string {
  const metadata = getPageMetadata(path, locale, pageTitle);
  const ogType = metadata.schemaTypes.some((schemaType) => /article/i.test(schemaType))
    ? "article"
    : "website";
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": metadata.schemaTypes.length === 1 ? metadata.schemaTypes[0] : metadata.schemaTypes,
    description: metadata.description,
    inLanguage: metadata.htmlLang,
    name: metadata.title,
    url: metadata.canonical
  }).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="${escapeHtml(metadata.htmlLang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:site_name" content="IAI" />
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:url" content="${escapeHtml(metadata.canonical)}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:locale" content="${escapeHtml(metadata.htmlLang)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:image" content="${escapeHtml(metadata.socialImage)}" />
    <meta name="twitter:image" content="${escapeHtml(metadata.socialImage)}" />
    <link rel="canonical" href="${escapeHtml(metadata.canonical)}" />
    <link rel="alternate" hreflang="vi" href="${escapeHtml(metadata.alternates.vi)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(metadata.alternates.en)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(metadata.alternates.xDefault)}" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%231d5b4f'/><text x='16' y='22' text-anchor='middle' font-size='18' font-weight='700' fill='%23f5f0e8'>I</text></svg>" type="image/svg+xml" />
    <script type="application/ld+json">${structuredData}</script>
    <style>
      :root {
        --paper: #f5f0e8;
        --paper-strong: #fffaf2;
        --ink: #16211f;
        --muted: #586663;
        --line: rgba(22, 33, 31, 0.12);
        --accent: #1d5b4f;
        --accent-soft: rgba(29, 91, 79, 0.1);
        --panel: rgba(255, 250, 242, 0.82);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        color: var(--ink);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(29, 91, 79, 0.14), transparent 28%),
          linear-gradient(180deg, #efe7da 0%, var(--paper) 45%, #ece4d8 100%);
      }

      a { color: inherit; text-decoration: none; }
      code {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        font-size: 12px;
        color: var(--muted);
      }

      .topbar,
      .page-shell,
      .surface-grid,
      .boundary-grid,
      .hero,
      .actions,
      .topnav {
        display: grid;
        gap: 16px;
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 2;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        background: rgba(245, 240, 232, 0.88);
        backdrop-filter: blur(14px);
      }

      .brand,
      .topnav {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .topnav a,
      .locale-list a {
        padding: 9px 12px;
        border-radius: 999px;
        color: var(--muted);
      }

      .topnav a:hover,
      .locale-list a[aria-current="true"] {
        background: var(--accent-soft);
        color: var(--ink);
      }

      .page-shell {
        padding: 28px 24px 18px;
      }

      .hero {
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
        align-items: start;
      }

      .hero-simple {
        grid-template-columns: 1fr;
      }

      .hero-copy,
      .section-head,
      .role-panel,
      .surface-card,
      .boundary-card {
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        backdrop-filter: blur(10px);
      }

      .hero-copy h1,
      .section-head h2,
      .role-panel h2,
      .surface-card h3 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
        line-height: 1.15;
      }

      .hero-copy h1 {
        font-size: clamp(44px, 7vw, 88px);
      }

      .section-head h2,
      .role-panel h2 {
        font-size: clamp(24px, 4vw, 34px);
      }

      .eyebrow {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .lede,
      .note,
      .section-head p,
      .role-panel li,
      .surface-card p,
      .boundary-card p,
      .footer p {
        color: var(--muted);
      }

      .actions {
        grid-auto-flow: column;
        justify-content: start;
        gap: 12px;
      }

      .actions a,
      .surface-card a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 15px;
        border-radius: 999px;
        font-weight: 700;
      }

      .primary {
        background: var(--accent);
        color: #f6f1e8;
      }

      .secondary {
        border: 1px solid var(--line);
      }

      .stack-list {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 18px;
      }

      .surface-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .surface-card {
        display: grid;
        gap: 12px;
      }

      .card-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
      }

      .surface-card a {
        padding: 0;
        min-height: auto;
        color: var(--accent);
      }

      .boundary-grid {
        grid-template-columns: 1.2fr repeat(3, minmax(0, 1fr));
        align-items: stretch;
      }

      .boundary-card {
        display: flex;
        align-items: center;
      }

      .locale-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .footer {
        display: grid;
        gap: 6px;
        padding: 0 24px 24px;
      }

      .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 24px;
        padding-top: 24px;
        border-top: 1px solid var(--line);
      }

      .footer-brand strong {
        display: block;
        margin-bottom: 8px;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
        font-size: 18px;
      }

      .footer-col {
        display: grid;
        gap: 8px;
        align-content: start;
      }

      .footer-heading {
        margin: 0;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .footer-col a {
        color: var(--muted);
        transition: color 0.2s ease;
      }

      .footer-col a:hover {
        color: var(--ink);
      }

      .menu-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel);
        color: var(--ink);
        cursor: pointer;
      }

      .card-icon {
        color: var(--accent);
      }

      .surface-card {
        display: grid;
        gap: 12px;
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }

      .surface-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(22, 33, 31, 0.10);
      }

      .surface-card a {
        transition: color 0.18s ease;
      }

      .surface-card a:hover {
        color: var(--ink);
      }

      @media (max-width: 1080px) {
        .surface-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .boundary-grid,
        .hero {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .topbar {
          grid-template-columns: 1fr auto;
        }

        .menu-toggle {
          display: flex;
        }

        .topnav {
          display: none;
          grid-column: 1 / -1;
        }

        .topnav.is-open {
          display: grid;
          grid-template-columns: 1fr;
        }

        .actions,
        .surface-grid {
          grid-template-columns: 1fr;
        }

        .brand,
        .actions {
          display: grid;
        }

        .footer-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      .skip-link {
        position: absolute;
        top: -100%;
        left: 16px;
        z-index: 100;
        padding: 12px 18px;
        border-radius: 999px;
        background: var(--accent);
        color: #f6f1e8;
        font-weight: 700;
        text-decoration: none;
      }

      .skip-link:focus {
        top: 12px;
      }

      :focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      a:focus:not(:focus-visible),
      button:focus:not(:focus-visible) {
        outline: none;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      @keyframes revealUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .reveal {
        opacity: 0;
      }

      .reveal.is-visible {
        animation: revealUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .reveal:nth-child(2) { animation-delay: 0.06s; }
      .reveal:nth-child(3) { animation-delay: 0.12s; }
      .reveal:nth-child(4) { animation-delay: 0.18s; }
      .reveal:nth-child(5) { animation-delay: 0.24s; }
      .reveal:nth-child(6) { animation-delay: 0.30s; }
      .reveal:nth-child(7) { animation-delay: 0.36s; }
      .reveal:nth-child(8) { animation-delay: 0.42s; }

      .topnav a,
      .locale-list a {
        transition: background 0.2s ease, color 0.2s ease;
      }

      .primary,
      .secondary {
        transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }

      .primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(29, 91, 79, 0.3);
      }

      .secondary:hover {
        transform: translateY(-1px);
        background: var(--accent-soft);
      }

      .boundary-card {
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }

      .boundary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(22, 33, 31, 0.08);
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">${escapeHtml(t(locale, "root.skip_to_main"))}</a>
    ${body}
    <script>
      if(!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
        var o=new IntersectionObserver(function(e){e.forEach(function(i){if(i.isIntersecting){i.target.classList.add('is-visible');o.unobserve(i.target)}})},{threshold:0.15});
        document.querySelectorAll('.reveal').forEach(function(el){o.observe(el)});
      }else{
        document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('is-visible')});
      }
    </script>
  </body>
</html>`;
}

function renderLocaleSwitch(locale: Locale, currentPath: string): string {
  return `
    <div class="locale-list" aria-label="${escapeHtml(t(locale, "dash.language"))}">
      ${supportedLocales
        .map((targetLocale) => {
          return `<a href="${escapeHtml(buildLocalizedPath(currentPath, targetLocale))}"${
            targetLocale === locale ? ' aria-current="true"' : ""
          }>${escapeHtml(t(locale, `locale.${targetLocale}`))}</a>`;
        })
        .join("")}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
