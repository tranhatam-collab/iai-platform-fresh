import { mkdirSync, writeFileSync } from "node:fs";
import { createDeveloperServer } from "../apps/developer/dist/server.js";

const dateTag = "2026-04-21";
const outputDir = "docs/release-evidence/developer.iai.one/artifacts";
const markdownPath = `${outputDir}/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_${dateTag}.md`;
const jsonPath = `${outputDir}/DEVELOPER_IAI_ONE_LOCAL_ROUTE_PROOF_${dateTag}.json`;

const routes = [
  "/",
  "/health",
  "/quickstart",
  "/auth",
  "/api/reference",
  "/webhooks",
  "/sdk",
  "/nodes",
  "/changelog"
];

const server = createDeveloperServer();
await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
if (!address || typeof address === "string") {
  server.close();
  throw new Error("Unable to resolve local developer server address.");
}

const baseUrl = `http://127.0.0.1:${address.port}`;
const generatedAt = new Date().toISOString();
const checks = [];

try {
  for (const route of routes) {
    checks.push(await checkRoute(baseUrl, route));
  }

  const englishCheck = await checkRoute(baseUrl, "/auth?lang=en");
  checks.push({ ...englishCheck, route: "/auth?lang=en" });
} finally {
  await new Promise((resolve) => {
    server.close(resolve);
  });
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify({ baseUrl, checks, generatedAt }, null, 2)}\n`, "utf8");
writeFileSync(markdownPath, renderMarkdown(baseUrl, generatedAt, checks), "utf8");

process.stdout.write(`${markdownPath}\n`);
process.stdout.write(`${jsonPath}\n`);

async function checkRoute(baseUrlValue, route) {
  const url = new URL(route, baseUrlValue);
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  const contentLanguage = response.headers.get("content-language") ?? "";
  let canonical = "";
  let marker = "";
  let service = "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();
    service = payload?.data?.service ?? "";
    marker = payload?.ok === true ? "ok=true" : "ok=false";
  } else {
    const html = await response.text();
    canonical = extractCanonical(html);
    marker = extractMarker(html);
  }

  return {
    canonical,
    contentLanguage,
    marker,
    route,
    service,
    status: response.status
  };
}

function extractCanonical(html) {
  const match = html.match(/<link rel="canonical" href="([^"]+)" \/>/);
  return match?.[1] ?? "";
}

function extractMarker(html) {
  const stripped = html
    .replaceAll(/\s+/g, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .trim();
  return stripped.slice(0, 120);
}

function renderMarkdown(baseUrlValue, generatedAtValue, checksValue) {
  const lines = [];
  lines.push(`# Developer Local Route Proof ${dateTag}`);
  lines.push("");
  lines.push(`- Generated at: \`${generatedAtValue}\``);
  lines.push(`- Base URL: \`${baseUrlValue}\``);
  lines.push("");
  lines.push("| Route | Status | Content-Language | Canonical / Service | Marker |");
  lines.push("|---|---:|---|---|---|");

  for (const check of checksValue) {
    const canonicalOrService = check.canonical || check.service || "-";
    lines.push(
      `| \`${check.route}\` | \`${check.status}\` | \`${check.contentLanguage}\` | \`${escapeCell(
        canonicalOrService
      )}\` | \`${escapeCell(check.marker || "-")}\` |`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}
