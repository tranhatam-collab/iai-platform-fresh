import {
  executeCheckoutFlowAsync,
  getCollectionHeroImage,
  getDefaultBuyerId,
  getDocumentsSlug,
  getProductByCode,
  getProductImageUrl,
  getRelatedProducts,
  loadCatalogAsync,
  loadLibraryAsync,
  loadOrderAsync,
  loadPricingAsync,
  loadProductBySlugAsync,
  loadRecommendationAsync,
  loadTeam3SurfaceAsync,
  loadTeam4OperationsAsync,
  type BuyerRole,
  type LibraryItem,
  type OrderRecord,
  type ProductCode,
  type ProductDefinition,
  type ProductCatalogFixture,
  type Team4OperationsContract
} from "./data.js";
import {
  defaultLocale,
  getLocalizedChrome,
  getLocalizedCopyNotes,
  getLocalizedLicenseLabel,
  getPageMetadata,
  t,
  getLocalizedProduct,
  getLocalizedRelatedLabel,
  getLocalizedRoleProfile,
  getLocalizedRoleProfiles,
  getLocalizedStatusLabel,
  getLocalizedSupportFaq,
  getLocalizedTierLabel,
  getLocalizedTierSummary,
  localeMeta,
  supportedLocales,
  type Locale
} from "./i18n.js";
import {
  getLocalizedTeam4ExecutionProgress,
  getLocalizedTeam4KpiDetail,
  getLocalizedTeam4LaunchGates,
  getLocalizedTeam4OpsPacketDetails,
  getLocalizedTeam4QueueDetail,
  getLocalizedTeam4StatusSnapshot,
  getLocalizedTeam4WaveDetail,
  guardrailLabels,
  runbookLabels
} from "./team4-copy.js";

export interface RouteResponse {
  status: number;
  body: string;
  contentType: string;
  headers?: Record<string, string>;
}

type CollectionKey = "all" | "documents" | "programs";

