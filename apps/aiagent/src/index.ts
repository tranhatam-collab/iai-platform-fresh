import { createAiagentServer } from "./server.js";

const port = parsePort(process.env.AIAGENT_PORT, 4393);
const host = process.env.AIAGENT_HOST ?? "127.0.0.1";

const server = createAiagentServer();

server.listen(port, host, () => {
  process.stdout.write(`@iai/aiagent listening on http://${host}:${port}\n`);
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
