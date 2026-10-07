import http from "node:http";

/**
 * Like harness.request(), but with a caller-chosen Host header. fetch() (undici) silently
 * ignores a Host override, so host-based routing has to be driven through node:http.
 */
export function requestWithHost(baseUrl, host, pathname = "/", { method = "GET", headers = {}, body, timeoutMs = 8000 } = {}) {
  const url = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: url.hostname, port: url.port, path: pathname, method, headers: { ...headers, Host: host }, timeout: timeoutMs },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            // not JSON
          }
          resolve({ status: res.statusCode, headers: new Headers(Object.entries(res.headers).map(([k, v]) => [k, String(v)])), text, json });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error(`request to ${pathname} timed out`)));
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}