const legacyBoundaryRoutes = [
  { test: /^\/docs\/investment-programs$/, target: "/documents" },
  { test: /^\/docs\/investment-programs\/.+$/, target: "/documents" },
  { test: /^\/investor$/, target: "/products" },
  { test: /^\/investors$/, target: "/products" },
  { test: /^\/fundraising$/, target: "/products" },
  { test: /^\/investor-packages$/, target: "/products" },
  { test: /^\/fundraising-catalog$/, target: "/products" },
  { test: /^\/execution-fund$/, target: "/products" }
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function buildLocalePath(locale: Locale, path: string): string {
  const normalized = path === "/" ? "" : path;
  return `/${locale}${normalized}`;
}

function parseLocalizedPath(pathname: string): {
  locale: Locale;
  normalizedPath: string;
  isLocalized: boolean;
  rootLocaleOnly: boolean;
} {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const match = trimmed.match(/^\/(en|vi)(\/.*)?$/);
  if (match) {
    return {
      locale: match[1] as Locale,
      normalizedPath: match[2] || "/",
      isLocalized: true,
      rootLocaleOnly: !match[2]
    };
  }

  return {
    locale: defaultLocale,
    normalizedPath: trimmed === "/" ? "/products" : trimmed,
    isLocalized: false,
    rootLocaleOnly: false
  };
}

function localizeMarkup(markup: string, locale: Locale): string {
  return markup.replace(/\b(href|action)="\/(?!en\/|vi\/)/g, `$1="/${locale}/`);
}

function canonicalUrl(locale: Locale, canonicalPath: string): string {
  return getPageMetadata(canonicalPath, locale).canonical;
}

function searchParamsSuffix(searchParams: URLSearchParams): string {
  const value = searchParams.toString();
  return value ? `?${value}` : "";
}

function section(title: string, content: string, kicker?: string): string {
  return `
    <section class="content-band">
      <div class="content-inner">
        ${kicker ? `<div class="section-kicker">${escapeHtml(kicker)}</div>` : ""}
        <h2>${escapeHtml(title)}</h2>
        ${content}
      </div>
    </section>
  `;
}

function pill(text: string): string {
  return `<span class="pill">${escapeHtml(text)}</span>`;
}

type Team4KpiDetail = {
  label: string;
  owner: string;
  cadence: string;
  target: string;
  yellow: string;
  red: string;
  note: string;
};

type Team4QueueDetail = {
  label: string;
  summary: string;
  checks: string[];
};

type Team4WaveDetail = {
  status: string;
  summary: string;
  exitRule: string;
};

type Team4OwnerEscalationRow = {
  responsibility: string;
  primary: string;
  backup: string;
  trigger: string;
};

type Team4IncidentPlay = {
  incident: string;
  support: string[];
  escalation: string[];
};

type Team4SupportMacro = {
  label: string;
  message: string;
};

type Team4TraceMapping = {
  scenario: string;
  detectSignals: string[];
  requiredTraceFields: string[];
  decisionPath: string[];
  escalateTo: string[];
};

type Team4OpsPacketDetails = {
  packetStatus: string;
  laneState: string;
  laneReason: string;
  ownerRows: Team4OwnerEscalationRow[];
  recoveryEntry: string[];
  recoveryConstraints: string[];
  partnerHandoff: string[];
  incidents: Team4IncidentPlay[];
  traceMappings: Team4TraceMapping[];
  macros: Team4SupportMacro[];
  rollbackOwners: string[];
  rollbackNotify: string[];
  rollbackTemplates: string[];
};

type Team4ExecutionProgress = {
  completedPercent: string;
  remainingPercent: string;
  asOf: string;
  focusNow: string[];
  blockedBy: string[];
  localeGuard: string[];
  sequenceGuard: string[];
};

function getLocalizedWaveLabel(waveId: string, fallback: string, locale: Locale): string {
  if (locale === "en") return fallback;
  if (waveId === "wave-1") return "Đợt 1";
  if (waveId === "wave-2") return "Đợt 2";
  return fallback;
}

function getLocalizedOpsToken(token: string, locale: Locale, dictionary: Record<Locale, Record<string, string>>): string {
  return dictionary[locale][token] ?? token;
}

function productCard(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const note = getLocalizedCopyNotes(product, locale);
  const localizedProduct = getLocalizedProduct(product, locale);
  const chrome = getLocalizedChrome(locale);
  return `
    <article class="product-card">
      <img src="${getProductImageUrl(product.productCode)}" alt="${escapeHtml(localizedProduct.name)}" />
      <div class="product-card-body">
        <div class="meta-line">
          ${pill(localizedProduct.tierLabel)}
          ${pill(note.theme)}
          <span class="price">${formatUsd(product.priceUsd)}</span>
        </div>
        <h3>${escapeHtml(localizedProduct.name)}</h3>
        <p>${escapeHtml(localizedProduct.positioning)}</p>
        <div class="product-meta">
          <span>${escapeHtml(localizedProduct.defaultLicenseLabel)}</span>
          <span>${escapeHtml(localizedProduct.updateWindowLabel)}</span>
        </div>
        <div class="cta-row">
          <a class="cta-link" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(localizedProduct.primaryCta)}</a>
          <a class="mini-link" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${escapeHtml(chrome.buttons.checkout)}</a>
        </div>
      </div>
    </article>
  `;
}

function renderLanguageSwitcher(locale: Locale, currentPath: string): string {
  const current = localeMeta[locale];
  const alternatives = supportedLocales.filter((entry) => entry !== locale);

  return `
    <details class="lang-switcher">
      <summary>
        <span class="lang-flag" aria-hidden="true">${current.flag}</span>
        <span>${escapeHtml(current.nativeLabel)}</span>
        <span class="lang-caret" aria-hidden="true">▾</span>
      </summary>
      <div class="lang-menu">
        ${alternatives
          .map((entry) => {
            const meta = localeMeta[entry];
            return `<a href="${buildLocalePath(entry, currentPath)}"><span class="lang-flag" aria-hidden="true">${meta.flag}</span><span>${escapeHtml(meta.nativeLabel)}</span></a>`;
          })
          .join("")}
      </div>
    </details>
  `;
}

function nav(active: string, buyerId: string, locale: Locale, currentPath: string): string {
  const chrome = getLocalizedChrome(locale);
  const links = [
    { href: "/products", key: "products", label: chrome.nav.products },
    { href: "/documents", key: "documents", label: chrome.nav.documents },
    { href: "/programs", key: "programs", label: chrome.nav.programs },
    { href: "/licenses", key: "licenses", label: chrome.nav.licenses },
    { href: `/library?buyer=${buyerId}`, key: "library", label: chrome.nav.library },
    { href: "/operations", key: "operations", label: chrome.nav.operations }
  ];

  return `
    <header class="site-header">
      <a class="brand" href="/products">${escapeHtml(chrome.brand)}</a>
      <nav>
        ${links
          .map(({ href, key, label }) => {
            const current = active === href || (active === "/library" && key === "library");
            return `<a href="${href}"${current ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
          })
          .join("")}
      </nav>
      ${renderLanguageSwitcher(locale, currentPath)}
    </header>
  `;
}

function layout({
  title,
  active,
  body,
  buyerId,
  canonicalPath,
  locale,
  description,
  noindex = false
}: {
  title: string;
  active: string;
  body: string;
  buyerId: string;
  canonicalPath: string;
  locale: Locale;
  description: string;
  noindex?: boolean;
}): string {
  const metadata = getPageMetadata(canonicalPath, locale, title, description);
  const chrome = getLocalizedChrome(locale);
  const canonical = metadata.canonical;
  void [
    t(locale, "noos.nav.products"),
    t(locale, "noos.btn.checkout"),
    t(locale, "noos.footer.primary")
  ].join("");
  const localizedNav = localizeMarkup(nav(active, buyerId, locale, canonicalPath), locale);
  const localizedBody = localizeMarkup(body, locale);
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
  const alternateLinks = noindex
    ? ""
    : supportedLocales
        .map(
          (entry) =>
            `<link rel="alternate" hreflang="${localeMeta[entry].htmlLang}" href="${escapeHtml(metadata.alternates[entry])}" />`
        )
        .join("") + `<link rel="alternate" hreflang="x-default" href="${escapeHtml(metadata.alternates.xDefault)}" />`;

  return `<!doctype html>
<html lang="${metadata.htmlLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(metadata.title)}</title>
    <meta name="description" content="${escapeHtml(metadata.description)}" />
    ${noindex ? '<meta name="robots" content="noindex,nofollow" />' : ""}
    ${noindex ? "" : `<link rel="canonical" href="${escapeHtml(canonical)}" />`}
    ${alternateLinks}
    <meta property="og:site_name" content="${escapeHtml(chrome.brand)}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="${escapeHtml(metadata.htmlLang)}" />
    <meta property="og:image" content="${escapeHtml(metadata.socialImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />
    <meta name="twitter:image" content="${escapeHtml(metadata.socialImage)}" />
    <script type="application/ld+json">${structuredData}</script>
    <style>
      :root {
        color-scheme: light;
        --bg: #eef2f3;
        --ink: #111716;
        --muted: #56615f;
        --line: rgba(17, 23, 22, 0.14);
        --panel: rgba(255, 255, 255, 0.92);
        --accent: #0f7c74;
        --accent-2: #c85d3a;
        --accent-3: #8e3b6f;
        --danger: #7c2d18;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--ink);
        line-height: 1.5;
      }

      a { color: inherit; text-decoration: none; }

      img {
        display: block;
        width: 100%;
        height: auto;
      }

      .site-header {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        background: rgba(238, 242, 243, 0.92);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--line);
      }

      .brand {
        font-size: 20px;
        font-weight: 700;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }

      nav a {
        font-size: 14px;
        color: var(--muted);
      }

      nav a[aria-current="page"] {
        color: var(--ink);
        font-weight: 600;
      }

      .lang-switcher {
        position: relative;
      }

      .lang-switcher summary {
        list-style: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        cursor: pointer;
      }

      .lang-switcher summary::-webkit-details-marker {
        display: none;
      }

      .lang-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 170px;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 12px 28px rgba(17, 23, 22, 0.12);
      }

      .lang-menu a {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 0 10px;
        border-radius: 6px;
      }

      .lang-menu a:hover {
        background: rgba(15, 124, 116, 0.08);
      }

      .lang-flag {
        font-size: 18px;
      }

      .lang-caret {
        font-size: 12px;
        color: var(--muted);
      }

      .hero {
        min-height: calc(100svh - 66px);
        display: grid;
        align-items: end;
        padding: 32px 24px 28px;
        background:
          linear-gradient(180deg, rgba(11, 15, 15, 0.14), rgba(11, 15, 15, 0.78)),
          var(--hero-image) center/cover no-repeat;
        color: #f7fbfa;
      }

      .hero-inner,
      .content-inner,
      .footer-inner {
        width: min(1120px, 100%);
        margin: 0 auto;
      }

      .hero-inner {
        display: grid;
        gap: 14px;
      }

      .hero-kicker,
      .section-kicker {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.86;
      }

      h1 {
        margin: 0;
        font-size: 46px;
        line-height: 1.05;
        max-width: 11ch;
      }

      h2 {
        margin: 0 0 18px;
        font-size: 28px;
        line-height: 1.1;
      }

      h3 {
        margin: 0;
        font-size: 22px;
        line-height: 1.15;
      }

      p {
        margin: 0;
        color: var(--muted);
        max-width: 72ch;
      }

      .hero-copy {
        max-width: 54ch;
        color: rgba(247, 251, 250, 0.88);
      }

      .hero-actions,
      .meta-line,
      .product-meta,
      .trust-row,
      .cta-row,
      .actions,
      .collection-links,
      .role-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .trust-row {
        gap: 18px;
        font-size: 14px;
        color: rgba(247, 251, 250, 0.86);
      }

      .button,
      .secondary-button,
      .cta-link,
      .mini-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 16px;
        border-radius: 6px;
        border: 1px solid transparent;
        font-weight: 600;
      }

      .button,
      .cta-link {
        background: var(--ink);
        color: #f7fbfa;
      }

      .secondary-button,
      .mini-link {
        border-color: var(--line);
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
      }

      .content-band {
        padding: 40px 24px;
      }

      .catalog-grid,
      .tier-grid,
      .license-grid,
      .related-grid,
      .faq-grid,
      .ops-grid,
      .summary-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .product-card,
      .tier-card,
      .license-card,
      .related-card,
      .faq-card,
      .ops-card,
      .summary-card {
        overflow: hidden;
        border-radius: 6px;
        background: var(--panel);
        border: 1px solid var(--line);
      }

      .product-card img,
      .related-card img {
        aspect-ratio: 16 / 10;
        object-fit: cover;
      }

      .product-card-body,
      .tier-body,
      .license-body,
      .related-body,
      .faq-body,
      .ops-body,
      .summary-body {
        display: grid;
        gap: 12px;
        padding: 18px;
      }

      .price {
        font-weight: 700;
        color: var(--ink);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        color: var(--muted);
      }

      .content-band:nth-of-type(even) {
        background: rgba(255, 255, 255, 0.5);
      }

      .two-column {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .callout,
      .update-row,
      .library-item,
      .timeline-row,
      .boundary-card,
      .account-card {
        border-radius: 6px;
        border: 1px solid var(--line);
        background: var(--panel);
      }

      .callout-body,
      .update-body,
      .library-body,
      .timeline-body,
      .boundary-body,
      .account-body {
        display: grid;
        gap: 12px;
        padding: 18px;
      }

      .feature-list,
      .summary-list,
      .ops-list {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 10px;
      }

      .library-item,
      .update-row {
        display: grid;
        gap: 16px;
        align-items: center;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .status {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
      }

      .status.current,
      .status.update_available {
        background: rgba(15, 124, 116, 0.14);
        color: var(--accent);
      }

      .status.window_expired {
        background: rgba(200, 93, 58, 0.14);
        color: var(--accent-2);
      }

      .status.upgraded {
        background: rgba(142, 59, 111, 0.14);
        color: var(--accent-3);
      }

      .boundary-card {
        border-color: rgba(124, 45, 24, 0.2);
      }

      .boundary-note {
        color: var(--danger);
        font-weight: 600;
      }

      .form-grid {
        display: grid;
        gap: 14px;
      }

      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
        color: var(--ink);
      }

      input,
      select {
        min-height: 44px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--line);
        background: white;
        color: var(--ink);
        font: inherit;
      }

      .footer {
        padding: 28px 24px 40px;
        border-top: 1px solid var(--line);
      }

      .footer-inner {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 14px;
        color: var(--muted);
        font-size: 14px;
      }

      @media (max-width: 860px) {
        h1 { font-size: 36px; max-width: 12ch; }
        h2 { font-size: 24px; }
        .library-item,
        .update-row { grid-template-columns: 1fr; }
      }

      @media (max-width: 600px) {
        .site-header { padding: 14px 16px; }
        .hero,
        .content-band,
        .footer { padding-left: 16px; padding-right: 16px; }
        h1 { font-size: 30px; max-width: none; }
        nav { gap: 10px; }
      }
    </style>
  </head>
  <body>
    ${localizedNav}
    ${localizedBody}
    <footer class="footer">
      <div class="footer-inner">
        <span>${escapeHtml(chrome.footer.primary)}</span>
        <span>${escapeHtml(chrome.footer.secondary)}</span>
      </div>
    </footer>
  </body>
</html>`;
}

function filterProducts(products: ProductDefinition[], collection: CollectionKey): ProductDefinition[] {
  if (collection === "documents") {
    return products.filter((product) => ["Entry", "Entry/Core", "Core", "Master"].includes(product.tier));
  }
  if (collection === "programs") {
    return products.filter((product) => product.tier === "Advanced Program");
  }
  return products;
}

function prioritizeProductsForRole(products: ProductDefinition[], role: BuyerRole): ProductDefinition[] {
  const profile = getLocalizedRoleProfile(role, defaultLocale);
  const order = new Map(profile.recommendedProductCodes.map((code, index) => [code, index]));
  return [...products].sort((left, right) => {
    const leftOrder = order.get(left.productCode);
    const rightOrder = order.get(right.productCode);
    if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
    if (leftOrder !== undefined) return -1;
    if (rightOrder !== undefined) return 1;
    return left.productCode.localeCompare(right.productCode);
  });
}

function renderRoleLinks(basePath: string, buyerId: string, activeRole: BuyerRole, locale: Locale): string {
  return `<div class="role-links">${getLocalizedRoleProfiles(locale)
    .map((profile) => {
      const href = `${basePath}?buyer=${encodeURIComponent(buyerId)}&role=${profile.role}`;
      return profile.role === activeRole
        ? `<span class="pill">${escapeHtml(profile.label)}</span>`
        : `<a class="secondary-button" href="${href}">${escapeHtml(profile.label)}</a>`;
    })
    .join("")}</div>`;
}

function renderComparisonCards(products: ProductDefinition[], locale: Locale): string {
  return `<div class="summary-grid">${products
    .slice(0, 5)
    .map(
      (product) => {
        const localizedProduct = getLocalizedProduct(product, locale);
        return `
        <article class="summary-card">
          <div class="summary-body">
            <div class="meta-line">
              ${pill(product.productCode)}
              ${pill(localizedProduct.tierLabel)}
            </div>
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${escapeHtml(localizedProduct.positioning)}</p>
            <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(localizedProduct.updateWindowLabel)}</p>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function renderRelatedProducts(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const related = loadRelatedProducts(product);
  const chrome = getLocalizedChrome(locale);
  if (related.length === 0) {
    return `<p>${t(locale, "noos.library.related_products_empty")}</p>`;
  }

  return `<div class="related-grid">${related
    .map(
      (item) => {
        const localizedProduct = getLocalizedProduct(item, locale);
        return `
        <article class="related-card">
          <img src="${getProductImageUrl(item.productCode)}" alt="${escapeHtml(localizedProduct.name)}" />
          <div class="related-body">
            <div class="meta-line">
              ${pill(localizedProduct.tierLabel)}
              <span class="price">${formatUsd(item.priceUsd)}</span>
            </div>
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${escapeHtml(localizedProduct.positioning)}</p>
            <div class="cta-row">
              <a class="cta-link" href="${item.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(localizedProduct.primaryCta)}</a>
              <a class="mini-link" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${item.productCode}">${escapeHtml(chrome.buttons.checkout)}</a>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function loadRelatedProducts(product: ProductDefinition): ProductDefinition[] {
  return getRelatedProducts(product.productCode);
}

function renderProductTemplateComparison(product: ProductDefinition, locale: Locale): string {
  const related = loadRelatedProducts(product);
  const localizedCurrent = getLocalizedProduct(product, locale);
  const current = `
    <article class="summary-card">
      <div class="summary-body">
        ${pill(t(locale, "noos.library.current_choice"))}
        <h3>${escapeHtml(localizedCurrent.name)}</h3>
        <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedCurrent.defaultLicenseLabel)} · ${escapeHtml(localizedCurrent.updateWindowLabel)}</p>
      </div>
    </article>
  `;
  const relatedCards = related
    .slice(0, 2)
    .map(
      (item) => {
        const localizedProduct = getLocalizedProduct(item, locale);
        return `
        <article class="summary-card">
          <div class="summary-body">
            ${pill(t(locale, "noos.text.next_step"))}
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${formatUsd(item.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(localizedProduct.updateWindowLabel)}</p>
          </div>
        </article>
      `;
      }
    )
    .join("");
  return `<div class="summary-grid">${current}${relatedCards}</div>`;
}

function renderLibraryItem(item: LibraryItem, buyerId: string, locale: Locale): string {
  const product = getProductByCode(item.productCode);
  const slug = product ? getDocumentsSlug(product) : "";
  const localizedProduct = product ? getLocalizedProduct(product, locale) : undefined;
  const chrome = getLocalizedChrome(locale);

  return `
    <article class="library-item">
      <div class="library-body">
        <div class="meta-line">
          ${pill(item.productCode)}
          <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
        </div>
        <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
        <p>${escapeHtml(getLocalizedLicenseLabel(item.licenseType, locale))} · ${escapeHtml(item.currentVersion)} · ${escapeHtml(formatDate(item.purchasedDate, locale))}</p>
      </div>
      <div class="actions">
        <a class="button" href="/library/product/${slug}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.view)}</a>
        <a class="secondary-button" href="/library/updates?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.updates)}</a>
      </div>
    </article>
  `;
}

function renderLaunchWaves(operations: Team4OperationsContract, buyerId: string, locale: Locale): string {
  const chrome = getLocalizedChrome(locale);
  return `<div class="ops-grid">${operations.launchWaves
    .map(
      (wave) => {
        const detail = getLocalizedTeam4WaveDetail(wave.waveId, locale) ?? {
          status: t(locale, "noos.operations.wave_status_active"),
          summary: t(locale, "noos.operations.wave_summary"),
          exitRule: t(locale, "noos.operations.wave_exit_rule")
        };
        const productLinks = wave.productCodes
          .map((productCode) => {
            const product = getProductByCode(productCode);
            if (!product) return escapeHtml(productCode);
            return `<a class="mini-link" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(productCode)}</a>`;
          })
          .join("");

        return `
        <article class="ops-card">
          <div class="ops-body">
            <div class="meta-line">
              ${pill(wave.waveId)}
              ${pill(detail.status)}
            </div>
            <h3>${escapeHtml(getLocalizedWaveLabel(wave.waveId, wave.label, locale))}</h3>
            <p>${escapeHtml(detail.summary)}</p>
            <div class="product-meta">${productLinks}</div>
            <ul class="ops-list">
              <li>${escapeHtml(wave.productCodes.join(" · "))}</li>
              <li>${escapeHtml(detail.exitRule)}</li>
            </ul>
            <a class="mini-link" href="/products?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.openCatalog)}</a>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function redirectResponse(location: string, buyerId: string, locale: Locale): RouteResponse {
  const localizedLocation = buildLocalePath(locale, location);
  const chrome = getLocalizedChrome(locale);
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-boundary/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.text.boundary_enforcement_kicker")}</div>
          <h1>${t(locale, "noos.text.legacy_investor_routes")}</h1>
          <p class="hero-copy">${t(locale, "noos.text.legacy_investor_redirect")}</p>
          <div class="hero-actions">
            <a class="button" href="${localizedLocation}">${escapeHtml(chrome.buttons.continue)}</a>
            <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.openCatalog)}</a>
          </div>
        </div>
      </section>
    </main>
  `;

  return {
    status: 308,
    contentType: "text/html; charset=utf-8",
    headers: {
      location: localizedLocation,
      "x-robots-tag": t(locale, "noos.http.noindex_no_follow")
    },
    body: layout({
      title: t(locale, "noos.text.boundary_redirect_title"),
      active: "/products",
      body,
      buyerId,
      canonicalPath: location,
      locale,
      description: t(locale, "noos.text.legacy_investor_route_description"),
      noindex: true
    })
  };
}

function matchesLegacyBoundaryRoute(pathname: string): string | null {
  for (const entry of legacyBoundaryRoutes) {
    if (entry.test.test(pathname)) {
      return entry.target;
    }
  }

  const blockedSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  if (
    blockedSegments.some((segment) =>
      [
        "investor",
        "investors",
        "investment-programs",
        "investor-packages",
        "fundraising",
        "fundraising-catalog",
        "execution-fund"
      ].includes(segment)
    )
  ) {
    return blockedSegments.includes("docs") ? "/documents" : "/products";
  }

  return null;
}

async function renderCatalogPage(collection: CollectionKey, buyerId: string, role: BuyerRole, locale: Locale): Promise<RouteResponse> {
  const catalog = await loadCatalogAsync();
  const pricing = await loadPricingAsync();
  const team3Surface = await loadTeam3SurfaceAsync();
  const operations = await loadTeam4OperationsAsync();
  const titles = {
    all: t(locale, "noos.catalog.products_all"),
    documents: t(locale, "noos.catalog.documents_title"),
    programs: t(locale, "noos.catalog.programs_title")
  } as const;
  const roleProfile = getLocalizedRoleProfile(role, locale);
  const products = prioritizeProductsForRole(filterProducts(catalog.products, collection), role);
  const descriptions = {
    all: roleProfile.heroLine,
    documents: t(locale, "noos.catalog.documents_description"),
    programs:
      t(locale, "noos.catalog.programs_description")
  } as const;

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getCollectionHeroImage(collection)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.text.catalog_kicker")}</div>
          <h1>${escapeHtml(titles[collection])}</h1>
          <p class="hero-copy">${escapeHtml(descriptions[collection])}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.action.open_full_catalog"
            )}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.action.open_buyer_library"
            )}</a>
          </div>
          <div class="trust-row">
            <span>${t(locale, "noos.catalog.trust_locked_product")}</span>
            <span>${t(locale, "noos.catalog.license_visible")}</span>
            <span>${t(locale, "noos.catalog.immediate_library_handoff")}</span>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.section.browse_by_route"),
        `
          <div class="collection-links">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.catalog.all_products"
            )}</a>
            <a class="secondary-button" href="/documents?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.nav.documents"
            )}</a>
            <a class="secondary-button" href="/programs?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.nav.programs"
            )}</a>
            <a class="secondary-button" href="/licenses?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(
              locale,
              "noos.nav.licenses"
            )}</a>
          </div>
          ${renderRoleLinks(collection === "all" ? "/products" : `/${collection}`, buyerId, role, locale)}
        `,
        t(locale, "noos.section.collections")
      )}
      ${section(
        titles[collection],
        `<div class="catalog-grid">${products.map((product) => productCard(product, buyerId, locale)).join("")}</div>`,
        t(locale, "noos.catalog.catalog_heading")
      )}
      ${section(
        t(locale, "noos.catalog.comparison_heading"),
        `${renderComparisonCards(products, locale)}
         <div class="boundary-card"><div class="boundary-body"><h3>${t(locale, "noos.catalog.ui_states_heading")}</h3><p>${escapeHtml(team3Surface.uiStates.join(" · "))}</p></div></div>`,
        t(locale, "noos.catalog.team3_label")
      )}
      ${section(
        t(locale, "noos.product.tier_summary_heading"),
        `<div class="tier-grid">${getLocalizedTierSummary(locale)
          .map(
            (item) => `
              <article class="tier-card">
                <div class="tier-body">
                  <h3>${escapeHtml(item.tier)}</h3>
                  <p>${escapeHtml(item.line)}</p>
                  <p>${escapeHtml(
                    pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)?.minPriceUsd !== undefined
                      ? `${formatUsd(pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)!.minPriceUsd)} ${t(
                          locale,
                          "noos.operations.to_connector"
                        )} ${formatUsd(pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)!.maxPriceUsd)}`
                      : t(locale, "noos.product.contract_defined_pricing")
                  )}</p>
                </div>
              </article>
            `
          )
              .join("")}</div>`,
        t(locale, "noos.product.tier_short")
      )}
      ${collection === "all"
        ? section(t(locale, "noos.product.launch_waves"), renderLaunchWaves(operations, buyerId, locale), t(locale, "noos.catalog.team4_label"))
        : ""}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: titles[collection],
      active: collection === "all" ? "/products" : `/${collection}`,
      body,
      buyerId,
      canonicalPath: collection === "all" ? "/products" : `/${collection}`,
      locale,
      description: descriptions[collection]
    })
  };
}

async function renderLicensePage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const pricing = await loadPricingAsync();
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-licenses/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.license.page_kicker")}</div>
          <h1>${t(locale, "noos.license.page_title")}</h1>
          <p class="hero-copy">${t(locale, "noos.license.page_copy")}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.license.action_browse_products")}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.license.action_open_library_demo")}</a>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.license.model_heading"),
        `<div class="license-grid">${pricing.licensePolicies
          .map(
            (policy) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(getLocalizedLicenseLabel(policy.licenseType, locale))}</h3>
                  <p>${t(locale, "noos.license.seat_label")} ${policy.minSeats}–${policy.maxSeats}</p>
                  <p>${
                    policy.allowsExternalSharing ? t(locale, "noos.license.allow_external_sharing") : t(locale, "noos.license.no_external_sharing")
                  }</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        t(locale, "noos.license.types_heading")
      )}
      ${section(
        t(locale, "noos.license.upgrade_window_heading"),
        `<div class="license-grid">${pricing.upgradeCreditPolicies
          .map(
            (policy) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(
                    t(locale, "noos.license.upgrade_window_label", { from: policy.fromTier, to: policy.toTier })
                  )}</h3>
                  <p>${policy.creditPercent}% ${t(locale, "noos.license.credit_window_days", { days: policy.windowDays })}</p>
                  <p>${policy.creditCapUsd
                    ? t(locale, "noos.license.credit_cap", { amount: formatUsd(policy.creditCapUsd) })
                    : t(locale, "noos.license.credit_path_only")}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        t(locale, "noos.license.upgrade_paths_heading")
      )}
      ${section(
        t(locale, "noos.license.price_ladder_heading"),
        `<div class="license-grid">${pricing.priceTiers
          .map(
            (tier) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(getLocalizedTierLabel(tier.tier, locale))}</h3>
                  <p>${formatUsd(tier.minPriceUsd)} ${t(locale, "noos.license.price_to")} ${formatUsd(tier.maxPriceUsd)}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        t(locale, "noos.license.tiers_heading")
      )}
      ${section(
        t(locale, "noos.license.terms_heading"),
        `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.license.minimum_display_heading")}</h3><p>${t(locale, "noos.license.minimum_display_copy")}</p></div></div>`,
        t(locale, "noos.license.legal_heading")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.nav.licenses"),
      active: "/licenses",
      body,
      buyerId,
      canonicalPath: "/licenses",
      locale,
      description: t(locale, "noos.license.page_description")
    })
  };
}

