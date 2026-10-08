/**
 * Preloaded into service processes under test (node --import).
 *
 * - Requests to loopback addresses go through untouched.
 * - Requests whose origin appears in E2E_FETCH_REWRITES (a JSON object of
 *   `{ "https://api.example.com": "http://127.0.0.1:PORT" }`) are redirected to the
 *   in-test fake server, keeping path, query, headers and body. The original URL is
 *   passed along in the x-e2e-original-url header so the fake can assert on it.
 * - Everything else is refused, so a test can never reach the real internet even if
 *   the service under test is misconfigured. Refusals are logged to stderr with the
 *   marker E2E_NETWORK_GUARD_BLOCKED.
 */
const realFetch = globalThis.fetch;
const rewrites = JSON.parse(process.env.E2E_FETCH_REWRITES || "{}");

function isLoopback(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]" || hostname === "::1";
}

globalThis.fetch = async function guardedFetch(input, init = {}) {
  const requestUrl = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
  const rewriteTarget = rewrites[requestUrl.origin];
  if (rewriteTarget) {
    const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, rewriteTarget);
    const headers = new Headers(init.headers ?? (typeof input === "object" && "headers" in input ? input.headers : undefined));
    headers.set("x-e2e-original-url", requestUrl.toString());
    return await realFetch(target, { ...init, headers });
  }
  if (isLoopback(requestUrl.hostname)) {
    return await realFetch(input, init);
  }
  process.stderr.write(`E2E_NETWORK_GUARD_BLOCKED ${requestUrl.origin}\n`);
  throw new TypeError(`e2e network guard: outbound request to ${requestUrl.origin} is blocked`);
};
