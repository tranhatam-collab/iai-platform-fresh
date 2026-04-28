import type { DashSessionContext } from "./auth.js";
import type {
  DashFlowAuditFetchResult,
  DashFlowDraftListFetchResult,
  DashFlowDetailFetchResult,
  DashFlowListFetchResult,
  DashFlowPublishReadinessFetchResult,
  DashFlowVersionListFetchResult,
  DashRuntimeExecutionDetailFetchResult,
  DashRuntimeExecutionListFetchResult,
  DashRuntimeExecutionRecord,
  DashRuntimeFetchResult
} from "./api-client.js";
import {
  buildLocalizedPath,
  getPageMetadata,
  localizeExternalUrl,
  supportedLocales,
  t,
  type Locale
} from "./i18n.js";

export interface DashRenderConfig {
  flowApiBase: string;
  sharedAuthUrl: string;
}

type NavKey = "actions" | "audit" | "dashboard" | "flows" | "runtime";

export function renderLoginPage(nextPath: string, config: DashRenderConfig, locale: Locale): string {
  return page(
    "/login",
    locale,
    t(locale, "dash.page.login"),
    `
      <section class="hero">
        <div class="hero-copy">
          <div class="hero-head">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.dash.domain"))}</p>
            ${renderLocaleSwitch(locale, "/login")}
          </div>
          <h1>${escapeHtml(t(locale, "dash.login.title"))}</h1>
          <p class="lede">${escapeHtml(t(locale, "dash.login.body"))}</p>
          <div class="actions">
            <a class="primary" href="${escapeHtml(localizeExternalUrl(config.sharedAuthUrl, locale))}">${escapeHtml(
              t(locale, "btn.continue")
            )}</a>
            <a class="secondary" href="${escapeHtml(buildLocalizedPath(nextPath, locale))}">${escapeHtml(
              t(locale, "dash.login.next_route")
            )}</a>
          </div>
        </div>
        <aside class="panel">
          <h2>${escapeHtml(t(locale, "dash.login.guardrails"))}</h2>
          <ul class="stack-list">
            <li>${escapeHtml(t(locale, "dash.login.guardrail1"))}</li>
            <li>${escapeHtml(t(locale, "dash.login.guardrail2"))}</li>
            <li>${escapeHtml(t(locale, "dash.login.guardrail3"))}</li>
            <li>${escapeHtml(t(locale, "dash.login.guardrail4"))}</li>
          </ul>
        </aside>
      </section>
    `
  );
}

export function renderDashboardPage(
  session: DashSessionContext,
  runtime: DashRuntimeFetchResult,
  config: DashRenderConfig,
  locale: Locale
): string {
  const runtimeStatus = runtime.ok && runtime.summary ? "connected" : "degraded";
  const nextAction = getNextAction(runtime, locale);
  const approvalsPending = runtime.summary?.approvalsPending ?? 0;
  const billingOverdueCount = runtime.summary?.billingOverdueCount ?? 0;
  const alertsCriticalOpen = runtime.summary?.alertsCriticalOpen ?? 0;

  return page(
    "/dashboard",
    locale,
    t(locale, "dash.page.dashboard"),
    `
      ${renderAppShell(
        session,
        locale,
        "/dashboard",
        "dashboard",
        config.flowApiBase,
        `
          <header class="topbar">
            <div>
              <p class="eyebrow">${escapeHtml(t(locale, "dash.home.eyebrow"))}</p>
              <h2>${escapeHtml(t(locale, "dash.home.title"))}</h2>
            </div>
            <div class="topbar-actions">
              <span class="status-pill ${runtime.ok ? "status-ok" : "status-warn"}">${escapeHtml(
                t(locale, `dash.status.${runtimeStatus}`)
              )}</span>
              <a class="secondary" href="${escapeHtml(buildLocalizedPath("/logout", locale))}">${escapeHtml(
                t(locale, "dash.logout")
              )}</a>
            </div>
          </header>

          <section class="hero-grid">
            <article class="hero-card">
              <p class="eyebrow">${escapeHtml(t(locale, "dash.next_action"))}</p>
              <h3>${escapeHtml(nextAction.title)}</h3>
              <p>${escapeHtml(nextAction.body)}</p>
            </article>
            <article class="hero-card hero-card-muted">
              <p class="eyebrow">${escapeHtml(t(locale, "dash.session_boundary"))}</p>
              <h3>${escapeHtml(t(locale, "dash.workspace_first"))}</h3>
              <p>${escapeHtml(t(locale, "dash.workspace_first.body", { workspaceId: session.workspaceId }))}</p>
            </article>
          </section>

          <section class="card-grid">
            ${renderMetricCard(
              locale,
              "dash.metric.approvals",
              approvalsPending,
              "dash.metric.approvals.body"
            )}
            ${renderMetricCard(
              locale,
              "dash.metric.billing",
              billingOverdueCount,
              "dash.metric.billing.body"
            )}
            ${renderMetricCard(
              locale,
              "dash.metric.alerts",
              alertsCriticalOpen,
              "dash.metric.alerts.body"
            )}
          </section>

          <section class="detail-grid">
            <article class="panel">
              <h3>${escapeHtml(t(locale, "dash.runtime_connection"))}</h3>
              ${
                runtime.ok && runtime.summary
                  ? `
                    <p>${escapeHtml(
                      t(locale, "dash.runtime_connection.ok", { service: runtime.summary.service })
                    )}</p>
                    <dl class="facts">
                      <div><dt>${escapeHtml(t(locale, "dash.runtime_generated"))}</dt><dd>${escapeHtml(
                        runtime.summary.generatedAt
                      )}</dd></div>
                      <div><dt>${escapeHtml(t(locale, "dash.runtime_workspace"))}</dt><dd>${escapeHtml(
                        runtime.summary.workspaceId
                      )}</dd></div>
                      <div><dt>${escapeHtml(t(locale, "dash.runtime_health"))}</dt><dd>${escapeHtml(
                        runtime.summary.healthStatus
                      )}</dd></div>
                      <div><dt>${escapeHtml(t(locale, "dash.runtime_request"))}</dt><dd>${escapeHtml(
                        runtime.requestId
                      )}</dd></div>
                    </dl>
                  `
                  : renderFetchError(runtime, locale)
              }
            </article>

            <article class="panel">
              <h3>${escapeHtml(t(locale, "dash.action_principles"))}</h3>
              <ul class="stack-list">
                <li>${escapeHtml(t(locale, "dash.action_principle1"))}</li>
                <li>${escapeHtml(t(locale, "dash.action_principle2"))}</li>
                <li>${escapeHtml(t(locale, "dash.action_principle3"))}</li>
                <li>${escapeHtml(t(locale, "dash.action_principle4"))}</li>
              </ul>
            </article>
          </section>
        `
      )}
    `
  );
}