async function renderProductDetailPage(product: ProductDefinition, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const localizedProduct = getLocalizedProduct(product, locale);
  const notes = getLocalizedCopyNotes(product, locale);
  const supportFaq = getLocalizedSupportFaq(locale);
  const faqItems = [...notes.faq, ...supportFaq].slice(0, 6);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${escapeHtml(notes.theme)} / ${escapeHtml(localizedProduct.tierLabel)}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${escapeHtml(localizedProduct.positioning)}</p>
          <div class="meta-line">
            ${pill(localizedProduct.defaultLicenseLabel)}
            ${pill(localizedProduct.updateWindowLabel)}
            <span class="price">${formatUsd(product.priceUsd)}</span>
          </div>
          <div class="hero-actions">
            <a class="button" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${escapeHtml(localizedProduct.primaryCta)}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.product.open_library_demo")}</a>
          </div>
          <div class="trust-row">
            <span>${t(locale, "noos.product.immediate_delivery")}</span>
            <span>${t(locale, "noos.product.version_in_library")}</span>
            <span>${t(locale, "noos.product.mapped_upgrade_path")}</span>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.product.positioning_heading"),
        `<p>${escapeHtml(localizedProduct.positioning)} ${escapeHtml(t(locale, "noos.product.positioning_copy"))}</p>`,
        "1"
      )}
      ${section(
        t(locale, "noos.product.who_is_for_heading"),
        `<ul class="feature-list">${localizedProduct.audience.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "2"
      )}
      ${section(
        t(locale, "noos.product.problem_heading"),
        `<ul class="feature-list">${notes.problems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "3"
      )}
      ${section(
        t(locale, "noos.product.include_heading"),
        `<ul class="feature-list">${localizedProduct.includedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "4"
      )}
      ${section(
        t(locale, "noos.product.deliverables_heading"),
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library_product.deliverables")}</h3><ul class="feature-list">${localizedProduct.deliverables
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library_product.delivery_truth_title")}</h3><p>${t(locale, "noos.library_product.delivery_truth_body")}</p></div></div>
        </div>`,
        "5"
      )}
      ${section(
        t(locale, "noos.product.license_heading"),
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.defaultLicenseLabel)}</h3><ul class="feature-list"><li>${t(locale, "noos.product.default_license_locked")}</li><li>${t(locale, "noos.product.no_redistribution")}</li><li>${t(locale, "noos.product.upgrade_path_label")}: ${escapeHtml(getLocalizedRelatedLabel(product.updatePolicy.upgradePath, locale))}</li></ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.product.usage_boundary_heading")}</h3><p>${t(
            locale,
            "noos.product.usage_boundary_copy"
          )}</p></div></div>
        </div>
        ${product.productCode === "P12" ? renderTeamLicenseComparison(product, buyerId, locale) : ""}`,
        "6"
      )}
      ${section(
        t(locale, "noos.product.version_heading"),
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.product.current_version_heading")}</h3><p>${t(
            locale,
            "noos.product.current_version_copy"
          )}</p></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.product.update_window_heading")}</h3><p>${escapeHtml(localizedProduct.updateWindowLabel)} ${t(
            locale,
            "noos.product.update_window_with"
          )} ${escapeHtml(localizedProduct.updateTypeLabels.join(", "))} ${t(locale, "noos.product.update_window_suffix")}</p></div></div>
        </div>`,
        "7"
      )}
      ${section(
        t(locale, "noos.product.why_matters_heading"),
        `<p>${escapeHtml(notes.whyItMatters)}</p>`,
        "8"
      )}
      ${section(
        t(locale, "noos.product.related_products_heading"),
        `${renderRelatedProducts(product, buyerId, locale)}${renderProductTemplateComparison(product, locale)}`,
        "9"
      )}
      ${section(
        "FAQ",
        `<div class="faq-grid">${faqItems
          .map(
            (item) => `
              <article class="faq-card">
                <div class="faq-body">
                  <h3>${escapeHtml(item.question)}</h3>
                  <p>${escapeHtml(item.answer)}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        "10"
      )}
      ${section(
        t(locale, "noos.product.final_cta_heading"),
        `<div class="callout">
          <div class="callout-body">
            <h3>${escapeHtml(localizedProduct.primaryCta)}</h3>
            <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(
              localizedProduct.updateWindowLabel
            )} ${t(locale, "noos.product.update_window_label")}</p>
            <div class="cta-row">
              <a class="button" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${escapeHtml(localizedProduct.primaryCta)}</a>
              ${product.productCode === "P12"
                ? `<a class="secondary-button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=${encodeURIComponent(product.productCode)}">${t(
                    locale,
                    "noos.library_product.open_org_inquiry"
                  )}</a>`
                : ""}
              <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.library_product.back_to_catalog")}</a>
            </div>
          </div>
        </div>`,
        "11"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: localizedProduct.name,
      active: product.route,
      body,
      buyerId,
      canonicalPath: product.route,
      locale,
      description: localizedProduct.positioning
    })
  };
}

