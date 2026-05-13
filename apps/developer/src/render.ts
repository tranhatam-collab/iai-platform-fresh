import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";

export interface DeveloperRenderConfig {
  apiUrl: string;
  appUrl: string;
  dashUrl: string;
  docsUrl: string;
  flowApiUrl: string;
  flowUrl: string;
  homeUrl: string;
  rootUrl: string;
}

export type DeveloperRequiredRoutePath =
  | "/quickstart"
  | "/auth"
  | "/api/reference"
  | "/webhooks"
  | "/sdk"
  | "/nodes"
  | "/changelog";

export type DeveloperPolicyRoutePath = "/privacy" | "/terms" | "/support" | "/contact";

const requiredRoutePaths: DeveloperRequiredRoutePath[] = [
  "/quickstart",
  "/auth",
  "/api/reference",
  "/webhooks",
  "/sdk",
  "/nodes",
  "/changelog"
];

const policyRoutePaths: DeveloperPolicyRoutePath[] = ["/privacy", "/terms", "/support", "/contact"];

interface RequiredRouteCopy {
  description: string;
  detail1: string;
  detail2: string;
  detail3: string;
  eyebrow: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
}

interface PolicyRouteCopy {
  ctaHref: string;
  ctaLabel: string;
  detail1: string;
  detail2: string;
  detail3: string;
  eyebrow: string;
  intro: string;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
}

