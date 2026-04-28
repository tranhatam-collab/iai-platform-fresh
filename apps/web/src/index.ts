import { createWebServer } from "./server.js";

const bindAddress = process.env.WEB_BIND_ADDRESS ?? "127.0.0.1";
const port = Number(process.env.WEB_PORT ?? "4330");

const server = createWebServer();

server.listen(port, bindAddress, () => {
  // eslint-disable-next-line no-console
  console.log(`[iai-web] listening on http://${bindAddress}:${port}`);
});

const shutdown = () => {
  server.close((error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[iai-web] shutdown failed", error);
      process.exitCode = 1;
      return;
    }

    // eslint-disable-next-line no-console
    console.log("[iai-web] stopped");
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
