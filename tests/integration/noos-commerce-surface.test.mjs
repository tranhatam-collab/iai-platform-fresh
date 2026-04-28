import test from "node:test";
import assert from "node:assert/strict";

import { renderRoute } from "../../apps/noos-web/dist/index.js";

const priorityProductSlugs = [
  "noos-manifesto-foundation-pack",
  "noos-white-paper-official-extended-edition",
  "noos-architecture-system-map-pack",
  "the-8-layers-of-future-civilization-technology",
  "governance-trust-human-sovereignty-pack",
  "vietnam-sovereign-resilience-profile-pack",
  "future-civilization-technology-master-pack"
];

const expansionProductSlugs = [
  "post-quantum-auditability-security-direction-pack",
  "planetary-care-grid-field-intelligence-pack",
  "orbit-ntn-space-utility-pack",
  "programmable-biology-regenerative-systems-pack"
];

test("public routes redirect to locale-prefixed canonicals", async () => {
  const productsResponse = await renderRoute("/products", new URLSearchParams());
  const rootResponse = await renderRoute("/", new URLSearchParams("buyer=buyer_alpha001"));
  const localeRootResponse = await renderRoute("/vi", new URLSearchParams());

  assert.equal(productsResponse.status, 308);
  assert.equal(productsResponse.headers.location, "/en/products");

  assert.equal(rootResponse.status, 308);
  assert.equal(rootResponse.headers.location, "/en/products?buyer=buyer_alpha001");

  assert.equal(localeRootResponse.status, 308);
  assert.equal(localeRootResponse.headers.location, "/vi/products");
});

test("english catalog renders the locked product list with language controls and hreflang", async () => {
  const response = await renderRoute("/en/products", new URLSearchParams());

  assert.equal(response.status, 200);
  assert.match(response.body, /NOOS Products/);
  assert.match(response.body, /NOOS Manifesto and Foundation Pack/);
  assert.match(response.body, /NOOS Builder Bundle for Teams/);
  assert.match(response.body, /Tiếng Việt/);
  assert.match(response.body, /href="\/vi\/products"/);
  assert.match(response.body, /hreflang="vi"/);
});

test("vietnamese product detail renders the full localized template", async () => {
  const response = await renderRoute(
    "/vi/product/vietnam-sovereign-resilience-profile-pack",
    new URLSearchParams("buyer=buyer_alpha001")
  );

  assert.equal(response.status, 200);
  assert.match(response.body, /Gói Hồ sơ Chủ quyền và Chống chịu Việt Nam/);
  assert.match(response.body, /Định vị sản phẩm/);
  assert.match(response.body, /Dành cho ai/);
  assert.match(response.body, /Giải quyết vấn đề gì/);
  assert.match(response.body, /Sản phẩm liên quan/);
  assert.match(response.body, /Lấy Gói Hồ sơ Việt Nam/);
});

test("priority product pages render the locked template in english and vietnamese", async () => {
  for (const slug of priorityProductSlugs) {
    const englishResponse = await renderRoute(
      `/en/product/${slug}`,
      new URLSearchParams("buyer=buyer_alpha001")
    );
    assert.equal(englishResponse.status, 200, `english route for ${slug}`);
    assert.match(englishResponse.body, /Product Positioning/);
    assert.match(englishResponse.body, /What Problems It Solves/);
    assert.match(englishResponse.body, /Final CTA/);

    const vietnameseResponse = await renderRoute(
      `/vi/product/${slug}`,
      new URLSearchParams("buyer=buyer_alpha001")
    );
    assert.equal(vietnameseResponse.status, 200, `vietnamese route for ${slug}`);
    assert.match(vietnameseResponse.body, /Định vị sản phẩm/);
    assert.match(vietnameseResponse.body, /Giải quyết vấn đề gì/);
    assert.match(vietnameseResponse.body, /CTA cuối/);
  }
});

