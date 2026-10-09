/**
 * flow, dash and web running against one real mail-api process.
 *
 *   dash  -> DASH_FLOW_API_BASE          (reads + publish actions)
 *   web   -> WEB_SHARED_FLOW_API_BASE    (shared onboarding contract)
 *   flow  -> FLOW_API_FLOW_URL           (marketing page that points at the API)
 *
 * The mail-api flow source is in-memory per process, so the dash tests below use
 * a different seeded flow per mutation and never depend on each other's order.
 *
 * Needs `pnpm build`. Run: node --test tests/e2e/flow-dash-web.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { builtEntryAvailable, getFreePort, request, skipUnlessBuilt, startMailApi, startService } from "./support/harness.mjs";

const WORKSPACE = "ws_flow_main";
const SESSION = { "x-dash-session": "e2e-session" };
const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;

const built = ["apps/mail-api/dist/bootstrap.js", "apps/dash/dist/index.js", "apps/web/dist/index.js", "apps/flow/dist/index.js"].every(
  builtEntryAvailable
);

function flowApi(api, pathname) {
  return request(api.baseUrl, `${pathname}${pathname.includes("?") ? "&" : "?"}workspace_id=${WORKSPACE}`);
}

describe("flow, dash and web against a real mail-api", { skip: skipUnlessBuilt(built, "mail-api, dash, web or flow not built") }, () => {
  let api;
  let dash;
  let web;
  let flow;

  before(async () => {
    api = await startMailApi();
    // allSettled, not all: when one service fails to start the others must still be recorded so after() stops them
    const results = await Promise.allSettled([
      startService({
        name: "dash",
        entry: "apps/dash/dist/index.js",
        portEnv: "DASH_PORT",
        hostEnv: "DASH_HOST",
        env: { DASH_FLOW_API_BASE: api.baseUrl }
      }),
      startService({
        name: "web",
        entry: "apps/web/dist/index.js",
        portEnv: "WEB_PORT",
        hostEnv: "WEB_BIND_ADDRESS",
        env: { WEB_SHARED_FLOW_API_BASE: api.baseUrl }
      }),
      startService({
        name: "flow",
        entry: "apps/flow/dist/index.js",
        portEnv: "FLOW_PORT",
        hostEnv: "FLOW_HOST",
        env: { FLOW_API_FLOW_URL: api.baseUrl }
      })
    ]);
    [dash, web, flow] = results.map((result) => (result.status === "fulfilled" ? result.value : undefined));
    const failure = results.find((result) => result.status === "rejected");
    if (failure) {
      throw failure.reason;
    }
  });

  after(async () => {
    await Promise.all([dash?.stop(), web?.stop(), flow?.stop()]);
    await api?.stop();
  });

  const dashGet = (pathname, headers = SESSION) => request(dash.baseUrl, pathname, { headers });
  const dashPost = (pathname, headers = SESSION) => request(dash.baseUrl, pathname, { method: "POST", headers });

  describe("flow", () => {
    test("reports and links to the API base it was configured with", async () => {
      const health = await request(flow.baseUrl, "/health");
      assert.equal(health.status, 200);
      assert.equal(health.json.data.api_flow_url, api.baseUrl);

      const page = await request(flow.baseUrl, "/?lang=en");
      assert.equal(page.status, 200);
      assert.ok(page.text.includes(`href="${api.baseUrl}`), "landing page does not link to the configured API");
    });

    test("the API it points at is healthy and serves the flow contract", async () => {
      const response = await request(api.baseUrl, "/health");
      assert.equal(response.json.data.service, "api.flow");
      const flows = await flowApi(api, "/v1/flow/flows");
      assert.equal(flows.status, 200);
      assert.equal(flows.json.data.total, 3);
    });
  });

  describe("dash: session gate", () => {
    test("public routes are reachable without a session", async () => {
      const health = await request(dash.baseUrl, "/health");
      assert.equal(health.status, 200);
      assert.equal(health.json.data.service, "iai-dash");

      const login = await request(dash.baseUrl, "/login?lang=en");
      assert.equal(login.status, 200);
      assert.match(login.headers.get("content-type"), /text\/html/);
      assert.equal(login.headers.get("x-robots-tag"), "noindex, nofollow");
    });

    test("every protected page redirects to /login?next= when there is no session", async () => {
      const protectedPaths = [
        "/",
        "/dashboard",
        "/actions",
        "/audit",
        "/flows",
        "/flows/flow_lead_intake",
        "/flows/flow_lead_intake/publish",
        "/runtime",
        "/runtime/executions/exec_9001"
      ];
      for (const pathname of protectedPaths) {
        const response = await request(dash.baseUrl, pathname);
        assert.equal(response.status, 303, `${pathname} -> ${response.status}`);
        const location = response.headers.get("location");
        assert.equal(location, `/login?next=${encodeURIComponent(pathname)}`, pathname);
        assert.equal(response.text, "", "redirect must not render the protected page");
      }
    });

    test("an unauthenticated action does not reach the flow API", async () => {
      const before = await flowApi(api, "/v1/flow/audit");
      const response = await request(dash.baseUrl, "/flows/flow_invoice_recovery/publish/confirm", { method: "POST" });
      assert.equal(response.status, 303);
      assert.match(response.headers.get("location"), /^\/login\?next=/);
      const after = await flowApi(api, "/v1/flow/audit");
      assert.equal(after.json.data.total, before.json.data.total);
    });

    test("the login page carries a safe next path and escapes it", async () => {
      const response = await request(dash.baseUrl, "/login?lang=en&next=%2Fflows%2Fx%3Fa%3D%22%3E%3Cb%3Ebold");
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /"><b>bold/);

      const external = await request(dash.baseUrl, "/login?lang=en&next=https%3A%2F%2Fexample.org%2Fx");
      assert.equal(external.status, 200);
      assert.doesNotMatch(external.text, /href="https:\/\/example\.org/);
    });

    test("a session cookie authenticates like the session header", async () => {
      const response = await request(dash.baseUrl, "/flows?lang=en", {
        headers: { cookie: `iai_session=e2e-cookie; iai_workspace=${WORKSPACE}` }
      });
      assert.equal(response.status, 200);
      assert.match(response.text, /Lead Intake Qualification/);
    });

    test("logout expires the session and workspace cookies and returns to /login", async () => {
      const response = await dashGet("/logout");
      assert.equal(response.status, 303);
      assert.equal(response.headers.get("location"), "/login");
      const cookies = response.headers.getSetCookie();
      for (const name of ["iai_session", "iai_workspace"]) {
        const cookie = cookies.find((entry) => entry.startsWith(`${name}=`));
        assert.ok(cookie, `${name} cookie not cleared`);
        assert.match(cookie, /Max-Age=0/);
        assert.match(cookie, /HttpOnly/);
        assert.match(cookie, /SameSite=Lax/);
        assert.match(cookie, /^[^=]+=;/, "cleared cookie must have an empty value");
      }

      // A client that applies the cleared cookies is logged out again.
      const afterLogout = await request(dash.baseUrl, "/flows");
      assert.equal(afterLogout.status, 303);
    });

    test("a malformed cookie header is treated as no session, not a server error", async () => {
      const response = await request(dash.baseUrl, "/dashboard", { headers: { cookie: "iai_session=%E0%A4%A" } });
      assert.ok(response.status < 500, `status ${response.status}`);
    });
  });

  describe("dash: pages rendered from the real API", () => {
    test("/flows lists the flows served by mail-api", async () => {
      const response = await dashGet("/flows?lang=en");
      assert.equal(response.status, 200, response.text.slice(0, 300));
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
      assert.match(response.text, /<html lang="en"/);

      const upstream = await flowApi(api, "/v1/flow/flows");
      for (const item of upstream.json.data.items) {
        assert.ok(response.text.includes(item.name), `flow "${item.name}" missing from the dash list`);
      }
    });

    test("flow detail, versions, drafts, builder and publish pages show API data", async () => {
      const cases = [
        ["/flows/flow_lead_intake?lang=en", ["Lead Intake Qualification", "growth-ops"]],
        ["/flows/flow_lead_intake/versions?lang=en", ["v12"]],
        ["/flows/flow_lead_intake/drafts?lang=en", ["draft_lead_v13"]],
        ["/flows/flow_lead_intake/builder?lang=en", ["Lead form intake"]],
        ["/flows/flow_lead_intake/publish?lang=en", ["pkt_lead_v13"]]
      ];
      for (const [pathname, needles] of cases) {
        const response = await dashGet(pathname);
        assert.equal(response.status, 200, pathname);
        for (const needle of needles) {
          assert.ok(response.text.includes(needle), `${pathname} is missing "${needle}"`);
        }
      }
    });

    test("/audit and runtime pages render API audit events and executions", async () => {
      const audit = await dashGet("/audit?lang=en");
      assert.equal(audit.status, 200);
      assert.match(audit.text, /Published v4 after locale-safe contract validation\./);

      const runtime = await dashGet("/runtime?lang=en");
      assert.equal(runtime.status, 200);
      assert.match(runtime.text, /exec_9001/);

      const detail = await dashGet("/runtime/executions/exec_9001?lang=en");
      assert.equal(detail.status, 200);
      assert.match(detail.text, /Lead Intake Qualification/);

      for (const pathname of ["/dashboard?lang=en", "/actions?lang=en"]) {
        const response = await dashGet(pathname);
        assert.equal(response.status, 200, pathname);
      }
    });

    test("the workspace shown follows the requested workspace and its data stays separate", async () => {
      const main = await dashGet("/flows?lang=en");
      assert.match(main.text, /Lead Intake Qualification/);

      const other = await dashGet("/flows?lang=en&workspace_id=ws_empty_e2e");
      assert.equal(other.status, 200);
      assert.doesNotMatch(other.text, /Lead Intake Qualification/);

      const viaHeader = await dashGet("/flows?lang=en", { ...SESSION, "x-workspace-id": "ws_empty_e2e" });
      assert.doesNotMatch(viaHeader.text, /Lead Intake Qualification/);
    });

    test("an unknown route is a 404 page and an unknown flow is reported as not found", async () => {
      const route = await dashGet("/no-such-page");
      assert.equal(route.status, 404);
      assert.doesNotMatch(route.text, STACK_TRACE);

      const flowPage = await dashGet("/flows/flow_that_does_not_exist?lang=en");
      assert.match(flowPage.text, /Flow not found/);
    });

    test("an unknown flow answers 404 instead of a 200 error page", { todo: "known gap, tracked on the team board" }, async () => {
      const response = await dashGet("/flows/flow_that_does_not_exist?lang=en");
      assert.equal(response.status, 404);
    });

    test("the locale follows ?lang and Accept-Language", async () => {
      const en = await dashGet("/dashboard?lang=en");
      assert.match(en.text, /<html lang="en"/);
      assert.equal(en.headers.get("content-language"), "en");
      const vi = await dashGet("/dashboard?lang=vi");
      assert.match(vi.text, /<html lang="vi"/);
      const negotiated = await dashGet("/dashboard", { ...SESSION, "accept-language": "en-US,en;q=0.9" });
      assert.match(negotiated.text, /<html lang="en"/);
    });

    test("action feedback from the query string is escaped", async () => {
      const response = await dashGet(
        "/flows/flow_lead_intake/publish?lang=en&action=publish.confirm&outcome=failed&message=%3Cscript%3Ewindow.__x%3D1%3C%2Fscript%3E"
      );
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /<script>window\.__x/);
    });
  });

  describe("dash: publish flow end to end", () => {
    test("confirming a blocked publish fails, is audited, and leaves the flow unchanged", async () => {
      const before = await flowApi(api, "/v1/flow/flows/flow_invoice_recovery");
      const response = await dashPost("/flows/flow_invoice_recovery/publish/confirm?lang=en");
      assert.equal(response.status, 303);
      const location = new URL(response.headers.get("location"), "http://dash.local");
      assert.equal(location.pathname, "/flows/flow_invoice_recovery/publish");
      assert.equal(location.searchParams.get("outcome"), "failed");
      assert.equal(location.searchParams.get("action"), "publish.confirm");

      const after = await flowApi(api, "/v1/flow/flows/flow_invoice_recovery");
      assert.equal(after.json.data.flow.activeVersion, before.json.data.flow.activeVersion);
      assert.equal(after.json.data.flow.lastPublishedAt, before.json.data.flow.lastPublishedAt);

      const audit = await flowApi(api, "/v1/flow/audit?flow_id=flow_invoice_recovery&action=publish.confirm");
      assert.ok(audit.json.data.items.some((item) => item.outcome === "failed"));

      // The page the redirect lands on shows the failure.
      const landed = await dashGet(`${location.pathname}${location.search}`);
      assert.equal(landed.status, 200);
      assert.match(landed.text, /Publish failed/);
    });

    test("validate -> preview -> confirm through the rendered forms publishes the flow", async () => {
      const flowId = "flow_locale_handoff";
      const before = await flowApi(api, `/v1/flow/flows/${flowId}`);
      const auditBefore = await flowApi(api, `/v1/flow/audit?flow_id=${flowId}`);

      // Drive the actions through the form targets that the pages actually render.
      const builder = await dashGet(`/flows/${flowId}/builder?lang=en`);
      const validateAction = /<form method="post" action="([^"]+\/builder\/validate[^"]*)"/.exec(builder.text)?.[1];
      assert.ok(validateAction, "builder page renders no validate form");
      const validated = await dashPost(validateAction.replaceAll("&amp;", "&"));
      assert.equal(validated.status, 303);
      assert.equal(new URL(validated.headers.get("location"), "http://dash.local").searchParams.get("outcome"), "succeeded");

      const publishPage = await dashGet(`/flows/${flowId}/publish?lang=en`);
      const previewAction = /<form method="post" action="([^"]+\/publish\/preview[^"]*)"/.exec(publishPage.text)?.[1];
      const confirmAction = /<form method="post" action="([^"]+\/publish\/confirm[^"]*)"/.exec(publishPage.text)?.[1];
      assert.ok(previewAction && confirmAction, "publish page renders no preview/confirm forms");

      const previewed = await dashPost(previewAction.replaceAll("&amp;", "&"));
      assert.equal(new URL(previewed.headers.get("location"), "http://dash.local").searchParams.get("outcome"), "succeeded");

      const confirmed = await dashPost(confirmAction.replaceAll("&amp;", "&"));
      assert.equal(confirmed.status, 303);
      const confirmedLocation = new URL(confirmed.headers.get("location"), "http://dash.local");
      assert.equal(confirmedLocation.searchParams.get("outcome"), "succeeded");
      assert.match(confirmedLocation.searchParams.get("message"), /Published v4/);

      // State is visible through the mail-api read side.
      const after = await flowApi(api, `/v1/flow/flows/${flowId}`);
      assert.notEqual(after.json.data.flow.lastPublishedAt, before.json.data.flow.lastPublishedAt);
      assert.match(after.json.data.flow.latestPublishNote, /Dash action lane/);
      const readiness = await flowApi(api, `/v1/flow/flows/${flowId}/publish`);
      assert.equal(readiness.json.data.readiness.status, "ready");

      const audit = await flowApi(api, `/v1/flow/audit?flow_id=${flowId}`);
      const added = audit.json.data.items.length - auditBefore.json.data.items.length;
      assert.equal(added, 3, "validate, preview and confirm must each leave one audit event");
      const actions = audit.json.data.items.slice(0, 3).map((item) => `${item.action}:${item.outcome}`);
      assert.deepEqual(actions, ["publish.confirm:succeeded", "publish.preview:succeeded", "builder.validate:succeeded"]);
      assert.ok(audit.json.data.items.slice(0, 3).every((item) => item.actor === "e2e-session"));

      // ...and on the dash audit page.
      const auditPage = await dashGet("/audit?lang=en");
      assert.match(auditPage.text, /Published v4/);
    });

    test("a flow the API does not know yields a not-found result, not a crash", async () => {
      const response = await dashPost("/flows/flow_that_does_not_exist/publish/confirm?lang=en");
      assert.ok(response.status < 500, `status ${response.status}`);
      assert.ok(dash.isRunning());
    });

    test("actions only run on POST: GET and other verbs never write audit events", async () => {
      const auditBefore = await flowApi(api, "/v1/flow/audit");
      const get = await dashGet("/flows/flow_lead_intake/publish/confirm");
      assert.ok(get.status < 500);
      for (const method of ["PUT", "DELETE", "PATCH"]) {
        const response = await request(dash.baseUrl, "/flows/flow_lead_intake/publish/confirm", { method, headers: SESSION });
        assert.equal(response.status, 405, method);
      }
      const auditAfter = await flowApi(api, "/v1/flow/audit");
      assert.equal(auditAfter.json.data.total, auditBefore.json.data.total);
    });
  });

  describe("dash: upstream outage", () => {
    test("when mail-api is unreachable the response is a bounded error without internals", async () => {
      const deadBase = `http://127.0.0.1:${await getFreePort()}`;
      const isolated = await startService({
        name: "dash-isolated",
        entry: "apps/dash/dist/index.js",
        portEnv: "DASH_PORT",
        hostEnv: "DASH_HOST",
        env: { DASH_FLOW_API_BASE: deadBase }
      });
      try {
        const health = await request(isolated.baseUrl, "/health");
        assert.equal(health.status, 200, "dash itself stays healthy");
        const response = await request(isolated.baseUrl, "/flows?lang=en", { headers: SESSION });
        assert.ok(response.status >= 500 && response.status < 600, `status ${response.status}`);
        assert.doesNotMatch(response.text, STACK_TRACE);
        assert.ok(isolated.isRunning());
        const login = await request(isolated.baseUrl, "/login");
        assert.equal(login.status, 200, "public pages keep working while the API is down");
      } finally {
        await isolated.stop();
      }
    });
  });

  describe("web", () => {
    test("/contract-status mirrors the contract served by mail-api", async () => {
      const upstream = await flowApi(api, "/v1/flow/web-onboarding-contract");
      const response = await request(web.baseUrl, "/contract-status");
      assert.equal(response.status, 200, response.text);
      const data = response.json.data;
      const expected = upstream.json.data;
      assert.equal(data.auth_mode, "shared_redirect");
      assert.equal(data.billing_mode, "shared_reference");
      assert.deepEqual(data.contract.service, "api.flow");
      assert.deepEqual(data.readiness, expected.readiness);
      assert.deepEqual(data.route_targets, expected.routeTargets);
      assert.equal(data.recommended_shared_auth, expected.sharedAuthUrl);
      assert.equal(data.contract.alertsCriticalOpen, expected.contractStatus.alertsCriticalOpen);
    });

    test("/health proves the flow API is reachable", async () => {
      const response = await request(web.baseUrl, "/health");
      assert.equal(response.status, 200);
      assert.equal(response.json.data.service, "iai-web");
      assert.equal(response.json.data.flow_api_base, api.baseUrl);
      assert.equal(response.json.data.auth_mode, "shared_redirect");
    });

    test("when mail-api is unreachable the contract routes answer 502 with a JSON error", async () => {
      const deadBase = `http://127.0.0.1:${await getFreePort()}`;
      const isolated = await startService({
        name: "web-isolated",
        entry: "apps/web/dist/index.js",
        portEnv: "WEB_PORT",
        hostEnv: "WEB_BIND_ADDRESS",
        readyPath: "/events",
        env: { WEB_SHARED_FLOW_API_BASE: deadBase }
      });
      try {
        for (const pathname of ["/contract-status", "/", "/onboarding"]) {
          const response = await request(isolated.baseUrl, pathname);
          assert.equal(response.status, 502, pathname);
          assert.equal(response.json.error.code, "SHARED_CONTRACT_ERROR");
          assert.doesNotMatch(response.text, STACK_TRACE);
        }
        const feedback = await request(isolated.baseUrl, "/feedback");
        assert.equal(feedback.status, 200, "pages that do not need the contract keep working");
      } finally {
        await isolated.stop();
      }
    });

    test("the landing page renders and records a campaign-tagged view event", async () => {
      const campaign = `camp-${Date.now()}`;
      const response = await request(web.baseUrl, `/?campaign=${campaign}&variant=b`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /text\/html/);
      const events = await request(web.baseUrl, "/events");
      const event = events.json.data.items.find((item) => item.sourceCampaign === campaign);
      assert.equal(event?.eventName, "web_landing_view");
      assert.equal(event.variantId, "b");
      assert.equal(event.route, "/");
    });

    test("onboarding: GET preselects role and intent, POST renders the route plan", async () => {
      const form = await request(web.baseUrl, "/onboarding?role=operator&intent=leads&campaign=onb-get");
      assert.equal(form.status, 200);
      assert.match(form.text, /<form/);

      const summary = await request(web.baseUrl, "/onboarding", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "role=builder&intent=commerce"
      });
      assert.equal(summary.status, 200);
      assert.match(summary.text, /Commerce launch setup/);
      const upstream = await flowApi(api, "/v1/flow/web-onboarding-contract");
      assert.ok(
        summary.text.includes(encodeURIComponent(upstream.json.data.routeTargets.commerce.nextUrl)),
        "shared auth href does not carry the commerce target from the API contract"
      );

      const events = await request(web.baseUrl, "/events");
      const names = events.json.data.items.map((item) => item.eventName);
      assert.ok(names.includes("web_role_selected"));
      assert.ok(names.includes("web_paid_intent_started"));
    });

    test("onboarding: POST with an unknown role or intent is a 400", async () => {
      for (const body of ["role=admin&intent=commerce", "role=builder&intent=hack", "", "role=builder"]) {
        const response = await request(web.baseUrl, "/onboarding", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body
        });
        assert.equal(response.status, 400, JSON.stringify(body));
        assert.equal(response.json.error.code, "VALIDATION_ERROR");
      }
    });

    test("/shared-auth redirects only to the shared auth host with an allow-listed next target", async () => {
      const upstream = await flowApi(api, "/v1/flow/web-onboarding-contract");
      const allowedHosts = new Set(["app.iai.one", "dash.iai.one", "flow.iai.one"]);
      const targets = new Set(Object.values(upstream.json.data.routeTargets).map((target) => target.nextUrl));
      const combos = [
        ["starter", "information"],
        ["builder", "leads"],
        ["operator", "commerce"]
      ];
      for (const [role, intent] of combos) {
        const response = await request(web.baseUrl, `/shared-auth?role=${role}&intent=${intent}`);
        assert.equal(response.status, 303, `${role}/${intent}`);
        const location = new URL(response.headers.get("location"));
        assert.equal(location.origin, new URL(upstream.json.data.sharedAuthUrl).origin);
        assert.equal(location.protocol, "https:");
        assert.equal(location.searchParams.get("origin"), "web.iai.one");
        assert.equal(location.searchParams.get("role"), role);
        assert.equal(location.searchParams.get("intent"), intent);
        const next = new URL(location.searchParams.get("next"));
        assert.ok(allowedHosts.has(next.host), `next host ${next.host} is not allow-listed`);
        assert.ok(targets.has(next.toString()), `next ${next} is not one of the contract route targets`);
      }
    });

    test("/shared-auth refuses missing or unknown handoff parameters and never reflects them", async () => {
      for (const query of ["", "?role=builder", "?intent=leads", "?role=root&intent=leads", "?role=builder&intent=https://example.org"]) {
        const response = await request(web.baseUrl, `/shared-auth${query}`);
        assert.equal(response.status, 400, query);
        assert.equal(response.headers.get("location"), null);
        assert.doesNotMatch(response.text, /example\.org/);
      }
    });

    test("/feedback: the form renders in the requested locale", async () => {
      const en = await request(web.baseUrl, "/feedback?lang=en");
      assert.match(en.text, /<html lang="en"/);
      assert.match(en.text, /Type of feedback/);
      const vi = await request(web.baseUrl, "/feedback?lang=vi");
      assert.match(vi.text, /<html lang="vi"/);
      assert.match(vi.text, /Loại phản hồi/);
      const negotiated = await request(web.baseUrl, "/feedback", { headers: { "accept-language": "vi-VN,vi;q=0.9" } });
      assert.match(negotiated.text, /<html lang="vi"/);
      const unknown = await request(web.baseUrl, "/feedback?lang=zz");
      assert.equal(unknown.status, 200);
      assert.match(unknown.text, /<html lang="(en|vi)"/);
    });

    test("/feedback: a valid submission is acknowledged and recorded without storing the message", async () => {
      const message = `Please add dark mode ${Date.now()}`;
      const response = await request(web.baseUrl, "/feedback?lang=en", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ category: "bug", message, rating: "4", email: "user@example.com" }).toString()
      });
      assert.equal(response.status, 200, response.text.slice(0, 300));
      assert.match(response.text, /Feedback submitted/);
      const ack = /evt_\d+/.exec(response.text)?.[0];
      assert.ok(ack, "acknowledgement reference missing");

      const events = await request(web.baseUrl, "/events");
      const event = events.json.data.items.find((item) => item.eventId === ack);
      assert.equal(event.eventName, "web_feedback_submitted");
      assert.equal(event.feedbackCategory, "bug");
      assert.equal(event.feedbackRating, 4);
      assert.equal(event.messageLength, message.length);
      assert.doesNotMatch(events.text, new RegExp(message), "event log must not retain the free-text message");
      assert.doesNotMatch(events.text, /user@example\.com/, "event log must not retain the email address");
    });

    test("/feedback: validation failures are 400 pages and are not recorded", async () => {
      const before = (await request(web.baseUrl, "/events")).json.data.total;
      const post = (body) =>
        request(web.baseUrl, "/feedback?lang=en", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body
        });
      const empty = await post("category=idea&message=");
      assert.equal(empty.status, 400);
      assert.match(empty.text, /Please add a message/);
      const badEmail = await post("category=idea&message=hello&email=not-an-email");
      assert.equal(badEmail.status, 400);
      const whitespace = await post("category=idea&message=%20%20%20");
      assert.equal(whitespace.status, 400);
      const after = (await request(web.baseUrl, "/events")).json.data.total;
      assert.equal(after, before);
    });

    test("/feedback: hostile input is not reflected as markup", async () => {
      const response = await request(web.baseUrl, "/feedback?lang=en&category=%22%3E%3Cb%3Ex", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ category: '"><b>x', message: "<b>hi</b>", email: '"><i>@x.io' }).toString()
      });
      assert.doesNotMatch(response.text, /<b>x|<b>hi<\/b>|"><i>/);
    });

    test("/events returns a bounded, ordered list", async () => {
      const response = await request(web.baseUrl, "/events");
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(response.json.data.items));
      assert.ok(response.json.data.items.length <= 50);
      const ids = response.json.data.items.map((item) => Number(item.eventId.slice(4)));
      assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
    });

    test("unknown routes are JSON 404s", async () => {
      const response = await request(web.baseUrl, "/definitely-missing");
      assert.equal(response.status, 404);
      assert.equal(response.json.error.code, "NOT_FOUND");
    });

    test("the AI builder page is disabled by default", async () => {
      const response = await request(web.baseUrl, "/build");
      assert.equal(response.status, 404);
    });
  });
});