export function renderActionCenterPage(
  session: DashSessionContext,
  runtime: DashRuntimeFetchResult,
  locale: Locale
): string {
  const actions = buildActions(runtime, locale);

  return page(
    "/actions",
    locale,
    t(locale, "dash.page.actions"),
    `
      ${renderAppShell(
        session,
        locale,
        "/actions",
        "actions",
        undefined,
        `
          <header class="topbar">
            <div>
              <p class="eyebrow">${escapeHtml(t(locale, "dash.actions.eyebrow"))}</p>
              <h2>${escapeHtml(t(locale, "dash.actions.title"))}</h2>
            </div>
            <div class="topbar-actions">
              <a class="secondary" href="${escapeHtml(buildLocalizedPath("/dashboard", locale))}">${escapeHtml(
                t(locale, "dash.actions.back")
              )}</a>
            </div>
          </header>
          <section class="panel">
            <h3>${escapeHtml(t(locale, "dash.actions.current"))}</h3>
            <ul class="stack-list">
              ${actions
                .map(
                  (action) =>
                    `<li><strong>${escapeHtml(action.title)}</strong> ${escapeHtml(action.body)}</li>`
                )
                .join("")}
            </ul>
          </section>
        `
      )}
    `
  );
}

export function renderAuditPage(
  session: DashSessionContext,
  result: DashFlowAuditFetchResult,
  locale: Locale
): string {
  return page(
    "/audit",
    locale,
    t(locale, "dash.render.audit_timeline_3"),
    `
      ${renderAppShell(
        session,
        locale,
        "/audit",
        "audit",
        undefined,
        `
          <header class="topbar">
            <div>
              <p class="eyebrow">${escapeHtml(t(locale, "dash.render.sensitive_actions_2"))}</p>
              <h2>${escapeHtml(t(locale, "dash.render.builder_and_publish_actions_stay_traceable_2"))}</h2>
            </div>
            <div class="topbar-actions">
              <span class="status-pill status-ok">${escapeHtml(t(locale, "dash.count.events", { count: result.total ?? 0 }))}</span>
            </div>
          </header>
          ${
            result.ok && result.items
              ? result.items.length > 0
                ? `
                  <section class="stack-grid">
                    ${result.items
                      .map(
                        (event) => `
                          <article class="item-card">
                            <div class="item-head">
                              <div>
                                <p class="eyebrow">${escapeHtml(event.eventId)}</p>
                                <h3>${escapeHtml(event.flowId)}</h3>
                              </div>
                              ${renderActionOutcomeStatus(event.outcome, locale)}
                            </div>
                            <p>${escapeHtml(event.details)}</p>
                            <dl class="facts">
                              <div><dt>${escapeHtml(t(locale, "dash.render.action_2"))}</dt><dd>${escapeHtml(event.action)}</dd></div>
                              <div><dt>${escapeHtml(t(locale, "dash.render.actor_2"))}</dt><dd>${escapeHtml(event.actor)}</dd></div>
                              <div><dt>${escapeHtml(t(locale, "dash.render.timestamp_2"))}</dt><dd>${escapeHtml(event.createdAt)}</dd></div>
                            </dl>
                          </article>
                        `
                      )
                      .join("")}
                  </section>
                `
                : renderEmptyPanel(
                    locale,
                    t(locale, "dash.render.no_audit_event_is_available_yet_2"),
                    t(locale, "dash.render.sensitive_actions_will_appear_here_once_command_")
                  )
              : renderResultPanel(
                  locale,
                  t(locale, "dash.render.audit_timeline_is_unavailable_2"),
                  result.error?.message ?? t(locale, "dash.render.unknown_audit_timeline_error_2")
                )
          }
        `
      )}
    `
  );
}

export function renderFlowsPage(
  session: DashSessionContext,
  flows: DashFlowListFetchResult,
  locale: Locale
): string {
  return page(
    "/flows",
    locale,
    t(locale, "dash.render.flow_inventory"),
    `
      ${renderAppShell(
        session,
        locale,
        "/flows",
        "flows",
        undefined,
        `
          <header class="topbar">
            <div>
              <p class="eyebrow">${escapeHtml(t(locale, "dash.render.flow_inventory_2"))}</p>
              <h2>${escapeHtml(t(locale, "dash.render.objects_tied_to_runtime_truth"))}</h2>
            </div>
            <div class="topbar-actions">
              <span class="status-pill status-ok">${escapeHtml(t(locale, "dash.count.flows", { count: flows.total ?? 0 }))}</span>
            </div>
          </header>
          ${
            flows.ok && flows.items
              ? flows.items.length > 0
                ? `
                  <section class="item-grid">
                    ${flows.items.map((flow) => renderFlowCard(flow, locale)).join("")}
                  </section>
                `
                : renderEmptyPanel(
                    locale,
                    t(locale, "dash.render.no_flows_are_available_for_this_workspace_yet_2"),
                    t(locale, "dash.render.the_app_stays_explicit_instead_of_inventing_inve")
                  )
              : renderResultPanel(
                  locale,
                  t(locale, "dash.render.flow_inventory_is_unavailable"),
                  flows.error?.message ?? t(locale, "dash.render.unknown_flow_inventory_error_2")
                )
          }
        `
      )}
    `
  );
}