test("expansion product pages render the locked template in english and vietnamese", async () => {
  for (const slug of expansionProductSlugs) {
    const englishResponse = await renderRoute(
      `/en/product/${slug}`,
      new URLSearchParams("buyer=buyer_alpha001")
    );
    assert.equal(englishResponse.status, 200, `english route for ${slug}`);
    assert.match(englishResponse.body, /Product Positioning/);
    assert.match(englishResponse.body, /What Is Included/);
    assert.match(englishResponse.body, /Version and Updates/);
    assert.match(englishResponse.body, /Final CTA/);

    const vietnameseResponse = await renderRoute(
      `/vi/product/${slug}`,
      new URLSearchParams("buyer=buyer_alpha001")
    );
    assert.equal(vietnameseResponse.status, 200, `vietnamese route for ${slug}`);
    assert.match(vietnameseResponse.body, /Định vị sản phẩm/);
    assert.match(vietnameseResponse.body, /Bao gồm những gì/);
    assert.match(vietnameseResponse.body, /Phiên bản và cập nhật/);
    assert.match(vietnameseResponse.body, /CTA cuối/);
  }
});

test("team bundle product page exposes the team handoff path in both locales", async () => {
  const englishResponse = await renderRoute(
    "/en/product/noos-builder-bundle-for-teams",
    new URLSearchParams("buyer=buyer_team014")
  );
  const vietnameseResponse = await renderRoute(
    "/vi/product/noos-builder-bundle-for-teams",
    new URLSearchParams("buyer=buyer_team014")
  );

  assert.equal(englishResponse.status, 200);
  assert.match(englishResponse.body, /NOOS Builder Bundle for Teams/);
  assert.match(englishResponse.body, /Small Team/);
  assert.match(englishResponse.body, /Open organization inquiry/);
  assert.match(englishResponse.body, /Final CTA/);

  assert.equal(vietnameseResponse.status, 200);
  assert.match(vietnameseResponse.body, /Bundle Builder NOOS cho Nhóm/);
  assert.match(vietnameseResponse.body, /Nhóm nhỏ/);
  assert.match(vietnameseResponse.body, /Mở inquiry cho tổ chức/);
  assert.match(vietnameseResponse.body, /CTA cuối/);
});

test("documents and programs routes render collection-specific copy in both locales", async () => {
  const documentsResponse = await renderRoute(
    "/en/documents",
    new URLSearchParams("buyer=buyer_alpha001&role=builder")
  );
  const programsResponse = await renderRoute(
    "/vi/programs",
    new URLSearchParams("buyer=buyer_alpha001&role=builder")
  );

  assert.equal(documentsResponse.status, 200);
  assert.match(documentsResponse.body, /NOOS Documents/);
  assert.match(documentsResponse.body, /Foundation, architecture, governance, trust, Vietnam/);
  assert.match(documentsResponse.body, /Open buyer library/);

  assert.equal(programsResponse.status, 200);
  assert.match(programsResponse.body, /Chương trình NOOS/);
  assert.match(programsResponse.body, /Grid, Orbit và Bios/);
  assert.match(programsResponse.body, /Mở thư viện người mua/);
});

test("library and checkout-success stay localized and noindexed", async () => {
  const libraryResponse = await renderRoute(
    "/en/library",
    new URLSearchParams("buyer=buyer_alpha001")
  );
  const viLibraryResponse = await renderRoute(
    "/vi/library",
    new URLSearchParams("buyer=buyer_alpha001")
  );
  const successResponse = await renderRoute(
    "/en/checkout-success",
    new URLSearchParams("buyer=buyer_alpha001&product=P11")
  );
  const viSuccessResponse = await renderRoute(
    "/vi/checkout-success",
    new URLSearchParams("buyer=buyer_alpha001&product=P11")
  );

  assert.equal(libraryResponse.status, 200);
  assert.match(libraryResponse.body, /Future Civilization Technology Master Pack/);
  assert.match(libraryResponse.body, /Buyer library/);
  assert.match(libraryResponse.body, /noindex,nofollow/);

  assert.equal(viLibraryResponse.status, 200);
  assert.match(viLibraryResponse.body, /noindex,nofollow/);
  assert.match(viLibraryResponse.body, /\/vi\/library\/updates/);

  assert.equal(successResponse.status, 200);
  assert.match(successResponse.body, /Checkout success/);
  assert.match(successResponse.body, /Open library/);
  assert.match(successResponse.body, /P12/);
  assert.match(successResponse.body, /noindex,nofollow/);

  assert.equal(viSuccessResponse.status, 200);
  assert.match(viSuccessResponse.body, /Thanh toán thành công/);
  assert.match(viSuccessResponse.body, /\/vi\/library\?buyer=buyer_alpha001/);
  assert.match(viSuccessResponse.body, /noindex,nofollow/);
});