export function renderDeveloperHome(config: DeveloperRenderConfig, locale: Locale): string {
  return page(
    "/",
    locale,
    undefined,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.developer.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.developer.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="${escapeHtml(t(locale, "developer.nav.primary"))}">
          <a href="${escapeHtml(localizeExternalUrl(config.rootUrl, locale))}">${escapeHtml(t(locale, "nav.root"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.homeUrl, locale))}">${escapeHtml(t(locale, "nav.home"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.appUrl, locale))}">${escapeHtml(t(locale, "nav.app"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(t(locale, "nav.flow"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
          ${renderLocaleSwitch(locale, "/")}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "developer.hero.eyebrow"))}</p>
            <h1>${escapeHtml(t(locale, "surface.developer.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "developer.hero.body"))}</p>
            <p class="note">${escapeHtml(t(locale, "developer.hero.note"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/quickstart", locale))}">${escapeHtml(
                t(locale, "developer.hero.primary")
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(
                t(locale, "developer.hero.secondary")
              )}</a>
            </div>
          </div>
          <aside class="panel lane-panel">
            <p class="eyebrow">${escapeHtml(t(locale, "developer.quickstart.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "developer.quickstart.title"))}</h2>
            <ul class="stack-list">
              <li>
                <strong>${escapeHtml(t(locale, "developer.lane.auth.title"))}</strong>
                <p>${escapeHtml(t(locale, "developer.lane.auth.body"))}</p>
              </li>
              <li>
                <strong>${escapeHtml(t(locale, "developer.lane.api.title"))}</strong>
                <p>${escapeHtml(t(locale, "developer.lane.api.body"))}</p>
              </li>
              <li>
                <strong>${escapeHtml(t(locale, "developer.lane.webhook.title"))}</strong>
                <p>${escapeHtml(t(locale, "developer.lane.webhook.body"))}</p>
              </li>
            </ul>
          </aside>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(routeSectionEyebrow(locale))}</p>
          <h2>${escapeHtml(routeSectionTitle(locale))}</h2>
          <p>${escapeHtml(routeSectionBody(locale))}</p>
        </section>

        <section class="required-grid">
          ${requiredRoutePaths.map((path) => renderRequiredRouteCard(locale, path, null)).join("")}
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "developer.quickstart.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "developer.quickstart.title"))}</h2>
          <p>${escapeHtml(t(locale, "developer.quickstart.body"))}</p>
        </section>

        <section class="quickstart-grid">
          ${renderStep(t(locale, "developer.quickstart.step1.title"), t(locale, "developer.quickstart.step1.body"))}
          ${renderStep(t(locale, "developer.quickstart.step2.title"), t(locale, "developer.quickstart.step2.body"))}
          ${renderStep(t(locale, "developer.quickstart.step3.title"), t(locale, "developer.quickstart.step3.body"))}
          ${renderStep(t(locale, "developer.quickstart.step4.title"), t(locale, "developer.quickstart.step4.body"))}
        </section>

        <section class="contracts-grid">
          <article class="contract-card">
            <p class="eyebrow">${escapeHtml(t(locale, "developer.lane.auth.title"))}</p>
            <code>${escapeHtml(new URL(localizeExternalUrl(config.appUrl, locale)).host)}</code>
            <p>${escapeHtml(t(locale, "developer.lane.auth.body"))}</p>
            <a href="${escapeHtml(localizeExternalUrl(config.appUrl, locale))}">${escapeHtml(t(locale, "btn.open"))}</a>
          </article>
          <article class="contract-card">
            <p class="eyebrow">${escapeHtml(t(locale, "developer.lane.api.title"))}</p>
            <code>${escapeHtml(new URL(localizeExternalUrl(config.apiUrl, locale)).host)}</code>
            <p>${escapeHtml(t(locale, "developer.lane.api.body"))}</p>
            <a href="${escapeHtml(localizeExternalUrl(config.apiUrl, locale))}">${escapeHtml(
              t(locale, "btn.open_runtime")
            )}</a>
          </article>
          <article class="contract-card">
            <p class="eyebrow">${escapeHtml(t(locale, "developer.lane.webhook.title"))}</p>
            <code>${escapeHtml(new URL(localizeExternalUrl(config.flowApiUrl, locale)).host)}</code>
            <p>${escapeHtml(t(locale, "developer.lane.webhook.body"))}</p>
            <a href="${escapeHtml(localizeExternalUrl(config.flowApiUrl, locale))}">${escapeHtml(
              t(locale, "btn.open_runtime")
            )}</a>
          </article>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "developer.adjacent.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "developer.adjacent.title"))}</h2>
          <p>${escapeHtml(t(locale, "developer.adjacent.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "nav.root"), t(locale, "developer.surface.root.body"), config.rootUrl, t(locale, "btn.open"))}
          ${renderSurfaceCard(locale, t(locale, "nav.home"), t(locale, "developer.surface.home.body"), config.homeUrl, t(locale, "btn.open"))}
          ${renderSurfaceCard(locale, t(locale, "nav.docs"), t(locale, "developer.surface.docs.body"), config.docsUrl, t(locale, "btn.open_docs"))}
          ${renderSurfaceCard(locale, t(locale, "nav.flow"), t(locale, "developer.surface.flow.body"), config.flowUrl, t(locale, "btn.open_flow"))}
          ${renderSurfaceCard(locale, t(locale, "nav.dashboard"), t(locale, "developer.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"))}
          ${renderSurfaceCard(locale, t(locale, "nav.app"), t(locale, "developer.surface.app.body"), config.appUrl, t(locale, "btn.open"))}
        </section>

        <section class="boundary-grid">
          <article class="boundary-card"><p>${escapeHtml(t(locale, "developer.boundary1"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "developer.boundary2"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "developer.boundary3"))}</p></article>
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
        <p>${escapeHtml(t(locale, "footer.entity"))}</p>
        <p><a href="https://docs.iai.one/legal/iai-flow/">${escapeHtml(t(locale, "footer.legal.iai_flow"))}</a></p>
      </footer>
    `
  );
}

export function renderDeveloperRequiredRoute(
  config: DeveloperRenderConfig,
  locale: Locale,
  routePath: DeveloperRequiredRoutePath
): string {
  const copy = resolveRequiredRouteCopy(routePath, locale, config);
  return page(
    routePath,
    locale,
    copy.title,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.developer.domain"))}</p>
          <strong>${escapeHtml(copy.title)}</strong>
        </div>
        <nav class="topnav" aria-label="${escapeHtml(t(locale, "developer.nav.primary"))}">
          <a href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(t(locale, "surface.developer.title"))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/quickstart", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/quickstart", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/auth", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/auth", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/api/reference", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/api/reference", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/webhooks", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/webhooks", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/sdk", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/sdk", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/nodes", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/nodes", locale)
          )}</a>
          <a href="${escapeHtml(buildLocalizedPath("/changelog", locale))}">${escapeHtml(
            resolveRequiredRouteLabel("/changelog", locale)
          )}</a>
          ${renderLocaleSwitch(locale, routePath)}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
            <h1>${escapeHtml(copy.title)}</h1>
            <p class="lede">${escapeHtml(copy.description)}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(localizeExternalUrl(copy.primaryHref, locale))}">${escapeHtml(
                copy.primaryLabel
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(copy.secondaryHref, locale))}">${escapeHtml(
                copy.secondaryLabel
              )}</a>
            </div>
          </div>
          <aside class="panel lane-panel">
            <p class="eyebrow">${escapeHtml(routeChecklistEyebrow(locale))}</p>
            <h2>${escapeHtml(routeChecklistTitle(locale))}</h2>
            <ul class="stack-list">
              <li>${escapeHtml(copy.detail1)}</li>
              <li>${escapeHtml(copy.detail2)}</li>
              <li>${escapeHtml(copy.detail3)}</li>
            </ul>
          </aside>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(routeSectionEyebrow(locale))}</p>
          <h2>${escapeHtml(routeSectionTitle(locale))}</h2>
          <p>${escapeHtml(routeSectionBody(locale))}</p>
        </section>

        <section class="required-grid">
          ${requiredRoutePaths.map((path) => renderRequiredRouteCard(locale, path, routePath)).join("")}
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "nav.docs"), t(locale, "developer.surface.docs.body"), config.docsUrl, t(locale, "btn.open_docs"))}
          ${renderSurfaceCard(locale, t(locale, "nav.flow"), t(locale, "developer.surface.flow.body"), config.flowUrl, t(locale, "btn.open_flow"))}
          ${renderSurfaceCard(locale, t(locale, "nav.dashboard"), t(locale, "developer.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"))}
          ${renderSurfaceCard(locale, t(locale, "nav.app"), t(locale, "developer.surface.app.body"), config.appUrl, t(locale, "btn.open"))}
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
        <p>${escapeHtml(t(locale, "footer.entity"))}</p>
        <p><a href="https://docs.iai.one/legal/iai-flow/">${escapeHtml(t(locale, "footer.legal.iai_flow"))}</a></p>
      </footer>
    `
  );
}

export function renderDeveloperPolicyRoute(
  _config: DeveloperRenderConfig,
  locale: Locale,
  routePath: DeveloperPolicyRoutePath
): string {
  const copy = resolvePolicyRouteCopy(routePath, locale);
  return page(
    routePath,
    locale,
    copy.title,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.developer.domain"))}</p>
          <strong>${escapeHtml(copy.title)}</strong>
        </div>
        <nav class="topnav" aria-label="${escapeHtml(t(locale, "developer.nav.primary"))}">
          <a href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(t(locale, "surface.developer.title"))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/auth", locale))}">${escapeHtml(resolveRequiredRouteLabel("/auth", locale))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/privacy", locale))}">${escapeHtml(resolvePolicyRouteLabel("/privacy", locale))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/terms", locale))}">${escapeHtml(resolvePolicyRouteLabel("/terms", locale))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/support", locale))}">${escapeHtml(resolvePolicyRouteLabel("/support", locale))}</a>
          <a href="${escapeHtml(buildLocalizedPath("/contact", locale))}">${escapeHtml(resolvePolicyRouteLabel("/contact", locale))}</a>
          ${renderLocaleSwitch(locale, routePath)}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
            <h1>${escapeHtml(copy.title)}</h1>
            <p class="lede">${escapeHtml(copy.intro)}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(copy.ctaHref)}">${escapeHtml(copy.ctaLabel)}</a>
              <a class="secondary" href="${escapeHtml(copy.secondaryHref)}">${escapeHtml(copy.secondaryLabel)}</a>
            </div>
          </div>
          <aside class="panel lane-panel">
            <p class="eyebrow">${escapeHtml(locale === "vi" ? "Provider review" : "Provider review")}</p>
            <h2>${escapeHtml(locale === "vi" ? "Ranh giới vận hành" : "Operating boundaries")}</h2>
            <ul class="stack-list">
              <li>${escapeHtml(copy.detail1)}</li>
              <li>${escapeHtml(copy.detail2)}</li>
              <li>${escapeHtml(copy.detail3)}</li>
            </ul>
          </aside>
        </section>

        <section class="required-grid">
          ${policyRoutePaths.map((path) => renderPolicyRouteCard(locale, path, routePath)).join("")}
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
        <p>${escapeHtml(t(locale, "footer.entity"))}</p>
        <p><a href="https://docs.iai.one/legal/iai-flow/">${escapeHtml(t(locale, "footer.legal.iai_flow"))}</a></p>
      </footer>
    `
  );
}

export function renderDeveloperNotFound(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "developer.page.not_found"),
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.developer.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.developer.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="${escapeHtml(t(locale, "developer.nav.primary"))}">
          ${renderLocaleSwitch(locale, path)}
        </nav>
      </header>
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.developer.domain"))}</p>
            <h1>${escapeHtml(t(locale, "developer.not_found.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "developer.not_found.body"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(
                t(locale, "developer.not_found.back")
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
}

function resolvePolicyRouteCopy(routePath: DeveloperPolicyRoutePath, locale: Locale): PolicyRouteCopy {
  const isVi = locale === "vi";

  switch (routePath) {
    case "/privacy":
      return {
        ctaHref: "/support",
        ctaLabel: isVi ? "Nhận hỗ trợ" : "Get support",
        detail1: isVi
          ? "developer.iai.one không lưu OAuth secret, magic-link signing key, session cookie hoặc private key trong mã public."
          : "developer.iai.one does not store OAuth secrets, magic-link signing keys, session cookies, or private keys in public code.",
        detail2: isVi
          ? "Dữ liệu đăng nhập được xử lý bởi shared auth/session truth của hệ IAI, không fork riêng trên developer portal."
          : "Sign-in data is handled by the shared IAI auth/session truth and is not forked locally on the developer portal.",
        detail3: isVi
          ? "Form hoặc yêu cầu hỗ trợ chỉ nên gửi domain, endpoint, lỗi nhìn thấy và email liên hệ; không gửi raw secret."
          : "Support requests should include the domain, endpoint, visible error, and contact email only; do not send raw secrets.",
        eyebrow: "Privacy",
        intro: isVi
          ? "Trang này mô tả ranh giới quyền riêng tư cho tài liệu developer, auth integration, SDK, webhook và route hỗ trợ."
          : "This page describes privacy boundaries for developer docs, auth integration, SDKs, webhooks, and support routes.",
        secondaryHref: "/terms",
        secondaryLabel: isVi ? "Điều khoản" : "Terms",
        title: isVi ? "Quyền riêng tư IAI Developer" : "IAI Developer Privacy"
      };
    case "/terms":
      return {
        ctaHref: "/privacy",
        ctaLabel: isVi ? "Quyền riêng tư" : "Privacy",
        detail1: isVi
          ? "Developer portal dùng để đọc API, SDK, auth contract, webhook và changelog; không thay thế app hoặc dashboard vận hành."
          : "The developer portal is for API, SDK, auth contract, webhook, and changelog documentation; it does not replace the app or dashboard.",
        detail2: isVi
          ? "Không dùng portal để spam form, khai thác endpoint, giả mạo identity hoặc thử secret trên bề mặt public."
          : "Do not use the portal to spam forms, exploit endpoints, impersonate identity, or test secrets on public surfaces.",
        detail3: isVi
          ? "Mọi tích hợp production phải dùng redirect URI, scope, mail provider và secret đã được cấu hình ngoài mã nguồn."
          : "Production integrations must use redirect URIs, scopes, mail providers, and secrets configured outside source code.",
        eyebrow: "Terms",
        intro: isVi
          ? "Điều khoản này đặt ranh giới sử dụng cho developer.iai.one và các tài liệu tích hợp liên quan."
          : "These terms set usage boundaries for developer.iai.one and its integration documentation.",
        secondaryHref: "/support",
        secondaryLabel: isVi ? "Hỗ trợ" : "Support",
        title: isVi ? "Điều khoản IAI Developer" : "IAI Developer Terms"
      };
    case "/support":
      return {
        ctaHref: "mailto:support@iai.one",
        ctaLabel: "support@iai.one",
        detail1: isVi
          ? "Gửi domain, route, thời điểm lỗi, status code và ảnh chụp màn hình nếu Google OAuth hoặc magic link không hoạt động."
          : "Send the domain, route, time, status code, and screenshot if Google OAuth or magic link is not working.",
        detail2: isVi
          ? "Không gửi OAuth client secret, magic-link key, token, cookie, private key hoặc dữ liệu định danh nhạy cảm."
          : "Do not send OAuth client secrets, magic-link keys, tokens, cookies, private keys, or sensitive identity data.",
        detail3: isVi
          ? "Nếu vấn đề thuộc app login thật, chuyển sang app.iai.one hoặc API owner thay vì sửa riêng developer portal."
          : "If the issue belongs to the real app login, route it to app.iai.one or the API owner instead of forking the developer portal.",
        eyebrow: "Support",
        intro: isVi
          ? "Kênh hỗ trợ cho tài liệu API, auth contract, SDK, webhook, route public và bằng chứng tích hợp."
          : "Support channel for API docs, auth contracts, SDKs, webhooks, public routes, and integration evidence.",
        secondaryHref: "/contact",
        secondaryLabel: isVi ? "Liên hệ" : "Contact",
        title: isVi ? "Hỗ trợ IAI Developer" : "IAI Developer Support"
      };
    case "/contact":
      return {
        ctaHref: "mailto:contact@iai.one",
        ctaLabel: "contact@iai.one",
        detail1: isVi
          ? "Dùng contact@iai.one cho yêu cầu partnership, API access, SDK, webhook, legal hoặc public-surface feedback."
          : "Use contact@iai.one for partnership, API access, SDK, webhook, legal, or public-surface feedback.",
        detail2: isVi
          ? "Dùng support@iai.one cho lỗi đăng nhập, magic link, callback, route hoặc bằng chứng smoke test."
          : "Use support@iai.one for sign-in, magic-link, callback, route, or smoke-test evidence issues.",
        detail3: isVi
          ? "Mọi thông tin cần đủ để xử lý nhưng không chứa raw secret hoặc dữ liệu định danh nhạy cảm."
          : "Provide enough information to route the issue without including raw secrets or sensitive identity data.",
        eyebrow: "Contact",
        intro: isVi
          ? "Liên hệ chính thức cho yêu cầu developer, tích hợp, API, SDK và legal liên quan developer.iai.one."
          : "Official contact route for developer, integration, API, SDK, and legal requests related to developer.iai.one.",
        secondaryHref: "/support",
        secondaryLabel: isVi ? "Hỗ trợ" : "Support",
        title: isVi ? "Liên hệ IAI Developer" : "IAI Developer Contact"
      };
  }
}

function renderPolicyRouteCard(
  locale: Locale,
  routePath: DeveloperPolicyRoutePath,
  currentPath: DeveloperPolicyRoutePath
): string {
  const label = resolvePolicyRouteLabel(routePath, locale);
  const href = buildLocalizedPath(routePath, locale);
  const isCurrent = routePath === currentPath;
  return `
    <article class="surface-card">
      <h3>${escapeHtml(label)}</h3>
      <p>${escapeHtml(resolvePolicyRouteSummary(routePath, locale))}</p>
      <div class="card-footer">
        <code>${escapeHtml(routePath)}</code>
        <a href="${escapeHtml(href)}" ${isCurrent ? 'aria-current="true"' : ""}>${escapeHtml(
          isCurrent ? t(locale, "developer.route.current") : t(locale, "developer.route.open")
        )}</a>
      </div>
    </article>
  `;
}

function resolvePolicyRouteLabel(routePath: DeveloperPolicyRoutePath, locale: Locale): string {
  const isVi = locale === "vi";
  switch (routePath) {
    case "/privacy":
      return isVi ? "Quyền riêng tư" : "Privacy";
    case "/terms":
      return isVi ? "Điều khoản" : "Terms";
    case "/support":
      return isVi ? "Hỗ trợ" : "Support";
    case "/contact":
      return isVi ? "Liên hệ" : "Contact";
  }
}

function resolvePolicyRouteSummary(routePath: DeveloperPolicyRoutePath, locale: Locale): string {
  const isVi = locale === "vi";
  switch (routePath) {
    case "/privacy":
      return isVi ? "Dữ liệu, auth và secret boundary." : "Data, auth, and secret boundaries.";
    case "/terms":
      return isVi ? "Ranh giới sử dụng developer portal." : "Developer portal usage boundaries.";
    case "/support":
      return isVi ? "Hỗ trợ route, OAuth, magic link và SDK." : "Route, OAuth, magic-link, and SDK support.";
    case "/contact":
      return isVi ? "Kênh liên hệ tích hợp và legal." : "Integration and legal contact route.";
  }
}

function resolveRequiredRouteCopy(
  routePath: DeveloperRequiredRoutePath,
  locale: Locale,
  config: DeveloperRenderConfig
): RequiredRouteCopy {
  const routeKey = requiredRouteKey(routePath);
  const routeBaseKey = `developer.route.${routeKey}`;

  return {
    description: t(locale, `${routeBaseKey}.description`),
    detail1: t(locale, `${routeBaseKey}.detail1`),
    detail2: t(locale, `${routeBaseKey}.detail2`),
    detail3: t(locale, `${routeBaseKey}.detail3`),
    eyebrow: t(locale, `${routeBaseKey}.eyebrow`),
    primaryHref: resolveRoutePrimaryHref(routePath, config),
    primaryLabel: t(locale, `${routeBaseKey}.primary_label`),
    secondaryHref: resolveRouteSecondaryHref(routePath, config),
    secondaryLabel: t(locale, `${routeBaseKey}.secondary_label`),
    title: t(locale, `${routeBaseKey}.title`)
  };
}

function routeSectionEyebrow(locale: Locale): string {
  return t(locale, "developer.route_section.eyebrow");
}

function routeSectionTitle(locale: Locale): string {
  return t(locale, "developer.route_section.title");
}

function routeSectionBody(locale: Locale): string {
  return t(locale, "developer.route_section.body");
}

function routeChecklistEyebrow(locale: Locale): string {
  return t(locale, "developer.route_checklist.eyebrow");
}

function routeChecklistTitle(locale: Locale): string {
  return t(locale, "developer.route_checklist.title");
}

function renderStep(title: string, body: string): string {
  return `
    <article class="step-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function renderRequiredRouteCard(
  locale: Locale,
  routePath: DeveloperRequiredRoutePath,
  currentPath: DeveloperRequiredRoutePath | null
): string {
  const isCurrent = routePath === currentPath;
  const label = resolveRequiredRouteLabel(routePath, locale);
  const href = buildLocalizedPath(routePath, locale);
  const cta = isCurrent
    ? t(locale, "developer.route.current")
    : t(locale, "developer.route.open");

  return `
    <article class="surface-card">
      <h3>${escapeHtml(label)}</h3>
      <p>${escapeHtml(resolveRequiredRouteSummary(routePath, locale))}</p>
      <div class="card-footer">
        <code>${escapeHtml(routePath)}</code>
        <a href="${escapeHtml(href)}" ${isCurrent ? 'aria-current="true"' : ""}>${escapeHtml(cta)}</a>
      </div>
    </article>
  `;
}

function resolveRequiredRouteLabel(routePath: DeveloperRequiredRoutePath, locale: Locale): string {
  return t(locale, `developer.route.${requiredRouteKey(routePath)}.title`);
}

function resolveRequiredRouteSummary(routePath: DeveloperRequiredRoutePath, locale: Locale): string {
  return t(locale, `developer.route.${requiredRouteKey(routePath)}.summary`);
}

function requiredRouteKey(routePath: DeveloperRequiredRoutePath): string {
  switch (routePath) {
    case "/quickstart":
      return "quickstart";
    case "/auth":
      return "auth";
    case "/api/reference":
      return "api_reference";
    case "/webhooks":
      return "webhooks";
    case "/sdk":
      return "sdk";
    case "/nodes":
      return "nodes";
    case "/changelog":
      return "changelog";
  }
}

function resolveRoutePrimaryHref(
  routePath: DeveloperRequiredRoutePath,
  config: DeveloperRenderConfig
): string {
  switch (routePath) {
    case "/quickstart":
      return config.docsUrl;
    case "/auth":
      return config.appUrl;
    case "/api/reference":
      return config.apiUrl;
    case "/webhooks":
      return config.flowApiUrl;
    case "/sdk":
      return config.docsUrl;
    case "/nodes":
      return config.flowUrl;
    case "/changelog":
      return config.docsUrl;
  }
}

function resolveRouteSecondaryHref(
  routePath: DeveloperRequiredRoutePath,
  config: DeveloperRenderConfig
): string {
  switch (routePath) {
    case "/quickstart":
      return config.flowUrl;
    case "/auth":
      return config.docsUrl;
    case "/api/reference":
      return config.docsUrl;
    case "/webhooks":
      return config.flowUrl;
    case "/sdk":
      return config.apiUrl;
    case "/nodes":
      return config.dashUrl;
    case "/changelog":
      return config.dashUrl;
  }
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
        --bg: #f1efe9;
        --panel: rgba(255, 255, 255, 0.84);
        --ink: #1d222d;
        --muted: #626a7c;
        --line: rgba(29, 34, 45, 0.14);
        --accent: #1f5f5b;
        --accent-soft: rgba(31, 95, 91, 0.12);
        --accent-strong: #174542;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(31, 95, 91, 0.16), transparent 26%),
          radial-gradient(circle at top right, rgba(23, 69, 66, 0.08), transparent 22%),
          linear-gradient(180deg, #ebe8de 0%, var(--bg) 50%, #f7f5ef 100%);
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
      .required-grid,
      .quickstart-grid,
      .contracts-grid,
      .boundary-grid {
        display: grid;
        gap: 16px;
      }

      .topbar {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        background: rgba(241, 239, 233, 0.9);
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
      .contract-card,
      .step-card,
      .boundary-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
      }

      .section-head {
        display: grid;
        gap: 8px;
      }

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.11em;
        font-size: 11px;
        color: var(--muted);
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(1.9rem, 4.1vw, 2.75rem);
        line-height: 1.1;
      }

      h2 {
        font-size: clamp(1.34rem, 2.5vw, 1.8rem);
      }

      h3 {
        font-size: 1.03rem;
      }

      .lede {
        font-size: 1.01rem;
        line-height: 1.6;
        color: var(--ink);
      }

      .note,
      .surface-card p,
      .step-card p,
      .contract-card p,
      .boundary-card p,
      .section-head p {
        color: var(--muted);
        line-height: 1.65;
      }

      .actions {
        grid-auto-flow: column;
        justify-content: start;
      }

      .actions a {
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 600;
      }

      .actions .primary {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
        color: #f4faf9;
      }

      .actions .secondary {
        border: 1px solid var(--line);
        color: var(--ink);
      }

      .stack-list {
        margin: 10px 0 0;
        padding-left: 18px;
        display: grid;
        gap: 10px;
      }

      .stack-list li {
        color: var(--muted);
      }

      .quickstart-grid,
      .required-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .contracts-grid,
      .surface-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .contract-card,
      .surface-card {
        display: grid;
        gap: 10px;
      }

      .contract-card a,
      .surface-card a {
        justify-self: start;
        padding: 8px 12px;
        border-radius: 9px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-weight: 600;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .boundary-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .footer {
        border-top: 1px solid var(--line);
        padding: 16px 24px 24px;
        color: var(--muted);
        display: grid;
        gap: 6px;
      }

      @media (max-width: 900px) {
        .topbar {
          position: static;
          grid-template-columns: 1fr;
          align-items: start;
        }

        .hero {
          grid-template-columns: 1fr;
        }

        .actions {
          grid-auto-flow: row;
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
  return `
    <div class="locale-list" role="list" aria-label="${escapeHtml(t(locale, "developer.locale_switch"))}">
      ${supportedLocales
        .map((targetLocale) => {
          const href = buildLocalizedPath(path, targetLocale);
          const isActive = targetLocale === locale;
          return `<a role="listitem" href="${escapeHtml(href)}" ${
            isActive ? 'aria-current="true"' : ""
          }>${targetLocale.toUpperCase()}</a>`;
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
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
