#!/usr/bin/env node

/**
 * Fix vc.vetuonglai.com Cloudflare Error 1000.
 *
 * Default mode:
 *   DRY-RUN. Prints the intended Cloudflare Pages + DNS changes.
 *
 * Apply mode:
 *   node scripts/fix-vc-vetuonglai-dns.mjs --apply
 *
 * Required env for live API inspection/apply:
 *   CLOUDFLARE_API_TOKEN with Zone:DNS:Edit and Account:Cloudflare Pages:Edit
 *
 * What it does:
 *   1. Ensures vc.vetuonglai.com is attached to the Pages project vetuonglai-vc.
 *   2. Replaces conflicting DNS records for vc.vetuonglai.com with:
 *      CNAME vc.vetuonglai.com -> vetuonglai-vc-7b7.pages.dev
 *   3. Prints a verification checklist.
 */

const ACCOUNT_ID = "62d57eaa548617aeecac766e5a1cb98e";
const ZONE_ID = "34862e35921b6643995f18b38b1808bd";
const ZONE_NAME = "vetuonglai.com";
const HOST = "vc.vetuonglai.com";
const PROJECT_NAME = "vetuonglai-vc";
const PAGES_TARGET = "vetuonglai-vc-7b7.pages.dev";

const shouldApply = process.argv.includes("--apply");
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.log("Missing CLOUDFLARE_API_TOKEN.");
  console.log("Dry-run without Cloudflare inspection:");
  console.log(`  ensure Pages custom domain: ${PROJECT_NAME} -> ${HOST}`);
  console.log(`  replace conflicting ${HOST} DNS records with CNAME vc -> ${PAGES_TARGET} proxied=true`);
  console.log("");
  console.log("To apply: export CLOUDFLARE_API_TOKEN with Zone:DNS:Edit + Account:Cloudflare Pages:Edit, then run with --apply.");
  process.exit(shouldApply ? 1 : 0);
}

async function cf(pathname, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const message = (payload.errors || [])
      .map((error) => `${error.code || "ERR"} ${error.message}`)
      .join("; ");
    throw new Error(message || `Cloudflare API failed: ${pathname}`);
  }
  return payload.result;
}

async function ensurePagesDomain() {
  const domains = await cf(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`);
  const existing = domains.find((domain) => domain.name === HOST);
  if (existing) {
    console.log(`PAGES_DOMAIN_OK ${HOST}`);
    return;
  }
  if (!shouldApply) {
    console.log(`DRY_RUN PAGES_DOMAIN_ATTACH ${HOST}`);
    return;
  }
  await cf(`/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`, {
    method: "POST",
    body: { name: HOST },
  });
  console.log(`PAGES_DOMAIN_ATTACHED ${HOST}`);
}

async function replaceDns() {
  const records = await cf(`/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(HOST)}&per_page=100`);
  for (const record of records) {
    const action = shouldApply ? "DELETE" : "DRY_RUN DELETE";
    console.log(`${action} ${record.type} ${record.name} -> ${record.content}`);
    if (shouldApply) {
      await cf(`/zones/${ZONE_ID}/dns_records/${record.id}`, { method: "DELETE" });
    }
  }

  if (!shouldApply) {
    console.log(`DRY_RUN DNS_CREATE CNAME vc -> ${PAGES_TARGET} proxied=true`);
    return;
  }

  const created = await cf(`/zones/${ZONE_ID}/dns_records`, {
    method: "POST",
    body: {
      type: "CNAME",
      name: "vc",
      content: PAGES_TARGET,
      proxied: true,
      ttl: 1,
      comment: "Fix Error 1000: route vc.vetuonglai.com to Cloudflare Pages project vetuonglai-vc.",
    },
  });
  console.log(`DNS_CREATED ${created.type} ${created.name} -> ${created.content} proxied=${created.proxied}`);
}

async function main() {
  console.log(`${shouldApply ? "Applying" : "Dry-running"} ${HOST} in zone ${ZONE_NAME}`);
  await ensurePagesDomain();
  await replaceDns();
  console.log("");
  console.log("Verify after 1-3 minutes:");
  console.log(`  curl -I https://${HOST}`);
  console.log(`  curl -I https://${PAGES_TARGET}`);
  console.log(`Expected: ${HOST} returns 200/3xx, not Cloudflare Error 1000.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