test("library detail, updates, licenses, and account routes keep buyer surfaces aligned", async () => {
  const productResponse = await renderRoute(
    "/en/library/product/future-civilization-technology-master-pack",
    new URLSearchParams("buyer=buyer_alpha001")
  );
  const viProductResponse = await renderRoute(
    "/vi/library/product/vietnam-sovereign-resilience-profile-pack",
    new URLSearchParams("buyer=buyer_vnfield021")
  );
  const updatesResponse = await renderRoute(
    "/en/library/updates",
    new URLSearchParams("buyer=buyer_vnfield021")
  );
  const licensesResponse = await renderRoute(
    "/en/library/licenses",
    new URLSearchParams("buyer=buyer_team014")
  );
  const accountResponse = await renderRoute(
    "/vi/library/account",
    new URLSearchParams("buyer=buyer_alpha001")
  );

  assert.equal(productResponse.status, 200);
  assert.match(productResponse.body, /Future Civilization Technology Master Pack/);
  assert.match(productResponse.body, /Current version/);
  assert.match(productResponse.body, /Upgrade options/);
  assert.match(productResponse.body, /noindex,nofollow/);

  assert.equal(viProductResponse.status, 200);
  assert.match(viProductResponse.body, /Chi tiết sản phẩm trong thư viện/);
  assert.match(viProductResponse.body, /Gói Hồ sơ Chủ quyền và Chống chịu Việt Nam/);
  assert.match(viProductResponse.body, /Phiên bản hiện tại/);
  assert.match(viProductResponse.body, /Tùy chọn nâng cấp/);
  assert.match(viProductResponse.body, /noindex,nofollow/);

  assert.equal(updatesResponse.status, 200);
  assert.match(updatesResponse.body, /Update eligibility stays attached to the same library truth/);
  assert.match(updatesResponse.body, /Vietnam Sovereign Resilience Profile Pack/);
  assert.match(updatesResponse.body, /update available/i);
  assert.match(updatesResponse.body, /Open product/);
  assert.match(updatesResponse.body, /noindex,nofollow/);

  assert.equal(licensesResponse.status, 200);
  assert.match(licensesResponse.body, /Library licenses/);
  assert.match(licensesResponse.body, /NOOS Builder Bundle for Teams/);
  assert.match(licensesResponse.body, /Small Team boundary reached/);
  assert.match(licensesResponse.body, /Open organization inquiry/);
  assert.match(licensesResponse.body, /noindex,nofollow/);

  assert.equal(accountResponse.status, 200);
  assert.match(accountResponse.body, /Tài khoản người mua/);
  assert.match(accountResponse.body, /Hàng đợi hỗ trợ/);
  assert.match(accountResponse.body, /\/vi\/library\/account/);
  assert.match(accountResponse.body, /noindex,nofollow/);
});

test("vietnamese license route renders localized pricing and upgrade windows", async () => {
  const response = await renderRoute("/vi/licenses", new URLSearchParams());

  assert.equal(response.status, 200);
  assert.match(response.body, /Giấy phép và đường nâng cấp/);
  assert.match(response.body, /Cá nhân/);
  assert.match(response.body, /Khởi đầu/);
});

test("vietnamese operations route exposes launch readiness, KPI thresholds, and support contract", async () => {
  const response = await renderRoute("/vi/operations", new URLSearchParams());

  assert.equal(response.status, 200);
  assert.match(response.body, /Kỷ luật launch và hỗ trợ của NOOS sống ở đây/);
  assert.match(response.body, /94%/);
  assert.match(response.body, /6%/);
  assert.match(response.body, /Đợt 1/);
  assert.match(response.body, /Vận hành hậu-NFT gate cho ops và growth/);
  assert.match(response.body, /Readiness NFT phải hoàn tất trước/);
  assert.match(response.body, /Tỷ lệ chuyển đổi theo sản phẩm/);
  assert.match(response.body, /Mua hàng và truy cập/);
  assert.match(response.body, /Ops truth và ma trận owner\/escalation/);
  assert.match(response.body, /Partner handoff với vc\.vetuonglai\.com/);
  assert.match(response.body, /STEP_UP_REQUIRED/);
  assert.match(response.body, /Yêu cầu mở nhầm tài sản/);
  assert.match(response.body, /Deny mismatch/);
  assert.match(response.body, /requested_asset_id/);
  assert.match(response.body, /\/vi\/operations\/trace-map\.json/);
  assert.match(response.body, /Chào \[buyer_name\]/);
  assert.match(response.body, /Macro thông báo cập nhật/);
  assert.match(response.body, /Rollback communication/);
  assert.match(response.body, /Cổng mở launch/);
});

