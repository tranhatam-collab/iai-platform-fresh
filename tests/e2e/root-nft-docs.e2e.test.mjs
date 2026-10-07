/**
 * root (shared sign-in), nft, developer and docs as real processes.
 *
 * - root: provider listing, OAuth start redirects (client id, redirect_uri, state,
 *   cookie attributes), callback state handling, /og.svg escaping.
 * - nft: wallet-proof / step-up challenge endpoints, access checks, proxy download flow,
 *   partner sync header checks. Proof values here are always garbage on purpose.
 * - developer + docs: pages, sitemap and internal link integrity (crawl depth 2).
 *
 * No OAuth provider is contacted; client ids are throwaway test values.
 * Needs `pnpm build`. Run: node --test tests/e2e/root-nft-docs.e2e.test.mjs
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import { builtEntryAvailable, request, startService } from "./support/harness.mjs";
import { crawlSurface } from "./support/crawl.mjs";

const STACK_TRACE = /(\/home\/|\/Users\/|node_modules|at [\w.<>]+ \(.*:\d+:\d+\)|ENOENT)/;
const GOOGLE_CLIENT = "e2e-google-client-id";
const APPLE_CLIENT = "e2e-apple-client-id";

function start(name, entry, portEnv, hostEnv, env = {}) {
  return startService({ name, entry, portEnv, hostEnv, env });
}

const skipUnless = (...entries) => {
  const missing = entries.filter((entry) => !builtEntryAvailable(entry));
  return missing.length > 0 ? `${missing.join(", ")} not built` : false;
};

function stateCookie(response, name) {
  const cookie = response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
  return cookie ?? null;
}

describe("root: sign-in providers", { skip: skipUnless("apps/root/dist/index.js") }, () => {
  let unconfigured;
  let configured;

  before(async () => {
    unconfigured = await start("root-unconfigured", "apps/root/dist/index.js", "ROOT_PORT", "ROOT_HOST");
    configured = await start("root-configured", "apps/root/dist/index.js", "ROOT_PORT", "ROOT_HOST", {
      ROOT_GOOGLE_CLIENT_ID: GOOGLE_CLIENT,
      ROOT_APPLE_CLIENT_ID: APPLE_CLIENT
    });
  });
  after(async () => {
    await Promise.all([unconfigured?.stop(), configured?.stop()]);
  });

  test("/login lists Google and Apple, and only links providers that are configured", async () => {
    const off = await request(unconfigured.baseUrl, "/login?lang=en");
    assert.equal(off.status, 200);
    assert.match(off.text, /Google ID/);
    assert.match(off.text, /Apple ID/);
    assert.match(off.text, /needs key/);
    assert.doesNotMatch(off.text, /href="\/auth\/(google|apple)\/start"/);

    const on = await request(configured.baseUrl, "/login?lang=en");
    assert.equal(on.status, 200);
    assert.match(on.text, /href="\/auth\/google\/start"/);
    assert.match(on.text, /href="\/auth\/apple\/start"/);
    assert.doesNotMatch(on.text, /needs key/);
    // The registered redirect URIs are shown so operators can copy them.
    assert.match(on.text, /https:\/\/iai\.one\/auth\/google\/callback/);
    assert.match(on.text, /https:\/\/iai\.one\/auth\/apple\/callback/);
  });

  test("/health reports provider status without exposing client ids", async () => {
    const response = await request(configured.baseUrl, "/health");
    assert.equal(response.status, 200);
    const providers = Object.fromEntries(response.json.data.oauth.map((entry) => [entry.provider, entry]));
    assert.equal(providers.google.configured, true);
    assert.equal(providers.apple.configured, true);
    assert.equal(providers.google.startPath, "/auth/google/start");
    assert.doesNotMatch(response.text, new RegExp(GOOGLE_CLIENT));
    assert.doesNotMatch(response.text, new RegExp(APPLE_CLIENT));

    const off = await request(unconfigured.baseUrl, "/health");
    assert.deepEqual(off.json.data.oauth.map((entry) => entry.configured), [false, false]);
  });

  test("start answers 503 when the provider has no client id", async () => {
    for (const provider of ["google", "apple"]) {
      const response = await request(unconfigured.baseUrl, `/auth/${provider}/start`);
      assert.equal(response.status, 503);
      assert.equal(response.json.error.code, "OAUTH_PROVIDER_NOT_CONFIGURED");
      assert.equal(response.headers.get("location"), null);
      assert.equal(response.headers.getSetCookie().length, 0);
    }
  });

  test("Google start redirects to the authorize URL with client id, redirect_uri, scope and state", async () => {
    const response = await request(configured.baseUrl, "/auth/google/start");
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, "https://accounts.google.com");
    assert.equal(location.pathname, "/o/oauth2/v2/auth");
    assert.equal(location.searchParams.get("client_id"), GOOGLE_CLIENT);
    assert.equal(location.searchParams.get("redirect_uri"), "https://iai.one/auth/google/callback");
    assert.equal(location.searchParams.get("response_type"), "code");
    assert.equal(location.searchParams.get("scope"), "openid email profile");
    assert.ok(location.searchParams.get("nonce"), "OIDC nonce missing");
    const state = location.searchParams.get("state");
    assert.match(state, /^[A-Za-z0-9_-]{32,}$/, "state must be an unguessable base64url token");

    const cookie = stateCookie(response, "iai_oauth_state_google");
    assert.ok(cookie, "state cookie missing");
    assert.ok(cookie.startsWith(`iai_oauth_state_google=${state};`), "cookie value must equal the state parameter");
    assert.match(cookie, /;\s*HttpOnly/);
    assert.match(cookie, /;\s*Secure/);
    assert.match(cookie, /;\s*SameSite=(Lax|Strict|None)/);
    assert.match(cookie, /;\s*Path=\/auth/);
    assert.match(cookie, /;\s*Max-Age=600/);
  });

  test("Apple start redirects with form_post response mode and its own state cookie", async () => {
    const response = await request(configured.baseUrl, "/auth/apple/start");
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, "https://appleid.apple.com");
    assert.equal(location.pathname, "/auth/authorize");
    assert.equal(location.searchParams.get("client_id"), APPLE_CLIENT);
    assert.equal(location.searchParams.get("redirect_uri"), "https://iai.one/auth/apple/callback");
    assert.equal(location.searchParams.get("response_mode"), "form_post");
    const state = location.searchParams.get("state");
    const cookie = stateCookie(response, "iai_oauth_state_apple");
    assert.ok(cookie?.startsWith(`iai_oauth_state_apple=${state};`));
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=/);
  });

  test("every start issues a fresh state", async () => {
    const states = new Set();
    for (let index = 0; index < 5; index += 1) {
      const response = await request(configured.baseUrl, "/auth/google/start");
      states.add(new URL(response.headers.get("location")).searchParams.get("state"));
    }
    assert.equal(states.size, 5);
  });

  test("the Apple state cookie is sent on the provider's cross-site form_post callback", { todo: "the cookie is SameSite=Lax, which browsers withhold on a cross-site POST, so the state check cannot succeed for the form_post flow" }, async () => {
    const response = await request(configured.baseUrl, "/auth/apple/start");
    assert.match(stateCookie(response, "iai_oauth_state_apple"), /SameSite=None/);
  });

  test("the redirect_uri and cookie domain follow ROOT_AUTH_BASE_URL and ROOT_AUTH_COOKIE_DOMAIN", async () => {
    const custom = await start("root-custom-auth", "apps/root/dist/index.js", "ROOT_PORT", "ROOT_HOST", {
      ROOT_GOOGLE_CLIENT_ID: GOOGLE_CLIENT,
      ROOT_AUTH_BASE_URL: "https://auth.e2e.example/",
      ROOT_AUTH_COOKIE_DOMAIN: ""
    });
    try {
      const response = await request(custom.baseUrl, "/auth/google/start");
      const location = new URL(response.headers.get("location"));
      assert.equal(location.searchParams.get("redirect_uri"), "https://auth.e2e.example/auth/google/callback");
      assert.doesNotMatch(stateCookie(response, "iai_oauth_state_google"), /Domain=/i);
    } finally {
      await custom.stop();
    }

    const defaults = await request(configured.baseUrl, "/auth/google/start");
    assert.match(stateCookie(defaults, "iai_oauth_state_google"), /Domain=\.iai\.one/);
  });

  test("start routes only answer GET", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const response = await request(configured.baseUrl, "/auth/google/start", { method, body: method === "DELETE" ? undefined : "x=1" });
      assert.equal(response.status, 405, method);
      assert.equal(response.headers.getSetCookie().length, 0);
    }
  });

  describe("callback", () => {
    const callbackWith = async (provider, { cookie, query = "", method = "GET", body }) =>
      request(configured.baseUrl, `/auth/${provider}/callback${query}`, {
        method,
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {})
        },
        body
      });

    async function begin(provider) {
      const response = await request(configured.baseUrl, `/auth/${provider}/start`);
      const state = new URL(response.headers.get("location")).searchParams.get("state");
      return { state, cookie: `iai_oauth_state_${provider}=${state}` };
    }

    test("a matching state and a code are accepted and the state cookie is cleared", async () => {
      const { state, cookie } = await begin("google");
      const response = await callbackWith("google", { cookie, query: `?state=${state}&code=e2e-code` });
      assert.equal(response.status, 200);
      assert.match(response.text, /Authorization code accepted/);
      const cleared = stateCookie(response, "iai_oauth_state_google");
      assert.match(cleared, /Max-Age=0/);
      assert.match(cleared, /HttpOnly/);
      assert.match(cleared, /Secure/);
    });

    test("Apple's form_post callback validates state from the POST body", async () => {
      const { state, cookie } = await begin("apple");
      const ok = await callbackWith("apple", { cookie, method: "POST", body: `state=${state}&code=e2e-code` });
      assert.equal(ok.status, 200);
      const bad = await callbackWith("apple", { cookie, method: "POST", body: "state=other&code=e2e-code" });
      assert.equal(bad.status, 400);
      assert.match(bad.text, /OAuth state did not match/);
    });

    test("a missing, empty or mismatched state is rejected with 400 and clears the cookie", async () => {
      const { state, cookie } = await begin("google");
      const cases = [
        { cookie, query: "?code=e2e-code" },
        { cookie, query: "?state=&code=e2e-code" },
        { cookie, query: `?state=${state}x&code=e2e-code` },
        { cookie, query: `?state=${state.toUpperCase() === state ? state.toLowerCase() : state.toUpperCase()}&code=e2e-code` },
        { cookie: undefined, query: `?state=${state}&code=e2e-code` },
        { cookie: "iai_oauth_state_google=", query: "?state=&code=e2e-code" },
        { cookie: "iai_oauth_state_apple=" + state, query: `?state=${state}&code=e2e-code` }
      ];
      for (const attempt of cases) {
        const response = await callbackWith("google", attempt);
        assert.equal(response.status, 400, JSON.stringify(attempt));
        assert.match(response.text, /OAuth state did not match/);
        assert.match(stateCookie(response, "iai_oauth_state_google"), /Max-Age=0/);
      }
    });

    test("a state cookie issued for one provider does not satisfy the other", async () => {
      const google = await begin("google");
      const response = await callbackWith("apple", {
        cookie: google.cookie,
        method: "POST",
        body: `state=${google.state}&code=e2e-code`
      });
      assert.equal(response.status, 400);
    });

    test("a matching state without a code is rejected", async () => {
      const { state, cookie } = await begin("google");
      const response = await callbackWith("google", { cookie, query: `?state=${state}` });
      assert.equal(response.status, 400);
      assert.match(response.text, /OAuth code was missing/);
    });

    test("a state is only good for one callback", async () => {
      const { state, cookie } = await begin("google");
      const first = await callbackWith("google", { cookie, query: `?state=${state}&code=e2e-code` });
      assert.equal(first.status, 200);
      // A browser that applied the Set-Cookie no longer has the state cookie.
      const replay = await callbackWith("google", { query: `?state=${state}&code=e2e-code` });
      assert.equal(replay.status, 400);
    });

    test("provider errors and hostile values are escaped, never rendered as markup", async () => {
      const error = await callbackWith("google", { query: "?error=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&state=a" });
      assert.equal(error.status, 400);
      assert.doesNotMatch(error.text, /<img src=x/);
      assert.match(error.text, /&lt;img/);

      const { cookie } = await begin("google");
      const state = await callbackWith("google", { cookie, query: "?state=%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E&code=%3Cb%3E" });
      assert.doesNotMatch(state.text, /<script>alert/);
      assert.doesNotMatch(state.text, /<b>/);
    });

    test("unsupported verbs on the callback are 405", async () => {
      const response = await request(configured.baseUrl, "/auth/google/callback", { method: "PUT" });
      assert.equal(response.status, 405);
    });

    test("a malformed cookie header is a client error, not a server error", async () => {
      const response = await callbackWith("google", { cookie: "iai_oauth_state_google=%E0%A4%A", query: "?state=a&code=b" });
      assert.ok(response.status < 500, `status ${response.status}`);
    });
  });

  describe("/og.svg", () => {
    test("serves an SVG image with caching headers and the requested locale", async () => {
      const en = await request(configured.baseUrl, "/og.svg?title=Hello&surface=docs&description=Plain%20text&lang=en");
      assert.equal(en.status, 200);
      assert.match(en.headers.get("content-type"), /^image\/svg\+xml/);
      assert.match(en.headers.get("cache-control"), /max-age=\d+/);
      assert.match(en.text, /^<\?xml version="1.0"/);
      assert.match(en.text, /<svg\b/);
      assert.match(en.text, />Hello</);
      assert.match(en.text, />DOCS</);
      assert.match(en.text, />English</);

      const vi = await request(configured.baseUrl, "/og.svg?lang=vi");
      assert.match(vi.text, />Tieng Viet</);
      assert.match(vi.text, />IAI\.ONE</);
    });

    test("hostile title, surface and description are escaped and cannot add elements", async () => {
      const hostile = '</text><script>window.__og=1</script><image href="https://example.org/x" onload="1"/>"\'&';
      const response = await request(
        configured.baseUrl,
        `/og.svg?${new URLSearchParams({ title: hostile, surface: hostile, description: hostile }).toString()}`
      );
      assert.equal(response.status, 200);
      assert.doesNotMatch(response.text, /<script/i);
      assert.doesNotMatch(response.text, /<image\b/i);
      const tags = new Set([...response.text.matchAll(/<([a-zA-Z][\w:-]*)/g)].map((match) => match[1]));
      for (const tag of tags) {
        assert.ok(["svg", "rect", "circle", "text", "foreignObject", "div", "line"].includes(tag), `unexpected element <${tag}> in SVG`);
      }
      assert.match(response.text, /&lt;script&gt;/);
      assert.match(response.text, /aria-label="[^"<]*"/);
      assert.doesNotMatch(response.text, /aria-label="[^"]*"[^>]*"\s*[a-z]+=/, "attribute value must not break out of its quotes");
    });
  });

  describe("static pages", () => {
    test("legal and support pages are served in both languages", async () => {
      for (const pathname of ["/privacy", "/terms", "/support", "/contact"]) {
        const en = await request(configured.baseUrl, `${pathname}?lang=en`);
        assert.equal(en.status, 200, pathname);
        assert.match(en.text, /<html lang="en"/);
        const vi = await request(configured.baseUrl, `${pathname}?lang=vi`);
        assert.match(vi.text, /<html lang="vi"/);
      }
    });

    test("hostile paths are not reflected as markup on the 404 page", async () => {
      const response = await request(configured.baseUrl, "/%3Cscript%3Ewindow.__x%3D1%3C%2Fscript%3E");
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.text, /<script>window\.__x/);
    });

    test("non-GET requests to pages are 405 JSON", async () => {
      const response = await request(configured.baseUrl, "/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      assert.equal(response.status, 405);
      assert.equal(response.json.error.code, "METHOD_NOT_ALLOWED");
    });
  });
});

describe("nft: challenge, access and download endpoints", { skip: skipUnless("apps/nft/dist/index.js") }, () => {
  let nft;
  const DEMO_ASSET = "ASSET-20260324-DEMO01";

  before(async () => {
    nft = await start("nft", "apps/nft/dist/index.js", "NFT_PORT", "NFT_HOST");
  });
  after(async () => {
    await nft?.stop();
  });

  const post = (pathname, body = {}, headers = {}) =>
    request(nft.baseUrl, pathname, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body)
    });

  test("wallet-proof challenge: requires a wallet id and issues a unique nonce each time", async () => {
    const missing = await post("/v1/nft/wallet-proof/challenge", {});
    assert.equal(missing.status, 400);
    assert.equal(missing.json.error.code, "WALLET_ID_REQUIRED");
    for (const body of ["[]", "null", '"text"', '{"wallet_id":"   "}', '{"wallet_id":42}']) {
      assert.equal((await post("/v1/nft/wallet-proof/challenge", body)).status, 400, body);
    }

    const nonces = new Set();
    for (let index = 0; index < 5; index += 1) {
      const response = await post("/v1/nft/wallet-proof/challenge", { wallet_id: "wallet_e2e", action: "download", asset_id_optional: DEMO_ASSET });
      assert.equal(response.status, 200, response.text);
      assert.equal(response.json.ok, true);
      assert.match(response.json.data.challenge_nonce, /^wallet_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      nonces.add(response.json.data.challenge_nonce);
    }
    assert.equal(nonces.size, 5, "challenge nonces must never repeat");
  });

  test("step-up challenge: issues a unique nonce and refuses GET", async () => {
    const first = await post("/v1/nft/security/step-up/challenge");
    const second = await post("/v1/nft/security/step-up/challenge");
    assert.equal(first.status, 200);
    assert.match(first.json.data.challenge_nonce, /^step_[0-9a-f-]{36}$/);
    assert.notEqual(first.json.data.challenge_nonce, second.json.data.challenge_nonce);
    const get = await request(nft.baseUrl, "/v1/nft/security/step-up/challenge");
    assert.equal(get.status, 405);
  });

  test("wallet-proof verify rejects garbage proofs, unknown nonces and malformed input", async () => {
    const challenge = await post("/v1/nft/wallet-proof/challenge", { wallet_id: "wallet_e2e" });
    const nonce = challenge.json.data.challenge_nonce;
    const attempts = [
      {},
      { challenge_nonce: nonce },
      { challenge_nonce: nonce, signature: "" },
      { challenge_nonce: nonce, signature: "0xdeadbeef" },
      { challenge_nonce: nonce, signature: "not a signature" },
      { challenge_nonce: nonce, signature: nonce },
      { challenge_nonce: nonce, signature: 12345 },
      { challenge_nonce: nonce, signature: ["a"] },
      { challenge_nonce: "wallet_00000000-0000-4000-8000-000000000000", signature: "0xdeadbeef" },
      { challenge_nonce: "x", signature: "y" }
    ];
    for (const body of attempts) {
      const response = await post("/v1/nft/wallet-proof/verify", body);
      assert.equal(response.status, 401, JSON.stringify(body));
      assert.equal(response.json.error.code, "WALLET_PROOF_INVALID");
      assert.equal(response.json.data, undefined);
    }
  });

  test("step-up verify rejects garbage authenticator responses and unknown nonces", async () => {
    const challenge = await post("/v1/nft/security/step-up/challenge");
    const nonce = challenge.json.data.challenge_nonce;
    for (const body of [
      {},
      { challenge_nonce: nonce },
      { challenge_nonce: nonce, authenticator_response: "" },
      { challenge_nonce: nonce, authenticator_response: "garbage" },
      { challenge_nonce: nonce, authenticator_response: { assertion: "garbage" } },
      { challenge_nonce: "step_unknown", authenticator_response: "garbage" }
    ]) {
      const response = await post("/v1/nft/security/step-up/verify", body);
      assert.equal(response.status, 401, JSON.stringify(body));
      assert.equal(response.json.error.code, "STEP_UP_INVALID");
    }
  });

  test("access checks never allow a protected asset without both proofs", async () => {
    const plain = await post("/v1/nft/assets/ASSET-PROTECTED-1/access-check", {});
    assert.equal(plain.status, 200);
    assert.equal(plain.json.data.decision, "need_step_up");
    assert.equal(plain.json.data.requires_step_up, true);

    for (const body of [
      { step_up_session_id_optional: "step_session_made_up" },
      { step_up_session_id_optional: "step_session_made_up", signature_proof_id_optional: "wallet_proof_made_up" },
      { signature_proof_id_optional: "wallet_proof_made_up" }
    ]) {
      const response = await post("/v1/nft/assets/ASSET-PROTECTED-1/access-check", body);
      assert.equal(response.status, 200);
      assert.notEqual(response.json.data.decision, "allow", JSON.stringify(body));
    }
  });

  test("proxy tokens are refused for protected assets", async () => {
    const response = await post("/v1/nft/assets/ASSET-PROTECTED-1/proxy-token", { action: "download", step_up_session_id_optional: "step_session_made_up" });
    assert.equal(response.status, 403);
    assert.equal(response.json.error.code, "ACCESS_NOT_ALLOWED");
    assert.equal(response.json.data, undefined);
  });

  test("proxy download: a token works for its own asset only, and downloads need a token", async () => {
    const issued = await post(`/v1/nft/assets/${DEMO_ASSET}/proxy-token`, { action: "download" });
    assert.equal(issued.status, 200, issued.text);
    const token = issued.json.data.proxy_token_id;
    assert.match(token, /^proxy_[0-9a-f-]{36}$/);

    const ok = await request(nft.baseUrl, `/v1/nft/assets/${DEMO_ASSET}/download?proxy_token_id=${token}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.download_status, "completed");

    for (const pathname of [
      `/v1/nft/assets/OTHER-ASSET/download?proxy_token_id=${token}`,
      `/v1/nft/assets/${DEMO_ASSET}/download`,
      `/v1/nft/assets/${DEMO_ASSET}/download?proxy_token_id=proxy_made_up`,
      `/v1/nft/assets/${DEMO_ASSET}/download?proxy_token_id=`
    ]) {
      const response = await request(nft.baseUrl, pathname);
      assert.equal(response.status, 403, pathname);
      assert.equal(response.json.error.code, "PROXY_TOKEN_INVALID");
    }
  });

  test("raw metadata URLs are blocked and point to the gated flow", async () => {
    const response = await request(nft.baseUrl, "/api/metadata/iai-genesis-pass/1.json");
    assert.equal(response.status, 403);
    assert.equal(response.json.error.code, "RAW_URL_BLOCKED");
  });

  test("partner sync requires signature headers and a fresh timestamp", async () => {
    const missing = await post("/v1/nft/partner-sync/events", {});
    assert.equal(missing.status, 400);
    assert.equal(missing.json.error.code, "PARTNER_SYNC_SIGNATURE_REQUIRED");

    const stale = await post("/v1/nft/partner-sync/events", {}, {
      "x-idempotency-key": "k-e2e",
      "x-partner-signature": "sha256:00",
      "x-source-timestamp": "2020-01-01T00:00:00Z"
    });
    assert.equal(stale.status, 400);
    assert.equal(stale.json.error.code, "PARTNER_SYNC_STALE");

    const notADate = await post("/v1/nft/partner-sync/events", {}, {
      "x-idempotency-key": "k-e2e",
      "x-partner-signature": "sha256:00",
      "x-source-timestamp": "yesterday-ish"
    });
    assert.equal(notADate.json.error.code, "PARTNER_SYNC_STALE");

    const wrong = await post("/v1/nft/partner-sync/events", {}, {
      "x-idempotency-key": "k-e2e",
      "x-partner-signature": "sha256:00",
      "x-source-timestamp": new Date().toISOString()
    });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.json.error.code, "PARTNER_SYNC_SIGNATURE_INVALID");
  });

  test("unknown API routes are JSON 404s and the landing page escapes hostile paths", async () => {
    const unknown = await post("/v1/nft/does-not-exist");
    assert.equal(unknown.status, 404);
    assert.equal(unknown.json.error.code, "NFT_API_NOT_FOUND");

    const page = await request(nft.baseUrl, "/%3Cscript%3Ewindow.__x%3D1%3C%2Fscript%3E");
    assert.equal(page.status, 404);
    assert.doesNotMatch(page.text, /<script>window\.__x/);
  });

  test("malformed JSON bodies are a 400, not a server error", { todo: "JSON.parse throws and the handler answers 500 NFT_SERVER_ERROR with the parser message (apps/nft/src/server.ts readJsonBody)" }, async () => {
    for (const path of ["/v1/nft/wallet-proof/challenge", "/v1/nft/wallet-proof/verify", "/v1/nft/security/step-up/verify"]) {
      const response = await post(path, "{not json");
      assert.equal(response.status, 400, `${path} -> ${response.status}`);
      assert.doesNotMatch(response.text, /Unexpected token|position \d+/);
    }
  });

  test("the service keeps serving after malformed input", async () => {
    await post("/v1/nft/wallet-proof/verify", "{not json");
    const health = await request(nft.baseUrl, "/health");
    assert.equal(health.status, 200);
  });
});

describe("developer: pages, sitemap and links", { skip: skipUnless("apps/developer/dist/index.js") }, () => {
  let developer;
  const routes = ["/", "/quickstart", "/auth", "/api/reference", "/webhooks", "/sdk", "/nodes", "/changelog", "/privacy", "/terms", "/support", "/contact"];

  before(async () => {
    developer = await start("developer", "apps/developer/dist/index.js", "DEVELOPER_PORT", "DEVELOPER_HOST");
  });
  after(async () => {
    await developer?.stop();
  });

  test("every documented route renders a complete HTML page in both languages", async () => {
    for (const pathname of routes) {
      for (const lang of ["en", "vi"]) {
        const response = await request(developer.baseUrl, `${pathname}?lang=${lang}`);
        assert.equal(response.status, 200, `${pathname} ${lang}`);
        assert.match(response.headers.get("content-type"), /text\/html/);
        assert.match(response.text, new RegExp(`<html lang="${lang}"`));
        assert.match(response.text, /<title>[^<]{3,}<\/title>/);
        assert.match(response.text, /<h1[\s>]/);
        const canonical = /<link rel="canonical" href="([^"]+)"/.exec(response.text)?.[1];
        assert.ok(canonical, `${pathname} has no canonical`);
        assert.equal(new URL(canonical).host, "developer.iai.one");
      }
    }
  });

  test("the sitemap lists exactly the served routes and every entry resolves", async () => {
    const sitemap = await request(developer.baseUrl, "/sitemap.xml");
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get("content-type"), /xml/);
    const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
    assert.ok(locs.length >= routes.length);
    assert.deepEqual(
      [...new Set(locs.map((loc) => loc.pathname))].sort(),
      [...routes].sort()
    );
    for (const loc of locs) {
      assert.equal(loc.host, "developer.iai.one");
      const response = await request(developer.baseUrl, loc.pathname);
      assert.equal(response.status, 200, loc.href);
    }
    // hreflang alternates stay inside the same host.
    const alternates = [...sitemap.text.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)].map((match) => new URL(match[1]).host);
    assert.deepEqual([...new Set(alternates)], ["developer.iai.one"]);
  });

  test("crawling from / to depth 2 finds no broken internal links, dangling anchors or 5xx", async () => {
    const result = await crawlSurface(developer.baseUrl, "developer.iai.one", { start: ["/", "/privacy"], maxDepth: 2 });
    assert.deepEqual(result.problems, []);
    assert.ok(result.pages.size >= routes.length - 4, `crawler only reached ${result.pages.size} pages`);
    for (const [path, page] of result.pages) {
      assert.ok(page.status < 400, `${path} -> ${page.status}`);
    }
  });

  test("unknown routes are a clean 404 and the policy pages link to each other", async () => {
    const unknown = await request(developer.baseUrl, "/quickstart/missing");
    assert.equal(unknown.status, 404);
    assert.doesNotMatch(unknown.text, STACK_TRACE);
    const privacy = await request(developer.baseUrl, "/privacy?lang=en");
    for (const href of ["/terms", "/support", "/contact"]) {
      assert.ok(privacy.text.includes(`href="${href}`), `privacy page does not link to ${href}`);
    }
  });

  test("every sitemap route is reachable by following links from the home page", { todo: "/privacy, /terms, /support and /contact are in the sitemap but nothing on / or the product pages links to them" }, async () => {
    const result = await crawlSurface(developer.baseUrl, "developer.iai.one", { start: ["/"], maxDepth: 2 });
    const reached = new Set([...result.pages.keys()].map((path) => path.split("?")[0]));
    const unreachable = routes.filter((route) => !reached.has(route));
    assert.deepEqual(unreachable, []);
  });
});

describe("docs: pages and links", { skip: skipUnless("apps/docs/dist/index.js") }, () => {
  let docs;

  before(async () => {
    docs = await start("docs", "apps/docs/dist/index.js", "DOCS_PORT", "DOCS_HOST");
  });
  after(async () => {
    await docs?.stop();
  });

  test("the home page renders in both languages and is canonical on docs.iai.one", async () => {
    for (const lang of ["en", "vi"]) {
      const response = await request(docs.baseUrl, `/?lang=${lang}`);
      assert.equal(response.status, 200);
      assert.match(response.text, new RegExp(`<html lang="${lang}"`));
      const canonical = /<link rel="canonical" href="([^"]+)"/.exec(response.text)?.[1];
      assert.equal(new URL(canonical).host, "docs.iai.one");
    }
  });

  test("unknown paths are a clean 404", async () => {
    const response = await request(docs.baseUrl, "/no-such-page");
    assert.equal(response.status, 404);
    assert.doesNotMatch(response.text, STACK_TRACE);
  });

  test("crawling from / to depth 2: no 5xx and no dangling in-page anchors", async () => {
    const result = await crawlSurface(docs.baseUrl, "docs.iai.one", { start: ["/"], maxDepth: 2 });
    const fatal = result.problems.filter((problem) => / -> 5\d\d|dangling|unparsable/.test(problem));
    assert.deepEqual(fatal, []);
  });

  test("every internal link on the home page resolves", { todo: "the footer links to https://docs.iai.one/legal/iai-flow/ (apps/docs/src/render.ts) but the docs app only serves / and /health" }, async () => {
    const result = await crawlSurface(docs.baseUrl, "docs.iai.one", { start: ["/"], maxDepth: 2 });
    assert.deepEqual(result.problems, []);
  });
});
