import assert from "node:assert/strict";
import test from "node:test";

import { createRootRequestHandler } from "../../apps/root/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

test("root health route exposes constitutional shell wiring", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-root");
  assert.equal(payload.data.portal_url, "https://home.iai.one");
  assert.equal(payload.data.oauth[0].provider, "google");
  assert.equal(payload.data.oauth[0].redirectUri, "https://iai.one/auth/google/callback");
  assert.equal(payload.data.oauth[0].configured, false);
  assert.equal(payload.data.oauth[1].provider, "apple");
  assert.equal(payload.data.oauth[1].redirectUri, "https://iai.one/auth/apple/callback");
  assert.equal(payload.data.oauth[1].configured, false);
  assert.equal(payload.data.web_surface_enabled, false);
  assert.equal(payload.data.web_url, null);
});

test("root landing page stays constitutional and locale-aware", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Lớp trust hiến pháp/);
  assert.match(html, /Mỗi bề mặt chỉ làm đúng vai trò của mình/);
  assert.match(html, /https:\/\/home\.iai\.one/);
  assert.doesNotMatch(html, /https:\/\/web\.iai\.one/);
  assert.match(html, /https:\/\/docs\.iai\.one\/legal\/iai-flow\//);
  assert.match(html, /Angel Edu Tam Foundation Inc/);
  assert.match(html, /<link rel="canonical" href="https:\/\/iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("root supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Constitutional trust layer/);
  assert.match(html, /Each surface performs only its proper role/);
  assert.match(html, /Legal entity: Angel Edu Tam Foundation Inc/);
});

test("root exposes public legal and support pages for auth provider review", async () => {
  const routes = [
    ["/privacy", /Quyền riêng tư IAI/, /Google ID, Apple ID và magic link/],
    ["/terms", /Điều khoản IAI/, /Hành vi bị cấm/],
    ["/support", /Hỗ trợ IAI/, /support@iai\.one/],
    ["/contact", /Liên hệ IAI/, /contact@iai\.one/]
  ];

  for (const [url, titlePattern, bodyPattern] of routes) {
    const response = await dispatchToHandler(createRootRequestHandler(), { url });
    const html = await response.text();

    assert.equal(response.status, 200, url);
    assert.equal(response.headers.get("content-language"), "vi", url);
    assert.match(html, titlePattern, url);
    assert.match(html, bodyPattern, url);
    assert.match(html, /https:\/\/docs\.iai\.one\/legal\/iai-flow\//, url);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://iai\\.one${url}`), url);
  }
});

test("root legal and support pages support english locale", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/privacy?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /IAI Privacy/);
  assert.match(html, /Google ID, Apple ID, and magic links/);
  assert.match(html, /https:\/\/iai\.one\/privacy\?lang=en/);
});

test("root login page lists Google and Apple redirect URIs", async () => {
  const response = await dispatchToHandler(
    createRootRequestHandler({
      appleClientId: "one.iai.web",
      googleClientId: "google-client-id.apps.googleusercontent.com"
    }),
    {
      url: "/login"
    }
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Đăng nhập vào IAI/);
  assert.match(html, /Continue with Google ID/);
  assert.match(html, /Continue with Apple ID/);
  assert.match(html, /https:\/\/iai\.one\/auth\/google\/callback/);
  assert.match(html, /https:\/\/iai\.one\/auth\/apple\/callback/);
});

test("root Google OAuth start redirects with state cookie and exact callback", async () => {
  const response = await dispatchToHandler(
    createRootRequestHandler({
      authCookieDomain: null,
      googleClientId: "google-client-id.apps.googleusercontent.com"
    }),
    {
      url: "/auth/google/start"
    }
  );
  const location = response.headers.get("location");
  const cookie = response.headers.get("set-cookie");

  assert.equal(response.status, 302);
  assert.ok(location);
  assert.ok(cookie);
  const redirect = new URL(location);
  assert.equal(redirect.origin + redirect.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(redirect.searchParams.get("client_id"), "google-client-id.apps.googleusercontent.com");
  assert.equal(redirect.searchParams.get("redirect_uri"), "https://iai.one/auth/google/callback");
  assert.equal(redirect.searchParams.get("response_type"), "code");
  assert.equal(redirect.searchParams.get("scope"), "openid email profile");
  assert.match(cookie, /iai_oauth_state_google=/);
});

test("root Apple OAuth start redirects with state cookie and exact callback", async () => {
  const response = await dispatchToHandler(
    createRootRequestHandler({
      appleClientId: "one.iai.web",
      authCookieDomain: null
    }),
    {
      url: "/auth/apple/start"
    }
  );
  const location = response.headers.get("location");
  const cookie = response.headers.get("set-cookie");

  assert.equal(response.status, 302);
  assert.ok(location);
  assert.ok(cookie);
  const redirect = new URL(location);
  assert.equal(redirect.origin + redirect.pathname, "https://appleid.apple.com/auth/authorize");
  assert.equal(redirect.searchParams.get("client_id"), "one.iai.web");
  assert.equal(redirect.searchParams.get("redirect_uri"), "https://iai.one/auth/apple/callback");
  assert.equal(redirect.searchParams.get("response_mode"), "form_post");
  assert.equal(redirect.searchParams.get("scope"), "name email");
  assert.match(cookie, /iai_oauth_state_apple=/);
});

test("root OAuth callback validates state before accepting code", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    headers: {
      cookie: "iai_oauth_state_google=state123"
    },
    url: "/auth/google/callback?code=code123&state=state123"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Callback đã sẵn sàng/);
  assert.match(html, /Authorization code accepted/);
});

test("root can explicitly re-enable the web surface when deploy truth is ready", async () => {
  const response = await dispatchToHandler(
    createRootRequestHandler({
      webSurfaceEnabled: true
    }),
    {
      url: "/"
    }
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /https:\/\/web\.iai\.one/);
});

test("root keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createRootRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên root/);
});