async function renderLibraryPage(buyerId: string, role: BuyerRole, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const roleProfile = getLocalizedRoleProfile(role, locale);
  const emptyRecommendation = roleProfile.recommendedProductCodes[0] ?? "P01";
  const nextPrimary =
    library.items.length === 0
      ? emptyRecommendation
      : library.recommendations.nextProductPrimary || emptyRecommendation;
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-library/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.library.page_kicker")}</div>
          <h1>${t(locale, "noos.library.page_hero_heading")}</h1>
          <p class="hero-copy">${t(locale, "noos.library.surface_copy_description")}</p>
          <div class="hero-actions">
            <a class="button" href="/library/updates?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(locale, "noos.library.open_updates")}</a>
            <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(locale, "noos.btn.browse_products")}</a>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.library.purchased_products_title"),
        library.items.length
          ? library.items.map((item) => renderLibraryItem(item, buyerId, locale)).join("")
          : `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library.empty_purchases_heading")}</h3><p>${t(
              locale,
              "noos.library.empty_purchases_body",
              { recommendation: emptyRecommendation }
            )}</p></div></div>`,
        t(locale, "noos.nav.library")
      )}
      ${section(
        t(locale, "noos.library.next_recommendation"),
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(getLocalizedRelatedLabel(nextPrimary, locale))}</h3><p>${escapeHtml(
          library.items.length === 0
            ? locale === "vi"
              ? `Góc nhìn ${roleProfile.label} đang dẫn đường cho giao dịch đầu tiên.`
              : `Role view ${roleProfile.label} is guiding the first purchase path.`
            : library.recommendations.upgradeLicenseOffer
            ? locale === "vi"
              ? `Ưu đãi nâng cấp: ${getLocalizedRelatedLabel(library.recommendations.upgradeLicenseOffer, locale)}`
              : `Upgrade offer: ${library.recommendations.upgradeLicenseOffer}`
            : t(locale, "noos.library.next_step_fallback")
            )}</p><div class="cta-row"><a class="button" href="${nextStepHref(nextPrimary, buyerId, locale, library.items.at(-1)?.productCode)}">${t(
              locale,
              "noos.library.next_step"
            )}</a></div></div></div>`,
        t(locale, "noos.library.recommendation_title")
      )}
  ${section(
        t(locale, "noos.library.account_routes_heading"),
        `<div class="collection-links">
          <a class="secondary-button" href="/library/licenses?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(locale, "noos.library.licenses_link")}</a>
          <a class="secondary-button" href="/library/account?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(locale, "noos.library.account_link")}</a>
        </div>`,
        t(locale, "noos.library.route_navigation_label")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.library.page_title"),
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library",
      locale,
      description: t(locale, "noos.library.page_description"),
      noindex: true
    })
  };
}

async function renderLibraryProductPage(slug: string, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const product = await loadProductBySlugAsync(slug);
  if (!product) {
    return renderNotFound(t(locale, "noos.not_found.library_product"), buyerId, locale);
  }

  const item = library.items.find((entry) => entry.productCode === product.productCode);
  if (!item) {
    return renderNotFound(t(locale, "noos.not_found.product_not_owned"), buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.library_product.detail_kicker")}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${t(locale, "noos.library_product.hero_copy")}</p>
          <div class="meta-line">
            ${pill(getLocalizedLicenseLabel(item.licenseType, locale))}
            <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.library_product.purchased_record_heading"),
        `<ul class="summary-list">
          <li>${t(locale, "noos.library_product.purchased_date_label")} ${escapeHtml(formatDate(item.purchasedDate, locale))}</li>
          <li>${t(locale, "noos.library_product.current_version_label")}: ${escapeHtml(item.currentVersion)}</li>
          <li>${t(locale, "noos.library_product.update_status_label")}: ${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</li>
        </ul>`,
        t(locale, "noos.library_product.summary_label")
      )}
      ${section(
        t(locale, "noos.library_product.assets_heading"),
        `<ul class="feature-list">${localizedProduct.deliverables.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`,
        t(locale, "noos.library_product.assets_label")
      )}
      ${section(
        t(locale, "noos.library_product.version_timeline_heading"),
        `<div class="timeline-row"><div class="timeline-body"><h3>${escapeHtml(item.currentVersion)}</h3><p>${t(
          locale,
          "noos.library_product.current_version_entitlement"
        )}</p></div></div>`,
        t(locale, "noos.library_product.version_subheading")
      )}
      ${section(
        t(locale, "noos.library_product.upgrade_options_heading"),
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(getLocalizedRelatedLabel(product.secondaryUpsell, locale))}</h3><p>${t(
              locale,
              "noos.library.product_upgrade_next_step_fallback"
            )}</p></div></div>`,
        t(locale, "noos.library_product.upgrade_label")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: localizedProduct.name,
      active: "/library",
      body,
      buyerId,
      canonicalPath: `/library/product/${slug}`,
      locale,
      description: t(locale, "noos.library_product.page_description"),
      noindex: true
    })
  };
}

