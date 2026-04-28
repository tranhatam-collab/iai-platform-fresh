import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { renderDeveloperHome, renderDeveloperNotFound, renderDeveloperRequiredRoute } from "../dist/render.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const appDir = resolve(__dirname, "..");
const outputDir = resolve(appDir, "public");

const config = {
  apiUrl: "https://api.iai.one",
  appUrl: "https://app.iai.one",
  dashUrl: "https://dash.iai.one",
  docsUrl: "https://docs.iai.one",
  flowApiUrl: "https://api.flow.iai.one",
  flowUrl: "https://flow.iai.one",
  homeUrl: "https://home.iai.one",
  rootUrl: "https://iai.one"
};

const requiredRoutes = [
  "/quickstart",
  "/auth",
  "/api/reference",
  "/webhooks",
  "/sdk",
  "/nodes",
  "/changelog"
];

rmSync(outputDir, { force: true, recursive: true });
mkdirSync(outputDir, { recursive: true });

writeRouteHtml("/", renderDeveloperHome(config, "vi"));
for (const route of requiredRoutes) {
  writeRouteHtml(route, renderDeveloperRequiredRoute(config, "vi", route));
}
writeFileSync(resolve(outputDir, "404.html"), renderDeveloperNotFound("vi", "/404"), "utf8");

writeFileSync(
  resolve(outputDir, "_headers"),
  ["/", "  Cache-Control: no-store", "", "/health", "  Cache-Control: no-store", ""].join("\n"),
  "utf8"
);

writeFileSync(
  resolve(outputDir, "_redirects"),
  [
    "/quickstart /quickstart/ 301",
    "/auth /auth/ 301",
    "/api/reference /api/reference/ 301",
    "/webhooks /webhooks/ 301",
    "/sdk /sdk/ 301",
    "/nodes /nodes/ 301",
    "/changelog /changelog/ 301",
    ""
  ].join("\n"),
  "utf8"
);

process.stdout.write(`${outputDir}\n`);

function writeRouteHtml(route, html) {
  const targetDir =
    route === "/" ? outputDir : resolve(outputDir, route.replace(/^\//, ""));
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(resolve(targetDir, "index.html"), html, "utf8");
}
