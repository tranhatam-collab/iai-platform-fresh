import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";
import {
  type DemoOpsMetric,
  type DemoOpsWorkItem,
  type OpsArea
} from "./demo-data.js";
import type { PaymentRoutingResult } from "./payment-routing.js";
import type { PayReadAccessContext, PayReadModel } from "./read-model.js";

export interface PayRenderConfig {
  appUrl: string;
  dashUrl: string;
  docsUrl: string;
  flowUrl: string;
  homeUrl: string;
  readModel: PayReadModel;
  rootUrl: string;
  webUrl: string;
}

type StatusTone = "active" | "danger" | "neutral" | "success" | "warning";

interface ShellAction {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}

interface ShellSection {
  title: string;
  items: string[];
}

interface ShellPageModel {
  actions: ShellAction[];
  eyebrow: string;
  lede: string;
  note: string;
  pageTitle: string;
  sections: ShellSection[];
  statusLabel?: string;
  statusTone?: StatusTone;
  title: string;
}

export function renderPayHome(config: PayRenderConfig, locale: Locale): string {
  const isVi = locale === "vi";
  const homeRefs = config.readModel.getHomeRouteRefs();

  return page(
    "/",
    locale,
    undefined,
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.pay.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.pay.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          <a href="${escapeHtml(localizeExternalUrl(config.rootUrl, locale))}">${escapeHtml(t(locale, "nav.home"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.homeUrl, locale))}">${escapeHtml(t(locale, "surface.home.title"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.appUrl, locale))}">${escapeHtml(t(locale, "nav.app"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(t(locale, "surface.flow.title"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.webUrl, locale))}">${escapeHtml(t(locale, "nav.web"))}</a>
          <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
          ${renderLocaleSwitch(locale, "/")}
        </nav>
      </header>

      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "pay.hero.eyebrow"))}</p>
            <h1>${escapeHtml(t(locale, "surface.pay.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "pay.hero.body"))}</p>
            <p class="note">${escapeHtml(t(locale, "pay.hero.note"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(
                t(locale, "pay.hero.primary")
              )}</a>
              <a class="secondary" href="${escapeHtml(localizeExternalUrl(config.flowUrl, locale))}">${escapeHtml(
                t(locale, "pay.hero.secondary")
              )}</a>
            </div>
          </div>
          <aside class="panel boundary-panel">
            <p class="eyebrow">${escapeHtml(t(locale, "pay.boundary.eyebrow"))}</p>
            <h2>${escapeHtml(t(locale, "pay.boundary.title"))}</h2>
            <p>${escapeHtml(t(locale, "pay.boundary.body"))}</p>
          </aside>
        </section>

        <section class="boundary-grid">
          <article class="boundary-card"><p>${escapeHtml(t(locale, "pay.boundary1"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "pay.boundary2"))}</p></article>
          <article class="boundary-card"><p>${escapeHtml(t(locale, "pay.boundary3"))}</p></article>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "pay.phase.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "pay.phase.title"))}</h2>
          <p>${escapeHtml(t(locale, "pay.phase.body"))}</p>
        </section>

        <section class="phase-grid">
          ${renderPhaseCard(locale, t(locale, "pay.phase0.title"), t(locale, "pay.phase0.body"))}
          ${renderPhaseCard(locale, t(locale, "pay.phase1.title"), t(locale, "pay.phase1.body"))}
          ${renderPhaseCard(locale, t(locale, "pay.phase2.title"), t(locale, "pay.phase2.body"))}
          ${renderPhaseCard(locale, t(locale, "pay.phase3.title"), t(locale, "pay.phase3.body"))}
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "pay.routes.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "pay.routes.title"))}</h2>
          <p>${escapeHtml(t(locale, "pay.routes.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.checkout_shell"),
            t(locale, "pay.render.hosted_checkout_route_with_trust_bar_method_selector_and"),
            `/checkout/${homeRefs.demoCheckoutSessionId}`,
            t(locale, "pay.render.open_checkout")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.status_shell"),
            t(locale, "pay.render.awaiting_internal_confirmation_after_a_payer_returns_or_"),
            `/checkout/${homeRefs.demoCheckoutSessionId}/status`,
            t(locale, "pay.render.open_status")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.expired_shell"),
            t(locale, "pay.render.expired_session_state_while_still_preserving_reconciliat"),
            `/checkout/${homeRefs.demoCheckoutSessionId}/expired`,
            t(locale, "pay.render.open_expired")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.receipt.shell_title"),
            t(locale, "pay.render.receipt_route_with_confirmation_copy_and_next_step_retur"),
            `/receipt/${homeRefs.demoReceiptId}`,
            t(locale, "pay.render.open_receipt")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.help_shell"),
            t(locale, "pay.render.support_guidance_for_delayed_transfer_failed_provider_re"),
            `/payment/${homeRefs.demoCheckoutSessionId}/help`,
            t(locale, "pay.render.open_help")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.confirmed_status"),
            t(locale, "pay.render.variant_for_a_confirmed_session_that_is_ready_to_hand_of"),
            `/checkout/${homeRefs.demoConfirmedCheckoutSessionId}/status`,
            t(locale, "pay.render.open_confirmed")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.failed_status"),
            t(locale, "pay.render.variant_for_unconfirmed_payment_attempts_with_a_clear_re"),
            `/checkout/${homeRefs.demoFailedCheckoutSessionId}/status`,
            t(locale, "pay.render.open_failed")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.cancelled_status"),
            t(locale, "pay.render.variant_for_a_cancelled_session_that_stops_the_flow_with"),
            `/checkout/${homeRefs.demoCancelledCheckoutSessionId}/status`,
            t(locale, "pay.render.open_cancelled")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.missing_session"),
            t(locale, "pay.render.variant_for_a_session_that_does_not_exist_or_is_no_longe"),
            `/checkout/${homeRefs.demoMissingCheckoutSessionId}`,
            t(locale, "pay.render.open_missing_session")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.missing_receipt"),
            t(locale, "pay.render.variant_for_a_receipt_route_when_the_receipt_record_does"),
            `/receipt/${homeRefs.demoMissingReceiptId}`,
            t(locale, "pay.render.open_missing_receipt")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.ops.payments.title"),
            t(locale, "pay.ops.payments.route_body"),
            "/ops/payments",
            t(locale, "pay.render.open_ops")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.ops.payouts.title"),
            t(locale, "pay.ops.payouts.route_body"),
            "/ops/payouts",
            t(locale, "pay.render.open_payout_ops")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.ops.reconciliation.title"),
            t(locale, "pay.ops.reconciliation.route_body"),
            "/ops/reconciliation",
            t(locale, "pay.render.open_reconciliation")
          )}
          ${renderInternalRouteCard(
            locale,
            t(locale, "pay.render.audit_explorer"),
            t(locale, "pay.render.shell_for_audit_trail_evidence_packages_and_mutation_tra"),
            "/ops/audit",
            t(locale, "pay.render.open_audit")
          )}
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "pay.adjacent.eyebrow"))}</p>
          <h2>${escapeHtml(t(locale, "pay.adjacent.title"))}</h2>
          <p>${escapeHtml(t(locale, "pay.adjacent.body"))}</p>
        </section>

        <section class="surface-grid">
          ${renderSurfaceCard(locale, t(locale, "surface.root.title"), t(locale, "pay.surface.root.body"), config.rootUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.home.title"), t(locale, "pay.surface.home.body"), config.homeUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.app.title"), t(locale, "pay.surface.app.body"), config.appUrl, t(locale, "btn.open_entry"))}
          ${renderSurfaceCard(locale, t(locale, "surface.flow.title"), t(locale, "pay.surface.flow.body"), config.flowUrl, t(locale, "btn.open_runtime"))}
          ${renderSurfaceCard(locale, t(locale, "surface.docs.title"), t(locale, "pay.surface.docs.body"), config.docsUrl, t(locale, "btn.read"))}
          ${renderSurfaceCard(locale, t(locale, "surface.dash.title"), t(locale, "pay.surface.dash.body"), config.dashUrl, t(locale, "btn.open_control"))}
          ${renderSurfaceCard(locale, t(locale, "nav.web"), t(locale, "pay.surface.web.body"), config.webUrl, t(locale, "btn.open_web"))}
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
      </footer>
    `
  );
}

export function renderPayNotFound(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "pay.page.not_found"),
    `
      <header class="topbar">
        <div class="brand">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.pay.domain"))}</p>
          <strong>${escapeHtml(t(locale, "surface.pay.title"))}</strong>
        </div>
        <nav class="topnav" aria-label="Primary">
          ${renderLocaleSwitch(locale, path)}
        </nav>
      </header>
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.pay.domain"))}</p>
            <h1>${escapeHtml(t(locale, "pay.not_found.title"))}</h1>
            <p class="lede">${escapeHtml(t(locale, "pay.not_found.body"))}</p>
            <div class="actions">
              <a class="primary" href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(
                t(locale, "pay.not_found.back")
              )}</a>
            </div>
          </div>
        </section>
      </main>
    `
  );
}

export function renderPayCheckout(config: PayRenderConfig, locale: Locale, sessionId: string): string {
  return renderShellPage(
    config,
    locale,
    `/checkout/${encodeURIComponent(sessionId)}`,
    getCheckoutRouteShellModel(config.readModel, locale, sessionId, "checkout")
  );
}

export function renderPayCheckoutStatus(config: PayRenderConfig, locale: Locale, sessionId: string): string {
  return renderShellPage(
    config,
    locale,
    `/checkout/${encodeURIComponent(sessionId)}/status`,
    getCheckoutRouteShellModel(config.readModel, locale, sessionId, "status")
  );
}

export function renderPayCheckoutExpired(config: PayRenderConfig, locale: Locale, sessionId: string): string {
  return renderShellPage(
    config,
    locale,
    `/checkout/${encodeURIComponent(sessionId)}/expired`,
    getCheckoutExpiredShellModel(config.readModel, locale, sessionId)
  );
}

export function renderPayReceipt(config: PayRenderConfig, locale: Locale, receiptId: string): string {
  return renderShellPage(
    config,
    locale,
    `/receipt/${encodeURIComponent(receiptId)}`,
    getReceiptRouteShellModel(config, config.readModel, locale, receiptId)
  );
}

export function renderPayHelp(config: PayRenderConfig, locale: Locale, sessionId: string): string {
  return renderShellPage(
    config,
    locale,
    `/payment/${encodeURIComponent(sessionId)}/help`,
    getHelpShellModel(config, config.readModel, locale, sessionId)
  );
}

export function renderPayPaymentBlock(
  config: PayRenderConfig,
  locale: Locale,
  routing: PaymentRoutingResult
): string {
  const isVi = locale === "vi";
  const title = t(locale, "pay.render.payment_receiver_block");
  const lede = routing.assignment
    ? isVi
      ? `Kênh nhận tiền cho ${routing.domain} được resolve từ registry tập trung của pay.iai.one.`
      : `Receiver channels for ${routing.domain} are resolved from the centralized pay.iai.one registry.`
    : isVi
      ? `Domain ${routing.domain} chưa có receiver được founder gán chính thức.`
      : `Domain ${routing.domain} does not yet have a founder-approved receiver assignment.`;
  const note = t(locale, "pay.render.this_block_renders_from_the_registry_websites_must_not_h");
  const requestedAmount =
    typeof routing.requestedAmount === "number"
      ? formatAmount(locale, routing.requestedAmount, routing.resolvedCurrency ?? "VND")
      : t(locale, "pay.render.no_prefilled_amount");

  return page(
    "/payment-block",
    locale,
    title,
    `
      ${renderShellTopbar(config, locale, "/payment-block")}
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t(locale, "pay.render.pay_iai_one_receiver_block"))}</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="lede">${escapeHtml(lede)}</p>
            ${renderStatusPill(
              routing.assignment
                ? routing.assignmentStatus === "ACTIVE_NOW"
                  ? isVi
                    ? `Đã gán: ${routing.assignmentStatus}`
                    : `Assigned: ${routing.assignmentStatus}`
                  : isVi
                    ? `Hoãn gắn: ${routing.assignmentStatus}`
                    : `Deferred: ${routing.assignmentStatus}`
                : t(locale, "pay.render.not_assigned"),
              routing.assignmentStatus === "ACTIVE_NOW" ? "success" : "warning"
            )}
            <p class="note">${escapeHtml(note)}</p>
          </div>
        </section>

        <section class="shell-grid">
          <article class="shell-card">
            <h2>${escapeHtml(t(locale, "pay.render.resolution_context"))}</h2>
            <ul>
              <li>${escapeHtml((t(locale, "pay.render.domain")) + `: ${routing.domain}`)}</li>
              <li>${escapeHtml((t(locale, "pay.render.requested_country")) + `: ${routing.requestedCountry ?? (t(locale, "pay.render.none"))}`)}</li>
              <li>${escapeHtml((t(locale, "pay.render.requested_currency")) + `: ${routing.requestedCurrency ?? (t(locale, "pay.render.none"))}`)}</li>
              <li>${escapeHtml((t(locale, "pay.render.requested_amount")) + `: ${requestedAmount}`)}</li>
              <li>${escapeHtml((t(locale, "pay.render.resolved_currency")) + `: ${routing.resolvedCurrency ?? (t(locale, "pay.render.none_2"))}`)}</li>
            </ul>
          </article>
          <article class="shell-card">
            <h2>${escapeHtml(t(locale, "pay.render.transaction_notification_rule"))}</h2>
            <ul>
              <li>${escapeHtml(t(locale, "pay.render.every_transaction_must_notify_the_domain_specific_3_addr"))}</li>
              <li>${escapeHtml(t(locale, "pay.render.the_email_team_owns_send_receive_routing"))}</li>
              <li>${escapeHtml(t(locale, "pay.render.current_state_waiting_for_cloudflare_mail_binding_per_do"))}</li>
            </ul>
          </article>
        </section>

        <section class="section-head">
          <p class="eyebrow">${escapeHtml(t(locale, "pay.render.primary_channels"))}</p>
          <h2>${escapeHtml(t(locale, "pay.render.receiver_channels_rendered_from_the_current_assignment"))}</h2>
          <p>${escapeHtml(
            t(locale, "pay.render.if_the_domain_is_not_assigned_the_block_must_stay_blocke")
          )}</p>
        </section>

        <section class="shell-grid">
          ${
            routing.channels.length > 0
              ? routing.channels.map((channel) => renderPaymentChannelCard(locale, channel, true)).join("")
              : renderBlockedReceiverCard(locale, routing.domain, routing.assignmentStatus)
          }
        </section>

        ${
          routing.fallbackChannels.length > 0
            ? `
              <section class="section-head">
                <p class="eyebrow">${escapeHtml(t(locale, "pay.render.fallback_channels"))}</p>
                <h2>${escapeHtml(t(locale, "pay.block.fallback_channels.title"))}</h2>
              </section>
              <section class="shell-grid">
                ${routing.fallbackChannels
                  .map((channel) => renderPaymentChannelCard(locale, channel, false))
                  .join("")}
              </section>
            `
            : ""
        }

        <section class="shell-grid">
          <article class="shell-card">
            <h2>${escapeHtml(t(locale, "pay.block.routing_notes_title"))}</h2>
            <ul>
              ${routing.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
        </section>
      </main>
    `
  );
}

export function renderPayOpsReview(config: PayRenderConfig, locale: Locale): string {
  return renderShellPage(config, locale, "/ops/review", getOpsShellModel(config.readModel, locale, "review"));
}

export function renderPayOpsPayments(config: PayRenderConfig, locale: Locale): string {
  return renderShellPage(
    config,
    locale,
    "/ops/payments",
    getOpsShellModel(config.readModel, locale, "payments")
  );
}

export function renderPayOpsPayouts(config: PayRenderConfig, locale: Locale): string {
  return renderShellPage(
    config,
    locale,
    "/ops/payouts",
    getOpsShellModel(config.readModel, locale, "payouts")
  );
}

export function renderPayOpsReconciliation(config: PayRenderConfig, locale: Locale): string {
  return renderShellPage(
    config,
    locale,
    "/ops/reconciliation",
    getOpsShellModel(config.readModel, locale, "reconciliation")
  );
}

export function renderPayOpsAudit(config: PayRenderConfig, locale: Locale): string {
  return renderShellPage(config, locale, "/ops/audit", getOpsShellModel(config.readModel, locale, "audit"));
}

export function renderPayOpsWorkItemDetail(
  config: PayRenderConfig,
  locale: Locale,
  area: "payments" | "reconciliation" | "review",
  itemId: string,
  accessContext: PayReadAccessContext
): string {
  return renderShellPage(
    config,
    locale,
    `/ops/${area}/${encodeURIComponent(itemId)}`,
    getOpsWorkItemDetailShellModel(config.readModel, locale, area, itemId, accessContext)
  );
}

function renderPhaseCard(locale: Locale, title: string, body: string): string {
  return `
    <article class="phase-card">
      <p class="eyebrow">${escapeHtml(t(locale, "surface.pay.title"))}</p>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function renderInternalRouteCard(
  locale: Locale,
  title: string,
  body: string,
  path: string,
  ctaLabel: string
): string {
  const localizedPath = buildLocalizedPath(path, locale);

  return `
    <article class="surface-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <div class="card-footer">
        <code>${escapeHtml(localizedPath)}</code>
        <a href="${escapeHtml(localizedPath)}">${escapeHtml(ctaLabel)}</a>
      </div>
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

function renderShellPage(
  config: PayRenderConfig,
  locale: Locale,
  path: string,
  model: ShellPageModel
): string {
  const footerNote =
    locale === "vi"
      ? t(locale, "pay.shell.footer_prep_note_vi")
      : t(locale, "pay.shell.footer_prep_note_en");

  return page(
    path,
    locale,
    model.pageTitle,
    `
      ${renderShellTopbar(config, locale, path)}
      <main class="page-shell">
        <section class="hero hero-simple">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(model.eyebrow)}</p>
            <h1>${escapeHtml(model.title)}</h1>
            <p class="lede">${escapeHtml(model.lede)}</p>
            ${model.statusLabel ? renderStatusPill(model.statusLabel, model.statusTone ?? "neutral") : ""}
            <p class="note">${escapeHtml(model.note)}</p>
            <div class="actions">
              ${renderShellActions(locale, model.actions)}
            </div>
          </div>
        </section>

        <section class="shell-grid">
          ${model.sections.map((section) => renderShellSection(section)).join("")}
        </section>
      </main>

      <footer class="footer">
        <p>${escapeHtml(t(locale, "footer.statement"))}</p>
        <p>${escapeHtml(t(locale, "footer.trust"))}</p>
        <p>${escapeHtml(footerNote)}</p>
      </footer>
    `
  );
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
    <meta name="robots" content="${escapeHtml(t(locale, "pay.meta.robots"))}" />
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
    <link rel="alternate" hreflang="en" href="${escapeHtml(metadata.alternates.en)}" />
    <link rel="alternate" hreflang="vi" href="${escapeHtml(metadata.alternates.vi)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(metadata.alternates.xDefault)}" />
    <script type="application/ld+json">${structuredData}</script>
    <style>
      :root {
        --bg: #f2f4f8;
        --panel: rgba(255, 255, 255, 0.9);
        --ink: #182038;
        --muted: #5f6b89;
        --line: rgba(24, 32, 56, 0.16);
        --accent: #26467f;
        --accent-soft: rgba(38, 70, 127, 0.12);
        --accent-strong: #1f3760;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background: var(--bg);
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
      .phase-grid,
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
        background: rgba(242, 244, 248, 0.94);
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
        padding: 8px 10px;
        border-radius: 8px;
        color: var(--muted);
      }

      .topnav a:hover,
      .locale-list a[aria-current="true"] {
        background: var(--accent-soft);
        color: var(--ink);
      }

      .page-shell {
        padding: 24px;
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
      .phase-card,
      .surface-card,
      .boundary-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 18px;
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
        border-radius: 8px;
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

      .section-head p {
        margin: 0;
        color: var(--muted);
      }

      .phase-grid,
      .surface-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .shell-grid {
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .phase-card p,
      .surface-card p,
      .boundary-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
      }

      .shell-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 18px;
      }

      .qr-preview {
        margin-top: 14px;
        display: grid;
        gap: 10px;
      }

      .qr-preview img {
        width: min(280px, 100%);
        border-radius: 8px;
        border: 1px solid var(--line);
        background: #ffffff;
      }

      .receiver-meta {
        display: grid;
        gap: 8px;
      }

      .receiver-meta code {
        word-break: break-all;
      }

      .shell-card ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 10px;
        color: var(--muted);
      }

      .shell-card li {
        line-height: 1.5;
      }

      .status-pill {
        width: max-content;
        margin-top: 14px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        font-weight: 600;
      }

      .status-active {
        background: rgba(38, 70, 127, 0.12);
        color: var(--accent-strong);
      }

      .status-success {
        background: rgba(16, 127, 88, 0.12);
        color: #155e4d;
      }

      .status-warning {
        background: rgba(176, 118, 8, 0.12);
        color: #8b5c00;
      }

      .status-danger {
        background: rgba(161, 37, 49, 0.12);
        color: #8e2330;
      }

      .status-neutral {
        background: rgba(24, 32, 56, 0.06);
        color: var(--ink);
      }

      .card-footer {
        margin-top: 14px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }

      .card-footer a {
        font-weight: 600;
        color: var(--accent-strong);
      }

      .footer {
        padding: 0 24px 24px;
        color: var(--muted);
        display: grid;
        gap: 6px;
      }

      .footer p {
        margin: 0;
      }

      @media (max-width: 900px) {
        .hero {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        .topbar {
          grid-template-columns: 1fr;
        }

        .page-shell,
        .footer {
          padding-left: 16px;
          padding-right: 16px;
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
  const items = supportedLocales
    .map((candidate) => {
      const href = buildLocalizedPath(path, candidate);
      const label = t(candidate, `locale.${candidate}`);
      return `<a href="${escapeHtml(href)}" ${candidate === locale ? 'aria-current="true"' : ""}>${escapeHtml(
        label
      )}</a>`;
    })
    .join("");
  return `<div class="locale-list" aria-label="Language switcher">${items}</div>`;
}

function renderShellTopbar(config: PayRenderConfig, locale: Locale, path: string): string {
  return `
    <header class="topbar">
      <div class="brand">
        <p class="eyebrow">${escapeHtml(t(locale, "surface.pay.domain"))}</p>
        <strong>${escapeHtml(t(locale, "surface.pay.title"))}</strong>
      </div>
      <nav class="topnav" aria-label="Primary">
        <a href="${escapeHtml(buildLocalizedPath("/", locale))}">${escapeHtml(t(locale, "pay.page.home"))}</a>
        <a href="${escapeHtml(localizeExternalUrl(config.docsUrl, locale))}">${escapeHtml(t(locale, "nav.docs"))}</a>
        <a href="${escapeHtml(localizeExternalUrl(config.dashUrl, locale))}">${escapeHtml(t(locale, "nav.dashboard"))}</a>
        ${renderLocaleSwitch(locale, path)}
      </nav>
    </header>
  `;
}

function renderShellActions(locale: Locale, actions: ShellAction[]): string {
  return actions
    .map((action) => {
      const tone = action.tone ?? "secondary";
      const href = localizeHref(action.href, locale);
      return `<a class="${tone}" href="${escapeHtml(href)}">${escapeHtml(action.label)}</a>`;
    })
    .join("");
}

function renderShellSection(section: ShellSection): string {
  return `
    <article class="shell-card">
      <h2>${escapeHtml(section.title)}</h2>
      <ul>
        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderStatusPill(label: string, tone: StatusTone): string {
  return `<p class="status-pill status-${tone}">${escapeHtml(label)}</p>`;
}

function renderPaymentChannelCard(
  locale: Locale,
  channel: PaymentRoutingResult["channels"][number],
  primary: boolean
): string {
  const isVi = locale === "vi";
  const title = primary
    ? t(locale, "pay.render.primary_channel")
    : t(locale, "pay.render.fallback_channel");
  const quickLinkLabel =
    channel.quickLink?.provider === "paypal_me"
      ? t(locale, "pay.render.open_paypal")
      : t(locale, "pay.render.open_qr");

  return `
    <article class="shell-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <h2>${escapeHtml(channel.receiver.displayName)}</h2>
      ${renderStatusPill(channel.receiver.status, channel.receiver.status === "ACTIVE_CONFIRMED" ? "success" : "warning")}
      <div class="receiver-meta">
        <p>${escapeHtml((t(locale, "pay.render.receiver_id")) + `: ${channel.receiver.receiverId}`)}</p>
        <p>${escapeHtml((t(locale, "pay.render.channel_type")) + `: ${channel.channelType}`)}</p>
        <p>${escapeHtml((t(locale, "pay.render.currency")) + `: ${channel.currency}`)}</p>
        <p>${escapeHtml(t(locale, "pay.block.meta.bank_provider") + `: ${channel.paymentTarget.bank_name ?? channel.paymentTarget.provider_name ?? "N/A"}`)}</p>
        <p>${escapeHtml(t(locale, "pay.block.meta.account_holder") + `: ${channel.paymentTarget.account_holder_name ?? channel.receiver.displayName}`)}</p>
        <p>${escapeHtml(t(locale, "pay.block.meta.account_target") + `: ${channel.paymentTarget.account_number ?? channel.paymentTarget.paypal_email ?? channel.paymentTarget.paypal_username ?? "N/A"}`)}</p>
        <p>${escapeHtml(t(locale, "pay.block.meta.render_instruction") + `: ${channel.displayInstruction}`)}</p>
        <p>${escapeHtml(t(locale, "pay.block.meta.notification_emails") + `: ${channel.transactionNotification.addresses.join(", ")}`)}</p>
        ${
          channel.quickLink?.url
            ? `<p><a href="${escapeHtml(channel.quickLink.url)}">${escapeHtml(quickLinkLabel)}</a></p>`
            : ""
        }
        ${
          channel.quickLink?.provider === "vietqr_quick_link" && channel.quickLink.url
            ? `
              <div class="qr-preview">
                <img src="${escapeHtml(channel.quickLink.url)}" alt="${escapeHtml(t(locale, "pay.block.qr_alt"))}" />
                <code>${escapeHtml(channel.quickLink.url)}</code>
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderBlockedReceiverCard(
  locale: Locale,
  domain: string,
  assignmentStatus: "ACTIVE_NOW" | "DEFERRED_UNTIL_FOUNDER_INSTRUCTION" | "NOT_ASSIGNED_YET"
): string {
  const isVi = locale === "vi";
  const isDeferred = assignmentStatus === "DEFERRED_UNTIL_FOUNDER_INSTRUCTION";

  return `
    <article class="shell-card">
      <p class="eyebrow">${escapeHtml(t(locale, "pay.render.blocked"))}</p>
      <h2>${escapeHtml(
        isDeferred
          ? isVi
            ? t(locale, "pay.block.receiver_deferred.title")
            : t(locale, "pay.block.receiver_deferred.title")
          : isVi
            ? t(locale, "pay.block.receiver_unassigned.title")
            : t(locale, "pay.block.receiver_unassigned.title")
      )}</h2>
      ${renderStatusPill(assignmentStatus, "warning")}
      <ul>
        <li>${escapeHtml((t(locale, "pay.render.domain")) + `: ${domain}`)}</li>
        <li>${escapeHtml(
          isDeferred
            ? t(locale, "pay.render.founder_requested_prep_first_handling_receiver_assignmen")
            : t(locale, "pay.render.founder_has_not_yet_assigned_domain_currency_receiver_id")
        )}</li>
        <li>${escapeHtml(
          t(locale, "pay.render.receiver_selection_must_remain_blocked_instead_of_guessi")
        )}</li>
      </ul>
    </article>
  `;
}

function localizeHref(href: string, locale: Locale): string {
  if (/^https?:\/\//i.test(href)) {
    return localizeExternalUrl(href, locale);
  }

  return buildLocalizedPath(href, locale);
}

function formatAmount(locale: Locale, amountValue: number, currency: string): string {
  const languageTag = locale === "vi" ? "vi-VN" : "en-US";
  return `${new Intl.NumberFormat(languageTag).format(amountValue)} ${currency}`;
}

function formatTimestamp(locale: Locale, value: string): string {
  const languageTag = locale === "vi" ? "vi-VN" : "en-US";
  return new Intl.DateTimeFormat(languageTag, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function labeledItem(locale: Locale, label: string, value: string): string {
  return `${localizeLabel(locale, label)}: ${localizeValue(locale, label, value)}`;
}

function formatMetricItems(locale: Locale, metrics: DemoOpsMetric[]): string[] {
  return metrics.map((metric) => labeledItem(locale, metric.label, metric.value));
}

function formatWorkItems(locale: Locale, workItems: DemoOpsWorkItem[]): string[] {
  return workItems.map((item) => {
    return `${item.id} | ${localizeWorkItemSummary(locale, item.summary)} | ${localizeLabel(
      locale,
      "owner"
    )}: ${localizeValue(locale, "owner", item.owner)} | ${localizeLabel(locale, "next_action")}: ${localizeWorkItemAction(
      locale,
      item.nextAction
    )}`;
  });
}

function formatWorkItemRouteItems(area: OpsArea, workItems: DemoOpsWorkItem[]): string[] {
  return workItems.map((item) => {
    return `${item.id} -> /ops/${area}/${encodeURIComponent(item.id)}`;
  });
}

function localizeLabel(locale: Locale, label: string): string {
  if (locale !== "vi") {
    return label;
  }

  const labels: Record<string, string> = {
    amount: t(locale, "pay.label.amount"),
    amount_due: t(locale, "pay.label.amount_due"),
    amount_mismatches: t(locale, "pay.label.amount_mismatches"),
    approval_holds: t(locale, "pay.label.approval_holds"),
    approval_chains_open: t(locale, "pay.label.approval_chains_open"),
    awaiting_confirmation: t(locale, "pay.label.awaiting_confirmation"),
    callback_delivery: t(locale, "pay.label.callback_delivery"),
    callback_status: t(locale, "pay.label.callback_status"),
    confirmation_eta: t(locale, "pay.label.confirmation_eta"),
    duplicate_signals: t(locale, "pay.label.duplicate_signals"),
    evidence_packages_ready: t(locale, "pay.label.evidence_packages_ready"),
    evidence_required: t(locale, "pay.label.evidence_required"),
    escalation_path: t(locale, "pay.label.escalation_path"),
    execution_evidence: t(locale, "pay.label.execution_evidence"),
    execution_failures_open: t(locale, "pay.label.execution_failures_open"),
    expires_at: t(locale, "pay.label.expires_at"),
    expected_amount: t(locale, "pay.label.expected_amount"),
    export_gate: t(locale, "pay.label.export_gate"),
    finance_note: t(locale, "pay.label.finance_note"),
    confirmed_at: t(locale, "pay.label.confirmed_at"),
    high_value_holds: t(locale, "pay.label.high_value_holds"),
    hold_reason: t(locale, "pay.label.hold_reason"),
    item_id: t(locale, "pay.label.item_id"),
    intent_id: t(locale, "pay.label.intent_id"),
    internal_reconciliation_evidence: t(locale, "pay.label.internal_reconciliation_evidence"),
    last_signal: t(locale, "pay.label.last_signal"),
    last_signal_at: t(locale, "pay.label.last_signal_at"),
    late_payments: t(locale, "pay.label.late_payments"),
    late_signal_window_ends_at: t(locale, "pay.label.late_signal_window_ends_at"),
    linked_payloads: t(locale, "pay.label.linked_payloads"),
    linked_session: t(locale, "pay.label.linked_session"),
    manual_review_open: t(locale, "pay.label.manual_review_open"),
    next_action: t(locale, "pay.label.next_action"),
    ops_area: t(locale, "pay.label.ops_area"),
    ops_work_items: t(locale, "pay.label.ops_work_items"),
    order_reference: t(locale, "pay.label.order_reference"),
    origin_site: t(locale, "pay.label.origin_site"),
    owner: t(locale, "pay.label.owner"),
    payer: t(locale, "pay.label.payer"),
    payment_method: t(locale, "pay.label.payment_method"),
    payment_reference: t(locale, "pay.label.payment_reference"),
    payment_session_id: t(locale, "pay.label.payment_session_id"),
    payments_today: t(locale, "pay.label.payments_today"),
    payout_request_id: t(locale, "pay.label.payout_request_id"),
    policy_window: t(locale, "pay.label.policy_window"),
    provider_label: t(locale, "pay.label.provider_label"),
    provider_flow: t(locale, "pay.label.provider_flow"),
    provider_attempts: t(locale, "pay.label.provider_attempts"),
    raw_callback_payload: t(locale, "pay.label.raw_callback_payload"),
    read_model_state: t(locale, "pay.label.read_model_state"),
    read_model_lookup: t(locale, "pay.label.read_model_lookup"),
    ready_for_treasury: t(locale, "pay.label.ready_for_treasury"),
    received_amount: t(locale, "pay.label.received_amount"),
    receipt_id: t(locale, "pay.label.receipt_id"),
    reference_received: t(locale, "pay.label.reference_received"),
    release_gate: t(locale, "pay.label.release_gate"),
    required_evidence: t(locale, "pay.label.required_evidence"),
    reconciliation_gate: t(locale, "pay.label.reconciliation_gate"),
    security_escalations: t(locale, "pay.label.security_escalations"),
    session_id: t(locale, "pay.label.session_id"),
    severity: t(locale, "pay.label.severity"),
    sensitivity_notice: t(locale, "pay.label.sensitivity_notice"),
    signal_type: t(locale, "pay.label.signal_type"),
    site_scope: t(locale, "pay.label.site_scope"),
    support_channel: t(locale, "pay.label.support_channel"),
    target_lane: t(locale, "pay.label.target_lane"),
    trace_records_24h: t(locale, "pay.label.trace_records_24h"),
    trace_id: t(locale, "pay.label.trace_id"),
    unmatched_webhooks: t(locale, "pay.label.unmatched_webhooks"),
    viewer_role: t(locale, "pay.label.viewer_role"),
    watchers: t(locale, "pay.label.watchers"),
    approval_chain: t(locale, "pay.label.approval_chain"),
    conflict_type: t(locale, "pay.label.conflict_type")
  };

  return labels[label] ?? label;
}

function localizeValue(locale: Locale, label: string, value: string): string {
  if (locale !== "vi") {
    return value;
  }

  switch (label) {
    case "callback_status":
      return value === "confirmed" ? t(locale, "pay.value.confirmed") : localizeFreeText(locale, value);
    case "last_signal":
      return localizeSignalValue(locale, value);
    case "ops_area":
      return localizeOpsArea(locale, value);
    case "read_model_state":
      return localizeStateValue(locale, value);
    case "reconciliation_gate":
      return value === "open" ? "đang mở" : localizeFreeText(locale, value);
    case "severity":
      return localizeSeverity(locale, value);
    default:
      return localizeFreeText(locale, value);
  }
}

function localizeSeverity(locale: Locale, severity: string): string {
  if (locale !== "vi") {
    return severity;
  }

  const severities: Record<string, string> = {
    high: "cao",
    low: "thấp",
    medium: "trung bình"
  };

  return severities[severity] ?? severity;
}

function localizeSignalValue(locale: Locale, signal: string): string {
  if (locale !== "vi") {
    return signal;
  }

  const signals: Record<string, string> = {
    payer_return_received: "đã nhận tín hiệu người thanh toán quay lại",
    provider_callback_confirmed: "callback từ nhà cung cấp đã xác nhận"
  };

  return signals[signal] ?? localizeFreeText(locale, signal);
}

function localizeStateValue(locale: Locale, state: string): string {
  if (locale !== "vi") {
    return state;
  }

  const states: Record<string, string> = {
    active: "đang hiệu lực",
    cancelled: "đã hủy",
    confirmed: t(locale, "pay.state.confirmed"),
    failed: "không xác nhận được",
    receipt_not_found: "không tìm thấy biên nhận",
    session_not_found: "không tìm thấy phiên"
  };

  return states[state] ?? state;
}

function localizeOpsArea(locale: Locale, area: string): string {
  if (locale !== "vi") {
    return area;
  }

  const areas: Record<string, string> = {
    audit: "audit",
    payments: "thanh toán",
    payouts: "chi trả",
    reconciliation: "đối soát",
    review: "rà soát"
  };

  return areas[area] ?? area;
}

function localizeDetailItems(locale: Locale, items: string[]): string[] {
  return items.map((item) => localizeDetailItem(locale, item));
}

function localizeDetailItem(locale: Locale, item: string): string {
  if (locale !== "vi") {
    return item;
  }

  const separatorIndex = item.indexOf(":");
  if (separatorIndex === -1) {
    return localizeFreeText(locale, item);
  }

  const label = item.slice(0, separatorIndex).trim();
  const value = item.slice(separatorIndex + 1).trim();
  return `${localizeLabel(locale, label)}: ${localizeValue(locale, label, value)}`;
}

function localizeFreeText(locale: Locale, text: string): string {
  if (locale !== "vi") {
    return text;
  }

  const replacements: Array<[string, string]> = [
    ["callback + reconciliation watch within 3 minutes", "theo dõi callback và đối soát trong 3 phút"],
    ["callback_confirmed + reconciled", "callback đã xác nhận + đã đối soát"],
    ["hosted checkout -> bank transfer -> reconciliation watch", "checkout tập trung -> chuyển khoản ngân hàng -> theo dõi đối soát"],
    ["callback confirmed -> reconciliation clear", "callback đã xác nhận -> đối soát hoàn tất"],
    ["Vietcombank QR transfer", "Chuyển khoản QR Vietcombank"],
    ["Shared file provider", "Nhà cung cấp từ file dùng chung"],
    ["Shared provider rail", "Kênh thanh toán dùng chung"],
    ["bank receipt screenshot", "ảnh chụp biên nhận ngân hàng"],
    ["provider return timestamp", "thời điểm quay lại từ nhà cung cấp"],
    ["order reference confirmation", "xác nhận mã đơn"],
    ["callback receipt", "biên nhận callback"],
    ["ledger match", "khớp sổ cái"],
    ["site confirmation", "xác nhận từ site"],
    ["provider webhook + internal callback log", "webhook từ nhà cung cấp + nhật ký callback nội bộ"],
    ["callback, reconciliation, support escalation", "callback, đối soát, chuyển cấp hỗ trợ"],
    ["pending retry", "đang chờ thử lại"],
    ["treasury evidence required", "cần bằng chứng kho bạc"],
    ["late bank transfer", "chuyển khoản ngân hàng đến muộn"],
    ["late-signal capture still open", "cửa sổ tiếp nhận tín hiệu muộn vẫn đang mở"],
    ["locked pending manual confirmation", "đang khóa để chờ xác nhận thủ công"],
    ["duplicate provider signal", "tín hiệu trùng lặp từ nhà cung cấp"],
    ["payer transfer slip + site order context", "phiếu chuyển khoản của người thanh toán + ngữ cảnh đơn hàng từ site"],
    ["app.iai.one billing workspace", "vùng làm việc thanh toán app.iai.one"],
    ["matched ledger entry", "đã khớp bút toán sổ cái"],
    ["hidden from support", "ẩn với bộ phận hỗ trợ"],
    ["restricted detail hidden for current role", "chi tiết hạn chế đã được ẩn cho vai trò hiện tại"],
    ["finance_audit approval required", "cần phê duyệt từ finance_audit"]
  ];

  return replacements.reduce((value, [source, target]) => value.replaceAll(source, target), text);
}

function localizeWorkItemSummary(locale: Locale, summary: string): string {
  if (locale !== "vi") {
    return summary;
  }

  return summary
    .replace("Deep trace requested for ", "Yêu cầu truy vết sâu cho ")
    .replace("Historical receipt check for ", "Kiểm tra lịch sử biên nhận cho ")
    .replace("Awaiting confirmation for ", t(locale, "pay.work_item_summary.awaiting_confirmation_for"))
    .replace("Provider retry chain needs a detail-view read", "Chuỗi thử lại của nhà cung cấp cần được xem chi tiết")
    .replace("Approval granted but execution evidence missing", "Đã được phê duyệt nhưng còn thiếu bằng chứng thực thi")
    .replace("Downstream payout blocked by ", "Chi trả hạ nguồn đang bị chặn bởi ")
    .replace("Late payment review for ", "Rà soát thanh toán đến muộn cho ")
    .replace("Amount mismatch needs manual confirmation", "Lệch số tiền cần được xác nhận thủ công")
    .replace("Conflicting payment signal around ", "Tín hiệu thanh toán xung đột quanh ")
    .replace("Wrong reference transfer should not auto-complete access", "Chuyển khoản sai mã tham chiếu không được tự mở quyền truy cập")
    .replace("Shared file reconciliation item", "Mục đối soát từ file dùng chung");
}

function localizeWorkItemAction(locale: Locale, action: string): string {
  if (locale !== "vi") {
    return action;
  }

  return action
    .replace("compare provider payload against callback delivery log", "đối chiếu payload của nhà cung cấp với log chuyển callback")
    .replace("verify receipt field history before export", "xác minh lịch sử trường biên nhận trước khi xuất")
    .replace("watch callback and keep status shell calm", "theo dõi callback và giữ bề mặt trạng thái ổn định")
    .replace("inspect provider attempt timeline", "kiểm tra dòng thời gian thử giao dịch của nhà cung cấp")
    .replace("collect treasury evidence before state change", "thu thập bằng chứng kho bạc trước khi đổi trạng thái")
    .replace("keep payout hold until reconciliation clears", "giữ khoản chặn chi trả cho đến khi đối soát hoàn tất")
    .replace("match late bank signal against expired-session policy", "đối chiếu tín hiệu ngân hàng đến muộn với chính sách phiên hết hạn")
    .replace("request payer evidence and lock downstream release", "yêu cầu bằng chứng từ người thanh toán và khóa phát hành hạ nguồn")
    .replace("attach reviewer note before escalation", "đính kèm ghi chú rà soát trước khi chuyển cấp")
    .replace("collect evidence pack and route into reconciliation", "thu thập gói bằng chứng và chuyển vào luồng đối soát")
    .replace("confirm callback outbox delivery", "xác nhận việc chuyển callback từ outbox");
}

function getCheckoutRouteShellModel(
  readModel: PayReadModel,
  locale: Locale,
  sessionId: string,
  routeKind: "checkout" | "status"
): ShellPageModel {
  const session = readModel.getPaymentSession(sessionId);

  switch (session.state) {
    case "confirmed":
      return getCheckoutConfirmedShellModel(readModel, locale, sessionId);
    case "failed":
      return getCheckoutFailedShellModel(readModel, locale, sessionId);
    case "cancelled":
      return getCheckoutCancelledShellModel(readModel, locale, sessionId);
    case "session_not_found":
      return getCheckoutMissingShellModel(readModel, locale, sessionId);
    case "active":
      return routeKind === "checkout"
        ? getCheckoutShellModel(readModel, locale, sessionId)
        : getCheckoutStatusShellModel(readModel, locale, sessionId);
  }
}

function getReceiptRouteShellModel(
  config: PayRenderConfig,
  readModel: PayReadModel,
  locale: Locale,
  receiptId: string
): ShellPageModel {
  const receipt = readModel.getReceipt(receiptId);

  if (receipt.state === "receipt_not_found") {
    return getReceiptMissingShellModel(config, readModel, locale, receiptId);
  }

  return getReceiptShellModel(config, readModel, locale, receiptId);
}

function getCheckoutShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/checkout/${sessionId}/status`,
        label: t(locale, "pay.render.open_status_shell"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_help_shell")
      }
    ],
    eyebrow: t(locale, "pay.checkout.shell.eyebrow"),
    lede: t(locale, "pay.checkout.shell.lede"),
    note: t(locale, "pay.checkout.shell.note"),
    pageTitle: t(locale, "pay.checkout.shell.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_demo"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "origin_site", session.originSite),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "amount_due", formatAmount(locale, session.amountValue, session.currency)),
          labeledItem(locale, "provider_label", session.providerLabel),
          labeledItem(locale, "expires_at", formatTimestamp(locale, session.expiresAt))
        ]
      },
      {
        title: t(locale, "pay.render.active_payment_panel"),
        items: [
          labeledItem(locale, "provider_flow", session.providerFlow),
          t(locale, "pay.render.qr_deeplink_or_redirect_actions_must_stay_bound_to_the_s"),
          t(locale, "pay.render.the_i_have_completed_payment_button_is_only_a_soft_signa"),
          isVi
            ? `Bộ đếm thời gian, chính sách làm mới và kênh hỗ trợ ${session.supportChannel} phải luôn hiện diện.`
            : `Countdown, refresh policy, and support channel ${session.supportChannel} must remain visible.`
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_claim_success_from_a_provider_return_or_query_str"),
          t(locale, "pay.render.do_not_expose_ledger_truth_or_balance_truth_inside_this_"),
          t(locale, "pay.checkout.shell.boundary.help_attached")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_active_shell"),
    statusTone: "active",
    title: isVi ? `Phiên thanh toán ${sessionId}` : `Checkout session ${sessionId}`
  };
}

function getCheckoutStatusShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/checkout/${sessionId}`,
        label: t(locale, "pay.render.back_to_checkout_shell"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.eyebrow_awaiting"),
    lede: t(locale, "pay.checkout.status.lede"),
    note: t(locale, "pay.checkout.status.note"),
    pageTitle: t(locale, "pay.checkout.status.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_awaiting"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "last_signal", session.lastSignal),
          labeledItem(locale, "last_signal_at", formatTimestamp(locale, session.lastSignalAt)),
          labeledItem(locale, "confirmation_eta", session.confirmationEta),
          labeledItem(locale, "support_channel", session.supportChannel)
        ]
      },
      {
        title: t(locale, "pay.render.what_the_payer_can_do_now"),
        items: [
          t(locale, "pay.render.refresh_status"),
          t(locale, "pay.render.copy_the_order_reference_or_session_id"),
          t(locale, "pay.render.open_help_if_the_bank_transfer_is_delayed_or_the_provide")
        ]
      },
      {
        title: t(locale, "pay.checkout.shell.section.verify_next_title"),
        items: [
          labeledItem(locale, "payment_reference", session.paymentReference),
          t(locale, "pay.render.match_payment_amount_currency_and_reference_against_sess"),
          t(locale, "pay.render.run_callback_or_fulfillment_flow_and_open_the_receipt_on"),
          t(locale, "pay.render.if_the_signal_does_not_match_the_route_must_flow_into_re")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_awaiting_confirmation"),
    statusTone: "warning",
    title: isVi ? `Trạng thái thanh toán ${sessionId}` : `Status shell ${sessionId}`
  };
}

function getCheckoutConfirmedShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/receipt/${session.receiptId}`,
        label: t(locale, "pay.render.open_receipt"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.confirmed.eyebrow"),
    lede: t(locale, "pay.checkout.confirmed.lede"),
    note: t(locale, "pay.checkout.confirmed.note"),
    pageTitle: t(locale, "pay.checkout.confirmed.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_confirmed"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "receipt_id", session.receiptId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "payment_reference", session.paymentReference),
          labeledItem(locale, "amount", formatAmount(locale, session.amountValue, session.currency)),
          labeledItem(locale, "origin_site", session.originSite)
        ]
      },
      {
        title: t(locale, "pay.checkout.confirmed.next_steps_title"),
        items: [
          t(locale, "pay.render.open_the_receipt_or_return_to_the_source_site"),
          t(locale, "pay.render.keep_the_payment_reference_for_support_if_needed"),
          t(locale, "pay.render.do_not_ask_the_payer_to_pay_again")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_say_that_payout_or_treasury_settlement_is_complet"),
          t(locale, "pay.render.the_receipt_surface_and_operator_evidence_surface_must_r"),
          t(locale, "pay.checkout.confirmed.boundary.historical_truth")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_confirmed"),
    statusTone: "success",
    title: isVi ? `Phiên đã xác nhận ${sessionId}` : `Confirmed session ${sessionId}`
  };
}

function getCheckoutFailedShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/checkout/${sessionId}`,
        label: t(locale, "pay.render.review_checkout_shell"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.eyebrow_failed"),
    lede: t(locale, "pay.checkout.failed.lede"),
    note: t(locale, "pay.checkout.failed.note"),
    pageTitle: t(locale, "pay.checkout.page_title_failed"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_failed"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "payment_reference", session.paymentReference),
          labeledItem(locale, "support_channel", session.supportChannel)
        ]
      },
      {
        title: t(locale, "pay.checkout.failed.allowed_steps_title"),
        items: [
          t(locale, "pay.checkout.failed.allowed_step.retry"),
          t(locale, "pay.render.keep_payment_evidence_if_the_payer_believes_funds_were_s"),
          t(locale, "pay.render.move_to_support_or_review_when_signals_conflict")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_auto_complete_access"),
          t(locale, "pay.render.do_not_auto_refund_simply_because_the_shell_is_failed"),
          t(locale, "pay.render.if_funds_may_have_moved_reconciliation_must_still_remain")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_failed"),
    statusTone: "danger",
    title: isVi ? `Phiên chưa thể xác nhận ${sessionId}` : `Failed session ${sessionId}`
  };
}

function getCheckoutCancelledShellModel(
  readModel: PayReadModel,
  locale: Locale,
  sessionId: string
): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: "/",
        label: t(locale, "pay.render.return_to_pay_home"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.cancelled.eyebrow"),
    lede: t(locale, "pay.checkout.cancelled.lede"),
    note: t(locale, "pay.checkout.cancelled.note"),
    pageTitle: t(locale, "pay.checkout.cancelled.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_cancelled"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "origin_site", session.originSite)
        ]
      },
      {
        title: t(locale, "pay.checkout.cancelled.payer_needs_title"),
        items: [
          t(locale, "pay.render.this_session_will_not_continue"),
          t(locale, "pay.render.if_money_still_moved_externally_support_and_reconciliati"),
          t(locale, "pay.render.do_not_open_access_or_the_receipt_automatically")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_tell_the_payer_to_pay_again_immediately"),
          t(locale, "pay.render.do_not_erase_the_audit_trail_of_a_cancelled_session"),
          t(locale, "pay.render.the_support_path_must_preserve_the_session_context")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_cancelled"),
    statusTone: "neutral",
    title: isVi ? `Phiên đã hủy ${sessionId}` : `Cancelled session ${sessionId}`
  };
}

function getCheckoutMissingShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: "/",
        label: t(locale, "pay.render.return_to_pay_home"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.open_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.missing.eyebrow"),
    lede: t(locale, "pay.checkout.missing.lede"),
    note: t(locale, "pay.checkout.missing.note"),
    pageTitle: t(locale, "pay.checkout.missing.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_missing"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "read_model_state", session.state),
          labeledItem(locale, "support_channel", session.supportChannel)
        ]
      },
      {
        title: t(locale, "pay.checkout.route_may_say_title"),
        items: [
          t(locale, "pay.render.this_session_does_not_exist_or_is_no_longer_available"),
          t(locale, "pay.render.do_not_assert_success_or_failure"),
          t(locale, "pay.render.send_the_user_to_support_if_they_have_evidence_of_paymen")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_fabricate_session_truth"),
          t(locale, "pay.render.do_not_issue_a_receipt_without_a_confirmed_record"),
          t(locale, "pay.checkout.missing.boundary.no_skip_reconciliation")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_session_not_found"),
    statusTone: "danger",
    title: isVi ? `Không tìm thấy phiên ${sessionId}` : `Session not found ${sessionId}`
  };
}

function getCheckoutExpiredShellModel(readModel: PayReadModel, locale: Locale, sessionId: string): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/checkout/${sessionId}`,
        label: t(locale, "pay.render.re_open_checkout_shell"),
        tone: "primary"
      },
      {
        href: `/payment/${sessionId}/help`,
        label: t(locale, "pay.render.view_support_guidance")
      }
    ],
    eyebrow: t(locale, "pay.checkout.expired.eyebrow"),
    lede: t(locale, "pay.checkout.expired.lede"),
    note: t(locale, "pay.checkout.expired.note"),
    pageTitle: t(locale, "pay.checkout.expired.page_title"),
    sections: [
      {
        title: t(locale, "pay.checkout.snapshot_expired"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "expires_at", formatTimestamp(locale, session.expiresAt)),
          labeledItem(
            locale,
            "late_signal_window_ends_at",
            formatTimestamp(locale, session.lateSignalWindowEndsAt)
          ),
          labeledItem(locale, "support_channel", session.supportChannel)
        ]
      },
      {
        title: t(locale, "pay.render.late_signal_handling"),
        items: [
          labeledItem(locale, "payment_reference", session.paymentReference),
          t(locale, "pay.render.expired_does_not_mean_the_system_is_allowed_to_forget_ab"),
          t(locale, "pay.render.if_a_provider_or_bank_signal_arrives_late_reconciliation"),
          t(locale, "pay.render.the_expired_ui_must_not_be_treated_as_evidence_that_no_m"),
          t(locale, "pay.render.the_help_route_must_explain_what_the_payer_should_do_if_")
        ]
      },
      {
        title: t(locale, "pay.checkout.expired.allowed_next_actions_title"),
        items: [
          t(locale, "pay.render.create_a_new_session_if_policy_allows"),
          t(locale, "pay.render.move_to_support_flow_if_the_payer_already_sent_funds"),
          t(locale, "pay.render.keep_the_same_order_context_instead_of_causing_order_dri")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_expired"),
    statusTone: "danger",
    title: isVi ? `Phiên hết hạn ${sessionId}` : `Expired shell ${sessionId}`
  };
}

function getReceiptShellModel(
  config: PayRenderConfig,
  readModel: PayReadModel,
  locale: Locale,
  receiptId: string
): ShellPageModel {
  const isVi = locale === "vi";
  const receipt = readModel.getReceipt(receiptId);

  return {
    actions: [
      {
        href: config.appUrl,
        label: t(locale, "pay.render.return_to_app"),
        tone: "primary"
      },
      {
        href: `/checkout/${receipt.sessionId}/status`,
        label: t(locale, "pay.render.open_status_shell")
      }
    ],
    eyebrow: t(locale, "pay.receipt.shell_title"),
    lede: t(locale, "pay.receipt.lede"),
    note: t(locale, "pay.receipt.note"),
    pageTitle: t(locale, "pay.receipt.shell_title"),
    sections: [
      {
        title: t(locale, "pay.receipt.snapshot_confirmed"),
        items: [
          labeledItem(locale, "receipt_id", receipt.receiptId),
          labeledItem(locale, "payment_reference", receipt.paymentReference),
          labeledItem(locale, "order_reference", receipt.orderReference),
          labeledItem(locale, "amount", formatAmount(locale, receipt.amountValue, receipt.currency)),
          labeledItem(locale, "confirmed_at", formatTimestamp(locale, receipt.confirmedAt)),
          labeledItem(locale, "session_id", receipt.sessionId)
        ]
      },
      {
        title: t(locale, "pay.receipt.next_steps_title"),
        items: [
          t(locale, "pay.render.access_unlocked_or_order_recorded"),
          isVi
            ? `Quay lại ${localizeFreeText(locale, receipt.returnSiteLabel)} nếu có luồng sau thanh toán`
            : `Return to ${receipt.returnSiteLabel} if a post-payment flow exists`,
          t(locale, "pay.receipt.next_step.ready_without_overclaim")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          labeledItem(locale, "origin_site", receipt.originSite),
          labeledItem(locale, "payment_method", receipt.paymentMethod),
          labeledItem(locale, "payer", receipt.payerLabel),
          t(locale, "pay.render.the_receipt_route_must_not_imply_that_payout_or_treasury"),
          t(locale, "pay.render.audit_trace_and_reconciliation_evidence_belong_to_operat"),
          t(locale, "pay.receipt.boundary.refund_preserve_truth")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_confirmed_receipt_shell"),
    statusTone: "success",
    title: isVi ? `Biên nhận ${receiptId}` : `${t(locale, "pay.receipt.shell_title")} ${receiptId}`
  };
}

function getReceiptMissingShellModel(
  config: PayRenderConfig,
  readModel: PayReadModel,
  locale: Locale,
  receiptId: string
): ShellPageModel {
  const isVi = locale === "vi";
  const receipt = readModel.getReceipt(receiptId);

  return {
    actions: [
      {
        href: buildLocalizedPath("/", locale),
        label: t(locale, "pay.render.return_to_pay_home"),
        tone: "primary"
      },
      {
        href: config.docsUrl,
        label: t(locale, "pay.render.open_support_docs")
      }
    ],
    eyebrow: t(locale, "pay.receipt.missing.eyebrow"),
    lede: t(locale, "pay.receipt.missing.lede"),
    note: t(locale, "pay.receipt.missing.note"),
    pageTitle: t(locale, "pay.receipt.missing.page_title"),
    sections: [
      {
        title: t(locale, "pay.receipt.snapshot_missing"),
        items: [
          labeledItem(locale, "receipt_id", receipt.receiptId),
          labeledItem(locale, "read_model_state", receipt.state),
          labeledItem(locale, "session_id", receipt.sessionId)
        ]
      },
      {
        title: t(locale, "pay.checkout.route_may_say_title"),
        items: [
          t(locale, "pay.receipt.missing.route_may_say.item.missing"),
          t(locale, "pay.render.do_not_assert_that_payment_has_been_confirmed"),
          t(locale, "pay.render.move_through_support_or_session_status_if_investigation_")
        ]
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.do_not_render_a_fake_amount_or_confirmation_timestamp"),
          t(locale, "pay.render.do_not_open_source_site_handoff_without_a_confirmed_rece"),
          t(locale, "pay.render.operator_evidence_belongs_in_ops_surfaces_not_inside_a_m")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_receipt_not_found"),
    statusTone: "danger",
    title: isVi ? `Không tìm thấy biên nhận ${receiptId}` : `Receipt not found ${receiptId}`
  };
}

function getHelpShellModel(
  config: PayRenderConfig,
  readModel: PayReadModel,
  locale: Locale,
  sessionId: string
): ShellPageModel {
  const isVi = locale === "vi";
  const session = readModel.getPaymentSession(sessionId);

  return {
    actions: [
      {
        href: `/checkout/${sessionId}/status`,
        label: t(locale, "pay.render.open_status_shell"),
        tone: "primary"
      },
      {
        href: config.docsUrl,
        label: t(locale, "pay.help.action.read_support_docs")
      }
    ],
    eyebrow: t(locale, "pay.help.eyebrow"),
    lede: t(locale, "pay.help.lede"),
    note: t(locale, "pay.help.note"),
    pageTitle: t(locale, "pay.help.page_title"),
    sections: [
      {
        title: t(locale, "pay.help.snapshot"),
        items: [
          labeledItem(locale, "payment_session_id", session.sessionId),
          labeledItem(locale, "order_reference", session.orderReference),
          labeledItem(locale, "support_channel", session.supportChannel),
          labeledItem(locale, "evidence_required", session.supportEvidence.join(", ")),
          labeledItem(
            locale,
            "late_signal_window_ends_at",
            formatTimestamp(locale, session.lateSignalWindowEndsAt)
          )
        ]
      },
      {
        title: t(locale, "pay.render.provider_return_failure"),
        items: [
          labeledItem(locale, "last_signal", session.lastSignal),
          t(locale, "pay.render.a_failed_provider_return_does_not_mean_the_payment_faile"),
          t(locale, "pay.render.the_payer_should_be_led_to_the_status_shell_instead_of_b"),
          t(locale, "pay.render.support_must_check_order_reference_session_id_and_timest")
        ]
      },
      {
        title: t(locale, "pay.render.wrong_amount_or_wrong_reference"),
        items: [
          labeledItem(locale, "payment_reference", session.paymentReference),
          t(locale, "pay.render.do_not_claim_access_or_an_automatic_refund_if_amount_or_"),
          t(locale, "pay.render.this_route_must_explain_clearly_that_manual_review_is_re"),
          t(locale, "pay.render.next_steps_must_follow_the_reconciliation_protocol_inste")
        ]
      }
    ],
    statusLabel: t(locale, "pay.render.state_support_guidance"),
    statusTone: "neutral",
    title: isVi ? `Trợ giúp thanh toán ${sessionId}` : `Payment help ${sessionId}`
  };
}

function getOpsWorkItemDetailShellModel(
  readModel: PayReadModel,
  locale: Locale,
  area: "payments" | "reconciliation" | "review",
  itemId: string,
  accessContext: PayReadAccessContext
): ShellPageModel {
  const isVi = locale === "vi";
  const workItem = readModel.findOpsWorkItem(area, itemId, accessContext);
  const viewerRole = accessContext.viewerRole;

  if (!workItem) {
    return {
      actions: [
        {
          href: `/ops/${area}`,
          label: t(locale, "pay.render.back_to_queue"),
          tone: "primary"
        },
        {
          href: "/ops/audit",
          label: t(locale, "pay.render.open_audit_explorer")
        }
      ],
      eyebrow: t(locale, "pay.ops.detail_missing.eyebrow"),
      lede: t(locale, "pay.ops.detail_missing.lede"),
      note: isVi
        ? t(locale, "pay.ops.detail_missing.note")
        : t(locale, "pay.ops.detail_missing.note"),
      pageTitle: t(locale, "pay.ops.detail_missing.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.snapshot_missing_item"),
          items: [
            labeledItem(locale, "ops_area", area),
            labeledItem(locale, "item_id", itemId),
            labeledItem(locale, "viewer_role", viewerRole),
            labeledItem(locale, "read_model_lookup", "null")
          ]
        },
        {
          title: t(locale, "pay.render.boundary_rules"),
          items: [
            t(locale, "pay.render.do_not_render_fake_evidence"),
            t(locale, "pay.render.do_not_conclude_that_the_item_was_resolved"),
            t(locale, "pay.ops.detail_missing.boundary.no_powerful_actions")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_detail_not_found"),
      statusTone: "danger",
      title: isVi ? `Không tìm thấy chi tiết ${itemId}` : `Detail not found ${itemId}`
    };
  }

  const areaTitleMap = {
    payments: t(locale, "pay.ops.area.payments_detail"),
    reconciliation: t(locale, "pay.ops.area.reconciliation_detail"),
    review: t(locale, "pay.ops.area.review_detail")
  } as const;

  const statusTone = workItem.severity === "high" ? "danger" : workItem.severity === "medium" ? "warning" : "neutral";

  return {
    actions: [
      {
        href: `/ops/${area}`,
        label: t(locale, "pay.render.back_to_queue_2"),
        tone: "primary"
      },
      {
        href: "/ops/audit",
        label: t(locale, "pay.render.open_audit_explorer_2")
      }
    ],
    eyebrow: t(locale, "pay.ops.detail.eyebrow"),
    lede: t(locale, "pay.ops.detail.lede"),
    note: t(locale, "pay.ops.detail.note"),
    pageTitle: areaTitleMap[area],
    sections: [
      {
        title: t(locale, "pay.ops.snapshot_work_item"),
        items: [
          labeledItem(locale, "ops_area", area),
          labeledItem(locale, "item_id", workItem.id),
          labeledItem(locale, "owner", workItem.owner),
          labeledItem(locale, "severity", workItem.severity),
          labeledItem(locale, "next_action", localizeWorkItemAction(locale, workItem.nextAction))
        ]
      },
      {
        title: t(locale, "pay.ops.detail.context_title"),
        items: localizeDetailItems(locale, workItem.detailItems)
      },
      {
        title: t(locale, "pay.render.boundary_rules"),
        items: [
          t(locale, "pay.render.the_detail_route_must_not_resolve_the_item_on_its_own"),
          t(locale, "pay.render.any_impactful_mutation_must_go_through_the_queue_owner_o"),
          t(locale, "pay.render.the_audit_trail_remains_the_final_reference")
        ]
      }
    ],
    statusLabel: isVi ? `Trạng thái: ${localizeSeverity(locale, workItem.severity)}` : `State: ${workItem.severity}`,
    statusTone,
    title: `${areaTitleMap[area]} ${itemId}`
  };
}

function getOpsShellModel(readModel: PayReadModel, locale: Locale, area: OpsArea): ShellPageModel {
  const isVi = locale === "vi";
  const snapshots: Record<OpsArea, ReturnType<PayReadModel["getOpsSnapshot"]>> = {
    audit: readModel.getOpsSnapshot("audit"),
    payments: readModel.getOpsSnapshot("payments"),
    payouts: readModel.getOpsSnapshot("payouts"),
    reconciliation: readModel.getOpsSnapshot("reconciliation"),
    review: readModel.getOpsSnapshot("review")
  };

  const models: Record<OpsArea, ShellPageModel> = {
    audit: {
      actions: [
        { href: "/ops/review", label: t(locale, "pay.render.open_review_queue"), tone: "primary" },
        { href: "/ops/payouts", label: t(locale, "pay.render.open_payout_queue") }
      ],
      eyebrow: t(locale, "pay.ops.audit.eyebrow"),
      lede: t(locale, "pay.ops.audit.lede"),
      note: t(locale, "pay.ops.audit.note"),
      pageTitle: t(locale, "pay.ops.audit.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.audit.metrics_snapshot"),
          items: formatMetricItems(locale, snapshots.audit.metrics)
        },
        {
          title: t(locale, "pay.render.sample_audit_work_items"),
          items: formatWorkItems(locale, snapshots.audit.workItems)
        },
        {
          title: t(locale, "pay.render.boundary_rules"),
          items: [
            t(locale, "pay.ops.audit.boundary.view_only"),
            t(locale, "pay.render.security_and_auditors_can_inspect_deep_traces_without_be"),
            t(locale, "pay.render.no_mutation_should_disappear_from_trace_history_for_ui_c")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_evidence_explorer"),
      statusTone: "neutral",
      title: t(locale, "pay.render.audit_explorer_2")
    },
    payments: {
      actions: [
        { href: "/ops/review", label: t(locale, "pay.render.open_review_queue"), tone: "primary" },
        { href: "/ops/reconciliation", label: t(locale, "pay.render.open_reconciliation_queue") }
      ],
      eyebrow: t(locale, "pay.ops.payments.eyebrow"),
      lede: t(locale, "pay.ops.payments.lede"),
      note: t(locale, "pay.ops.payments.note"),
      pageTitle: t(locale, "pay.ops.payments.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.payments.metrics_snapshot"),
          items: formatMetricItems(locale, snapshots.payments.metrics)
        },
        {
          title: t(locale, "pay.render.sample_payment_work_items"),
          items: formatWorkItems(locale, snapshots.payments.workItems)
        },
        {
          title: t(locale, "pay.render.sample_detail_routes"),
          items: formatWorkItemRouteItems("payments", snapshots.payments.workItems)
        },
        {
          title: t(locale, "pay.ops.payments.allowed_actions_title"),
          items: [
            t(locale, "pay.render.open_detail_inspect_evidence_re_send_callback_attach_not"),
            t(locale, "pay.render.escalate_to_finance_or_move_into_manual_review"),
            t(locale, "pay.render.do_not_bypass_reconciliation_or_payout_gates_from_the_pa")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_payments_cockpit_shell"),
      statusTone: "active",
      title: t(locale, "pay.ops.payments.title")
    },
    payouts: {
      actions: [
        { href: "/ops/reconciliation", label: t(locale, "pay.render.open_reconciliation_queue"), tone: "primary" },
        { href: "/ops/audit", label: t(locale, "pay.render.open_audit_explorer_2") }
      ],
      eyebrow: t(locale, "pay.ops.payouts.eyebrow"),
      lede: t(locale, "pay.ops.payouts.lede"),
      note: t(locale, "pay.ops.payouts.note"),
      pageTitle: t(locale, "pay.ops.payouts.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.payouts.metrics_snapshot"),
          items: formatMetricItems(locale, snapshots.payouts.metrics)
        },
        {
          title: t(locale, "pay.render.sample_payout_work_items"),
          items: formatWorkItems(locale, snapshots.payouts.workItems)
        },
        {
          title: t(locale, "pay.render.boundary_rules"),
          items: [
            t(locale, "pay.render.support_must_not_approve_a_payout"),
            t(locale, "pay.render.finance_review_and_treasury_execution_are_separate_lanes"),
            t(locale, "pay.render.do_not_manually_complete_a_payout_without_provider_evide")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_approval_gated_payout_shell"),
      statusTone: "warning",
      title: t(locale, "pay.ops.payouts.title")
    },
    reconciliation: {
      actions: [
        { href: "/ops/payments", label: t(locale, "pay.render.open_payments_monitor"), tone: "primary" },
        { href: "/ops/audit", label: t(locale, "pay.render.open_audit_explorer_2") }
      ],
      eyebrow: t(locale, "pay.ops.reconciliation.eyebrow"),
      lede: t(locale, "pay.ops.reconciliation.lede"),
      note: t(locale, "pay.ops.reconciliation.note"),
      pageTitle: t(locale, "pay.ops.reconciliation.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.reconciliation.metrics_snapshot"),
          items: formatMetricItems(locale, snapshots.reconciliation.metrics)
        },
        {
          title: t(locale, "pay.render.sample_reconciliation_work_items"),
          items: formatWorkItems(locale, snapshots.reconciliation.workItems)
        },
        {
          title: t(locale, "pay.render.sample_detail_routes"),
          items: formatWorkItemRouteItems("reconciliation", snapshots.reconciliation.workItems)
        },
        {
          title: t(locale, "pay.render.guardrails"),
          items: [
            t(locale, "pay.render.do_not_resolve_an_exception_without_an_audit_note"),
            t(locale, "pay.render.do_not_treat_provider_optimism_as_final_truth"),
            t(locale, "pay.render.every_financially_impactful_correction_must_be_traceable")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_actionable_exception_shell"),
      statusTone: "warning",
      title: t(locale, "pay.ops.reconciliation.title")
    },
    review: {
      actions: [
        { href: "/ops/payments", label: t(locale, "pay.render.open_payments_monitor"), tone: "primary" },
        { href: "/ops/audit", label: t(locale, "pay.render.open_audit_explorer_2") }
      ],
      eyebrow: t(locale, "pay.ops.review.eyebrow"),
      lede: t(locale, "pay.ops.review.lede"),
      note: t(locale, "pay.ops.review.note"),
      pageTitle: t(locale, "pay.ops.review.page_title"),
      sections: [
        {
          title: t(locale, "pay.ops.review.metrics_snapshot"),
          items: formatMetricItems(locale, snapshots.review.metrics)
        },
        {
          title: t(locale, "pay.render.sample_review_work_items"),
          items: formatWorkItems(locale, snapshots.review.workItems)
        },
        {
          title: t(locale, "pay.render.sample_detail_routes"),
          items: formatWorkItemRouteItems("review", snapshots.review.workItems)
        },
        {
          title: t(locale, "pay.render.boundary_rules"),
          items: [
            t(locale, "pay.render.the_review_queue_must_not_grant_settlement_finality_on_i"),
            t(locale, "pay.render.every_resolution_must_leave_an_evidence_trail"),
            t(locale, "pay.render.support_view_may_read_context_but_must_not_gain_payout_p")
          ]
        }
      ],
      statusLabel: t(locale, "pay.render.state_manual_review_shell"),
      statusTone: "warning",
      title: t(locale, "pay.ops.review.title")
    }
  };

  return models[area];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