export function renderFlowDetailPage(
  session: DashSessionContext,
  result: DashFlowDetailFetchResult,
  locale: Locale
): string {
  const flow = result.flow;
  const pagePath = flow ? `/flows/${flow.flowId}` : "/flows";

  return page(
    pagePath,
    locale,
    flow ? flow.name : t(locale, "dash.render.flow_detail"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "flows",
        undefined,
        flow
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.flow_detail"))}</p>
                <h2>${escapeHtml(flow.name)}</h2>
              </div>
              <div class="topbar-actions">
                ${renderFlowStatus(flow.status, locale)}
              </div>
            </header>

            ${renderFlowWorkspaceTabs(flow.flowId, locale, "detail")}

            <section class="detail-grid">
              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.flow_truth_2"))}</h3>
                <p>${escapeHtml(flow.summary)}</p>
                <dl class="facts">
                  <div><dt>${escapeHtml(t(locale, "dash.render.owner_2"))}</dt><dd>${escapeHtml(flow.owner)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.trigger_2"))}</dt><dd>${escapeHtml(flow.trigger)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.active_version_2"))}</dt><dd>${escapeHtml(flow.activeVersion)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.draft_version_2"))}</dt><dd>${escapeHtml(flow.draftVersion)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.last_publish_2"))}</dt><dd>${escapeHtml(flow.lastPublishedAt)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.last_execution_2"))}</dt><dd>${escapeHtml(flow.lastExecutionAt)}</dd></div>
                </dl>
              </article>

              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.builder_readiness"))}</h3>
                <p>${escapeHtml(flow.latestPublishNote)}</p>
                <ul class="stack-list">
                  <li>${escapeHtml(t(locale, "dash.render.lock_status_2"))}: ${escapeHtml(renderBuilderLockLabel(flow.builder.lockStatus, locale))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.autosave_2"))}: ${escapeHtml(renderAutosaveLabel(flow.builder.autosaveStatus, locale))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.open_issues_2"))}: ${escapeHtml(String(flow.builder.openIssues))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.last_validated_2"))}: ${escapeHtml(flow.builder.lastValidatedAt)}</li>
                </ul>
              </article>
            </section>

            <section class="panel">
              <h3>${escapeHtml(t(locale, "dash.render.recent_executions_2"))}</h3>
              ${
                result.recentExecutions && result.recentExecutions.length > 0
                  ? `<div class="stack-grid">${result.recentExecutions.map((execution) => renderExecutionCard(execution, locale)).join("")}</div>`
                  : `<p>${escapeHtml(t(locale, "dash.render.no_execution_is_attached_to_this_flow_yet_2"))}</p>`
              }
            </section>
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.flow_detail_is_unavailable"),
              result.error?.message ?? t(locale, "dash.render.unknown_flow_detail_error_2")
            )
      )}
    `
  );
}

export function renderFlowBuilderPage(
  session: DashSessionContext,
  result: DashFlowDetailFetchResult,
  locale: Locale,
  actionFeedback?: { action: string; message: string; outcome: "failed" | "succeeded" }
): string {
  const flow = result.flow;
  const pagePath = flow ? `/flows/${flow.flowId}/builder` : "/flows";

  return page(
    pagePath,
    locale,
    flow ? t(locale, "dash.builder.page_title", { name: flow.name }) : t(locale, "dash.render.builder_2"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "flows",
        undefined,
        flow
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.builder_foundation_2"))}</p>
                <h2>${escapeHtml(flow.name)}</h2>
              </div>
              <div class="topbar-actions">
                ${renderFlowStatus(flow.status, locale)}
              </div>
            </header>

            ${renderFlowWorkspaceTabs(flow.flowId, locale, "builder")}
            ${actionFeedback ? renderActionFeedback(actionFeedback, locale) : ""}

            <section class="panel">
              <h3>${escapeHtml(t(locale, "dash.render.builder_actions_2"))}</h3>
              <div class="actions">
                ${renderInlineActionForm(
                  `/flows/${flow.flowId}/builder/save`,
                  t(locale, "dash.render.save_draft_2"),
                  locale
                )}
                ${renderInlineActionForm(
                  `/flows/${flow.flowId}/builder/validate`,
                  t(locale, "dash.render.validate_draft_2"),
                  locale
                )}
              </div>
            </section>

            <section class="hero-grid">
              <article class="hero-card">
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.draft_state_2"))}</p>
                <h3>${escapeHtml(flow.draftVersion)}</h3>
                <p>${escapeHtml(t(locale, "dash.render.builder_opens_against_the_draft_lane_not_a_fake_"))}</p>
              </article>
              <article class="hero-card hero-card-muted">
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.lock_and_autosave_2"))}</p>
                <h3>${escapeHtml(renderBuilderLockLabel(flow.builder.lockStatus, locale))}</h3>
                <p>${escapeHtml(t(locale, "dash.render.autosave_state_2"))}: ${escapeHtml(renderAutosaveLabel(flow.builder.autosaveStatus, locale))}</p>
              </article>
            </section>

            <section class="detail-grid">
              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.node_palette_2"))}</h3>
                <div class="stack-grid">
                  ${flow.builder.nodeCatalog
                    .map(
                      (node) => `
                        <article class="mini-card">
                          <p class="eyebrow">${escapeHtml(node.category)}</p>
                          <h4>${escapeHtml(node.label)}</h4>
                          <p>${escapeHtml(node.nodeType)}</p>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </article>

              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.validation_rail_2"))}</h3>
                <ul class="stack-list">
                  <li>${escapeHtml(t(locale, "dash.render.open_issues_2"))}: ${escapeHtml(String(flow.builder.openIssues))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.last_saved_2"))}: ${escapeHtml(flow.builder.lastSavedAt)}</li>
                  <li>${escapeHtml(t(locale, "dash.render.last_validated_2"))}: ${escapeHtml(flow.builder.lastValidatedAt)}</li>
                  ${
                    flow.builder.lockOwner
                      ? `<li>${escapeHtml(t(locale, "dash.render.lock_owner_2"))}: ${escapeHtml(flow.builder.lockOwner)}</li>`
                      : ""
                  }
                </ul>
              </article>
            </section>
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.builder_state_is_unavailable_2"),
              result.error?.message ?? t(locale, "dash.render.unknown_builder_error_2")
            )
      )}
    `
  );
}

export function renderFlowVersionsPage(
  session: DashSessionContext,
  result: DashFlowVersionListFetchResult,
  locale: Locale
): string {
  const flowId = result.flowId;
  const pagePath = flowId ? `/flows/${flowId}/versions` : "/flows";

  return page(
    pagePath,
    locale,
    t(locale, "dash.render.flow_versions_2"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "flows",
        undefined,
        result.ok && result.items && flowId
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.version_history_2"))}</p>
                <h2>${escapeHtml(t(locale, "dash.render.published_truth_and_archived_trail_2"))}</h2>
              </div>
              <div class="topbar-actions">
                <span class="status-pill status-ok">${escapeHtml(t(locale, "dash.count.versions", { count: result.total ?? 0 }))}</span>
              </div>
            </header>

            ${renderFlowWorkspaceTabs(flowId, locale, "versions")}

            ${
              result.items.length > 0
                ? `<section class="stack-grid">${result.items.map((item) => renderVersionCard(item, locale)).join("")}</section>`
                : renderEmptyPanel(
                    locale,
                    t(locale, "dash.render.no_versions_are_attached_to_this_flow_yet_2"),
                    t(locale, "dash.render.dash_keeps_the_history_explicit_instead_of_inven")
                  )
            }
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.flow_versions_are_unavailable_2"),
              result.error?.message ?? t(locale, "dash.render.unknown_flow_versions_error_2")
            )
      )}
    `
  );
}

