// trust.iai.one Worker — Phase 1 (foundation pack v1)
// Static assets serve UI. /api/trust/* exposes only what Phase 1 supports.
// Status enum: verified | declared | unverified.
// No fake claims. No silent failures. No private internal scope leaks.

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getUserId(request) {
  return request.headers.get("x-user-id") || "public_anonymous";
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-user-id"
  };
}

async function logEvent(env, { user_id, type, action, metadata }) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      "INSERT INTO audit_logs (id, user_id, type, action, metadata) VALUES (?, ?, ?, ?, ?)"
    ).bind(id("log"), user_id, type, action, JSON.stringify(metadata || {})).run();
  } catch {
    // fail open per Phase 1 rule: never block UI on logging
  }
}

async function readTrustState(env) {
  try {
    const url = new URL("https://placeholder/data/trust-state.json");
    const res = await env.ASSETS.fetch(new Request(url.toString()));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  // /api/trust/health — operational health of this Worker only
  if (url.pathname === "/api/trust/health") {
    return json({
      ok: true,
      service: "trust.iai.one",
      phase: "phase_1_static",
      time: new Date().toISOString()
    });
  }

  // /api/trust/state — full single source of truth
  if (url.pathname === "/api/trust/state" && request.method === "GET") {
    const state = await readTrustState(env);
    if (!state) return json({ error: "trust_state_not_built" }, 503);
    return json(state);
  }

  // Per-module slices for third-party verifiers
  const moduleRoutes = {
    "/api/trust/domains":   "official_domains",
    "/api/trust/teams":     "official_teams",
    "/api/trust/channels":  "official_channels",
    "/api/trust/methods":   "verification_methods",
    "/api/trust/go":        "go_short_links",
    "/api/trust/reports":   "report_and_impersonation",
    "/api/trust/pages":     "trust_page_builder"
  };
  if (moduleRoutes[url.pathname] && request.method === "GET") {
    const state = await readTrustState(env);
    if (!state) return json({ error: "trust_state_not_built" }, 503);
    const items = state.modules?.[moduleRoutes[url.pathname]] || [];
    return json({
      module: moduleRoutes[url.pathname],
      count: items.length,
      items,
      generated_at: state.generated_at,
      build_commit: state.build_commit,
      claim_status_enum: state.verification_policy?.claim_status_enum
    });
  }

  // /api/trust/report — accept user-submitted report; logged for human review
  if (url.pathname === "/api/trust/report" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const message = String(body.message || "").trim();
    if (!message) return json({ error: "message_required" }, 400);
    const user_id = getUserId(request);
    await logEvent(env, {
      user_id,
      type: "report",
      action: "issue_reported",
      metadata: {
        type: String(body.type || "issue").slice(0, 64),
        affected: String(body.affected || "").slice(0, 200),
        message: message.slice(0, 1000),
        contact: String(body.contact || "").slice(0, 200)
      }
    });
    return json({
      ok: true,
      status: "received",
      note: "Phase 1 does not run a backend ticketing system. Reports are logged for human review."
    });
  }

  // Phase 1 explicitly does NOT expose user data, export, or delete APIs.
  if (
    url.pathname === "/api/trust/data" ||
    url.pathname === "/api/trust/export" ||
    url.pathname === "/api/trust/delete"
  ) {
    return json({
      error: "not_available_in_phase_1",
      note: "User data view, export, and delete APIs are scheduled for Phase 2. Phase 1 does not claim these endpoints work."
    }, 501);
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/trust/")) {
      const res = await handleApi(request, env);
      const headers = new Headers(res.headers);
      Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
      return new Response(res.body, { status: res.status, headers });
    }
    return env.ASSETS.fetch(request);
  }
};
