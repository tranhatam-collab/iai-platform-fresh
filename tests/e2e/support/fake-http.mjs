/**
 * Tiny in-test HTTP servers that stand in for upstream services (AI providers,
 * tenant webhook receivers, ...). They listen on an ephemeral loopback port and
 * record every request so tests can assert on what the service under test sent.
 */
import { createServer } from "node:http";

/**
 * @param {(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse, record: object) => void | Promise<void>} handler
 * @returns {Promise<{ baseUrl: string, port: number, requests: object[], close(): Promise<void> }>}
 */
export async function startFakeServer(handler) {
  const requests = [];
  const sockets = new Set();
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString("utf8");
    let json = null;
    try {
      json = JSON.parse(rawBody);
    } catch {
      // not JSON
    }
    const record = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      rawBody,
      json,
      at: Date.now()
    };
    requests.push(record);
    try {
      await handler(req, res, record);
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      res.end(String(error));
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    port,
    requests,
    async close() {
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