export function renderFlowDraftsPage(
  session: DashSessionContext,
  result: DashFlowDraftListFetchResult,
  locale: Locale
): string {
  const flowId = result.flowId;
  const pagePath = flowId ? `/flows/${flowId}/drafts` : "/flows";

  return page(
    pagePath,
    locale,
    t(locale, "dash.render.flow_drafts_2"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "flows",
        undefined,
        result.ok && result.items && flowId
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.draft_queue_2"))}</p>
                <h2>${escapeHtml(t(locale, "dash.render.every_draft_keeps_its_editor_preview_packet_and_"))}</h2>
              </div>
              <div class="topbar-actions">
                <span class="status-pill status-ok">${escapeHtml(t(locale, "dash.count.drafts", { count: result.total ?? 0 }))}</span>
              </div>
            </header>

            ${renderFlowWorkspaceTabs(flowId, locale, "drafts")}

            ${
              result.items.length > 0
                ? `<section class="stack-grid">${result.items.map((item) => renderDraftCard(item, locale)).join("")}</section>`
                : renderEmptyPanel(
                    locale,
                    t(locale, "dash.render.no_draft_is_attached_to_this_flow_yet_2"),
                    t(locale, "dash.render.the_queue_stays_empty_until_a_real_draft_exists_2")
                  )
            }
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.flow_drafts_are_unavailable_2"),
              result.error?.message ?? t(locale, "dash.render.unknown_flow_drafts_error_2")
            )
      )}
    `
  );
}

export function renderFlowPublishPage(
  session: DashSessionContext,
  result: DashFlowPublishReadinessFetchResult,
  locale: Locale,
  actionFeedback?: { action: string; message: string; outcome: "failed" | "succeeded" }
): string {
  const readiness = result.readiness;
  const flowId = result.flowId ?? readiness?.flowId;
  const pagePath = flowId ? `/flows/${flowId}/publish` : "/flows";

  return page(
    pagePath,
    locale,
    t(locale, "dash.render.publish_readiness_2"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "flows",
        undefined,
        readiness && flowId
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.publish_readiness_2"))}</p>
                <h2>${escapeHtml(t(locale, "dash.render.validation_preview_packet_and_operator_confirmat"))}</h2>
              </div>
              <div class="topbar-actions">
                ${renderPublishReadinessStatus(readiness.status, locale)}
              </div>
            </header>

            ${renderFlowWorkspaceTabs(flowId, locale, "publish")}
            ${actionFeedback ? renderActionFeedback(actionFeedback, locale) : ""}

            <section class="panel">
              <h3>${escapeHtml(t(locale, "dash.render.publish_actions_2"))}</h3>
              <div class="actions">
                ${renderInlineActionForm(
                  `/flows/${flowId}/publish/preview`,
                  t(locale, "dash.render.generate_preview_2"),
                  locale
                )}
                ${renderInlineActionForm(
                  `/flows/${flowId}/publish/confirm`,
                  t(locale, "dash.render.confirm_publish_2"),
                  locale
                )}
              </div>
            </section>

            <section class="detail-grid">
              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.release_lane_2"))}</h3>
                <dl class="facts">
                  <div><dt>${escapeHtml(t(locale, "dash.render.target_version_2"))}</dt><dd>${escapeHtml(readiness.targetVersion)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.last_validated_2"))}</dt><dd>${escapeHtml(readiness.lastValidatedAt)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.preview_packet_2"))}</dt><dd>${escapeHtml(readiness.previewPacketId ?? t(locale, "dash.render.not_generated_2"))}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.preview_generated_2"))}</dt><dd>${escapeHtml(readiness.previewGeneratedAt ?? t(locale, "dash.render.pending"))}</dd></div>
                </dl>
                <p>${escapeHtml(readiness.operatorNote)}</p>
              </article>

              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.blockers_2"))}</h3>
                ${
                  readiness.blockers.length > 0
                    ? `
                      <ul class="stack-list">
                        ${readiness.blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                      </ul>
                      <p class="mini-meta">${escapeHtml(t(locale, "dash.render.refs_2"))}: ${escapeHtml(readiness.blockerRefs.join(", "))}</p>
                    `
                    : `<p>${escapeHtml(t(locale, "dash.render.no_active_blocker_is_attached_to_this_publish_la"))}</p>`
                }
              </article>
            </section>

            <section class="panel">
              <h3>${escapeHtml(t(locale, "dash.render.checklist_2"))}</h3>
              <div class="stack-grid">
                ${readiness.checklist.map((item) => renderPublishChecklistCard(item, locale)).join("")}
              </div>
            </section>
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.publish_readiness_is_unavailable_2"),
              result.error?.message ?? t(locale, "dash.render.unknown_publish_readiness_error_2")
            )
      )}
    `
  );
}

export function renderRuntimeExecutionsPage(
  session: DashSessionContext,
  result: DashRuntimeExecutionListFetchResult,
  locale: Locale
): string {
  return page(
    "/runtime/executions",
    locale,
    t(locale, "dash.render.runtime_executions_3"),
    `
      ${renderAppShell(
        session,
        locale,
        "/runtime/executions",
        "runtime",
        undefined,
        `
          <header class="topbar">
            <div>
              <p class="eyebrow">${escapeHtml(t(locale, "dash.render.runtime_executions_4"))}</p>
              <h2>${escapeHtml(t(locale, "dash.render.every_execution_stays_attached_to_proof_and_oper"))}</h2>
            </div>
            <div class="topbar-actions">
              <span class="status-pill status-ok">${escapeHtml(t(locale, "dash.count.executions", { count: result.total ?? 0 }))}</span>
            </div>
          </header>
          ${
            result.ok && result.items
              ? result.items.length > 0
                ? `<section class="stack-grid">${result.items.map((execution) => renderExecutionCard(execution, locale)).join("")}</section>`
                : renderEmptyPanel(
                    locale,
                    t(locale, "dash.render.no_runtime_execution_is_available_yet_2"),
                    t(locale, "dash.render.dash_stays_explicit_instead_of_pretending_that_t")
                  )
              : renderResultPanel(
                  locale,
                  t(locale, "dash.render.runtime_executions_are_unavailable_2"),
                  result.error?.message ?? t(locale, "dash.render.unknown_runtime_execution_error_2")
                )
          }
        `
      )}
    `
  );
}