async function renderUpdatesPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-updates/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.library_updates.version_heading")}</div>
          <h1>${t(locale, "noos.library_updates.eligibility_heading")}</h1>
          <p class="hero-copy">${t(locale, "noos.library_updates.supporting_states_copy")}</p>
        </div>
      </section>
      ${section(
        t(locale, "noos.library_updates.timeline_heading"),
        library.items.length
          ? library.items
              .map(
                (item) => {
                  const localizedProduct = getProductByCode(item.productCode)
                    ? getLocalizedProduct(getProductByCode(item.productCode)!, locale)
                    : undefined;
                  return `
                  <article class="update-row">
                    <div class="update-body">
                      <div class="meta-line">
                        ${pill(item.productCode)}
                        <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
                      </div>
                      <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
                      <p>${escapeHtml(
                        item.updateStatus === "update_available"
                            ? t(locale, "noos.library.updates_available")
                          : item.updateStatus === "window_expired"
                          ? locale === "vi"
                            ? t(locale, "noos.library_updates.window_expired")
                            : t(locale, "noos.library_updates.window_expired_fallback")
                          : item.updateStatus === "upgraded"
                          ? locale === "vi"
                            ? t(locale, "noos.library_updates.entitlement_upgraded")
                            : t(locale, "noos.library_updates.entitlement_upgraded_fallback")
                          : item.updateStatus === "current"
                          ? t(locale, "noos.library_updates.entitlement_still_in_window")
                          : t(locale, "noos.library_updates.entitlement_window_unknown")
                      )}</p>
                    </div>
                    <div class="actions">
                      <a class="button" href="/library/product/${getDocumentsSlug(getProductByCode(item.productCode)!)}?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.btn.open_products")}</a>
                    </div>
                  </article>
                `;
                }
              )
              .join("")
          : `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library.no_updates_heading")}</h3><p>${t(locale, "noos.library.no_updates_body")}</p></div></div>`,
        t(locale, "noos.library_updates.tab_label")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.library_updates.title"),
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/updates",
      locale,
      description: t(locale, "noos.library_updates.page_description"),
      noindex: true
    })
  };
}

async function renderLibraryLicensesPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const hasTeamBundle = library.items.some((item) => item.productCode === "P12");
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-license-library/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.library_licenses.page_title")}</div>
          <h1>${t(locale, "noos.library_licenses.hero_heading")}</h1>
          <p class="hero-copy">${t(locale, "noos.library_license.surface_copy_description")}</p>
        </div>
      </section>
      ${section(
        t(locale, "noos.library_licenses.owned_heading"),
        library.items.length
          ? `<div class="license-grid">${library.items
              .map(
                (item) => {
                  const localizedProduct = getProductByCode(item.productCode)
                    ? getLocalizedProduct(getProductByCode(item.productCode)!, locale)
                    : undefined;
                  return `
                  <article class="license-card">
                    <div class="license-body">
                      <div class="meta-line">${pill(item.productCode)}<span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span></div>
                      <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
                      <p>${escapeHtml(getLocalizedLicenseLabel(item.licenseType, locale))}</p>
                    </div>
                  </article>
                `;
                }
              )
              .join("")}</div>`
          : `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library_licenses.empty_license_heading")}</h3><p>${t(locale, "noos.library_licenses.empty_license_body")}</p></div></div>`,
        t(locale, "noos.nav.licenses")
      )}
      ${hasTeamBundle
        ? section(
            t(locale, "noos.library_licenses.scale_up_title"),
            `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.library_licenses.small_team_heading")}</h3><p>${t(
              locale,
              "noos.library_licenses.small_team_body"
            )}</p><div class="cta-row"><a class="button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=P12">${t(
              locale,
              "noos.library_product.open_org_inquiry"
            )}</a></div></div></div>`,
            t(locale, "noos.library_licenses.handoff_label")
          )
        : ""}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.library_licenses.page_title"),
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/licenses",
      locale,
      description: t(locale, "noos.library_licenses.page_description"),
      noindex: true
    })
  };
}

