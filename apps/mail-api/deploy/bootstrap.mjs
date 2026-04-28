// bootstrap.mjs — Path B production runtime
//
// Boots the @iai/mail-api server (library-style entry) with:
//   - file-backed inbound webhook evidence sink (/var/lib/iai-mail-api/)
//   - listens on PATH_B_PORT (default 3001) bound to 0.0.0.0 inside container
//   - reads MAIL_API_WEBHOOK_SECRET at request time (rotation-friendly)
//
// Side-by-side deploy: legacy iai-mail-api keeps serving /emails et al on :3000
// This new container only exposes the new TS-backed routes (incl. Path B).

import { mkdirSync } from "node:fs";
import {
  createFlowApiServer,
  createFileInboundWebhookEvidenceSink,
} from "./dist/index.js";

const PORT = Number(process.env.PATH_B_PORT || 3001);
const HOST = process.env.PATH_B_BIND || "0.0.0.0";
const EVIDENCE_DIR = process.env.PATH_B_EVIDENCE_DIR || "/var/lib/iai-mail-api";
const EVIDENCE_FILE = `${EVIDENCE_DIR}/inbound-evidence.ndjson`;

mkdirSync(EVIDENCE_DIR, { recursive: true });

const evidenceSink = createFileInboundWebhookEvidenceSink(EVIDENCE_FILE);

const server = createFlowApiServer({
  inboundWebhook: {
    evidenceSink,
  },
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: "info",
      msg: "path_b_runtime_ready",
      bind: `${HOST}:${PORT}`,
      evidence_file: EVIDENCE_FILE,
      ts: new Date().toISOString(),
    })
  );
});

// Graceful shutdown so docker stop is clean.
const shutdown = (signal) => {
  console.log(JSON.stringify({ level: "info", msg: "shutdown_received", signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