export function renderRuntimeExecutionDetailPage(
  session: DashSessionContext,
  result: DashRuntimeExecutionDetailFetchResult,
  locale: Locale
): string {
  const execution = result.execution;
  const pagePath = execution ? `/runtime/executions/${execution.executionId}` : "/runtime/executions";

  return page(
    pagePath,
    locale,
    execution ? execution.flowName : t(locale, "dash.render.execution_detail"),
    `
      ${renderAppShell(
        session,
        locale,
        pagePath,
        "runtime",
        undefined,
        execution
          ? `
            <header class="topbar">
              <div>
                <p class="eyebrow">${escapeHtml(t(locale, "dash.render.execution_detail"))}</p>
                <h2>${escapeHtml(execution.flowName)}</h2>
              </div>
              <div class="topbar-actions">
                ${renderExecutionStatus(execution.status, locale)}
                <a class="secondary" href="${escapeHtml(buildLocalizedPath(`/flows/${execution.flowId}`, locale))}">${escapeHtml(
                  t(locale, "dash.render.open_flow_2")
                )}</a>
              </div>
            </header>

            <section class="detail-grid">
              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.execution_truth_2"))}</h3>
                <p>${escapeHtml(execution.summary)}</p>
                <dl class="facts">
                  <div><dt>${escapeHtml(t(locale, "dash.render.execution_2"))}</dt><dd>${escapeHtml(execution.executionId)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.trigger_2"))}</dt><dd>${escapeHtml(execution.trigger)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.initiated_by_2"))}</dt><dd>${escapeHtml(execution.initiatedBy)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.started_2"))}</dt><dd>${escapeHtml(execution.startedAt)}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.ended_2"))}</dt><dd>${escapeHtml(execution.endedAt ?? t(locale, "dash.render.still_running_2"))}</dd></div>
                  <div><dt>${escapeHtml(t(locale, "dash.render.current_step_2"))}</dt><dd>${escapeHtml(execution.currentStepLabel ?? t(locale, "dash.render.completed"))}</dd></div>
                </dl>
              </article>

              <article class="panel">
                <h3>${escapeHtml(t(locale, "dash.render.attached_pressure_2"))}</h3>
                <ul class="stack-list">
                  <li>${escapeHtml(t(locale, "dash.render.requires_attention_2"))}: ${escapeHtml(execution.requiresAttention ? t(locale, "dash.render.yes_2") : t(locale, "dash.render.no_2"))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.alerts_2"))}: ${escapeHtml(execution.alertIds.length > 0 ? execution.alertIds.join(", ") : t(locale, "dash.render.none_2"))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.approvals_2"))}: ${escapeHtml(execution.approvalIds.length > 0 ? execution.approvalIds.join(", ") : t(locale, "dash.render.none_2"))}</li>
                  <li>${escapeHtml(t(locale, "dash.render.proofs_2"))}: ${escapeHtml(execution.proofIds.length > 0 ? execution.proofIds.join(", ") : t(locale, "dash.render.none_2"))}</li>
                </ul>
              </article>
            </section>

            <section class="panel">
              <h3>${escapeHtml(t(locale, "dash.render.step_timeline_2"))}</h3>
              <div class="stack-grid">
                ${execution.steps
                  .map(
                    (step) => `
                      <article class="mini-card">
                        <div class="mini-card-head">
                          <p class="eyebrow">${escapeHtml(step.nodeId)}</p>
                          ${renderStepStatus(step.status, locale)}
                        </div>
                        <h4>${escapeHtml(step.label)}</h4>
                        <p>${escapeHtml(step.summary)}</p>
                        <p class="mini-meta">${escapeHtml(step.startedAt ?? t(locale, "dash.render.not_started"))}${
                          step.endedAt ? ` → ${escapeHtml(step.endedAt)}` : ""
                        }</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : renderResultPanel(
              locale,
              t(locale, "dash.render.execution_detail_is_unavailable"),
              result.error?.message ?? t(locale, "dash.render.unknown_execution_detail_error_2")
            )
      )}
    `
  );
}

export function renderNotFoundPage(locale: Locale, path: string): string {
  return page(
    path,
    locale,
    t(locale, "dash.page.not_found"),
    `
      <section class="hero simple-hero">
        <div class="hero-copy">
          <div class="hero-head">
            <p class="eyebrow">${escapeHtml(t(locale, "surface.dash.domain"))}</p>
            ${renderLocaleSwitch(locale, path)}
          </div>
          <h1>${escapeHtml(t(locale, "dash.not_found.title"))}</h1>
          <p class="lede">${escapeHtml(t(locale, "dash.not_found.body"))}</p>
          <div class="actions">
            <a class="primary" href="${escapeHtml(buildLocalizedPath("/dashboard", locale))}">${escapeHtml(
              t(locale, "dash.not_found.back")
            )}</a>
          </div>
        </div>
      </section>
    `
  );
}

