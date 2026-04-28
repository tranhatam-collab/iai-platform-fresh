import { createDashServer } from "./server.js";

const port = parsePort(process.env.DASH_PORT, 4340);
const host = process.env.DASH_HOST ?? "127.0.0.1";

const server = createDashServer();

server.listen(port, host, () => {
  process.stdout.write(`@iai/dash listening on http://${host}:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const port = Number.parseInt(value, 10);
  return Number.isFinite(port) ? port : fallback;
}