test("operations trace map json exposes machine-readable wrong-asset and deny-mismatch mapping", async () => {
  const viResponse = await renderRoute("/vi/operations/trace-map.json", new URLSearchParams());
  const enResponse = await renderRoute("/en/operations/trace-map.json", new URLSearchParams());

  assert.equal(viResponse.status, 200);
  assert.match(viResponse.contentType, /application\/json/);
  assert.match(viResponse.headers?.["x-robots-tag"] ?? "", /noindex,nofollow/);

  const viPayload = JSON.parse(viResponse.body);
  assert.equal(viPayload.locale, "vi");
  assert.equal(viPayload.laneState, "GO");
  assert.match(viPayload.packetStatus, /READY_FOR_TEAM1_REVIEW/);
  assert.ok(Array.isArray(viPayload.traceMappings));
  assert.ok(
    viPayload.traceMappings.some(
      (item) =>
        String(item.scenario).includes("Yêu cầu mở nhầm tài sản") &&
        Array.isArray(item.requiredTraceFields) &&
        item.requiredTraceFields.includes("requested_asset_id")
    )
  );
  assert.ok(viPayload.traceMappings.some((item) => String(item.scenario).includes("Deny mismatch")));

  assert.equal(enResponse.status, 200);
  const enPayload = JSON.parse(enResponse.body);
  assert.equal(enPayload.locale, "en");
  assert.ok(
    enPayload.traceMappings.some(
      (item) =>
        String(item.scenario).includes("Wrong asset opening request") &&
        Array.isArray(item.requiredTraceFields) &&
        item.requiredTraceFields.includes("requested_asset_id")
    )
  );
});

test("legacy investor and fundraising routes redirect into localized NOOS routes with noindex", async () => {
  const legacyDocsResponse = await renderRoute("/docs/investment-programs/", new URLSearchParams());
  const legacyFundraisingResponse = await renderRoute("/fundraising", new URLSearchParams("buyer=buyer_alpha001"));

  assert.equal(legacyDocsResponse.status, 308);
  assert.equal(legacyDocsResponse.headers?.location, "/en/documents");
  assert.match(legacyDocsResponse.headers?.["x-robots-tag"] ?? "", /noindex/);
  assert.match(legacyDocsResponse.body, /Legacy investor routes do not belong inside NOOS/);

  assert.equal(legacyFundraisingResponse.status, 308);
  assert.equal(legacyFundraisingResponse.headers?.location, "/en/products?buyer=buyer_alpha001");
  assert.match(legacyFundraisingResponse.headers?.["x-robots-tag"] ?? "", /nofollow/);
  assert.match(legacyFundraisingResponse.body, /Legacy investor routes do not belong inside NOOS/);
});

test("sitemap and product canonicals expose localized SEO endpoints only", async () => {
  const sitemapResponse = await renderRoute("/sitemap.xml", new URLSearchParams());
  const productResponse = await renderRoute(
    "/en/product/noos-architecture-system-map-pack",
    new URLSearchParams("buyer=buyer_alpha001")
  );

  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.body, /https:\/\/noos\.iai\.one\/en\/products/);
  assert.match(sitemapResponse.body, /https:\/\/noos\.iai\.one\/vi\/products/);
  assert.match(sitemapResponse.body, /xhtml:link/);
  assert.doesNotMatch(sitemapResponse.body, /investment-programs/);
  assert.doesNotMatch(sitemapResponse.body, /fundraising/);

  assert.equal(productResponse.status, 200);
  assert.match(
    productResponse.body,
    /<link rel="canonical" href="https:\/\/noos\.iai\.one\/en\/product\/noos-architecture-system-map-pack"/
  );
  assert.match(
    productResponse.body,
    /<link rel="alternate" hreflang="vi" href="https:\/\/noos\.iai\.one\/vi\/product\/noos-architecture-system-map-pack"/
  );
});
