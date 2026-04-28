import {
  buildLocalizedPath,
  defaultLocale,
  getPageMetadata,
  t,
  type Locale
} from "./i18n.js";

export type OnboardingRole = "starter" | "builder" | "operator";
export type OnboardingIntent = "information" | "leads" | "commerce";

export interface SharedContractConfig {
  flowApiBase: string;
  sharedAuthUrl: string;
  sharedBillingUrl: string;
  sharedAppUrl: string;
  sharedFlowUrl: string;
  sharedDashUrl: string;
}

export interface RoutePlan {
  label: string;
  description: string;
  nextUrl: string;
  productSurface: "app" | "flow" | "dash";
}

export interface ContractStatus {
  alertsCriticalOpen: number;
  approvalsPending: number;
  blockers: string[];
  billingOverdueCount: number;
  generatedAt: string;
  healthStatus: string;
  sharedContractState: "ready" | "blocked";
  service: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(path: string, locale: Locale, body: string): string {
  const metadata = getPageMetadata(path, locale);
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": metadata.schemaType,
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
    <meta property="og:title" content="${escapeHtml(metadata.title)}" />
    <meta property="og:description" content="${escapeHtml(metadata.description)}" />
    <meta property="og:url" content="${escapeHtml(metadata.canonical)}" />
    <meta property="og:type" content="website" />
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
      :root { --bg: #f2f4f1; --ink: #0f1414; --muted: #52605f; --line: rgba(15,20,20,.14); --panel: rgba(255,255,255,.92); --accent: #1f8f6d; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif; background: var(--bg); color: var(--ink); }
      a { color: inherit; text-decoration: none; }
      .site-header { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 24px; background: rgba(242,244,241,.92); border-bottom: 1px solid var(--line); }
      .brand { font-size: 20px; font-weight: 700; }
      nav { display: flex; gap: 14px; }
      nav a { color: var(--muted); font-size: 14px; }
      nav a[aria-current="page"] { color: var(--ink); font-weight: 600; }
      .hero,.content-band,.footer-inner { width: min(1120px,100%); margin: 0 auto; }
      .hero-wrap { padding: 28px 24px; background: linear-gradient(180deg, rgba(9,14,13,.08), rgba(9,14,13,.34)); color: #f7fbf9; }
      .eyebrow { font-size: 13px; font-weight: 700; text-transform: uppercase; opacity: .86; }
      h1,h2,h3,p { margin: 0; }
      .hero-copy { width: min(620px,100%); margin-top: 10px; }
      .cta-row { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 12px; }
      .primary-cta,.secondary-cta,button { border: none; border-radius: 8px; padding: 12px 16px; font: inherit; font-weight: 700; cursor: pointer; }
      .primary-cta,button { background: var(--accent); color: #f8fbfa; }
      .secondary-cta { background: rgba(255,255,255,.14); color: #f8fbfa; border: 1px solid rgba(255,255,255,.24); }
      .content-band { padding: 28px 24px; border-top: 1px solid var(--line); }
      .split { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }
      .triple { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; }
      .plain-list,.field-group { display: grid; gap: 10px; }
      .plain-list div,.status-row,.step { padding: 12px 0; border-top: 1px solid var(--line); }
      .plain-list div:first-child,.status-row:first-child,.step:first-child { border-top: none; padding-top: 0; }
      .status-strong { font-weight: 700; }
      .route-strong,.accent-line { font-weight: 700; color: var(--ink); }
      .choice-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
      .choice { display: grid; gap: 6px; align-content: start; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,.72); }
      .choice-title { font-weight: 700; }
      .note { color: var(--muted); font-size: 14px; }
      .footer-inner { padding: 26px 24px 38px; color: var(--muted); font-size: 14px; display: grid; gap: 8px; }
      @media (max-width: 880px) { .split,.triple,.choice-grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

function header(locale: Locale, active: "home" | "onboarding"): string {
  return `
    <header class="site-header">
      <a class="brand" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(t(locale, "nav.web"))}</a>
      <nav aria-label="${escapeHtml(t(locale, "footer.nav.surfaces"))}">
        <a href="${escapeHtml(buildLocalizedPath("/", locale))}"${active === "home" ? ' aria-current="page"' : ""}>${escapeHtml(t(locale, "web.title"))}</a>
        <a href="${escapeHtml(buildLocalizedPath("/onboarding", locale))}"${active === "onboarding" ? ' aria-current="page"' : ""}>${escapeHtml(t(locale, "web.template"))}</a>
      </nav>
    </header>
  `;
}

function hero(locale: Locale, eyebrowKey: string, title: string, body: string, primaryHref: string, secondaryHref: string): string {
  return `
    <section class="hero-wrap">
      <div class="hero">
        <div class="eyebrow">${escapeHtml(t(locale, eyebrowKey))}</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-copy">${escapeHtml(body)}</p>
        <div class="cta-row">
          <a class="primary-cta" href="${escapeHtml(primaryHref)}">${escapeHtml(t(locale, "btn.continue"))}</a>
          <a class="secondary-cta" href="${escapeHtml(secondaryHref)}">${escapeHtml(t(locale, "web.action.review_contracts"))}</a>
        </div>
      </div>
    </section>
  `;
}

function checked(value: string, selected: string): string {
  return value === selected ? ' checked="checked"' : "";
}

export function renderLanding(config: SharedContractConfig, locale: Locale = defaultLocale): string {
  return page(
    "/",
    locale,
    `
      ${header(locale, "home")}
      ${hero(locale, "web.hero.eyebrow", t(locale, "web.landing.title"), t(locale, "web.landing.body"), buildLocalizedPath("/onboarding", locale), `${buildLocalizedPath("/onboarding", locale)}#contracts`)}
      <section class="content-band"><div>
        <div class="eyebrow">${escapeHtml(t(locale, "web.landing.route_eyebrow"))}</div>
        <div class="split"><div><h2>${escapeHtml(t(locale, "web.landing.heading"))}</h2></div><div class="plain-list">
          <div><div class="status-strong">${escapeHtml(t(locale, "web.landing.step1.title"))}</div><p>${escapeHtml(t(locale, "web.landing.step1.body"))}</p></div>
          <div><div class="status-strong">${escapeHtml(t(locale, "web.landing.step2.title"))}</div><p>${escapeHtml(t(locale, "web.landing.step2.body"))}</p></div>
          <div><div class="status-strong">${escapeHtml(t(locale, "web.landing.step3.title"))}</div><p>${escapeHtml(t(locale, "web.landing.step3.body"))}</p></div>
        </div></div>
      </div></section>
      <section class="content-band"><div>
        <div class="eyebrow">${escapeHtml(t(locale, "web.landing.boundaries_eyebrow"))}</div>
        <div class="triple">
          <div class="step"><h3>${escapeHtml(t(locale, "web.landing.boundary.auth.title"))}</h3><p>${escapeHtml(t(locale, "web.landing.boundary.auth.body", { sharedAuthUrl: config.sharedAuthUrl }))}</p></div>
          <div class="step"><h3>${escapeHtml(t(locale, "web.landing.boundary.billing.title"))}</h3><p>${escapeHtml(t(locale, "web.landing.boundary.billing.body", { sharedBillingUrl: config.sharedBillingUrl }))}</p></div>
          <div class="step"><h3>${escapeHtml(t(locale, "web.landing.boundary.execution.title"))}</h3><p>${escapeHtml(t(locale, "web.landing.boundary.execution.body", { flowApiBase: config.flowApiBase }))}</p></div>
        </div>
      </div></section>
      <footer><div class="footer-inner"><p>${escapeHtml(t(locale, "web.landing.footer"))}</p><p>${escapeHtml(t(locale, "footer.statement"))}</p><p>${escapeHtml(t(locale, "footer.trust"))}</p></div></footer>
    `
  );
}

export function renderOnboardingForm(
  config: SharedContractConfig,
  defaults: { role: OnboardingRole; intent: OnboardingIntent },
  locale: Locale = defaultLocale
): string {
  return page(
    "/onboarding",
    locale,
    `
      ${header(locale, "onboarding")}
      ${hero(locale, "web.onboarding.form_eyebrow", t(locale, "web.onboarding.route_user_title"), t(locale, "web.onboarding.route_user_body"), "#form", "#contracts")}
      <section class="content-band" id="form"><div>
        <div class="eyebrow">${escapeHtml(t(locale, "web.onboarding.form_eyebrow"))}</div>
        <div class="split"><div><h2>${escapeHtml(t(locale, "web.onboarding.heading"))}</h2></div>
          <form method="post" action="${escapeHtml(buildLocalizedPath("/onboarding", locale))}" class="field-group">
            <div class="field-group"><h3>${escapeHtml(t(locale, "web.role.label"))}</h3><div class="choice-grid">
              <label class="choice"><input type="radio" name="role" value="starter"${checked("starter", defaults.role)} /><span class="choice-title">${escapeHtml(t(locale, "web.role.starter"))}</span><span class="note">${escapeHtml(t(locale, "web.role.starter.body"))}</span></label>
              <label class="choice"><input type="radio" name="role" value="builder"${checked("builder", defaults.role)} /><span class="choice-title">${escapeHtml(t(locale, "web.role.builder"))}</span><span class="note">${escapeHtml(t(locale, "web.role.builder.body"))}</span></label>
              <label class="choice"><input type="radio" name="role" value="operator"${checked("operator", defaults.role)} /><span class="choice-title">${escapeHtml(t(locale, "web.role.operator"))}</span><span class="note">${escapeHtml(t(locale, "web.role.operator.body"))}</span></label>
            </div></div>
            <div class="field-group"><h3>${escapeHtml(t(locale, "web.intent.label"))}</h3><div class="choice-grid">
              <label class="choice"><input type="radio" name="intent" value="information"${checked("information", defaults.intent)} /><span class="choice-title">${escapeHtml(t(locale, "web.intent.information"))}</span><span class="note">${escapeHtml(t(locale, "web.intent.information.body"))}</span></label>
              <label class="choice"><input type="radio" name="intent" value="leads"${checked("leads", defaults.intent)} /><span class="choice-title">${escapeHtml(t(locale, "web.intent.leads"))}</span><span class="note">${escapeHtml(t(locale, "web.intent.leads.body"))}</span></label>
              <label class="choice"><input type="radio" name="intent" value="commerce"${checked("commerce", defaults.intent)} /><span class="choice-title">${escapeHtml(t(locale, "web.intent.commerce"))}</span><span class="note">${escapeHtml(t(locale, "web.intent.commerce.body"))}</span></label>
            </div></div>
            <button type="submit">${escapeHtml(t(locale, "web.action.run_contract_check"))}</button>
          </form>
        </div>
      </div></section>
      <section class="content-band" id="contracts"><div>
        <div class="eyebrow">${escapeHtml(t(locale, "web.onboarding.contracts_eyebrow"))}</div>
        <div class="triple">
          <div class="step"><h3>${escapeHtml(t(locale, "web.onboarding.contracts.auth.title"))}</h3><p>${escapeHtml(t(locale, "web.onboarding.contracts.auth.body", { sharedAuthUrl: config.sharedAuthUrl }))}</p></div>
          <div class="step"><h3>${escapeHtml(t(locale, "web.onboarding.contracts.billing.title"))}</h3><p>${escapeHtml(t(locale, "web.onboarding.contracts.billing.body", { sharedBillingUrl: config.sharedBillingUrl }))}</p></div>
          <div class="step"><h3>${escapeHtml(t(locale, "web.onboarding.contracts.execution.title"))}</h3><p>${escapeHtml(t(locale, "web.onboarding.contracts.execution.body", { flowApiBase: config.flowApiBase }))}</p></div>
        </div>
      </div></section>
      <footer><div class="footer-inner"><p>${escapeHtml(t(locale, "web.onboarding.footer"))}</p><p>${escapeHtml(t(locale, "footer.statement"))}</p></div></footer>
    `
  );
}

export function renderOnboardingSummary({
  config,
  contract,
  plan,
  role,
  intent,
  sharedAuthHref
}: {
  config: SharedContractConfig;
  contract: ContractStatus;
  plan: RoutePlan;
  role: OnboardingRole;
  intent: OnboardingIntent;
  sharedAuthHref: string;
}, locale: Locale = defaultLocale): string {
  return page(
    "/onboarding",
    locale,
    `
      ${header(locale, "onboarding")}
      ${hero(locale, "web.summary.route_eyebrow", t(locale, "web.summary.title.passed"), t(locale, contract.sharedContractState === "ready" ? "web.summary.body.ready" : "web.summary.body.blocked"), sharedAuthHref, buildLocalizedPath("/onboarding", locale))}
      <section class="content-band"><div><div class="eyebrow">${escapeHtml(t(locale, "web.summary.route_eyebrow"))}</div><div class="split"><div><h2>${escapeHtml(plan.label)}</h2><p>${escapeHtml(plan.description)}</p></div><div class="plain-list">
        <div><div class="status-strong">${escapeHtml(t(locale, "web.role.label"))}</div><p>${escapeHtml(role)}</p></div>
        <div><div class="status-strong">${escapeHtml(t(locale, "web.intent.label"))}</div><p>${escapeHtml(intent)}</p></div>
        <div><div class="status-strong">${escapeHtml(t(locale, "web.summary.next_route"))}</div><p class="route-strong">${escapeHtml(plan.nextUrl)}</p></div>
        <div><div class="status-strong">${escapeHtml(t(locale, "web.summary.auth_mode"))}</div><p>${escapeHtml(t(locale, "web.summary.auth_mode.shared"))}</p></div>
      </div></div></div></section>
      <section class="content-band"><div><div class="eyebrow">${escapeHtml(t(locale, "web.summary.contract_eyebrow"))}</div><div class="split"><div><h2>${escapeHtml(t(locale, "web.summary.contract_heading"))}</h2></div><div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.service"))}</div><p>${escapeHtml(contract.service)} <span class="accent-line">${escapeHtml(contract.healthStatus)}</span></p></div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.generated"))}</div><p>${escapeHtml(contract.generatedAt)}</p></div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.pending_approvals"))}</div><p>${escapeHtml(String(contract.approvalsPending))}</p></div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.billing_overdue"))}</div><p>${escapeHtml(String(contract.billingOverdueCount))}</p></div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.critical_alerts"))}</div><p>${escapeHtml(String(contract.alertsCriticalOpen))}</p></div>
        <div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.contract_state"))}</div><p><span class="accent-line">${escapeHtml(contract.sharedContractState)}</span></p></div>
        ${contract.blockers.length > 0 ? `<div class="status-row"><div class="status-strong">${escapeHtml(t(locale, "web.summary.current_blockers"))}</div><p>${escapeHtml(contract.blockers.join(", "))}</p></div>` : ""}
      </div></div></div></section>
      <section class="content-band"><div><div class="eyebrow">${escapeHtml(t(locale, "web.summary.next_eyebrow"))}</div><div class="triple">
        <div class="step"><h3>${escapeHtml(t(locale, "web.summary.next1.title"))}</h3><p>${escapeHtml(t(locale, "web.summary.next1.body", { sharedAuthUrl: config.sharedAuthUrl }))}</p></div>
        <div class="step"><h3>${escapeHtml(t(locale, "web.summary.next2.title"))}</h3><p>${escapeHtml(t(locale, "web.summary.next2.body", { sharedBillingUrl: config.sharedBillingUrl }))}</p></div>
        <div class="step"><h3>${escapeHtml(t(locale, "web.summary.next3.title"))}</h3><p>${escapeHtml(t(locale, "web.summary.next3.body", { surface: plan.productSurface, nextUrl: plan.nextUrl }))}</p></div>
      </div><div class="cta-row"><a class="primary-cta" href="${escapeHtml(sharedAuthHref)}">${escapeHtml(t(locale, "web.action.continue_auth"))}</a><a class="secondary-cta" href="${escapeHtml(config.sharedBillingUrl)}">${escapeHtml(t(locale, "web.action.open_shared_billing"))}</a></div></div></section>
      <footer><div class="footer-inner"><p>${escapeHtml(t(locale, "web.summary.footer"))}</p><p>${escapeHtml(t(locale, "footer.trust"))}</p></div></footer>
    `
  );
}