async function renderLibraryAccountPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-account/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.library_account.page_kicker")}</div>
          <h1>${t(locale, "noos.library_account.hero_heading")}</h1>
          <p class="hero-copy">${t(locale, "noos.library_account.hero_copy")}</p>
        </div>
      </section>
      ${section(
        t(locale, "noos.library_account.summary_label"),
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(buyerId)}</h3><p>${t(locale, "noos.library_account.owned_products_label")}: ${library.items.length}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.queue.support")}</h3><p>${escapeHtml(["purchase-access", "license-upgrade", "refund-dispute"].map((queue) => getLocalizedTeam4QueueDetail(queue, locale).label).join(" · "))}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.library_account.account_routes_label")}</h3><p>${escapeHtml(library.routeSet.map((route) => buildLocalePath(locale, route)).join(" · "))}</p></div></article>
        </div>`,
        t(locale, "noos.library_account.section_title")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.library_account.page_title"),
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/account",
      locale,
      description: t(locale, "noos.library_account.page_description"),
      noindex: true
    })
  };
}

function renderOrderSummary(product: ProductDefinition, order: OrderRecord | undefined, locale: Locale): string {
  const localizedProduct = getLocalizedProduct(product, locale);
  if (!order) {
    return `<div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.name)}</h3><p>${formatUsd(product.priceUsd)} · ${escapeHtml(
      localizedProduct.defaultLicenseLabel
    )} · ${t(locale, "noos.checkout.order_lookup_pending")}</p></div></div>`;
  }

  return `<div class="two-column">
    <div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.name)}</h3><p>${formatUsd(order.amountSnapshotUsd)} · ${escapeHtml(getLocalizedLicenseLabel(order.licenseType, locale))}</p></div></div>
    <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.order_summary.order_label")} ${escapeHtml(order.orderId)}</h3><p>${escapeHtml(formatDate(order.purchasedAt, locale))}</p></div></div>
  </div>`;
}

function nextStepHref(nextStep: string | undefined, buyerId: string, locale: Locale, fallbackFrom?: ProductCode): string {
  const target = nextStep ?? "P01";
  if (/^P\d{2}$/.test(target)) {
    const product = getProductByCode(target as ProductCode);
    if (product) {
      return `${buildLocalePath(locale, product.route)}?buyer=${encodeURIComponent(buyerId)}`;
    }
  }

  const from = fallbackFrom ? `&from=${encodeURIComponent(fallbackFrom)}` : "";
  return `${buildLocalePath(locale, "/organization-inquiry")}?buyer=${encodeURIComponent(buyerId)}${from}`;
}

function renderTeamLicenseComparison(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const localizedProduct = getLocalizedProduct(product, locale);
  return `<div class="two-column">
    <div class="callout">
      <div class="callout-body">
        <h3>${escapeHtml(localizedProduct.defaultLicenseLabel)}</h3>
        <ul class="feature-list">
          <li>${t(locale, "noos.product.comparison_feature_1")}</li>
          <li>${t(locale, "noos.product.comparison_feature_2")}</li>
          <li>${t(locale, "noos.product.comparison_feature_3")}</li>
        </ul>
      </div>
    </div>
        <div class="callout">
          <div class="callout-body">
            <h3>${t(locale, "noos.organization_inquiry.handoff_title")}</h3>
            <ul class="feature-list">
          <li>${t(locale, "noos.organization_inquiry.handoff_boundary_line")}</li>
          <li>${t(locale, "noos.organization_inquiry.handoff_rollout_line")}</li>
          <li>${t(locale, "noos.organization_inquiry.handoff_scope_line")}</li>
        </ul>
        <div class="cta-row">
          <a class="button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=${encodeURIComponent(product.productCode)}">${t(
            locale,
            "noos.organization_inquiry.open_button"
          )}</a>
        </div>
      </div>
    </div>
  </div>`;
}

async function renderCheckoutPage(productCode: ProductCode, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const product = getProductByCode(productCode);
  if (!product) {
    return renderNotFound(t(locale, "noos.not_found.checkout_target"), buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.checkout.hero_kicker")}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${escapeHtml(localizedProduct.positioning)}</p>
          <div class="meta-line">
            ${pill(localizedProduct.defaultLicenseLabel)}
            ${pill(localizedProduct.updateWindowLabel)}
            <span class="price">${formatUsd(product.priceUsd)}</span>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.checkout.confirm_purchase_heading"),
        `<form class="form-grid" method="post" action="/checkout">
          <input type="hidden" name="buyer" value="${escapeHtml(buyerId)}" />
          <input type="hidden" name="product" value="${escapeHtml(product.productCode)}" />
          <input type="hidden" name="locale" value="${escapeHtml(locale)}" />
          <label>Email
            <input name="email" type="email" value="${escapeHtml(buyerId.replace(/^buyer_/, "") || "buyer")}@example.com" required />
          </label>
          <label>${t(locale, "noos.checkout.license_label")}
            <select name="license">
              <option value="${escapeHtml(product.defaultLicense)}">${escapeHtml(localizedProduct.defaultLicenseLabel)}</option>
              ${product.productCode === "P12" ? "" : `<option value="Small Team">${t(locale, "noos.checkout.small_team")}</option>`}
            </select>
          </label>
          <div class="cta-row">
            <button class="button" type="submit">${escapeHtml(localizedProduct.primaryCta)}</button>
            <a class="secondary-button" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${t(locale, "noos.checkout.return_to_product")}</a>
          </div>
        </form>`,
        t(locale, "noos.checkout.section_title")
      )}
      ${section(
        t(locale, "noos.checkout.before_payment_heading"),
        `<ul class="feature-list">
          <li>${t(locale, "noos.checkout_success.legal_product_terms")}</li>
          <li>${t(locale, "noos.checkout_success.legal_license_terms")}</li>
          <li>${t(locale, "noos.checkout_success.legal_tax_copy")}</li>
          <li>${t(locale, "noos.checkout_success.legal_success_redirect")}</li>
        </ul>`,
        t(locale, "noos.checkout_success.legal_heading")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.checkout.page_title"),
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/checkout",
      locale,
      description: t(locale, "noos.checkout.page_description"),
      noindex: true
    })
  };
}

async function renderCheckoutSuccessPage(
  buyerId: string,
  productCode: ProductCode,
  role: BuyerRole,
  orderId: string | undefined,
  locale: Locale
): Promise<RouteResponse> {
  const product = getProductByCode(productCode);
  if (!product) {
    return renderNotFound(t(locale, "noos.not_found.checkout_success_target"), buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const [order, library] = await Promise.all([
    orderId ? loadOrderAsync(orderId) : Promise.resolve(undefined),
    loadLibraryAsync(buyerId)
  ]);
  const purchasedProducts = library.items.length
    ? library.items.map((item) => item.productCode)
    : [productCode];
  const recommendation = await loadRecommendationAsync(purchasedProducts, role, "checkout-success");

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.checkout_success.hero_kicker")}</div>
          <h1>${escapeHtml(localizedProduct.name)} ${t(locale, "noos.checkout_success.ready_in_library")}</h1>
          <p class="hero-copy">${t(locale, "noos.checkout_success.hero_copy")}</p>
          <div class="hero-actions">
            <a class="button" href="/library?buyer=${encodeURIComponent(buyerId)}&role=${role}">${t(locale, "noos.btn.open_library")}</a>
            <a class="secondary-button" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${t(
              locale,
              "noos.checkout_success.return_to_product"
            )}</a>
          </div>
        </div>
      </section>
      ${section(t(locale, "noos.checkout_success.purchase_summary_heading"), renderOrderSummary(product, order, locale), t(locale, "noos.checkout_success.order_heading"))}
      ${section(
        t(locale, "noos.checkout_success.update_window_heading"),
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.updateWindowLabel)}</h3><p>${escapeHtml(localizedProduct.updateTypeLabels.join(", "))} ${t(
          locale,
          "noos.checkout_success.update_window_entitlement"
        )}</p></div></div>`,
        t(locale, "noos.checkout_success.access_heading")
      )}
      ${section(
        t(locale, "noos.checkout_success.next_step_title"),
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(
          getLocalizedRelatedLabel(recommendation.nextProductPrimary, locale)
        )}</h3><p>${escapeHtml(
          recommendation.upgradeLicenseOffer
            ? locale === "vi"
              ? `Có đường nâng cấp khả dụng: ${getLocalizedRelatedLabel(recommendation.upgradeLicenseOffer, locale)}.`
              : `Upgrade path available: ${recommendation.upgradeLicenseOffer}.`
              : t(locale, "noos.checkout_success.next_step_fallback")
        )}</p><div class="cta-row"><a class="button" href="${nextStepHref(
          recommendation.nextProductPrimary,
          buyerId,
          locale,
          product.productCode
        )}">${t(locale, "noos.library.next_step")}</a></div></div></div>`,
        t(locale, "noos.checkout_success.ladder_label")
      )}
      ${section(
        t(locale, "noos.checkout_success.fallback_section_title"),
        `<div class="callout"><div class="callout-body"><h3>${t(locale, "noos.checkout_success.support_help_title")}</h3><p>${t(locale, "noos.checkout_success.support_help_body")}</p></div></div>`,
        t(locale, "noos.checkout_success.fallback_audience")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.checkout_success.page_title"),
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/checkout-success",
      locale,
      description: t(locale, "noos.checkout_success.page_description"),
      noindex: true
    })
  };
}

function renderOrganizationInquiryPage(buyerId: string, fromCode: string | null, locale: Locale): RouteResponse {
  const sourceCode = fromCode && /^P\d{2}$/.test(fromCode) ? (fromCode as ProductCode) : "P12";
  const sourceProduct = getProductByCode(sourceCode) ?? getProductByCode("P12")!;
  const localizedSource = getLocalizedProduct(sourceProduct, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl("P12")}')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.organization_inquiry.kicker")}</div>
          <h1>${t(locale, "noos.organization_inquiry.page_title")}</h1>
          <p class="hero-copy">${t(locale, "noos.organization_inquiry.hero_copy")}</p>
          <div class="hero-actions">
            <a class="button" href="/product/${getDocumentsSlug(sourceProduct)}?buyer=${encodeURIComponent(buyerId)}">${t(
              locale,
              "noos.organization_inquiry.return_to_product",
              {
                code: localizedSource.productCode
              }
            )}</a>
            <a class="secondary-button" href="/library/licenses?buyer=${encodeURIComponent(buyerId)}">${t(
              locale,
              "noos.organization_inquiry.review_library_licenses"
            )}</a>
          </div>
        </div>
      </section>
      ${section(
        t(locale, "noos.organization_inquiry.when_to_use"),
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.organization_inquiry.scope_shift_title")}</h3><ul class="feature-list"><li>${t(locale, "noos.organization_inquiry.scope_shift_exceed")}</li><li>${t(locale, "noos.organization_inquiry.scope_shift_handoff")}</li><li>${t(locale, "noos.organization_inquiry.scope_shift_alignment")}</li></ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.organization_inquiry.boundary_check_heading")}</h3><p class="boundary-note">${t(
            locale,
            "noos.organization_inquiry.boundary_check_note"
          )}</p></div></div>
        </div>`,
        t(locale, "noos.organization_inquiry.handoff_label")
      )}
      ${section(
        t(locale, "noos.organization_inquiry.scale_section"),
        renderTeamLicenseComparison(sourceProduct, buyerId, locale),
        t(locale, "noos.organization_inquiry.license_path_label")
      )}
      ${section(
        t(locale, "noos.organization_inquiry.cross_team_title"),
        `<ul class="ops-list">
          <li>${t(locale, "noos.organization_inquiry.cross_team_line_1")}</li>
          <li>${t(locale, "noos.organization_inquiry.cross_team_line_2")}</li>
          <li>${t(locale, "noos.organization_inquiry.cross_team_line_3")}</li>
        </ul>`,
        t(locale, "noos.organization_inquiry.cross_team_label")
      )}
    </main>
  `;

    return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.organization_inquiry.page_title_short"),
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/organization-inquiry",
      locale,
      description: t(locale, "noos.organization_inquiry.page_description")
    })
  };
}

