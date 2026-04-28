import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";

export interface NftRenderConfig {
  appUrl: string;
  dashUrl: string;
  developerUrl: string;
  flowUrl: string;
  homeUrl: string;
  rootUrl: string;
}

export function renderNftHome(config: NftRenderConfig, locale: Locale): string {
  return page(
    "/",
    locale,
    undefined,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.nft.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.nft.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(localizeExternalUrl(config.rootUrl, locale))}">${escapeHtml(t(locale, "nav.home"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.homeUrl, locale))}">${escapeHtml(t(locale, "surface.home.title"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.appUrl, locale))}">${escapeHtml(t(locale, "nav.app"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(t(locale, "surface.flow.title"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(t(locale, "nav.developer"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
          ${renderLocaleSwitch(locale, "/")}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "nft.hero.eyebrow"))}</p>
            <h1>${escapeHtml(t(locale, "surface.nft.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "nft.hero.body"))}</p>
            <p class="note">${escapeHtml(t(locale, "nft.hero.note"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(localizeExternalUrl(config.developerUrl, locale))}">${escapeHtml(
                t(locale, "nft.hero.primary")
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(
                t(locale, "nft.hero.secondary")
              )}</a>
            </div>
          </div>
          <aside class="panel boundary-panel">
            <p class="eyebrow">${escapeHtml(t(locale, "nft.boundary.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "nft.boundary.title"))}</h2>
            <p>${escapeHtml(t(locale, "nft.boundary.body"))}</p>
          </aside>
        </section>

        <section class="boundary-grid">
          <article class="boundary-card"><p>${escapeHtml(t(locale, "nft.boundary1"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "nft.boundary2"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "nft.boundary3"))}</p></article>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "nft.adjacent.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "nft.adjacent.title"))}</h2>
          <p>${escapeHtml(t(locale, "nft.adjacent.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "surface.root.title"), t(locale, "nft.surface.root.body"), config.rootUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.home.title"), t(locale, "nft.surface.home.body"), config.homeUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.app.title"), t(locale, "nft.surface.app.body"), config.appUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.flow.title"), t(locale, "nft.surface.flow.body"), config.flowUrl, t(locale, "btn.read"))}
          ${renderSurfaceCard(locale, t(locale, "surface.developer.title"), t(locale, "nft.surface.developer.body"), config.developerUrl, t(locale, "btn.read"))}
          ${renderSurfaceCard(locale, t(locale, "surface.dash.title"), t(locale, "nft.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"))}
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
      </footer>
    `
  );
}

export function renderNftNotFound(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "nft.page.not_found"),
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.nft.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.nft.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          ${renderLocaleSwitch(locale, path)}
        </nav>
      </header>
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.nft.domain"))}</p>
            <h1>${escapeHtml(t(locale, "nft.not_found.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "nft.not_found.body"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(
                t(locale, "nft.not_found.back")
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
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
    <meta name="twitter:card" content="summary_large_image" />
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
        --bg: #edf1f5;
        --panel: rgba(255, 255, 255, 0.84);
        --ink: #172135;
        --muted: #596682;
        --line: rgba(23, 33, 53, 0.14);
        --accent: #365e9a;
        --accent-soft: rgba(54, 94, 154, 0.12);
        --accent-strong: #213f70;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(54, 94, 154, 0.14), transparent 26%),
          radial-gradient(circle at top right, rgba(33, 63, 112, 0.1), transparent 20%),
          linear-gradient(180deg, #e8edf4 0%, var(--bg) 48%, #f6f8fb 100%);
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
        background: rgba(237, 241, 245, 0.9);
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
      .panel,
      .surface-card,
      .boundary-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 20px;
      }

      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        color: var(--muted);
      }

      h1,
      h2,
      h3 {
        margin: 0 0 10px;
        font-family: "Space Grotesk", "IBM Plex Sans", sans-serif;
      }

      .lede {
        margin: 0;
        line-height: 1.56;
        font-size: 18px;
      }

      .note {
        margin-top: 12px;
        color: var(--muted);
      }

      .actions {
        grid-template-columns: repeat(auto-fit, minmax(180px, max-content));
        margin-top: 18px;
      }

      .actions a {
        border-radius: 12px;
        padding: 10px 14px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .actions .primary {
        background: var(--accent-strong);
        color: #f4f8ff;
      }

      .actions .secondary {
        border: 1px solid var(--line);
        background: #ffffff;
      }

      .boundary-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .section-head {
        display: grid;
        gap: 8px;
      }

      .surface-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .surface-card {
        display: grid;
        gap: 12px;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .card-footer a {
        color: var(--accent-strong);
        font-weight: 600;
      }

      .footer {
        border-top: 1px solid var(--line);
        padding: 18px 24px 26px;
        color: var(--muted);
        display: grid;
        gap: 5px;
      }

      @media (max-width: 960px) {
        .topbar {
          grid-template-columns: 1fr;
        }

        .hero {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function renderLocaleSwitch(locale: Locale, path: string): string {
  const options = supportedLocales
    .map((candidate) => {
      const label = t(candidate, `locale.${candidate}`);
      return `<a href="${escapeHtml(buildLocalizedPath(path, candidate))}" ${
        candidate === locale ? 'aria-current="true"' : ""
      }>${escapeHtml(label)}</a>`;
    })
    .join("");

  return `<span class="locale-list" role="group" aria-label="Language">${options}</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
