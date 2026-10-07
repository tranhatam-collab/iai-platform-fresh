/**
 * Small same-surface crawler for link-integrity tests.
 *
 * Starting from the given paths it follows every <a href> that points at the
 * surface itself - relative links, and absolute links whose host is the surface's
 * own domain (rewritten onto the local test server). Links to other hosts are
 * collected but never fetched.
 */
import { request } from "./harness.mjs";

const HREF = /<a\b[^>]*?\bhref="([^"]*)"/gi;
const ID = /\bid="([^"]+)"/gi;

function decodeEntities(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

export function extractAnchors(html) {
  return [...html.matchAll(HREF)].map((match) => decodeEntities(match[1]));
}

export function extractIds(html) {
  return new Set([...html.matchAll(ID)].map((match) => match[1]));
}

/**
 * @param {string} baseUrl local server base URL
 * @param {string} ownHost the surface's public host (e.g. docs.iai.one)
 * @param {{ start?: string[], maxDepth?: number, maxPages?: number, headers?: Record<string,string> }} options
 */
export async function crawlSurface(baseUrl, ownHost, { start = ["/"], maxDepth = 2, maxPages = 60, headers = {} } = {}) {
  const origin = new URL(baseUrl).origin;
  const pages = new Map(); // local path+search -> { status, contentType, depth, from, html }
  const external = new Set();
  const problems = [];
  const queue = start.map((path) => ({ path, depth: 0, from: "(start)" }));

  while (queue.length > 0 && pages.size < maxPages) {
    const { path, depth, from } = queue.shift();
    if (pages.has(path)) {
      continue;
    }
    const response = await request(baseUrl, path, { headers });
    const contentType = response.headers.get("content-type") ?? "";
    pages.set(path, { status: response.status, contentType, depth, from, html: response.text });

    if (response.status >= 500) {
      problems.push(`${path} -> ${response.status} (linked from ${from})`);
    } else if (response.status >= 400) {
      problems.push(`${path} -> ${response.status} broken link (linked from ${from})`);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location?.startsWith("/")) {
        queue.push({ path: location, depth, from: path });
      }
      continue;
    }
    if (!contentType.includes("text/html")) {
      continue;
    }

    const ids = extractIds(response.text);
    for (const href of extractAnchors(response.text)) {
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        continue;
      }
      if (href.startsWith("#")) {
        if (href.length > 1 && !ids.has(decodeURIComponent(href.slice(1)))) {
          problems.push(`${path} -> dangling in-page anchor ${href}`);
        }
        continue;
      }
      let resolved;
      try {
        resolved = new URL(href, `https://${ownHost}${path}`);
      } catch {
        problems.push(`${path} -> unparsable href ${JSON.stringify(href)}`);
        continue;
      }
      if (resolved.host !== ownHost) {
        external.add(resolved.href);
        continue;
      }
      const local = `${resolved.pathname}${resolved.search}`;
      if (depth + 1 <= maxDepth) {
        queue.push({ path: local, depth: depth + 1, from: path });
      } else {
        // beyond the crawl depth: still verify it resolves, without following its links
        if (!pages.has(local)) {
          const probe = await request(baseUrl, local, { headers });
          pages.set(local, { status: probe.status, contentType: probe.headers.get("content-type") ?? "", depth: depth + 1, from: path, html: "" });
          if (probe.status >= 400) {
            problems.push(`${local} -> ${probe.status} (linked from ${path})`);
          }
        }
      }
    }
  }

  return { pages, external, problems, origin };
}