async function renderOperationsPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const [operations, team3Surface] = await Promise.all([
    loadTeam4OperationsAsync(),
    loadTeam3SurfaceAsync()
  ]);
  const statusSnapshot = getLocalizedTeam4StatusSnapshot(locale);
  const launchGates = getLocalizedTeam4LaunchGates(locale);
  const opsPacket = getLocalizedTeam4OpsPacketDetails(locale);
  const progress = getLocalizedTeam4ExecutionProgress(locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-operations/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.operations.hero_kicker")}</div>
          <h1>${t(locale, "noos.operations.hero_heading")}</h1>
          <p class="hero-copy">${t(locale, "noos.operations.hero_copy")}</p>
        </div>
      </section>
      ${section(
        t(locale, "noos.operations.current_status_section"),
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(statusSnapshot.releaseStatus)}</h3><p>${t(locale, "noos.operations.release_status_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(statusSnapshot.activeScope)}</h3><p>${t(locale, "noos.operations.current_team_scope_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.operations.gate_note_label")}</h3><p>${escapeHtml(statusSnapshot.blocker)}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(t(locale, "noos.operations.dependencies_label"))}</h3><p>${escapeHtml(statusSnapshot.dependencies.join(" · "))}</p></div></article>
        </div>`,
        t(locale, "noos.operations.readiness_label")
      )}
      ${section(
        t(locale, "noos.operations.progress_and_remaining_work"),
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.completedPercent)}</h3><p>${t(locale, "noos.operations.completed_plan_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.remainingPercent)}</h3><p>${t(locale, "noos.operations.remaining_work_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.asOf)}</h3><p>${t(locale, "noos.operations.checkpoint_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.laneState)}</h3><p>${t(locale, "noos.operations.current_lane_gate_label")}</p></div></article>
        </div>
        <div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.current_focus_label")}</h3><ul class="ops-list">${progress.focusNow
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><h3>${t(locale, "noos.operations.dependencies_in_view_label")}</h3><ul class="ops-list">${progress.blockedBy
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><div class="cta-row"><a class="mini-link" href="/operations/trace-map.json">${t(locale, "noos.operations.open_trace_map")}</a></div></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.locale_guard_label")}</h3><ul class="ops-list">${progress.localeGuard
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><h3>${t(locale, "noos.operations.lane_sequence_guard_label")}</h3><ul class="ops-list">${progress.sequenceGuard
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
        </div>`,
        t(locale, "noos.operations.execution_label")
      )}
      ${section(t(locale, "noos.operations.launch_waves_label"), renderLaunchWaves(operations, buyerId, locale), t(locale, "noos.operations.deployment_label"))}
      ${section(
        t(locale, "noos.operations.kpi_contract_label"),
        `<div class="ops-grid">${operations.kpis
          .map(
            (kpi) => {
                const detail = getLocalizedTeam4KpiDetail(kpi, locale) ?? {
                label: kpi,
                owner: t(locale, "noos.operations.team4_owner"),
                cadence: t(locale, "noos.operations.team4_kpi_cadence"),
                target: t(locale, "noos.operations.team4_kpi_target"),
                yellow: t(locale, "noos.operations.team4_kpi_yellow"),
                red: t(locale, "noos.operations.team4_kpi_red"),
                note: t(locale, "noos.operations.team4_kpi_note")
              };

              return `
              <article class="ops-card">
                <div class="ops-body">
                  <div class="meta-line">
                    ${pill(kpi)}
                    <span>${escapeHtml(detail.owner)} · ${escapeHtml(detail.cadence)}</span>
                  </div>
                  <h3>${escapeHtml(detail.label)}</h3>
                  <p>${escapeHtml(detail.note)}</p>
                  <ul class="ops-list">
                    <li>${t(locale, "noos.operations.target_label")}: ${escapeHtml(detail.target)}</li>
                    <li>${t(locale, "noos.operations.yellow_label")}: ${escapeHtml(detail.yellow)}</li>
                    <li>${t(locale, "noos.operations.red_label")}: ${escapeHtml(detail.red)}</li>
                  </ul>
                </div>
              </article>
            `;
            }
          )
          .join("")}</div>`,
        "KPIs"
      )}
      ${section(
        t(locale, "noos.operations.support_sla_label"),
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.operations.first_response_label")}</h3><p>${operations.supportSla.firstResponseHours} ${t(locale, "noos.operations.hours_unit")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.operations.resolution_label")}</h3><p>${operations.supportSla.resolutionHours} ${t(locale, "noos.operations.hours_unit")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.queue.title")}</h3><p>${escapeHtml(operations.supportSla.queues.map((queue) => getLocalizedTeam4QueueDetail(queue, locale).label).join(" · "))}</p></div></article>
        </div>
        <div class="ops-grid">${operations.supportSla.queues
          .map((queue) => {
            const detail = getLocalizedTeam4QueueDetail(queue, locale) ?? {
              label: queue,
              summary: t(locale, "noos.operations.queue_default_summary"),
              checks: [t(locale, "noos.operations.queue_manual_check_text")]
            };
            return `
              <article class="ops-card">
                <div class="ops-body">
              <div class="meta-line">
                    ${pill(queue)}
                    <span>${operations.supportSla.firstResponseHours}h ${t(locale, "noos.operations.first_response_unit") } · ${operations.supportSla.resolutionHours}h ${t(locale, "noos.operations.resolution_unit")}</span>
                  </div>
                  <h3>${escapeHtml(detail.label)}</h3>
                <p>${escapeHtml(detail.summary || t(locale, "noos.operations.default_queue_summary"))}</p>
                <ul class="ops-list">${detail.checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </div>
              </article>
            `;
          })
          .join("")}</div>`,
        t(locale, "noos.operations.support_section_label")
      )}
      ${section(
        t(locale, "noos.operations.owner_escalation_matrix"),
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.packetStatus)}</h3><p>${t(locale, "noos.operations.packet_team4_status_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.laneState)}</h3><p>${t(locale, "noos.operations.lane_state_label")}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.operations.gate_note_label")}</h3><p>${escapeHtml(opsPacket.laneReason)}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${t(locale, "noos.operations.language_lock_label")}</h3><p>${t(locale, "noos.operations.language_lock_copy")}</p></div></article>
        </div>
        <div class="ops-grid">${opsPacket.ownerRows
          .map(
            (row) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">
                  ${pill(t(locale, "noos.operations.owner_matrix_label"))}
                  <span>${escapeHtml(row.primary)} · ${escapeHtml(row.backup)}</span>
                </div>
                <h3>${escapeHtml(row.responsibility)}</h3>
                <ul class="ops-list">
                  <li>${t(locale, "noos.operations.owner_matrix_primary_label")}: ${escapeHtml(row.primary)}</li>
                  <li>${t(locale, "noos.operations.owner_matrix_backup_label")}: ${escapeHtml(row.backup)}</li>
                  <li>${t(locale, "noos.operations.owner_matrix_escalate_label")}: ${escapeHtml(row.trigger)}</li>
                </ul>
              </div>
            </article>
          `
          )
          .join("")}</div>`,
        t(locale, "noos.operations.packet_state_label")
      )}
      ${section(
        t(locale, "noos.operations.recovery_and_partner_handoff"),
        `<div class="two-column">
          <div class="callout">
            <div class="callout-body">
              <h3>${t(locale, "noos.operations.recovery_path_label")}</h3>
              <ul class="ops-list">${opsPacket.recoveryEntry.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <h3>${t(locale, "noos.operations.no_bypass_constraints_label")}</h3>
              <ul class="ops-list">${opsPacket.recoveryConstraints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="callout">
            <div class="callout-body">
              <h3>${t(locale, "noos.operations.partner_handoff")}</h3>
              <ul class="ops-list">${opsPacket.partnerHandoff.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </div>`,
        t(locale, "noos.operations.recovery_label")
      )}
      ${section(
        t(locale, "noos.operations.incident_matrix_heading"),
        `<div class="ops-grid">${opsPacket.incidents
          .map(
            (incident) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(t(locale, "noos.operations.incident_badge"))}</div>
                <h3>${escapeHtml(incident.incident)}</h3>
                <p>${t(locale, "noos.operations.support_action_label")}</p>
                <ul class="ops-list">${incident.support.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${t(locale, "noos.operations.escalation_path_label")}</p>
                <ul class="ops-list">${incident.escalation.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
            </article>
          `
          )
          .join("")}</div>
        <div class="ops-grid">${opsPacket.traceMappings
          .map(
            (mapping) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(t(locale, "noos.operations.trace_mapping_badge"))}</div>
                <h3>${escapeHtml(mapping.scenario)}</h3>
                <p>${t(locale, "noos.operations.detection_signals_label")}</p>
                <ul class="ops-list">${mapping.detectSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${t(locale, "noos.operations.required_trace_fields_label")}</p>
                <ul class="ops-list">${mapping.requiredTraceFields.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${t(locale, "noos.operations.decision_path_label")}</p>
                <ul class="ops-list">${mapping.decisionPath.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${t(locale, "noos.operations.escalation_owner_label")}</p>
                <ul class="ops-list">${mapping.escalateTo.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
            </article>
          `
          )
          .join("")}</div>
        <div class="ops-grid">${opsPacket.macros
          .map(
            (macro) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(t(locale, "noos.operations.macro_badge"))}</div>
                <h3>${escapeHtml(macro.label)}</h3>
                <p>${escapeHtml(macro.message)}</p>
              </div>
            </article>
          `
          )
          .join("")}</div>`,
        t(locale, "noos.operations.incident_section_label")
      )}
      ${section(
        t(locale, "noos.operations.rollback_communication_label"),
        `<div class="two-column">
          <div class="callout">
            <div class="callout-body">
              <h3>${t(locale, "noos.operations.rollback_owners_label")}</h3>
              <ul class="ops-list">${opsPacket.rollbackOwners.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <h3>${t(locale, "noos.operations.notification_list_label")}</h3>
              <ul class="ops-list">${opsPacket.rollbackNotify.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="callout">
            <div class="callout-body">
              <h3>${t(locale, "noos.operations.rollback_template_label")}</h3>
              <ul class="ops-list">${opsPacket.rollbackTemplates.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </div>`,
        t(locale, "noos.operations.rollback_label")
      )}
      ${section(
        t(locale, "noos.operations.guardrails_section"),
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.guardrails_heading")}</h3><ul class="ops-list">${operations.guardrails
            .map((item) => `<li>${escapeHtml(getLocalizedOpsToken(item, locale, guardrailLabels))}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.runbook_label")}</h3><ul class="ops-list">${operations.runbooks
            .map((item) => `<li>${escapeHtml(getLocalizedOpsToken(item, locale, runbookLabels))}</li>`)
            .join("")}</ul></div></div>
        </div>
        <div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.launch_gates_label")}</h3><ul class="ops-list">${launchGates
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${t(locale, "noos.operations.cross_team_dependencies_label")}</h3><ul class="ops-list">${statusSnapshot.dependencies
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}
            <li>${t(locale, "noos.operations.l1_lock_compliance_note")}</li>
          </ul></div></div>
        </div>
        <div class="boundary-card"><div class="boundary-body"><h3>${t(locale, "noos.operations.boundary_title")}</h3><p class="boundary-note">${t(
          locale,
          "noos.operations.boundary_copy"
        )} ${escapeHtml(team3Surface.requiredComponents.join(" · "))}</p></div></div>`,
        t(locale, "noos.operations.closure_label")
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
      body: layout({
      title: t(locale, "noos.nav.operations"),
      active: "/operations",
      body,
      buyerId,
      canonicalPath: "/operations",
      locale,
      description:
        t(locale, "noos.operations.description")
    })
  };
}

function renderOperationsTraceMapJson(locale: Locale): RouteResponse {
  const opsPacket = getLocalizedTeam4OpsPacketDetails(locale);
  const progress = getLocalizedTeam4ExecutionProgress(locale);
  const payload = {
    generatedAt: new Date().toISOString(),
    locale,
    packetStatus: opsPacket.packetStatus,
    laneState: opsPacket.laneState,
    laneReason: opsPacket.laneReason,
    progress,
    traceMappings: opsPacket.traceMappings,
    rollbackOwners: opsPacket.rollbackOwners
  };

  return {
    status: 200,
    contentType: "application/json; charset=utf-8",
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex,nofollow,noarchive"
    },
    body: JSON.stringify(payload, null, 2)
  };
}

function renderNotFound(message: string, buyerId: string, locale: Locale): RouteResponse {
  const chrome = getLocalizedChrome(locale);
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-not-found/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${t(locale, "noos.not_found.kicker")}</div>
          <h1>${escapeHtml(message)}</h1>
          <p class="hero-copy">${t(locale, "noos.operations.locked_routes_hint")}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.openProducts)}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(chrome.buttons.openLibrary)}</a>
          </div>
        </div>
      </section>
    </main>
  `;

  return {
    status: 404,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: t(locale, "noos.not_found.title"),
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/products",
      locale,
      description:
        t(locale, "noos.not_found.description"),
      noindex: true
    })
  };
}

function routeRedirectResponse(location: string): RouteResponse {
  return {
    status: 308,
    contentType: "text/plain; charset=utf-8",
    headers: {
      location,
      "x-robots-tag": "noindex, follow"
    },
    body: `Redirecting to ${location}`
  };
}

async function renderSitemap(): Promise<RouteResponse> {
  const catalog = await loadCatalogAsync();
  const baseRoutes = [
    "/products",
    "/documents",
    "/programs",
    "/licenses",
    "/operations",
    "/organization-inquiry",
    ...catalog.products.map((product) => product.route)
  ];
  const uniqueRoutes = Array.from(new Set(baseRoutes));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${uniqueRoutes
  .flatMap((route) =>
    supportedLocales.map(
      (locale) => `  <url>
    <loc>${canonicalUrl(locale, route)}</loc>
${supportedLocales
  .map(
    (alternate) =>
      `    <xhtml:link rel="alternate" hreflang="${localeMeta[alternate].htmlLang}" href="${canonicalUrl(alternate, route)}" />`
  )
  .join("\n")}
  </url>`
    )
  )
  .join("\n")}
</urlset>`;

  return {
    status: 200,
    contentType: "application/xml; charset=utf-8",
    body
  };
}

function renderRobots(): RouteResponse {
  return {
    status: 200,
    contentType: "text/plain; charset=utf-8",
    body: `User-agent: *
Allow: /en/products
Allow: /en/documents
Allow: /en/programs
Allow: /en/licenses
Allow: /en/operations
Allow: /en/organization-inquiry
Allow: /vi/products
Allow: /vi/documents
Allow: /vi/programs
Allow: /vi/licenses
Allow: /vi/operations
Allow: /vi/organization-inquiry
Disallow: /library
Disallow: /en/library
Disallow: /vi/library
Disallow: /checkout
Disallow: /en/checkout
Disallow: /vi/checkout
Disallow: /checkout-success
Disallow: /en/checkout-success
Disallow: /vi/checkout-success
Disallow: /docs/investment-programs/
Disallow: /en/docs/investment-programs/
Disallow: /vi/docs/investment-programs/
Disallow: /investor
Disallow: /investors
Disallow: /fundraising
Sitemap: https://noos.iai.one/sitemap.xml
`
  };
}

export async function renderCheckoutFromForm(body: URLSearchParams, locale: Locale = defaultLocale): Promise<RouteResponse> {
  const buyerId = body.get("buyer") ?? getDefaultBuyerId();
  const productCode = (body.get("product") as ProductCode | null) ?? "P11";
  const buyerEmail = body.get("email") ?? undefined;
  const licenseType = body.get("license") ?? undefined;
  const checkout = await executeCheckoutFlowAsync({
    buyerId,
    productCode,
    buyerEmail,
    licenseType,
    sourceSurface: "product-detail"
  });

  return {
    status: 303,
    contentType: "text/plain; charset=utf-8",
    headers: {
      location: `${buildLocalePath(locale, "/checkout-success")}?buyer=${encodeURIComponent(checkout.buyerId)}&product=${checkout.productCode}&order=${encodeURIComponent(checkout.orderId)}`
    },
    body: "Redirecting to checkout success"
  };
}

export async function renderRoute(pathname: string, searchParams: URLSearchParams): Promise<RouteResponse> {
  if (pathname === "/sitemap.xml") {
    return renderSitemap();
  }

  if (pathname === "/robots.txt") {
    return renderRobots();
  }

  const localized = parseLocalizedPath(pathname);
  const buyerId = searchParams.get("buyer") ?? getDefaultBuyerId();
  const role = getLocalizedRoleProfile(searchParams.get("role"), localized.locale).role;
  const locale = localized.locale;
  const querySuffix = searchParamsSuffix(searchParams);
  const normalizedPath =
    localized.rootLocaleOnly || localized.normalizedPath === "/"
      ? "/products"
      : localized.normalizedPath;
  const boundaryRedirect = matchesLegacyBoundaryRoute(normalizedPath);

  if (boundaryRedirect) {
    return redirectResponse(`${boundaryRedirect}${querySuffix}`, buyerId, locale);
  }

  if (localized.isLocalized && localized.normalizedPath === "/sitemap.xml") {
    return routeRedirectResponse("/sitemap.xml");
  }

  if (localized.isLocalized && localized.normalizedPath === "/robots.txt") {
    return routeRedirectResponse("/robots.txt");
  }

  if (!localized.isLocalized) {
    return routeRedirectResponse(`${buildLocalePath(locale, normalizedPath)}${querySuffix}`);
  }

  if (localized.rootLocaleOnly) {
    return routeRedirectResponse(`${buildLocalePath(locale, "/products")}${querySuffix}`);
  }

  if (normalizedPath === "/products") {
    return renderCatalogPage("all", buyerId, role, locale);
  }

  if (normalizedPath === "/documents") {
    return renderCatalogPage("documents", buyerId, role, locale);
  }

  if (normalizedPath === "/programs") {
    return renderCatalogPage("programs", buyerId, role, locale);
  }

  if (normalizedPath === "/licenses") {
    return renderLicensePage(buyerId, locale);
  }

  if (normalizedPath === "/organization-inquiry") {
    return renderOrganizationInquiryPage(buyerId, searchParams.get("from"), locale);
  }

  if (normalizedPath === "/operations") {
    return renderOperationsPage(buyerId, locale);
  }

  if (normalizedPath === "/operations/trace-map.json") {
    return renderOperationsTraceMapJson(locale);
  }

  if (normalizedPath === "/library") {
    return renderLibraryPage(buyerId, role, locale);
  }

  if (normalizedPath === "/library/updates") {
    return renderUpdatesPage(buyerId, locale);
  }

  if (normalizedPath === "/library/licenses") {
    return renderLibraryLicensesPage(buyerId, locale);
  }

  if (normalizedPath === "/library/account") {
    return renderLibraryAccountPage(buyerId, locale);
  }

  if (normalizedPath === "/checkout") {
    const productCode = (searchParams.get("product") as ProductCode | null) ?? "P11";
    return renderCheckoutPage(productCode, buyerId, locale);
  }

  if (normalizedPath === "/checkout-success") {
    const productCode = (searchParams.get("product") as ProductCode | null) ?? "P11";
    const orderId = searchParams.get("order") ?? undefined;
    return renderCheckoutSuccessPage(buyerId, productCode, role, orderId, locale);
  }

  if (normalizedPath.startsWith("/product/")) {
    const slug = normalizedPath.slice("/product/".length);
    const product = await loadProductBySlugAsync(slug);
    return product
      ? renderProductDetailPage(product, buyerId, locale)
      : renderNotFound(t(locale, "noos.not_found.product_not_found"), buyerId, locale);
  }

  if (normalizedPath.startsWith("/library/product/")) {
    const slug = normalizedPath.slice("/library/product/".length);
    return renderLibraryProductPage(slug, buyerId, locale);
  }

  return renderNotFound(t(locale, "noos.not_found.route_not_found"), buyerId, locale);
}
