import assert from "node:assert/strict";
import test from "node:test";

import { createDeveloperRequestHandler } from "../../apps/developer/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

const requiredRoutes = [
  {
    marker: /Bắt đầu bằng walkthrough ngắn dựa trên bằng chứng/,
    path: "/quickstart"
  },
  {
    marker: /Route auth xác định tích hợp identity theo shared truth/,
    path: "/auth"
  },
  {
    marker: /Route tham chiếu API khóa endpoint shape/,
    path: "/api/reference"
  },
  {
    marker: /Route webhook khóa event truth/,
    path: "/webhooks"
  },
  {
    marker: /Route SDK giữ ví dụ và hướng dẫn implementation/,
    path: "/sdk"
  },
  {
    marker: /Route nodes xác định các khối tích hợp có thể thực thi/,
    path: "/nodes"
  },
  {
    marker: /Route changelog theo dõi contract deltas/,
    path: "/changelog"
  }
];

test("developer health route exposes builder shell wiring", async () => {
  const response = await dispatchToHandler(createDeveloperRequestHandler(), {
    url: "/health"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.equal(payload.ok, true);
  assert.equal(payload.data.service, "iai-developer");
  assert.equal(payload.data.flow_api_url, "https://api.flow.iai.one");
});

test("developer landing page keeps quickstart and canonical metadata", async () => {
  const response = await dispatchToHandler(createDeveloperRequestHandler(), {
    url: "/"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /developer\.iai\.one là lớp xây dựng cho API, auth, webhook và thực thi tích hợp\./);
  assert.match(html, /Bắt đầu từ bằng chứng, không từ giả định\./);
  assert.match(html, /https:\/\/developer\.iai\.one\//);
  assert.match(html, /href="\/quickstart"/);
  assert.match(html, /href="\/auth"/);
  assert.match(html, /href="\/api\/reference"/);
  assert.match(html, /href="\/webhooks"/);
  assert.match(html, /href="\/sdk"/);
  assert.match(html, /href="\/nodes"/);
  assert.match(html, /href="\/changelog"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/developer\.iai\.one\/" \/>/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:title"/);
  assert.match(html, /name="twitter:image"/);
  assert.match(html, /application\/ld\+json/);
});

test("developer required routes are reachable and canonicalized", async () => {
  for (const route of requiredRoutes) {
    const response = await dispatchToHandler(createDeveloperRequestHandler(), {
      url: route.path
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-language"), "vi");
    assert.match(html, /<html lang="vi">/);
    assert.match(
      html,
      new RegExp(
        `<link rel="canonical" href="https://developer\\.iai\\.one${escapeRegex(route.path)}" \\/>`
      )
    );
    assert.match(html, route.marker);
  }
});

test("developer route supports explicit english rendering", async () => {
  const response = await dispatchToHandler(createDeveloperRequestHandler(), {
    url: "/auth?lang=en"
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-language"), "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Auth/);
  assert.match(html, /Auth route defines shared identity integration/);
  assert.match(html, /<link rel="canonical" href="https:\/\/developer\.iai\.one\/auth\?lang=en" \/>/);
});

test("developer exposes a valid XML sitemap for public docs routes", async () => {
  const response = await dispatchToHandler(createDeveloperRequestHandler(), {
    url: "/sitemap.xml"
  });
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/xml/);
  assert.match(xml, /<urlset/);
  assert.match(xml, /https:\/\/developer\.iai\.one\/quickstart/);
  assert.match(xml, /https:\/\/developer\.iai\.one\/api\/reference/);
  assert.doesNotMatch(xml, /<!doctype html>/i);
});

test("developer keeps missing routes explicit", async () => {
  const response = await dispatchToHandler(createDeveloperRequestHandler(), {
    url: "/missing"
  });
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "vi");
  assert.match(html, /Route này không tồn tại trên developer\./);
});

function escapeRegex(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
