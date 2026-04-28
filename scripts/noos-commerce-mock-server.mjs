import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(workspaceRoot, 'docs', 'noos');
const fixturesRoot = path.join(docsRoot, 'NOOS_COMMERCE_FIXTURES_v0.1');

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const raw = process.argv[i];
  if (!raw.startsWith('--')) continue;
  const [key, value] = raw.slice(2).split('=');
  if (value !== undefined) {
    args.set(key, value);
    continue;
  }
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    i += 1;
  } else {
    args.set(key, 'true');
  }
}

const port = Number(args.get('port') ?? process.env.NOOS_COMMERCE_MOCK_PORT ?? 4311);

function json(content, status = 200, extraHeaders = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,stripe-signature',
      ...extraHeaders
    },
    body: JSON.stringify(content, null, 2)
  };
}

function text(content, status = 200, extraHeaders = {}) {
  return {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,stripe-signature',
      ...extraHeaders
    },
    body: content
  };
}

function send(res, payload) {
  res.writeHead(payload.status, payload.headers);
  res.end(payload.body);
}

async function loadJson(relativePath) {
  const filePath = path.join(fixturesRoot, relativePath);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function loadRootJson(relativePath) {
  const filePath = path.join(docsRoot, relativePath);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function loadRootText(relativePath) {
  const filePath = path.join(docsRoot, relativePath);
  return readFile(filePath, 'utf8');
}

function sanitizeToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'buyer';
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function updateWindowDays(windowLabel) {
  if (windowLabel.includes('12')) return 365;
  if (windowLabel.includes('6-12')) return 270;
  if (windowLabel.includes('6')) return 183;
  if (windowLabel.includes('3')) return 90;
  return 30;
}

const commerceSchemaPack = await loadRootJson('NOOS_COMMERCE_SCHEMA_PACK_v0.1.json');
const pricingLadder = commerceSchemaPack.components.examples.PricingLadderV1.value;
const team3Surface = commerceSchemaPack.components.examples.Team3SurfaceExample.value;
const team4Ops = commerceSchemaPack.components.examples.Team4OpsExample.value;
const fixturesManifest = await loadJson('manifest.json');
const productDefinitionsFixture = await loadJson(path.join('catalog', 'product_definitions_all_v1.json'));
const productMap = new Map(productDefinitionsFixture.products.map((product) => [product.productCode, product]));
const entitlementStore = new Map();
const libraryStore = new Map();
const orderStore = new Map();
const checkoutSessions = new Map();
const processedFulfillmentKeys = new Set();

for (const fixtureName of [
  path.join('entitlements', 'active_ent_master_p11.json'),
  path.join('entitlements', 'expired_updates_only_ent_architecture_p03.json'),
  path.join('entitlements', 'upgraded_ent_master_p11.json'),
  path.join('entitlements', 'active_update_available_vietnam_p07.json')
]) {
  const entitlement = await loadJson(fixtureName);
  entitlementStore.set(entitlement.entitlementId, entitlement);
}

for (const fixtureName of [
  path.join('library', 'library_active_master.json'),
  path.join('library', 'library_expired_updates_architecture.json'),
  path.join('library', 'library_upgraded_master_to_team.json'),
  path.join('library', 'library_update_available_vietnam.json')
]) {
  const libraryView = await loadJson(fixtureName);
  libraryStore.set(libraryView.buyerId, libraryView);
}

function seedOrder(order) {
  orderStore.set(order.orderId, order);
}

seedOrder({
  orderId: 'ord_20260414_master_001',
  buyerId: 'buyer_alpha001',
  productCode: 'P11',
  licenseType: 'Individual',
  amountSnapshotUsd: 399,
  checkoutSessionId: 'cs_test_a1b2c3d4',
  status: 'paid',
  purchasedAt: '2026-04-14T11:02:00Z',
  entitlementIds: ['ent_master_001']
});

seedOrder({
  orderId: 'ord_20251001_architecture_009',
  buyerId: 'buyer_arch009',
  productCode: 'P03',
  licenseType: 'Individual',
  amountSnapshotUsd: 99,
  checkoutSessionId: 'cs_test_architecture_009',
  status: 'paid',
  purchasedAt: '2025-10-01T08:30:00Z',
  entitlementIds: ['ent_architecture_009']
});

seedOrder({
  orderId: 'ord_20260201_master_014',
  buyerId: 'buyer_team014',
  productCode: 'P11',
  licenseType: 'Individual',
  amountSnapshotUsd: 399,
  checkoutSessionId: 'cs_test_master_014',
  status: 'paid',
  purchasedAt: '2026-02-01T09:00:00Z',
  entitlementIds: ['ent_master_014']
});

seedOrder({
  orderId: 'ord_20260220_team_014',
  buyerId: 'buyer_team014',
  productCode: 'P12',
  licenseType: 'Small Team',
  amountSnapshotUsd: 799,
  checkoutSessionId: 'cs_test_team_014',
  status: 'paid',
  purchasedAt: '2026-02-20T10:15:00Z',
  entitlementIds: []
});

seedOrder({
  orderId: 'ord_20260312_vietnam_021',
  buyerId: 'buyer_vnfield021',
  productCode: 'P07',
  licenseType: 'Individual',
  amountSnapshotUsd: 149,
  checkoutSessionId: 'cs_test_vietnam_021',
  status: 'paid',
  purchasedAt: '2026-03-12T07:40:00Z',
  entitlementIds: ['ent_vietnam_021']
});

const recommendationMap = new Map([
  ['P01', { nextProductPrimary: 'P02', ruleRef: 'P01->P02' }],
  ['P02', { nextProductPrimary: 'P03', ruleRef: 'P02->P03' }],
  ['P03', { nextProductPrimary: 'P11', nextProductSecondary: 'P05', ruleRef: 'P03->P11' }],
  ['P04', { nextProductPrimary: 'P11', ruleRef: 'P04->P11' }],
  ['P05', { nextProductPrimary: 'P06', ruleRef: 'P05->P06' }],
  ['P06', { nextProductPrimary: 'P11', ruleRef: 'P06->P11' }],
  ['P07', { nextProductPrimary: 'P08', ruleRef: 'P07->P08' }],
  ['P08', { nextProductPrimary: 'P11', ruleRef: 'P08->P11' }],
  ['P09', { nextProductPrimary: 'P11', ruleRef: 'P09->P11' }],
  ['P10', { nextProductPrimary: 'P11', ruleRef: 'P10->P11' }],
  ['P11', { nextProductPrimary: 'P12', upgradeLicenseOffer: 'Small Team', ruleRef: 'P11->P12' }],
  ['P12', { nextProductPrimary: 'Organization Inquiry', upgradeLicenseOffer: 'Organization', ruleRef: 'P12->Organization' }]
]);

function buildCatalog() {
  return {
    version: productDefinitionsFixture.version,
    products: productDefinitionsFixture.products.map((product) => ({
      productCode: product.productCode,
      name: product.name,
      route: product.route,
      tier: product.tier,
      priceUsd: product.priceUsd,
      defaultLicense: product.defaultLicense,
      primaryUpsell: recommendationMap.get(product.productCode)?.nextProductPrimary ?? product.secondaryUpsell
    }))
  };
}

function deriveBuyerId(email) {
  return `buyer_${sanitizeToken(email.split('@')[0])}`;
}

function buildEntitlementFromPurchase({ buyerId, productCode, orderId, licenseType, purchasedAt }) {
  const product = productMap.get(productCode);
  const entitlementId = `ent_${sanitizeToken(productCode)}_${sanitizeToken(buyerId)}_${Date.now().toString(36)}`;
  return {
    entitlementId,
    buyerId,
    productCode,
    licenseType,
    orderId,
    grantedAt: purchasedAt,
    accessStatus: 'active',
    updateWindowEnd: addDays(purchasedAt, updateWindowDays(product.updatePolicy.windowLabel)),
    entitlementCode: product.entitlementCode,
    versionScope: productCode === 'P11' ? 'full_bundle_window' : product.updatePolicy.updateTypes.includes('selected') ? 'current_plus_selected_updates' : 'current_plus_minor_updates'
  };
}

function buildLibraryItemFromEntitlement(entitlement) {
  const product = productMap.get(entitlement.productCode);
  return {
    productCode: product.productCode,
    name: product.name,
    currentVersion: '1.0',
    purchasedDate: entitlement.grantedAt,
    licenseType: entitlement.licenseType,
    updateStatus: entitlement.accessStatus === 'upgraded' ? 'upgraded' : 'current',
    actions: entitlement.accessStatus === 'upgraded' ? ['view', 'updates'] : ['view', 'download', 'updates']
  };
}

function computeRecommendation(purchasedProducts, sourceSurface) {
  const owned = new Set(purchasedProducts);
  const lastProductCode = purchasedProducts[purchasedProducts.length - 1];
  const recommendation = recommendationMap.get(lastProductCode) ?? { nextProductPrimary: 'P11', ruleRef: 'default->P11' };
  const result = { ...recommendation };
  if (owned.has(result.nextProductPrimary)) {
    delete result.nextProductPrimary;
  }
  if (result.nextProductSecondary && owned.has(result.nextProductSecondary)) {
    delete result.nextProductSecondary;
  }
  if (!result.nextProductPrimary) {
    result.nextProductPrimary = 'Organization Inquiry';
    result.ruleRef = `${sourceSurface}->fallback`;
  }
  return result;
}

function updateLibraryFromEntitlement(entitlement) {
  const existing = libraryStore.get(entitlement.buyerId) ?? {
    buyerId: entitlement.buyerId,
    items: [],
    recommendations: {},
    routeSet: [
      '/library',
      '/library/updates',
      '/library/licenses',
      '/library/account'
    ]
  };
  const nextItems = existing.items.filter((item) => item.productCode !== entitlement.productCode);
  nextItems.push(buildLibraryItemFromEntitlement(entitlement));
  nextItems.sort((a, b) => a.productCode.localeCompare(b.productCode));
  existing.items = nextItems;
  existing.recommendations = computeRecommendation(nextItems.map((item) => item.productCode), 'library-home');
  existing.routeSet = Array.from(new Set([
    '/library',
    ...nextItems.map((item) => `/library/product/${productMap.get(item.productCode).route.split('/').at(-1)}`),
    '/library/updates',
    '/library/licenses',
    '/library/account'
  ]));
  libraryStore.set(entitlement.buyerId, existing);
}

async function readBody(req) {
  let buffer = '';
  for await (const chunk of req) {
    buffer += chunk;
  }
  return buffer ? JSON.parse(buffer) : {};
}

function routeNotFound(targetPath) {
  return json({
    code: 'not_found',
    message: `No mock route for ${targetPath}`
  }, 404);
}

const openApiYaml = await loadRootText('NOOS_COMMERCE_OPENAPI_RENDERED.yaml');

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      send(res, routeNotFound('unknown'));
      return;
    }

    if (req.method === 'OPTIONS') {
      send(res, text('', 204));
      return;
    }

    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/health') {
      send(res, json({
        status: 'ok',
        service: 'noos-commerce-mock-server',
        port
      }));
      return;
    }

    if (req.method === 'GET' && pathname === '/openapi.yaml') {
      send(res, text(openApiYaml, 200, { 'content-type': 'application/yaml; charset=utf-8' }));
      return;
    }

    if (req.method === 'GET' && pathname === '/__mock/fixtures') {
      send(res, json(fixturesManifest));
      return;
    }

    if (req.method === 'GET' && pathname === '/products') {
      send(res, json(buildCatalog()));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/products/')) {
      const productCode = pathname.split('/')[2];
      const product = productMap.get(productCode);
      send(res, product ? json(product) : routeNotFound(pathname));
      return;
    }

    if (req.method === 'GET' && pathname === '/pricing/ladder') {
      send(res, json(pricingLadder));
      return;
    }

    if (req.method === 'POST' && pathname === '/checkout/sessions') {
      const body = await readBody(req);
      const product = productMap.get(body.productCode);
      if (!product) {
        send(res, json({ code: 'invalid_product', message: `Unknown product code ${body.productCode}` }, 400));
        return;
      }
      const checkoutSessionId = `cs_mock_${Date.now().toString(36)}`;
      checkoutSessions.set(checkoutSessionId, body);
      send(res, json({
        checkoutSessionId,
        productCode: body.productCode,
        licenseType: body.licenseType,
        redirectUrl: `https://checkout.stripe.mock/session/${checkoutSessionId}`,
        fulfillmentStatus: 'pending'
      }, 201));
      return;
    }

    if (req.method === 'POST' && pathname === '/webhooks/stripe/checkout-session-completed') {
      const body = await readBody(req);
      const product = productMap.get(body.productCode);
      if (!product) {
        send(res, json({ code: 'invalid_product', message: `Unknown product code ${body.productCode}` }, 400));
        return;
      }

      const replay = processedFulfillmentKeys.has(body.fulfillmentKey);
      processedFulfillmentKeys.add(body.fulfillmentKey);

      const buyerId = deriveBuyerId(body.buyerEmail);
      const orderId = body.orderId || `ord_${Date.now().toString(36)}`;
      const purchasedAt = body.loggedAt || new Date().toISOString();
      const entitlement = buildEntitlementFromPurchase({
        buyerId,
        productCode: body.productCode,
        orderId,
        licenseType: body.licenseType,
        purchasedAt
      });

      if (!replay) {
        entitlementStore.set(entitlement.entitlementId, entitlement);
        updateLibraryFromEntitlement(entitlement);
        orderStore.set(orderId, {
          orderId,
          buyerId,
          productCode: body.productCode,
          licenseType: body.licenseType,
          amountSnapshotUsd: product.priceUsd,
          checkoutSessionId: body.checkoutSessionId,
          status: 'paid',
          purchasedAt,
          entitlementIds: [entitlement.entitlementId]
        });
      }

      send(res, json({
        orderCreated: !replay,
        buyerLinked: true,
        entitlementsGranted: replay ? [] : [product.entitlementCode],
        emailQueued: !replay,
        logWritten: true
      }, 200, replay ? { 'x-noos-idempotent-replay': 'true' } : {}));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/orders/')) {
      const orderId = pathname.split('/')[2];
      const order = orderStore.get(orderId);
      send(res, order ? json(order) : routeNotFound(pathname));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/entitlements/')) {
      const entitlementId = pathname.split('/')[2];
      const entitlement = entitlementStore.get(entitlementId);
      send(res, entitlement ? json(entitlement) : routeNotFound(pathname));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/library/')) {
      const buyerId = pathname.split('/')[2];
      const library = libraryStore.get(buyerId);
      send(res, library ? json(library) : routeNotFound(pathname));
      return;
    }

    if (req.method === 'POST' && pathname === '/recommendations/next-step') {
      const body = await readBody(req);
      send(res, json(computeRecommendation(body.purchasedProducts ?? [], body.sourceSurface ?? 'manual')));
      return;
    }

    if (req.method === 'GET' && pathname === '/surfaces/team3') {
      send(res, json(team3Surface));
      return;
    }

    if (req.method === 'GET' && pathname === '/operations/team4') {
      send(res, json(team4Ops));
      return;
    }

    send(res, routeNotFound(pathname));
  } catch (error) {
    send(res, json({
      code: 'mock_server_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`NOOS commerce mock server listening on http://127.0.0.1:${port}`);
  console.log('Routes:');
  console.log('  GET  /health');
  console.log('  GET  /openapi.yaml');
  console.log('  GET  /__mock/fixtures');
  console.log('  GET  /products');
  console.log('  GET  /products/:productCode');
  console.log('  GET  /pricing/ladder');
  console.log('  POST /checkout/sessions');
  console.log('  POST /webhooks/stripe/checkout-session-completed');
  console.log('  GET  /orders/:orderId');
  console.log('  GET  /entitlements/:entitlementId');
  console.log('  GET  /library/:buyerId');
  console.log('  POST /recommendations/next-step');
  console.log('  GET  /surfaces/team3');
  console.log('  GET  /operations/team4');
});
