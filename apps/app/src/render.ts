import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";

export interface AppRenderConfig {
  dashUrl: string;
  developerUrl: string;
  docsUrl: string;
  flowUrl: string;
  homeUrl: string;
  nftUrl: string;
  rootUrl: string;
}

export function renderAppHome(config: AppRenderConfig, locale: Locale): string {
  return page(
    "/",
    locale,
    undefined,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.app.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.app.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(localizeExternalUrl(config.homeUrl, locale))}">${escapeHtml(t(locale, "nav.portal"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(t(locale, "nav.developer"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
          ${renderLocaleSwitch(locale, "/")}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "app.hero.eyebrow"))}</p>
            <h1>${escapeHtml(t(locale, "surface.app.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "app.hero.body"))}</p>
            <p class="note">${escapeHtml(t(locale, "app.hero.note"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(localizeExternalUrl(config.nftUrl, locale))}">${escapeHtml(
                t(locale, "app.hero.primary")
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(
                t(locale, "app.hero.secondary")
              )}</a>
            </div>
          </div>
          <aside class="panel boundary-panel">
            <p class="eyebrow">${escapeHtml(t(locale, "app.boundaries.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "app.boundaries.title"))}</h2>
            <p>${escapeHtml(t(locale, "app.boundaries.body"))}</p>
          </aside>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "app.lanes.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "app.lanes.title"))}</h2>
          <p>${escapeHtml(t(locale, "app.lanes.body"))}</p>
        </section>

        <section class="lane-grid">
          ${renderInfoCard(locale, t(locale, "app.lane.community.title"), t(locale, "app.lane.community.body"))}
          ${renderInfoCard(locale, t(locale, "app.lane.lessons.title"), t(locale, "app.lane.lessons.body"))}
          ${renderInfoCard(locale, t(locale, "app.lane.verification.title"), t(locale, "app.lane.verification.body"))}
          ${renderInfoCard(locale, t(locale, "app.lane.operations.title"), t(locale, "app.lane.operations.body"))}
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "app.adjacent.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "app.adjacent.title"))}</h2>
          <p>${escapeHtml(t(locale, "app.adjacent.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "surface.verify.title"), t(locale, "app.surface.verify.body"), config.nftUrl, t(locale, "btn.view_registry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.flow.title"), t(locale, "app.surface.flow.body"), config.flowUrl, t(locale, "btn.open_runtime"))}
          ${renderSurfaceCard(locale, t(locale, "surface.docs.title"), t(locale, "app.surface.docs.body"), config.docsUrl, t(locale, "btn.open_docs"))}
          ${renderSurfaceCard(locale, t(locale, "surface.dash.title"), t(locale, "app.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"))}
        </section>

        <section class="boundary-grid">
          <article class="boundary-card">
            <p>${escapeHtml(t(locale, "app.boundary1"))}</p>
          </article>
          <article class="boundary-card">
            <p>${escapeHtml(t(locale, "app.boundary2"))}</p>
          </article>
          <article class="boundary-card">
            <p>${escapeHtml(t(locale, "app.boundary3"))}</p>
          </article>
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
      </footer>
    `
  );
}

export function renderAppNotFound(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "app.page.not_found"),
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.app.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.app.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          ${renderLocaleSwitch(locale, path)}
        </nav>
      </header>
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.app.domain"))}</p>
            <h1>${escapeHtml(t(locale, "app.not_found.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "app.not_found.body"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(
                t(locale, "app.not_found.back")
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
}

function renderInfoCard(locale: Locale, title: string, body: string): string {
  return `
    <article class="lane-card">
      <p class="eyebrow">${escapeHtml(t(locale, "surface.app.title"))}</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function renderSurfaceCard(
  locale: Locale,
  title: string,
  body: string,
  href: string,
  ctaLabel: string
): string {
  const localizedHref = localizeExternalUrl(href, locale);

  return `
    <article class="surface-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="card-footer">
        <code>${escapeHtml(new URL(localizedHref).host)}</code>
        <a href="${escapeHtml(localizedHref)}">${escapeHtml(ctaLabel)}</a>
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
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:image" content="${escapeHtml(metadata.socialImage)}" />
    <meta name="twitter:image" content="${escapeHtml(metadata.socialImage)}" />
    <link rel="canonical" href="${escapeHtml(metadata.canonical)}" />
    <link rel="alternate" hreflang="vi" href="${escapeHtml(metadata.alternates.vi)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(metadata.alternates.en)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(metadata.alternates.xDefault)}" />
    <script type="application/ld+json">${structuredData}</script>
    <style>
      :root {
        --bg: #eef3ef;
        --panel: rgba(255, 255, 255, 0.8);
        --ink: #18211f;
        --muted: #617069;
        --line: rgba(24, 33, 31, 0.12);
        --accent: #2f6f55;
        --accent-soft: rgba(47, 111, 85, 0.1);
        --accent-strong: #173b2c;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        color: var(--ink);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(47, 111, 85, 0.12), transparent 26%),
          radial-gradient(circle at top right, rgba(23, 59, 44, 0.08), transparent 20%),
          linear-gradient(180deg, #e7efe9 0%, var(--bg) 48%, #f5faf6 100%);
      }

      a { color: inherit; text-decoration: none; }
      code {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        font-size: 12px;
        color: var(--muted);
      }

      .topbar,
      .page-shell,
      .hero,
      .actions,
      .lane-grid,
      .surface-grid,
      .boundary-grid {
        display: grid;
        gap: 16px;
      }

      .topbar {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        background: rgba(238, 243, 239, 0.9);
        backdrop-filter: blur(12px);
      }

      .brand,
      .topnav,
      .locale-list {
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
        align-items: stretch;
      }

      .hero-simple {
        grid-template-columns: 1fr;
      }

      .hero-copy,
      .section-head,
      .boundary-panel,
      .lane-card,
      .surface-card,
      .boundary-card {
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        backdrop-filter: blur(12px);
      }

      .hero-copy h1,
      .section-head h2,
      .boundary-panel h2,
      .lane-card h3,
      .surface-card h3 {
        margin: 0;
        font-family: "Fraunces", "Iowan Old Style", "Palatino Linotype", serif;
        line-height: 1;
      }

      .hero-copy h1 {
        font-size: clamp(40px, 6.4vw, 74px);
      }

      .section-head h2,
      .boundary-panel h2 {
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
      .boundary-panel p,
      .lane-card p,
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
        color: #f4fbf6;
      }

      .secondary {
        border: 1px solid var(--line);
      }

      .lane-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .surface-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .lane-card,
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
        color: var(--accent-strong);
      }

      .boundary-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .footer {
        display: grid;
        gap: 6px;
        padding: 0 24px 24px;
      }

      @media (max-width: 1080px) {
        .hero,
        .lane-grid,
        .surface-grid,
        .boundary-grid {
          grid-template-columns: 1fr 1fr;
        }

        .hero-simple {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .topbar,
        .hero,
        .lane-grid,
        .surface-grid,
        .boundary-grid,
        .actions {
          grid-template-columns: 1fr;
        }

        .brand,
        .topnav,
        .locale-list,
        .actions {
          display: grid;
        }
      }
    </style>
  </head>
  <body>
    ${body}
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