function renderAppShell(
  session: DashSessionContext,
  locale: Locale,
  currentPath: string,
  activeNav: NavKey,
  source: string | undefined,
  mainContent: string
): string {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-block">
          <p class="eyebrow">${escapeHtml(t(locale, "surface.dash.brand"))}</p>
          <h1>${escapeHtml(t(locale, "surface.dash.title"))}</h1>
        </div>
        <nav class="nav-list" aria-label="${escapeHtml(t(locale, "footer.nav.surfaces"))}">
          ${renderNavLink(locale, "/dashboard", t(locale, "nav.dashboard"), activeNav === "dashboard")}
          ${renderNavLink(locale, "/actions", t(locale, "dash.page.actions"), activeNav === "actions")}
          ${renderNavLink(locale, "/flows", t(locale, "dash.render.flow_inventory_2"), activeNav === "flows")}
          ${renderNavLink(locale, "/audit", t(locale, "dash.render.audit_timeline_4"), activeNav === "audit")}
          ${renderNavLink(locale, "/runtime/executions", t(locale, "dash.render.runtime_executions_4"), activeNav === "runtime")}
        </nav>
        <div class="sidebar-meta">
          <p><strong>${escapeHtml(t(locale, "dash.sidebar.workspace"))}</strong><span>${escapeHtml(
            session.workspaceId
          )}</span></p>
          <p><strong>${escapeHtml(t(locale, "dash.sidebar.session"))}</strong><span>${escapeHtml(
            session.sessionSource
          )}</span></p>
          ${
            source
              ? `<p><strong>${escapeHtml(t(locale, "dash.sidebar.source"))}</strong><span>${escapeHtml(
                  source
                )}</span></p>`
              : ""
          }
        </div>
        ${renderLocaleSwitch(locale, currentPath)}
      </aside>
      <main class="main-panel">
        ${mainContent}
      </main>
    </div>
  `;
}

function renderFlowCard(
  flow: NonNullable<DashFlowListFetchResult["items"]>[number],
  locale: Locale
): string {
  if (!flow) {
    return "";
  }

  return `
    <article class="item-card">
      <div class="item-head">
        <div>
          <p class="eyebrow">${escapeHtml(flow.flowId)}</p>
          <h3>${escapeHtml(flow.name)}</h3>
        </div>
        ${renderFlowStatus(flow.status, locale)}
      </div>
      <p>${escapeHtml(flow.summary)}</p>
      <dl class="facts">
        <div><dt>${escapeHtml(t(locale, "dash.render.trigger_2"))}</dt><dd>${escapeHtml(flow.trigger)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.owner_2"))}</dt><dd>${escapeHtml(flow.owner)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.versions_2"))}</dt><dd>${escapeHtml(flow.activeVersion)} / ${escapeHtml(flow.draftVersion)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.alerts_approvals_2"))}</dt><dd>${escapeHtml(
          `${flow.openAlerts} / ${flow.pendingApprovals}`
        )}</dd></div>
      </dl>
      <div class="actions">
        <a class="secondary" href="${escapeHtml(buildLocalizedPath(`/flows/${flow.flowId}`, locale))}">${escapeHtml(
          t(locale, "dash.render.open_detail_2")
        )}</a>
        <a class="secondary" href="${escapeHtml(buildLocalizedPath(`/flows/${flow.flowId}/builder`, locale))}">${escapeHtml(
          t(locale, "dash.render.open_builder_2")
        )}</a>
      </div>
    </article>
  `;
}

function renderFlowWorkspaceTabs(
  flowId: string,
  locale: Locale,
  activeTab: "builder" | "detail" | "drafts" | "publish" | "versions"
): string {
  const links = [
    {
      key: "detail",
      label: t(locale, "dash.render.detail"),
      path: `/flows/${flowId}`
    },
    {
      key: "builder",
      label: t(locale, "dash.render.builder_2"),
      path: `/flows/${flowId}/builder`
    },
    {
      key: "versions",
      label: t(locale, "dash.render.versions_2"),
      path: `/flows/${flowId}/versions`
    },
    {
      key: "drafts",
      label: t(locale, "dash.render.drafts"),
      path: `/flows/${flowId}/drafts`
    },
    {
      key: "publish",
      label: t(locale, "dash.render.publish"),
      path: `/flows/${flowId}/publish`
    }
  ] as const;

  return `
    <div class="actions">
      ${links
        .map(
          (link) => `
            <a class="${link.key === activeTab ? "primary" : "secondary"}" href="${escapeHtml(
              buildLocalizedPath(link.path, locale)
            )}">${escapeHtml(link.label)}</a>
          `
        )
        .join("")}
    </div>
  `;
}

function renderInlineActionForm(path: string, label: string, locale: Locale): string {
  return `
    <form method="post" action="${escapeHtml(buildLocalizedPath(path, locale))}" class="action-form">
      <button class="secondary" type="submit">${escapeHtml(label)}</button>
    </form>
  `;
}

function renderActionFeedback(
  feedback: { action: string; message: string; outcome: "failed" | "succeeded" },
  locale: Locale
): string {
  return `
    <section class="panel">
      <h3>${escapeHtml(t(locale, "dash.render.last_action_result_2"))}</h3>
      <div class="topbar-actions">
        ${renderActionOutcomeStatus(feedback.outcome, locale)}
        <span class="eyebrow">${escapeHtml(feedback.action)}</span>
      </div>
      <p>${escapeHtml(feedback.message)}</p>
    </section>
  `;
}

function renderVersionCard(
  version: NonNullable<DashFlowVersionListFetchResult["items"]>[number],
  locale: Locale
): string {
  if (!version) {
    return "";
  }

  return `
    <article class="item-card">
      <div class="item-head">
        <div>
          <p class="eyebrow">${escapeHtml(version.flowId)}</p>
          <h3>${escapeHtml(version.versionId)}</h3>
        </div>
        ${renderVersionStatus(version.status, locale)}
      </div>
      <p>${escapeHtml(version.changeSummary)}</p>
      <dl class="facts">
        <div><dt>${escapeHtml(t(locale, "dash.render.author_2"))}</dt><dd>${escapeHtml(version.author)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.released_2"))}</dt><dd>${escapeHtml(version.releasedAt)}</dd></div>
      </dl>
    </article>
  `;
}

function renderDraftCard(
  draft: NonNullable<DashFlowDraftListFetchResult["items"]>[number],
  locale: Locale
): string {
  if (!draft) {
    return "";
  }

  return `
    <article class="item-card">
      <div class="item-head">
        <div>
          <p class="eyebrow">${escapeHtml(draft.draftId)}</p>
          <h3>${escapeHtml(draft.versionId)}</h3>
        </div>
        ${renderDraftStatus(draft.status, locale)}
      </div>
      <p>${escapeHtml(draft.summary)}</p>
      <dl class="facts">
        <div><dt>${escapeHtml(t(locale, "dash.render.editor_2"))}</dt><dd>${escapeHtml(draft.editor)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.updated_2"))}</dt><dd>${escapeHtml(draft.updatedAt)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.open_issues_2"))}</dt><dd>${escapeHtml(String(draft.openIssues))}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.preview_packet_2"))}</dt><dd>${escapeHtml(
          draft.previewPacketId ?? t(locale, "dash.render.pending")
        )}</dd></div>
      </dl>
    </article>
  `;
}

function renderPublishChecklistCard(
  item: NonNullable<DashFlowPublishReadinessFetchResult["readiness"]>["checklist"][number],
  locale: Locale
): string {
  return `
    <article class="mini-card">
      <div class="mini-card-head">
        <p class="eyebrow">${escapeHtml(item.key)}</p>
        ${renderPublishChecklistStatus(item.status, locale)}
      </div>
      <h4>${escapeHtml(item.label)}</h4>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `;
}

function renderExecutionCard(execution: DashRuntimeExecutionRecord, locale: Locale): string {
  return `
    <article class="item-card">
      <div class="item-head">
        <div>
          <p class="eyebrow">${escapeHtml(execution.executionId)}</p>
          <h3>${escapeHtml(execution.flowName)}</h3>
        </div>
        ${renderExecutionStatus(execution.status, locale)}
      </div>
      <p>${escapeHtml(execution.summary)}</p>
      <dl class="facts">
        <div><dt>${escapeHtml(t(locale, "dash.render.trigger_2"))}</dt><dd>${escapeHtml(execution.trigger)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.started_2"))}</dt><dd>${escapeHtml(execution.startedAt)}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.current_step_2"))}</dt><dd>${escapeHtml(
          execution.currentStepLabel ?? t(locale, "dash.render.completed")
        )}</dd></div>
        <div><dt>${escapeHtml(t(locale, "dash.render.attention_2"))}</dt><dd>${escapeHtml(
          execution.requiresAttention ? t(locale, "dash.render.required_2") : t(locale, "dash.render.clear_2")
        )}</dd></div>
      </dl>
      <div class="actions">
        <a class="secondary" href="${escapeHtml(
          buildLocalizedPath(`/runtime/executions/${execution.executionId}`, locale)
        )}">${escapeHtml(t(locale, "dash.render.open_execution_2"))}</a>
        <a class="secondary" href="${escapeHtml(buildLocalizedPath(`/flows/${execution.flowId}`, locale))}">${escapeHtml(
          t(locale, "dash.render.open_flow_2")
        )}</a>
      </div>
    </article>
  `;
}

function renderFetchError(runtime: DashRuntimeFetchResult, locale: Locale): string {
  return `
    <p>${escapeHtml(t(locale, "dash.runtime_connection.degraded"))}</p>
    <p class="error-copy">${escapeHtml(runtime.error?.message ?? t(locale, "dash.error.server"))}</p>
  `;
}

function renderFlowStatus(status: "attention" | "blocked" | "healthy", locale: Locale): string {
  return renderStatusChip(
    status === "healthy" ? "status-ok" : "status-warn",
    status === "healthy"
      ? t(locale, "dash.render.healthy_2")
      : status === "attention"
        ? t(locale, "dash.render.attention_2")
        : t(locale, "dash.render.blocked_2")
  );
}

function renderVersionStatus(status: "archived" | "published", locale: Locale): string {
  return renderStatusChip(
    status === "published" ? "status-ok" : "status-warn",
    status === "published"
      ? t(locale, "dash.render.published_2")
      : t(locale, "dash.render.archived_2")
  );
}

function renderDraftStatus(status: "attention" | "blocked" | "locked" | "ready", locale: Locale): string {
  return renderStatusChip(
    status === "ready" ? "status-ok" : status === "blocked" ? "status-danger" : "status-warn",
    status === "ready"
      ? t(locale, "dash.render.ready_2")
      : status === "attention"
        ? t(locale, "dash.render.attention_2")
        : status === "blocked"
          ? t(locale, "dash.render.blocked_2")
          : t(locale, "dash.render.locked_2")
  );
}

function renderPublishReadinessStatus(
  status: "attention" | "blocked" | "ready",
  locale: Locale
): string {
  return renderStatusChip(
    status === "ready" ? "status-ok" : status === "blocked" ? "status-danger" : "status-warn",
    status === "ready"
      ? t(locale, "dash.render.ready_to_publish_2")
      : status === "attention"
        ? t(locale, "dash.render.needs_review_2")
        : t(locale, "dash.render.publish_blocked_2")
  );
}

function renderPublishChecklistStatus(
  status: "blocked" | "complete" | "pending",
  locale: Locale
): string {
  return renderStatusChip(
    status === "complete" ? "status-ok" : status === "blocked" ? "status-danger" : "status-warn",
    status === "complete"
      ? t(locale, "dash.render.complete_2")
      : status === "pending"
        ? t(locale, "dash.render.pending")
        : t(locale, "dash.render.blocked_2")
  );
}

function renderActionOutcomeStatus(outcome: "failed" | "succeeded", locale: Locale): string {
  return renderStatusChip(
    outcome === "succeeded" ? "status-ok" : "status-danger",
    outcome === "succeeded"
      ? t(locale, "dash.render.succeeded_2")
      : t(locale, "dash.render.failed_2")
  );
}

function renderExecutionStatus(
  status: "failed" | "queued" | "running" | "succeeded",
  locale: Locale
): string {
  return renderStatusChip(
    status === "succeeded" ? "status-ok" : status === "failed" ? "status-danger" : "status-warn",
    status === "queued"
      ? t(locale, "dash.render.queued")
      : status === "running"
        ? t(locale, "dash.render.running_2")
        : status === "succeeded"
          ? t(locale, "dash.render.succeeded_2")
          : t(locale, "dash.render.failed_2")
  );
}

function renderStepStatus(
  status: "completed" | "failed" | "queued" | "running",
  locale: Locale
): string {
  return renderStatusChip(
    status === "completed" ? "status-ok" : status === "failed" ? "status-danger" : "status-warn",
    status === "queued"
      ? t(locale, "dash.render.queued")
      : status === "running"
        ? t(locale, "dash.render.running_2")
        : status === "completed"
          ? t(locale, "dash.render.completed_2")
          : t(locale, "dash.render.failed_2")
  );
}

function renderBuilderLockLabel(status: "locked" | "read_only" | "unlocked", locale: Locale): string {
  if (status === "locked") {
    return t(locale, "dash.render.locked_2");
  }

  if (status === "read_only") {
    return t(locale, "dash.render.read_only_2");
  }

  return t(locale, "dash.render.unlocked_2");
}

function renderAutosaveLabel(status: "attention" | "pending" | "saved", locale: Locale): string {
  if (status === "attention") {
    return t(locale, "dash.render.needs_attention_2");
  }

  if (status === "pending") {
    return t(locale, "dash.render.saving_2");
  }

  return t(locale, "dash.render.saved");
}

function renderMetricCard(locale: Locale, titleKey: string, value: number, bodyKey: string): string {
  return `
    <article class="metric-card">
      <p class="eyebrow">${escapeHtml(t(locale, titleKey))}</p>
      <h3>${escapeHtml(String(value))}</h3>
      <p>${escapeHtml(t(locale, bodyKey))}</p>
    </article>
  `;
}

function renderResultPanel(locale: Locale, title: string, body: string): string {
  return `
    <section class="panel">
      <h3>${escapeHtml(title)}</h3>
      <p class="error-copy">${escapeHtml(body)}</p>
    </section>
  `;
}

function renderEmptyPanel(locale: Locale, title: string, body: string): string {
  return `
    <section class="panel">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <p class="eyebrow">${escapeHtml(t(locale, "dash.render.truth_first_empty_state_2"))}</p>
    </section>
  `;
}

function page(path: string, locale: Locale, pageTitle: string, body: string): string {
  const metadata = getPageMetadata(path, locale, pageTitle);
  const ogType = /article/i.test(metadata.schemaType) ? "article" : "website";
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
    <meta name="robots" content="noindex,nofollow" />
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
        color-scheme: dark;
        --bg: #0d1716;
        --bg-soft: #11201f;
        --panel: rgba(18, 33, 31, 0.92);
        --panel-strong: #193433;
        --ink: #edf6f2;
        --muted: #9bb5ae;
        --line: rgba(237, 246, 242, 0.12);
        --accent: #88d0b8;
        --accent-strong: #c8ffde;
        --warn: #ffcf82;
        --danger: #ff9d8a;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(136, 208, 184, 0.12), transparent 28%),
          radial-gradient(circle at top right, rgba(255, 157, 138, 0.08), transparent 22%),
          linear-gradient(180deg, #081111 0%, var(--bg) 100%);
        color: var(--ink);
      }

      a { color: inherit; text-decoration: none; }
      code { font-family: "IBM Plex Mono", "SFMono-Regular", monospace; }

      .app-shell {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        min-height: 100vh;
      }

      .sidebar {
        display: grid;
        align-content: start;
        gap: 24px;
        padding: 28px 22px;
        border-right: 1px solid var(--line);
        background: rgba(7, 15, 14, 0.82);
        backdrop-filter: blur(16px);
      }

      .brand-block h1,
      .hero-copy h1,
      .topbar h2,
      .panel h2,
      .panel h3,
      .hero-card h3,
      .metric-card h3,
      .item-card h3,
      .mini-card h4 {
        margin: 0;
      }

      .eyebrow {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .nav-list,
      .locale-list {
        display: grid;
        gap: 6px;
      }

      .nav-list a,
      .locale-list a {
        padding: 11px 12px;
        border-radius: 12px;
        color: var(--muted);
      }

      .nav-list a[aria-current="page"],
      .nav-list a:hover,
      .locale-list a[aria-current="true"] {
        background: rgba(136, 208, 184, 0.12);
        color: var(--ink);
      }

      .sidebar-meta,
      .facts {
        display: grid;
        gap: 10px;
      }

      .sidebar-meta p,
      .facts div {
        display: grid;
        gap: 4px;
        margin: 0;
      }

      .sidebar-meta strong,
      .facts dt {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .sidebar-meta span,
      .facts dd {
        margin: 0;
        overflow-wrap: anywhere;
      }

      .main-panel {
        display: grid;
        align-content: start;
        gap: 22px;
        padding: 28px;
      }

      .topbar,
      .hero-grid,
      .card-grid,
      .detail-grid {
        display: grid;
        gap: 16px;
      }

      .topbar {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
      }

      .topbar-actions,
      .actions,
      .hero-head,
      .item-head,
      .mini-card-head {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
      }

      .action-form {
        margin: 0;
      }

      .hero-grid,
      .detail-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .card-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .item-grid,
      .stack-grid {
        display: grid;
        gap: 16px;
      }

      .item-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .panel,
      .hero-card,
      .metric-card,
      .item-card,
      .mini-card {
        border: 1px solid var(--line);
        border-radius: 20px;
        background: var(--panel);
        padding: 22px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
      }

      .hero-card h3 {
        font-size: clamp(26px, 4vw, 34px);
        line-height: 1.02;
        margin-bottom: 12px;
      }

      .hero-card-muted {
        background: rgba(21, 39, 37, 0.8);
      }

      .metric-card h3 {
        font-size: 46px;
        line-height: 1;
        margin-bottom: 10px;
        color: var(--accent-strong);
      }

      .hero {
        min-height: 100vh;
        padding: 32px;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
        gap: 20px;
        align-items: center;
      }

      .simple-hero {
        grid-template-columns: minmax(0, 1fr);
      }

      .hero-copy {
        display: grid;
        gap: 18px;
      }

      .hero-copy h1 {
        font-size: clamp(42px, 7vw, 82px);
        line-height: 0.92;
      }

      .lede,
      .panel p,
      .hero-card p,
      .metric-card p,
      .item-card p,
      .mini-card p,
      li {
        color: var(--muted);
      }

      .primary,
      .secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-weight: 700;
      }

      .primary {
        background: var(--accent);
        color: #081111;
      }

      .secondary {
        background: transparent;
        border-color: var(--line);
        color: var(--ink);
        cursor: pointer;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
      }

      .status-ok {
        background: rgba(136, 208, 184, 0.18);
        color: var(--accent-strong);
      }

      .status-warn {
        background: rgba(255, 207, 130, 0.14);
        color: var(--warn);
      }

      .status-danger {
        background: rgba(255, 157, 138, 0.14);
        color: var(--danger);
      }

      .stack-list {
        display: grid;
        gap: 12px;
        padding-left: 18px;
        margin: 0;
      }

      .mini-meta,
      .error-copy {
        color: var(--danger);
      }

      @media (max-width: 920px) {
        .app-shell,
        .hero,
        .hero-grid,
        .detail-grid,
        .card-grid,
        .item-grid,
        .topbar {
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

function renderNavLink(locale: Locale, path: string, label: string, active = false): string {
  return `<a${active ? ' aria-current="page"' : ""} href="${escapeHtml(
    buildLocalizedPath(path, locale)
  )}">${escapeHtml(label)}</a>`;
}

function renderStatusChip(className: string, label: string): string {
  return `<span class="status-pill ${escapeHtml(className)}">${escapeHtml(label)}</span>`;
}

function getNextAction(runtime: DashRuntimeFetchResult, locale: Locale): { body: string; title: string } {
  return buildActions(runtime, locale)[0] ?? {
    title: t(locale, "dash.action.steady.title"),
    body: t(locale, "dash.action.steady.body")
  };
}

function buildActions(runtime: DashRuntimeFetchResult, locale: Locale): Array<{ body: string; title: string }> {
  if (!runtime.ok || !runtime.summary) {
    return [
      {
        title: t(locale, "dash.action.restore.title"),
        body: t(locale, "dash.action.restore.body")
      }
    ];
  }

  const actions: Array<{ body: string; title: string }> = [];

  if (runtime.summary.alertsCriticalOpen > 0) {
    actions.push({
      title: t(locale, "dash.action.alerts.title"),
      body: t(locale, "dash.action.alerts.body")
    });
  }

  if (runtime.summary.approvalsPending > 0) {
    actions.push({
      title: t(locale, "dash.action.approvals.title"),
      body: t(locale, "dash.action.approvals.body")
    });
  }

  if (runtime.summary.billingOverdueCount > 0) {
    actions.push({
      title: t(locale, "dash.action.billing.title"),
      body: t(locale, "dash.action.billing.body")
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: t(locale, "dash.action.fresh.title"),
      body: t(locale, "dash.action.fresh.body")
    });
  }

  return actions;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
